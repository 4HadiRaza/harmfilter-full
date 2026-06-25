import { cn } from "@/lib/utils";
import { LABEL_COLORS, LABEL_NAMES } from "@/lib/constants";

interface LabelBadgeProps {
  label: string;
  size?: "sm" | "md";
  className?: string;
}

export function LabelBadge({ label, size = "sm", className }: LabelBadgeProps) {
  const normalized = label.toLowerCase() === "hate" ? "hateful" : label.toLowerCase();
  const colors = LABEL_COLORS[normalized as keyof typeof LABEL_COLORS] ?? LABEL_COLORS.normal;
  const displayName = LABEL_NAMES[label.toLowerCase()] ?? label;

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full uppercase tracking-wide border",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        className
      )}
      style={{
        color: colors.bg,
        backgroundColor: colors.bgMuted,
        borderColor: colors.border,
      }}
    >
      {displayName}
    </span>
  );
}
