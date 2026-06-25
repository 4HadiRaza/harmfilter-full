import {
  getPlatformTotals,
  getTopActiveUsers,
  getQuizCompletionRates,
  getLanguageBreakdown,
} from "@/app/actions/analytics";
import { getPostVolumeChart, getClassificationChart } from "@/app/actions/dashboard";
import { getCurrentAdmin } from "@/app/actions/auth";
import { PlatformTotals } from "@/components/analytics/platform-totals";
import { TopUsersTable } from "@/components/analytics/top-users-table";
import { QuizStats } from "@/components/analytics/quiz-stats";
import { LanguageBreakdown } from "@/components/analytics/language-breakdown";
import { PostVolumeChart } from "@/app/(admin)/dashboard/post-volume-chart";
import { ClassificationBarChart } from "@/app/(admin)/dashboard/classification-bar-chart";

export default async function AnalyticsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  const [totals, topUsers, quizStats, langData, volumeData, classData] = await Promise.all([
    getPlatformTotals(),
    getTopActiveUsers(10),
    getQuizCompletionRates(),
    getLanguageBreakdown(),
    getPostVolumeChart(),
    getClassificationChart(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Analytics</h1>
        <p className="text-sm text-zinc-500 mt-1">Deep dive into platform data and user behavior</p>
      </div>

      <PlatformTotals totals={totals} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostVolumeChart data={volumeData} />
        <ClassificationBarChart data={classData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TopUsersTable data={topUsers} />
          <QuizStats stats={quizStats} />
        </div>
        <div className="lg:col-span-1">
          <LanguageBreakdown data={langData} />
        </div>
      </div>
    </div>
  );
}
