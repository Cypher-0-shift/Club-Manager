# Deployment Guide

This guide explains how to deploy the Club Manager application.

## 1. Backend Deployment (Railway)

The backend is a FastAPI application located in the `/backend` directory.

### Steps:
1.  Connect your GitHub repository to [Railway](https://railway.app/).
2.  Add a new service from your GitHub repo.
3.  **IMPORTANT**: In the Service Settings, set the **Root Directory** to `backend`.
4.  Add the following **Variables**:
    - `SUPABASE_URL`: Your Supabase Project URL.
    - `SUPABASE_ANON_KEY`: Your Supabase Anon Key.
    - `SUPABASE_SERVICE_KEY`: Your Supabase Service Role Key (Required for admin tasks).
    - `JWT_SECRET`: A secure random string for JWT.
    - `API_VERSION`: `v1`
    - `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://club-manager-xi-six.vercel.app`).
    - `FRONTEND_ORIGIN`: Same as above.

## 2. Frontend Deployment (Vercel)

The frontend is a Next.js application located in the `/frontend` directory.

### Steps:
1.  Connect your GitHub repository to [Vercel](https://vercel.com/).
2.  Import the project.
3.  **IMPORTANT**: In the Project Settings, set the **Root Directory** to `frontend`.
4.  Vercel should automatically detect Next.js and `pnpm`.
5.  Add the following **Environment Variables**:
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
    - `NEXT_PUBLIC_API_URL`: The public URL of your Railway backend WITHOUT /v1 (e.g., `https://club-manager-production-f4cc.up.railway.app`).
    - `API_URL`: Same as above (required for server-side routes).

## 3. Post-Deployment

### Update CORS
Once your frontend is deployed, you must set the `ALLOWED_ORIGINS` environment variable in Railway to your Vercel URL (e.g., `https://club-manager-xi-six.vercel.app`) so the backend allows requests from it.

### Database Sync
Ensure your Supabase database has all the migrations applied. You can use the SQL Editor in the Supabase dashboard to run the scripts in `supabase/migrations/`.
