import axios from 'axios';

// Using relative paths to talk to our local Express proxy
// This avoids CORS issues because the browser talks to the same origin
const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
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
export const userApi = {
  getMe: () => api.get('/auth/me'),

  updateMe: (data: any) =>
    api.patch('/auth/me', data),
};

export const dataApi = {
  getMyRequests: () => api.get('/requests/me'),

  getRequests: () => 
    api.get('/requests'),

  createRequest: (data: any) =>
    api.post('/requests', data),

  updateRequest: (requestId: string, data: any) =>
    api.patch(`/requests/${requestId}`, data),

  deleteRequest: (requestId: string) =>
    api.delete(`/requests/${requestId}`),

  getStudents: () => api.get('/students'),

  getCategories: () => api.get('/categories'),

  getVendors: () => api.get('/vendors/'),

  // Proposals
  //getProposals: () => api.get('/proposals'),
  createProposal: (data: any) => api.post('/offers', data),
};

export const updatesApi = {
  pushUpdate: (data: any) => api.post('/updates', data),
};

export default api;
