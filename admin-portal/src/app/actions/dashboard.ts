"use server";

import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { DashboardStats, ChartDataPoint, Post, Report } from "@/lib/types";
import { toDateString } from "@/lib/utils";

// ─── Platform Analytics Cache ──────────────────────────────────────────────
// Server-side in-memory cache to avoid expensive fan-out queries on every load.
// Cache TTL: 5 minutes.
const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── Ensure platform aggregation exists ────────────────────────────────────
// On dashboard load, aggregate from per-user analytics into a platform_analytics
// collection if not already present for today.
async function ensurePlatformAggregation(dateStr: string) {
  const platformRef = adminDb.collection("platform_analytics").doc(dateStr);
  const doc = await platformRef.get();

  if (doc.exists) return;

  // Fan out once, then cache in Firestore
  let totalPosts = 0, normalCount = 0, offensiveCount = 0, hatefulCount = 0;

  const usersSnapshot = await adminDb.collection("users").select().get();
  const promises = usersSnapshot.docs.map(async (userDoc) => {
    const dailyDoc = await adminDb
      .collection("analytics")
      .doc(userDoc.id)
      .collection("daily")
      .doc(dateStr)
      .get();

    if (dailyDoc.exists) {
      const d = dailyDoc.data()!;
      totalPosts += (d.totalAnalyzed ?? 0);
      normalCount += (d.safeCount ?? 0);
      offensiveCount += (d.offensiveCount ?? 0);
      hatefulCount += (d.hatefulCount ?? 0);
    }
  });

  await Promise.all(promises);

  await platformRef.set({
    totalPosts,
    normalCount,
    offensiveCount,
    hatefulCount,
    aggregatedAt: FieldValue.serverTimestamp(),
  });
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  const cached = getCached<DashboardStats>("dashboard-stats");
  if (cached) return cached;

  const today = toDateString(new Date());

  const [postsCount, usersCount, pendingCount, todayData] = await Promise.all([
    adminDb.collection("posts").count().get(),
    adminDb.collection("users").count().get(),
    (async () => {
      const total = await adminDb.collection("reports").count().get();
      const resolved = await adminDb
        .collection("reports")
        .where("status", "in", ["resolved", "dismissed"])
        .count()
        .get();
      return total.data().count - resolved.data().count;
    })(),
    (async () => {
      await ensurePlatformAggregation(today);
      const doc = await adminDb.collection("platform_analytics").doc(today).get();
      return doc.data() ?? { totalPosts: 0, normalCount: 0, offensiveCount: 0, hatefulCount: 0 };
    })(),
  ]);

  const stats: DashboardStats = {
    totalPosts: postsCount.data().count,
    totalUsers: usersCount.data().count,
    pendingReports: Math.max(0, pendingCount),
    hatefulToday: todayData.hatefulCount ?? 0,
    todayBreakdown: {
      normal: todayData.normalCount ?? 0,
      offensive: todayData.offensiveCount ?? 0,
      hateful: todayData.hatefulCount ?? 0,
    },
  };

  setCache("dashboard-stats", stats);
  return stats;
}

// ─── Post Volume Chart (30 days) ───────────────────────────────────────────
export async function getPostVolumeChart(): Promise<ChartDataPoint[]> {
  const cached = getCached<ChartDataPoint[]>("post-volume-30d");
  if (cached) return cached;

  const points: ChartDataPoint[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = toDateString(date);

    await ensurePlatformAggregation(dateStr);
    const doc = await adminDb.collection("platform_analytics").doc(dateStr).get();
    const data = doc.data();

    points.push({
      date: dateStr,
      value: data?.totalPosts ?? 0,
      normal: data?.normalCount ?? 0,
      offensive: data?.offensiveCount ?? 0,
      hateful: data?.hatefulCount ?? 0,
    });
  }

  setCache("post-volume-30d", points);
  return points;
}

// ─── Classification Chart (14 days) ────────────────────────────────────────
export async function getClassificationChart(): Promise<ChartDataPoint[]> {
  const cached = getCached<ChartDataPoint[]>("classification-14d");
  if (cached) return cached;

  const points: ChartDataPoint[] = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = toDateString(date);

    await ensurePlatformAggregation(dateStr);
    const doc = await adminDb.collection("platform_analytics").doc(dateStr).get();
    const data = doc.data();

    points.push({
      date: dateStr,
      value: data?.totalPosts ?? 0,
      normal: data?.normalCount ?? 0,
      offensive: data?.offensiveCount ?? 0,
      hateful: data?.hatefulCount ?? 0,
    });
  }

  setCache("classification-14d", points);
  return points;
}

// ─── Recent Posts ──────────────────────────────────────────────────────────
export async function getRecentPosts(limit = 10): Promise<Post[]> {
  const snapshot = await adminDb
    .collection("posts")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
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
}

// ─── Recent Reports ────────────────────────────────────────────────────────
export async function getRecentReports(limit = 5): Promise<(Report & { postText?: string; reporterName?: string })[]> {
  const snapshot = await adminDb
    .collection("reports")
    .orderBy("reportedAt", "desc")
    .limit(limit)
    .get();

  const reports = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const d = doc.data();
      let postText = d.postContent ?? "";
      let reporterName = d.reportedBy ?? "";

      // Fetch post text if not embedded
      if (!postText && d.postId) {
        try {
          const postDoc = await adminDb.collection("posts").doc(d.postId).get();
          postText = postDoc.data()?.text ?? "";
        } catch { /* ok */ }
      }

      // Fetch reporter name
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

  return reports;
}
