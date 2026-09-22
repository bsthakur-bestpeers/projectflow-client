"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { login } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { APP_NAME } from "@/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isLoading = useAppSelector((s) => s.auth.isLoading);

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) {
      errs.email = "Work email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Please enter a valid email address";
    }

    if (!form.password) {
      errs.password = "Password is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setPendingNotice(null);

    if (!validate()) {
      dispatch(addToast({
        type: "error",
        message: "Please enter your email and password.",
      }));
      return;
    }

    try {
      const loggedInUser = await dispatch(login({ email: form.email.trim(), password: form.password })).unwrap();
      dispatch(addToast({ type: "success", message: "Welcome back!" }));
      if (loggedInUser.role === "ADMIN") {
        router.push("/admin/users");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const message = apiErr.message || "Invalid credentials. Please try again.";

      if (message.toLowerCase().includes("pending admin approval") || message.toLowerCase().includes("pending")) {
        setPendingNotice(message);
      } else if (message.toLowerCase().includes("not approved")) {
        setPendingNotice(message);
      }

      if (apiErr.errors && Array.isArray(apiErr.errors)) {
        const fieldErrors: Record<string, string> = {};
        apiErr.errors.forEach((e) => {
          if (e.field === "email") fieldErrors.email = e.message;
          else if (e.field === "password") fieldErrors.password = e.message;
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      dispatch(addToast({ type: "error", message }));
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-500/5">
      {pendingNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-800 text-xs flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold text-amber-900">Account Pending Approval</p>
            <p className="mt-0.5 leading-relaxed">{pendingNotice}</p>
          </div>
        </div>
      )}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20 mb-3 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{APP_NAME}</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Sign in to your team workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          label="Work Email"
          required
          type="email"
          placeholder="you@company.dev"
          value={form.email}
          onChange={(e) => {
            setForm((f) => ({ ...f, email: e.target.value }));
            if (errors.email) setErrors((err) => ({ ...err, email: "" }));
          }}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={touched.email ? errors.email : undefined}
          autoComplete="email"
        />
        <div>
          <Input
            id="password"
            label="Password"
            required
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => {
              setForm((f) => ({ ...f, password: e.target.value }));
              if (errors.password) setErrors((err) => ({ ...err, password: "" }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={touched.password ? errors.password : undefined}
            autoComplete="current-password"
          />
          <div className="flex justify-end mt-1">
            <Link href="/forgot-password" className="text-[11px] text-indigo-600 hover:text-indigo-700 hover:underline font-semibold">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full mt-2" size="lg" loading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold">
          Create one now
        </Link>
      </p>
    </div>
  );
}
