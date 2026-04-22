import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Intercept requests and attach the Supabase JWT
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (e) {
    // silently fail
  }
  return config;
});

// Normalise error envelope
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    const message =
      err.response?.data?.error?.message ||
      err.response?.data?.detail ||
      err.message ||
      'Unknown error';
    return Promise.reject(new Error(message));
  }
);
