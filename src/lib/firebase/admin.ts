
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

// Ensure environment variables are loaded (e.g., using dotenv if not Next.js context)
// require('dotenv').config({ path: '.env.local' }); // Use if running outside Next.js

let firebaseAdminApp: App | null = null; // Initialize as null

try {
    if (!admin.apps.length) {
        const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON;

        if (!serviceAccountKeyJson) {
            console.error('🔴 ERROR: FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set.');
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set.');
        }

        const serviceAccount = JSON.parse(serviceAccountKeyJson);

        firebaseAdminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com` // Optional: if using Realtime DB
        });
         console.log("✅ Firebase Admin SDK initialized successfully.");
    } else {
        firebaseAdminApp = admin.app();
         console.log("🔄 Using existing Firebase Admin SDK instance.");
    }
} catch (error: any) {
    console.error("🔴 ERROR: Failed to initialize Firebase Admin SDK:", error.message);
    if (error.message.includes("JSON")) {
        console.error("Hint: The service account JSON might be malformed or incomplete.");
        console.error("Received partial JSON:", (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON || '').substring(0, 100) + '...'); // Log partial key for debugging (careful in prod)
    }
    // Optionally rethrow or handle recovery - for now, log the error
    // throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
}

// Provide default nulls if initialization failed, allows scripts to check
export const adminAuth = firebaseAdminApp ? admin.auth(firebaseAdminApp) : null;
export const adminDb = firebaseAdminApp ? admin.firestore(firebaseAdminApp) : null;
export const adminStorage = firebaseAdminApp ? admin.storage(firebaseAdminApp) : null;

// Export the app instance (or null if failed)
export default firebaseAdminApp;
