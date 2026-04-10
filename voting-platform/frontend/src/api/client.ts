import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Static demo token used by both web + mobile clients for the interview.
const DEMO_BEARER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXItaWQiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJpYXQiOjE3MDAwMDAwMDB9.demo';

export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    config.headers.set('Authorization', `Bearer ${DEMO_BEARER_TOKEN}`);
    return config;
  },
);
