import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { AuditLog } from "@/lib/types";

/**
 * Records an admin action in the audit_logs collection.
 * Call this for every destructive or mutating admin action.
 */
export async function writeAuditLog(
  entry: Omit<AuditLog, "id" | "timestamp">
): Promise<string> {
  const docRef = await adminDb.collection("audit_logs").add({
    ...entry,
    timestamp: FieldValue.serverTimestamp(),
  });
  return docRef.id;
}
