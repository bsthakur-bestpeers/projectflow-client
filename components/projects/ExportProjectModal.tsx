"use client";
import { useState, useEffect, useMemo } from "react";
import { useAppDispatch } from "@/store";
import { addToast } from "@/store/uiSlice";
import { projectsApi } from "@/services/api";
import { Project } from "@/types";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  defaultProjectId?: number;
}

const projectColors = [
  "from-indigo-500 to-indigo-600",
  "from-purple-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

export default function ExportProjectModal({
  isOpen,
  onClose,
  projects,
  defaultProjectId,
}: Props) {
  const dispatch = useAppDispatch();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  // Initialize selection
  useEffect(() => {
    if (isOpen) {
      if (defaultProjectId && projects.some((p) => p.id === defaultProjectId)) {
        setSelectedIds([defaultProjectId]);
      } else {
        // Default to all selected for convenient batch export
        setSelectedIds(projects.map((p) => p.id));
      }
      setSearch("");
    }
  }, [isOpen, defaultProjectId, projects]);

  const filteredProjects = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase().trim();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, search]);

  const isAllSelected =
    filteredProjects.length > 0 &&
    filteredProjects.every((p) => selectedIds.includes(p.id));

  const isIndeterminate =
    filteredProjects.some((p) => selectedIds.includes(p.id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all visible in filter
      const visibleIds = new Set(filteredProjects.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      // Select all visible in filter
      const newSelected = new Set(selectedIds);
      filteredProjects.forEach((p) => newSelected.add(p.id));
      setSelectedIds(Array.from(newSelected));
    }
  };

  const toggleProject = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalTicketsSelected = useMemo(() => {
    return projects
      .filter((p) => selectedIds.includes(p.id))
      .reduce((sum, p) => sum + (p._count?.tickets ?? 0), 0);
  }, [projects, selectedIds]);

  const totalSprintsSelected = useMemo(() => {
    return projects
      .filter((p) => selectedIds.includes(p.id))
      .reduce((sum, p) => sum + (p._count?.sprints ?? 0), 0);
  }, [projects, selectedIds]);

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      dispatch(addToast({ type: "error", message: "Please select at least one project to export." }));
      return;
    }

    setExporting(true);
    try {
      if (selectedIds.length === 1) {
        const single = projects.find((p) => p.id === selectedIds[0]);
        await projectsApi.exportXlsx(selectedIds[0], single?.name || "Project");
        dispatch(
          addToast({
            type: "success",
            message: `Project "${single?.name}" exported successfully!`,
          })
        );
      } else {
        await projectsApi.exportMultipleXlsx(selectedIds);
        dispatch(
          addToast({
            type: "success",
            message: `Exported ${selectedIds.length} projects successfully into Excel!`,
          })
        );
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to export projects.";
      dispatch(addToast({ type: "error", message }));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Projects to Excel"
      subtitle="Select multiple projects to download their info, sprints, and tickets in a structured .xlsx file."
      size="lg"
    >
      <div className="space-y-3.5">
        {/* Search & Selection Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={toggleSelectAll}
                disabled={exporting || filteredProjects.length === 0}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">
                Select All
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                ({filteredProjects.length})
              </span>
            </label>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-slate-400 hover:text-indigo-600 font-semibold underline transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Counter Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 px-2.5 py-0.5 rounded-full">
              {selectedIds.length} of {projects.length} selected
            </span>
          </div>
        </div>

        {/* Search Input if more than 3 projects */}
        {projects.length > 3 && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={exporting}
              className="w-full pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200/90 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs"
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
        )}

        {/* Scrollable Projects Multi-Select List */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 -mr-1 border border-slate-200/80 rounded-xl p-2 bg-slate-50/50">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No projects found matching &quot;{search}&quot;.
            </div>
          ) : (
            filteredProjects.map((p, idx) => {
              const isChecked = selectedIds.includes(p.id);
              const gradient = projectColors[idx % projectColors.length];
              return (
                <div
                  key={p.id}
                  onClick={() => !exporting && toggleProject(p.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? "bg-white border-indigo-500/80 shadow-xs ring-1 ring-indigo-500/20"
                      : "bg-white/80 border-slate-200/70 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by container onClick
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                    />
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs`}
                    >
                      {p.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {p.name}
                        </span>
                        {p.owner && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {p.owner.full_name}
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-[11px] text-slate-500 truncate">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 shrink-0 ml-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                      {p._count?.tickets ?? 0} tickets
                    </span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 hidden sm:inline">
                      {p._count?.sprints ?? 0} sprints
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Summary Cards */}
        {selectedIds.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects</p>
              <p className="text-sm font-extrabold text-indigo-600">{selectedIds.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sprints</p>
              <p className="text-sm font-extrabold text-slate-800">{totalSprintsSelected}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
              <p className="text-sm font-extrabold text-slate-800">{totalTicketsSelected}</p>
            </div>
          </div>
        )}

        {/* Informational Banner */}
        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-xl p-2.5 text-xs text-emerald-900 flex items-start gap-2">
          <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-[11px] text-emerald-800 leading-snug">
            {selectedIds.length === 1 ? (
              <span>
                Exporting <strong>1 project</strong>. Sprints and tickets (including backlog) will include the Project Name.
              </span>
            ) : selectedIds.length > 1 ? (
              <span>
                Exporting <strong>{selectedIds.length} projects</strong> into a single combined Excel file. Every sprint, ticket, and backlog item will be clearly tagged with its <strong>Project Name</strong>.
              </span>
            ) : (
              <span className="text-rose-600 font-medium">Please check at least one project above to export.</span>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={exporting}
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={exporting || selectedIds.length === 0}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
          >
            {exporting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin mr-1.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 mr-1.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export {selectedIds.length > 0 ? `(${selectedIds.length})` : ""} (.xlsx)
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
