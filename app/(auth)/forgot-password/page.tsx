"use client";
import { useState } from "react";
import Link from "next/link";
import { useAppDispatch } from "@/store";
import { addToast } from "@/store/uiSlice";
import { APP_NAME } from "@/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { authApi } from "@/services/api";

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setIsSubmitted(true);
      dispatch(addToast({ type: "success", message: "Password reset link has been requested." }));
    } catch (err: any) {
      const message = err.message || "Something went wrong.";
      dispatch(addToast({ type: "error", message }));
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-500/5 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-md shadow-emerald-500/10 mb-4 text-emerald-600">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Check your email</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          If an account exists for <strong className="text-slate-900 font-semibold">{email}</strong>, we have sent password reset instructions.
        </p>

        <div className="mt-8 flex justify-center">
          <Link href="/login">
            <Button variant="ghost" size="md">Return to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-500/5">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 shadow-sm border border-slate-200/80 mb-3 text-slate-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Forgot Password?</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Enter your email to receive a reset link</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          label="Work Email"
          required
          type="email"
          placeholder="you@company.dev"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <Button type="submit" className="w-full mt-2" size="lg" loading={loading} disabled={!email.trim()}>
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6">
        Remember your password?{" "}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
