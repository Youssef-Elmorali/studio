// src/types/campaign.ts
import type { Timestamp } from 'firebase/firestore';
import type { BloodGroup } from './user'; // Re-use blood group type

export type CampaignStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface Campaign {
  id?: string; // Firestore document ID, optional before creation
  title: string;
  description: string;
  organizer: string; // Could be a reference to a User or Organization later
  startDate: Timestamp;
  endDate: Timestamp;
  timeDetails: string; // e.g., "10:00 AM - 4:00 PM Daily"
  location: string; // Address or description
  locationCoords?: { lat: number; lng: number }; // Optional GeoPoint representation
  imageUrl?: string; // URL to campaign image
  goalUnits: number; // Target number of blood units
  collectedUnits: number; // Current collected units
  status: CampaignStatus;
  participantsCount: number; // Registered or attended participants
  requiredBloodGroups?: BloodGroup[]; // Optional: Specific needs
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
