"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { closeSidebar } from "@/store/uiSlice";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";

export default function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen);

  useEffect(() => {
    dispatch(closeSidebar());
  }, [pathname, dispatch]);

  return (
    <>
      {/* Mobile/Tablet Backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          onClick={() => dispatch(closeSidebar())}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "bg-white/95 lg:bg-white/70 border-r border-slate-200/80 flex flex-col backdrop-blur-md transition-transform duration-300 ease-in-out",
          // Desktop: sticky side navigation
          "lg:translate-x-0 lg:static lg:w-60 lg:shrink-0 lg:h-[calc(100vh-3.5rem)] lg:sticky lg:top-14 lg:z-10",
          // Mobile & Tablet: full height drawer
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full shadow-2xl lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Mobile / Tablet Drawer Header with Close button */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 lg:hidden bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">{APP_NAME} Admin</span>
          </div>
          <button
            type="button"
            onClick={() => dispatch(closeSidebar())}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 py-4 overflow-y-auto space-y-5">
          <div className="px-3 space-y-1 text-xs">
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-all",
                pathname.startsWith("/admin/users")
                  ? "bg-purple-50 text-purple-700 shadow-2xs border border-purple-200"
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
              )}
            >
              <svg className={cn("w-4 h-4", pathname.startsWith("/admin/users") ? "text-purple-600" : "text-slate-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>User Management</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
