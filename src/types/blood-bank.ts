// src/types/blood-bank.ts
import type { Timestamp } from 'firebase/firestore';
import type { BloodGroup } from './user'; // Re-use types

// Update BloodInventory to use BloodGroup keys correctly
export type BloodInventoryMap = {
    [key in BloodGroup]?: number; // Use BloodGroup as keys, value is optional number
};

export interface BloodBank {
  id?: string; // Firestore document ID
  name: string;
  location: string;
  // Use Firestore GeoPoint if needed, otherwise keep simple lat/lng
  locationCoords?: { lat: number; lng: number }; // Optional GeoPoint representation
  contactPhone?: string;
  operatingHours?: string; // e.g., "Mon-Fri 9am-5pm"
  website?: string;
  inventory: BloodInventoryMap; // Map of blood type to count
  lastInventoryUpdate: Timestamp;
  servicesOffered?: string[]; // e.g., ["Whole Blood Donation", "Platelet Apheresis"]
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Re-export for clarity if needed elsewhere, though direct import is fine
export type { BloodGroup };


// --- Mock Data Generation (Optional, for testing) ---

const bloodTypesArray: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const generateMockInventory = (): BloodInventoryMap => {
  const inventory: BloodInventoryMap = {};
  bloodTypesArray.forEach(type => {
    inventory[type] = Math.floor(Math.random() * 61); // Random count 0-60
  });
  return inventory;
};

// Example: Generate coordinates around a central point (e.g., Cityville center)
const generateCoords = (centerLat: number, centerLng: number): { lat: number; lng: number } => {
    const latOffset = (Math.random() - 0.5) * 0.1; // +/- 0.05 degrees latitude variation
    const lngOffset = (Math.random() - 0.5) * 0.1; // +/- 0.05 degrees longitude variation
    return { lat: centerLat + latOffset, lng: centerLng + lngOffset };
};

// Function to generate a list of mock BloodBank objects
export const generateMockBloodBanks = (count: number, centerLat: number, centerLng: number): BloodBank[] => {
    const mockBanks: BloodBank[] = [];
    const operatingHoursOptions = [
        "Mon-Fri 9am-5pm",
        "Tue-Sat 10am-6pm",
        "Mon, Wed, Fri 8am-4pm",
        "Daily 10am-4pm",
        "Weekends 11am-3pm"
    ];
    for (let i = 1; i <= count; i++) {
        const coords = generateCoords(centerLat, centerLng);
        mockBanks.push({
            id: `mock-bb-${i}`,
            name: `Mock Blood Center ${i}`,
            location: `Location ${i}, Near ${coords.lat.toFixed(2)}, ${coords.lng.toFixed(2)}`,
            locationCoords: coords,
            contactPhone: `(555) 123-${1000 + i}`,
            operatingHours: operatingHoursOptions[Math.floor(Math.random() * operatingHoursOptions.length)],
            website: `www.mockbank${i}.org`,
            inventory: generateMockInventory(),
            lastInventoryUpdate: Timestamp.fromDate(new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)), // Updated within last 24h
            servicesOffered: ["Whole Blood", Math.random() > 0.5 ? "Platelets" : undefined].filter(Boolean) as string[],
            createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)), // Created within last month
            updatedAt: Timestamp.now(),
        });
    }
    return mockBanks;
};

// --- End Mock Data Generation ---
