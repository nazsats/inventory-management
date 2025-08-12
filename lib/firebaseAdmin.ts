// lib/firebaseAdmin.ts
import admin from 'firebase-admin';

type ServiceAccountLike = {
  project_id: string;
  client_email: string;
  private_key: string;
} & Record<string, unknown>;

let app: admin.app.App | undefined;

function buildCredential() {
  // 1) Try FIREBASE_SERVICE_ACCOUNT (JSON string)
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (svc) {
    try {
      const parsed = JSON.parse(svc) as ServiceAccountLike;
      // normalize newlines in private key
      if (typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return admin.credential.cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      });
    } catch (err) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT JSON. Check quotes and escaping.', err);
    }
  }

  // 2) Fall back to discrete env vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // allow both escaped and raw newlines
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, '\n') : undefined;

  if (projectId && clientEmail && privateKey) {
    return admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  // 3) Last resort: Application Default Credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
  try {
    return admin.credential.applicationDefault();
  } catch {
    throw new Error(
      'Firebase Admin credentials are not configured. ' +
        'Set FIREBASE_SERVICE_ACCOUNT (JSON) or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.'
    );
  }
}

if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: buildCredential(),
    // databaseURL: process.env.FIREBASE_DATABASE_URL, // if you use RTDB
  });
} else {
  app = admin.app();
}

export const adminAuth = admin.auth(app);
export const adminFirestore = admin.firestore(app);
