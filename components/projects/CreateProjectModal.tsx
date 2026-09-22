"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store";
import { addToast } from "@/store/uiSlice";
import { projectsApi } from "@/services/api";
import { Project } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (project: Project) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onCreated }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  const handleClose = () => {
    setName("");
    setDescription("");
    setNameError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Project name is required");
      dispatch(addToast({ type: "error", message: "Project name is required." }));
      return;
    }
    if (trimmed.length < 2) {
      setNameError("Project name must be at least 2 characters");
      dispatch(addToast({ type: "error", message: "Project name must be at least 2 characters." }));
      return;
    }
    setNameError("");
    setLoading(true);
    try {
      const project = await projectsApi.create({ name: trimmed, description: description.trim() || undefined });
      onCreated?.(project);
      handleClose();
      dispatch(addToast({ type: "success", message: `Project "${project.name}" created successfully!` }));
      router.push(`/projects/${project.id}/board`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create project.";
      setNameError(message);
      dispatch(addToast({ type: "error", message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project" subtitle="Set up a workspace for your team to plan sprints and track tickets.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="new-project-name"
          label="Project Name"
          required
          placeholder="e.g. Mobile App Redesign"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError("");
          }}
          error={nameError}
          autoFocus
        />
        <Textarea
          id="new-project-description"
          label="Description (optional)"
          placeholder="What is the goal of this project?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Project</Button>
        </div>
      </form>
    </Modal>
  );
}

export { CreateProjectModal };
