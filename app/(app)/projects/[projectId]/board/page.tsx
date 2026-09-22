"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { ticketsApi, membersApi, sprintsApi, projectsApi } from "@/services/api";
import { Ticket, Member, Sprint } from "@/types";
import { TICKET_STATUS, TICKET_STATUS_LABELS } from "@/constants";
import { PageSpinner, Avatar } from "@/components/ui/Misc";
import { AssignmentFlowBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import TicketModal from "@/components/tickets/TicketModal";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import { getEstimationRemaining, cn, getInitials } from "@/lib/utils";
function TicketCard({ ticket, onClick, projectPrefix }: { ticket: Ticket; onClick: () => void; projectPrefix: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-white border border-slate-200/90 rounded-2xl p-3.5 cursor-grab active:cursor-grabbing",
        "hover:border-indigo-400/80 hover:shadow-md hover:-translate-y-0.5 shadow-2xs transition-all duration-150 space-y-2.5 group",
        isDragging && "opacity-40 ring-2 ring-indigo-500 scale-95"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm sm:text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors flex-1">
          {ticket.title}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
            {projectPrefix}-{ticket.id}
          </span>
          {ticket.sprint && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1">
              <span>📋</span>
              <span className="max-w-[80px] truncate">{ticket.sprint.name ?? `Sprint #${ticket.sprint.id}`}</span>
            </span>
          )}
          {ticket.estimation && (
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded-md">
              {ticket.estimation}
            </span>
          )}
        </div>
        <AssignmentFlowBadge author={ticket.author} assignee={ticket.assignee} size="sm" />
      </div>
    </div>
  );
}

