"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { searchApi, SearchResults } from "@/services/api";
import { APP_NAME } from "@/constants";
import { Avatar } from "@/components/ui/Misc";
import { TicketStatusBadge } from "@/components/ui/Badge";

export default function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search effect (300ms)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchApi.search(trimmed);
        setSearchResults(results);
        setSearchOpen(true);
      } catch {
        // Silently handle search error
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener & ⌘K keyboard shortcut
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
      if (searchOpen && searchRef.current && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K to focus search bar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        if (searchQuery.trim()) setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setProfileOpen(false);
        setNotificationsOpen(false);
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen, notificationsOpen, searchOpen, searchQuery]);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      router.push("/login");
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to log out." }));
    }
  };

  const handleSelectResult = (url: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(url);
  };

  const totalResultsCount =
    (searchResults?.projects.length || 0) +
    (searchResults?.sprints.length || 0) +
    (searchResults?.tickets.length || 0);

  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
      {/* Left Section: Brand & Workspace Identity */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">
              {APP_NAME}
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200/80 px-2 py-0.5 rounded-full">
              Workspace
            </span>
          </div>
        </Link>
      </div>

      {/* Center Search Bar (Global Quick Jump) */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-4 relative" ref={searchRef}>
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search projects, tickets, sprints..."
            value={searchQuery}
            onFocus={() => {
              if (searchQuery.trim() && searchResults) setSearchOpen(true);
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-16 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-slate-100/70 border border-slate-200/80 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-2xs"
          />
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-1" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults(null);
                  setSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
            <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs pointer-events-none">
              ⌘K
            </span>
          </div>
        </div>

        {/* Search Results Dropdown Popover */}
        {searchOpen && searchQuery.trim() && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 max-h-[75vh] overflow-y-auto animate-slide-down">
            {isSearching && !searchResults ? (
              <div className="p-4 text-center text-xs text-slate-400">Searching...</div>
            ) : totalResultsCount === 0 ? (
              <div className="p-5 text-center">
                <p className="text-xs font-bold text-slate-700">No results found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No projects, tickets, or sprints matched &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              <div className="space-y-3 px-1 text-xs">
                {/* Projects Section */}
                {searchResults && searchResults.projects.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span>Projects ({searchResults.projects.length})</span>
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {searchResults.projects.map((proj) => (
                        <div
                          key={proj.id}
                          onClick={() => handleSelectResult(`/projects/${proj.id}/board`)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-indigo-50/70 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                              {proj.name[0]}
                            </div>
                            <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                              {proj.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                            {proj.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sprints Section */}
                {searchResults && searchResults.sprints.length > 0 && (
                  <div className="border-t border-slate-100 pt-2">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Sprints ({searchResults.sprints.length})</span>
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {searchResults.sprints.map((sp) => (
                        <div
                          key={sp.id}
                          onClick={() => handleSelectResult(`/projects/${sp.project_id}/sprints?sprintId=${sp.id}`)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-50/70 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                              Sprint
                            </span>
                            <span className="font-semibold text-slate-800 group-hover:text-emerald-700 truncate">
                              {sp.name ?? `Sprint #${sp.id}`}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              in {sp.projectName}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                            {sp.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tickets Section */}
                {searchResults && searchResults.tickets.length > 0 && (
                  <div className="border-t border-slate-100 pt-2">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Tickets ({searchResults.tickets.length})</span>
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {searchResults.tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          onClick={() => handleSelectResult(`/projects/${ticket.project_id}/board`)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-blue-50/70 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/80 px-1.5 py-0.5 rounded font-mono shrink-0">
                              {ticket.projectName ? getInitials(ticket.projectName) : "PF"}-{ticket.id}
                            </span>
                            <span className="font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                              {ticket.title}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate hidden sm:inline">
                              in {ticket.projectName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <TicketStatusBadge status={ticket.status} />
                            {ticket.assignee && (
                              <Avatar name={ticket.assignee.full_name} size="sm" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section: Notifications & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2.5 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3.5 z-50 animate-slide-down">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 px-1">
                <span className="text-xs font-bold text-slate-800">Notifications</span>
                <span className="text-[10px] text-indigo-600 font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="py-5 text-center">
                <p className="text-xs text-slate-700 font-bold">You&apos;re all caught up! ✨</p>
                <p className="text-[11px] text-slate-400 mt-1">No new notifications right now.</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200/80 mx-0.5" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer"
            aria-label="User Profile Menu"
          >
            <Avatar name={user?.full_name ?? "User"} size="sm" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-slide-down">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-1.5">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
                  {user?.role === "ADMIN" && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <span>Profile Settings</span>
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/projects"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <span>All Projects</span>
                </Link>
              </div>
              <div className="border-t border-slate-100 my-1" />
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
          )}
        </div>
      </div>
    </header>
  );
}
