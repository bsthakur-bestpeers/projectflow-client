"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch } from "@/store";
import { addToast } from "@/store/uiSlice";
import { projectsApi, sprintsApi, ticketsApi } from "@/services/api";
import { TicketSummary, Sprint, Ticket } from "@/types";
import { PageSpinner } from "@/components/ui/Misc";
import { SprintStatusBadge } from "@/components/ui/Badge";
import { formatDateRange, daysLeft } from "@/lib/utils";
import Button from "@/components/ui/Button";

export default function ProjectOverviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = parseInt(projectId);
    Promise.all([
      projectsApi.getSummary(id),
      sprintsApi.listByProject(id),
      ticketsApi.listByProject(id, { limit: 200 }),
    ]).then(([s, sp, allTicketsRes]) => {
      const rawTickets = allTicketsRes?.tickets || [];
      const hasTickets = rawTickets.length > 0;

      // Calculate directly from current project tickets to guarantee 100% accuracy with Board & Sprints
      const calculatedDone = rawTickets.filter((t: Ticket) => t.status === "DONE").length;
      const calculatedInReview = rawTickets.filter((t: Ticket) => t.sprint_id !== null && t.status === "IN_REVIEW").length;
      const calculatedInProgress = rawTickets.filter((t: Ticket) => t.sprint_id !== null && t.status === "IN_PROGRESS").length;
      const calculatedTodo = rawTickets.filter((t: Ticket) => t.sprint_id !== null && t.status === "TODO").length;
      const calculatedBacklog = rawTickets.filter((t: Ticket) => !t.sprint_id && t.status !== "DONE").length;

      const summaryData = s.summary;
      const doneCount = hasTickets ? calculatedDone : (summaryData?.DONE ?? 0);
      const inReviewCount = hasTickets ? calculatedInReview : (summaryData?.IN_REVIEW ?? 0);
      const inProgressCount = hasTickets ? calculatedInProgress : (summaryData?.IN_PROGRESS ?? 0);
      const todoCount = hasTickets ? calculatedTodo : (summaryData?.TODO ?? 0);
      const backlogCount = hasTickets ? calculatedBacklog : (summaryData?.BACKLOG ?? summaryData?.backlog ?? 0);
      const totalCount = doneCount + inReviewCount + inProgressCount + todoCount + backlogCount;

      setSummary({
        total: totalCount,
        BACKLOG: backlogCount,
        backlog: backlogCount,
        TODO: todoCount,
        IN_PROGRESS: inProgressCount,
        IN_REVIEW: inReviewCount,
        DONE: doneCount,
      });
      setSprints(sp);
    }).catch(() => dispatch(addToast({ type: "error", message: "Failed to load overview." })))
      .finally(() => setLoading(false));
  }, [projectId, dispatch]);

  if (loading) return <PageSpinner />;

  const currentSprint =
    sprints.find((s) => s.status === "ACTIVE") ||
    sprints.find((s) => s.status !== "COMPLETED" && s.status !== "CANCELLED") ||
    null;
  const statCards = [
    { label: "Total Tickets", value: summary?.total ?? 0, color: "text-slate-900", bg: "bg-white", border: "border-slate-200/80" },
    { label: "Backlog", value: summary?.BACKLOG ?? summary?.backlog ?? 0, color: "text-slate-500", bg: "bg-white", border: "border-slate-200/80" },
    { label: "To Do", value: summary?.TODO ?? 0, color: "text-slate-600", bg: "bg-white", border: "border-slate-200/80" },
    { label: "In Progress", value: summary?.IN_PROGRESS ?? 0, color: "text-indigo-600", bg: "bg-white", border: "border-slate-200/80" },
    { label: "In Review", value: summary?.IN_REVIEW ?? 0, color: "text-amber-600", bg: "bg-white", border: "border-slate-200/80" },
    { label: "Done", value: summary?.DONE ?? 0, color: "text-emerald-600", bg: "bg-white", border: "border-slate-200/80" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-h-screen">
      {/* Ticket Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 mb-6 sm:mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`border ${s.border} ${s.bg} rounded-2xl p-3.5 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow`}>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 sm:mb-1.5">{s.label}</p>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {summary && summary.total > 0 && (
        <div className="mb-6 sm:mb-8 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Overall Project Progress</span>
            </div>
            <span className="text-xs font-extrabold text-slate-900 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
              {Math.round((summary.DONE / summary.total) * 100)}% Completed
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(summary.DONE / summary.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Sprint */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Current Sprint</h2>
        {currentSprint ? (
          <div className="bg-white border border-indigo-200/80 rounded-2xl p-4 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{currentSprint.name ?? `Sprint #${currentSprint.id}`}</h3>
                  <SprintStatusBadge status={currentSprint.status} />
                </div>
                <p className="text-xs text-slate-500">{formatDateRange(currentSprint.start_date, currentSprint.end_date)}</p>
                <p className="text-xs font-bold text-amber-600 mt-2 flex items-center gap-1.5">
                  <span>⚡</span> {daysLeft(currentSprint.end_date)} days remaining
                </p>
              </div>
              <div className="flex gap-2 sm:gap-2.5 flex-wrap">
                <Link href={`/projects/${projectId}/sprints`}>
                  <Button size="sm" variant="secondary">View Sprints</Button>
                </Link>
                <Link href={`/projects/${projectId}/board`}>
                  <Button size="sm">Open Board</Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 border border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center shadow-2xs">
            <p className="text-slate-500 text-xs sm:text-sm mb-3">No active sprint in progress.</p>
            <Link href={`/projects/${projectId}/sprints`}>
              <Button size="sm" variant="secondary">View Sprints</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {[
          { label: "Backlog", href: `/projects/${projectId}/backlog`, icon: "📋", desc: "Plan & prioritize" },
          { label: "Kanban Board", href: `/projects/${projectId}/board`, icon: "🗂️", desc: "Live task board" },
          { label: "Sprints", href: `/projects/${projectId}/sprints`, icon: "⚡", desc: "Sprint cycles" },
          { label: "Team Members", href: `/projects/${projectId}/members`, icon: "👥", desc: "Collaborators" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-2xs group"
          >
            <span className="text-xl mb-2 block">{link.icon}</span>
            <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{link.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
