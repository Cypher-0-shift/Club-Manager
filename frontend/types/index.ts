// Shared TypeScript interfaces for Club Task Manager

export type UserRole = 'president' | 'vp' | 'secretary' | 'lead' | 'member';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type SubmissionType = 'file' | 'url' | 'text';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  domain_id: string | null;
  is_approved: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Domain {
  id: string;
  name: string;
  description: string | null;
  color_hex: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  domain_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  domain?: Domain;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  is_overdue: boolean;
  is_pinned: boolean;
  project_id: string;
  assignee_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: Project;
  assignee?: User;
  creator?: User;
  submission_count?: number;
  message_count?: number;
}

export interface Submission {
  id: string;
  task_id: string;
  submitted_by: string;
  type: SubmissionType;
  file_url: string | null;
  url: string | null;
  text_content: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  submitter?: User;
}

export interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: User;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: User;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    status: number;
    trace_id: string;
  };
}

// Role hierarchy helpers
export const EXEC_ROLES: UserRole[] = ['president', 'vp', 'secretary'];
export const LEAD_AND_ABOVE: UserRole[] = ['president', 'vp', 'secretary', 'lead'];

export function canManageDomain(role: UserRole): boolean {
  return EXEC_ROLES.includes(role);
}

export function canCreateTasks(role: UserRole): boolean {
  return LEAD_AND_ABOVE.includes(role);
}

export function canApproveUsers(role: UserRole): boolean {
  return EXEC_ROLES.includes(role);
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  completed:   'Completed',
  overdue:     'Overdue',
};
