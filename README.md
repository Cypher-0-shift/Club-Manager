# Club Task Manager

## 1. Project Overview
Club Task Manager is a role-based, domain-driven project management system designed specifically for university clubs and organizations. It provides a secure, hierarchical workspace where different roles (President, VP, Secretary, Lead, and Member) can manage tasks, track progress via Kanban boards, and approve new member signups within their respective domains.

## 2. Tech Stack
- **Frontend**: Next.js 15 (App Router), React, Zustand (State Management), React Query, Tailwind CSS, dnd-kit (Kanban drag-and-drop)
- **Backend**: FastAPI (Python), Supabase (PostgreSQL + GoTrue Authentication)
- **Database**: PostgreSQL (via Supabase)

## 3. Quick Start
To start both the frontend and backend servers locally, you can use the provided batch script on Windows:
```bash
./start.bat
```

Alternatively, run them separately:
**Backend**:
```bash
cd backend
poetry install
uvicorn app.main:app --reload --port 8000
```
**Frontend**:
```bash
cd frontend
pnpm install
pnpm run dev
```

## 4. First Time Setup
To initialize your local environment from scratch:

1. **Run Supabase Migrations**: Execute the SQL files located in `supabase/migrations/` in order (`001`, `002`, `003`) within your Supabase SQL Editor.
2. **Create the President Account**: Open a terminal, navigate to the backend directory, and run the provisioning script:
   ```bash
   cd backend
   python create_president.py
   ```
3. **Login**: Navigate to `http://localhost:3000/login` and sign in with the credentials:
   - Email: `president@test.com`
   - Password: `password123`

## 5. Environment Variables
Both the frontend and backend require specific environment variables to connect to Supabase.
- Backend: See `backend/.env.example`
- Frontend: See `frontend/.env.example`

## 6. Deployment
The application is architected to be easily deployed to modern cloud providers:
- **Frontend (Vercel)**: Connect your repository to Vercel, select the `frontend` root directory, and provide the environment variables defined in `.env.production.example`.
- **Backend (Render)**: Connect your repository to Render using the provided `backend/render.yaml` blueprint. Provide the missing environment variables in the Render dashboard.

## 7. Demo Seed Data
To populate your environment with demo domains, projects, and tasks for testing:
```bash
cd backend
python seed_rbac.py
```

## 8. Role Reference
| Role | Permissions |
| :--- | :--- |
| **President** | Full organizational control. Can edit roles, domains, projects, and org-wide settings. |
| **VP / Secretary** | Administrative access. Can manage users, approve signups, and edit domains/projects. |
| **Lead** | Domain-level control. Can manage projects and tasks within their assigned domain only. |
| **Member** | Contributor access. Can view their tasks and submit proof of work. Restricted to their domain. |
