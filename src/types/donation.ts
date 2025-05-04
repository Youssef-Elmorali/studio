// src/types/donation.ts
import type { Timestamp } from 'firebase/firestore';
import type { BloodGroup } from './user'; // Re-use blood group type

export type DonationType = 'Whole Blood' | 'Platelets' | 'Plasma' | 'Power Red'; // Example types

export interface DonationRecord {
  id?: string; // Firestore document ID
  donorUid: string; // UID of the user who donated
  donationDate: Timestamp;
  donationType: DonationType;
  locationName: string; // e.g., "City Central Blood Bank" or "Summer Blood Drive"
  campaignId?: string | null; // Optional link to a specific campaign document, allow null
  bloodBankId?: string | null; // Optional link to a blood bank entity, allow null
  notes?: string; // Any notes from the donation center or donor
  // Could add eligibility snapshot info here if needed
  createdAt: Timestamp;
}
