import { FileText, Users, Flag, Activity } from "lucide-react";

interface PlatformTotalsProps {
  totals: {
    totalPosts: number;
    totalUsers: number;
    totalReports: number;
    normalCount: number;
    offensiveCount: number;
    hatefulCount: number;
    normalPercent: number;
    offensivePercent: number;
    hatefulPercent: number;
  };
}

export function PlatformTotals({ totals }: PlatformTotalsProps) {
  const cards = [
    {
      label: "All-Time Posts",
      value: totals.totalPosts.toLocaleString(),
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Total Users",
      value: totals.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      label: "Total Reports",
      value: totals.totalReports.toLocaleString(),
      icon: Flag,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      label: "Avg Hateful",
      value: `${totals.hatefulPercent}%`,
      icon: Activity,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
  ];

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

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-3">
          All-Time Classifications
        </p>
        <div className="flex rounded-full overflow-hidden h-3">
          {totals.normalPercent > 0 && (
            <div className="bg-green-500 transition-all" style={{ width: `${totals.normalPercent}%` }} />
          )}
          {totals.offensivePercent > 0 && (
            <div className="bg-amber-500 transition-all" style={{ width: `${totals.offensivePercent}%` }} />
          )}
          {totals.hatefulPercent > 0 && (
            <div className="bg-red-500 transition-all" style={{ width: `${totals.hatefulPercent}%` }} />
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Normal {totals.normalPercent}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Offensive {totals.offensivePercent}%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Hateful {totals.hatefulPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
