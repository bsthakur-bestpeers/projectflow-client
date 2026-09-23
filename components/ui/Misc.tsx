"use client";
import { cn } from "@/lib/utils";
import { PageShimmer } from "./Skeleton";

export * from "./Skeleton";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin text-indigo-600", className ?? "h-5 w-5")}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export function PageSpinner() {
  return <PageShimmer />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white/70 border border-slate-200/80 rounded-2xl shadow-2xs backdrop-blur-xs">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <h3 className="text-base font-bold text-slate-800 tracking-tight mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 mb-5 max-w-sm leading-relaxed">{description}</p>}
      {action && action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-rose-50/50 border border-rose-100 rounded-2xl">
      <div className="w-12 h-12 rounded-xl bg-rose-100/80 flex items-center justify-center mb-3 shadow-2xs">
        <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-rose-800 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline cursor-pointer">
          Try again
        </button>
      )}
    </div>
  );
}

const avatarGradients = [
  "from-indigo-500 to-purple-600",
  "from-violet-500 to-fuchsia-600",
  "from-sky-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-indigo-600",
];

export function Avatar({ name, size = "md" }: { name: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const sizes = {
    xs: "h-5 w-5 text-[9px]",
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };
  const gradient = avatarGradients[(name.charCodeAt(0) || 0) % avatarGradients.length];
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-xs select-none bg-gradient-to-tr",
        sizes[size],
        gradient
      )}
    >
      {initials}
    </div>
  );
}
