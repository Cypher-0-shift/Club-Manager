import axios from 'axios';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/v1`,
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
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const { data: { session } } = await supabase.auth.refreshSession();
        if (session?.access_token) {
          err.config.headers.Authorization = `Bearer ${session.access_token}`;
          return api(err.config);
        }
      } catch (e) {
        // fallthrough to login redirect
      }
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
