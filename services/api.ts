import api from "@/lib/api";
import { Project, TicketSummary, User } from "@/types";

export const projectsApi = {
  list: (page = 1, limit = 20) =>
    api.get(`/projects?page=${page}&limit=${limit}`).then((r) => r.data.data),

  getById: (id: number): Promise<Project> =>
    api.get(`/projects/${id}`).then((r) => r.data.data),

  getSummary: (id: number): Promise<{ project: Project; summary: TicketSummary }> =>
    api.get(`/projects/${id}/summary`).then((r) => r.data.data),

  create: (data: { name: string; description?: string }): Promise<Project> =>
    api.post("/projects", data).then((r) => r.data.data),

  update: (id: number, data: { name?: string; description?: string; status?: string }): Promise<Project> =>
    api.patch(`/projects/${id}`, data).then((r) => r.data.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/projects/${id}`).then(() => undefined),
};

export const authApi = {
  forgotPassword: (email: string): Promise<{ resetToken: string }> =>
    api.post("/auth/forgot-password", { email }).then((r) => r.data.data),

  resetPassword: (token: string, password: string): Promise<void> =>
    api.post("/auth/reset-password", { token, password }).then((r) => r.data.data),
};

export const usersApi = {
  list: (): Promise<{ id: number; full_name: string; email: string }[]> =>
    api.get("/users").then((r) => r.data.data),

  updateProfile: (data: { full_name?: string; password?: string }) =>
    api.put("/users/profile", data).then((r) => r.data.data),
};

export const membersApi = {
  list: (projectId: number) =>
    api.get(`/projects/${projectId}/members`).then((r) => r.data.data),

  add: (projectId: number, email: string) =>
    api.post(`/projects/${projectId}/members`, { email }).then((r) => r.data.data),

  remove: (projectId: number, userId: number) =>
    api.delete(`/projects/${projectId}/members/${userId}`).then(() => undefined),
};

export const sprintsApi = {
  listByProject: (projectId: number) =>
    api.get(`/projects/${projectId}/sprints`).then((r) => r.data.data),

  getById: (sprintId: number) =>
    api.get(`/sprints/${sprintId}`).then((r) => r.data.data),

  create: (projectId: number, data: { name?: string; start_date: string; end_date: string }) =>
    api.post(`/projects/${projectId}/sprints`, data).then((r) => r.data.data),

  update: (sprintId: number, data: { name?: string; start_date?: string; end_date?: string; status?: string }) =>
    api.patch(`/sprints/${sprintId}`, data).then((r) => r.data.data),

  delete: (sprintId: number) =>
    api.delete(`/sprints/${sprintId}`).then(() => undefined),

  start: (sprintId: number) =>
    api.post(`/sprints/${sprintId}/start`).then((r) => r.data.data),

  complete: (sprintId: number) =>
    api.post(`/sprints/${sprintId}/complete`).then((r) => r.data.data),
};

export interface TicketFilters {
  status?: string;
  assigneeId?: number;
  sprintId?: number | "null";
  search?: string;
  page?: number;
  limit?: number;
}

export const ticketsApi = {
  listByProject: (projectId: number, filters: TicketFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.assigneeId) params.set("assigneeId", String(filters.assigneeId));
    if (filters.sprintId !== undefined) params.set("sprintId", String(filters.sprintId));
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));
    return api.get(`/projects/${projectId}/tickets?${params}`).then((r) => r.data.data);
  },

  getById: (ticketId: number) =>
    api.get(`/tickets/${ticketId}`).then((r) => r.data.data),

  create: (projectId: number, data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    estimation?: string;
    sprintId?: number | null;
    assigneeId?: number | null;
    authorId?: number | null;
  }) => api.post(`/projects/${projectId}/tickets`, data).then((r) => r.data.data),

  update: (ticketId: number, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    estimation?: string | null;
    assigneeId?: number | null;
    authorId?: number | null;
    sprintId?: number | null;
  }) => api.patch(`/tickets/${ticketId}`, data).then((r) => r.data.data),

  delete: (ticketId: number) =>
    api.delete(`/tickets/${ticketId}`).then(() => undefined),

  move: (ticketId: number, data: { status?: string; position?: number; sprintId?: number | null }) =>
    api.patch(`/tickets/${ticketId}/move`, data).then((r) => r.data.data),

  getDashboard: () =>
    api.get("/tickets/dashboard").then((r) => r.data.data),
};

export interface SearchResults {
  projects: Array<{ id: number; name: string; description: string | null; status: string }>;
  sprints: Array<{ id: number; project_id: number; projectName: string; name: string | null; status: string }>;
  tickets: Array<{
    id: number;
    title: string;
    status: string;
    estimation: string | null;
    project_id: number;
    projectName: string;
    sprint_id: number | null;
    assignee: { id: number; full_name: string; email: string } | null;
  }>;
}

export const searchApi = {
  search: (query: string): Promise<SearchResults> =>
    api.get(`/search?q=${encodeURIComponent(query)}`).then((r) => r.data.data),
};

export const adminApi = {
  listUsers: (filter?: { status?: string; role?: string }): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filter?.status) params.append("status", filter.status);
    if (filter?.role) params.append("role", filter.role);
    const qs = params.toString();
    return api.get(`/admin/users${qs ? `?${qs}` : ""}`).then((r) => r.data.data);
  },

  approveUser: (userId: number): Promise<User> =>
    api.post(`/admin/users/${userId}/approve`).then((r) => r.data.data),

  rejectUser: (userId: number): Promise<User> =>
    api.post(`/admin/users/${userId}/reject`).then((r) => r.data.data),

  changeRole: (userId: number, role: "ADMIN" | "USER"): Promise<User> =>
    api.patch(`/admin/users/${userId}/role`, { role }).then((r) => r.data.data),
};

export interface UploadedFile {
  url: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
}

export const uploadApi = {
  uploadFile: (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data.data);
  },

  uploadMultiple: (files: File[]): Promise<UploadedFile[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return api.post("/uploads/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data.data);
  },

  deleteFile: (filename: string): Promise<void> =>
    api.delete(`/uploads/${filename}`).then(() => undefined),
};
