"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { sprintsApi, projectsApi, membersApi, ticketsApi } from "@/services/api";
import { Sprint, Member, Ticket } from "@/types";
import { PageSpinner, EmptyState, Avatar } from "@/components/ui/Misc";
import { TicketStatusBadge, AssignmentFlowBadge, PriorityIcon } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import CreateSprintModal from "@/components/sprints/CreateSprintModal";
import CreateTicketModal from "@/components/tickets/CreateTicketModal";
import TicketModal from "@/components/tickets/TicketModal";
import { formatDateRange, daysLeft, getEstimationRemaining, cn, getInitials } from "@/lib/utils";

export default function SprintsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const sprintIdParam = searchParams.get("sprintId");

  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const pid = parseInt(projectId);

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [sprintTickets, setSprintTickets] = useState<Record<number, Ticket[]>>({});
  const [expandedSprintIds, setExpandedSprintIds] = useState<number[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [projectOwnerId, setProjectOwnerId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [projectPrefix, setProjectPrefix] = useState("PF");
  const [isOwner, setIsOwner] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [createTicketSprintId, setCreateTicketSprintId] = useState<number | null>(null);
  const [editSprint, setEditSprint] = useState<Sprint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Sprint | null>(null);

  const [formData, setFormData] = useState({ name: "", start_date: "", end_date: "" });
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    try {
      const [sp, p, m, allTicketsRes] = await Promise.all([
        sprintsApi.listByProject(pid),
        projectsApi.getById(pid),
        membersApi.list(pid),
        ticketsApi.listByProject(pid, { limit: 200 }),
      ]);
      const owner = p.created_by === user?.id;
      setIsOwner(owner);
      setMembers(m);
      setProjectOwnerId(p.created_by);
      setProjectPrefix(getInitials(p.name));

      const allTickets: Ticket[] = allTicketsRes.tickets || [];
      const visibleTickets = allTickets;

      // Group tickets by sprint ID
      const ticketMap: Record<number, Ticket[]> = {};
      visibleTickets.forEach((t: Ticket) => {
        if (t.sprint_id) {
          if (!ticketMap[t.sprint_id]) ticketMap[t.sprint_id] = [];
          ticketMap[t.sprint_id].push(t);
        }
      });
      setSprintTickets(ticketMap);

      const sortedSprints = [...(sp as Sprint[])].sort((a, b) => b.id - a.id);
      setSprints(sortedSprints);
      // Auto-expand only the 1st sprint by default
      setExpandedSprintIds((prev) => (prev.length === 0 && sortedSprints.length > 0 ? [sortedSprints[0].id] : prev));
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to load sprints." }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pid, dispatch, user?.id]);

  // When navigated with ?sprintId=..., auto-expand and scroll to that sprint card
  useEffect(() => {
    if (sprintIdParam && !loading && sprints.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`sprint-card-${sprintIdParam}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [sprintIdParam, loading, sprints.length]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSprint) return;

    try {
      const updated = await sprintsApi.update(editSprint.id, {
        name: formData.name || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
      });
      setSprints((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditSprint(null);
      dispatch(addToast({ type: "success", message: "Sprint updated." }));
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to update sprint.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await sprintsApi.delete(deleteTarget.id);
      setSprints((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
      dispatch(addToast({ type: "success", message: "Sprint deleted." }));
    } catch (err: unknown) {
    }
  };

  const openEditModal = (s: Sprint) => {
    setEditSprint(s);
    setFormData({
      name: s.name ?? "",
      start_date: s.start_date.slice(0, 10),
      end_date: s.end_date.slice(0, 10),
    });
    setFormError("");
  };



  if (loading) return <PageSpinner />;

  return (
    <div className="p-3 sm:p-6 lg:p-8 w-full min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sprints</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {sprints.length} sprint cycle{sprints.length !== 1 ? "s" : ""} in this project
          </p>
        </div>
        <Button onClick={() => setCreateSprintOpen(true)} id="create-sprint-btn" size="sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Sprint
        </Button>
      </div>

      {sprints.length === 0 ? (
        <EmptyState
          title="No sprints created yet."
          description="Create your first sprint to start planning iterations and adding tickets."
          action={<Button onClick={() => setCreateSprintOpen(true)}>Create Sprint</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {sprints.map((s) => {
            const isExpanded = expandedSprintIds.includes(s.id);
            const ticketsInSprint = sprintTickets[s.id] || [];
            const isTargeted = sprintIdParam ? parseInt(sprintIdParam) === s.id : false;
            
            const doneCount = ticketsInSprint.filter((t) => t.status === "DONE").length;
            const pendingCount = ticketsInSprint.length - doneCount;

            const getDynamicStatus = () => {
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
            const dynamicStatus = getDynamicStatus();

            return (
              <div
                id={`sprint-card-${s.id}`}
                key={s.id}
                className={cn(
                  "bg-white border rounded-xl p-3 sm:p-4 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between",
                  isTargeted
                    ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/10"
                    : "border-slate-200/90"
                )}
              >
                {/* Sprint Header (Clickable) */}
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none group"
                  onClick={() => {
                    setExpandedSprintIds((prev) =>
                      prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                    );
                  }}
                >
                  <div className="min-w-0 flex-1 flex items-start gap-2">
                    <svg
                      className={`w-4 h-4 text-slate-400 mt-0.5 sm:mt-1 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3
                          className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors truncate"
                          title={s.name ?? `Sprint #${s.id}`}
                        >
                          {s.name ?? `Sprint #${s.id}`}
                        </h3>
                        {dynamicStatus === "ACTIVE" && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        )}
                        {dynamicStatus === "COMPLETED" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Completed
                          </span>
                        )}
                        {dynamicStatus === "PLANNED" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Planned
                          </span>
                        )}
                        
                        {/* Done / Pending Summary */}
                        {ticketsInSprint.length > 0 && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 ml-1">
                            <span className="text-indigo-500">{doneCount} ticket{doneCount !== 1 ? 's' : ''} Done</span>
                            <span className="w-1 h-1 rounded-full bg-indigo-300" />
                            <span className="text-slate-500">{pendingCount} ticket{pendingCount !== 1 ? 's' : ''} Pending</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {formatDateRange(s.start_date, s.end_date)}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Add Ticket, Edit, Delete */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => { e.stopPropagation(); setCreateTicketSprintId(s.id); }}
                      className="text-[11px] py-1 px-2.5 h-7"
                      id={`add-ticket-sprint-${s.id}-btn`}
                      title="Add Ticket"
                    >
                      <svg className="w-3 h-3 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">Add Ticket</span>
                    </Button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(s); }}
                      id={`edit-sprint-${s.id}-btn`}
                      className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200/90 px-2 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      title="Edit sprint"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
                      id={`delete-sprint-${s.id}-btn`}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/90 px-2 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      title="Delete sprint"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expandable tickets in this sprint */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {ticketsInSprint.length} ticket{ticketsInSprint.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {ticketsInSprint.length === 0 ? (
                      <div className="py-3 px-2.5 text-center text-xs text-slate-400 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                        No tickets planned in this sprint yet.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {ticketsInSprint.map((ticket) => (
                          <div
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-200/70 hover:border-indigo-200/80 cursor-pointer transition-all group gap-2 sm:gap-3"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 shrink-0">
                                <PriorityIcon priority={ticket.priority} size="sm" />
                                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 sm:py-1 rounded-md">
                                  {projectPrefix}-{ticket.id}
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 truncate min-w-0">
                                {ticket.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 justify-between sm:justify-end w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                              {ticket.estimation && (
                                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/80 shrink-0">
                                  {ticket.estimation}
                                </span>
                              )}

                              <div className="shrink-0">
                                <TicketStatusBadge status={ticket.status} />
                              </div>
                              <div className="min-w-0 shrink">
                                <AssignmentFlowBadge author={ticket.author} assignee={ticket.assignee} size="sm" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketModal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          ticket={selectedTicket}
          onUpdated={(ticket) => {
            setSprintTickets((prev) => {
              const newMap = { ...prev };
              if (ticket.sprint_id && newMap[ticket.sprint_id]) {
                newMap[ticket.sprint_id] = newMap[ticket.sprint_id].map((t) => (t.id === ticket.id ? ticket : t));
              }
              return newMap;
            });
            setSelectedTicket(null);
          }}
          onDeleted={(id) => {
            setSprintTickets((prev) => {
              const newMap = { ...prev };
              Object.keys(newMap).forEach((key) => {
                newMap[Number(key)] = newMap[Number(key)].filter((t) => t.id !== id);
              });
              return newMap;
            });
            setSelectedTicket(null);
          }}
          projectOwnerId={projectOwnerId}
          projectPrefix={projectPrefix}
        />
      )}

      {/* Reusable Create Sprint Modal */}
      <CreateSprintModal
        isOpen={createSprintOpen}
        onClose={() => setCreateSprintOpen(false)}
        onCreated={() => {
          setCreateSprintOpen(false);
          loadData();
        }}
        projectId={pid}
      />

      {/* Create Ticket Modal for Sprint */}
      {createTicketSprintId && (
        <CreateTicketModal
          isOpen={!!createTicketSprintId}
          onClose={() => setCreateTicketSprintId(null)}
          onCreated={() => {
            setCreateTicketSprintId(null);
            loadData();
          }}
          projectId={pid}
          members={members}
          sprints={sprints}
          defaultSprintId={createTicketSprintId}
          onRequestCreateSprint={() => {
            setCreateTicketSprintId(null);
            setCreateSprintOpen(true);
          }}
        />
      )}

      {/* Edit Modal */}
      {(() => {
        const now = new Date();
        return (
          <Modal isOpen={!!editSprint} onClose={() => setEditSprint(null)} title="Edit Sprint" subtitle="Update sprint details or cycle dates.">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input id="edit-sprint-name" label="Sprint Name" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} />

          {/* Duration Selector */}
          <Select
            id="edit-sprint-duration"
            label="Sprint Duration"
            value={(() => {
              if (!formData.start_date || !formData.end_date) return "";
              const start = new Date(formData.start_date);
              const end = new Date(formData.end_date);
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 7) return "7";
              if (diffDays === 14) return "14";
              if (diffDays === 21) return "21";
              if (diffDays === 28) return "28";
              return "";
            })()}
            onChange={(e) => {
              if (e.target.value && formData.start_date) {
                const start = new Date(formData.start_date);
                start.setDate(start.getDate() + parseInt(e.target.value));
                setFormData((f) => ({ ...f, end_date: start.toISOString().slice(0, 10) }));
              }
            }}
            placeholder="Select duration..."
            options={[
              { value: "7", label: "1 Week" },
              { value: "14", label: "2 Weeks" },
              { value: "21", label: "3 Weeks" },
              { value: "28", label: "4 Weeks" },
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="edit-sprint-start"
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData((f) => ({ ...f, start_date: e.target.value }))}
              min={(() => {
                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
              })()}
            />
            <Input
              id="edit-sprint-end"
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData((f) => ({ ...f, end_date: e.target.value }))}
              min={formData.start_date || (() => {
                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
              })()}
            />
          </div>
          {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
        );
      })()}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Sprint" message={`Delete "${deleteTarget?.name ?? `Sprint #${deleteTarget?.id}`}"? All tickets will return to the backlog.`} confirmLabel="Delete" />
    </div>
  );
}
