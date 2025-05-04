
// src/types/user.ts
import type { Timestamp } from 'firebase/firestore'; // Use Firebase Timestamp

// Define types used within the application (camelCase)
export type UserRole = 'donor' | 'recipient' | 'admin';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type Gender = 'Male' | 'Female'; // Limited options as requested

export interface UserProfile {
  uid: string; // Corresponds to Firebase auth user ID
  email: string | null; // Comes from Firebase Auth user
  firstName: string;
  lastName: string;
  phone?: string | null; // Make phone optional as per schema
  dob?: Timestamp | null; // Use Firebase Timestamp object, make optional
  bloodGroup?: BloodGroup | null; // Make optional
  gender?: Gender | null; // Make optional
  role: UserRole;
  createdAt: Timestamp; // Use Firebase Timestamp object
  updatedAt: Timestamp; // Use Firebase Timestamp object
  // --- Donor Specific ---
  lastDonationDate?: Timestamp | null; // Use Firebase Timestamp
  medicalConditions?: string | null;
  isEligible?: boolean | null; // Allow null based on schema
  nextEligibleDate?: Timestamp | null; // Use Firebase Timestamp
  totalDonations?: number;
}
