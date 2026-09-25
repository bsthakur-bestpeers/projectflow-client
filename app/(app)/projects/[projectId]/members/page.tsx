"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { membersApi, projectsApi, usersApi } from "@/services/api";
import { Member } from "@/types";
import { EmptyState, Avatar, MembersSkeleton } from "@/components/ui/Misc";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

type UserSuggestion = { id: number; full_name: string; email: string };

export default function MembersPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const pid = parseInt(projectId);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  // Multi-member selection state
  const [allUsers, setAllUsers] = useState<UserSuggestion[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    Promise.all([membersApi.list(pid), projectsApi.getById(pid)])
      .then(([m, p]) => {
        setMembers(m);
        setIsOwner(p.created_by === user?.id);
      })
      .catch(() => dispatch(addToast({ type: "error", message: "Failed to load members." })))
      .finally(() => setLoading(false));
  }, [pid, dispatch, user?.id]);

  // Fetch all registered users when modal opens
  useEffect(() => {
    if (addOpen) {
      usersApi
        .list()
        .then((u) => setAllUsers(u))
        .catch(() => {});
    }
  }, [addOpen]);

  // Existing member emails set (lowercase)
  const memberEmails = useMemo(() => {
    return new Set(members.map((m) => m.email.toLowerCase()));
  }, [members]);

  // Users who are not yet members
  const availableUsers = useMemo(() => {
    return allUsers.filter((u) => !memberEmails.has(u.email.toLowerCase()));
  }, [allUsers, memberEmails]);

  // Filtered available users based on search
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableUsers;
    return availableUsers.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [availableUsers, searchQuery]);

  // Check if a user is currently selected
  const isSelected = (email: string) => {
    return selectedUsers.some((u) => u.email.toLowerCase() === email.toLowerCase());
  };

  // Toggle user selection
  const toggleUser = (u: UserSuggestion) => {
    setErrorMsg("");
    if (isSelected(u.email)) {
      setSelectedUsers((prev) => prev.filter((item) => item.email.toLowerCase() !== u.email.toLowerCase()));
    } else {
      setSelectedUsers((prev) => [...prev, u]);
    }
  };

  // Remove a selected user pill
  const removeSelected = (email: string) => {
    setSelectedUsers((prev) => prev.filter((item) => item.email.toLowerCase() !== email.toLowerCase()));
  };

  // Select / Deselect all currently filtered users
  const isAllFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => isSelected(u.email));

  const handleToggleSelectAll = () => {
    setErrorMsg("");
    if (isAllFilteredSelected) {
      const filteredEmails = new Set(filteredUsers.map((u) => u.email.toLowerCase()));
      setSelectedUsers((prev) => prev.filter((u) => !filteredEmails.has(u.email.toLowerCase())));
    } else {
      const newItems: UserSuggestion[] = [];
      for (const u of filteredUsers) {
        if (!isSelected(u.email)) {
          newItems.push(u);
        }
      }
      setSelectedUsers((prev) => [...prev, ...newItems]);
    }
  };

  // Add custom email on Enter if valid
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      if (!/\S+@\S+\.\S+/.test(trimmed)) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }

      if (memberEmails.has(trimmed.toLowerCase())) {
        setErrorMsg("This user is already a member of the project.");
        return;
      }

      if (isSelected(trimmed)) {
        setErrorMsg("User is already in the selected list.");
        return;
      }

      const found = allUsers.find((u) => u.email.toLowerCase() === trimmed.toLowerCase());
      const userToAdd: UserSuggestion = found || {
        id: -Date.now(),
        full_name: trimmed.split("@")[0],
        email: trimmed,
      };

      setSelectedUsers((prev) => [...prev, userToAdd]);
      setSearchQuery("");
      setErrorMsg("");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Build the final list of emails to add
    const finalEmails = new Set(selectedUsers.map((u) => u.email.trim()));

    // Also include any valid email currently in the search input
    const currentInput = searchQuery.trim();
    if (currentInput && /\S+@\S+\.\S+/.test(currentInput) && !memberEmails.has(currentInput.toLowerCase())) {
      finalEmails.add(currentInput);
    }

    const emailList = Array.from(finalEmails);
    if (emailList.length === 0) {
      setErrorMsg("Please select or enter at least one team member.");
      return;
    }

    setAdding(true);
    try {
      let newlyAdded: Member[] = [];
      if (emailList.length === 1) {
        const single = await membersApi.add(pid, emailList[0]);
        newlyAdded = [single];
      } else {
        newlyAdded = await membersApi.addMultiple(pid, emailList);
      }

      setMembers((prev) => [...prev, ...newlyAdded]);
      setAddOpen(false);
      setSelectedUsers([]);
      setSearchQuery("");
      dispatch(
        addToast({
          type: "success",
          message: `${newlyAdded.length} member${newlyAdded.length !== 1 ? "s" : ""} added to project!`,
        })
      );
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to add team members.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await membersApi.remove(pid, removeTarget.id);
      setMembers((p) => p.filter((m) => m.id !== removeTarget.id));
      setRemoveTarget(null);
      dispatch(addToast({ type: "success", message: `${removeTarget.full_name} removed.` }));
    } catch (err: unknown) {
      dispatch(
        addToast({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to remove member.",
        })
      );
    } finally {
      setRemoving(false);
    }
  };

  const totalSelectedCount =
    selectedUsers.length +
    (searchQuery.trim() &&
    /\S+@\S+\.\S+/.test(searchQuery.trim()) &&
    !isSelected(searchQuery.trim()) &&
    !memberEmails.has(searchQuery.trim().toLowerCase())
      ? 1
      : 0);

  if (loading) return <MembersSkeleton />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Team Members</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""} collaborating on this project
          </p>
        </div>
        {isOwner && (
          <Button
            onClick={() => {
              setSelectedUsers([]);
              setSearchQuery("");
              setErrorMsg("");
              setAddOpen(true);
            }}
            id="add-member-btn"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Members
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <EmptyState title="No members found." />
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-4 bg-white border border-slate-200/90 rounded-2xl px-6 py-4.5 shadow-2xs hover:border-indigo-300 transition-colors"
            >
              <Avatar name={member.full_name} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">{member.full_name}</span>
                  {member.is_owner && <Badge color="indigo">Owner</Badge>}
                </div>
                <p className="text-xs text-slate-500 font-medium">{member.email}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Joined {formatDate(member.joined_at)}</p>
              </div>
              {isOwner && !member.is_owner && member.id !== user?.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setRemoveTarget(member)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Multiple Members Modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Team Members"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {/* Selected Members Chips */}
          {selectedUsers.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Selected Members ({selectedUsers.length})
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedUsers([])}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl max-h-32 overflow-y-auto">
                {selectedUsers.map((u) => (
                  <span
                    key={u.email}
                    className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs group"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[150px] truncate">{u.full_name || u.email}</span>
                    <button
                      type="button"
                      onClick={() => removeSelected(u.email)}
                      className="text-indigo-400 hover:text-indigo-700 ml-0.5 p-0.5 rounded transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search or Enter Email Input */}
          <div>
            <label htmlFor="member-search" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Search by Name or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="member-search"
                type="text"
                autoComplete="off"
                placeholder="Type name or email, or press Enter to add..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setErrorMsg("");
                }}
                onKeyDown={handleKeyDown}
                className={`w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white outline-none transition-all duration-150 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${
                  errorMsg ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-400" : "border-slate-200/90 hover:border-slate-300"
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {errorMsg && <p className="text-xs text-rose-600 font-medium mt-1.5">{errorMsg}</p>}
            {!errorMsg && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Click users below to select multiple members, or type an email and press Enter.
              </p>
            )}
          </div>

          {/* Available Users List */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-0.5">
              <span>
                Available Users {filteredUsers.length > 0 && `(${filteredUsers.length})`}
              </span>
              {filteredUsers.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  {isAllFilteredSelected ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            <div className="border border-slate-200/90 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  {searchQuery.trim()
                    ? `No registered users found matching "${searchQuery}". Press Enter to add this email directly.`
                    : "All registered users are already members of this project."}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const selected = isSelected(u.email);
                  const q = searchQuery.trim().toLowerCase();
                  const nameIdx = u.full_name.toLowerCase().indexOf(q);
                  const emailIdx = u.email.toLowerCase().indexOf(q);

                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors cursor-pointer select-none ${
                        selected
                          ? "bg-indigo-50/70 hover:bg-indigo-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Custom Checkbox */}
                      <div
                        className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-2xs"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selected && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Avatar initial */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
                        {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                      </div>

                      {/* User Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {q && nameIdx >= 0 ? (
                            <>
                              {u.full_name.slice(0, nameIdx)}
                              <span className="text-indigo-600 bg-indigo-100/70 rounded px-0.5">
                                {u.full_name.slice(nameIdx, nameIdx + q.length)}
                              </span>
                              {u.full_name.slice(nameIdx + q.length)}
                            </>
                          ) : (
                            u.full_name
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {q && emailIdx >= 0 ? (
                            <>
                              {u.email.slice(0, emailIdx)}
                              <span className="text-indigo-600 bg-indigo-100/70 rounded px-0.5">
                                {u.email.slice(emailIdx, emailIdx + q.length)}
                              </span>
                              {u.email.slice(emailIdx + q.length)}
                            </>
                          ) : (
                            u.email
                          )}
                        </p>
                      </div>

                      {selected && (
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded-full shrink-0">
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={adding}
              disabled={totalSelectedCount === 0}
            >
              {totalSelectedCount <= 1
                ? "Add Member"
                : `Add ${totalSelectedCount} Members`}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove Member"
        message={`Remove ${removeTarget?.full_name} from this project?`}
        confirmLabel="Remove"
        loading={removing}
      />
    </div>
  );
}
