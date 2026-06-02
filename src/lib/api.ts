import axios from 'axios';

// Using relative paths to talk to our local Express proxy
// This avoids CORS issues because the browser talks to the same origin
const api = axios.create({
  baseURL: 'https://kkgq3q14-8000.inc1.devtunnels.ms/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT / Token securely into outbound requests
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('campus_connect_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Failed to attach bearer authorization token:', err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
};

export const dataApi = {
  getRequests: () => api.get('/requests'),
  getStudents: () => api.get('/students'),
  getCategories: () => api.get('/categories'),
  getVendors: () => api.get('/vendors'),
  sync: (data?: any) => data ? api.post('/sync', data) : api.get('/sync'),
  editRequest: (id: string, data: any) => api.put(`/requests/${id}`, data),
  deleteRequest: (id: string) => api.delete(`/requests/${id}`),
  getProposals: () => api.get('/proposals'),
  createProposal: (data: any) => api.post('/proposals', data),
  editProposal: (id: string, data: any) => api.put(`/proposals/${id}`, data),
  deleteProposal: (id: string) => api.delete(`/proposals/${id}`),
  createRequest: (data: any) => api.post('/updates', { type: 'NEW_REQUEST', data }),
};

export const updatesApi = {
  pushUpdate: (data: any) => api.post('/updates', data),
  createRequest: (data: any) => api.post('/updates', { type: 'NEW_REQUEST', data }),
};

// Also attach to the default export api instance for maximum defensive compatibility
(api as any).createRequest = (data: any) => api.post('/updates', { type: 'NEW_REQUEST', data });

export default api;
