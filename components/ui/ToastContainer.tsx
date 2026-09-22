"use client";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { removeToast, Toast } from "@/store/uiSlice";
import { cn } from "@/lib/utils";

const toastStyles: Record<Toast["type"], string> = {
  success: "border-emerald-200 bg-white/95 text-slate-800 shadow-xl shadow-emerald-500/10 border-l-4 border-l-emerald-500",
  error: "border-rose-200 bg-white/95 text-slate-800 shadow-xl shadow-rose-500/10 border-l-4 border-l-rose-500",
  warning: "border-amber-200 bg-white/95 text-slate-800 shadow-xl shadow-amber-500/10 border-l-4 border-l-amber-500",
  info: "border-indigo-200 bg-white/95 text-slate-800 shadow-xl shadow-indigo-500/10 border-l-4 border-l-indigo-500",
};

const toastIcons: Record<Toast["type"], { icon: string; color: string }> = {
  success: { icon: "✓", color: "text-emerald-600 bg-emerald-50" },
  error: { icon: "✕", color: "text-rose-600 bg-rose-50" },
  warning: { icon: "!", color: "text-amber-600 bg-amber-50" },
  info: { icon: "i", color: "text-indigo-600 bg-indigo-50" },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), 4500);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  const { icon, color } = toastIcons[toast.type];

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-md",
        "min-w-[320px] max-w-[440px] animate-in slide-in-from-right-full duration-200 select-none",
        toastStyles[toast.type]
      )}
    >
      <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs", color)}>
        {icon}
      </span>
      <p className="text-xs sm:text-sm font-semibold text-slate-800 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="ml-auto shrink-0 text-slate-400 hover:text-slate-700 transition-colors text-xs p-1 rounded-md hover:bg-slate-100 cursor-pointer"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useAppSelector((s) => s.ui.toasts);

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-auto">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
