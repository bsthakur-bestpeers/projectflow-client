"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  rightElement?: React.ReactNode;
  showPasswordToggle?: boolean;
  list?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      required,
      type = "text",
      rightElement,
      showPasswordToggle,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === "password" || showPasswordToggle;
    const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5 tracking-tight">
            {label.replace(/\s*\*+$/, "")}
            {(required || label.trim().endsWith("*")) && (
              <span className="text-rose-500 font-bold ml-1" title="Required field">*</span>
            )}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={id}
            ref={ref}
            type={inputType}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400",
              "bg-white border transition-all duration-150 shadow-2xs",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white",
              (isPasswordField || Boolean(rightElement)) ? "pr-10" : undefined,
              error
                ? "border-rose-400 focus:ring-rose-200 focus:border-rose-500 bg-rose-50/20"
                : "border-slate-200/90 hover:border-slate-300",
              className
            )}
            {...props}
          />

          {/* Password Eye Toggle */}
          {isPasswordField && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                // Eye Off Icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                // Eye Open Icon
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}

          {!isPasswordField && rightElement && (
            <div className="absolute right-3 flex items-center">{rightElement}</div>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>}
        {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
