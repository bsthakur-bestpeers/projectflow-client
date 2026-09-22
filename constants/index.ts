export const APP_NAME = "ProjectFlow";
export const APP_VERSION = "v1.0.0";

export const PROJECT_STATUS = ["ACTIVE", "COMPLETED", "ARCHIVED"] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const SPRINT_STATUS = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type SprintStatus = (typeof SPRINT_STATUS)[number];

export const TICKET_STATUS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;
export type TicketStatus = (typeof TICKET_STATUS)[number];

export const ESTIMATION_OPTIONS = ["1h", "2h", "3h", "1d", "2d", "3d"] as const;
export type EstimationOption = (typeof ESTIMATION_OPTIONS)[number];

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
