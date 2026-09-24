"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/store";
import { addToast } from "@/store/uiSlice";
import { projectsApi } from "@/services/api";
import { Project } from "@/types";
import { PageSpinner, ErrorState } from "@/components/ui/Misc";
import { ConfirmDialog } from "@/components/ui/Modal";
import EditProjectModal from "@/components/projects/EditProjectModal";
import ImportProjectModal from "@/components/projects/ImportProjectModal";
import ProjectTabs from "@/components/layout/ProjectTabs";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    projectsApi.getById(parseInt(projectId))
      .then(setProject)
      .catch((e) => setError(e.message || "Failed to load project"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleExport = async () => {
    if (!project) return;
    setExporting(true);
    try {
      await projectsApi.exportXlsx(project.id, project.name);
      dispatch(addToast({ type: "success", message: `Project "${project.name}" exported successfully!` }));
    } catch (err) {
      dispatch(addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to export project." }));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    setDeleting(true);
    try {
      await projectsApi.delete(project.id);
      dispatch(addToast({ type: "success", message: `Project "${project.name}" deleted successfully.` }));
      router.push("/projects");
    } catch (err) {
      dispatch(addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to delete project." }));
      setDeleting(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (error || !project) return (
    <div className="p-6">
      <ErrorState message={error ?? "Project not found"} onRetry={() => window.location.reload()} />
    </div>
  );

  const isOwner = project.created_by === user?.id;

  return (
    <div className="min-h-full flex flex-col">
      {/* Project Top Header */}
      <div className="px-3 sm:px-6 pt-3.5 sm:pt-5 pb-3 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/projects" className="hover:text-indigo-600 transition-colors font-medium">
            Projects
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold truncate">{project.name}</span>
        </div>

        <div className="flex items-center justify-between gap-2.5 sm:gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-sm sm:text-base shadow-md shadow-indigo-500/20 shrink-0">
              {project.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
                  {project.name}
                </h1>
                {isOwner ? (
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-full shrink-0">
                    Owner
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/60 px-2 py-0.5 rounded-full shrink-0">
                    Assigned
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
              title="Export project to Excel (.xlsx)"
            >
              {exporting ? (
                <svg className="w-3.5 h-3.5 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              <span>{exporting ? "Exporting..." : "Export"}</span>
            </button>

            {/* Import Button */}
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
              title="Import sprints & tickets from Excel (.xlsx)"
            >
              <svg className="w-3.5 h-3.5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import</span>
            </button>

            {isOwner && (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100/90 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Edit Project"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
                  title="Delete Project"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ProjectTabs projectId={projectId} />

      <div className="flex-1 bg-transparent">{children}</div>

      <EditProjectModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        project={project}
        onUpdated={(updated) => {
          setProject((prev) => (prev ? { ...prev, ...updated } : updated));
        }}
      />

      <ImportProjectModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        projectId={project.id}
        onSuccess={() => window.location.reload()}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? All associated sprints, tickets, and memberships will be permanently removed.`}
        confirmLabel="Delete Project"
        loading={deleting}
      />
    </div>
  );
}
