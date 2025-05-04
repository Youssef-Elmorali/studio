
"use client"; // Required for state and effects

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2, AlertCircle, Eye, Calendar as CalendarIcon } from 'lucide-react'; // Added CalendarIcon
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { BloodBank } from '@/types/blood-bank';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import GoogleMapEmbed from '@/components/google-map-embed'; // Using GoogleMapEmbed
import { db } from '@/lib/firebase/client'; // Import Firebase client
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Import Popover
import { Calendar } from "@/components/ui/calendar"; // Import Calendar
import { cn } from "@/lib/utils";
import { format, parse, isValid } from 'date-fns'; // Import date-fns
import { useToast } from "@/hooks/use-toast"; // Import useToast


export default function DonatePage() {
  const [bloodBanks, setBloodBanks] = React.useState<BloodBank[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined); // State for date filter
  const [isClient, setIsClient] = React.useState(false); // State to track client-side mount
  const [mapSearchQuery, setMapSearchQuery] = React.useState(''); // State for map search
  const [mapEmbedUrl, setMapEmbedUrl] = React.useState(''); // State for the map embed URL
  const { toast } = useToast();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  React.useEffect(() => {
    setIsClient(true); // Set client to true once mounted
    // Set initial map URL
    setMapEmbedUrl(
        apiKey
        ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=31.9632,35.9306&zoom=7` // Generic center (Jordan)
        : `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d364873.1399105681!2d35.6674351406123!3d31.8390418776641!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151b5fb85d7981af%3A0x631c30c0f8dc65e8!2sJordan!5e0!3m2!1sen!2sus!4v1678886543210!5m2!1sen!2sus` // Fallback generic
    );
  }, [apiKey]);

  // Fetch blood banks from Firestore
  React.useEffect(() => {
    const fetchBloodBanks = async () => {
        if (!db) {
            setError("Firebase Firestore client is not available.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const banksCollectionRef = collection(db, 'blood_banks'); // Ensure collection name is correct
            const banksSnapshot = await getDocs(banksCollectionRef);

            const fetchedBanks = banksSnapshot.docs.map(doc => {
                const data = doc.data();
                 return {
                     id: doc.id,
                     name: data.name ?? 'Unnamed Bank',
                     location: data.location ?? 'Unknown Location',
                      // Adjust field names based on your Firestore structure (e.g., location_coords)
                     locationCoords: data.location_coords ? { lat: data.location_coords.latitude, lng: data.location_coords.longitude } : undefined,
                     contactPhone: data.contact_phone, // Adjust field name
                     operatingHours: data.operating_hours, // Adjust field name
                     website: data.website,
                     inventory: data.inventory ?? {},
                     // Handle Firestore timestamp format
                     lastInventoryUpdate: data.last_inventory_update instanceof Timestamp ? data.last_inventory_update.toDate() : new Date(0), // Convert Timestamp
                     servicesOffered: data.services_offered ?? [],
                     createdAt: data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(0),
                     updatedAt: data.updated_at instanceof Timestamp ? data.updated_at.toDate() : new Date(0),
                 } as BloodBank; // Ensure type cast
             }) || [];

             setBloodBanks(fetchedBanks);

        } catch (err: any) {
            console.error("Error fetching blood banks:", err);
             let errorMessage = "Failed to load donation center data. Please try again later.";
             if (err.message) {
                 errorMessage = `Failed to load donation centers: ${err.message}`;
                  if (err.code === 'permission-denied') {
                      errorMessage = "Database permission error: Cannot read 'blood_banks'. Check Firestore rules.";
                  } else if (err.code === 'unauthenticated') {
                       errorMessage = "Authentication required to access blood bank data.";
                  }
             }
            setError(errorMessage);
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    fetchBloodBanks();
  }, [toast]); // Removed db dependency as it should be stable

  // Filtered blood banks based on search query and date
  const filteredBloodBanks = React.useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase().trim();
    let filtered = bloodBanks;

    // Filter by search query (name or location)
    if (lowerCaseQuery) {
        filtered = filtered.filter(bank =>
           (bank.name?.toLowerCase() ?? '').includes(lowerCaseQuery) ||
           (bank.location?.toLowerCase() ?? '').includes(lowerCaseQuery)
        );
    }

    // Placeholder for date filtering (requires fetching campaign/availability data linked to banks)
    if (selectedDate) {
        console.log("Filtering by date (placeholder):", format(selectedDate, 'yyyy-MM-dd'));
        // TODO: Implement actual date filtering based on campaign data or bank availability schedules
        // Example: Find campaigns associated with the bank on the selected date
        // filtered = filtered.filter(bank => hasAvailabilityOnDate(bank.id, selectedDate));
        // For now, just show a message if date filtering is selected but not implemented
        const dateFilterMessage = "Date filtering is not fully implemented yet. Showing centers matching name/location.";
        if (error !== dateFilterMessage) { // Avoid duplicate error messages
            setError(dateFilterMessage);
             toast({ title: "Notice", description: dateFilterMessage, variant: "default" });
        }
    } else {
         // Clear date-related error/message when no date is selected
         if (error === "Date filtering is not fully implemented yet. Showing centers matching name/location.") {
             setError(null);
         }
    }

    return filtered;
  }, [searchQuery, selectedDate, bloodBanks, error, toast]); // Include toast in dependencies


  // Handle map search submission
  const handleMapSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return; // Don't search if empty

    if (apiKey) {
        const newEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(mapSearchQuery)}`;
        setMapEmbedUrl(newEmbedUrl);
         toast({ title: "Map Updated", description: `Map centered on search for "${mapSearchQuery}".` });
    } else {
        toast({
            title: "Map Search Limited",
            description: "Google Maps API Key is missing. Using basic search.",
            variant: "destructive",
        });
        // Fallback to basic query URL if no API key
        const fallbackUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
         setMapEmbedUrl(fallbackUrl);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Find a Donation Center</CardTitle>
          <CardDescription>Locate nearby blood donation centers or drives and find contact information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Search and Filter Section */}
          <div className="space-y-4 p-6 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold flex items-center"><Search className="mr-2 h-5 w-5"/>Search &amp; Filter Centers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                  <Label htmlFor="location-search">Location or Center Name</Label>
                  <Input
                      id="location-search"
                      placeholder="e.g., Cityville or Central Bank"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                   />
              </div>
               {/* Date Filter */}
               <div className="space-y-1">
                   <Label htmlFor="date-filter">Date (Optional)</Label>
                   <Popover>
                      <PopoverTrigger asChild>
                         <Button
                           id="date-filter"
                           variant={"outline"}
                           className={cn(
                             "w-full justify-start text-left font-normal",
                             !selectedDate && "text-muted-foreground"
                           )}
                         >
                           <CalendarIcon className="mr-2 h-4 w-4" />
                           {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto p-0">
                         <Calendar
                           mode="single"
                           selected={selectedDate}
                           onSelect={setSelectedDate}
                           initialFocus
                         />
                       </PopoverContent>
                    </Popover>
                     <p className="text-xs text-muted-foreground">Filter by available donation dates (coming soon).</p>
                </div>
            </div>
          </div>

           {/* Error Display */}
           {error && (
               <Alert variant={error.includes("Date filtering") ? "default" : "destructive"}> {/* Adjust variant based on error */}
                  <AlertCircle className="h-4 w-4" />
                 <AlertTitle>{error.includes("Date filtering") ? "Notice" : "Error"}</AlertTitle>
                 <AlertDescription>{error}</AlertDescription>
               </Alert>
            )}


          {/* Results List */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center justify-center"><MapPin className="mr-2 h-5 w-5"/>Donation Centers</h3>

            {loading ? (
               <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                   <p className="text-muted-foreground">Loading centers...</p>
               </div>
            ) : filteredBloodBanks.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {filteredBloodBanks.map((bank) => (
                    <Card key={bank.id} className="shadow-md hover:shadow-lg transition-shadow">
                       <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-semibold">{bank.name}</CardTitle>
                           <CardDescription className="flex items-center pt-1 text-sm">
                              <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0"/> {bank.location}
                           </CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-3 text-sm">
                           {bank.operatingHours && <p className="text-muted-foreground">Hours: {bank.operatingHours}</p>}
                            {bank.contactPhone && <p className="text-muted-foreground">Phone: <a href={`tel:${bank.contactPhone}`} className="text-primary hover:underline">{bank.contactPhone}</a></p>}
                             <div className="pt-3 text-right">
                                <Button variant="outline" size="sm" asChild>
                                    {/* Link to Firebase-based detail page */}
                                    <Link href={`/donate/banks/${bank.id}`}>
                                        <Eye className="mr-1 h-4 w-4"/> View Details &amp; Inventory
                                    </Link>
                                </Button>
                             </div>
                       </CardContent>
                    </Card>
                 ))}
               </div>
            ) : (
                <p className="text-center text-muted-foreground py-8">
                   {searchQuery || selectedDate ? 'No centers found matching your criteria.' : 'No donation centers available.'}
                </p>
            )}
          </div>


           {/* Google Map Section */}
           <Separator />
            {isClient ? (
                 <GoogleMapEmbed
                       initialEmbedUrl={mapEmbedUrl} // Pass initial URL
                       title={`Map of Donation Centers Area`}
                       searchQuery={mapSearchQuery}
                       setSearchQuery={setMapSearchQuery}
                       onSearchSubmit={handleMapSearch}
                   />
             ) : (
                 <div className="flex justify-center items-center h-[450px] w-full bg-muted rounded-md border">
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-2 text-muted-foreground">Initializing map...</p>
                 </div>
             )}

        </CardContent>
      </Card>
    </div>
  );
}
