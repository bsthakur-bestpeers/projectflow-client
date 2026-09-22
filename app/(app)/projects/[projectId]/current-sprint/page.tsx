"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { ticketsApi, membersApi, sprintsApi, projectsApi } from "@/services/api";
import { Ticket, Member, Sprint } from "@/types";
import { PageSpinner, EmptyState, Avatar } from "@/components/ui/Misc";
import { TicketStatusBadge, AssignmentFlowBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import TicketModal from "@/components/tickets/TicketModal";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import { formatDateRange, daysLeft, getEstimationRemaining, getInitials, cn } from "@/lib/utils";

export default function CurrentSprintPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sprintIdParam = searchParams.get("sprintId");
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const pid = parseInt(projectId);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [projectOwnerId, setProjectOwnerId] = useState<number>(0);
  const [projectPrefix, setProjectPrefix] = useState("PF");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const isOwner = projectOwnerId === currentUser?.id;

  const resolveCurrentSprint = (spList: Sprint[], targetId?: number | null): Sprint | null => {
    if (!spList || spList.length === 0) return null;
    if (targetId) {
      const found = spList.find((s) => s.id === targetId && s.status === "ACTIVE");
      if (found) return found;
    }
    // Only return the ACTIVE sprint
    return spList.find((s) => s.status === "ACTIVE") || null;
  };

  const loadData = async (overrideSprintId?: number) => {
    try {
      const [m, sp, p] = await Promise.all([
        membersApi.list(pid),
        sprintsApi.listByProject(pid),
        projectsApi.getById(pid),
      ]);
      setMembers(m);
      const owner = p.created_by === currentUser?.id;
      setProjectOwnerId(p.created_by);
      setProjectPrefix(getInitials(p.name));

      // Only ACTIVE sprints belong in Current Sprint
      const activeSprints = (sp as Sprint[]).filter((s) => s.status === "ACTIVE");
      setSprints(activeSprints);

      const targetId = overrideSprintId ?? (sprintIdParam ? parseInt(sprintIdParam) : null);
      const current = resolveCurrentSprint(activeSprints, targetId);

      setActiveSprint(current);
      if (current) {
        const t = await ticketsApi.listByProject(pid, { sprintId: current.id, limit: 100 });
        let sprintTickets = t.tickets || [];
        if (!owner && currentUser?.id) {
          sprintTickets = sprintTickets.filter(
            (ticket: Ticket) => ticket.assignee_id === currentUser.id || ticket.author_id === currentUser.id
          );
        }
        setTickets(sprintTickets);
      } else {
        setTickets([]);
      }
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to load sprint." }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    router.replace(`/projects/${pid}/sprints`);
  }, [pid, router]);

  const handleSelectSprint = async (sprint: Sprint) => {
    setActiveSprint(sprint);
    router.replace(`/projects/${pid}/current-sprint?sprintId=${sprint.id}`);
    try {
      const owner = projectOwnerId === currentUser?.id;
      const t = await ticketsApi.listByProject(pid, { sprintId: sprint.id, limit: 100 });
      let sprintTickets = t.tickets || [];
      if (!owner && currentUser?.id) {
        sprintTickets = sprintTickets.filter(
          (ticket: Ticket) => ticket.assignee_id === currentUser.id || ticket.author_id === currentUser.id
        );
      }
      setTickets(sprintTickets);
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to load tickets for sprint." }));
    }
  };

  const handleStartSprint = async () => {
    if (!activeSprint) return;
    setActionLoading(true);
    try {
      await sprintsApi.start(activeSprint.id);
      dispatch(addToast({ type: "success", message: `Sprint "${activeSprint.name ?? `Sprint #${activeSprint.id}`}" started successfully!` }));
      loadData(activeSprint.id);
    } catch (err: unknown) {
      dispatch(addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to start sprint.",
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteSprint = async () => {
    if (!activeSprint) return;
    setActionLoading(true);
    try {
      await sprintsApi.complete(activeSprint.id);
      dispatch(addToast({ type: "success", message: `Sprint "${activeSprint.name ?? `Sprint #${activeSprint.id}`}" completed!` }));
      loadData();
    } catch (err: unknown) {
      dispatch(addToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to complete sprint.",
      }));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageSpinner />;

  if (!activeSprint) {
    return (
      <div className="p-6 sm:p-8 w-full min-h-[60vh] flex items-center justify-center">
        <EmptyState
          title="No active sprint in progress."
          description={
            isOwner
              ? "There is currently no active sprint for this project. Start a planned sprint or create one from the Sprints tab."
              : "There is currently no active sprint cycle for this project. Once the project owner starts a sprint, it will appear here."
          }
          action={
            isOwner ? (
              <Button onClick={() => router.push(`/projects/${pid}/sprints`)} id="go-to-sprints-btn">
                Go to Sprints
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => router.push(`/projects/${pid}/board`)} id="view-board-btn">
                View Board
              </Button>
            )
          }
        />
      </div>
    );
  }

  const done = tickets.filter((t) => t.status === "DONE").length;
  const progress = tickets.length > 0 ? Math.round((done / tickets.length) * 100) : 0;

  return (
    <div className="p-6 sm:p-8 w-full min-h-screen">
      {/* Sprint Hero Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 mb-8 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{activeSprint.name ?? `Sprint #${activeSprint.id}`}</h2>
              {activeSprint.status === "ACTIVE" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              )}
              {activeSprint.status === "COMPLETED" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Completed
                </span>
              )}
              {(!activeSprint.status || activeSprint.status === "PLANNED") && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Planned
                </span>
              )}

              {sprints.length > 1 && (
                <select
                  value={activeSprint.id}
                  onChange={(e) => {
                    const s = sprints.find((x) => x.id === parseInt(e.target.value));
                    if (s) handleSelectSprint(s);
                  }}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer ml-auto"
                >
                  {[...sprints].reverse().map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name ?? `Sprint #${s.id}`} {s.status === "ACTIVE" ? "(Active)" : s.status === "COMPLETED" ? "(Completed)" : "(Planned)"}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">{formatDateRange(activeSprint.start_date, activeSprint.end_date)}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
                <span>⚡</span> {daysLeft(activeSprint.end_date)} days remaining
              </p>
              {isOwner && (!activeSprint.status || activeSprint.status === "PLANNED") && (
                <Button
                  size="sm"
                  loading={actionLoading}
                  onClick={handleStartSprint}
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                  id="current-sprint-start-btn"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Start Sprint
                </Button>
              )}
              {isOwner && activeSprint.status === "ACTIVE" && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={actionLoading}
                  onClick={handleCompleteSprint}
                  className="text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  id="current-sprint-complete-btn"
                >
                  Complete Sprint
                </Button>
              )}
            </div>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{progress}%</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{done} of {tickets.length} tickets completed</p>
          </div>
        </div>
        <div className="mt-5 h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
          Tickets in this sprint ({tickets.length})
        </h3>
        <Button size="sm" onClick={() => setCreateOpen(true)} id="current-sprint-create-btn">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState title="No tickets in this sprint." description="Add tickets from the backlog or create a new ticket for this sprint." action={<Button size="sm" onClick={() => setCreateOpen(true)}>Add Ticket</Button>} />
      ) : (
        <div className="space-y-2.5">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl px-5 py-4 hover:border-indigo-400 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 cursor-pointer group shadow-2xs gap-4"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                  {projectPrefix}-{ticket.id}
                </span>
                <span className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                  {ticket.title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                {ticket.estimation && (
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/80">
                    Estimation: {ticket.estimation}
                  </span>
                )}
                {ticket.status !== "DONE" && (() => {
                  const estInfo = getEstimationRemaining(ticket.created_at, ticket.estimation, activeSprint?.end_date, ticket.status);
                  if (!estInfo) return null;
                  return (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/80 flex items-center gap-1">
                      <span>⏳</span>
                      <span>{estInfo.remainingText}</span>
                    </span>
                  );
                })()}
                <TicketStatusBadge status={ticket.status} />
                <AssignmentFlowBadge author={ticket.author} assignee={ticket.assignee} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTicketModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreated={(t) => setTickets((p) => [...p, t])} projectId={pid} members={members} sprints={sprints} defaultSprintId={activeSprint.id} />
      {selectedTicket && (
        <TicketModal
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
          onUpdated={(ticket) => {
            setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
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
    </div>
  );
}
