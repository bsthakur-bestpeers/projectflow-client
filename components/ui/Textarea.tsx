"use client";
import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-tight">
          {label}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        rows={4}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 resize-y",
          "bg-white border transition-all duration-150 shadow-2xs",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600",
          error
            ? "border-rose-300 focus:ring-rose-200 focus:border-rose-500"
            : "border-slate-200/90 hover:border-slate-300",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
export default Textarea;
