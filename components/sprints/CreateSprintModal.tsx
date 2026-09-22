"use client";
import { useState, useEffect } from "react";
import { useAppDispatch } from "@/store";
import { addToast } from "@/store/uiSlice";
import { sprintsApi, projectsApi } from "@/services/api";
import { Sprint, Project } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (sprint: Sprint) => void;
  projectId: number;
}

/** Returns today's date as YYYY-MM-DD in local time */
function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Given a YYYY-MM-DD string, returns the next calendar day as YYYY-MM-DD */
function getNextDay(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

/** Add N days to a YYYY-MM-DD string, returns YYYY-MM-DD */
function addDaysToDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

const DURATION_OPTIONS = [
  { value: "7", label: "1 Week" },
  { value: "14", label: "2 Weeks" },
  { value: "21", label: "3 Weeks" },
  { value: "28", label: "4 Weeks" },
];

export default function CreateSprintModal({ isOpen, onClose, onCreated, projectId }: Props) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ? projectId.toString() : "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState("");
  const [minStartDate, setMinStartDate] = useState("");
  const [projectError, setProjectError] = useState("");
  const [formError, setFormError] = useState("");

  const today = getTodayStr();

  // The effective minimum for start date: max of today and minStartDate (from last sprint)
  const effectiveMinStart = minStartDate && minStartDate > today ? minStartDate : today;

  // When duration or startDate changes, auto-calculate endDate
  useEffect(() => {
    if (duration && startDate) {
      const days = parseInt(duration);
      setEndDate(addDaysToDate(startDate, days));
    }
  }, [duration, startDate]);

  // Fetch sprints for the target project and auto-populate dates
  const loadSprintsAndSetDates = async (targetProjId: number) => {
    try {
      const sprints: Sprint[] = await sprintsApi.listByProject(targetProjId);
      if (sprints && sprints.length > 0) {
        // Find sprint with the latest end_date
        let latestEndDate = "";
        for (const s of sprints) {
          const endStr = new Date(s.end_date).toISOString().slice(0, 10);
          if (endStr > latestEndDate) {
            latestEndDate = endStr;
          }
        }
        if (latestEndDate) {
          const nextDayStr = getNextDay(latestEndDate);
          // Use the later of nextDayStr or today
          const effectiveStart = nextDayStr > today ? nextDayStr : today;
          setMinStartDate(nextDayStr);
          setStartDate(effectiveStart);
          // endDate will be auto-set via the useEffect above
        }
      } else {
        // No existing sprints — default to today
        setMinStartDate("");
        setStartDate(today);
      }
    } catch {
      // Silently fail — dates can still be manually entered
      setStartDate(today);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (projectId) {
        setSelectedProjectId(projectId.toString());
        loadSprintsAndSetDates(projectId);
      } else {
        projectsApi
          .list(1, 100)
          .then((res) => {
            let list: Project[] = [];
            if (Array.isArray(res)) list = res;
            else if (res && Array.isArray((res as any).projects)) list = (res as any).projects;
            else if (res && Array.isArray((res as any).data)) list = (res as any).data;
            setProjects(list);
            if (list.length === 1) {
              setSelectedProjectId(list[0].id.toString());
              loadSprintsAndSetDates(list[0].id);
            } else {
              setSelectedProjectId("");
              setStartDate(today);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, projectId]);

  const reset = () => {
    setName("");
    setStartDate("");
    setEndDate("");
    setDuration("");
    setMinStartDate("");
    setSelectedProjectId(projectId ? projectId.toString() : "");
    setProjectError("");
    setFormError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasErr = false;

    const targetProjectId = projectId || (selectedProjectId ? parseInt(selectedProjectId) : 0);

    if (!targetProjectId) {
      setProjectError("Project Name is mandatory. Please select a project.");
      hasErr = true;
    } else {
      setProjectError("");
    }

    if (!startDate || !endDate) {
      setFormError("Start date and end date are required");
      hasErr = true;
    } else if (startDate < today) {
      setFormError("Start date cannot be in the past.");
      hasErr = true;
    } else if (endDate < today) {
      setFormError("End date cannot be in the past.");
      hasErr = true;
    } else if (new Date(startDate) > new Date(endDate)) {
      setFormError("Start date cannot be after end date");
      hasErr = true;
    } else if (minStartDate && startDate < minStartDate) {
      setFormError(`Start date must be on or after ${minStartDate} (the day after the last sprint ends).`);
      hasErr = true;
    } else {
      setFormError("");
    }

    if (hasErr) return;

    setLoading(true);

    try {
      const sprint = await sprintsApi.create(targetProjectId, {
        name: name.trim() || undefined,
        start_date: startDate,
        end_date: endDate,
      });
      onCreated(sprint);
      handleClose();
      dispatch(addToast({ type: "success", message: `Sprint "${sprint.name ?? `Sprint #${sprint.id}`}" created!` }));
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create sprint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Sprint" subtitle="Plan a new sprint cycle to schedule and work on tickets.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!projectId && (
          <Select
            id="modal-sprint-project"
            label="Project Name *"
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              setProjectError("");
              if (e.target.value) {
                loadSprintsAndSetDates(parseInt(e.target.value));
              }
            }}
            placeholder="Select a project..."
            error={projectError}
            options={projects.map((p) => ({
              value: p.id.toString(),
              label: p.name,
            }))}
          />
        )}

        <Input
          id="modal-sprint-name"
          label="Sprint Name (optional)"
          placeholder="e.g. Sprint 1 — User Authentication"
          value={name}
          onChange={(e) => setName(e.target.value)}
          hint="Leave blank to auto-generate (e.g. Sprint 1)"
          autoFocus
        />

        {/* Duration Selector */}
        <Select
          id="modal-sprint-duration"
          label="Sprint Duration (optional)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Select duration..."
          options={DURATION_OPTIONS}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="modal-sprint-start"
            label="Start Date *"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={effectiveMinStart}
            required
          />
          <Input
            id="modal-sprint-end"
            label="End Date *"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setDuration("");
            }}
            min={startDate || effectiveMinStart}
            required
          />
        </div>
        {duration && startDate && endDate && (
          <p className="text-[11px] text-slate-500 -mt-2">
            End date auto-calculated: <span className="font-semibold text-slate-700">{endDate}</span>
          </p>
        )}

        {formError && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
            {formError}
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="px-5">
            Create Sprint
          </Button>
        </div>
      </form>
    </Modal>
  );
}
