"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LabelBadge } from "@/components/label-badge";
import { overridePostLabelDirect, deletePost } from "@/app/actions/posts";
import { overridePostLabel, dismissReport } from "@/app/actions/moderation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "override" | "dismiss" | "delete";
  postId: string;
  reportId?: string; // Optional because this dialog is used in both Moderation and Posts pages
  currentLabel?: string;
  suggestedLabel?: string;
  adminUid: string;
  adminEmail?: string;
  onSuccess?: () => void;
}

export function OverrideDialog({
  open,
  onOpenChange,
  mode,
  postId,
  reportId,
  currentLabel,
  suggestedLabel,
  adminUid,
  adminEmail,
  onSuccess,
}: OverrideDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    setLoading(true);

    try {
      if (mode === "override") {
        if (!suggestedLabel) throw new Error("Suggested label required");
        let res;
        if (reportId) {
          // Coming from Moderation Queue
          res = await overridePostLabel(reportId, postId, suggestedLabel, adminUid, adminEmail);
        } else {
          // Coming from Posts Explorer (manual override without report)
          res = await overridePostLabelDirect(postId, suggestedLabel, adminUid, adminEmail);
        }
        if (res.success) {
          toast.success("Label updated successfully");
          onSuccess?.();
          router.refresh();
          onOpenChange(false);
        } else {
          toast.error(res.error || "Update failed");
        }
      } else if (mode === "dismiss" && reportId) {
        const res = await dismissReport(reportId, adminUid, adminEmail);
        if (res.success) {
          toast.success("Report dismissed");
          onSuccess?.();
          router.refresh();
          onOpenChange(false);
        } else {
          toast.error(res.error || "Dismiss failed");
        }
      } else if (mode === "delete") {
        const res = await deletePost(postId, adminUid, adminEmail);
        if (res.success) {
          toast.success("Post deleted permanently");
          onSuccess?.();
          router.refresh();
          onOpenChange(false);
        } else {
          toast.error(res.error || "Delete failed");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "override" && "Confirm Label Override"}
            {mode === "dismiss" && "Dismiss Report"}
            {mode === "delete" && "Delete Post"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {mode === "override" && (
              <div className="mt-4 flex flex-col gap-4">
                <p>Are you sure you want to override this post&apos;s label?</p>
                <div className="flex items-center gap-3 justify-center p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-zinc-500 uppercase">From</span>
                    {currentLabel && <LabelBadge label={currentLabel} size="md" />}
                  </div>
                  <span className="text-zinc-500">→</span>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-zinc-500 uppercase">To</span>
                    {suggestedLabel && <LabelBadge label={suggestedLabel} size="md" />}
                  </div>
                </div>
              </div>
            )}
            {mode === "dismiss" && "This report will be marked as dismissed and the post's current label will remain unchanged."}
            {mode === "delete" && "Are you sure you want to delete this post? This action cannot be undone and will permanently remove the post from the database."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            variant={mode === "delete" ? "destructive" : "default"}
            className={
              mode !== "delete"
                ? "bg-zinc-100 text-zinc-900 hover:bg-white"
                : ""
            }
          >
            {loading ? "Confirming..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
