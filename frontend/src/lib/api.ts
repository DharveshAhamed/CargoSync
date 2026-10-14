/**
 * CargoSync — API client wrapper
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token and align base URL with hostname
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === '127.0.0.1') {
      config.baseURL = 'http://127.0.0.1:8000/api/v1';
    } else if (host === 'localhost') {
      config.baseURL = 'http://localhost:8000/api/v1';
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isAuthPage = path.includes('/login') || path.includes('/register') || path.includes('/reset-password');
        if (!isAuthPage) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/#access';
        }
      }
    }
    if (!error.response && typeof window !== 'undefined') {
      const host = window.location.hostname;
      const apiUrl = host === '127.0.0.1' ? 'http://127.0.0.1:8000' : 'http://localhost:8000';
      error.message = `Cannot reach the CargoSync API. Confirm the backend is running on ${apiUrl}.`;
    }
    return Promise.reject(error);
  }
);

export default api;
