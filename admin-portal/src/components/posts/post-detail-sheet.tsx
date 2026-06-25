"use client";

import { useEffect, useState } from "react";
import { getPostDetail } from "@/app/actions/posts";
import type { Post, Report } from "@/lib/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LabelBadge } from "@/components/label-badge";
import { formatDateTime, scoreToPercent } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OverrideDialog } from "@/components/moderation/override-dialog";
import { Loader2, Trash2, Edit2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PostDetailSheetProps {
  postId: string | null;
  onClose: () => void;
  adminUid: string;
  adminEmail?: string;
}

export function PostDetailSheet({ postId, onClose, adminUid, adminEmail }: PostDetailSheetProps) {
  const router = useRouter();
  const [data, setData] = useState<{ post: Post | null; reports: Report[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: "override" | "delete";
    suggestedLabel?: string;
  }>({ open: false, mode: "override" });

  useEffect(() => {
    if (postId) {
      setLoading(true);
      getPostDetail(postId).then((res) => {
        setData(res);
        setLoading(false);
      });
    } else {
      setData(null);
    }
  }, [postId]);

  if (!postId) return null;

  return (
    <>
      <Sheet open={!!postId} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-xl bg-zinc-950 border-zinc-800 text-zinc-100 overflow-y-auto p-0 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
          ) : data?.post ? (
            <>
              <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
                <SheetHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div>
                    <SheetTitle className="text-lg font-bold flex items-center gap-3">
                      Post Detail
                      <LabelBadge label={data.post.label} size="md" />
                    </SheetTitle>
                    <SheetDescription className="text-xs text-zinc-500 mt-1">
                      ID: {data.post.id}
                    </SheetDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDialog({ open: true, mode: "override" })}
                      className="h-8 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-2" />
                      Override
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDialog({ open: true, mode: "delete" })}
                      className="h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </SheetHeader>
              </div>

              <div className="p-6 space-y-8">
                {/* User Info */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">
                        {data.post.username}
                      </p>
                      <p className="text-xs text-zinc-500">{formatDateTime(data.post.createdAt)}</p>
                    </div>
                  </div>
                  <Link href={`/users/${data.post.userId}`}>
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
                      <User className="w-4 h-4 mr-2" />
                      View Profile
                    </Button>
                  </Link>
                </div>

                {/* Text Content */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Content</h4>
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
                    {data.post.text}
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Analysis Results</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-zinc-400">Fused Score</span>
                        <span className="text-xs font-medium text-zinc-200">{scoreToPercent(data.post.fusedScore)}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: scoreToPercent(data.post.fusedScore) }} />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-zinc-400">Text Score</span>
                        <span className="text-xs font-medium text-zinc-200">{scoreToPercent(data.post.textScore)}</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: scoreToPercent(data.post.textScore) }} />
                      </div>
                    </div>
                  </div>

                  {data.post.explanation && (
                    <div>
                      <span className="text-xs text-zinc-500">Explanation:</span>
                      <p className="text-sm text-zinc-400 mt-1">{data.post.explanation}</p>
                    </div>
                  )}

                  {data.post.problematicSpans && data.post.problematicSpans.length > 0 && (
                    <div>
                      <span className="text-xs text-zinc-500">Problematic Spans:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {data.post.problematicSpans.map((span, i) => (
                          <li key={i} className="text-sm text-red-400">"{span}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Reports */}
                {data.reports.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">
                      Reports ({data.reports.length})
                    </h4>
                    <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
                      {data.reports.map((r) => (
                        <div key={r.id} className="p-3 bg-zinc-900/30 text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-zinc-500">{formatDateTime(r.reportedAt)}</span>
                            <span className={`text-xs font-medium ${r.status === 'pending' ? 'text-amber-400' : 'text-zinc-500'}`}>
                              {r.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400 text-xs">Suggested:</span>
                            <LabelBadge label={r.reportedAs} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
              Post not found.
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Override / Delete Dialog */}
      {dialog.open && (
        <OverrideDialog
          open={dialog.open}
          onOpenChange={(o) => setDialog((prev) => ({ ...prev, open: o }))}
          mode={dialog.mode}
          postId={postId}
          currentLabel={data?.post?.label}
          suggestedLabel={
            dialog.mode === "override"
              ? data?.post?.label === "hateful"
                ? "normal"
                : "hateful" // Simple toggle for now, actual implementation might need a selector in the dialog
              : undefined
          }
          adminUid={adminUid}
          adminEmail={adminEmail}
          onSuccess={() => {
            if (dialog.mode === "delete") {
              onClose(); // Close sheet if deleted
            } else {
              // Refresh post data
              getPostDetail(postId).then((res) => setData(res));
            }
          }}
        />
      )}
    </>
  );
}
