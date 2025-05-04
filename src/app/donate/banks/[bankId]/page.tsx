
"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Clock, Droplets, Banknote, Loader2, AlertCircle, ArrowLeft, Globe } from "lucide-react";
import { db } from '@/lib/firebase/client'; // Import Firestore instance
import { doc, getDoc, Timestamp } from 'firebase/firestore'; // Import Firestore functions
import type { BloodBank, BloodGroup, BloodInventoryMap } from '@/types/blood-bank';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format, isValid } from 'date-fns'; // Import date-fns
import GoogleMapEmbed from '@/components/google-map-embed';

// Re-use helper functions
const bloodTypes: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const getInventoryBadgeClass = (count: number | undefined): string => {
    const numCount = count ?? 0;
    if (numCount > 40) return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
    if (numCount > 10) return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200';
    if (numCount > 0) return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200';
    return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
};

const getInventoryLevelText = (count: number | undefined): string => {
    const numCount = count ?? 0;
    if (numCount > 40) return 'Available';
    if (numCount > 10) return 'Moderate';
    if (numCount > 0) return 'Low';
    return 'Critical';
}

export default function BloodBankDetailPage() {
  const params = useParams();
  const bankId = params.bankId as string;
  const [bank, setBank] = React.useState<BloodBank | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!bankId) {
        setError("Blood bank ID is missing.");
        setLoading(false);
        return;
    };

    const fetchBankDetails = async () => {
        if (!db) { // Check if Firestore instance is available
            setError("Database connection is not available.");
            setLoading(false);
            return;
        }
      setLoading(true);
      setError(null);
      try {
          const bankDocRef = doc(db, 'blood_banks', bankId); // Ensure collection name is correct
          const bankDocSnap = await getDoc(bankDocRef);

        if (bankDocSnap.exists()) {
             const data = bankDocSnap.data();
             const bankData: BloodBank = {
                 id: bankDocSnap.id,
                 name: data.name || 'Unnamed Bank',
                 location: data.location || 'Unknown Location',
                 // Adjust field names based on your Firestore structure (e.g., location_coords)
                 locationCoords: data.location_coords ? { lat: data.location_coords.latitude, lng: data.location_coords.longitude } : undefined,
                 contactPhone: data.contact_phone,
                 operatingHours: data.operating_hours,
                 website: data.website,
                 inventory: data.inventory as BloodInventoryMap || {}, // Ensure type assertion
                 lastInventoryUpdate: data.last_inventory_update, // Keep as Timestamp
                 servicesOffered: data.services_offered || [],
                 createdAt: data.created_at, // Keep as Timestamp
                 updatedAt: data.updated_at, // Keep as Timestamp
             };
           setBank(bankData);
        } else {
          setError("Blood bank not found.");
        }
      } catch (err: any) {
        console.error("Error fetching blood bank details:", err);
        setError(`Failed to load blood bank details: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBankDetails();
  }, [bankId]); // Depend on bankId


    // Format last updated date safely
     const formatLastUpdated = (date: Date | Timestamp | null | undefined): string => {
         if (!date) return 'N/A';
         try {
            const dateObj = date instanceof Timestamp ? date.toDate() : date;
             // Check if it's already a Date object
             if (dateObj instanceof Date && isValid(dateObj) && !isNaN(dateObj.getTime())) {
                 return format(dateObj, 'Pp'); // Format like: Mar 15, 2024, 10:30 AM
             }
             // Attempt to parse if it's a string (less likely with Firestore Timestamps)
             if (typeof date === 'string') {
                 const parsedDate = new Date(date);
                 if (!isNaN(parsedDate.getTime())) {
                      return format(parsedDate, 'Pp');
                 }
             }
             return 'Invalid Date';
         } catch (e) {
             console.error("Error formatting date:", e, "Input:", date);
             return 'Invalid Date';
         }
     };

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
     // Use Place mode for better accuracy with address/name
     const initialGoogleMapsEmbedUrl = bank?.location // Renamed variable
         ? apiKey
             ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(bank.name + ', ' + bank.location)}`
             : `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d364873.1399105681!2d35.6674351406123!3d31.8390418776641!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151b5fb85d7981af%3A0x631c30c0f8dc65e8!2sJordan!5e0!3m2!1sen!2sus!4v1678886543210!5m2!1sen!2sus` // Fallback generic
         : ''; // Return empty if no location


  // --- Render Logic ---
   if (loading) {
      return (
         <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
         </div>
      );
   }

   if (error) {
       return (
           <div className="container mx-auto py-12 px-4 text-center">
               <Alert variant="destructive" className="max-w-md mx-auto mb-6">
                  <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Error</AlertTitle>
                 <AlertDescription>{error}</AlertDescription>
               </Alert>
               <Button asChild variant="outline">
                   <Link href="/donate"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Find Banks</Link>
               </Button>
           </div>
       );
   }

   if (!bank) {
        return (
           <div className="container mx-auto py-12 px-4 text-center">
             <h1 className="text-2xl font-bold text-destructive mb-4">Blood Bank Not Found</h1>
             <p className="text-muted-foreground mb-6">The blood bank you are looking for could not be loaded.</p>
             <Button asChild variant="outline">
               <Link href="/donate"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Find Banks</Link>
             </Button>
           </div>
         );
   }


  return (
    <div className="container mx-auto py-12 px-4">
       <div className="mb-6">
           <Button variant="outline" size="sm" asChild>
              <Link href="/donate"> {/* Link back to the main donation page */}
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back to Find Banks
              </Link>
           </Button>
       </div>

      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
           <div>
             <CardTitle className="text-2xl font-bold text-primary flex items-center mb-1">
               <Banknote className="mr-2 h-6 w-6" /> {bank.name}
             </CardTitle>
             <CardDescription className="flex items-center text-muted-foreground">
               <MapPin className="mr-1 h-4 w-4" /> {bank.location}
             </CardDescription>
           </div>
           <div className="flex flex-col items-start sm:items-end space-y-1 text-sm text-muted-foreground pt-1">
                {bank.contactPhone && (
                  <span className="flex items-center">
                    <Phone className="mr-1.5 h-4 w-4" /> <a href={`tel:${bank.contactPhone}`} className="hover:text-primary">{bank.contactPhone}</a>
                  </span>
                )}
                {bank.operatingHours && (
                   <span className="flex items-center">
                     <Clock className="mr-1.5 h-4 w-4" /> {bank.operatingHours}
                   </span>
                )}
                 {bank.website && (
                    <span className="flex items-center">
                        <Globe className="mr-1.5 h-4 w-4" />
                        <a href={bank.website.startsWith('http') ? bank.website : `https://${bank.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-xs">
                            {bank.website}
                         </a>
                    </span>
                 )}
           </div>

        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center flex items-center justify-center"><Droplets className="mr-2 h-5 w-5 text-primary"/>Detailed Inventory</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {bloodTypes.map((type) => {
                 const inventoryCount = bank.inventory?.[type];
                 return (
                     <div key={type} className="p-3 border rounded-md text-center bg-card hover:bg-muted/50 transition-colors">
                       <Badge
                         variant="outline"
                         className={cn("text-lg font-semibold mb-2 px-3 py-1", getInventoryBadgeClass(inventoryCount))}
                       >
                         {type}
                       </Badge>
                       <p className="text-sm font-medium">{getInventoryLevelText(inventoryCount)}</p>
                       <p className="text-xs text-muted-foreground">({inventoryCount ?? 0} Units)</p>
                     </div>
                 );
              })}
            </div>
            <div className="mt-6 flex justify-center space-x-4 text-sm flex-wrap gap-y-2">
               <div className="flex items-center"><span className="h-3 w-3 rounded-full mr-1 border border-green-400 bg-green-100"></span> High Availability</div>
               <div className="flex items-center"><span className="h-3 w-3 rounded-full mr-1 border border-yellow-400 bg-yellow-100"></span> Moderate</div>
               <div className="flex items-center"><span className="h-3 w-3 rounded-full mr-1 border border-orange-400 bg-orange-100"></span> Low</div>
               <div className="flex items-center"><span className="h-3 w-3 rounded-full mr-1 border border-red-400 bg-red-100"></span> Critical</div>
           </div>
           {bank.lastInventoryUpdate && (
             <p className="text-xs text-muted-foreground text-center mt-2">
               Inventory last updated: {formatLastUpdated(bank.lastInventoryUpdate)}
             </p>
           )}
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">Additional Information</h3>
             {bank.servicesOffered && bank.servicesOffered.length > 0 && (
                 <div className="text-center">
                    <h4 className="font-medium mb-2">Services Offered:</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                        {bank.servicesOffered.map(service => (
                            <Badge key={service} variant="secondary">{service}</Badge>
                        ))}
                    </div>
                 </div>
             )}

             {initialGoogleMapsEmbedUrl && ( // Check if initial URL exists
                  <GoogleMapEmbed
                       initialEmbedUrl={initialGoogleMapsEmbedUrl} // Pass initial URL
                       title={`Map of ${bank.name}`}
                   />
             )}
            {!apiKey && (
                <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Map Configuration Notice</AlertTitle>
                <AlertDescription>
                    A Google Maps API Key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) is recommended for full map functionality. The current map display might be limited.
                </AlertDescription>
                </Alert>
            )}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
