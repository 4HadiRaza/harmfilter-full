"use server";

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { writeAuditLog } from "@/lib/audit";
import type { UserProfile, Post, Report } from "@/lib/types";

// ─── Get Users ─────────────────────────────────────────────────────────────
export async function getUsers(filters?: {
  search?: string;
  sortBy?: "points" | "joinedAt";
  sortDir?: "asc" | "desc";
  limit?: number;
}): Promise<(UserProfile & { postCount: number; reportCount: number })[]> {
  const sortField = filters?.sortBy ?? "joinedAt";
  const sortDir = filters?.sortDir ?? "desc";
  const limit = filters?.limit ?? 100;

  const snapshot = await adminDb
    .collection("users")
    .orderBy(sortField, sortDir)
    .limit(limit)
    .get();

  const users = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const d = doc.data();

      // Get post count and report count
      const [postCount, reportCount] = await Promise.all([
        adminDb
          .collection("posts")
          .where("userId", "==", doc.id)
          .count()
          .get()
          .then((s) => s.data().count)
          .catch(() => 0),
        adminDb
          .collection("reports")
          .where("reportedBy", "==", doc.id)
          .count()
          .get()
          .then((s) => s.data().count)
          .catch(() => 0),
      ]);

      const rawQuizProgress = d.quizProgress ?? {};
      const quizProgress: Record<string, any> = {};
      for (const [key, val] of Object.entries(rawQuizProgress)) {
        quizProgress[key] = { ...((val as any) || {}) };
        if (quizProgress[key].completedAt?.toDate) {
          quizProgress[key].completedAt = quizProgress[key].completedAt.toDate();
        }
      }

      return {
        uid: doc.id,
        displayName: d.displayName ?? "User",
        email: d.email ?? "",
        avatarUrl: d.avatarUrl ?? "",
        bio: d.bio ?? "",
        points: d.points ?? 0,
        joinedAt: d.joinedAt?.toDate?.() ?? new Date(),
        lastActivityDate: d.lastActivityDate?.toDate?.(),
        quizProgress,
        banned: d.banned ?? false,
        bannedAt: d.bannedAt?.toDate?.(),
        bannedBy: d.bannedBy,
        postCount,
        reportCount,
      };
    })
  );

  // Client-side search filter
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.uid.toLowerCase().includes(s)
    );
  }

  return users;
}

// ─── Get User Detail ───────────────────────────────────────────────────────
export async function getUserDetail(uid: string): Promise<{
  user: (UserProfile & { postCount: number; reportCount: number }) | null;
  posts: Post[];
  reports: Report[];
}> {
  const userDoc = await adminDb.collection("users").doc(uid).get();

  if (!userDoc.exists) {
    return { user: null, posts: [], reports: [] };
  }

  const d = userDoc.data()!;

  const [postsSnapshot, reportsSnapshot, postCount, reportCount] = await Promise.all([
    adminDb
      .collection("posts")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get(),
    adminDb
      .collection("reports")
      .where("reportedBy", "==", uid)
      .orderBy("reportedAt", "desc")
      .limit(50)
      .get(),
    adminDb.collection("posts").where("userId", "==", uid).count().get().then((s) => s.data().count),
    adminDb.collection("reports").where("reportedBy", "==", uid).count().get().then((s) => s.data().count),
  ]);

  const rawQuizProgress = d.quizProgress ?? {};
  const quizProgress: Record<string, any> = {};
  for (const [key, val] of Object.entries(rawQuizProgress)) {
    quizProgress[key] = { ...((val as any) || {}) };
    if (quizProgress[key].completedAt?.toDate) {
      quizProgress[key].completedAt = quizProgress[key].completedAt.toDate();
    }
  }

  const user = {
    uid: userDoc.id,
    displayName: d.displayName ?? "User",
    email: d.email ?? "",
    avatarUrl: d.avatarUrl ?? "",
    bio: d.bio ?? "",
    points: d.points ?? 0,
    joinedAt: d.joinedAt?.toDate?.() ?? new Date(),
    lastActivityDate: d.lastActivityDate?.toDate?.(),
    quizProgress,
    banned: d.banned ?? false,
    bannedAt: d.bannedAt?.toDate?.(),
    bannedBy: d.bannedBy,
    postCount,
    reportCount,
  };

  const posts: Post[] = postsSnapshot.docs.map((doc) => {
    const pd = doc.data();
    return {
      id: doc.id,
      userId: pd.userId ?? "",
      username: pd.username ?? "Anonymous",
      avatar: pd.avatar ?? "",
      text: pd.text ?? "",
      label: pd.label ?? "normal",
      fusedScore: pd.fusedScore ?? 0,
      textScore: pd.textScore ?? 0,
      imageScore: pd.imageScore ?? undefined,
      explanation: pd.explanation ?? "",
      problematicSpans: pd.problematicSpans ?? [],
      suggestions: pd.suggestions ?? [],
      language: pd.language ?? "en",
      createdAt: pd.createdAt?.toDate?.() ?? new Date(),
    };
  });

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
    };
  });

  return { user, posts, reports };
}

// ─── Ban User ──────────────────────────────────────────────────────────────
export async function banUser(uid: string, adminUid: string, adminEmail?: string) {
  try {
    await adminDb.collection("users").doc(uid).update({
      banned: true,
      bannedAt: FieldValue.serverTimestamp(),
      bannedBy: adminUid,
    });

    await writeAuditLog({
      action: "ban_user",
      adminUid,
      adminEmail,
      targetId: uid,
      targetType: "user",
      after: { banned: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Ban failed:", error);
    return { success: false, error: "Failed to ban user." };
  }
}

// ─── Unban User ────────────────────────────────────────────────────────────
export async function unbanUser(uid: string, adminUid: string, adminEmail?: string) {
  try {
    await adminDb.collection("users").doc(uid).update({
      banned: false,
      bannedAt: FieldValue.delete(),
      bannedBy: FieldValue.delete(),
    });

    await writeAuditLog({
      action: "unban_user",
      adminUid,
      adminEmail,
      targetId: uid,
      targetType: "user",
      after: { banned: false },
    });

    return { success: true };
  } catch (error) {
    console.error("Unban failed:", error);
    return { success: false, error: "Failed to unban user." };
  }
}

// ─── Reset User Points ────────────────────────────────────────────────────
export async function resetUserPoints(uid: string, adminUid: string, adminEmail?: string) {
  try {
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const oldPoints = userDoc.data()?.points ?? 0;

    await adminDb.collection("users").doc(uid).update({
      points: 0,
      quizProgress: FieldValue.delete(),
    });

    await writeAuditLog({
      action: "reset_points",
      adminUid,
      adminEmail,
      targetId: uid,
      targetType: "user",
      before: { points: oldPoints },
      after: { points: 0 },
    });

    return { success: true };
  } catch (error) {
    console.error("Reset failed:", error);
    return { success: false, error: "Failed to reset points." };
  }
}
