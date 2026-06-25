"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { Search, FilterX, Users, ArrowUpDown } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/lib/types";

type EnrichedUser = UserProfile & { postCount: number; reportCount: number };

interface UsersTableProps {
  initialUsers: EnrichedUser[];
  filters: {
    search?: string;
    sortBy?: "points" | "joinedAt";
    sortDir?: "asc" | "desc";
  };
}

export function UsersTable({ initialUsers, filters }: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilters = (key: string, value: string | null | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleSort = (field: "points" | "joinedAt") => {
    if (filters.sortBy === field) {
      updateFilters("sortDir", filters.sortDir === "desc" ? "asc" : "desc");
    } else {
      updateFilters("sortBy", field);
      updateFilters("sortDir", "desc");
    }
  };

  return (
    <div>
      {/* ─── Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-zinc-800 bg-zinc-900/30">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search name, email, or ID..."
            className="pl-9 bg-zinc-950 border-zinc-800"
            defaultValue={filters.search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilters("search", e.currentTarget.value);
              }
            }}
          />
        </div>

        {(filters.search || filters.sortBy !== "joinedAt" || filters.sortDir !== "desc") && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(pathname)}
            className="text-zinc-400 hover:text-zinc-100"
            title="Clear filters"
          >
            <FilterX className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* ─── Table ─── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium min-w-[250px]">User</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Posts</th>
              <th className="px-4 py-3 font-medium">Reports</th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300" onClick={() => toggleSort("points")}>
                <div className="flex items-center gap-1">
                  Points
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-300 text-right" onClick={() => toggleSort("joinedAt")}>
                <div className="flex items-center justify-end gap-1">
                  Joined
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {initialUsers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={Users}
                    title="No users found"
                    description="Try adjusting your search criteria."
                  />
                </td>
              </tr>
            ) : (
              initialUsers.map((user) => (
                <tr
                  key={user.uid}
                  onClick={() => router.push(`/users/${user.uid}`)}
                  className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-medium text-zinc-500">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-zinc-200 font-medium">{user.displayName}</p>
                        <p className="text-zinc-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.banned ? (
                      <span className="inline-flex items-center text-[10px] font-semibold rounded-full px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                        Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-semibold rounded-full px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{user.postCount}</td>
                  <td className="px-4 py-3 text-zinc-400">{user.reportCount}</td>
                  <td className="px-4 py-3 font-medium text-zinc-300">{user.points}</td>
                  <td className="px-4 py-3 text-right text-zinc-500 whitespace-nowrap">
                    {formatDateTime(user.joinedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
