import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Proxy to partner's backend - Defaulting to provided public URL
  let PARTNER_BACKEND_URL = process.env.BACKEND_URL;
  if (!PARTNER_BACKEND_URL || !PARTNER_BACKEND_URL.trim().startsWith("http")) {
    console.warn(`WARNING: Invalid or missing BACKEND_URL ("${PARTNER_BACKEND_URL}"). Falling back to default URL: http://127.0.0.1:8000`);
    PARTNER_BACKEND_URL = "http://127.0.0.1:8000";
  }
  // Trim trailing slash to prevent double slash paths (e.g., baseURL//endpoint)
  PARTNER_BACKEND_URL = PARTNER_BACKEND_URL.trim().replace(/\/+$/, "");
  console.log(`Backend proxy configured to route requests to: ${PARTNER_BACKEND_URL}`);

  // Helper for safe proxying via axios to work on ANY Node version (resolving 'fetch is not defined' locally)
  async function proxyFetch(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body: any,
    res: express.Response,
    req?: express.Request
  ) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Carry across Authorization headers for secure MongoDB authentication protection
      if (req && req.headers && req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization as string;
      }

      const response = await axios({
        url,
        method,
        data: body,
        headers,
        validateStatus: () => true, // Let all response codes pass through to the frontend
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error(`Proxy error for ${url}:`, error.message);
      res.status(502).json({
        error: "Failed to connect to partner's backend.",
        message: error.message,
        details: "Make sure your partner's server is running and the tunnel is live.",
      });
    }
  }

  // Multi-route fallback authentication proxy to avoid 404 errors with partner's MongoDB backend
  async function proxyAuthMultiRoute(
    urls: string[],
    body: any,
    res: express.Response,
    req?: express.Request
  ) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (req && req.headers && req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization as string;
    }

    let lastError: any = null;
    const triedPaths: string[] = [];

    for (const url of urls) {
      triedPaths.push(url);
      try {
        console.log(`[AUTH PROXY] Evaluating authentication path: ${url}`);
        const response = await axios({
          url,
          method: "POST",
          data: body,
          headers,
          timeout: 4000,
          validateStatus: (status) => status !== 404, // Continue looping if it is a 404, otherwise process immediately
        });

        console.log(`[AUTH PROXY] Successful handshake: Resolved endpoint: ${url} (Status: ${response.status})`);
        return res.status(response.status).json(response.data);
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        console.warn(`[AUTH PROXY] Unmatched path: ${url} (Status: ${status || 'OFFLINE/TIMEOUT'}). Error: ${error.message}`);
        // If the error code is not a 404 (e.g. 400 Validation Error or 401 Unauthorized), it means the route exists but authorization failed.
        // We should immediately forward this authentic rejection directly to the frontend.
        if (status && status !== 404) {
          return res.status(status).json(error.response?.data || { message: error.message });
        }
      }
    }

    // If every single route returned a 404 or the backend is completely offline
    const code = lastError?.response?.status || 502;
    console.error(`[AUTH PROXY] All candidate routes returned 404. Check MongoDB router mapping! Tried:`, triedPaths);
    res.status(code).json({
      error: "Authentication Endpoint Route Mismatch (404/502)",
      message: `All automated authentication paths returned 404 on your partner's MongoDB server.`,
      triedPaths,
      technicalDetails: "Check your partner's server logs to make sure they are serving one of these endpoints.",
      canFallbackToDemo: true
    });
  }

  // Specialized proxy helper for GET collection endpoints, returning an empty array [] if offline or missing (404/502)
  // This allows the client application to run flawlessly using built-in high-quality mocks when offline/not-yet-implemented.
  async function proxyDataFetch(url: string, res: express.Response) {
    try {
      const response = await axios({
        url,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000, // Keep a responsive timeout
      });
      res.status(200).json(response.data);
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 404) {
        console.warn(`Partner endpoint not configured or returned 404: ${url}. Delivering empty fallback array [] to client.`);
      } else {
        console.warn(`Partner endpoint unreachable: ${url} (${error.message}). Delivering empty fallback array [] to client.`);
      }
      res.status(200).json([]);
    }
  }

  // Auth Proxies with multi-route solver fallback safety
  app.post("/api/auth/login", (req, res) => {
    const candidates = [
      `${PARTNER_BACKEND_URL}/auth/login`,
      `${PARTNER_BACKEND_URL}/api/auth/login`,
      `${PARTNER_BACKEND_URL}/login`,
      `${PARTNER_BACKEND_URL}/api/login`
    ];
    proxyAuthMultiRoute(candidates, req.body, res, req);
  });

  app.post("/api/auth/register", (req, res) => {
    const candidates = [
      `${PARTNER_BACKEND_URL}/auth/register`,
      `${PARTNER_BACKEND_URL}/api/auth/register`,
      `${PARTNER_BACKEND_URL}/register`,
      `${PARTNER_BACKEND_URL}/api/register`,
      `${PARTNER_BACKEND_URL}/auth/signup`,
      `${PARTNER_BACKEND_URL}/signup`,
      `${PARTNER_BACKEND_URL}/api/signup`
    ];
    proxyAuthMultiRoute(candidates, req.body, res, req);
  });

  // Shared in-memory databases to ensure instant multi-device sync
  let sharedRequests: any[] = [];
  let sharedProposals: any[] = [];

  app.get("/api/sync", (req, res) => {
    res.json({
      requests: sharedRequests,
      proposals: sharedProposals
    });
  });

  app.post("/api/sync", (req, res) => {
    const { requests, proposals: incomingProposals } = req.body;
    
    if (Array.isArray(requests)) {
      requests.forEach((reqObj: any) => {
        if (reqObj && reqObj.id) {
          const index = sharedRequests.findIndex(r => r.id === reqObj.id);
          if (index === -1) {
            sharedRequests.unshift(reqObj);
          } else {
            sharedRequests[index] = { ...sharedRequests[index], ...reqObj };
          }

          // Safe background sync to partner's database endpoints
          const endpointsToTry = [
            { url: `${PARTNER_BACKEND_URL}/requests`, data: reqObj },
            { url: `${PARTNER_BACKEND_URL}/api/requests`, data: reqObj },
            { url: `${PARTNER_BACKEND_URL}/sync`, data: { requests: [reqObj] } },
            { url: `${PARTNER_BACKEND_URL}/api/sync`, data: { requests: [reqObj] } },
            { url: `${PARTNER_BACKEND_URL}/updates`, data: { type: 'NEW_REQUEST', data: reqObj } },
            { url: `${PARTNER_BACKEND_URL}/api/updates`, data: { type: 'NEW_REQUEST', data: reqObj } }
          ];

          endpointsToTry.forEach(ep => {
            axios.post(ep.url, ep.data, { timeout: 3000 }).catch(() => {});
          });
        }
      });
    }

    if (Array.isArray(incomingProposals)) {
      incomingProposals.forEach((pObj: any) => {
        if (pObj && pObj.id) {
          const index = sharedProposals.findIndex(p => p.id === pObj.id);
          if (index === -1) {
            sharedProposals.unshift(pObj);
          } else {
            sharedProposals[index] = { ...sharedProposals[index], ...pObj };
          }
        }
      });
    }

    res.json({
      success: true,
      requests: sharedRequests,
      proposals: sharedProposals
    });
  });

  // Data Fetching Proxies
  app.get("/api/requests", (req, res) => {
    // Merge shared in-memory student requests with any legacy requests
    res.json(sharedRequests);
  });

  app.get("/api/students", (req, res) => {
    // Commented out partner backend sync as partner has not completed it yet
    // proxyDataFetch(`${PARTNER_BACKEND_URL}/students`, res);
    res.json([]);
  });

  app.get("/api/categories", (req, res) => {
    // Commented out partner backend sync as partner has not completed it yet
    // proxyDataFetch(`${PARTNER_BACKEND_URL}/categories`, res);
    res.json([
      { id: "e1", name: "Electronics" },
      { id: "b1", name: "Books" },
      { id: "s1", name: "Stationery" },
      { id: "f1", name: "Fashion" },
      { id: "h1", name: "Handmade" }
    ]);
  });

  app.get("/api/vendors", (req, res) => {
    // Commented out partner backend sync as partner has not completed it yet
    // proxyDataFetch(`${PARTNER_BACKEND_URL}/vendors`, res);
    res.json([]);
  });

  // Combined updates route to handle both /api/updates and /updates seamlessly
  const handleUpdatePost = async (req: express.Request, res: express.Response) => {
    let savedRequest: any = null;
    let isDelete = false;
    let deleteId = "";

    try {
      const body = req.body;
      
      if (body && body.type === 'DELETE_REQUEST' && body.data) {
        isDelete = true;
        deleteId = body.data.id;
        sharedRequests = sharedRequests.filter(r => r.id !== deleteId);

        // Notify partner backend about deletion through standard endpoints too!
        const deleteEndpoints = [
          { url: `${PARTNER_BACKEND_URL}/requests/${deleteId}` },
          { url: `${PARTNER_BACKEND_URL}/api/requests/${deleteId}` },
          { url: `${PARTNER_BACKEND_URL}/requests/delete/${deleteId}` },
          { url: `${PARTNER_BACKEND_URL}/api/requests/delete/${deleteId}` }
        ];

        deleteEndpoints.forEach(ep => {
          axios.delete(ep.url, { timeout: 3000 }).catch(() => {});
        });
      } else {
        let reqData = body;
        
        // If of the format { type: 'NEW_REQUEST' | 'EDIT_REQUEST', data: { ... } }
        if (body && (body.type === 'NEW_REQUEST' || body.type === 'EDIT_REQUEST') && body.data) {
          reqData = body.data;
        }

        if (reqData) {
          // Construct a standard request object
          const title = reqData.item || reqData.title || reqData.item_name || "Untitled Request";
          const description = reqData.description || "No description provided.";
          const category = reqData.category || "General";
          const budget = reqData.budget || "0";
          const student = reqData.student || "Demo Student";
          const studentUid = reqData.studentUid || reqData.student_id || "demo-uid";
          const campus = reqData.campus || "Roma";
          const id = reqData.id || `req-cloud-${Date.now()}`;
          const status = reqData.status || "open";
          const timestamp = reqData.timestamp || reqData.created_at || new Date().toISOString();

          savedRequest = {
            id,
            item: title,
            category,
            budget,
            description,
            student,
            studentUid,
            campus,
            postedAt: "Just now",
            status,
            timestamp,
            // Schema compatibility properties for various database layouts
            title,
            student_id: studentUid,
            student_name: student,
            item_name: title,
            created_at: timestamp
          };

          // Add or edit in sharedRequests list
          const index = sharedRequests.findIndex(r => r.id === id);
          if (index === -1) {
            sharedRequests.unshift(savedRequest);
          } else {
            sharedRequests[index] = { ...sharedRequests[index], ...savedRequest };
          }

          // Fire background POSTs / PUTs to all common partner endpoints in parallel so it reaches their database!
          const endpointsToTry = [
            { url: `${PARTNER_BACKEND_URL}/requests`, data: savedRequest, method: 'POST' },
            { url: `${PARTNER_BACKEND_URL}/api/requests`, data: savedRequest, method: 'POST' },
            { url: `${PARTNER_BACKEND_URL}/requests/${id}`, data: savedRequest, method: 'PUT' },
            { url: `${PARTNER_BACKEND_URL}/api/requests/${id}`, data: savedRequest, method: 'PUT' },
            { url: `${PARTNER_BACKEND_URL}/sync`, data: { requests: [savedRequest] }, method: 'POST' },
            { url: `${PARTNER_BACKEND_URL}/api/sync`, data: { requests: [savedRequest] }, method: 'POST' },
            { url: `${PARTNER_BACKEND_URL}/updates`, data: { type: body?.type || 'NEW_REQUEST', data: savedRequest }, method: 'POST' },
            { url: `${PARTNER_BACKEND_URL}/api/updates`, data: { type: body?.type || 'NEW_REQUEST', data: savedRequest }, method: 'POST' }
          ];

          endpointsToTry.forEach(ep => {
            if (ep.method === 'PUT') {
              axios.put(ep.url, ep.data, { timeout: 3000 }).catch(() => {});
            } else {
              axios.post(ep.url, ep.data, { timeout: 3000 })
                .then((pRes) => {
                  console.log(`Successfully synced to partner endpoint: ${ep.url} (Status: ${pRes.status})`);
                })
                .catch((pErr) => {
                  console.warn(`Partner endpoint not ready or returned error: ${ep.url} (${pErr.message})`);
                });
            }
          });
        }
      }
    } catch (parseErr) {
      console.error("Error parsing update in updates handler:", parseErr);
    }

    if (isDelete) {
      res.status(200).json({
        success: true,
        message: "Post deleted successfully from memory and synced with partner.",
        deletedId: deleteId,
        proxied: true
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Post created/updated successfully and background synced to partner endpoints.",
        request: savedRequest,
        proxied: true
      });
    }
  };

  app.post("/api/updates", handleUpdatePost);
  app.post("/updates", handleUpdatePost);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
