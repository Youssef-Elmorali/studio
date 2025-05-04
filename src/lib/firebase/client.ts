
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
      // Basic check if essential config values are present
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
         throw new Error("Firebase configuration is missing required fields (apiKey, projectId). Check .env.local.");
      }
      app = initializeApp(firebaseConfig);
      console.log("Firebase initialized successfully.");
  } catch (e: any) {
      console.error("Firebase initialization error:", e.message);
      // Rethrow or handle appropriately
      throw e;
  }

} else {
  app = getApp();
  console.log("Using existing Firebase app instance.");
}

let authInstance = null;
let dbInstance = null;
let storageInstance = null;
let functionsInstance = null;

try {
    // Attempt to get services only if app is initialized
    if (app) {
        authInstance = getAuth(app);
        dbInstance = getFirestore(app);
        storageInstance = getStorage(app);
        functionsInstance = getFunctions(app); // Initialize Functions
    } else {
         console.error("Firebase app instance is not available. Cannot get services.");
    }

} catch (e: any) {
    console.error("Error getting Firebase services:", e.message);
    // Handle cases where a service might not be available or configured
}

// --- Emulator Setup (Optional - Controlled by Environment Variable) ---
// NOTE: Ensure emulators are running before uncommenting.
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

if (
    useEmulators &&
    app && // Ensure app is initialized
    typeof window !== 'undefined' && // Ensure this runs only client-side
    window.location.hostname === 'localhost'
   ) {
   console.log("🚀 Connecting to Firebase Emulators...");
   try {
       // Use 127.0.0.1 for emulators
       // Check if already connected to avoid errors on hot-reloads
       if (authInstance && !authInstance?.emulatorConfig) {
            connectAuthEmulator(authInstance, "http://127.0.0.1:9099", { disableWarnings: true });
            console.log("🔒 Auth Emulator connected to http://127.0.0.1:9099");
       }
       if (dbInstance && !(dbInstance as any)._settings?.host) { // Check Firestore connection more reliably
           connectFirestoreEmulator(dbInstance, "127.0.0.1", 8080);
           console.log("📄 Firestore Emulator connected to 127.0.0.1:8080");
       }
       if (storageInstance && !storageInstance?.emulatorConfig) {
            connectStorageEmulator(storageInstance, "127.0.0.1", 9199);
            console.log("📦 Storage Emulator connected to 127.0.0.1:9199");
       }
        if (functionsInstance && !functionsInstance?.emulatorConfig) {
             connectFunctionsEmulator(functionsInstance, "127.0.0.1", 5001);
             console.log("🔧 Functions Emulator connected to 127.0.0.1:5001");
        }
       console.log("✅ Successfully connected to Firebase Emulators.");
   } catch (emulatorError: any) {
        console.error("🔴 Error connecting to Firebase emulators:", emulatorError.message);
   }
} else {
     console.log("🌐 Connecting to production Firebase services.");
}
// --- End Emulator Setup ---

// Export the instances, handling potential null cases if initialization failed
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
export const functions = functionsInstance;
export { app }; // Export app instance if needed elsewhere
