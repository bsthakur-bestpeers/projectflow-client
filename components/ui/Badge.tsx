"use client";
import { cn } from "@/lib/utils";
import { TICKET_STATUS_LABELS, PROJECT_STATUS_LABELS, SPRINT_STATUS_LABELS } from "@/constants";

type BadgeColor = "violet" | "indigo" | "blue" | "amber" | "green" | "slate" | "red" | "emerald" | "cyan" | "orange";

const colors: Record<BadgeColor, { bg: string; dot: string }> = {
  indigo: { bg: "bg-indigo-50 text-indigo-700 border-indigo-200/70", dot: "bg-indigo-500" },
  violet: { bg: "bg-purple-50 text-purple-700 border-purple-200/70", dot: "bg-purple-500" },
  blue: { bg: "bg-sky-50 text-sky-700 border-sky-200/70", dot: "bg-sky-500" },
  cyan: { bg: "bg-cyan-50 text-cyan-700 border-cyan-200/70", dot: "bg-cyan-500" },
  amber: { bg: "bg-amber-50 text-amber-800 border-amber-200/70", dot: "bg-amber-500" },
  green: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/70", dot: "bg-emerald-500" },
  emerald: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/70", dot: "bg-emerald-500" },
  slate: { bg: "bg-slate-100 text-slate-700 border-slate-200/80", dot: "bg-slate-400" },
  red: { bg: "bg-rose-50 text-rose-700 border-rose-200/70", dot: "bg-rose-500" },
  orange: { bg: "bg-orange-50 text-orange-800 border-orange-200/70", dot: "bg-orange-500" },
};

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  withDot?: boolean;
  pulseDot?: boolean;
  className?: string;
}

export function Badge({ children, color = "slate", withDot = true, pulseDot = false, className }: BadgeProps) {
  const theme = colors[color] || colors.slate;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-tight shadow-2xs",
        theme.bg,
        className
      )}
    >
      {withDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            theme.dot,
            pulseDot && "animate-pulse"
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export function TicketStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "TODO":
      return <Badge color="slate">{TICKET_STATUS_LABELS.TODO}</Badge>;
    case "IN_PROGRESS":
      return <Badge color="indigo" pulseDot>{TICKET_STATUS_LABELS.IN_PROGRESS}</Badge>;
    case "IN_REVIEW":
      return <Badge color="amber">{TICKET_STATUS_LABELS.IN_REVIEW}</Badge>;
    case "DONE":
      return <Badge color="emerald">{TICKET_STATUS_LABELS.DONE}</Badge>;
    default:
      return <Badge color="slate">{status}</Badge>;
  }
}

export function ProjectStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Badge color="emerald">{PROJECT_STATUS_LABELS.ACTIVE}</Badge>;
    case "COMPLETED":
      return <Badge color="indigo">{PROJECT_STATUS_LABELS.COMPLETED}</Badge>;
    case "ARCHIVED":
      return <Badge color="slate">{PROJECT_STATUS_LABELS.ARCHIVED}</Badge>;
    default:
      return <Badge color="slate">{status}</Badge>;
  }
}

export function SprintStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PLANNED":
      return <Badge color="slate">{SPRINT_STATUS_LABELS.PLANNED}</Badge>;
    case "ACTIVE":
      return <Badge color="indigo" pulseDot>{SPRINT_STATUS_LABELS.ACTIVE}</Badge>;
    case "COMPLETED":
      return <Badge color="emerald">{SPRINT_STATUS_LABELS.COMPLETED}</Badge>;
    case "CANCELLED":
      return <Badge color="red">{SPRINT_STATUS_LABELS.CANCELLED}</Badge>;
    default:
      return <Badge color="slate">{status}</Badge>;
  }
}

import { Avatar } from "./Misc";

