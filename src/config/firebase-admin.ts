import admin from "firebase-admin";

let messaging: admin.messaging.Messaging | null = null;

export function getFcm(): admin.messaging.Messaging | null {
  if (messaging) return messaging;

  const enabled = (process.env.FCM_ENABLED ?? "true").toLowerCase() !== "false";
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

  if (!enabled) {
    console.warn("FCM disabled by FCM_ENABLED=false");
    return null;
  }

  if (!projectId || !clientEmail || !privateKeyEnv) {
    console.warn("FCM not configured: missing FIREBASE_* envs");
    return null;
  }

  const privateKey = privateKeyEnv.replace(/\\n/g, "\n");

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  messaging = admin.messaging();
  return messaging;
}


