"use server";

import { adminDb } from "@/lib/firebase/admin";
import { QUIZ_NAMES } from "@/lib/constants";

// ─── Platform Totals ───────────────────────────────────────────────────────
export async function getPlatformTotals() {
  const [postsCount, usersCount, reportsCount] = await Promise.all([
    adminDb.collection("posts").count().get(),
    adminDb.collection("users").count().get(),
    adminDb.collection("reports").count().get(),
  ]);

  // Label breakdown
  const [normalCount, offensiveCount, hatefulCount] = await Promise.all([
    adminDb.collection("posts").where("label", "==", "normal").count().get(),
    adminDb.collection("posts").where("label", "==", "offensive").count().get(),
    adminDb.collection("posts").where("label", "==", "hateful").count().get(),
  ]);

  const total = postsCount.data().count || 1;

  return {
    totalPosts: postsCount.data().count,
    totalUsers: usersCount.data().count,
    totalReports: reportsCount.data().count,
    normalCount: normalCount.data().count,
    offensiveCount: offensiveCount.data().count,
    hatefulCount: hatefulCount.data().count,
    normalPercent: Math.round((normalCount.data().count / total) * 100),
    offensivePercent: Math.round((offensiveCount.data().count / total) * 100),
    hatefulPercent: Math.round((hatefulCount.data().count / total) * 100),
  };
}

// ─── Top Active Users ──────────────────────────────────────────────────────
export async function getTopActiveUsers(limit = 10) {
  // Get all users, then count their posts
  const usersSnapshot = await adminDb
    .collection("users")
    .orderBy("points", "desc")
    .limit(50)
    .get();

  const usersWithCounts = await Promise.all(
    usersSnapshot.docs.map(async (doc) => {
      const d = doc.data();
      const postCount = await adminDb
        .collection("posts")
        .where("userId", "==", doc.id)
        .count()
        .get()
        .then((s) => s.data().count)
        .catch(() => 0);

      return {
        uid: doc.id,
        displayName: d.displayName ?? "User",
        email: d.email ?? "",
        points: d.points ?? 0,
        postCount,
      };
    })
  );

  // Sort by post count and take top N
  const byPosts = [...usersWithCounts].sort((a, b) => b.postCount - a.postCount).slice(0, limit);
  const byPoints = [...usersWithCounts].sort((a, b) => b.points - a.points).slice(0, limit);

  return { byPosts, byPoints };
}

// ─── Quiz Completion Rates ─────────────────────────────────────────────────
export async function getQuizCompletionRates() {
  const usersSnapshot = await adminDb.collection("users").get();

  const quizStats = new Map<string, { completed: number; totalScore: number; totalPossible: number; passed: number }>();

  // Initialize known quizzes
  for (const quizId of Object.keys(QUIZ_NAMES)) {
    quizStats.set(quizId, { completed: 0, totalScore: 0, totalPossible: 0, passed: 0 });
  }

  for (const doc of usersSnapshot.docs) {
    const progress = doc.data().quizProgress;
    if (!progress || typeof progress !== "object") continue;

    for (const [quizId, result] of Object.entries(progress)) {
      const r = result as Record<string, unknown>;
      const existing = quizStats.get(quizId) ?? { completed: 0, totalScore: 0, totalPossible: 0, passed: 0 };
      existing.completed++;
      existing.totalScore += (r.score as number) ?? 0;
      existing.totalPossible += (r.totalPoints as number) ?? 0;
      if (r.passed) existing.passed++;
      quizStats.set(quizId, existing);
    }
  }

  return Array.from(quizStats.entries()).map(([quizId, stats]) => ({
    quizId,
    quizName: QUIZ_NAMES[quizId] ?? quizId,
    completions: stats.completed,
    averageScore: stats.completed > 0 ? Math.round((stats.totalScore / stats.totalPossible) * 100) : 0,
    passRate: stats.completed > 0 ? Math.round((stats.passed / stats.completed) * 100) : 0,
  }));
}

// ─── Language Breakdown ────────────────────────────────────────────────────
export async function getLanguageBreakdown() {
  const [enCount, urCount, totalCount] = await Promise.all([
    adminDb.collection("posts").where("language", "==", "en").count().get(),
    adminDb.collection("posts").where("language", "==", "ur").count().get(),
    adminDb.collection("posts").count().get(),
  ]);

  const total = totalCount.data().count || 1;
  const en = enCount.data().count;
  const ur = urCount.data().count;
  const other = total - en - ur;

  return [
    { name: "English", value: en, percent: Math.round((en / total) * 100) },
    { name: "Roman Urdu", value: ur, percent: Math.round((ur / total) * 100) },
    ...(other > 0
      ? [{ name: "Other", value: other, percent: Math.round((other / total) * 100) }]
      : []),
  ];
}
