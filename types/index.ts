export interface User {
  id: number;
  full_name: string;
  email: string;
  role: "ADMIN" | "USER" | string;
  approval_status: "PENDING" | "APPROVED" | "REJECTED" | string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member extends Omit<User, "updated_at"> {
  joined_at: string;
  is_owner: boolean;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  owner: { id: number; full_name: string; email: string };
  _count: { tickets: number; sprints: number; members: number };
}

export interface TicketSummary {
  total: number;
  BACKLOG?: number;
  backlog?: number;
  TODO: number;
  IN_PROGRESS: number;
  IN_REVIEW: number;
  DONE: number;
}

export interface Sprint {
  id: number;
  project_id: number;
  name: string | null;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  _count: { tickets: number };
}

export interface TicketUser {
  id: number;
  full_name: string;
  email: string;
}

export interface Ticket {
  id: number;
  project_id: number;
  sprint_id: number | null;
  title: string;
  description: string | null;
  status: string;
  priority: "HIGHEST" | "HIGH" | "MEDIUM" | "LOW" | "LOWEST" | string;
  estimation: string | null;
  author_id: number;
  assignee_id: number | null;
  position: number;
  created_at: string;
  updated_at: string;
  author: TicketUser;
  assignee: TicketUser | null;
  sprint: { id: number; name: string | null; status: string } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
