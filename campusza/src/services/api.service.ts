import axios, { AxiosInstance } from 'axios';
import { getApiBaseUrl } from '@/utils/environment';

const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for platform JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally (e.g., redirect to login on 401)
    return Promise.reject(error);
  }
);

// Generic response wrapper to match server's ActionRes
export interface ActionRes<T> {
    item: T;
}

export interface ActionReq<T> {
    item: T;
}

export default apiClient;
