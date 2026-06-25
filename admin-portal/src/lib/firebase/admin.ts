import "server-only";
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let app;
if (!getApps().length) {
  try {
    app = initializeApp({ credential: cert(serviceAccount) });
  } catch (error) {
    console.warn("Failed to initialize Firebase Admin with cert, falling back to dummy app for build phase.");
    app = initializeApp({ projectId: serviceAccount.projectId || "dummy" });
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
