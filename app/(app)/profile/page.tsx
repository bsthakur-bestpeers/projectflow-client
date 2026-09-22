"use client";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { updateProfileName } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { usersApi } from "@/services/api";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMinLength = password.length === 0 || password.length >= 8;
  const hasUppercase = password.length === 0 || /[A-Z]/.test(password);
  const hasNumber = password.length === 0 || /[0-9]/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    if (!fullName.trim()) {
      setError("Name cannot be empty.");
      return;
    }

    if (password) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError("Password must contain at least one uppercase letter.");
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError("Password must contain at least one number.");
        return;
      }
    }

    setLoading(true);
    try {
      const updateData: { full_name?: string; password?: string } = {
        full_name: fullName,
      };
      
      if (password) {
        updateData.password = password;
      }

      await usersApi.updateProfile(updateData);
      
      let successMessage = "Profile updated successfully!";
      const nameChanged = fullName !== user.full_name;
      const passwordChanged = !!password;
      
      if (nameChanged && passwordChanged) {
        successMessage = "Name and password updated successfully!";
      } else if (passwordChanged) {
        successMessage = "Password updated successfully!";
      } else if (nameChanged) {
        successMessage = "Name updated successfully!";
      } else {
        successMessage = "No changes were made.";
      }

      dispatch(updateProfileName(fullName));
      dispatch(addToast({ type: "success", message: successMessage }));
      
      // Clear password fields on success
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto w-full p-6 sm:p-8 min-h-screen pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Profile Settings</h1>
        <p className="text-slate-500 mt-2 text-sm">Manage your personal information and security preferences.</p>
      </div>

      <div className="space-y-8">
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-800">Personal Information & Security</h2>
            <p className="text-sm text-slate-500 mt-1">Update your name, profile details, and password.</p>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Avatar Column */}
              <div className="flex flex-col items-center sm:items-start gap-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-4xl font-semibold shadow-inner">
                  {fullName ? fullName[0].toUpperCase() : "U"}
                </div>
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Role</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Form Column */}
              <form id="profile-form" onSubmit={handleSubmit} className="flex-1 w-full space-y-6">
                
                {/* Profile Details */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Input
                      id="profile-email"
                      label="Email Address"
                      type="email"
                      value={user.email}
                      disabled
                      readOnly
                      className="bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400">Your email address is used for login and notifications. It cannot be changed here.</p>
                  </div>

                  <div className="space-y-1">
                    <Input
                      id="profile-name"
                      label="Full Name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                    <p className="text-xs text-slate-500">This name will be displayed on your tickets and comments.</p>
                  </div>
                </div>

                <hr className="border-slate-200 my-6" />

                {/* Password Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                      <Input
                        id="profile-password"
                        label="New Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                      />
                      
                      {password && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-[11px]">
                          <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                            Password Requirements:
                          </p>
                          <div className="grid grid-cols-1 gap-1.5">
                            <div className={`flex items-center gap-1.5 font-medium ${hasMinLength ? "text-emerald-600 font-semibold" : "text-slate-500"}`}>
                              <span>{hasMinLength ? "✓" : "○"}</span>
                              <span>At least 8 characters</span>
                            </div>
                            <div className={`flex items-center gap-1.5 font-medium ${hasUppercase ? "text-emerald-600 font-semibold" : "text-slate-500"}`}>
                              <span>{hasUppercase ? "✓" : "○"}</span>
                              <span>At least 1 uppercase (A-Z)</span>
                            </div>
                            <div className={`flex items-center gap-1.5 font-medium ${hasNumber ? "text-emerald-600 font-semibold" : "text-slate-500"}`}>
                              <span>{hasNumber ? "✓" : "○"}</span>
                              <span>At least 1 number (0-9)</span>
                            </div>
                            <div className={`flex items-center gap-1.5 font-medium ${passwordsMatch ? "text-emerald-600 font-semibold" : "text-slate-500"}`}>
                              <span>{passwordsMatch ? "✓" : "○"}</span>
                              <span>Passwords match</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={!password ? "opacity-50 pointer-events-none" : ""}>
                      <Input
                        id="profile-confirm-password"
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        disabled={!password}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>
          
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">Please use a real name so your team can recognize you.</p>
            <Button type="submit" form="profile-form" disabled={loading} className="w-full sm:w-auto shadow-sm">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
