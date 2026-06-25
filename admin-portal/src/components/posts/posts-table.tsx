"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDateTime, truncateText } from "@/lib/utils";
import { LabelBadge } from "@/components/label-badge";
import { Search, FilterX, FileText } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Post } from "@/lib/types";
import { PostDetailSheet } from "./post-detail-sheet";

interface PostsTableProps {
  initialPosts: Post[];
  filters: {
    label?: string;
    language?: string;
    search?: string;
  };
  adminUid: string;
  adminEmail?: string;
  detailPostId?: string;
}

export function PostsTable({
  initialPosts,
  filters,
  adminUid,
  adminEmail,
  detailPostId,
}: PostsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilters = (key: string, value: string | null | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const openDetail = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("detail", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const closeDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("detail");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      {/* ─── Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-zinc-800 bg-zinc-900/30">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search text or username..."
            className="pl-9 bg-zinc-950 border-zinc-800"
            defaultValue={filters.search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilters("search", e.currentTarget.value);
              }
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.label ?? "all"}
            onValueChange={(val) => updateFilters("label", val)}
          >
            <SelectTrigger className="w-[140px] bg-zinc-950 border-zinc-800">
              <SelectValue placeholder="Label" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
              <SelectItem value="all">All Labels</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="offensive">Offensive</SelectItem>
              <SelectItem value="hateful">Hateful</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.language ?? "all"}
            onValueChange={(val) => updateFilters("language", val)}
          >
            <SelectTrigger className="w-[140px] bg-zinc-950 border-zinc-800">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
              <SelectItem value="all">All Langs</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ur">Roman Urdu</SelectItem>
            </SelectContent>
          </Select>

          {(filters.search || filters.label || filters.language) && (
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
      </div>

      {/* ─── Table ─── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium min-w-[300px]">Post Text</th>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Lang</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {initialPosts.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={FileText}
                    title="No posts found"
                    description="Try adjusting your filters."
                  />
                </td>
              </tr>
            ) : (
              initialPosts.map((post) => (
                <tr
                  key={post.id}
                  onClick={() => openDetail(post.id)}
                  className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3">
                    <p className="text-zinc-300 line-clamp-1 max-w-lg">
                      {post.text}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <LabelBadge label={post.label} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-500 uppercase">{post.language}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-zinc-400">{post.username}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-zinc-500 whitespace-nowrap">
                      {formatDateTime(post.createdAt)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Side Panel for Detail */}
      <PostDetailSheet
        postId={detailPostId ?? null}
        onClose={closeDetail}
        adminUid={adminUid}
        adminEmail={adminEmail}
      />
    </div>
  );
}
