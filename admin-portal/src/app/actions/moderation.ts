"use server";

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { writeAuditLog } from "@/lib/audit";
import type { Report, ConsensusReport } from "@/lib/types";
import { CONSENSUS_THRESHOLD } from "@/lib/constants";

// ─── Get Reports with Consensus Detection ──────────────────────────────────
export async function getReportsWithConsensus(filters?: {
  currentFlag?: string;
  reportedAs?: string;
  status?: string;
  search?: string;
}): Promise<{ reports: (Report & { postText?: string; reporterName?: string })[]; consensus: ConsensusReport[] }> {
  let query: FirebaseFirestore.Query = adminDb.collection("reports").orderBy("reportedAt", "desc");

  if (filters?.status && filters.status !== "all") {
    query = query.where("status", "==", filters.status);
  }

  const snapshot = await query.limit(200).get();

  // Enrich reports with post text and reporter name
  const enrichedReports = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const d = doc.data();
      let postText = d.postContent ?? "";
      let reporterName = d.reportedBy ?? "";

      if (!postText && d.postId) {
        try {
          const postDoc = await adminDb.collection("posts").doc(d.postId).get();
          postText = postDoc.data()?.text ?? "";
        } catch { /* ok */ }
      }

      if (d.reportedBy) {
        try {
          const userDoc = await adminDb.collection("users").doc(d.reportedBy).get();
          reporterName = userDoc.data()?.displayName ?? d.reportedBy;
        } catch { /* ok */ }
      }

      return {
        id: doc.id,
        postId: d.postId ?? "",
        postContent: postText,
        currentFlag: d.currentFlag ?? "",
        reportedAs: d.reportedAs ?? "",
        reportedBy: d.reportedBy ?? "",
        reportedAt: d.reportedAt?.toDate?.() ?? new Date(),
        status: d.status ?? "pending",
        resolvedAt: d.resolvedAt?.toDate?.(),
        resolvedBy: d.resolvedBy,
        postText,
        reporterName,
      };
    })
  );

  // Apply client-side filters that Firestore can't compound
  let filtered = enrichedReports;

  if (filters?.currentFlag && filters.currentFlag !== "all") {
    filtered = filtered.filter((r) => r.currentFlag.toLowerCase() === filters.currentFlag!.toLowerCase());
  }
  if (filters?.reportedAs && filters.reportedAs !== "all") {
    filtered = filtered.filter((r) => r.reportedAs.toLowerCase() === filters.reportedAs!.toLowerCase());
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        (r.postText ?? "").toLowerCase().includes(s) ||
        r.reporterName.toLowerCase().includes(s)
    );
  }

  // ─── Consensus Detection (server-side) ─────────────────────────────────
  // Group pending reports by postId, count how many suggest the same label
  const pendingByPost = new Map<string, Report[]>();
  for (const report of filtered.filter((r) => r.status === "pending")) {
    const existing = pendingByPost.get(report.postId) ?? [];
    existing.push(report);
    pendingByPost.set(report.postId, existing);
  }

  const consensus: ConsensusReport[] = [];
  for (const [postId, reports] of pendingByPost) {
    // Count by suggested label
    const labelCounts = new Map<string, number>();
    for (const r of reports) {
      const count = labelCounts.get(r.reportedAs) ?? 0;
      labelCounts.set(r.reportedAs, count + 1);
    }

    for (const [suggestedLabel, count] of labelCounts) {
      if (count >= CONSENSUS_THRESHOLD) {
        consensus.push({
          postId,
          postText: reports[0].postContent ?? "",
          currentLabel: reports[0].currentFlag,
          suggestedLabel,
          reportCount: count,
          reports: reports.filter((r) => r.reportedAs === suggestedLabel),
        });
      }
    }
  }

  // Sort: consensus items first, then by date
  consensus.sort((a, b) => b.reportCount - a.reportCount);

  return { reports: filtered, consensus };
}

// ─── Override Post Label ───────────────────────────────────────────────────
export async function overridePostLabel(
  reportId: string,
  postId: string,
  newLabel: string,
  adminUid: string,
  adminEmail?: string
) {
  try {
    const postRef = adminDb.collection("posts").doc(postId);
    const reportRef = adminDb.collection("reports").doc(reportId);

    const postDoc = await postRef.get();
    const oldLabel = postDoc.data()?.label ?? "unknown";

    await adminDb.runTransaction(async (tx) => {
      tx.update(postRef, { label: newLabel });
      tx.update(reportRef, {
        status: "resolved",
        resolvedAt: FieldValue.serverTimestamp(),
        resolvedBy: adminUid,
      });
    });

    await writeAuditLog({
      action: "override_label",
      adminUid,
      adminEmail,
      targetId: postId,
      targetType: "post",
      before: { label: oldLabel },
      after: { label: newLabel },
      metadata: { reportId },
    });

    return { success: true };
  } catch (error) {
    console.error("Override failed:", error);
    return { success: false, error: "Failed to override label." };
  }
}

// ─── Dismiss Report ────────────────────────────────────────────────────────
export async function dismissReport(reportId: string, adminUid: string, adminEmail?: string) {
  try {
    await adminDb.collection("reports").doc(reportId).update({
      status: "dismissed",
      dismissedAt: FieldValue.serverTimestamp(),
      resolvedBy: adminUid,
    });

    await writeAuditLog({
      action: "dismiss_report",
      adminUid,
      adminEmail,
      targetId: reportId,
      targetType: "report",
    });

    return { success: true };
  } catch (error) {
    console.error("Dismiss failed:", error);
    return { success: false, error: "Failed to dismiss report." };
  }
}

// ─── Bulk Resolve Consensus ────────────────────────────────────────────────
export async function bulkResolveConsensus(
  postId: string,
  newLabel: string,
  reportIds: string[],
  adminUid: string,
  adminEmail?: string
) {
  try {
    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    const oldLabel = postDoc.data()?.label ?? "unknown";

    const batch = adminDb.batch();

    batch.update(postRef, { label: newLabel });

    for (const reportId of reportIds) {
      batch.update(adminDb.collection("reports").doc(reportId), {
        status: "resolved",
        resolvedAt: FieldValue.serverTimestamp(),
        resolvedBy: adminUid,
      });
    }

    await batch.commit();

    await writeAuditLog({
      action: "bulk_resolve",
      adminUid,
      adminEmail,
      targetId: postId,
      targetType: "post",
      before: { label: oldLabel },
      after: { label: newLabel },
      metadata: { reportIds, reportCount: reportIds.length },
    });

    return { success: true };
  } catch (error) {
    console.error("Bulk resolve failed:", error);
    return { success: false, error: "Failed to bulk resolve." };
  }
}
