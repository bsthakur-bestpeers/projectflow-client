"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { ticketsApi, membersApi, sprintsApi, projectsApi } from "@/services/api";
import { Ticket, Member, Sprint } from "@/types";
import { PageSpinner, Avatar, EmptyState } from "@/components/ui/Misc";
import { AssignmentFlowBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import TicketModal from "@/components/tickets/TicketModal";
import CreateSprintModal from "@/components/sprints/CreateSprintModal";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import { formatDate, getEstimationRemaining, cn, getInitials } from "@/lib/utils";

interface ExtendedTicket extends Ticket {
  sprintName?: string;
  expiredDate?: string;
  isExpired?: boolean;
}

export default function BacklogPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const pid = parseInt(projectId);

  const [tickets, setTickets] = useState<ExtendedTicket[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projectPrefix, setProjectPrefix] = useState("PF");
  const [projectOwnerId, setProjectOwnerId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);
  const [movingTicketId, setMovingTicketId] = useState<number | null>(null);

  const isOwner = projectOwnerId === user?.id;

  const loadData = async () => {
    try {
      const [m, sp, p] = await Promise.all([
        membersApi.list(pid),
        sprintsApi.listByProject(pid),
        projectsApi.getById(pid),
      ]);
      setMembers(m);
      setSprints(sp);
      setProjectOwnerId(p.created_by);
      setProjectPrefix(getInitials(p.name));

      const owner = p.created_by === user?.id;
      const t = await ticketsApi.listByProject(pid, { limit: 200 });

      const now = new Date();
      let allTickets: Ticket[] = t.tickets || [];

      // All members can see all tickets in the backlog
      // We removed the non-owner filter here so everyone sees the full backlog.

      const sprintMap = new Map<number, Sprint>();
      sp.forEach((s: Sprint) => sprintMap.set(s.id, s));

      const getSprintStatus = (sprint: Sprint, currentNow: Date): "PLANNED" | "ACTIVE" | "EXPIRED" => {
        if (!sprint.start_date || !sprint.end_date) return "PLANNED";
        const startTs = new Date(sprint.start_date).getTime();
        const endTs = sprint.end_date.length === 10
          ? new Date(`${sprint.end_date}T23:59:59`).getTime()
          : new Date(sprint.end_date).getTime();
        const currentTs = currentNow.getTime();
        
        if (currentTs < startTs) return "PLANNED";
        if (currentTs > endTs) return "EXPIRED";
        return "ACTIVE";
      };

      const processed: ExtendedTicket[] = allTickets
        .filter((ticket) => {
          // Completed tickets never appear in the backlog
          if (ticket.status === "DONE") return false;

          // No sprint assigned → always show in backlog
          if (!ticket.sprint_id) return true;
          
          const sprint = sprintMap.get(ticket.sprint_id);
          if (!sprint) return true;

          const status = getSprintStatus(sprint, now);
          
          // Active sprint tickets appear only on the Board, not in Backlog
          if (status === "ACTIVE") return false;
          
          // Tickets from a future/planned sprint, or incomplete tickets from an expired sprint show in Backlog
          return true;
        })
        .map((ticket) => {
          let sprintName: string | undefined;
          let expiredDate: string | undefined;
          let isExpired = false;

          if (ticket.sprint_id) {
            const sprint = sprintMap.get(ticket.sprint_id);
            if (sprint) {
              sprintName = sprint.name || `Sprint #${sprint.id}`;
              const status = getSprintStatus(sprint, now);
              if (status === "EXPIRED") {
                isExpired = true;
                expiredDate = sprint.end_date;
              }
            }
          }

          return {
            ...ticket,
            sprintName,
            expiredDate,
            isExpired,
          };
        });

      setTickets(processed);
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to load backlog." }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pid, dispatch, user?.id]);

  const handleMoveToSprint = async (ticketId: number, targetSprintId: number) => {
    setMovingTicketId(ticketId);
    try {
      await ticketsApi.update(ticketId, { sprintId: targetSprintId });
      const targetSprint = sprints.find((s) => s.id === targetSprintId);
      const sprintName = targetSprint?.name ?? `Sprint #${targetSprintId}`;
      dispatch(addToast({ type: "success", message: `Ticket ${projectPrefix}-${ticketId} moved to ${sprintName}!` }));
      await loadData();
    } catch (err: unknown) {
      dispatch(addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to move ticket." }));
    } finally {
      setMovingTicketId(null);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchesAssignee = !selectedAssigneeId || t.assignee_id === selectedAssigneeId;
    return matchesSearch && matchesAssignee;
  });

  const expiredTickets = filteredTickets.filter((t) => t.isExpired);
  const unassignedTickets = filteredTickets.filter((t) => !t.isExpired);

  if (loading) return <PageSpinner />;

  const renderTicketRow = (ticket: ExtendedTicket) => (
    <div
      key={ticket.id}
      onClick={() => setSelectedTicket(ticket)}
      className="bg-white border border-slate-200/90 hover:border-indigo-400/80 rounded-2xl p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col xl:flex-row xl:items-center justify-between gap-3 group"
    >
      {/* Left side: Key, Title, Sprint, Estimation, Expired */}
      <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-1 rounded-lg shrink-0 mt-0.5 sm:mt-0">
          {projectPrefix}-{ticket.id}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
            {ticket.title}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 flex-wrap">
            {ticket.sprintName ? (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-indigo-700 bg-indigo-50/90 border border-indigo-200/80 px-2 sm:px-2.5 py-0.5 rounded-lg max-w-full">
                <span>📋</span>
                <span className="truncate max-w-[110px] sm:max-w-none">Sprint: {ticket.sprintName}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                No sprint assigned
              </span>
            )}
            {ticket.estimation && (
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 shrink-0">
                Estimation: {ticket.estimation}
              </span>
            )}
            {isOwner && ticket.expiredDate ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 sm:px-2.5 py-0.5 rounded-lg shadow-2xs max-w-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="truncate">Expired {formatDate(ticket.expiredDate)}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right side: Assignee Flow & Move to Sprint */}
      <div className="flex items-center justify-between xl:justify-end gap-2 sm:gap-3 pt-2.5 xl:pt-0 border-t xl:border-t-0 border-slate-100 flex-wrap sm:flex-nowrap min-w-0">
        <div className="min-w-0 shrink">
          <AssignmentFlowBadge author={ticket.author} assignee={ticket.assignee} size="sm" />
        </div>

        {/* Quick Action: Move directly to a sprint */}
        {sprints.length > 0 && (
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <select
              value=""
              disabled={movingTicketId === ticket.id}
              onChange={(e) => handleMoveToSprint(ticket.id, parseInt(e.target.value))}
              className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 border border-indigo-200/90 rounded-xl px-2.5 sm:px-3 py-1.5 cursor-pointer shadow-2xs outline-none transition-colors whitespace-nowrap"
              title="Schedule ticket into a sprint"
            >
              <option value="" disabled>
                {movingTicketId === ticket.id ? "Moving..." : "Move to Sprint ▾"}
              </option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? `Sprint #${s.id}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-6 lg:p-8 min-h-screen w-full">
      {/* Backlog Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Backlog</h2>
            <span className="text-[10px] sm:text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 px-2.5 py-0.5 rounded-full shadow-2xs">
              {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}
            </span>
            {isOwner && expiredTickets.length > 0 && (
              <span className="text-[10px] sm:text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                {expiredTickets.length} Expired Rollover
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Review rollover tickets from expired sprints and schedule unassigned work into sprint cycles.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[140px] sm:w-44">
              <input
                type="text"
                placeholder="Search backlog..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200/90 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-2xs transition-all"
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Assignee Filter Avatars */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2 py-1 rounded-xl shadow-2xs shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-0.5">Assignee:</span>
              {members.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedAssigneeId(selectedAssigneeId === m.id ? null : m.id)}
                  title={m.full_name}
                  className={cn(
                    "p-0.5 rounded-full transition-all cursor-pointer",
                    selectedAssigneeId === m.id ? "ring-2 ring-indigo-600 scale-110 shadow-xs" : "opacity-75 hover:opacity-100"
                  )}
                >
                  <Avatar name={m.full_name} size="sm" />
                </button>
              ))}
              {selectedAssigneeId && (
                <button
                  onClick={() => setSelectedAssigneeId(null)}
                  className="text-[11px] text-indigo-600 hover:underline font-semibold ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button size="sm" variant="secondary" onClick={() => setCreateTicketOpen(true)} id="backlog-create-ticket-btn" className="flex-1 sm:flex-initial justify-center whitespace-nowrap py-1.5 px-2.5 sm:px-3 text-xs">
                <svg className="w-3.5 h-3.5 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Ticket</span>
              </Button>
              <Button size="sm" onClick={() => setCreateSprintOpen(true)} id="backlog-create-sprint-btn" className="flex-1 sm:flex-initial justify-center whitespace-nowrap py-1.5 px-2.5 sm:px-3 text-xs">
                <svg className="w-3.5 h-3.5 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Sprint</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Sections */}
      {filteredTickets.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Backlog is empty"
            description="All tickets are actively scheduled in sprints or completed. When a sprint ends with incomplete tickets, they will automatically appear here."
            action={
              isOwner ? (
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setCreateTicketOpen(true)} variant="secondary">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Ticket
                  </Button>
                  <Button onClick={() => setCreateSprintOpen(true)}>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Sprint
                  </Button>
                </div>
              ) : undefined
            }
          />
        </div>
      ) : !isOwner ? (
        <div className="space-y-3">
          {filteredTickets.map(renderTicketRow)}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: Expired Sprint Rollover Tickets */}
          {expiredTickets.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Expired Sprint Rollovers ({expiredTickets.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  — Incomplete tasks from finished sprint cycles
                </span>
              </div>
              <div className="space-y-3">
                {expiredTickets.map(renderTicketRow)}
              </div>
            </div>
          )}

          {/* Section 2: Unplanned / Fresh Backlog Items */}
          {unassignedTickets.length > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Unplanned Backlog ({unassignedTickets.length})
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  — Ready to be scheduled into an upcoming sprint
                </span>
              </div>
              <div className="space-y-3">
                {unassignedTickets.map(renderTicketRow)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
          onUpdated={(updated) => {
            setTickets((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
            setSelectedTicket(null);
          }}
          onDeleted={(id) => {
            setTickets((prev) => prev.filter((t) => t.id !== id));
            setSelectedTicket(null);
          }}
          projectOwnerId={projectOwnerId}
          projectPrefix={projectPrefix}
        />
      )}

      <CreateSprintModal
        isOpen={createSprintOpen}
        onClose={() => setCreateSprintOpen(false)}
        onCreated={(sprint) => {
          setSprints((prev) => [...prev, sprint]);
          loadData();
        }}
        projectId={pid}
      />

      <CreateTicketModal
        isOpen={createTicketOpen}
        onClose={() => setCreateTicketOpen(false)}
        onCreated={() => {
          setCreateTicketOpen(false);
          loadData();
        }}
        projectId={pid}
        members={members}
        sprints={sprints}
        defaultSprintId={null}
        onRequestCreateSprint={() => {
          setCreateTicketOpen(false);
          setCreateSprintOpen(true);
        }}
      />
    </div>
  );
}
