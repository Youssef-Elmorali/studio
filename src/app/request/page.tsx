
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Send, Banknote, MapPin, Droplets, Search, Eye, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { BloodCompatibilityChart } from '@/components/blood-compatibility-chart';
import { db } from '@/lib/firebase/client'; // Import Firestore instance
import { collection, getDocs, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore'; // Import Firestore functions
import type { BloodBank, BloodInventoryMap, BloodGroup } from '@/types/blood-bank';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { BloodRequest, RequestStatus, UrgencyLevel } from '@/types/blood-request';
import { useAuth } from '@/hooks/useAuth'; // Use Firebase Auth hook
import { useToast } from '@/hooks/use-toast';
// Removed UserProfile import as it's included in useAuth now

// --- Constants ---
const bloodTypes: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const urgencyLevels: UrgencyLevel[] = ['Critical', 'High', 'Medium', 'Low'];

// --- Zod Schema for Request Form ---
const requestSchema = z.object({
  patientName: z.string().min(1, "Patient's name is required"),
  requiredBloodGroup: z.enum(bloodTypes, { required_error: "Blood group is required" }),
  unitsRequired: z.coerce.number().min(1, "At least 1 unit is required"),
  urgency: z.enum(urgencyLevels, { required_error: "Urgency level is required" }),
  hospitalName: z.string().min(1, "Hospital name is required"),
  hospitalLocation: z.string().min(1, "Hospital location is required"),
  contactPhone: z.string().min(10, "Valid contact phone is required").regex(/^\+?[0-9\s\-()]+$/, "Invalid phone number format"),
  additionalDetails: z.string().optional(),
});

type RequestFormInputs = z.infer<typeof requestSchema>;


// --- Helper function for badge color based on inventory ---
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
// --- End Helper ---


export default function RequestBloodPage() {
    const { user, userProfile, loading: authLoading } = useAuth(); // Use Firebase Auth hook
    const { toast } = useToast();
    const [bloodBanks, setBloodBanks] = React.useState<BloodBank[]>([]);
    const [loadingBanks, setLoadingBanks] = React.useState(true);
    const [fetchError, setFetchError] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { register, handleSubmit, control, reset: resetForm, formState: { errors } } = useForm<RequestFormInputs>({
        resolver: zodResolver(requestSchema),
        defaultValues: {
             unitsRequired: 1,
        }
    });

    // Fetch blood banks from Firestore on component mount
    React.useEffect(() => {
        const fetchBloodBanks = async () => {
             if (!db) { // Check if Firestore instance is available
                setFetchError("Database connection is not available.");
                setLoadingBanks(false);
                return;
            }
            setLoadingBanks(true);
            setFetchError(null);
            try {
                const banksCollectionRef = collection(db, 'blood_banks');
                const banksSnapshot = await getDocs(banksCollectionRef);

                const fetchedBanks = banksSnapshot.docs.map(doc => {
                     const data = doc.data();
                     return {
                         id: doc.id,
                         name: data.name || 'Unnamed Bank', // Provide defaults
                         location: data.location || 'Unknown Location',
                         // Adjust field names based on your Firestore structure (e.g., location_coords)
                         locationCoords: data.location_coords ? { lat: data.location_coords.latitude, lng: data.location_coords.longitude } : undefined,
                         contactPhone: data.contact_phone, // Adjust field name
                         operatingHours: data.operating_hours, // Adjust field name
                         website: data.website,
                         inventory: data.inventory || {}, // Default to empty object
                         lastInventoryUpdate: data.last_inventory_update, // Keep as Timestamp
                         servicesOffered: data.services_offered || [], // Default to empty array
                         createdAt: data.created_at, // Keep as Timestamp
                         updatedAt: data.updated_at, // Keep as Timestamp
                     } as BloodBank // Type assertion
                 }) || [];
                setBloodBanks(fetchedBanks);
            } catch (err: any) {
                console.error("Error fetching blood banks:", err);
                 let message = "Failed to load blood bank data.";
                 if (err.code === 'permission-denied') message = "Database permission error.";
                 else if (err.code === 'unavailable') message = "Database temporarily unavailable.";
                 else if (err.message) message = err.message;
                setFetchError(message);
            } finally {
                setLoadingBanks(false);
            }
        };

        fetchBloodBanks();
    }, []); // Run once on mount


   // Filtered blood banks based on search query
   const filteredBloodBanks = React.useMemo(() => {
     if (!searchQuery) {
       return bloodBanks;
     }
     const lowerCaseQuery = searchQuery.toLowerCase();
     return bloodBanks.filter(bank =>
       bank.name.toLowerCase().includes(lowerCaseQuery) ||
       bank.location.toLowerCase().includes(lowerCaseQuery)
     );
   }, [searchQuery, bloodBanks]);

   // Request Form submission logic
    const handleRequestSubmit: SubmitHandler<RequestFormInputs> = async (data) => {
        if (!user || !userProfile || !db) { // Check Firebase services
            toast({ title: "Authentication Required", description: "Please log in to submit a blood request.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            const newRequestData: Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = { // Use 'any' for serverTimestamp placeholders
                requesterUid: user.uid,
                requesterName: `${userProfile.firstName} ${userProfile.lastName}`, // Use profile name
                patientName: data.patientName,
                requiredBloodGroup: data.requiredBloodGroup,
                unitsRequired: data.unitsRequired,
                unitsFulfilled: 0,
                urgency: data.urgency,
                hospitalName: data.hospitalName,
                hospitalLocation: data.hospitalLocation,
                contactPhone: data.contactPhone,
                additionalDetails: data.additionalDetails || null,
                status: 'Pending Verification' as RequestStatus, // Initial status
                 createdAt: serverTimestamp(), // Firestore server timestamp
                 updatedAt: serverTimestamp(), // Firestore server timestamp
            };

            const requestsCollectionRef = collection(db, 'blood_requests'); // Ensure collection name matches
            await addDoc(requestsCollectionRef, newRequestData);

            toast({ title: "Request Submitted Successfully", description: "Your blood request is pending verification." });
            resetForm();

        } catch (err: any) {
            console.error("Error submitting blood request:", err);
            let message = "Could not submit your request.";
            if (err.code === 'permission-denied') message = "Database permission error.";
            else if (err.message) message = err.message;
            toast({ title: "Submission Failed", description: message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };


  return (
    <div className="container mx-auto py-12 px-4 space-y-12">
      {/* Request Form Card */}
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Request Blood Donation</CardTitle>
          <CardDescription>Submit a request. Please provide accurate patient and requirement details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           {authLoading && (
               <div className="flex justify-center items-center py-4">
                   <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                   <p className="text-muted-foreground">Checking authentication...</p>
               </div>
           )}
           {!authLoading && !user && (
              <Alert variant="destructive">
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Login Required</AlertTitle>
                 <AlertDescription>
                    You must be logged in to submit a blood request. <Link href="/auth/login" className="font-bold underline">Login here</Link>.
                 </AlertDescription>
               </Alert>
           )}

          <form onSubmit={handleSubmit(handleRequestSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="patient-name">Patient's Full Name *</Label>
                <Input id="patient-name" {...register("patientName")} aria-invalid={errors.patientName ? "true" : "false"} disabled={!user || authLoading || isSubmitting}/>
                 {errors.patientName && <p className="text-sm text-destructive">{errors.patientName.message}</p>}
              </div>
              <div className="space-y-1">
                 <Label htmlFor="blood-type">Required Blood Type *</Label>
                  <Controller
                      name="requiredBloodGroup"
                      control={control}
                      render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!user || authLoading || isSubmitting}>
                              <SelectTrigger id="blood-type" aria-invalid={errors.requiredBloodGroup ? "true" : "false"}>
                                  <SelectValue placeholder="Select blood type" />
                              </SelectTrigger>
                              <SelectContent>
                                  {bloodTypes.map(type => (
                                     <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      )}
                  />
                   {errors.requiredBloodGroup && <p className="text-sm text-destructive">{errors.requiredBloodGroup.message}</p>}
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <Label htmlFor="units">Units Required *</Label>
                 <Input id="units" type="number" placeholder="e.g., 2" min="1" {...register("unitsRequired")} aria-invalid={errors.unitsRequired ? "true" : "false"} disabled={!user || authLoading || isSubmitting}/>
                 {errors.unitsRequired && <p className="text-sm text-destructive">{errors.unitsRequired.message}</p>}
               </div>
               <div className="space-y-1">
                  <Label htmlFor="urgency">Urgency *</Label>
                   <Controller
                       name="urgency"
                       control={control}
                       render={({ field }) => (
                           <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!user || authLoading || isSubmitting}>
                               <SelectTrigger id="urgency" aria-invalid={errors.urgency ? "true" : "false"}>
                                   <SelectValue placeholder="Select urgency level" />
                               </SelectTrigger>
                               <SelectContent>
                                   {urgencyLevels.map(level => (
                                        <SelectItem key={level} value={level}>{level}{level === 'Critical' ? ' (Urgent)' : ''}</SelectItem>
                                   ))}
                               </SelectContent>
                           </Select>
                       )}
                   />
                    {errors.urgency && <p className="text-sm text-destructive">{errors.urgency.message}</p>}
                 </div>
             </div>

            <div className="space-y-1">
              <Label htmlFor="hospitalName">Hospital/Clinic Name *</Label>
              <Input id="hospitalName" placeholder="Name of Hospital/Clinic" {...register("hospitalName")} aria-invalid={errors.hospitalName ? "true" : "false"} disabled={!user || authLoading || isSubmitting}/>
               {errors.hospitalName && <p className="text-sm text-destructive">{errors.hospitalName.message}</p>}
            </div>
             <div className="space-y-1">
               <Label htmlFor="hospitalLocation">Hospital/Clinic Location *</Label>
               <Input id="hospitalLocation" placeholder="Address or Area" {...register("hospitalLocation")} aria-invalid={errors.hospitalLocation ? "true" : "false"} disabled={!user || authLoading || isSubmitting}/>
               {errors.hospitalLocation && <p className="text-sm text-destructive">{errors.hospitalLocation.message}</p>}
             </div>
             <div className="space-y-1">
                <Label htmlFor="contactPhone">Contact Phone *</Label>
                <Input id="contactPhone" type="tel" placeholder="Contact number at location" {...register("contactPhone")} aria-invalid={errors.contactPhone ? "true" : "false"} disabled={!user || authLoading || isSubmitting}/>
                {errors.contactPhone && <p className="text-sm text-destructive">{errors.contactPhone.message}</p>}
             </div>


            <div className="space-y-1">
              <Label htmlFor="additionalDetails">Additional Details (Optional)</Label>
              <Textarea id="additionalDetails" placeholder="Provide any relevant context or specific instructions." {...register("additionalDetails")} disabled={!user || authLoading || isSubmitting}/>
            </div>

            <div className="flex items-start space-x-2 pt-2">
               <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0"/>
               <p className="text-sm text-muted-foreground">
                  Submitting a request does not guarantee fulfillment. We will notify potential donors based on compatibility and availability. Ensure all information is correct. Verification may be required.
               </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || authLoading || !user || !db}> {/* Disable if no db client or logged out */}
               {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
               {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Blood Bank Inventory Section */}
       <div className="max-w-4xl mx-auto">
           <h2 className="text-2xl font-bold text-center mb-2 text-primary">Blood Bank Inventory Levels</h2>
           <p className="text-center text-muted-foreground mb-6">Check current approximate stock levels at nearby centers.</p>

           <div className="mb-8 px-4 md:px-0">
               <Label htmlFor="bank-search" className="sr-only">Search Blood Banks</Label>
               <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                   <Input
                       id="bank-search"
                       type="search"
                       placeholder="Search by bank name or location..."
                       className="pl-10 w-full"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                   />
               </div>
           </div>

           {loadingBanks && (
               <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                   <p className="text-muted-foreground">Loading blood banks...</p>
               </div>
           )}

           {!loadingBanks && fetchError && (
               <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Error</AlertTitle>
                 <AlertDescription>{fetchError}</AlertDescription>
               </Alert>
           )}


           {!loadingBanks && !fetchError && (
               <>
                   {filteredBloodBanks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredBloodBanks.map((bank) => (
                         <Card key={bank.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
                           <CardHeader className="pb-4">
                             <CardTitle className="text-lg font-semibold flex items-center"><Banknote className="mr-2 h-5 w-5 text-primary"/>{bank.name}</CardTitle>
                             <CardDescription className="flex items-center text-sm"><MapPin className="mr-1 h-4 w-4"/>{bank.location}</CardDescription>
                           </CardHeader>
                           <CardContent className="flex-grow flex flex-col justify-between">
                             <div>
                               <h4 className="text-md font-medium mb-3 text-center">Inventory Overview</h4>
                               <div className="grid grid-cols-4 gap-2">
                                 {bloodTypes.map((type) => {
                                     const inventoryCount = bank.inventory?.[type];
                                     return (
                                         <div key={type} className="text-center">
                                             <Badge
                                                 variant="outline"
                                                 className={cn("w-full justify-center py-1 px-0.5 text-xs font-mono", getInventoryBadgeClass(inventoryCount))}
                                                 title={`${getInventoryLevelText(inventoryCount)} (${inventoryCount ?? 0} units)`}
                                             >
                                                 {type}
                                             </Badge>
                                             <span className="text-xs text-muted-foreground mt-1 block">{inventoryCount ?? 0}</span>
                                         </div>
                                     );
                                 })}
                               </div>
                             </div>
                             <div className="mt-4 text-center">
                               <Button variant="outline" size="sm" asChild>
                                 {/* Update link path */}
                                 <Link href={`/donate/banks/${bank.id}`}>
                                    <Eye className="mr-1 h-4 w-4"/> View Details
                                 </Link>
                               </Button>
                             </div>
                           </CardContent>
                         </Card>
                       ))}
                      </div>
                    ) : (
                         <p className="text-center text-muted-foreground mt-10">No blood banks found{searchQuery ? ' matching your search criteria' : ''}.</p>
                    )}

                   <div className="mt-8 flex justify-center space-x-4 text-sm flex-wrap gap-y-2">
                       <div className="flex items-center"><span className="h-3 w-3 rounded-full mr-1 border border-green-400 bg-green-100"></span> High Availability</div>
                       <div className="flex items-center"><span className="h-3 w-3 rounded-full mr-1 border border-yellow-400 bg-yellow-100"></span> Moderate</div>
                       <div className="flex items-center"><span className="h-3 w-3 rounded-full mr-1 border border-orange-400 bg-orange-100"></span> Low</div>
                       <div className="flex items-center"><span className="h-3 w-3 rounded-full mr-1 border border-red-400 bg-red-100"></span> Critical</div>
                   </div>
               </>
           )}
       </div>

       <Separator />

       {/* Blood Compatibility Chart Section */}
       <BloodCompatibilityChart />

    </div>
  );
}
