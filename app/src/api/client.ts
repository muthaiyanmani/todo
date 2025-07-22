import axios from 'axios';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // Tasks
  TASKS: '/tasks',
  TASK_BY_ID: (id: string) => `/tasks/${id}`,
  TASK_SUBTASKS: (id: string) => `/tasks/${id}/subtasks`,
  TASK_SUBTASK_BY_ID: (taskId: string, subtaskId: string) => `/tasks/${taskId}/subtasks/${subtaskId}`,

  // Task Lists
  TASK_LISTS: '/lists',
  TASK_LIST_BY_ID: (id: string) => `/lists/${id}`,
  TASK_LIST_TASKS: (id: string) => `/lists/${id}/tasks`,

  // Sync
  SYNC: '/sync',
  SYNC_STATUS: '/sync/status',
};
