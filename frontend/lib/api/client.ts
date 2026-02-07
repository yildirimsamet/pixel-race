import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: number };

      if (!originalRequest) {
        throw new ApiError('Request configuration is missing', error.response?.status);
      }

      const shouldRetry = (
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        (error.response?.status && error.response.status >= 500)
      ) && (originalRequest._retry || 0) < MAX_RETRIES;

      if (shouldRetry) {
        originalRequest._retry = (originalRequest._retry || 0) + 1;
        await sleep(RETRY_DELAY * originalRequest._retry);
        return client(originalRequest);
      }

      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }

      const errorMessage = (error.response?.data as { detail?: string })?.detail || error.message;
      throw new ApiError(errorMessage, error.response?.status, error.response?.data);
    }
  );

  return client;
};

export const apiClient = createApiClient();
