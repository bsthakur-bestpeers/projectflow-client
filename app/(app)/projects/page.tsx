"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { projectsApi } from "@/services/api";
import { Project } from "@/types";
import { PageSpinner, EmptyState, ProjectsPageSkeleton } from "@/components/ui/Misc";
import Button from "@/components/ui/Button";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import EditProjectModal from "@/components/projects/EditProjectModal";
import ImportProjectModal from "@/components/projects/ImportProjectModal";
import { ConfirmDialog } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

const projectColors = [
  "from-indigo-500 to-indigo-600",
  "from-purple-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

export default function ProjectsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState<"owned" | "assigned">("owned");
  const [search, setSearch] = useState("");

  const loadProjects = () => {
    projectsApi.list(1, 50)
      .then((data) => setProjects(data.projects || []))
      .catch(() => dispatch(addToast({ type: "error", message: "Failed to load projects." })))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await projectsApi.delete(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      dispatch(addToast({ type: "success", message: `Project "${deleteTarget.name}" deleted successfully.` }));
      setDeleteTarget(null);
    } catch (err) {
      dispatch(addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to delete project." }));
    } finally {
      setDeleting(false);
    }
  };

  const createdProjects = projects.filter((p) => p.created_by === user?.id);
  const assignedProjects = projects.filter((p) => p.created_by !== user?.id);

  const filterBySearch = (list: Project[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  };

  const activeList = filter === "owned" ? createdProjects : assignedProjects;
  const displayedList = filterBySearch(activeList);

  const renderCard = (p: Project, idx: number) => {
    const isOwned = p.created_by === user?.id;
    const gradient = projectColors[idx % projectColors.length];
    return (
      <Link
        key={p.id}
        href={`/projects/${p.id}/board`}
        className="group bg-white border border-slate-200/90 hover:border-indigo-400/90 rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between shadow-2xs"
      >
        <div>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white text-sm font-extrabold shadow-sm`}>
                {p.name[0]}
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                  {p.name}
                </h2>
                {!isOwned && p.owner && (
                  <p className="text-[11px] text-slate-400 mt-0.5">Owner: {p.owner.full_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isOwned ? (
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-0.5 rounded-md">
                  Owner
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 px-2.5 py-0.5 rounded-md">
                  Assigned
                </span>
              )}
              {isOwned && (
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    type="button"
                    title="Edit Project"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditTarget(p);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Delete Project"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget(p);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          {p.description && (
            <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed">
              {p.description}
            </p>
          )}
        </div>
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex gap-2.5 text-[11px] font-medium text-slate-500">
            <span>{p._count?.tickets ?? 0} tickets</span>
            <span>·</span>
            <span>{p._count?.sprints ?? 0} sprints</span>
            <span>·</span>
            <span>{p._count?.members ?? 0} members</span>
          </div>
          <span className="text-indigo-600 font-semibold text-xs group-hover:translate-x-1 transition-transform">
            Open →
          </span>
        </div>
      </Link>
    );
  };

  if (loading) return <ProjectsPageSkeleton />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {createdProjects.length} created · {assignedProjects.length} assigned
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setImportOpen(true)}
            className="border-slate-200/90 text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 shadow-2xs font-semibold text-xs py-2 px-3 sm:px-4"
            id="projects-import-btn"
          >
            <svg className="w-3.5 h-3.5 text-indigo-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Excel
          </Button>

          {user?.role === "ADMIN" ? (
            <Link href="/admin/users">
              <Button variant="secondary" className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100">
                <svg className="w-4 h-4 text-purple-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Admin Console
              </Button>
            </Link>
          ) : (
            <Button onClick={() => setCreateOpen(true)} id="projects-create-btn">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Controls: 2 Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 shadow-2xs">
          <button
            type="button"
            onClick={() => setFilter("owned")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2",
              filter === "owned"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
            )}
          >
            <span>Created by You</span>
            <span
              className={cn(
                "text-[11px] font-bold px-1.5 py-0.5 rounded-md transition-colors",
                filter === "owned"
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                  : "bg-slate-200/70 text-slate-600"
              )}
            >
              {createdProjects.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("assigned")}
            className={cn(
              "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2",
              filter === "assigned"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
            )}
          >
            <span>Assigned to You</span>
            <span
              className={cn(
                "text-[11px] font-bold px-1.5 py-0.5 rounded-md transition-colors",
                filter === "assigned"
                  ? "bg-sky-50 text-sky-700 border border-sky-100"
                  : "bg-slate-200/70 text-slate-600"
              )}
            >
              {assignedProjects.length}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder={filter === "owned" ? "Search created projects..." : "Search assigned projects..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200/90 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none w-full sm:w-64 shadow-2xs transition-all"
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
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title={user?.role === "ADMIN" ? "No projects in workspace" : "No projects yet."}
          description={
            user?.role === "ADMIN"
              ? "Administrators manage accounts and registration approvals. Projects are created and managed by team members."
              : "Create your first project to start managing tasks and sprints with your team."
          }
          action={
            user?.role === "ADMIN" ? (
              <Link href="/admin/users">
                <Button variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                  Open Admin Console
                </Button>
              </Link>
            ) : (
              <Button onClick={() => setCreateOpen(true)}>Create Project</Button>
            )
          }
          icon={
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs mb-2">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          }
        />
      ) : displayedList.length === 0 ? (
        <div className="bg-white/80 border border-dashed border-slate-300 rounded-2xl p-12 text-center shadow-2xs">
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            {search.trim()
              ? `No projects matching "${search}" in ${filter === "owned" ? "Created by You" : "Assigned to You"}.`
              : filter === "owned"
              ? user?.role === "ADMIN"
                ? "Admin users do not create projects. Manage users and registrations in the Admin Console."
                : "You haven't created any projects yet."
              : "No projects have been assigned to you yet."}
          </p>
          {filter === "owned" && !search.trim() && user?.role !== "ADMIN" && (
            <Button onClick={() => setCreateOpen(true)} className="mt-4" size="sm">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="max-h-[calc(100vh-230px)] overflow-y-auto pr-1 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayedList.map((p, idx) => renderCard(p, idx))}
          </div>
        </div>
      )}

      <CreateProjectModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(p) => {
          setProjects((prev) => [p, ...prev]);
        }}
      />

      <ImportProjectModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={loadProjects}
      />

      <EditProjectModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        project={editTarget}
        onUpdated={(updated) => {
          setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated sprints, tickets, and memberships will be permanently removed.`}
        confirmLabel="Delete Project"
        loading={deleting}
      />
    </div>
  );
}
