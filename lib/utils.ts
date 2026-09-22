import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatDate(date?: string | Date | null): string {
  if (!date) return "N/A";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (typeof window !== "undefined") {
      return new Intl.DateTimeFormat(navigator.language, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
      }).format(d);
    }
    return format(d, "MMM d, yyyy");
  } catch (e) {
    return "Invalid Date";
  }
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function daysLeft(endDate: string): number {
  const end = parseISO(endDate);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getEstimationRemaining(
  createdAt: string | Date | undefined,
  estimation?: string | null,
  sprintEndDate?: string | null,
  status?: string
): { isExpired: boolean; remainingText: string } | null {
  if (status === "DONE") return null;
  const now = Date.now();

  // 1. Calculate from ticket estimation if present
  if (estimation && createdAt) {
    const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
    let durationMs = 0;
    if (estimation.endsWith("h")) {
      const hours = parseFloat(estimation.replace("h", ""));
      durationMs = hours * 60 * 60 * 1000;
    } else if (estimation.endsWith("d")) {
      const days = parseFloat(estimation.replace("d", ""));
      durationMs = days * 24 * 60 * 60 * 1000;
    }

    if (durationMs > 0) {
      const expireTime = created.getTime() + durationMs;
      const diffMs = expireTime - now;

      if (diffMs <= 0) {
        return { isExpired: true, remainingText: "In Backlog" };
      }

      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return {
          isExpired: false,
          remainingText: diffDays === 1 ? "1 day to reach backlog" : `${diffDays} days to reach backlog`,
        };
      } else if (diffHours > 0) {
        return {
          isExpired: false,
          remainingText: diffHours === 1 ? "1 hour to reach backlog" : `${diffHours} hours to reach backlog`,
        };
      } else {
        return {
          isExpired: false,
          remainingText: diffMinutes <= 1 ? "1 min to reach backlog" : `${diffMinutes} mins to reach backlog`,
        };
      }
    }
  }

  // 2. Fallback to sprint end date
  if (sprintEndDate) {
    const days = daysLeft(sprintEndDate);
    if (days <= 0) {
      return { isExpired: true, remainingText: "In Backlog" };
    }
    return {
      isExpired: false,
      remainingText: days === 1 ? "1 day to reach backlog" : `${days} days to reach backlog`,
    };
  }

  return null;
}