function DragOverlayCard({ ticket, projectPrefix }: { ticket: Ticket; projectPrefix: string }) {
  return (
    <div className="bg-white border-2 border-indigo-500 rounded-2xl p-3.5 shadow-xl rotate-2 w-64 space-y-2.5 select-none pointer-events-none">
      <p className="text-sm font-bold text-slate-900">{ticket.title}</p>
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <span className="font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded">{projectPrefix}-{ticket.id}</span>
        <AssignmentFlowBadge author={ticket.author} assignee={ticket.assignee} size="sm" />
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tickets,
  iconClass,
  onTicketClick,
  projectPrefix,
}: {
  status: string;
  tickets: Ticket[];
  iconClass: string;
  onTicketClick: (t: Ticket) => void;
  projectPrefix: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3.5 min-h-[540px] flex flex-col backdrop-blur-2xs shadow-2xs transition-colors",
        isOver && "ring-2 ring-indigo-500/60 bg-indigo-50/40 border-indigo-300"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1.5">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", iconClass)} />
          <span className="text-xs font-bold text-slate-700 tracking-tight">
            {TICKET_STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200/80 px-2 py-0.5 rounded-full shadow-2xs">
          {tickets.length}
        </span>
      </div>

      {/* Sortable tickets container */}
      <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 flex-1 min-h-[120px] flex flex-col">
          {tickets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center border border-dashed border-slate-300/70 rounded-xl p-4 text-center text-slate-400 text-xs select-none min-h-[100px]">
              Drop tickets here
            </div>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => onTicketClick(ticket)}
                projectPrefix={projectPrefix}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

import CreateSprintModal from "@/components/sprints/CreateSprintModal";
import { EmptyState } from "@/components/ui/Misc";

const getDynamicStatus = (s: Sprint) => {
  if (!s.start_date || !s.end_date) return "PLANNED";
  const startTs = new Date(s.start_date).getTime();
  const endTs = s.end_date.length === 10
    ? new Date(`${s.end_date}T23:59:59`).getTime()
    : new Date(s.end_date).getTime();
  const currentTs = new Date().getTime();
  if (currentTs < startTs) return "PLANNED";
  if (currentTs > endTs) return "COMPLETED";
  return "ACTIVE";
};

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const sprintIdParam = searchParams.get("sprintId");
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const pid = parseInt(projectId);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  // Start with the URL param if present, otherwise will be resolved to active sprint after load
  const [selectedSprintId, setSelectedSprintId] = useState<number | "ALL">(
    sprintIdParam ? parseInt(sprintIdParam) : "ALL"
  );
  const [projectOwnerId, setProjectOwnerId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [projectPrefix, setProjectPrefix] = useState("PF");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);

  const isOwner = projectOwnerId === user?.id;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadData = async (sprintFilterId: number | "ALL" = selectedSprintId) => {
    try {
      const [m, sp, p] = await Promise.all([
        membersApi.list(pid),
        sprintsApi.listByProject(pid),
        projectsApi.getById(pid),
      ]);
      setMembers(m);
      setProjectOwnerId(p.created_by);
      setProjectPrefix(getInitials(p.name));

      const owner = p.created_by === user?.id;

      let visibleSprints = sp as Sprint[];
      if (!owner && user?.id) {
        const allProjectTickets = await ticketsApi.listByProject(pid, { limit: 200 });
        const rawTickets = allProjectTickets.tickets || [];
        const myTickets = rawTickets.filter(
          (t: Ticket) => t.assignee_id === user.id || t.author_id === user.id
        );
        const mySprintIds = new Set(
          myTickets.filter((t: Ticket) => t.sprint_id !== null).map((t: Ticket) => t.sprint_id)
        );
        visibleSprints = (sp as Sprint[]).filter((s) =>
          s.status === "ACTIVE" ? true : mySprintIds.has(s.id)
        );
      }
      setSprints(visibleSprints);

      // If no explicit filter chosen (ALL and no URL param), auto-select the active sprint
      let effectiveFilter = sprintFilterId;
      if (effectiveFilter === "ALL" && !sprintIdParam) {
        const activeSprint = visibleSprints.find((s) => getDynamicStatus(s) === "ACTIVE");
        if (activeSprint) {
          effectiveFilter = activeSprint.id;
          setSelectedSprintId(activeSprint.id);
        }
      }

      const filter: Record<string, unknown> = effectiveFilter !== "ALL"
        ? { sprintId: effectiveFilter as number, limit: 100 }
        : { limit: 100 };

      const t = await ticketsApi.listByProject(pid, filter as Parameters<typeof ticketsApi.listByProject>[1]);
      // Never show backlog tickets (sprint_id = null) on the board
      let sprintTickets = (t.tickets || []).filter((ticket: Ticket) => ticket.sprint_id !== null && ticket.sprint_id !== undefined);

      // All members can see all tickets on the board

      // Filter out tickets that are expired / rolled over into the backlog
      const sprintMap = new Map<number, Sprint>();
      (sp as Sprint[]).forEach((s) => sprintMap.set(s.id, s));

      sprintTickets = sprintTickets.filter((ticket: Ticket) => {
        if (!ticket.sprint_id) return false;
        const sprint = sprintMap.get(ticket.sprint_id);
        if (!sprint) return false;
        if (getDynamicStatus(sprint) === "COMPLETED" || sprint.status === "CANCELLED") return false;

        // Tickets marked DONE stay in DONE column
        if (ticket.status === "DONE") return true;

        // If estimation or sprint has expired, ticket has rolled over to Backlog
        const estInfo = getEstimationRemaining(ticket.created_at, ticket.estimation, sprint.end_date);
        if (estInfo?.isExpired) return false;

        return true;
      });

      setTickets(sprintTickets);
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to load board." }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedSprintId);
  }, [pid, selectedSprintId, user?.id]);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchesAssignee = !selectedAssigneeId || t.assignee_id === selectedAssigneeId;
    return matchesSearch && matchesAssignee;
  });

  const getColumnTickets = (status: string) =>
    filteredTickets.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  const handleDragStart = (event: DragStartEvent) => {
    const t = tickets.find((t) => t.id === event.active.id);
    setActiveTicket(t ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);
    if (!over) return;

    const ticketId = active.id as number;
    const overId = over.id as string | number;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    let newStatus: string;
    let newPosition: number;

    if (TICKET_STATUS.includes(overId as typeof TICKET_STATUS[number])) {
      // Dropped directly on column droppable
      newStatus = overId as string;
      const targetColTickets = tickets.filter((t) => t.status === newStatus && t.id !== ticketId);
      newPosition = targetColTickets.length;
    } else {
      // Dropped on another ticket
      const overTicket = tickets.find((t) => t.id === overId);
      if (overTicket) {
        newStatus = overTicket.status;
        newPosition = overTicket.position;
      } else {
        newStatus = ticket.status;
        newPosition = ticket.position;
      }
    }

    if (newStatus === ticket.status && newPosition === ticket.position) {
      return;
    }

    const previousTickets = [...tickets];
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus, position: newPosition } : t))
    );

    try {
      const updated = await ticketsApi.move(ticketId, {
        status: newStatus,
        position: newPosition,
        sprintId: ticket.sprint_id,
      });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    } catch {
      setTickets(previousTickets);
      dispatch(addToast({ type: "error", message: "Failed to move ticket." }));
    }
  };

  const statusIcons: Record<string, string> = {
    TODO: "bg-slate-400",
    IN_PROGRESS: "bg-indigo-500 animate-pulse",
    IN_REVIEW: "bg-amber-500",
    DONE: "bg-emerald-500",
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="p-6 sm:p-8 min-h-screen">
      {/* Board Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Kanban Board
          </h2>
          <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 px-2.5 py-0.5 rounded-full shadow-2xs">
            {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {sprints.length > 0 && (
            <>
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search board..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200/90 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none w-44 shadow-2xs transition-all"
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
              <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2 py-1 rounded-xl shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Assignee:</span>
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

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sprint:</span>
                <select
                  id="board-sprint-filter"
                  aria-label="Filter board by sprint"
                  value={selectedSprintId}
                  onChange={(e) => {
                    const val = e.target.value === "ALL" ? "ALL" : parseInt(e.target.value);
                    setSelectedSprintId(val);
                  }}
                  className="text-xs font-semibold bg-transparent text-slate-800 outline-none cursor-pointer"
                >
                  <option value="ALL">All Sprints / Project Board</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name ?? `Sprint #${s.id}`}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" variant={sprints.length > 0 ? "secondary" : "primary"} onClick={() => setCreateSprintOpen(true)} id="board-new-sprint-btn">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Sprint
            </Button>
            {sprints.length > 0 && (
              <Button size="sm" onClick={() => setCreateTicketOpen(true)} id="board-create-ticket-btn">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create Ticket
              </Button>
            )}
          </div>
        </div>
      </div>

      {sprints.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No sprints created yet."
            description="Create your first sprint to start organizing and managing tickets on the Kanban board."
            action={
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setCreateSprintOpen(true)}>
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Sprint
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        /* Kanban Drag and Drop Columns */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {TICKET_STATUS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tickets={getColumnTickets(status)}
                iconClass={statusIcons[status]}
                onTicketClick={(t) => setSelectedTicket(t)}
                projectPrefix={projectPrefix}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTicket ? <DragOverlayCard ticket={activeTicket} projectPrefix={projectPrefix} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modals */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          isOpen={true}
          onClose={() => setSelectedTicket(null)}
          onUpdated={(t) => {
            setTickets((prev) => prev.map((x) => (x.id === t.id ? t : x)));
            setSelectedTicket(null);
          }}
          onDeleted={(id) => {
            setTickets((prev) => prev.filter((x) => x.id !== id));
            setSelectedTicket(null);
          }}
          projectOwnerId={projectOwnerId}
          projectPrefix={projectPrefix}
        />
      )}

      {createTicketOpen && (
        <CreateTicketModal
          isOpen={createTicketOpen}
          onClose={() => setCreateTicketOpen(false)}
          onCreated={(t) => {
            setTickets((prev) => [...prev, t]);
          }}
          projectId={pid}
          members={members}
          sprints={sprints}
          defaultSprintId={typeof selectedSprintId === "number" ? selectedSprintId : sprints[0]?.id}
          onRequestCreateSprint={() => setCreateTicketOpen(true)}
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
    </div>
  );
}
