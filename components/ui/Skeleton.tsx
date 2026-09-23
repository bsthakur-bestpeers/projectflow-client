"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "default" | "subtle";
}

/**
 * Basic Shimmer building block with glowing wave animation
 */
export function Shimmer({ className, variant = "default", ...props }: ShimmerProps) {
  return (
    <div
      className={cn(
        variant === "default" ? "shimmer" : "shimmer-subtle",
        "rounded-md",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton alias with common presets
 */
export function Skeleton({
  className,
  rounded = "md",
  ...props
}: ShimmerProps & { rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full" }) {
  const roundedClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full",
  }[rounded];

  return <Shimmer className={cn(roundedClass, className)} {...props} />;
}

/**
 * Universal Page Shimmer Skeleton
 */
export function PageShimmer() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-[450px] animate-fade-in">
      {/* Top Header Shimmer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-200/70">
        <div className="space-y-2">
          <Shimmer className="h-7 w-48 sm:w-64 rounded-lg" />
          <Shimmer className="h-4 w-32 sm:w-44 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-28 rounded-xl" />
          <Shimmer className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Grid of Shimmer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shimmer className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Shimmer className="h-4 w-28 rounded-md" />
                  <Shimmer className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Shimmer className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2 pt-1">
              <Shimmer className="h-3.5 w-full rounded-md" />
              <Shimmer className="h-3.5 w-4/5 rounded-md" />
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Shimmer className="h-5 w-24 rounded-md" />
              <Shimmer className="h-5 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Projects Page Shimmer Skeleton
 */
export function ProjectsPageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <Shimmer className="h-8 w-44 rounded-lg" />
          <Shimmer className="h-4 w-36 rounded-md" />
        </div>
        <Shimmer className="h-10 w-32 rounded-xl" />
      </div>

      {/* Controls: Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Shimmer className="h-9 w-28 rounded-xl" />
          <Shimmer className="h-9 w-28 rounded-xl" />
        </div>
        <Shimmer className="h-10 w-full sm:w-72 rounded-xl" />
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white/90 border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shimmer className="w-11 h-11 rounded-xl shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <Shimmer className="h-4.5 w-32 rounded-md" />
                  <Shimmer className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <Shimmer className="h-5 w-16 rounded-full shrink-0" />
            </div>

            <div className="space-y-2 py-1">
              <Shimmer className="h-3.5 w-full rounded-md" />
              <Shimmer className="h-3.5 w-2/3 rounded-md" />
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <Shimmer className="h-3 w-16 rounded-md" />
                <Shimmer className="h-3 w-10 rounded-md" />
              </div>
              <Shimmer className="h-2 w-full rounded-full" />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex -space-x-1.5">
                <Shimmer className="w-6 h-6 rounded-full" />
                <Shimmer className="w-6 h-6 rounded-full" />
                <Shimmer className="w-6 h-6 rounded-full" />
              </div>
              <Shimmer className="h-4 w-12 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard Page Shimmer Skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen animate-fade-in space-y-6">
      {/* Welcome Banner Shimmer */}
      <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Shimmer className="w-6 h-6 rounded-md" />
            <Shimmer className="h-7 w-56 rounded-lg" />
          </div>
          <Shimmer className="h-4 w-72 rounded-md" />
        </div>
        <Shimmer className="h-10 w-32 rounded-xl" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Shimmer className="h-3.5 w-24 rounded-md" />
              <Shimmer className="w-8 h-8 rounded-xl" />
            </div>
            <Shimmer className="h-7 w-16 rounded-md" />
            <Shimmer className="h-3 w-28 rounded-md" />
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Projects Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <Shimmer className="h-6 w-36 rounded-md" />
            <Shimmer className="h-4 w-16 rounded-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center gap-3">
                  <Shimmer className="w-9 h-9 rounded-xl" />
                  <div className="space-y-1 flex-1">
                    <Shimmer className="h-4 w-28 rounded-md" />
                    <Shimmer className="h-3 w-16 rounded-md" />
                  </div>
                </div>
                <Shimmer className="h-3 w-full rounded-md" />
                <Shimmer className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Activity / Tickets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Shimmer className="h-6 w-32 rounded-md" />
            <Shimmer className="h-4 w-14 rounded-md" />
          </div>
          <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2.5">
                  <Shimmer className="w-6 h-6 rounded-md shrink-0" />
                  <div className="space-y-1">
                    <Shimmer className="h-3.5 w-32 rounded-md" />
                    <Shimmer className="h-2.5 w-20 rounded-md" />
                  </div>
                </div>
                <Shimmer className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Kanban Board Page Shimmer Skeleton
 */
export function BoardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen animate-fade-in space-y-6">
      {/* Board Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shimmer className="h-7 w-36 rounded-lg" />
          <Shimmer className="h-5 w-20 rounded-full" />
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Shimmer className="h-9 w-44 rounded-xl" />
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <Shimmer key={i} className="w-7 h-7 rounded-full" />
            ))}
          </div>
          <Shimmer className="h-9 w-36 rounded-xl" />
          <Shimmer className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Kanban Columns (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {["To Do", "In Progress", "In Review", "Done"].map((col, idx) => (
          <div
            key={col}
            className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col h-[500px] lg:h-[calc(100vh-280px)] min-h-[460px] max-h-[500px] lg:max-h-[calc(100vh-280px)] space-y-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Shimmer className="w-2.5 h-2.5 rounded-full" />
                <Shimmer className="h-4 w-20 rounded-md" />
              </div>
              <Shimmer className="h-4 w-6 rounded-full" />
            </div>

            {/* Ticket Cards */}
            <div className="space-y-3">
              {[1, 2, idx === 0 ? 3 : 0].filter(Boolean).map((cardId) => (
                <div
                  key={cardId}
                  className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs space-y-3"
                >
                  <Shimmer className="h-4 w-4/5 rounded-md" />
                  <div className="flex items-center gap-2">
                    <Shimmer className="h-4 w-12 rounded-md" />
                    <Shimmer className="h-4 w-16 rounded-md" />
                    <Shimmer className="h-4 w-10 rounded-md" />
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Shimmer className="h-5 w-28 rounded-lg" />
                    <Shimmer className="w-5 h-5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Backlog Page Shimmer Skeleton
 */
export function BacklogSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Shimmer className="h-7 w-40 rounded-lg" />
          <Shimmer className="h-4 w-52 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Shimmer className="h-9 w-28 rounded-xl" />
          <Shimmer className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex items-center gap-3">
        <Shimmer className="h-9 w-64 rounded-xl" />
        <Shimmer className="h-9 w-32 rounded-xl" />
        <Shimmer className="h-9 w-32 rounded-xl" />
      </div>

      {/* Sprint Container Shimmer */}
      <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shimmer className="h-5 w-32 rounded-md" />
            <Shimmer className="h-4 w-20 rounded-full" />
            <Shimmer className="h-4 w-36 rounded-md" />
          </div>
          <Shimmer className="h-8 w-24 rounded-lg" />
        </div>

        {/* Ticket Rows */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-slate-50/60 border border-slate-200/70 rounded-xl"
            >
              <div className="flex items-center gap-3 flex-1">
                <Shimmer className="w-4 h-4 rounded-md shrink-0" />
                <Shimmer className="h-4 w-12 rounded-md shrink-0" />
                <Shimmer className="h-4 w-60 rounded-md" />
              </div>
              <div className="flex items-center gap-3">
                <Shimmer className="h-5 w-16 rounded-full" />
                <Shimmer className="h-5 w-24 rounded-lg" />
                <Shimmer className="w-6 h-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backlog Container Shimmer */}
      <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shimmer className="h-5 w-24 rounded-md" />
            <Shimmer className="h-4 w-16 rounded-full" />
          </div>
          <Shimmer className="h-8 w-28 rounded-lg" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-slate-50/60 border border-slate-200/70 rounded-xl"
            >
              <div className="flex items-center gap-3 flex-1">
                <Shimmer className="w-4 h-4 rounded-md shrink-0" />
                <Shimmer className="h-4 w-12 rounded-md shrink-0" />
                <Shimmer className="h-4 w-52 rounded-md" />
              </div>
              <div className="flex items-center gap-3">
                <Shimmer className="h-5 w-16 rounded-full" />
                <Shimmer className="h-5 w-24 rounded-lg" />
                <Shimmer className="w-6 h-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Sprints Page Shimmer Skeleton
 */
export function SprintsSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Shimmer className="h-7 w-32 rounded-lg" />
          <Shimmer className="h-4 w-44 rounded-md" />
        </div>
        <Shimmer className="h-10 w-32 rounded-xl" />
      </div>

      <div className="space-y-5">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white/90 border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shimmer className="h-5 w-36 rounded-md" />
                <Shimmer className="h-5 w-20 rounded-full" />
                <Shimmer className="h-4 w-44 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Shimmer className="h-8 w-24 rounded-lg" />
                <Shimmer className="h-8 w-8 rounded-lg" />
              </div>
            </div>

            <div className="space-y-2">
              {[1, 2, 3].map((t) => (
                <div
                  key={t}
                  className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Shimmer className="w-4 h-4 rounded-md" />
                    <Shimmer className="h-4 w-12 rounded-md" />
                    <Shimmer className="h-4 w-48 rounded-md" />
                  </div>
                  <Shimmer className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Members Page Shimmer Skeleton
 */
export function MembersSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto min-h-screen animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Shimmer className="h-7 w-36 rounded-lg" />
          <Shimmer className="h-4 w-48 rounded-md" />
        </div>
        <Shimmer className="h-10 w-36 rounded-xl" />
      </div>

      {/* Table Container */}
      <div className="bg-white/90 border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <Shimmer className="h-9 w-64 rounded-xl" />
          <Shimmer className="h-4 w-20 rounded-md" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shimmer className="w-10 h-10 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Shimmer className="h-4 w-36 rounded-md" />
                  <Shimmer className="h-3 w-48 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shimmer className="h-6 w-20 rounded-full" />
                <Shimmer className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Ticket Detail Page Shimmer Skeleton
 */
export function TicketDetailSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto min-h-screen animate-fade-in space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Shimmer className="h-4 w-16 rounded-md" />
        <span className="text-slate-300">/</span>
        <Shimmer className="h-4 w-24 rounded-md" />
        <span className="text-slate-300">/</span>
        <Shimmer className="h-4 w-16 rounded-md" />
      </div>

      {/* Title */}
      <Shimmer className="h-9 w-3/4 rounded-xl" />

      {/* Meta Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/70">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1.5">
            <Shimmer className="h-3 w-14 rounded-md" />
            <Shimmer className="h-8 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Description Canvas */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
        <Shimmer className="h-4 w-24 rounded-md" />
        <div className="space-y-2.5 pt-2">
          <Shimmer className="h-4 w-full rounded-md" />
          <Shimmer className="h-4 w-11/12 rounded-md" />
          <Shimmer className="h-4 w-4/5 rounded-md" />
        </div>
      </div>
    </div>
  );
}
