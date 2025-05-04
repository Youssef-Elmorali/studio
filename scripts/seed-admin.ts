
// scripts/seed-admin.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Load env vars

// Import Firebase Admin SDK components
import { adminAuth, adminDb } from '../src/lib/firebase/admin'; // Import initialized admin services
import type { UserProfile, UserRole, Gender, BloodGroup } from '../src/types/user'; // Import local types
import { Timestamp } from 'firebase-admin/firestore'; // Use admin Timestamp

// --- Configuration ---
// Admin User Details
const adminEmail = 'qunicrom1@gmail.com'; // Updated email
const adminPassword = 'Admin@jo'; // Updated password
const adminFirstName = 'Admin';
const adminLastName = 'User';
const adminPhone = '0000000000';
const adminBloodGroup: BloodGroup = 'O+';
const adminGender: Gender = 'Male';
const adminRole: UserRole = 'admin';

// --- Seed Function ---
const seedAdminUser = async () => {
  console.log(`🌱 Attempting to seed admin user: ${adminEmail}`);

  // Check if Firebase Admin SDK was initialized properly
  if (!adminAuth || !adminDb) {
    console.error("🔴 ERROR: Firebase Admin SDK is not initialized. Check src/lib/firebase/admin.ts and environment variables.");
    process.exit(1);
  }

  try {
    // 1. Check if user already exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(adminEmail);
      console.log(`🟡 Admin user ${adminEmail} already exists in Firebase Auth (UID: ${userRecord.uid}). Skipping Auth creation.`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`✨ Creating new admin user ${adminEmail} in Firebase Auth...`);
        // 2. Create user in Firebase Auth if not found
        userRecord = await adminAuth.createUser({
          email: adminEmail,
          password: adminPassword,
          emailVerified: true, // Mark as verified since we're creating directly
          displayName: `${adminFirstName} ${adminLastName}`,
          disabled: false,
        });
        console.log(`✅ Successfully created admin user in Firebase Auth (UID: ${userRecord.uid})`);
      } else {
        // Rethrow other Auth errors
        throw error;
      }
    }

    const adminUid = userRecord.uid;

    // 3. Check if user profile exists in Firestore
    const userDocRef = adminDb.collection('users').doc(adminUid);
    const userDocSnap = await userDocRef.get();

    if (userDocSnap.exists) {
      console.log(`🟡 Admin profile for UID ${adminUid} already exists in Firestore. Checking role...`);
      // Optional: Update role if needed (e.g., if it was 'donor' before)
      const currentData = userDocSnap.data();
      if (currentData?.role !== 'admin') {
          console.log(`🔄 Updating role to 'admin' for existing profile...`);
          await userDocRef.update({ role: 'admin', updatedAt: Timestamp.now() });
          console.log(`✅ Role updated to 'admin'.`);
      } else {
           console.log(`✅ Profile already exists with correct admin role.`);
      }
    } else {
      console.log(`✨ Creating new admin profile for UID ${adminUid} in Firestore...`);
      // 4. Create user profile in Firestore if it doesn't exist
      const profileData: UserProfile = {
        uid: adminUid,
        email: adminEmail,
        firstName: adminFirstName,
        lastName: adminLastName,
        phone: adminPhone,
        dob: Timestamp.fromDate(new Date(1990, 0, 1)), // Example DOB, store as Timestamp
        bloodGroup: adminBloodGroup,
        gender: adminGender,
        role: adminRole,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Initialize optional donor fields as null or default if needed
        lastDonationDate: null,
        medicalConditions: null,
        isEligible: null,
        nextEligibleDate: null,
        totalDonations: 0,
      };
      await userDocRef.set(profileData);
      console.log(`✅ Successfully created admin profile in Firestore.`);
    }

    // 5. Set custom claim for admin role (Optional but recommended for secure access control)
     try {
        await adminAuth.setCustomUserClaims(adminUid, { role: 'admin' });
        console.log(`✅ Set custom claim 'role: admin' for UID ${adminUid}.`);
     } catch (claimError: any) {
         console.error(`🔴 ERROR setting custom claim for ${adminEmail}:`, claimError.message);
         // Decide if this is critical - maybe the Firestore role is enough for your rules
     }


    console.log("🎉 Admin seeding process completed successfully!");

  } catch (error: any) {
    console.error("🔴 ERROR during admin seeding:", error.code || error.message);
    if (error.code === 'auth/email-already-exists') {
        console.error(`Hint: The email ${adminEmail} might be associated with a different sign-in method (e.g., Google) or another user.`);
    } else if (error.message?.includes('service account')) {
        console.error("Hint: Check if the FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is correctly set and points to a valid JSON key file.");
    } else if (error.message?.includes('Unable to determine project ID')) {
        console.error("Hint: Ensure the service account JSON is valid and contains a 'project_id'.");
    }
    process.exit(1); // Exit with error code
  }
};

// Run the seed function
seedAdminUser();
