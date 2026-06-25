"use server";

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { writeAuditLog } from "@/lib/audit";
import type { Post, Report } from "@/lib/types";

// ─── Get Posts with Filters ────────────────────────────────────────────────
export async function getPosts(filters?: {
  label?: string;
  language?: string;
  search?: string;
  limit?: number;
  startAfter?: string;
}): Promise<{ posts: Post[]; hasMore: boolean }> {
  const limit = filters?.limit ?? 50;
  let query: FirebaseFirestore.Query = adminDb
    .collection("posts")
    .orderBy("createdAt", "desc");

  if (filters?.label && filters.label !== "all") {
    query = query.where("label", "==", filters.label);
  }

  if (filters?.language && filters.language !== "all") {
    query = query.where("language", "==", filters.language);
  }

  if (filters?.startAfter) {
    const startDoc = await adminDb.collection("posts").doc(filters.startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  query = query.limit(limit + 1);

  const snapshot = await query.get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.docs.length > limit;

  let posts = docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      userId: d.userId ?? "",
      username: d.username ?? "Anonymous",
      avatar: d.avatar ?? "",
      text: d.text ?? "",
      label: d.label ?? "normal",
      fusedScore: d.fusedScore ?? 0,
      textScore: d.textScore ?? 0,
      imageScore: d.imageScore ?? undefined,
      explanation: d.explanation ?? "",
      problematicSpans: d.problematicSpans ?? [],
      suggestions: d.suggestions ?? [],
      language: d.language ?? "en",
      createdAt: d.createdAt?.toDate?.() ?? new Date(),
    };
  });

  // Client-side text search (Firestore doesn't support full-text)
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.text.toLowerCase().includes(s) ||
        p.username.toLowerCase().includes(s)
    );
  }

  return { posts, hasMore };
}

// ─── Get Post Detail ───────────────────────────────────────────────────────
export async function getPostDetail(postId: string): Promise<{
  post: Post | null;
  reports: Report[];
}> {
  const postDoc = await adminDb.collection("posts").doc(postId).get();

  if (!postDoc.exists) {
    return { post: null, reports: [] };
  }

  const d = postDoc.data()!;
  const post: Post = {
    id: postDoc.id,
    userId: d.userId ?? "",
    username: d.username ?? "Anonymous",
    avatar: d.avatar ?? "",
    text: d.text ?? "",
    label: d.label ?? "normal",
    fusedScore: d.fusedScore ?? 0,
    textScore: d.textScore ?? 0,
    imageScore: d.imageScore ?? undefined,
    explanation: d.explanation ?? "",
    problematicSpans: d.problematicSpans ?? [],
    suggestions: d.suggestions ?? [],
    language: d.language ?? "en",
    createdAt: d.createdAt?.toDate?.() ?? new Date(),
  };

  // Fetch reports for this post
  const reportsSnapshot = await adminDb
    .collection("reports")
    .where("postId", "==", postId)
    .orderBy("reportedAt", "desc")
    .get();

  const reports: Report[] = reportsSnapshot.docs.map((doc) => {
    const rd = doc.data();
    return {
      id: doc.id,
      postId: rd.postId ?? "",
      postContent: rd.postContent ?? "",
      currentFlag: rd.currentFlag ?? "",
      reportedAs: rd.reportedAs ?? "",
      reportedBy: rd.reportedBy ?? "",
      reportedAt: rd.reportedAt?.toDate?.() ?? new Date(),
      status: rd.status ?? "pending",
      resolvedAt: rd.resolvedAt?.toDate?.(),
      resolvedBy: rd.resolvedBy,
    };
  });

  return { post, reports };
}

// ─── Override Post Label ───────────────────────────────────────────────────
export async function overridePostLabelDirect(
  postId: string,
  newLabel: string,
  adminUid: string,
  adminEmail?: string
) {
  try {
    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    const oldLabel = postDoc.data()?.label ?? "unknown";

    await postRef.update({ label: newLabel });

    await writeAuditLog({
      action: "override_label",
      adminUid,
      adminEmail,
      targetId: postId,
      targetType: "post",
      before: { label: oldLabel },
      after: { label: newLabel },
    });

    return { success: true };
  } catch (error) {
    console.error("Override failed:", error);
    return { success: false, error: "Failed to override label." };
  }
}

// ─── Delete Post ───────────────────────────────────────────────────────────
export async function deletePost(postId: string, adminUid: string, adminEmail?: string) {
  try {
    const postRef = adminDb.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    const postData = postDoc.data();

    await postRef.delete();

    await writeAuditLog({
      action: "delete_post",
      adminUid,
      adminEmail,
      targetId: postId,
      targetType: "post",
      before: {
        text: postData?.text ?? "",
        label: postData?.label ?? "",
        userId: postData?.userId ?? "",
        username: postData?.username ?? "",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete failed:", error);
    return { success: false, error: "Failed to delete post." };
  }
}
