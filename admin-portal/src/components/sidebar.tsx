"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  FileText,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { revokeSession } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/moderation", label: "Moderation", icon: Shield },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/users", label: "Users", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

interface SidebarProps {
  pendingReports?: number;
  adminName?: string;
  adminEmail?: string;
}

export function Sidebar({ pendingReports = 0, adminName, adminEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await revokeSession();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-200",
        collapsed ? "w-[64px]" : "w-[260px]"
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-zinc-800 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-red-500" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-zinc-100 truncate">HarmFilter</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Admin</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          const showBadge = item.href === "/moderation" && pendingReports > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {showBadge && (
                <span
                  className={cn(
                    "bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center",
                    collapsed
                      ? "absolute -top-1 -right-1 w-4 h-4"
                      : "ml-auto min-w-[20px] h-5 px-1.5"
                  )}
                >
                  {pendingReports > 99 ? "99+" : pendingReports}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin + Collapse */}
      <div className="border-t border-zinc-800 p-2 space-y-1 shrink-0">
        {!collapsed && adminName && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-zinc-300 truncate">{adminName}</p>
            <p className="text-[10px] text-zinc-500 truncate">{adminEmail}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors w-full"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
