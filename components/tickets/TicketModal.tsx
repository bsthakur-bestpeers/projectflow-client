"use client";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { ticketsApi, membersApi, sprintsApi } from "@/services/api";
import { Ticket, Member, Sprint } from "@/types";
import { ESTIMATION_OPTIONS, TICKET_STATUS, TICKET_STATUS_LABELS } from "@/constants";
import { TicketStatusBadge, AssignmentFlowBadge } from "@/components/ui/Badge";
import { timeAgo, formatDate } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import TiptapEditor from "./TiptapEditor";

interface Props {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (ticket: Ticket) => void;
  onDeleted: (ticketId: number) => void;
  projectOwnerId: number;
  projectPrefix?: string;
}

export default function TicketModal({ ticket, isOpen, onClose, onUpdated, onDeleted, projectOwnerId, projectPrefix = "PF" }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [members, setMembers] = useState<Member[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description ?? "");
  const [status, setStatus] = useState(ticket.status);
  const [estimation, setEstimation] = useState(ticket.estimation ?? "");
  const [assigneeId, setAssigneeId] = useState(ticket.assignee_id?.toString() ?? "");
  const [authorId, setAuthorId] = useState(ticket.author_id?.toString() ?? "");
  const [sprintId, setSprintId] = useState(ticket.sprint_id?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = projectOwnerId === user?.id;
  const isAuthor = ticket.author_id === user?.id;
  const canDelete = true;

  useEffect(() => {
    if (!isOpen) return;
    membersApi.list(ticket.project_id).then(setMembers).catch(() => { });
    sprintsApi.listByProject(ticket.project_id).then(setSprints).catch(() => { });
  }, [isOpen, ticket.project_id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await ticketsApi.update(ticket.id, {
        title,
        description,
        status,
        estimation: estimation || null,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        authorId: authorId ? parseInt(authorId) : undefined,
        sprintId: sprintId ? parseInt(sprintId) : null,
      });
      onUpdated(updated);
      dispatch(addToast({ type: "success", message: "Ticket updated." }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update ticket.";
      dispatch(addToast({ type: "error", message }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ticketsApi.delete(ticket.id);
      onDeleted(ticket.id);
      setDeleteOpen(false);
      onClose();
      dispatch(addToast({ type: "success", message: "Ticket deleted." }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete ticket.";
      dispatch(addToast({ type: "error", message }));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Ticket ${projectPrefix}-${ticket.id}`} 
        subtitle="View and edit ticket details, assignee, status, and estimation." 
        size="full"
        externalLink={`/tickets/${ticket.id}`}
      >
        <div className="space-y-5">
          {/* Status & Sprint Summary Badges */}
          <div className="flex items-center gap-3 flex-wrap bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500">Ticket Status:</span>
              <TicketStatusBadge status={status} />
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500">Sprint:</span>
              <span className="font-semibold text-slate-800">
                {sprints.find((s) => s.id.toString() === sprintId)?.name ?? (ticket.sprint?.name ?? `Sprint #${ticket.sprint_id ?? "-"}`)}
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-500">Flow:</span>
              <AssignmentFlowBadge author={ticket.author} assignee={ticket.assignee} size="sm" />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-tight">Title *</label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base font-bold text-slate-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-tight">Description</label>
            <TiptapEditor content={description} onChange={setDescription} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
            <Select
              id="ticket-status"
              label="Status *"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={TICKET_STATUS.map((s) => ({ value: s, label: TICKET_STATUS_LABELS[s] }))}
            />
            <Select
              id="ticket-assignee"
              label="Assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder="Unassigned"
              options={members.map((m) => ({ value: m.id.toString(), label: m.full_name }))}
            />
            <Input
              id="ticket-author"
              label="Author (Reporter)"
              value={ticket.author.full_name}
              disabled
              className="bg-slate-100/50 text-slate-500 cursor-not-allowed"
            />
            <Input
              id="ticket-estimation"
              label="Estimation (1h, 1d)"
              value={estimation}
              onChange={(e) => setEstimation(e.target.value)}
              placeholder="e.g. 1h, 2d"
            />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100 flex-wrap">
            <span>Created by <span className="font-semibold text-slate-800">{ticket.author.full_name}</span></span>
            <span>·</span>
            <span>Created {formatDate(ticket.created_at)}</span>
            <span>·</span>
            <span>Updated {timeAgo(ticket.updated_at)}</span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              {canDelete && (
                <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Delete Ticket</Button>
              )}
            </div>
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>Save Changes</Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Ticket"
        message={`Are you sure you want to delete "${ticket.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </>
  );
}