export function AssignmentFlowBadge({
  author,
  assignee,
  size = "md",
}: {
  author?: { full_name: string } | null;
  assignee?: { full_name: string } | null;
  size?: "sm" | "md";
}) {
  if (size === "sm") {
    return (
      <div
        className="inline-flex items-center gap-1 bg-slate-50/90 border border-slate-200/90 px-1.5 sm:px-2 py-0.5 rounded-lg text-xs shadow-2xs max-w-full min-w-0 overflow-hidden shrink"
        title={`Assigned by ${author?.full_name ?? "Unknown"} → to ${assignee?.full_name ?? "Unassigned"}`}
      >
        {author && (
          <div className="flex items-center gap-1 min-w-0 shrink">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0">By:</span>
            <div className="shrink-0">
              <Avatar name={author.full_name} size="xs" />
            </div>
            <span className="font-semibold text-slate-600 max-w-[42px] sm:max-w-[80px] truncate min-w-0 text-[11px] sm:text-xs">
              {author.full_name.split(" ")[0]}
            </span>
          </div>
        )}
        <svg
          className="w-2.5 h-2.5 text-indigo-500 shrink-0 mx-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        {assignee ? (
          <div className="flex items-center gap-1 min-w-0 shrink">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight shrink-0">To:</span>
            <div className="shrink-0">
              <Avatar name={assignee.full_name} size="xs" />
            </div>
            <span className="font-bold text-indigo-700 max-w-[42px] sm:max-w-[80px] truncate min-w-0 text-[11px] sm:text-xs">
              {assignee.full_name.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[10px] sm:text-xs text-slate-400 italic truncate min-w-0">Unassigned</span>
        )}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 sm:gap-2 bg-slate-50/90 border border-slate-200/90 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl shadow-2xs max-w-full min-w-0 overflow-hidden shrink"
      title={`Assigned by ${author?.full_name ?? "Unknown"} → to ${assignee?.full_name ?? "Unassigned"}`}
    >
      {author && (
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink">
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-tight shrink-0">By:</span>
          <div className="shrink-0">
            <Avatar name={author.full_name} size="xs" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 max-w-[50px] sm:max-w-[100px] truncate min-w-0">
            {author.full_name}
          </span>
        </div>
      )}
      <svg
        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-500 shrink-0 mx-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
      {assignee ? (
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink">
          <span className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-tight shrink-0">To:</span>
          <div className="shrink-0">
            <Avatar name={assignee.full_name} size="xs" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-indigo-700 max-w-[50px] sm:max-w-[100px] truncate min-w-0">
            {assignee.full_name}
          </span>
        </div>
      ) : (
        <span className="text-xs font-medium text-slate-400 italic truncate min-w-0">Unassigned</span>
      )}
    </div>
  );
}

import { TICKET_PRIORITY_LABELS, TicketPriority } from "@/constants";

export function PriorityIcon({
  priority,
  size = "md",
  className,
}: {
  priority?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const p = (priority || "MEDIUM").toUpperCase();
  const sizeMap = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };
  const iconClass = cn(sizeMap[size] || sizeMap.md, "shrink-0", className);

  switch (p) {
    case "HIGHEST":
      return (
        <svg className={cn(iconClass, "text-[#E5493A]")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
          <title>Highest Priority</title>
          <polyline points="17 11 12 6 7 11" />
          <polyline points="17 17 12 12 7 17" />
        </svg>
      );
    case "HIGH":
      return (
        <svg className={cn(iconClass, "text-[#FF5630]")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
          <title>High Priority</title>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      );
    case "MEDIUM":
      return (
        <svg className={cn(iconClass, "text-[#FFAB00]")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <title>Medium Priority</title>
          <line x1="6" y1="9.5" x2="18" y2="9.5" />
          <line x1="6" y1="14.5" x2="18" y2="14.5" />
        </svg>
      );
    case "LOW":
      return (
        <svg className={cn(iconClass, "text-[#0065FF]")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
          <title>Low Priority</title>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      );
    case "LOWEST":
      return (
        <svg className={cn(iconClass, "text-[#2684FF]")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
          <title>Lowest Priority</title>
          <polyline points="7 7 12 12 17 7" />
          <polyline points="7 13 12 18 17 13" />
        </svg>
      );
    default:
      return (
        <svg className={cn(iconClass, "text-slate-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <title>{priority ?? "Medium"}</title>
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
      );
  }
}

export function PriorityBadge({
  priority,
  size = "md",
  className,
}: {
  priority?: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const p = (priority || "MEDIUM").toUpperCase();
  const label = TICKET_PRIORITY_LABELS[p as TicketPriority] || p;

  const bgStyles: Record<string, string> = {
    HIGHEST: "bg-rose-50/80 border-rose-200/80 text-rose-700",
    HIGH: "bg-rose-50/80 border-rose-200/80 text-rose-700",
    MEDIUM: "bg-amber-50/80 border-amber-200/80 text-amber-700",
    LOW: "bg-blue-50/80 border-blue-200/80 text-blue-700",
    LOWEST: "bg-blue-50/80 border-blue-200/80 text-blue-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-semibold border shadow-2xs",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs",
        bgStyles[p] || "bg-slate-50 border-slate-200 text-slate-700",
        className
      )}
      title={`Priority: ${label}`}
    >
      <PriorityIcon priority={p} size={size === "sm" ? "xs" : "sm"} />
      <span>{label}</span>
    </span>
  );
}

export const getPriorityOptions = () => [
  { value: "HIGH", label: "High", icon: <PriorityIcon priority="HIGH" size="sm" /> },
  { value: "MEDIUM", label: "Medium", icon: <PriorityIcon priority="MEDIUM" size="sm" /> },
  { value: "LOW", label: "Low", icon: <PriorityIcon priority="LOW" size="sm" /> },
];



