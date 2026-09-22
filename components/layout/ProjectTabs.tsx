"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TabsProps {
  projectId: string;
}

const tabs = [
  { label: "Overview", href: "" },
  { label: "Backlog", href: "/backlog" },
  { label: "Board", href: "/board" },
  { label: "Sprints", href: "/sprints" },
  { label: "Members", href: "/members" },
];

export default function ProjectTabs({ projectId }: TabsProps) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <div className="border-b border-slate-200/80 px-6 bg-white/60 backdrop-blur-xs">
      <nav className="flex gap-4 sm:gap-6 -mb-px overflow-x-auto py-2">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`;
          const active = tab.href === ""
            ? pathname === base
            : pathname.startsWith(href);
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                "shrink-0 px-4 py-2.5 text-sm sm:text-[15px] font-bold rounded-xl transition-colors duration-200",
                active
                  ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
