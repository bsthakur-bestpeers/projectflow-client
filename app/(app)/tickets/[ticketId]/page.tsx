"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { ticketsApi, membersApi, sprintsApi, projectsApi, usersApi } from "@/services/api";
import { Ticket, Member, Sprint } from "@/types";
import { TICKET_STATUS, TICKET_STATUS_LABELS } from "@/constants";
import { PageSpinner, ErrorState, Avatar } from "@/components/ui/Misc";
import { ConfirmDialog } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import TiptapEditor from "@/components/tickets/TiptapEditor";
import { timeAgo, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: number; full_name: string; email: string }[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projectOwnerId, setProjectOwnerId] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [estimation, setEstimation] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [sprintId, setSprintId] = useState("");

  useEffect(() => {
    ticketsApi.getById(parseInt(ticketId)).then(async (t) => {
      setTicket(t);
      setTitle(t.title);
      setDescription(t.description ?? "");
      setStatus(t.status);
      setEstimation(t.estimation ?? "");
      setAssigneeId(t.assignee_id?.toString() ?? "");
      setSprintId(t.sprint_id?.toString() ?? "");

      const [m, sp, p, u] = await Promise.all([
        membersApi.list(t.project_id).catch(() => []),
        sprintsApi.listByProject(t.project_id).catch(() => []),
        projectsApi.getById(t.project_id).catch(() => ({ created_by: 0 })),
        usersApi.list().catch(() => []),
      ]);
      setMembers(m);
      setSprints(sp);
      setProjectOwnerId((p as any).created_by);
      if (Array.isArray(u) && u.length > 0) setAllUsers(u);
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticketId]);

  const userList = allUsers.length > 0 ? allUsers : members;

  const handleSave = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      const updated = await ticketsApi.update(ticket.id, {
        title, description, status, estimation: estimation || null,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        sprintId: sprintId ? parseInt(sprintId) : null,
      });
      setTicket(updated);
      dispatch(addToast({ type: "success", message: "Ticket saved." }));
    } catch (err: unknown) {
      dispatch(addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to save." }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    setDeleting(true);
    try {
      await ticketsApi.delete(ticket.id);
      dispatch(addToast({ type: "success", message: "Ticket deleted." }));
      router.push(`/projects/${ticket.project_id}/backlog`);
    } catch (err: unknown) {
      dispatch(addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to delete." }));
      setDeleting(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (error || !ticket) return <div className="p-6"><ErrorState message={error ?? "Ticket not found"} /></div>;

  const canDelete = projectOwnerId === user?.id || ticket.author_id === user?.id;

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 min-h-screen">
      <div className="mb-5">
        <Link href={`/projects/${ticket.project_id}/backlog`} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Project
        </Link>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="mb-6">
          <Input id="ticket-detail-title" value={title} onChange={(e) => setTitle(e.target.value)} className="text-xl sm:text-2xl font-extrabold !border-transparent hover:!border-slate-200 focus:!border-indigo-500 !px-2" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
          <Select id="td-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={TICKET_STATUS.map((s) => ({ value: s, label: TICKET_STATUS_LABELS[s] }))} />
          <Input id="td-estimation" label="Estimation" value={estimation} onChange={(e) => setEstimation(e.target.value)} placeholder="e.g. 1h, 2d" />
          <Select id="td-assignee" label="Assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} placeholder="Unassigned" options={userList.map((m) => ({ value: m.id.toString(), label: m.full_name }))} />
          <Select id="td-sprint" label="Sprint" value={sprintId} onChange={(e) => setSprintId(e.target.value)} placeholder="Backlog" options={sprints.map((s) => ({ value: s.id.toString(), label: s.name ?? `Sprint #${s.id}` }))} />
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
          <TiptapEditor key={`ticket-${ticket.id}`} content={description} onChange={setDescription} />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 pb-6 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <Avatar name={ticket.author.full_name} size="sm" />
            <span>Created by <strong className="text-slate-800">{ticket.author.full_name}</strong></span>
          </div>
          <span>·</span>
          <span>{formatDate(ticket.created_at)}</span>
          <span>·</span>
          <span>Updated {timeAgo(ticket.updated_at)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>{canDelete && <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Delete Ticket</Button>}</div>
          <Button onClick={handleSave} loading={saving} id="save-ticket-btn">Save Changes</Button>
        </div>
      </div>

      <ConfirmDialog isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete} title="Delete Ticket" message={`Delete "${ticket.title}"? This cannot be undone.`} confirmLabel="Delete" loading={deleting} />
    </div>
  );
}
