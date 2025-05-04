
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth'; // Use the Firebase auth hook
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, isValid } from 'date-fns'; // Import isValid
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import type { UserProfile } from '@/types/user'; // Import UserProfile type
import { Timestamp } from 'firebase/firestore'; // Import Timestamp type


export default function ProfilePage() {
    const { user, userProfile, loading, error } = useAuth(); // Use the hook
    const router = useRouter();

     // --- Render Logic ---
     if (loading) {
         return (
             <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <Loader2 className="h-16 w-16 animate-spin text-primary" />
             </div>
         );
     }

     if (!user) {
          // If not loading and no user, redirect to login
           React.useEffect(() => {
                router.replace('/auth/login?reason=unauthenticated_profile');
           }, [router]);
         return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                 <p>Redirecting to login...</p>
             </div>
         ); // Render nothing while redirecting
     }

     if (error || !userProfile) {
          const errorMessage = error?.message || "User profile data could not be loaded.";
         return (
             <div className="container mx-auto py-12 px-4 text-center">
                 <Alert variant="destructive" className="max-w-md mx-auto">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>Error Loading Profile</AlertTitle>
                     <AlertDescription>{errorMessage} Please try logging in again or contact support.</AlertDescription>
                      {/* Provide relevant actions */}
                     <Link href="/dashboard"><Button variant="outline" className="mt-4 mr-2">Go to Dashboard</Button></Link>
                     <Link href="/auth/login"><Button variant="outline" className="mt-4">Go to Login</Button></Link>
                 </Alert>
             </div>
         );
     }

    // Display profile data
    const getInitials = (firstName?: string, lastName?: string): string => {
        const firstInitial = firstName ? firstName[0] : '';
        const lastInitial = lastName ? lastName[0] : '';
        return `${firstInitial}${lastInitial}`.toUpperCase() || 'U'; // Default to 'U' if no names
    }

    // Format date function (robustly handles null/undefined/invalid dates including Firestore Timestamps)
     const formatDateSafe = (date: Date | Timestamp | null | undefined): string => {
       if (!date) return 'Not Set';
       try {
          // Convert Firebase Timestamp to JS Date if necessary
          const dateObj = date instanceof Timestamp ? date.toDate() : date;

          // Check if it's a valid Date object before formatting
          if (dateObj instanceof Date && isValid(dateObj) && !isNaN(dateObj.getTime())) {
             return format(dateObj, 'PPP'); // Format as 'Mar 15, 2024'
          }
          console.warn("Invalid date encountered in formatDateSafe:", date);
          return 'Invalid Date';
       } catch (e) {
         console.error("Error formatting date:", e, "Input:", date);
         return 'Invalid Date';
       }
     };


    return (
        <div className="container mx-auto py-12 px-4">
            <Card className="max-w-2xl mx-auto shadow-lg">
                <CardHeader className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 pb-4">
                    <Avatar className="h-20 w-20">
                        {/* Use user?.photoURL if available from Firebase Auth */}
                        <AvatarImage src={user?.photoURL ?? undefined} alt={userProfile.firstName} data-ai-hint="person avatar" />
                        <AvatarFallback className="text-2xl">{getInitials(userProfile.firstName, userProfile.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center sm:text-left">
                        <CardTitle className="text-2xl">{userProfile.firstName} {userProfile.lastName}</CardTitle>
                        <CardDescription>{userProfile.email}</CardDescription>
                        <CardDescription>Role: <span className="capitalize font-medium">{userProfile.role}</span></CardDescription>
                    </div>
                    <Button variant="outline" size="icon" asChild>
                         <Link href="/profile/settings">
                             <Edit className="h-4 w-4" />
                             <span className="sr-only">Edit Profile</span>
                         </Link>
                    </Button>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-6">
                    <h3 className="text-lg font-semibold text-primary">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Blood Type</p>
                            <p className="text-lg font-semibold">{userProfile.bloodGroup || 'Not Set'}</p>
                        </div>
                         <div>
                             <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                             <p className="text-lg font-semibold">{userProfile.phone || 'Not Set'}</p>
                         </div>
                         <div>
                             <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                             <p className="text-lg font-semibold">{formatDateSafe(userProfile.dob)}</p>
                         </div>
                        <div>
                             <p className="text-sm font-medium text-muted-foreground">Gender</p>
                             <p className="text-lg font-semibold">{userProfile.gender || 'Not Set'}</p>
                         </div>

                    </div>

                    {/* Donor Specific Section */}
                    {userProfile.role === 'donor' && (
                        <>
                            <Separator />
                            <h3 className="text-lg font-semibold text-primary">Donation Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Donations</p>
                                    <p className="text-lg font-semibold">{userProfile.totalDonations ?? 0}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Last Donation Date</p>
                                    <p className="text-lg font-semibold">
                                         {formatDateSafe(userProfile.lastDonationDate)}
                                    </p>
                                </div>
                                 <div>
                                     <p className="text-sm font-medium text-muted-foreground">Current Eligibility</p>
                                      {/* Implement dynamic eligibility check logic here if needed */}
                                     <p className={`text-lg font-semibold ${userProfile.isEligible ? 'text-green-600' : 'text-amber-600'}`}>
                                         {userProfile.isEligible ? 'Eligible' : 'Check Details'}
                                     </p>
                                 </div>
                                 <div>
                                      <p className="text-sm font-medium text-muted-foreground">Next Eligible Date</p>
                                       <p className="text-lg font-semibold">
                                         {formatDateSafe(userProfile.nextEligibleDate) === 'Not Set' && userProfile.isEligible ? 'Eligible Now' : formatDateSafe(userProfile.nextEligibleDate)}
                                      </p>
                                  </div>
                                   <div className="md:col-span-2">
                                       <p className="text-sm font-medium text-muted-foreground">Medical Conditions Noted</p>
                                       <p className="text-md text-muted-foreground mt-1">
                                           {userProfile.medicalConditions || 'None specified'}
                                       </p>
                                   </div>
                            </div>
                        </>
                    )}

                    {/* TODO: Add Donation History / Request History Sections (fetch separately if needed) */}
                     <Separator />
                    <div className="text-center text-muted-foreground py-6">
                        <p>Detailed donation and request history coming soon.</p>
                         <Button variant="outline" size="sm" asChild className="mt-2">
                             <Link href="/dashboard">Go to Dashboard</Link>
                         </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
