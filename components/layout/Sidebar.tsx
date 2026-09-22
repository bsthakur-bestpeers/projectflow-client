"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { projectsApi } from "@/services/api";
import { Project } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Misc";

const projectColors = [
  "from-indigo-500 to-indigo-600",
  "from-purple-500 to-purple-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    projectsApi.list(1, 100).then((data) => {
      setProjects(data.projects || []);
    }).catch(() => {});
  }, [user?.id, pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logout()).unwrap();
      router.push("/login");
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to log out." }));
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-60 shrink-0 bg-white/70 border-r border-slate-200/80 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 backdrop-blur-sm">
      <div className="flex-1 py-4 overflow-y-auto space-y-5">
        {/* Navigation Section */}
        <div className="px-3 space-y-1 text-xs">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all",
              pathname === "/dashboard"
                ? "bg-indigo-50/90 text-indigo-700 shadow-2xs border border-indigo-100"
                : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
            )}
          >
            <svg className={cn("w-4 h-4", pathname === "/dashboard" ? "text-indigo-600" : "text-slate-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </Link>

          <Link
            href="/projects"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all",
              pathname === "/projects"
                ? "bg-indigo-50/90 text-indigo-700 shadow-2xs border border-indigo-100"
                : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
            )}
          >
            <svg className={cn("w-4 h-4", pathname === "/projects" ? "text-indigo-600" : "text-slate-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>All Projects</span>
          </Link>
        </div>

        {/* Projects / Spaces List */}
        <div className="px-3 pt-2 border-t border-slate-100 space-y-4">
          {/* Created by You */}
          <div>
            <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Created by You
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full border border-indigo-100">
                {projects.filter((p) => p.created_by === user?.id).length}
              </span>
            </div>

            <div className="space-y-0.5 mt-1 text-xs max-h-[175px] overflow-y-auto pr-1">
              {projects
                .filter((p) => p.created_by === user?.id)
                .map((p, idx) => {
                  const active = pathname.startsWith(`/projects/${p.id}`);
                  const gradient = projectColors[idx % projectColors.length];
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}/board`}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all group",
                        active
                          ? "bg-indigo-50/90 text-indigo-700 font-bold shadow-2xs border border-indigo-100"
                          : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                      )}
                    >
                      <div className={cn("w-4 h-4 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0 shadow-2xs bg-gradient-to-tr", gradient)}>
                        {p.name[0]}
                      </div>
                      <span className="truncate">{p.name}</span>
                    </Link>
                  );
                })}
              {projects.filter((p) => p.created_by === user?.id).length === 0 && (
                <p className="px-3 py-1 text-[11px] text-slate-400 italic">No created projects</p>
              )}
            </div>
          </div>

          {/* Assigned to You */}
          {projects.some((p) => p.created_by !== user?.id) && (
            <div className="pt-2 border-t border-slate-100/80">
              <div className="flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Assigned to You
                </span>
                <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded-full border border-sky-100">
                  {projects.filter((p) => p.created_by !== user?.id).length}
                </span>
              </div>

              <div className="space-y-0.5 mt-1 text-xs max-h-[175px] overflow-y-auto pr-1">
                {projects
                  .filter((p) => p.created_by !== user?.id)
                  .map((p, idx) => {
                    const active = pathname.startsWith(`/projects/${p.id}`);
                    const gradient = projectColors[(idx + 3) % projectColors.length];
                    return (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}/board`}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all group",
                          active
                            ? "bg-sky-50/90 text-sky-800 font-bold shadow-2xs border border-sky-200"
                            : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                        )}
                      >
                        <div className={cn("w-4 h-4 rounded-md flex items-center justify-center text-white text-[9px] font-bold shrink-0 shadow-2xs bg-gradient-to-tr", gradient)}>
                          {p.name[0]}
                        </div>
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <span className="truncate">{p.name}</span>
                          <span className="text-[9px] text-slate-400 font-normal ml-1">Assigned</span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Section at bottom */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl">
          <Avatar name={user?.full_name ?? "User"} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.full_name}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Log out"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
