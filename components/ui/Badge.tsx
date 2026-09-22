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
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-tight shadow-2xs",
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
        className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 px-2 py-0.5 rounded-lg text-[11px] shadow-2xs"
        title={`Assigned by ${author?.full_name ?? "Unknown"} → to ${assignee?.full_name ?? "Unassigned"}`}
      >
        {author && (
          <div className="flex items-center gap-1">
            <Avatar name={author.full_name} size="xs" />
            <span className="font-semibold text-slate-600 max-w-[65px] truncate">
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
          <div className="flex items-center gap-1">
            <Avatar name={assignee.full_name} size="xs" />
            <span className="font-bold text-indigo-700 max-w-[65px] truncate">
              {assignee.full_name.split(" ")[0]}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Unassigned</span>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 bg-slate-50/90 border border-slate-200/90 px-2.5 py-1 rounded-xl shadow-2xs"
      title={`Assigned by ${author?.full_name ?? "Unknown"} → to ${assignee?.full_name ?? "Unassigned"}`}
    >
      {author && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">By:</span>
          <Avatar name={author.full_name} size="xs" />
          <span className="text-xs font-semibold text-slate-700 max-w-[95px] truncate">
            {author.full_name}
          </span>
        </div>
      )}
      <svg
        className="w-3 h-3 text-indigo-500 shrink-0 mx-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
      {assignee ? (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">To:</span>
          <Avatar name={assignee.full_name} size="xs" />
          <span className="text-xs font-bold text-indigo-700 max-w-[95px] truncate">
            {assignee.full_name}
          </span>
        </div>
      ) : (
        <span className="text-xs font-medium text-slate-400 italic">Unassigned</span>
      )}
    </div>
  );
}

