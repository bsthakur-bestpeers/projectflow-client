"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-white/70 border-r border-slate-200/80 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 backdrop-blur-sm">
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
          {/* Add more admin links here in the future */}
        </div>
      </div>
    </aside>
  );
}
