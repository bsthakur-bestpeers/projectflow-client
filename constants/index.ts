export const APP_NAME = "ProjectFlow";
export const APP_VERSION = "v1.0.0";

export const PROJECT_STATUS = ["ACTIVE", "COMPLETED", "ARCHIVED"] as const;

export const TICKET_STATUS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

export const TICKET_STATUS_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const SPRINT_STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
