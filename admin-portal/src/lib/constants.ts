export const LABEL_COLORS = {
  normal: { bg: "#22c55e", text: "#ffffff", bgMuted: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)" },
  offensive: { bg: "#f59e0b", text: "#ffffff", bgMuted: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.3)" },
  hateful: { bg: "#ef4444", text: "#ffffff", bgMuted: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.3)" },
} as const;

export const LABEL_NAMES: Record<string, string> = {
  normal: "Normal",
  offensive: "Offensive",
  hateful: "Hateful",
  hate: "Hateful",
  safe: "Normal",
};

export const REPORT_STATUSES = {
  pending: { label: "Pending", color: "text-amber-400" },
  resolved: { label: "Resolved", color: "text-green-400" },
  dismissed: { label: "Dismissed", color: "text-zinc-400" },
} as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/moderation", label: "Moderation", icon: "Shield" },
  { href: "/posts", label: "Posts", icon: "FileText" },
  { href: "/users", label: "Users", icon: "Users" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
] as const;

export const QUIZ_NAMES: Record<string, string> = {
  en_1: "Hate Speech Basics",
  en_2: "Spot the Harm",
  en_3: "Counter & Respond",
  ur_1: "Naphrat Se Bhara Bayan - Bunyadi",
  ur_2: "Nuqsan Pehchano",
  ur_3: "Muqabla Aur Jawab",
};

export const CONSENSUS_THRESHOLD = 3;
