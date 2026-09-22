"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store";
import { addToast } from "@/store/uiSlice";
import { adminApi } from "@/services/api";
import { User } from "@/types";
import Button from "@/components/ui/Button";
import { Avatar, EmptyState } from "@/components/ui/Misc";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.listUsers(
        filter === "ALL" ? undefined : { status: filter }
      );
      setUsers(data);
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to load user directory." }));
    } finally {
      setLoading(false);
    }
  }, [filter, dispatch]);

  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadUsers();
  }, [currentUser, router, loadUsers]);

  const handleApprove = async (u: User) => {
    setActionLoadingId(u.id);
    try {
      const updated = await adminApi.approveUser(u.id);
      setUsers((prev) => prev.map((item) => (item.id === u.id ? updated : item)));
      dispatch(addToast({
        type: "success",
        message: `${u.full_name} has been approved and can now log in.`,
      }));
    } catch {
      dispatch(addToast({ type: "error", message: `Failed to approve ${u.full_name}.` }));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (u: User) => {
    setActionLoadingId(u.id);
    try {
      const updated = await adminApi.rejectUser(u.id);
      setUsers((prev) => prev.map((item) => (item.id === u.id ? updated : item)));
      dispatch(addToast({
        type: "info",
        message: `${u.full_name}'s registration has been rejected.`,
      }));
    } catch {
      dispatch(addToast({ type: "error", message: `Failed to reject ${u.full_name}.` }));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleRole = async (u: User) => {
    const nextRole = u.role === "ADMIN" ? "USER" : "ADMIN";
    setActionLoadingId(u.id);
    try {
      const updated = await adminApi.changeRole(u.id, nextRole as "ADMIN" | "USER");
      setUsers((prev) => prev.map((item) => (item.id === u.id ? updated : item)));
      dispatch(addToast({
        type: "success",
        message: `${u.full_name}'s role updated to ${nextRole}.`,
      }));
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to update role." }));
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = users.filter((u) => u.approval_status === "PENDING").length;

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = u.full_name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      return matchName || matchEmail;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Console</h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Manage user accounts, review pending registrations, and configure permissions.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/70 text-xs self-start sm:self-auto">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                filter === tab
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "PENDING" && pendingCount > 0 ? (
                <span className="flex items-center gap-1.5">
                  Pending
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                </span>
              ) : (
                tab.charAt(0) + tab.slice(1).toLowerCase()
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Total Users</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-amber-800">Pending Approvals</p>
          <p className="text-2xl font-extrabold text-amber-900 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-purple-50/50 p-4.5 rounded-2xl border border-purple-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-purple-800">Admins</p>
          <p className="text-2xl font-extrabold text-purple-900 mt-1">
            {users.filter((u) => u.role === "ADMIN").length}
          </p>
        </div>
      </div>

      {/* Table Controls: Search & Role Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Role Toggle */}
        <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs">
          {(["ALL", "USER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                roleFilter === r
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {r === "ALL" ? "All Roles" : r === "ADMIN" ? "Admins" : "Standard Users"}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200/90 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none w-full sm:w-64 shadow-2xs transition-all"
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

      {/* User Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading user directory...</div>
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description={`There are currently no users matching the "${filter.toLowerCase()}" filter.`}
        />
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white/80 border border-dashed border-slate-300 rounded-2xl p-10 text-center shadow-2xs">
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            No users matched &ldquo;{searchQuery}&rdquo; in the selected filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isActionLoading = actionLoadingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.full_name} size="md" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                              {u.full_name}
                              {isSelf && (
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-slate-500 text-xs truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                              u.role === "ADMIN"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {u.role ?? "USER"}
                          </span>
                          {!isSelf && u.approval_status === "APPROVED" && (
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={isActionLoading}
                              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer transition-colors"
                              title={u.role === "ADMIN" ? "Demote to User" : "Promote to Admin"}
                            >
                              {u.role === "ADMIN" ? "(Demote)" : "(Make Admin)"}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="py-3.5 px-4">
                        {u.approval_status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Approved
                          </span>
                        )}
                        {u.approval_status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending Review
                          </span>
                        )}
                        {u.approval_status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.approval_status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(u)}
                                loading={isActionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(u)}
                                loading={isActionLoading}
                                className="text-rose-600 hover:bg-rose-50"
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {u.approval_status === "REJECTED" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleApprove(u)}
                              loading={isActionLoading}
                            >
                              Re-Approve
                            </Button>
                          )}

                          {u.approval_status === "APPROVED" && !isSelf && (
                            <button
                              onClick={() => handleReject(u)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg h-8 flex items-center justify-center transition-all bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              {isActionLoading ? "..." : "Make Inactive"}
                            </button>
                          )}
                          {u.approval_status === "APPROVED" && isSelf && (
                            <span className="text-[11px] text-slate-400 italic">Current User</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
