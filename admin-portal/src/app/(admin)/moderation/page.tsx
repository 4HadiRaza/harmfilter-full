import { getReportsWithConsensus } from "@/app/actions/moderation";
import { getCurrentAdmin } from "@/app/actions/auth";
import { ModerationTable } from "@/components/moderation/moderation-table";
import { ConsensusBanner } from "@/components/moderation/consensus-banner";

export default async function ModerationPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  const searchParams = await props.searchParams;

  const filters = {
    currentFlag: searchParams.currentFlag,
    reportedAs: searchParams.reportedAs,
    status: searchParams.status ?? "pending",
    search: searchParams.search,
  };

  const { reports, consensus } = await getReportsWithConsensus(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Moderation Queue</h1>
        <p className="text-sm text-zinc-500 mt-1">Review and resolve user reports</p>
      </div>

      {consensus.length > 0 && filters.status !== "resolved" && filters.status !== "dismissed" && (
        <div className="space-y-4">
          {consensus.map((c) => (
            <ConsensusBanner
              key={c.postId}
              consensus={c}
              adminUid={admin.uid}
              adminEmail={admin.email}
            />
          ))}
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <ModerationTable
          initialReports={reports}
          filters={filters}
          adminUid={admin.uid}
          adminEmail={admin.email}
        />
      </div>
    </div>
  );
}
