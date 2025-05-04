
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, User, Settings, Loader2, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";
import { db } from '@/lib/firebase/client'; // Import Firestore instance
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth'; // Use the Firebase auth hook
import { useRouter } from 'next/navigation';
import type { BloodRequest, RequestStatus } from '@/types/blood-request';
import type { DonationRecord } from '@/types/donation';
import { format, isValid } from 'date-fns'; // Import isValid
import type { UserProfile } from '@/types/user'; // Import UserProfile type
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components

// --- Component ---
export default function UserDashboardPage() {
    const router = useRouter();
    const { user, userProfile, loading: authLoading, error: authError } = useAuth(); // Get data from hook

    const [activeRequests, setActiveRequests] = React.useState<BloodRequest[]>([]);
    const [donationHistory, setDonationHistory] = React.useState<DonationRecord[]>([]);
    const [loadingData, setLoadingData] = React.useState(true); // Start true
    const [fetchError, setFetchError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let isMounted = true;

        const checkUserAndFetchData = async () => {
            console.log(`UserDashboard: Effect run. AuthLoading: ${authLoading}, User: ${!!user}, UserProfile: ${!!userProfile}`);

            if (authLoading) {
                 console.log("UserDashboard: Auth still loading...");
                setLoadingData(true); // Ensure data loading reflects auth loading
                return; // Wait for auth to finish
            }

             // Handle auth error first
             if (authError) {
                 console.error("UserDashboard: Auth error detected.", authError);
                 setLoadingData(false);
                 setFetchError(`Authentication error: ${authError.message}`);
                 return;
             }

            if (!user) {
                 console.log("UserDashboard: No user found after auth check. Redirecting to login.");
                 setLoadingData(false); // Stop loading if no user
                 if (isMounted) router.replace('/auth/login?reason=dashboard_unauth_direct');
                return;
            }

            // Now check for profile after confirming user exists and no auth error
            if (!userProfile) {
                  console.warn("UserDashboard: User is authenticated, but profile data is not yet available. Possible fetch issue.");
                  setLoadingData(false); // Stop loading
                  // Error is likely related to profile fetching, which should be reflected in authError
                  setFetchError(authError?.message || "Failed to load profile data. Please try refreshing.");
                  return;
            }

            // --- If user and profile are available, fetch dashboard data ---
            console.log(`UserDashboard: User authenticated (UID: ${user.uid}) and profile loaded. Fetching dashboard data...`);
            setLoadingData(true);
            setFetchError(null);
            setActiveRequests([]);
            setDonationHistory([]);

            try {
                 if (!db) throw new Error("Firestore database instance is not available.");

                // Fetch Active Blood Requests
                const activeStatuses: RequestStatus[] = ['Pending Verification', 'Active', 'Partially Fulfilled']; // Statuses to show
                const requestsQuery = query(
                    collection(db, 'blood_requests'),
                    where('requesterUid', '==', user.uid),
                    where('status', 'in', activeStatuses),
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );
                const requestsSnapshot = await getDocs(requestsQuery);
                 const fetchedRequests = requestsSnapshot.docs.map(doc => ({
                     id: doc.id,
                     ...(doc.data() as Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt'>),
                     // Safely convert Timestamps, default to null if invalid
                     createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : null,
                     updatedAt: doc.data().updatedAt instanceof Timestamp ? doc.data().updatedAt.toDate() : null,
                 } as BloodRequest)); // Ensure correct type casting
                 if (isMounted) setActiveRequests(fetchedRequests);


                // Fetch Donation History (only if user is a donor)
                if (userProfile.role === 'donor') {
                     console.log("UserDashboard: User is a donor, fetching donation history...");
                     const donationsQuery = query(
                         collection(db, 'donations'), // Ensure collection name matches your Firestore setup
                         where('donorUid', '==', user.uid),
                         orderBy('donationDate', 'desc'),
                         limit(5)
                     );
                     const donationsSnapshot = await getDocs(donationsQuery);
                     const fetchedDonations = donationsSnapshot.docs.map(doc => ({
                         id: doc.id,
                         ...(doc.data() as Omit<DonationRecord, 'id' | 'donationDate' | 'createdAt'>),
                          donationDate: doc.data().donationDate instanceof Timestamp ? doc.data().donationDate.toDate() : null,
                          createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : null,
                     } as DonationRecord)); // Ensure correct type casting
                      if (isMounted) setDonationHistory(fetchedDonations);
                      console.log(`UserDashboard: Fetched ${fetchedDonations.length} donation records.`);
                 } else {
                      console.log("UserDashboard: User is not a donor, skipping donation history fetch.");
                 }
                 console.log("UserDashboard: Dashboard data fetched successfully.");

            } catch (err: any) {
                 console.error("User Dashboard: Error fetching dashboard data:", err);
                 if (isMounted) {
                      setFetchError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
                 }
            } finally {
                if (isMounted) {
                     console.log("UserDashboard: Finished fetching data, setting loadingData to false.");
                     setLoadingData(false);
                }
            }
        };

        checkUserAndFetchData();

        return () => {
            isMounted = false;
             console.log("UserDashboard: Unmounting component.");
        };
    // Depend on auth states AND profile to refetch when auth state changes
    }, [authLoading, user, userProfile, authError, router]); // Removed db from dependencies as it's stable


    // Format date function (robustly handles null/undefined/invalid dates)
     const formatDateSafe = (date: Date | Timestamp | null | undefined): string => {
       if (!date) return 'N/A';
       try {
         const dateObj = date instanceof Timestamp ? date.toDate() : date;
         // Additional check for valid Date object
         if (dateObj instanceof Date && isValid(dateObj) && !isNaN(dateObj.getTime())) {
           return format(dateObj, 'PP'); // Format as 'Mar 15, 2024'
         }
         return 'Invalid Date';
       } catch (e) {
         console.error("Error formatting date:", e, "Input:", date);
         return 'Invalid Date';
       }
     };


    // --- Render Logic ---
    if (authLoading || loadingData) { // Combine loading states
        const message = authLoading ? "Checking authentication..." : "Loading dashboard data...";
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">{message}</p>
            </div>
        );
    }

     // If auth check finished but user is null (redirect likely happened, but good fallback)
     if (!user) {
         // This case should ideally be handled by redirection, but provides a fallback message.
          return (
             <div className="container mx-auto py-12 px-4 text-center">
                  <Alert variant="destructive" className="max-w-md mx-auto">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Not Logged In</AlertTitle>
                      <AlertDescription>You need to be logged in to view the dashboard.</AlertDescription>
                       <Link href="/auth/login"><Button className="mt-4">Go to Login</Button></Link>
                  </Alert>
              </div>
          );
     }

     // Handle Auth Errors or Data Fetch Errors
     const currentError = fetchError; // Prioritize fetchError if it exists
     if (currentError) {
         return (
             <div className="container mx-auto py-12 px-4 text-center">
                 <Alert variant="destructive" className="max-w-md mx-auto">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>Error Loading Dashboard</AlertTitle>
                      <AlertDescription>{String(currentError || "An unknown error occurred.")}</AlertDescription>
                      <div className="mt-4 space-x-2">
                          {fetchError && <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>}
                           <Link href="/profile"><Button variant="outline">View Profile</Button></Link>
                           <Link href="/"><Button variant="outline">Go Home</Button></Link>
                           {authError && <Link href="/auth/login"><Button>Login Again</Button></Link>}
                      </div>
                 </Alert>
             </div>
         );
     }

      // Handle case where user exists but profile hasn't loaded (should be covered by above error check now)
      if (!userProfile) {
           return (
               <div className="container mx-auto py-12 px-4 text-center">
                  <Alert variant="destructive" className="max-w-md mx-auto">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Profile Error</AlertTitle>
                      <AlertDescription>Could not load your profile data. Please try refreshing the page or contact support if the issue persists.</AlertDescription>
                       <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 mr-2">Refresh</Button>
                       {/* Add a logout button here if needed */}
                       {/* <Button variant="destructive" className="mt-4" onClick={handleLogout}>Log Out</Button> */}
                  </Alert>
              </div>
           );
      }


    // Render dashboard content
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-primary">Welcome, {userProfile?.firstName || user?.email || 'User'}!</h1>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild variant="outline" size="lg">
                    <Link href="/request">
                        <PlusCircle className="mr-2 h-5 w-5" /> Request Blood
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="/donate">
                        <PlusCircle className="mr-2 h-5 w-5" /> Find Donation Center
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="/profile">
                        <User className="mr-2 h-5 w-5" /> View Profile
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link href="/profile/settings">
                        <Settings className="mr-2 h-5 w-5" /> Account Settings
                    </Link>
                </Button>
            </div>


            {/* Active Blood Requests Table */}
            <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>My Active Blood Requests</CardTitle>
                        <CardDescription>Requests you have submitted that are currently active or pending verification.</CardDescription>
                    </div>
                    <Button asChild size="sm">
                        <Link href="/request">
                            <PlusCircle className="mr-1 h-4 w-4" /> New Request
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {activeRequests.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Blood Type</TableHead>
                                    <TableHead>Units (Req/Ful)</TableHead>
                                    <TableHead>Hospital</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Requested On</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.patientName}</TableCell>
                                        <TableCell><Badge variant="secondary">{req.requiredBloodGroup}</Badge></TableCell>
                                        <TableCell>{req.unitsRequired}/{req.unitsFulfilled}</TableCell>
                                        <TableCell>{req.hospitalName}</TableCell>
                                        <TableCell>
                                             <Badge variant={
                                                req.status === 'Pending Verification' ? 'outline' :
                                                req.status === 'Active' ? 'default' :
                                                req.status === 'Partially Fulfilled' ? 'secondary' :
                                                        'outline' // Default or other statuses
                                            }
                                                className={
                                                    req.status === 'Pending Verification' ? 'text-amber-600 border-amber-600' :
                                                    req.status === 'Active' ? 'bg-green-100 text-green-800 border-green-300' :
                                                    req.status === 'Partially Fulfilled' ? 'text-blue-600 border-blue-600' : ''
                                                }>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatDateSafe(req.createdAt)}</TableCell>
                                        <TableCell>
                                            <Button variant="link" size="sm" className="h-auto p-0" asChild disabled>
                                                {/* Link to a future detailed request view page */}
                                                <Link href={`/request/${req.id}`}> <Eye className="mr-1 h-4 w-4"/>View</Link>
                                            </Button>
                                            {/* Add Edit/Cancel actions based on status */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">You have no active blood requests.</p>
                    )}
                     <div className="mt-4 text-center">
                         <Button variant="outline" size="sm" asChild disabled>
                           <Link href="/requests/history">View All Requests</Link> {/* Link to future history page */}
                        </Button>
                     </div>
                </CardContent>
            </Card>

            {/* Donation History Table */}
             {userProfile?.role === 'donor' && (
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>My Recent Donation History</CardTitle>
                    <CardDescription>A summary of your recent donations recorded on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    {donationHistory.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Location / Campaign</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {donationHistory.map((don) => (
                                    <TableRow key={don.id}>
                                        <TableCell>{formatDateSafe(don.donationDate)}</TableCell>
                                        <TableCell>{don.locationName}</TableCell>
                                        <TableCell>{don.donationType}</TableCell>
                                        <TableCell>
                                            <Button variant="link" size="sm" className="h-auto p-0" asChild disabled>
                                                {/* Link to a future detailed donation view page */}
                                                <Link href={`/donations/${don.id}`}> <Eye className="mr-1 h-4 w-4"/>Details</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No recent donation history found. Start donating today!</p>
                    )}
                    <div className="text-center mt-6">
                        <Button variant="outline" asChild disabled>
                            <Link href="/profile/donations">View Full Donation History</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
             )}

        </div>
    );
}
