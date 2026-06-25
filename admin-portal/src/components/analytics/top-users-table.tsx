import Link from "next/link";
import { Trophy, MessageSquare } from "lucide-react";

interface UserStats {
  uid: string;
  displayName: string;
  email: string;
  points: number;
  postCount?: number;
}

interface TopUsersTableProps {
  data: {
    byPosts: UserStats[];
    byPoints: UserStats[];
  };
}

export function TopUsersTable({ data }: TopUsersTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Most Active (Posts) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-300">Most Active (Posts)</h3>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {data.byPosts.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">No data available.</p>
          ) : (
            data.byPosts.map((user, i) => (
              <Link
                key={user.uid}
                href={`/users/${user.uid}`}
                className="flex items-center justify-between p-3 hover:bg-zinc-800/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-500 w-4">{i + 1}.</span>
                  <div>
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {user.displayName}
                    </p>
                    <p className="text-[10px] text-zinc-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-300">{user.postCount}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Posts</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Leaderboard (Points) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-zinc-300">Leaderboard</h3>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {data.byPoints.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">No data available.</p>
          ) : (
            data.byPoints.map((user, i) => (
              <Link
                key={user.uid}
                href={`/users/${user.uid}`}
                className="flex items-center justify-between p-3 hover:bg-zinc-800/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-4 ${
                    i === 0 ? "text-amber-400" :
                    i === 1 ? "text-zinc-300" :
                    i === 2 ? "text-amber-700" : "text-zinc-500"
                  }`}>
                    {i + 1}.
                  </span>
                  <div>
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                      {user.displayName}
                    </p>
                    <p className="text-[10px] text-zinc-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-400">{user.points}</p>
                  <p className="text-[10px] text-zinc-500 uppercase">Points</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
