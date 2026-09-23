"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import { PageSpinner } from "@/components/ui/Misc";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, initialized, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (initialized) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role === "ADMIN") {
        router.replace("/admin/users");
      }
    }
  }, [initialized, isAuthenticated, user, router]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  if (!isAuthenticated || user?.role === "ADMIN") return null;

  return (
    <div className="min-h-screen bg-slate-50/60 aurora-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden min-w-0 bg-transparent">{children}</main>
      </div>
    </div>
  );
}
