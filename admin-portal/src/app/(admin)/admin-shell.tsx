"use client";

import { Sidebar } from "@/components/sidebar";
import { useEffect, useState } from "react";

interface AdminShellProps {
  admin: { uid: string; email: string; name: string; picture: string };
  children: React.ReactNode;
}

export function AdminShell({ admin, children }: AdminShellProps) {
  const [pendingReports, setPendingReports] = useState(0);

  // Poll for pending reports count every 30 seconds
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/reports-count");
        if (res.ok) {
          const data = await res.json();
          setPendingReports(data.count);
        }
      } catch {
        // Silently fail
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        pendingReports={pendingReports}
        adminName={admin.name}
        adminEmail={admin.email}
      />
      <main className="flex-1 ml-[260px] min-h-screen">
        <div className="p-6 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
