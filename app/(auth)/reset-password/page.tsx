"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store";
import { addToast } from "@/store/uiSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authApi } from "@/services/api";

function ResetPasswordForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  // Live Password Requirements
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  
  const isValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch;

  useEffect(() => {
    if (!token) {
      dispatch(addToast({ type: "error", message: "Invalid or missing reset token." }));
    }
  }, [token, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });
    
    if (!token) {
      dispatch(addToast({ type: "error", message: "Invalid or missing reset token." }));
      return;
    }

    if (!isValid) {
      dispatch(addToast({ type: "error", message: "Please meet all password requirements." }));
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      dispatch(addToast({ type: "success", message: "Password has been successfully reset. Please sign in." }));
      router.push("/login");
    } catch (err: any) {
      const message = err.message || "Failed to reset password. The link might be expired.";
      dispatch(addToast({ type: "error", message }));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-500/5 text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Invalid Link</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          The password reset link is invalid or missing a token.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/forgot-password">
            <Button size="md">Request new link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-500/5">
      <div className="mb-8 text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Reset Password</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Create a new secure password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Input
            id="password"
            label="New Password"
            required
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            autoComplete="new-password"
          />

          <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-[11px]">
            <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
              Password Requirements:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
        </div>

        <Input
          id="confirmPassword"
          label="Confirm New Password"
          required
          type="password"
          placeholder="Repeat your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full mt-4" size="lg" loading={loading} disabled={!isValid}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
