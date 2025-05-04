// src/types/blood-request.ts
import type { Timestamp } from 'firebase/firestore';
import type { BloodGroup } from './user'; // Re-use blood group type

export type RequestStatus = 'Pending' | 'Pending Verification' | 'Active' | 'Partially Fulfilled' | 'Fulfilled' | 'Cancelled' | 'Expired';
export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export interface BloodRequest {
  id?: string; // Firestore document ID
  requesterUid: string; // UID of the user making the request
  requesterName: string; // Denormalized for easier display
  patientName: string;
  requiredBloodGroup: BloodGroup;
  unitsRequired: number;
  unitsFulfilled: number; // Track fulfillment progress
  urgency: UrgencyLevel;
  hospitalName: string;
  hospitalLocation: string; // Address or description
  contactPhone: string; // Contact for the request at the hospital/clinic
  additionalDetails?: string;
  status: RequestStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Optional: expiryDate?: Timestamp;
}

// Export BloodGroup as well if not already done elsewhere consistently
export type { BloodGroup };
