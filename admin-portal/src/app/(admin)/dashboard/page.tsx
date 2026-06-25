import {
  getDashboardStats,
  getPostVolumeChart,
  getClassificationChart,
  getRecentPosts,
  getRecentReports,
} from "@/app/actions/dashboard";
import { StatsCards } from "./stats-cards";
import { PostVolumeChart } from "./post-volume-chart";
import { ClassificationBarChart } from "./classification-bar-chart";
import { RecentActivity } from "./recent-activity";

export default async function DashboardPage() {
  const [stats, volumeData, classificationData, recentPosts, recentReports] =
    await Promise.all([
      getDashboardStats(),
      getPostVolumeChart(),
      getClassificationChart(),
      getRecentPosts(10),
      getRecentReports(5),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Platform overview and activity</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PostVolumeChart data={volumeData} />
        <ClassificationBarChart data={classificationData} />
      </div>

      <RecentActivity posts={recentPosts} reports={recentReports} />
    </div>
  );
}
