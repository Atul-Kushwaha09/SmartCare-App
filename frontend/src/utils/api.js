import axios from 'axios';

// Create an axios instance with a base URL pointing to the backend API.
// The URL can be overridden by setting REACT_APP_API_URL in a .env file.
const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT token (if present) to every request's Authorization header.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
