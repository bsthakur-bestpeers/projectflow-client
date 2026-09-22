"use client";
import { useEffect, useState } from "react";
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
  project: Project | null;
  onUpdated: (project: Project) => void;
}

export default function EditProjectModal({ isOpen, onClose, project, onUpdated }: Props) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setNameError("");
    }
  }, [project, isOpen]);

  const handleClose = () => {
    setNameError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
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
      const updated = await projectsApi.update(project.id, {
        name: trimmed,
        description: description.trim() || undefined,
      });
      onUpdated(updated);
      handleClose();
      dispatch(addToast({ type: "success", message: `Project "${updated.name}" updated successfully!` }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update project.";
      setNameError(message);
      dispatch(addToast({ type: "error", message }));
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Project" subtitle="Update the project name and description.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="edit-project-name"
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
          id="edit-project-description"
          label="Description (optional)"
          placeholder="What is the goal of this project?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { EditProjectModal };

