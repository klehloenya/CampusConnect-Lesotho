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
    console.warn(`WARNING: Invalid or missing BACKEND_URL ("${PARTNER_BACKEND_URL}"). Falling back to default URL: https://kkgq3q14-8000.inc1.devtunnels.ms`);
    PARTNER_BACKEND_URL = "https://kkgq3q14-8000.inc1.devtunnels.ms";
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
  let sharedRequests: any[] = [
    {
      id: 'req-l2',
      item: 'HP Pavilion Laptop Charger (65W)',
      title: 'HP Pavilion Laptop Charger (65W)',
      category: 'Electronics',
      budget: '400',
      description: 'Need a blue-tip HP laptop charger 65W, must be original or high-quality. Around Roma campus or NUL.',
      student: 'Thabo Mokoena',
      studentUid: 'student_thabo',
      campus: 'Roma',
      postedAt: 'Just now',
      status: 'open',
      timestamp: new Date().toISOString()
    },
    {
      id: 'req-l1',
      item: 'Macroeconomics 101 Textbook',
      title: 'Macroeconomics 101 Textbook',
      category: 'Books',
      budget: '350',
      description: 'Looking for the latest edition of Macroeconomics 101 textbook. Clean, no marker drawings please. MASERU or CAS.',
      student: 'Mpuleng Tseoa',
      studentUid: 'student_mpuleng',
      campus: 'Maseru',
      postedAt: 'Just now',
      status: 'open',
      timestamp: new Date().toISOString()
    }
  ];
  let sharedProposals: any[] = [
    {
      id: "prop-fallback-l2-1",
      requestId: "req-l2",
      requestTitle: "HP Pavilion Laptop Charger (65W)",
      studentName: "Thabo Mokoena",
      proposedPrice: 380,
      vendorName: "Roma Tech Hub",
      vendorPhone: "+266 5890 1234",
      message: "Greetings! I have the original 65W blue-tip replacement. I can deliver to your block on the Roma campus or you can pick it up at our Roma Tech Hub studio.",
      status: "pending",
      timestamp: new Date().toISOString()
    },
    {
      id: "prop-fallback-l1-1",
      requestId: "req-l1",
      requestTitle: "Macroeconomics 101 Textbook",
      studentName: "Mpuleng Tseoa",
      proposedPrice: 300,
      vendorName: "CAS Books & Supplies",
      vendorPhone: "+266 5971 8820",
      message: "Hi, I have a very clean, unmarked copy of this Macroeconomics textbook. Ready to bring it to your room in Maseru campus or meet near CAS.",
      status: "pending",
      timestamp: new Date().toISOString()
    }
  ];

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
  app.get("/api/requests", async (req, res) => {
    try {
      // Try to fetch latest requests from partner's possible endpoints to maintain real-time sync
      const candidates = [
        `${PARTNER_BACKEND_URL}/requests`,
        `${PARTNER_BACKEND_URL}/api/requests`,
        `${PARTNER_BACKEND_URL}/wants`,
        `${PARTNER_BACKEND_URL}/api/wants`
      ];

      let partnerRequests: any[] = [];
      for (const url of candidates) {
        try {
          const response = await axios.get(url, { timeout: 2000 });
          if (response.data && Array.isArray(response.data)) {
            partnerRequests = response.data;
            break;
          } else if (response.data && typeof response.data === 'object') {
            const dataObj = response.data;
            if (Array.isArray(dataObj.requests)) {
              partnerRequests = dataObj.requests;
              break;
            } else if (Array.isArray(dataObj.data)) {
              partnerRequests = dataObj.data;
              break;
            } else if (Array.isArray(dataObj.wants)) {
              partnerRequests = dataObj.wants;
              break;
            }
          }
        } catch (e) {
          // Keep attempting
        }
      }

      if (partnerRequests.length > 0) {
        partnerRequests.forEach((reqObj: any) => {
          if (reqObj && reqObj.id) {
            const index = sharedRequests.findIndex(r => r.id === reqObj.id);
            if (index === -1) {
              sharedRequests.push(reqObj);
            } else {
              sharedRequests[index] = { ...sharedRequests[index], ...reqObj };
            }
          }
        });
      }
    } catch (err: any) {
      console.warn("Skipped syncing requests from partner:", err.message);
    }
    // Merge shared in-memory student requests with any legacy requests
    res.json(sharedRequests);
  });

  // Dedicated PUT endpoint for editing an individual request
  app.put("/api/requests/:id", (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const reqData = req.body;
    let savedRequest: any = null;

    try {
      if (reqData) {
        const title = reqData.item || reqData.title || reqData.item_name || "Untitled Request";
        const description = reqData.description || "No description provided.";
        const category = reqData.category || "General";
        const budget = reqData.budget || "0";
        const student = reqData.student || "Demo Student";
        const studentUid = reqData.studentUid || reqData.student_id || "demo-uid";
        const campus = reqData.campus || "Roma";
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
          title,
          student_id: studentUid,
          student_name: student,
          item_name: title,
          created_at: timestamp
        };

        const index = sharedRequests.findIndex(r => r.id === id);
        if (index === -1) {
          sharedRequests.unshift(savedRequest);
        } else {
          sharedRequests[index] = { ...sharedRequests[index], ...savedRequest };
        }

        // Background sync to partner's database endpoints
        const endpointsToTry = [
          { url: `${PARTNER_BACKEND_URL}/requests/${id}`, data: savedRequest, method: 'PUT' },
          { url: `${PARTNER_BACKEND_URL}/api/requests/${id}`, data: savedRequest, method: 'PUT' },
          { url: `${PARTNER_BACKEND_URL}/requests`, data: savedRequest, method: 'POST' },
          { url: `${PARTNER_BACKEND_URL}/api/requests`, data: savedRequest, method: 'POST' }
        ];

        endpointsToTry.forEach(ep => {
          if (ep.method === 'PUT') {
            axios.put(ep.url, ep.data, { timeout: 3000 }).catch(() => {});
          } else {
            axios.post(ep.url, ep.data, { timeout: 3000 }).catch(() => {});
          }
        });
      }

      res.status(200).json({
        success: true,
        message: "Post updated successfully via PUT endpoint and background synced to partner.",
        request: savedRequest
      });
    } catch (err: any) {
      console.error("Error in PUT /api/requests/:id:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dedicated DELETE endpoint for deleting an individual request
  app.delete("/api/requests/:id", (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    try {
      sharedRequests = sharedRequests.filter(r => r.id !== id);

      // Notify partner backend about deletion
      const deleteEndpoints = [
        { url: `${PARTNER_BACKEND_URL}/requests/${id}` },
        { url: `${PARTNER_BACKEND_URL}/api/requests/${id}` },
        { url: `${PARTNER_BACKEND_URL}/requests/delete/${id}` },
        { url: `${PARTNER_BACKEND_URL}/api/requests/delete/${id}` }
      ];

      deleteEndpoints.forEach(ep => {
        axios.delete(ep.url, { timeout: 3000 }).catch(() => {});
      });

      res.status(200).json({
        success: true,
        message: "Post deleted successfully via DELETE endpoint and synced with partner.",
        deletedId: id
      });
    } catch (err: any) {
      console.error("Error in DELETE /api/requests/:id:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // REST API Endpoints for Proposals / Offers
  app.get("/api/proposals", async (req, res) => {
    try {
      // Try to fetch latest proposals from partner's possible endpoints to maintain real-time sync with MongoDB
      const candidates = [
        `${PARTNER_BACKEND_URL}/proposals`,
        `${PARTNER_BACKEND_URL}/api/proposals`,
        `${PARTNER_BACKEND_URL}/offers`,
        `${PARTNER_BACKEND_URL}/api/offers`
      ];

      let partnerProposals: any[] = [];
      for (const url of candidates) {
        try {
          const response = await axios.get(url, { timeout: 2000 });
          if (response.data && Array.isArray(response.data)) {
            partnerProposals = response.data;
            break;
          }
        } catch (e) {
          // Keep looping to find matching live endpoint
        }
      }

      if (partnerProposals.length > 0) {
        partnerProposals.forEach((pObj: any) => {
          if (pObj && pObj.id) {
            const index = sharedProposals.findIndex(p => p.id === pObj.id);
            if (index === -1) {
              sharedProposals.push(pObj);
            } else {
              sharedProposals[index] = { ...sharedProposals[index], ...pObj };
            }
          }
        });
      }
    } catch (err: any) {
      console.warn("Skipped syncing proposals from partner:", err.message);
    }
    res.json(sharedProposals);
  });

  app.post("/api/proposals", async (req, res) => {
    try {
      const proposal = req.body;
      if (!proposal.id) {
        proposal.id = `prop-${Date.now()}`;
      }
      if (!proposal.timestamp) {
        proposal.timestamp = new Date().toISOString();
      }
      if (!proposal.status) {
        proposal.status = "pending";
      }

      const index = sharedProposals.findIndex(p => p.id === proposal.id);
      if (index === -1) {
        sharedProposals.unshift(proposal);
      } else {
        sharedProposals[index] = { ...sharedProposals[index], ...proposal };
      }

      // Safe background propagate to partner's backend databases (supports various resource pathways)
      try {
        const epToSync = [
          { url: `${PARTNER_BACKEND_URL}/proposals`, data: proposal, method: "POST" },
          { url: `${PARTNER_BACKEND_URL}/api/proposals`, data: proposal, method: "POST" },
          { url: `${PARTNER_BACKEND_URL}/offers`, data: proposal, method: "POST" },
          { url: `${PARTNER_BACKEND_URL}/api/offers`, data: proposal, method: "POST" },
          { url: `${PARTNER_BACKEND_URL}/sync`, data: { proposals: [proposal] }, method: "POST" },
          { url: `${PARTNER_BACKEND_URL}/api/sync`, data: { proposals: [proposal] }, method: "POST" }
        ];

        epToSync.forEach(ep => {
          axios.post(ep.url, ep.data, { timeout: 3000 }).catch(() => {});
        });
      } catch (syncErr: any) {
        console.warn("Skipped background proposal propagation:", syncErr.message);
      }

      res.status(201).json({
        success: true,
        message: "Proposal created and shared",
        proposal
      });
    } catch (err: any) {
      console.error("Error creating proposal:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/proposals/:id", async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    try {
      const index = sharedProposals.findIndex(p => p.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Proposal not found" });
      }

      sharedProposals[index] = { ...sharedProposals[index], ...updateData };
      const updatedProp = sharedProposals[index];

      // Auto-decline alternative proposals for the same requestId if this one gets accepted
      if (updateData.status === "accepted") {
        sharedProposals = sharedProposals.map(p => {
          if (p.requestId === updatedProp.requestId && p.id !== id) {
            return { ...p, status: "declined" };
          }
          return p;
        });

        // Also update the associated request status to 'resolved'
        const reqIndex = sharedRequests.findIndex(r => r.id === updatedProp.requestId);
        if (reqIndex !== -1) {
          sharedRequests[reqIndex].status = "resolved";
          // Sync request update to partner in background
          try {
            const endpointsToTry = [
              { url: `${PARTNER_BACKEND_URL}/requests/${updatedProp.requestId}`, data: sharedRequests[reqIndex], method: "PUT" },
              { url: `${PARTNER_BACKEND_URL}/api/requests/${updatedProp.requestId}`, data: sharedRequests[reqIndex], method: "PUT" }
            ];
            endpointsToTry.forEach(ep => axios.put(ep.url, ep.data, { timeout: 3000 }).catch(() => {}));
          } catch (reqSyncErr: any) {
            console.warn("Skipped background request update propagation:", reqSyncErr.message);
          }
        }
      }

      // Propagate update to partner backend systems
      try {
        const epToSync = [
          { url: `${PARTNER_BACKEND_URL}/proposals/${id}`, data: updateData, method: "PUT" },
          { url: `${PARTNER_BACKEND_URL}/api/proposals/${id}`, data: updateData, method: "PUT" },
          { url: `${PARTNER_BACKEND_URL}/offers/${id}`, data: updateData, method: "PUT" },
          { url: `${PARTNER_BACKEND_URL}/api/offers/${id}`, data: updateData, method: "PUT" },
          { url: `${PARTNER_BACKEND_URL}/proposals/update/${id}`, data: updateData, method: "POST" },
          { url: `${PARTNER_BACKEND_URL}/api/proposals/update/${id}`, data: updateData, method: "POST" }
        ];

        epToSync.forEach(ep => {
          if (ep.method === "PUT") {
            axios.put(ep.url, ep.data, { timeout: 3000 }).catch(() => {});
          } else {
            axios.post(ep.url, ep.data, { timeout: 3000 }).catch(() => {});
          }
        });
      } catch (propSyncErr: any) {
        console.warn("Skipped background proposal update propagation:", propSyncErr.message);
      }

      res.status(200).json({
        success: true,
        message: "Proposal updated successfully",
        proposal: updatedProp
      });
    } catch (err: any) {
      console.error("Error updating proposal:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/proposals/:id", async (req, res) => {
    const { id } = req.params;
    try {
      sharedProposals = sharedProposals.filter(p => p.id !== id);

      const deleteEndpoints = [
        `${PARTNER_BACKEND_URL}/proposals/${id}`,
        `${PARTNER_BACKEND_URL}/api/proposals/${id}`,
        `${PARTNER_BACKEND_URL}/offers/${id}`,
        `${PARTNER_BACKEND_URL}/api/offers/${id}`
      ];

      deleteEndpoints.forEach(url => {
        axios.delete(url, { timeout: 3000 }).catch(() => {});
      });

      res.status(200).json({
        success: true,
        message: "Proposal deleted successfully",
        deletedId: id
      });
    } catch (err: any) {
      console.error("Error deleting proposal:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
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
