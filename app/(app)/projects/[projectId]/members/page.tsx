"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { addToast } from "@/store/uiSlice";
import { membersApi, projectsApi, usersApi } from "@/services/api";
import { Member } from "@/types";
import { PageSpinner, EmptyState, Avatar } from "@/components/ui/Misc";
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
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [adding, setAdding] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [removing, setRemoving] = useState(false);

  // Autocomplete state
  const [allUsers, setAllUsers] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([membersApi.list(pid), projectsApi.getById(pid)])
      .then(([m, p]) => {
        setMembers(m);
        setIsOwner(p.created_by === user?.id);
      }).catch(() => dispatch(addToast({ type: "error", message: "Failed to load members." })))
      .finally(() => setLoading(false));
  }, [pid, dispatch, user?.id]);

  // Fetch all users when modal opens
  useEffect(() => {
    if (addOpen) {
      usersApi.list().then((u) => setAllUsers(u)).catch(() => {});
    }
  }, [addOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputWrapperRef.current && !inputWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter suggestions: match by name or email, exclude existing members
  const filteredSuggestions = useCallback(() => {
    if (!email.trim()) return [];
    const q = email.trim().toLowerCase();
    const memberEmails = new Set(members.map((m) => m.email.toLowerCase()));
    return allUsers.filter(
      (u) =>
        !memberEmails.has(u.email.toLowerCase()) &&
        (u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [email, allUsers, members]);

  const suggestions = filteredSuggestions();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError("");
    setHighlightIdx(-1);
    setShowSuggestions(true);
  };

  const selectSuggestion = (u: UserSuggestion) => {
    setEmail(u.email);
    setShowSuggestions(false);
    setHighlightIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && highlightIdx >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIdx]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIdx >= 0 && suggestionsRef.current) {
      const items = suggestionsRef.current.querySelectorAll("[data-suggestion]");
      items[highlightIdx]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIdx]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setEmailError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError("Enter a valid email"); return; }
    setEmailError("");
    setAdding(true);
    try {
      const member = await membersApi.add(pid, email.trim());
      setMembers((p) => [...p, member]);
      setAddOpen(false);
      setEmail("");
      dispatch(addToast({ type: "success", message: `${member.full_name} added to project!` }));
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Failed to add member.");
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
      dispatch(addToast({ type: "error", message: err instanceof Error ? err.message : "Failed to remove member." }));
    } finally {
      setRemoving(false);
    }
  };

  if (loading) return <PageSpinner />;

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
          <Button onClick={() => { setEmail(""); setEmailError(""); setShowSuggestions(false); setAddOpen(true); }} id="add-member-btn">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <EmptyState title="No members found." />
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-4 bg-white border border-slate-200/90 rounded-2xl px-6 py-4.5 shadow-2xs hover:border-indigo-300 transition-colors">
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
                <Button size="sm" variant="ghost" onClick={() => setRemoveTarget(member)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div ref={inputWrapperRef} style={{ position: "relative" }}>
            <label htmlFor="member-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Search by Name or Email
            </label>
            <input
              id="member-email"
              type="text"
              autoComplete="off"
              autoFocus
              placeholder="Type a name or email..."
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onFocus={() => { if (email.trim()) setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white outline-none transition-all duration-150 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${emailError ? "border-rose-400 focus:ring-rose-500/20 focus:border-rose-400" : "border-slate-200/90 hover:border-slate-300"}`}
            />
            {emailError && <p className="text-xs text-rose-600 font-medium mt-1">{emailError}</p>}
            {!emailError && <p className="text-[11px] text-slate-400 mt-1">The user must already have a registered account.</p>}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto"
                style={{ animation: "fadeSlideDown 0.15s ease-out" }}
              >
                {suggestions.map((u, idx) => {
                  const isHighlighted = idx === highlightIdx;
                  // Highlight matching text
                  const q = email.trim().toLowerCase();
                  const nameIdx = u.full_name.toLowerCase().indexOf(q);
                  const emailIdx = u.email.toLowerCase().indexOf(q);

                  return (
                    <button
                      key={u.id}
                      type="button"
                      data-suggestion
                      onClick={() => selectSuggestion(u)}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                        isHighlighted
                          ? "bg-indigo-50 border-l-2 border-indigo-500"
                          : "bg-white border-l-2 border-transparent hover:bg-slate-50"
                      }`}
                    >
                      {/* Avatar initial */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {nameIdx >= 0 ? (
                            <>
                              {u.full_name.slice(0, nameIdx)}
                              <span className="text-indigo-600 bg-indigo-50 rounded px-0.5">{u.full_name.slice(nameIdx, nameIdx + q.length)}</span>
                              {u.full_name.slice(nameIdx + q.length)}
                            </>
                          ) : (
                            u.full_name
                          )}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {emailIdx >= 0 ? (
                            <>
                              {u.email.slice(0, emailIdx)}
                              <span className="text-indigo-600 bg-indigo-50 rounded px-0.5">{u.email.slice(emailIdx, emailIdx + q.length)}</span>
                              {u.email.slice(emailIdx + q.length)}
                            </>
                          ) : (
                            u.email
                          )}
                        </p>
                      </div>
                      {/* Visual cue */}
                      {isHighlighted && (
                        <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* No results feedback */}
            {showSuggestions && email.trim().length > 0 && suggestions.length === 0 && allUsers.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-center">
                <p className="text-xs text-slate-400 font-medium">No matching users found</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={adding}>Add Member</Button>
          </div>
        </form>

        {/* Animation keyframes */}
        <style>{`
          @keyframes fadeSlideDown {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </Modal>

      <ConfirmDialog isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} onConfirm={handleRemove} title="Remove Member" message={`Remove ${removeTarget?.full_name} from this project?`} confirmLabel="Remove" loading={removing} />
    </div>
  );
}
