"use client";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "link";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 active:from-indigo-600 active:to-indigo-700 text-white shadow-sm shadow-indigo-400/25 border border-indigo-500/30 font-semibold",
  secondary:
    "bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-2xs font-medium",
  danger:
    "bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-sm shadow-rose-500/20 border border-rose-600/30 font-semibold",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent font-medium",
  outline:
    "border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs font-medium",
  link:
    "bg-transparent text-indigo-600 hover:text-indigo-700 hover:underline p-0 h-auto font-medium",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg h-8 gap-1.5",
  md: "px-4 py-2 text-xs font-semibold rounded-lg h-9 gap-2",
  lg: "px-5 py-2.5 text-sm font-semibold rounded-xl h-10 gap-2.5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none cursor-pointer tracking-tight",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
export default Button;
