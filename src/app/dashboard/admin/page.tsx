
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Droplets, Target, Activity, Settings, PenSquare, Trash2, Loader2, AlertCircle, Eye, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Use Firebase auth hook
import { db } from '@/lib/firebase/client'; // Import Firestore instance
import { collection, getDocs, query, where, orderBy, limit, doc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/types/user';
import type { BloodRequest } from '@/types/blood-request';
import type { Campaign } from '@/types/campaign'; // Add campaign type
import { format, isValid } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


// --- Component ---
export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, userProfile, isAdmin, loading: authLoading, error: authError } = useAuth();

  const [stats, setStats] = React.useState({ totalUsers: 0, activeDonors: 0, bloodRequests: 0, activeCampaigns: 0 });
  const [recentUsers, setRecentUsers] = React.useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = React.useState<BloodRequest[]>([]);
  const [loadingData, setLoadingData] = React.useState(true); // Start true until data is loaded or admin check fails
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Check admin status and fetch data
  React.useEffect(() => {
    let isMounted = true;
    if (!authLoading && !user) {
        console.log("AdminDashboard: No user logged in. Redirecting.");
        if (isMounted) router.replace('/auth/login?reason=unauthorized_admin');
        if (isMounted) setLoadingData(false);
        return;
    }

     if (authLoading) {
         console.log("AdminDashboard: Auth loading, waiting...");
         if (isMounted) setLoadingData(true); // Keep loading while auth is resolving
         return;
     }

     // Handle auth errors after loading completes
     if (authError) {
        console.error("AdminDashboard: Auth error detected:", authError);
        if (isMounted) {
            setFetchError(`Authentication error: ${authError.message}`); // Use authError to display issue
            setLoadingData(false);
        }
        return;
     }

    // User is logged in, check if admin
    if (user && !isAdmin) {
        console.log("AdminDashboard: User is not admin. Redirecting.");
         if (isMounted) {
             // Redirect non-admins or show access denied message
             // For now, just stop loading and let the render logic below handle it
              setLoadingData(false); // Stop loading, render logic will show access denied
              setFetchError("Access Denied: You do not have permission to view this page."); // Set specific error
         }
        return;
    }

    // User is logged in and is an admin
    if (user && isAdmin) {
        console.log("AdminDashboard: User is admin. Fetching data...");
        if (isMounted) {
            fetchData();
        }
    }

     return () => { isMounted = false; }; // Cleanup mounted flag
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, isAdmin, router, authError]); // Added authError to dependencies


    // Format date safely
    const formatDateSafe = (dateInput: Timestamp | Date | null | undefined): string => {
        if (!dateInput) return 'N/A';
        try {
            // Convert Firebase Timestamp to JS Date if necessary
            const date = dateInput instanceof Timestamp ? dateInput.toDate() : dateInput;
            // Check for valid Date object and non-NaN time
            if (date instanceof Date && !isNaN(date.getTime())) {
                 return format(date, 'PP'); // Format like 'Jul 31, 2024'
             }
             return 'Invalid Date';
        } catch (e) {
            console.error("Error formatting date:", e, "Input:", dateInput);
            return 'Invalid Date';
        }
    };

   // Fetch dashboard data (called only if isAdmin is true)
    const fetchData = React.useCallback(async () => {
        if (!db) {
             console.error("AdminDashboard: Firestore instance (db) is not available.");
             setFetchError("Database connection unavailable.");
             setLoadingData(false);
             return;
        }
        console.log("AdminDashboard: Fetching admin data from Firestore...");
        setLoadingData(true); // Ensure loading state is active
        setFetchError(null);
        try {
             // --- Fetch Users (count and recent) ---
             const usersCollectionRef = collection(db, 'users');
             const usersSnapshot = await getDocs(usersCollectionRef);
             const totalUsers = usersSnapshot.size;

             const donorsQuery = query(
                 usersCollectionRef,
                 where('role', '==', 'donor'),
                 where('isEligible', '==', true)
             );
             const donorsSnapshot = await getDocs(donorsQuery);
             const activeDonors = donorsSnapshot.size;

              const recentUsersQuery = query(
                 usersCollectionRef,
                 orderBy('createdAt', 'desc'),
                 limit(5)
             );
             const recentUsersSnapshot = await getDocs(recentUsersQuery);
             const fetchedRecentUsers = recentUsersSnapshot.docs.map(doc => ({
                  ...(doc.data() as Omit<UserProfile, 'uid'>), // Get data
                  uid: doc.id, // Use doc ID as uid
             } as UserProfile)) || [];
             setRecentUsers(fetchedRecentUsers);


             // --- Fetch Blood Requests (count and pending) ---
              const requestsCollectionRef = collection(db, 'blood_requests');
              const activeRequestStatuses: BloodRequest['status'][] = ['Pending Verification', 'Active', 'Partially Fulfilled']; // Added 'Pending Verification'
              const activeRequestsQuery = query(
                 requestsCollectionRef,
                 where('status', 'in', activeRequestStatuses)
              );
              const activeRequestsSnapshot = await getDocs(activeRequestsQuery);
              const bloodRequestsCount = activeRequestsSnapshot.size;

              const pendingStatuses: BloodRequest['status'][] = ['Pending Verification']; // Only show pending verification
              const pendingRequestsQuery = query(
                 requestsCollectionRef,
                 where('status', 'in', pendingStatuses),
                 orderBy('createdAt', 'asc'), // Show oldest pending first
                 limit(5)
              );
              const pendingRequestsSnapshot = await getDocs(pendingRequestsQuery);
               const fetchedPendingRequests = pendingRequestsSnapshot.docs.map(doc => ({
                   id: doc.id,
                   ...(doc.data() as Omit<BloodRequest, 'id' | 'createdAt' | 'updatedAt'>), // Cast data
                    // Safely convert Timestamps, default to null if invalid
                    createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : null,
                    updatedAt: doc.data().updatedAt instanceof Timestamp ? doc.data().updatedAt.toDate() : null,
               } as BloodRequest)) || []; // Ensure correct type casting
              setPendingRequests(fetchedPendingRequests);


             // --- Fetch Active Campaigns (count) ---
             let activeCampaigns = 0;
              try {
                 const campaignsCollectionRef = collection(db, 'campaigns');
                 const activeCampaignsQuery = query(campaignsCollectionRef, where('status', '==', 'Ongoing'));
                 const activeCampaignsSnapshot = await getDocs(activeCampaignsQuery);
                 activeCampaigns = activeCampaignsSnapshot.size;
              } catch (campaignError: any) {
                  console.warn("AdminDashboard: Could not fetch campaign count. Collection might not exist yet.", campaignError.message);
              }


              setStats({ totalUsers, activeDonors, bloodRequests: bloodRequestsCount, activeCampaigns });
              console.log("AdminDashboard: Firestore data fetched successfully.");

        } catch (err: any) {
          console.error("Error fetching admin dashboard data from Firestore:", err);
           setFetchError("Failed to load dashboard data. Please check Firestore rules or connection.");
        } finally {
          setLoadingData(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Removed db dependency, assuming it's stable


  // --- Action Handlers ---
  const handleApproveRequest = async (requestId: string) => {
       if (!db || !requestId) return;
       setActionLoading(`approve-${requestId}`);
       try {
           const requestDocRef = doc(db, 'blood_requests', requestId);
           await updateDoc(requestDocRef, {
               status: 'Active',
               updatedAt: serverTimestamp() // Use server timestamp
           });
           toast({ title: "Request Approved", description: "The blood request is now active." });
           fetchData(); // Refresh data
       } catch (err: any) {
           console.error("Error approving request:", err);
           toast({ title: "Approval Failed", description: err.message || "Could not approve the request.", variant: "destructive" });
       } finally {
           setActionLoading(null);
       }
   };

   const handleRejectRequest = async (requestId: string) => {
      if (!db || !requestId) return;
      setActionLoading(`reject-${requestId}`);
      try {
           const requestDocRef = doc(db, 'blood_requests', requestId);
            await updateDoc(requestDocRef, {
                status: 'Cancelled', // Or 'Rejected' if you add that status
                updatedAt: serverTimestamp() // Use server timestamp
            });
          toast({ title: "Request Rejected", description: "The blood request has been cancelled." });
          fetchData(); // Refresh data
      } catch (err: any) {
          console.error("Error rejecting request:", err);
          toast({ title: "Rejection Failed", description: err.message || "Could not reject the request.", variant: "destructive" });
      } finally {
           setActionLoading(null);
      }
   };

   const handleDeleteUser = async (userId: string) => {
        if (!db || !userId) return;
        setActionLoading(`delete-user-${userId}`);
        console.warn("Attempting to delete user profile and related data from Firestore. Auth record deletion requires Admin SDK (run server-side).");

        // TODO: Implement more robust deletion, potentially using Cloud Functions
        // This example only deletes the user profile document.
        // Consider deleting related requests, donations, etc. in a transaction or function.

        try {
            const userDocRef = doc(db, 'users', userId);
            await deleteDoc(userDocRef);

            // Placeholder: Ideally trigger a Cloud Function to delete Auth user and other related data
            // await callCloudFunctionToDeleteUser(userId);

            toast({ title: "User Profile Deleted", description: "Profile removed from Firestore. Auth record needs separate deletion (Admin SDK)." });
            fetchData(); // Refresh data
        } catch (err: any) {
            console.error("Error deleting user profile:", err);
            toast({ title: "Profile Deletion Failed", description: err.message || "Could not delete user profile.", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
   }

  // --- Render Logic ---
  if (authLoading || loadingData) { // Show loading if either auth or data is loading
    const message = authLoading ? "Checking permissions..." : "Loading admin data...";
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
         <p className="ml-4 text-muted-foreground">{message}</p>
      </div>
    );
  }

    // Handle auth errors or access denied errors specifically
     if (fetchError) {
         return (
             <div className="container mx-auto py-12 px-4 text-center">
                 <Alert variant="destructive" className="max-w-md mx-auto">
                     <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{fetchError.startsWith("Access Denied") ? "Access Denied" : "Error"}</AlertTitle>
                     <AlertDescription>{fetchError}</AlertDescription>
                      <div className="mt-4 space-x-2">
                         {fetchError.startsWith("Access Denied") ? (
                              <Link href="/dashboard"><Button variant="outline">Go to User Dashboard</Button></Link>
                         ) : (
                              <Button onClick={fetchData} variant="secondary" disabled={!db}>Retry</Button>
                         )}
                         <Link href="/"><Button variant="outline">Go Home</Button></Link>
                          {authError && <Link href="/auth/login"><Button>Login Again</Button></Link>}
                     </div>
                 </Alert>
             </div>
         );
     }


  // Render actual admin dashboard content only if admin and no errors
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {/* Stat Cards */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
         <Card className="shadow-md">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Eligible Donors</CardTitle>
             <Droplets className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.activeDonors}</div>
              <p className="text-xs text-muted-foreground">Currently eligible to donate</p>
           </CardContent>
         </Card>
         <Card className="shadow-md">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Active Blood Requests</CardTitle>
             <Activity className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.bloodRequests}</div>
              <p className="text-xs text-muted-foreground">Active or Partially Fulfilled</p>
           </CardContent>
         </Card>
         <Card className="shadow-md">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Ongoing Campaigns</CardTitle>
             <Target className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
              <p className="text-xs text-muted-foreground">Currently running campaigns</p>
           </CardContent>
         </Card>
      </div>

       {/* Management Sections */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* User Management Table */}
          <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5"/>User Management</CardTitle>
               <CardDescription>View recent users. Manage roles or delete users.</CardDescription>
             </CardHeader>
             <CardContent>
                 {recentUsers.length > 0 ? (
                     <Table>
                       <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {recentUsers.map(u => (
                             <TableRow key={u.uid}>
                                <TableCell className="font-medium">{u.firstName} {u.lastName}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell><Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'} className="capitalize">{u.role}</Badge></TableCell>
                                <TableCell className="text-right space-x-1">
                                   <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                                      <PenSquare className="h-4 w-4" />
                                      <span className="sr-only">Edit User (Not Implemented)</span>
                                   </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" disabled={actionLoading === `delete-user-${u.uid}`}>
                                            {actionLoading === `delete-user-${u.uid}` ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                             <span className="sr-only">Delete User Profile</span>
                                          </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                         <AlertDialogHeader>
                                           <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                           <AlertDialogDescription>
                                             This action will attempt to delete the user's profile from Firestore. Deleting their authentication record requires server-side action (e.g., using Firebase Admin SDK in a Cloud Function) and is not performed here. This cannot be undone.
                                           </AlertDialogDescription>
                                         </AlertDialogHeader>
                                         <AlertDialogFooter>
                                           <AlertDialogCancel>Cancel</AlertDialogCancel>
                                           <AlertDialogAction onClick={() => handleDeleteUser(u.uid)} className="bg-destructive hover:bg-destructive/90">
                                             Delete User Profile
                                           </AlertDialogAction>
                                         </AlertDialogFooter>
                                       </AlertDialogContent>
                                    </AlertDialog>

                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                     </Table>
                 ) : (
                    <p className="text-muted-foreground text-center py-4">No recent users found.</p>
                 )}
                 <div className="mt-4 text-center">
                     <Button variant="outline" size="sm" asChild disabled>
                       <Link href="/admin/users">View All Users</Link>
                    </Button>
                 </div>
             </CardContent>
          </Card>

          {/* Blood Request Management Table */}
          <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center"><Activity className="mr-2 h-5 w-5"/>Blood Request Verification</CardTitle>
               <CardDescription>Review and manage pending blood requests.</CardDescription>
             </CardHeader>
             <CardContent>
                  {pendingRequests.length > 0 ? (
                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead>Patient</TableHead>
                              <TableHead>Blood Type</TableHead>
                               <TableHead>Urgency</TableHead>
                               <TableHead>Requested</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {pendingRequests.map(req => (
                               <TableRow key={req.id}>
                                  <TableCell className="font-medium">{req.patientName}</TableCell>
                                  <TableCell><Badge variant="secondary">{req.requiredBloodGroup}</Badge></TableCell>
                                   <TableCell><Badge variant={req.urgency === 'Critical' ? 'destructive' : req.urgency === 'High' ? 'default' : 'outline'} className="capitalize">{req.urgency}</Badge></TableCell>
                                  <TableCell>{formatDateSafe(req.createdAt)}</TableCell>
                                  <TableCell className="text-right space-x-1">
                                     <Button variant="outline" size="sm" className="h-7 px-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={() => handleApproveRequest(req.id!)} disabled={actionLoading === `approve-${req.id}`}>
                                         {actionLoading === `approve-${req.id}` ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Check className="h-3 w-3 mr-1"/>} Approve
                                      </Button>
                                       <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                              <Button variant="destructive" size="sm" className="h-7 px-2" disabled={actionLoading === `reject-${req.id}`}>
                                                   {actionLoading === `reject-${req.id}` ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Trash2 className="h-3 w-3 mr-1"/>} Reject
                                               </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                             <AlertDialogHeader>
                                                <AlertDialogTitle>Reject Request?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                   Are you sure you want to reject this blood request for {req.patientName} ({req.requiredBloodGroup})? This will change its status to 'Cancelled'.
                                                </AlertDialogDescription>
                                             </AlertDialogHeader>
                                             <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleRejectRequest(req.id!)} className="bg-destructive hover:bg-destructive/90">
                                                  Reject Request
                                                </AlertDialogAction>
                                             </AlertDialogFooter>
                                           </AlertDialogContent>
                                       </AlertDialog>
                                        {/* Add View Details Button/Link */}
                                       <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View Request Details</span>
                                        </Button>
                                  </TableCell>
                               </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                 ) : (
                      <p className="text-muted-foreground text-center py-4">No requests pending verification.</p>
                 )}
                 <div className="mt-4 text-center">
                     <Button variant="outline" size="sm" asChild disabled>
                       <Link href="/admin/requests">View All Requests</Link>
                    </Button>
                 </div>
             </CardContent>
          </Card>

          {/* Campaign Management Placeholder */}
           <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center"><Target className="mr-2 h-5 w-5"/>Campaign Management</CardTitle>
               <CardDescription>Create, edit, and monitor donation campaigns.</CardDescription>
             </CardHeader>
             <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">Campaign management tools coming soon.</p>
                <Button variant="default" size="sm" asChild disabled>
                     <Link href="/admin/campaigns/new">Create New Campaign</Link>
                 </Button>
                 <Button variant="outline" size="sm" asChild disabled>
                     <Link href="/admin/campaigns">Manage Campaigns</Link>
                 </Button>
             </CardContent>
           </Card>


            {/* Site Settings / Other Tools Placeholder */}
           <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5"/>Site Settings & Tools</CardTitle>
               <CardDescription>Manage global settings, content, and other administrative functions.</CardDescription>
             </CardHeader>
             <CardContent className="text-center space-y-4">
                 <p className="text-muted-foreground">Links to content management, analytics, system health, etc. (Coming Soon)</p>
                  <Button variant="outline" size="sm" asChild disabled>
                     <Link href="/admin/settings">Go to Settings</Link>
                  </Button>
             </CardContent>
           </Card>

       </div>
    </div>
  );
}
