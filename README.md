# 🎯 Club Task Manager

**Enterprise-grade task management system for university clubs and organizations**

Club Task Manager is a **transparent, organization-wide** project management system designed for university clubs. It provides a secure, hierarchical workspace where all members can view organization progress while maintaining strict operational controls via Role-Based Access Control (RBAC).

---

## 📋 Features

- **🔐 5-Tier RBAC:** President, VP, Secretary, Lead, and Member roles.
- **🌐 Global Visibility:** Organization-wide transparency by default—everyone can view all domains, projects, and tasks.
- **🛡️ Granular Permissions:** Leads manage only their assigned domains; Members have read-only access to organization workspaces.
- **📊 Kanban Boards:** Drag-and-drop task management with real-time status updates.
- **📁 Proof of Work:** File submission system for task completion with automated validation.
- **📈 Analytics:** Personalized performance dashboards for Members and high-level oversight for Executives.
- **🔔 Notifications:** Real-time updates on task assignments and organizational changes.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand, React Query.
- **Backend:** FastAPI (Python 3.11+), Async/Await, Pydantic, Loguru.
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS) policies.
- **Caching:** Redis-ready (optional) for high-performance permission checks.

---

## 🚀 Deployment Guide

### **Backend (Railway)**
Railway is the recommended platform for the FastAPI backend.

1. **Setup Repository**: Push your code to a GitHub repository.
2. **Create Railway Project**: Connect your GitHub repo to Railway.
3. **Environment Variables**:
   - `SUPABASE_URL`: Your Supabase project URL.
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key.
   - `JWT_SECRET`: Secret for signing tokens.
   - `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`).
4. **Start Command**: Railway auto-detects FastAPI, but you can set:
   `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}`

### **Frontend (Vercel)**
Vercel is the recommended platform for the Next.js frontend.

1. **Deploy to Vercel**: Import your repository into Vercel.
2. **Framework Preset**: Select "Next.js".
3. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Same as backend.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key.
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL (e.g., `https://backend-production.up.railway.app/v1`).
4. **Build Settings**: `npm run build`.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- Supabase Account

### 1. Setup Database
- Run all SQL migrations found in the `/supabase/migrations` folder on your Supabase SQL Editor.

### 2. Setup Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # Fill in your credentials
uvicorn app.main:app --reload --port 8001
```

### 3. Setup Frontend
```bash
cd frontend
pnpm install  # or npm install
cp .env.local.example .env.local  # Fill in your credentials
pnpm dev
```

---

## 📂 Project Structure

- `/backend`: FastAPI source code and API logic.
- `/frontend`: Next.js application and UI components.
- `/supabase`: Database schema and RLS migrations.
- `README.md`: This file.

---

## ⚖️ License
Licensed under the MIT License.
