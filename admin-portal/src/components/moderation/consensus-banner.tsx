"use client";

import { Flame, CheckCircle } from "lucide-react";
import { useState } from "react";
import { LabelBadge } from "@/components/label-badge";
import { bulkResolveConsensus } from "@/app/actions/moderation";
import { truncateText } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ConsensusBannerProps {
  consensus: {
    postId: string;
    postText: string;
    currentLabel: string;
    suggestedLabel: string;
    reportCount: number;
    reports: { id: string }[];
  };
  adminUid: string;
  adminEmail?: string;
}

export function ConsensusBanner({ consensus, adminUid, adminEmail }: ConsensusBannerProps) {
  const [isResolving, setIsResolving] = useState(false);
  const router = useRouter();

  const handleOverrideAll = async () => {
    setIsResolving(true);
    const reportIds = consensus.reports.map((r) => r.id);

    const res = await bulkResolveConsensus(
      consensus.postId,
      consensus.suggestedLabel,
      reportIds,
      adminUid,
      adminEmail
    );

    setIsResolving(false);
    if (res.success) {
      toast.success(`Resolved ${reportIds.length} reports and updated post label.`);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to resolve consensus.");
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-amber-400">
            High-Confidence Consensus
          </h3>
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">
            {consensus.reportCount} users agree
          </span>
        </div>
        <p className="text-sm text-zinc-300 mb-2 leading-relaxed">
          &quot;{truncateText(consensus.postText, 120)}&quot;
        </p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Current:</span>
          <LabelBadge label={consensus.currentLabel} />
          <span className="text-zinc-500 mx-1">→</span>
          <span className="text-zinc-500">Suggested:</span>
          <LabelBadge label={consensus.suggestedLabel} />
        </div>
      </div>

      <button
        onClick={handleOverrideAll}
        disabled={isResolving}
        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" />
        {isResolving ? "Resolving..." : "Override All"}
      </button>
    </div>
  );
}
