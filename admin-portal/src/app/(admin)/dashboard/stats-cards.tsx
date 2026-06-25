import { FileText, Users, AlertTriangle, Flame } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Posts",
      value: stats.totalPosts.toLocaleString(),
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Pending Reports",
      value: stats.pendingReports.toLocaleString(),
      icon: AlertTriangle,
      color: stats.pendingReports > 0 ? "text-amber-400" : "text-zinc-400",
      bgColor: stats.pendingReports > 0 ? "bg-amber-500/10" : "bg-zinc-500/10",
      borderColor: stats.pendingReports > 0 ? "border-amber-500/20" : "border-zinc-500/20",
    },
    {
      label: "Hateful Today",
      value: stats.hatefulToday.toLocaleString(),
      icon: Flame,
      color: stats.hatefulToday > 0 ? "text-red-400" : "text-zinc-400",
      bgColor: stats.hatefulToday > 0 ? "bg-red-500/10" : "bg-zinc-500/10",
      borderColor: stats.hatefulToday > 0 ? "border-red-500/20" : "border-zinc-500/20",
    },
  ];

  const { normal, offensive, hateful } = stats.todayBreakdown;
  const todayTotal = normal + offensive + hateful;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.borderColor} ${card.bgColor} p-4`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                {card.label}
              </span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Today's classification bar */}
      {todayTotal > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
            Today&apos;s Classifications
          </p>
          <div className="flex rounded-full overflow-hidden h-3">
            {normal > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(normal / todayTotal) * 100}%` }}
              />
            )}
            {offensive > 0 && (
              <div
                className="bg-amber-500 transition-all"
                style={{ width: `${(offensive / todayTotal) * 100}%` }}
              />
            )}
            {hateful > 0 && (
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${(hateful / todayTotal) * 100}%` }}
              />
            )}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Normal {normal}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Offensive {offensive}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Hateful {hateful}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
