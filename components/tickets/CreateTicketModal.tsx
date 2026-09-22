"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { ticketsApi } from "@/services/api";
import { Ticket, Member, Sprint } from "@/types";
import { ESTIMATION_OPTIONS } from "@/constants";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import TiptapEditor from "./TiptapEditor";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (ticket: Ticket) => void;
  projectId: number;
  members: Member[];
  sprints: Sprint[];
  defaultSprintId?: number | null;
  onRequestCreateSprint?: () => void;
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  onCreated,
  projectId,
  members,
  sprints,
  defaultSprintId,
  onRequestCreateSprint,
}: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimation, setEstimation] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [authorId, setAuthorId] = useState(currentUser?.id.toString() ?? "");
  const [titleError, setTitleError] = useState("");



  const reset = () => {
    setTitle("");
    setDescription("");
    setEstimation("");
    setAssigneeId("");
    setAuthorId(currentUser?.id.toString() ?? "");
    setTitleError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    if (!title.trim()) {
      setTitleError("Title is required");
      hasError = true;
    } else {
      setTitleError("");
    }

    if (hasError) return;

    setLoading(true);
    try {
      const ticket = await ticketsApi.create(projectId, {
        title: title.trim(),
        description: description || undefined,
        estimation: estimation || undefined,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        authorId: authorId ? parseInt(authorId) : undefined,
        sprintId: defaultSprintId !== undefined ? defaultSprintId : (sprints.length > 0 ? sprints[0].id : null),
      });
      onCreated(ticket);
      handleClose();
      dispatch(addToast({ type: "success", message: `Ticket "${ticket.title}" created!` }));
      router.push(`/projects/${projectId}/board`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create ticket.";
      dispatch(addToast({ type: "error", message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Ticket"
      subtitle="Add a new task or story to a project sprint."
      size="full"
      externalLink="#"
    >
      {sprints.length === 0 && defaultSprintId !== null ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-xl font-bold">
            ⚡
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">No Sprints Available</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tickets must be assigned to a sprint. Please create a sprint first before adding tickets.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            {onRequestCreateSprint && (
              <Button
                onClick={() => {
                  handleClose();
                  onRequestCreateSprint();
                }}
              >
                Create Sprint First
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="new-ticket-title"
            label="Title *"
            placeholder="e.g. Implement user authentication flow"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={titleError}
            autoFocus
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-tight">Description</label>
            <TiptapEditor
              content={description}
              onChange={setDescription}
              placeholder="Add details, acceptance criteria, links, or code blocks..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
            <Select
              id="new-ticket-assignee"
              label="Assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder="Unassigned"
              options={members.map((m) => ({ value: m.id.toString(), label: m.full_name }))}
            />
            <Input
              id="new-ticket-author"
              label="Author (Reporter)"
              value={currentUser?.full_name ?? "Unknown"}
              disabled
              className="bg-slate-100/50 text-slate-500 cursor-not-allowed"
            />
            <Input
              id="new-ticket-estimation"
              label="Estimation (1h, 1d)"
              value={estimation}
              onChange={(e) => setEstimation(e.target.value)}
              placeholder="e.g. 1h, 2d"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="px-5">
              Create Ticket
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
