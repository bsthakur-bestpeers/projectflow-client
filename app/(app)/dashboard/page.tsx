"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { projectsApi, ticketsApi, sprintsApi } from "@/services/api";
import { APP_NAME } from "@/constants";
import { Project, Ticket, Sprint } from "@/types";
import { formatDate, timeAgo, cn } from "@/lib/utils";
import { PageSpinner, Avatar, DashboardSkeleton } from "@/components/ui/Misc";
import { TicketStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { CreateProjectModal } from "@/components/projects";

const projectColors = [
  "from-indigo-500 to-indigo-600",
  "from-purple-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeSprints, setActiveSprints] = useState<Sprint[]>([]);
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [projectFilter, setProjectFilter] = useState<"all" | "owned" | "assigned">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const createdProjects = projects.filter((p) => p.created_by === user?.id);
  const assignedProjects = projects.filter((p) => p.created_by !== user?.id);

  const displayedProjects =
    projectFilter === "owned"
      ? createdProjects
      : projectFilter === "assigned"
      ? assignedProjects
      : projects;

  const renderProjectCard = (p: Project, idx: number) => {
    const isOwned = p.created_by === user?.id;
    const gradient = projectColors[idx % projectColors.length];
    return (
      <Link
        key={p.id}
        href={`/projects/${p.id}/board`}
        className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group shadow-2xs flex flex-col justify-between"
      >
        <div>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white text-xs font-extrabold shadow-sm`}>
                {p.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                  {p.name}
                </h3>
                {!isOwned && p.owner && (
                  <p className="text-[10px] text-slate-400">Owner: {p.owner.full_name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isOwned ? (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                  Owner
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/70 px-2 py-0.5 rounded-full">
                  Assigned
                </span>
              )}
            </div>
          </div>
          {p.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
              {p.description}
            </p>
          )}
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <span>{p._count?.tickets ?? 0} tickets</span>
            <span>·</span>
            <span>{p._count?.members ?? 0} members</span>
          </div>
          <span className="text-indigo-600 font-semibold text-xs group-hover:translate-x-0.5 transition-transform">
            Open Board →
          </span>
        </div>
      </Link>
    );
  };

  useEffect(() => {
    async function load() {
      try {
        const [projRes, ticketRes] = await Promise.allSettled([
          projectsApi.list(1, 6),
          ticketsApi.getDashboard(),
        ]);

        if (projRes.status === "fulfilled") {
          const projs: Project[] = projRes.value?.projects || [];
          setProjects(projs);

          // Load active sprints for each project
          const sprintPromises = projs.map((p: Project) =>
            sprintsApi.listByProject(p.id).then((sprints: Sprint[]) =>
              sprints.filter((s: Sprint) => s.status === "ACTIVE")
            ).catch(() => [])
          );
          const allSprints = (await Promise.all(sprintPromises)).flat();
          setActiveSprints(allSprints);
        }

        if (ticketRes.status === "fulfilled") {
          setAssignedTickets(ticketRes.value?.assignedTickets || []);
          setRecentTickets(ticketRes.value?.recentTickets || []);
        }

        if (projRes.status === "rejected") {
          dispatch(addToast({ type: "error", message: "Failed to load projects." }));
        }
      } catch {
        dispatch(addToast({ type: "error", message: "Failed to load dashboard data." }));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dispatch]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 bg-white/80 border border-slate-200/80 rounded-2xl p-5 sm:p-8 shadow-xs backdrop-blur-xs relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👋</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.full_name?.split(" ")[0]}
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Here is your live workspace summary across {APP_NAME}.
          </p>
        </div>
        {user?.role === "ADMIN" ? (
          <Link href="/admin/users">
            <Button variant="secondary" className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100" size="md">
              <svg className="w-4 h-4 text-purple-600 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Admin Console
            </Button>
          </Link>
        ) : (
          <Button onClick={() => setCreateOpen(true)} id="create-project-btn" size="md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Projects */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Projects</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setProjectFilter("all")}
                className={cn(
                  "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  projectFilter === "all"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                All ({projects.length})
              </button>
              <button
                onClick={() => setProjectFilter("owned")}
                className={cn(
                  "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  projectFilter === "owned"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>Created by You</span>
                <span className="bg-indigo-100/70 text-indigo-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {createdProjects.length}
                </span>
              </button>
              <button
                onClick={() => setProjectFilter("assigned")}
                className={cn(
                  "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  projectFilter === "assigned"
                    ? "bg-white text-sky-700 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>Assigned</span>
                <span className="bg-sky-100/70 text-sky-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {assignedProjects.length}
                </span>
              </button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white/80 border border-dashed border-slate-300 rounded-2xl p-10 text-center shadow-2xs">
              <p className="text-slate-500 text-xs sm:text-sm mb-3 font-medium">
                {user?.role === "ADMIN"
                  ? "No active projects. Admin accounts manage user approvals and roles."
                  : "No projects created yet."}
              </p>
              {user?.role === "ADMIN" ? (
                <Link href="/admin/users">
                  <Button size="sm" variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                    Open Admin Console
                  </Button>
                </Link>
              ) : (
                <Button size="sm" onClick={() => setCreateOpen(true)}>Create your first project</Button>
              )}
            </div>
          ) : projectFilter === "all" ? (
            <div className="space-y-6">
              {/* Created by You Sub-section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Created by You</span>
                    <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                      {createdProjects.length} project{createdProjects.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Link href="/projects" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                    View all →
                  </Link>
                </div>
                {createdProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-center">
                    You have not created any projects yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {createdProjects.map((p, idx) => renderProjectCard(p, idx))}
                  </div>
                )}
              </div>

              {/* Assigned to You Sub-section */}
              {assignedProjects.length > 0 && (
                <div className="pt-4 border-t border-slate-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Assigned to You</span>
                      <span className="text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/70 px-2 py-0.5 rounded-full">
                        {assignedProjects.length} project{assignedProjects.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {assignedProjects.map((p, idx) => renderProjectCard(p, idx + 3))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {displayedProjects.length === 0 ? (
                <div className="bg-white/80 border border-dashed border-slate-300 rounded-2xl p-10 text-center shadow-2xs">
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">
                    {projectFilter === "owned"
                      ? "You haven't created any projects yet."
                      : "No projects have been assigned to you yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedProjects.map((p, idx) => renderProjectCard(p, idx))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sprints & Activity */}
        <div className="space-y-6">
          {/* Active Sprints */}
          <div className="bg-white/90 border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Active Sprints</h2>
            </div>
            {activeSprints.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-center">
                No active sprints currently running.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activeSprints.map((s) => (
                  <div key={s.id} className="bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2.5 shadow-2xs hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-900 font-bold">{s.name ?? `Sprint #${s.id}`}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{formatDate(s.end_date)} end · {s._count?.tickets ?? 0} tickets</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned to me */}
          <div className="bg-white/90 border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Assigned to Me</h2>
            </div>
            {assignedTickets.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-center">
                No tickets assigned to you right now.
              </p>
            ) : (
              <div className="space-y-2">
                {assignedTickets.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="flex items-center gap-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 hover:border-indigo-400 hover:bg-white transition-all group shadow-2xs"
                  >
                    <TicketStatusBadge status={t.status} />
                    <span className="text-xs text-slate-700 truncate group-hover:text-indigo-600 font-semibold flex-1">
                      {t.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recently Updated */}
          <div className="bg-white/90 border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recently Updated</h2>
            </div>
            {recentTickets.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 border border-slate-200/70 rounded-xl p-4 text-center">
                No recent activity.
              </p>
            ) : (
              <div className="space-y-2">
                {recentTickets.slice(0, 5).map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="flex items-start gap-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 hover:border-indigo-400 hover:bg-white transition-all group shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 truncate group-hover:text-indigo-600 font-semibold">{t.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(t.updated_at)}</p>
                    </div>
                    {t.assignee && <Avatar name={t.assignee.full_name} size="sm" />}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateProjectModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(p) => {
          setProjects((prev) => [p, ...prev]);
        }}
      />
    </div>
  );
}
