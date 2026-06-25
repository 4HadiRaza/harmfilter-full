"use client";

import { useState } from "react";
import { formatDateTime, truncateText } from "@/lib/utils";
import { QUIZ_NAMES } from "@/lib/constants";
import { LabelBadge } from "@/components/label-badge";
import { banUser, unbanUser, resetUserPoints } from "@/app/actions/users";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Ban, ShieldCheck, RotateCcw, AlertCircle } from "lucide-react";
import type { UserProfile, Post, Report } from "@/lib/types";

type EnrichedUser = UserProfile & { postCount: number; reportCount: number };

interface UserDetailProps {
  user: EnrichedUser;
  posts: Post[];
  reports: Report[];
  adminUid: string;
  adminEmail?: string;
}

export function UserDetail({ user, posts, reports, adminUid, adminEmail }: UserDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; action: "ban" | "unban" | "reset" | null }>({
    open: false,
    action: null,
  });

  const handleAction = async () => {
    if (!dialog.action) return;
    setLoading(true);

    try {
      let res;
      if (dialog.action === "ban") {
        res = await banUser(user.uid, adminUid, adminEmail);
      } else if (dialog.action === "unban") {
        res = await unbanUser(user.uid, adminUid, adminEmail);
      } else if (dialog.action === "reset") {
        res = await resetUserPoints(user.uid, adminUid, adminEmail);
      }

      if (res?.success) {
        toast.success(`Action successful`);
        router.refresh();
      } else {
        toast.error(res?.error || "Action failed");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
      setDialog({ open: false, action: null });
    }
  };

  const quizEntries = Object.entries(user.quizProgress ?? {});

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Profile Card ─── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-zinc-800 shrink-0 overflow-hidden mb-4 border-4 border-zinc-950 shadow-xl">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-medium text-zinc-500">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-zinc-100">{user.displayName}</h2>
              <p className="text-sm text-zinc-500">{user.email}</p>
              {user.banned && (
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded-full border border-red-500/20">
                  <Ban className="w-3.5 h-3.5" />
                  BANNED
                </div>
              )}
            </div>

            <div className="space-y-4 divide-y divide-zinc-800/50">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500">Points</span>
                <span className="font-medium text-zinc-300">{user.points}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500">Joined</span>
                <span className="font-medium text-zinc-300">{formatDateTime(user.joinedAt)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500">Posts</span>
                <span className="font-medium text-zinc-300">{user.postCount}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500">Reports Submitted</span>
                <span className="font-medium text-zinc-300">{user.reportCount}</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {user.banned ? (
                <Button
                  onClick={() => setDialog({ open: true, action: "unban" })}
                  variant="outline"
                  className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" /> Unban User
                </Button>
              ) : (
                <Button
                  onClick={() => setDialog({ open: true, action: "ban" })}
                  variant="outline"
                  className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Ban className="w-4 h-4 mr-2" /> Ban User
                </Button>
              )}
              <Button
                onClick={() => setDialog({ open: true, action: "reset" })}
                variant="outline"
                className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reset Points
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="lg:col-span-2">
          {user.banned && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-400">User is marked as banned</h4>
                <p className="text-xs text-red-300/80 mt-1">
                  Note: The Flutter app does not currently enforce this ban. The flag is stored in Firestore, but the main app will need to be updated to check it and block access.
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="bg-zinc-900/50 border border-zinc-800 h-11 w-full justify-start rounded-xl p-1 mb-6">
              <TabsTrigger value="posts" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 px-6 rounded-lg">
                Posts ({posts.length})
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 px-6 rounded-lg">
                Quiz Progress ({quizEntries.length})
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 px-6 rounded-lg">
                Reports ({reports.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {posts.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/30">
                  User hasn't posted anything yet.
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-2 mb-2">
                      <LabelBadge label={post.label} />
                      <span className="text-[10px] text-zinc-500">{formatDateTime(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{post.text}</p>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="quizzes" className="space-y-4">
              {quizEntries.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/30">
                  User hasn't taken any quizzes yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quizEntries.map(([quizId, result]: [string, any]) => (
                    <div key={quizId} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200 mb-1">
                          {QUIZ_NAMES[quizId] || quizId}
                        </h4>
                        <p className="text-xs text-zinc-500">
                          {result.completedAt ? formatDateTime(result.completedAt.toDate?.() || result.completedAt) : "Completed"}
                        </p>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Score</p>
                          <p className="text-lg font-bold text-zinc-300">
                            {result.score} <span className="text-xs font-normal text-zinc-600">/ {result.totalPoints}</span>
                          </p>
                        </div>
                        {result.passed ? (
                          <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-medium">Passed</span>
                        ) : (
                          <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium">Failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-4">
              {reports.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900/30">
                  User hasn't submitted any reports.
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <LabelBadge label={report.currentFlag} />
                        <span className="text-zinc-600">→</span>
                        <LabelBadge label={report.reportedAs} />
                      </div>
                      <span className={`text-xs font-medium ${
                        report.status === 'pending' ? 'text-amber-400' :
                        report.status === 'resolved' ? 'text-green-400' : 'text-zinc-500'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                      "{truncateText(report.postContent || "Post content unavailable", 100)}"
                    </p>
                    <p className="text-[10px] text-zinc-600">{formatDateTime(report.reportedAt)}</p>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={dialog.open} onOpenChange={(o) => !o && setDialog({ open: false, action: null })}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog.action === "ban" && "Ban User"}
              {dialog.action === "unban" && "Unban User"}
              {dialog.action === "reset" && "Reset Points"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {dialog.action === "ban" && "Are you sure you want to ban this user? They will still be able to access the Flutter app until it is updated to enforce this ban."}
              {dialog.action === "unban" && "Are you sure you want to restore this user's access?"}
              {dialog.action === "reset" && "Are you sure you want to reset this user's points to 0 and clear their quiz progress? This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 bg-transparent hover:bg-zinc-800 hover:text-zinc-100 text-zinc-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={
                dialog.action === "ban" || dialog.action === "reset"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-green-500 text-white hover:bg-green-600"
              }
            >
              {loading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
