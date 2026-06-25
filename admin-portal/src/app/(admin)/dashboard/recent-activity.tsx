import Link from "next/link";
import { LabelBadge } from "@/components/label-badge";
import { truncateText, timeAgo } from "@/lib/utils";
import type { Post, Report } from "@/lib/types";
import { FileText, Flag } from "lucide-react";

interface RecentActivityProps {
  posts: Post[];
  reports: (Report & { postText?: string; reporterName?: string })[];
}

export function RecentActivity({ posts, reports }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Posts */}
      <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
          <FileText className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-300">Recent Posts</h3>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {posts.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">No posts yet.</p>
          ) : (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts?detail=${post.id}`}
                className="flex items-start gap-3 p-3 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-300 truncate">
                      {post.username}
                    </span>
                    <LabelBadge label={post.label} />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {truncateText(post.text, 100)}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5">
                  {timeAgo(post.createdAt)}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
          <Flag className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-300">Recent Reports</h3>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {reports.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">No reports yet.</p>
          ) : (
            reports.map((report) => (
              <Link
                key={report.id}
                href="/moderation"
                className="block p-3 hover:bg-zinc-800/30 transition-colors"
              >
                <p className="text-xs text-zinc-400 mb-1.5 leading-relaxed">
                  {truncateText(report.postText ?? "", 60)}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <LabelBadge label={report.currentFlag} />
                  <span className="text-[10px] text-zinc-500">→</span>
                  <LabelBadge label={report.reportedAs} />
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5">
                  by {report.reporterName} · {timeAgo(report.reportedAt)}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
