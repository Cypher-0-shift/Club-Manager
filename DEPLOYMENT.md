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
    - `NEXT_PUBLIC_API_URL`: The public URL of your Railway backend (e.g., `https://your-backend.up.railway.app/v1`).

## 3. Post-Deployment

### Update CORS
Once your frontend is deployed, you must add its URL (e.g., `https://your-app.vercel.app`) to the `ALLOWED_ORIGINS` environment variable in Railway so the backend allows requests from it.

### Database Sync
Ensure your Supabase database has all the migrations applied. You can use the SQL Editor in the Supabase dashboard to run the scripts in `supabase/migrations/`.
