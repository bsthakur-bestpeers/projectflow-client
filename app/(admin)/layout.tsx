"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/store";
import { logout } from "@/store/authSlice";
import { addToast, toggleSidebar } from "@/store/uiSlice";
import { PageSpinner } from "@/components/ui/Misc";
import { Avatar } from "@/components/ui/Misc";
import { APP_NAME } from "@/constants";
import AdminSidebar from "@/components/layout/AdminSidebar";

function AdminNavbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      router.push("/login");
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to log out." }));
    }
  };

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hamburger Menu Toggle (mobile & tablet < lg) */}
        <button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-1.5 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/admin/users" className="flex items-center gap-2 sm:gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">
              {APP_NAME} Admin
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-purple-300 transition-all cursor-pointer"
            aria-label="User Profile Menu"
          >
            <Avatar name={user?.full_name ?? "Admin"} size="sm" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-slide-down">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, initialized, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (initialized) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role !== "ADMIN") {
        router.replace("/dashboard");
      }
    }
  }, [initialized, isAuthenticated, user, router]);

  if (!initialized || !isAuthenticated || user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      <AdminNavbar />
      <div className="flex flex-1 relative">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden min-w-0 bg-transparent p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
