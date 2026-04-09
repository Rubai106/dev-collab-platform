import axios from 'axios';
import { getApiBaseUrl } from '../config/runtime';

// Get the base URL based on environment
const baseURL = getApiBaseUrl();

const api = axios.create({
  baseURL: baseURL.startsWith('http') ? baseURL : undefined,
  ...(baseURL.startsWith('http') ? {} : { baseURL: '/api' }),
  timeout: 30000,
});

// Retry logic for handling cold starts and timeouts
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

api.interceptors.request.use((config) => {
  config.retryCount = config.retryCount || 0;
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry on timeout or 503 (service unavailable) for cold starts
    if (
      config &&
      config.retryCount < MAX_RETRIES &&
      (error.code === 'ECONNABORTED' || error.response?.status >= 503)
    ) {
      config.retryCount += 1;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * config.retryCount));
      return api(config);
    }

    // Handle 401 errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
