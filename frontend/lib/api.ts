import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1',
  headers: { 'Content-Type': 'application/json' },
});

// In demo mode, we bypass Supabase and send the mock user ID directly
api.interceptors.request.use(async (config) => {
  try {
    // Zustand persists store as JSON in localStorage['app-storage']
    const stored = localStorage.getItem('app-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.user?.id) {
        config.headers['X-Mock-User'] = parsed.state.user.id;
      }
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Normalise error envelope
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error?.message ||
      err.response?.data?.detail ||
      err.message ||
      'Unknown error';
    return Promise.reject(new Error(message));
  }
);
