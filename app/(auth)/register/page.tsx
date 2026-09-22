"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { register, login } from "@/store/authSlice";
import { addToast } from "@/store/uiSlice";
import { APP_NAME } from "@/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isLoading = useAppSelector((s) => s.auth.isLoading);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Password requirement checklist checks
  const hasMinLength = form.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) {
      errs.fullName = "Full name is required";
    } else if (form.fullName.trim().length < 2) {
      errs.fullName = "Full name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      errs.email = "Work email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = "Please enter a valid email address";
    }

    if (!form.password) {
      errs.password = "Password is required";
    } else if (!hasMinLength) {
      errs.password = "Password must be at least 8 characters";
    } else if (!hasUppercase) {
      errs.password = "Password must contain at least one uppercase letter";
    } else if (!hasNumber) {
      errs.password = "Password must contain at least one number";
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = "Confirm password is required";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!validate()) {
      dispatch(addToast({
        type: "error",
        message: "Please fix the errors in the form before submitting.",
      }));
      return;
    }

    try {
      const email = form.email.trim();
      await dispatch(
        register({
          full_name: form.fullName.trim(),
          email,
          password: form.password,
        })
      ).unwrap();

      setRegisteredEmail(email);
      setIsRegistered(true);
      dispatch(addToast({
        type: "success",
        message: "Registration submitted successfully!",
      }));
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const message = apiErr.message || "Registration failed. Please check your details.";
      
      // If backend provided field-level validation errors, map them
      if (apiErr.errors && Array.isArray(apiErr.errors)) {
        const fieldErrors: Record<string, string> = {};
        apiErr.errors.forEach((e) => {
          if (e.field === "full_name") fieldErrors.fullName = e.message;
          else if (e.field === "email") fieldErrors.email = e.message;
          else if (e.field === "password") fieldErrors.password = e.message;
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      dispatch(addToast({ type: "error", message }));
    }
  };

  if (isRegistered) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-500/5 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-md shadow-amber-500/10 mb-4 text-amber-600">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Registration Submitted</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          Your account for <strong className="text-slate-900 font-semibold">{registeredEmail}</strong> has been created and is <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Pending Admin Approval</span>.
        </p>
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 space-y-2">
          <div className="flex items-start gap-2.5">
            <span className="text-indigo-600 font-bold">1.</span>
            <span>An administrator will review and approve your access request.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-indigo-600 font-bold">2.</span>
            <span>Once approved, you will be able to log in with your email and password.</span>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => router.push("/login")} size="md" className="w-full sm:w-auto">
            Back to Sign In
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="w-full sm:w-auto"
            onClick={() => {
              setIsRegistered(false);
              setForm({ fullName: "", email: "", password: "", confirmPassword: "" });
            }}
          >
            Register Another Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-indigo-500/5">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-md shadow-indigo-500/20 mb-3 text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Join {APP_NAME}</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Create your developer account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="fullName"
          label="Full Name"
          required
          placeholder="e.g. John Doe"
          value={form.fullName}
          onChange={(e) => {
            setForm((f) => ({ ...f, fullName: e.target.value }));
            if (errors.fullName) setErrors((err) => ({ ...err, fullName: "" }));
          }}
          onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
          error={touched.fullName ? errors.fullName : undefined}
          autoComplete="name"
        />

        <Input
          id="email"
          label="Work Email"
          required
          type="email"
          placeholder="e.g. johndoe@company.com"
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
            placeholder="Create a strong password"
            value={form.password}
            onChange={(e) => {
              setForm((f) => ({ ...f, password: e.target.value }));
              if (errors.password) setErrors((err) => ({ ...err, password: "" }));
            }}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={touched.password ? errors.password : undefined}
            autoComplete="new-password"
          />

          {/* Live Password Requirements Checklist */}
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
          label="Confirm Password"
          required
          type="password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={(e) => {
            setForm((f) => ({ ...f, confirmPassword: e.target.value }));
            if (errors.confirmPassword) setErrors((err) => ({ ...err, confirmPassword: "" }));
          }}
          onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
          error={touched.confirmPassword ? errors.confirmPassword : undefined}
          autoComplete="new-password"
        />

        <Button type="submit" className="w-full mt-3" size="lg" loading={isLoading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-xs text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline font-bold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
