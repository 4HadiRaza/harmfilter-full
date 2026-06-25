import { adminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await adminDb
      .collection("reports")
      .where("status", "==", "pending")
      .count()
      .get();

    // Also try without status field for reports that predate the status field
    const noStatusSnapshot = await adminDb
      .collection("reports")
      .where("status", "==", null)
      .count()
      .get();

    // Count reports missing the status field entirely
    const allReportsSnapshot = await adminDb.collection("reports").count().get();
    const resolvedCount = (
      await adminDb.collection("reports").where("status", "in", ["resolved", "dismissed"]).count().get()
    ).data().count;

    const pendingCount = allReportsSnapshot.data().count - resolvedCount;

    return NextResponse.json({ count: Math.max(0, pendingCount) });
  } catch (error) {
    console.error("Error fetching reports count:", error);
    return NextResponse.json({ count: 0 });
  }
}
