
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Bell, ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from '@/hooks/useAuth'; // Use the Firebase auth hook
import { auth, db } from '@/lib/firebase/client'; // Import Firebase instances
import { updatePassword, type AuthError, type User as FirebaseUser } from 'firebase/auth'; // Import Firebase User type
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
// Removed Supabase User type: import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/user'; // Import UserProfile type

// --- Zod Schemas ---
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal('')),
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, "New password must be at least 8 characters") // Kept 8 for consistency, Firebase min is 6
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain a special character"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormInputs = z.infer<typeof passwordSchema>;


// --- Component ---
export default function SettingsPage() {
    const { user, userProfile, loading: authLoading, error: authError } = useAuth(); // Use the Firebase hook
    const router = useRouter();
    const { toast } = useToast();

    const [profileLoading, setProfileLoading] = React.useState(false);
    const [profileError, setProfileError] = React.useState<string | null>(null);
    const [passwordLoading, setPasswordLoading] = React.useState(false);
    const [passwordError, setPasswordError] = React.useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = React.useState(false);

    const profileForm = useForm<ProfileFormInputs>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
        }
    });

    const passwordForm = useForm<PasswordFormInputs>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        }
    });

     // Effect to populate form once userProfile is loaded
     React.useEffect(() => {
         if (userProfile) {
             profileForm.reset({
                 firstName: userProfile.firstName || '',
                 lastName: userProfile.lastName || '',
                 phone: userProfile.phone || '',
             });
         }
     }, [userProfile, profileForm]);


  // --- Form Submission Handlers ---
  const onProfileSubmit: SubmitHandler<ProfileFormInputs> = async (data) => {
    if (!user || !db) {
        toast({ title: "Update Failed", description: "User not logged in or database unavailable.", variant: "destructive"});
        return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
       const userDocRef = doc(db, 'users', user.uid);
       await updateDoc(userDocRef, {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone || null,
            updatedAt: serverTimestamp(),
       });

       // Note: Firebase Auth profile update (displayName) is separate if needed
       // import { updateProfile } from 'firebase/auth';
       // if (auth.currentUser) {
       //     await updateProfile(auth.currentUser, { displayName: `${data.firstName} ${data.lastName}` });
       // }

      toast({ title: "Profile Updated Successfully" });
      // Optionally trigger profile refetch in AuthProvider or rely on next load
    } catch (err: any) {
      console.error("Profile update failed:", err);
       let message = "Failed to update profile.";
       if (err.code === 'permission-denied') {
           message = "Permission denied. Could not update profile.";
       } else if (err.message) {
           message = err.message;
       }
      setProfileError(message);
      toast({ title: "Profile Update Failed", description: message, variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit: SubmitHandler<PasswordFormInputs> = async (data) => {
      if (!auth?.currentUser) { // Check Firebase currentUser
            toast({ title: "Update Failed", description: "User not logged in or auth service unavailable.", variant: "destructive"});
           return;
      }
      const currentUser: FirebaseUser = auth.currentUser; // Explicitly type for clarity

    setPasswordLoading(true);
    setPasswordError(null);

    try {
         await updatePassword(currentUser, data.newPassword); // Use Firebase updatePassword

       passwordForm.reset();
       toast({ title: "Password Updated Successfully" });

    } catch (err: any) {
      console.error("Password update failed:", err);
       let errorMessage = "Failed to update password.";
        const authError = err as AuthError;
        if (authError.code) {
            switch (authError.code) {
                 case 'auth/weak-password':
                     errorMessage = "New password is too weak. Please ensure it meets the requirements.";
                     break;
                 case 'auth/requires-recent-login':
                     errorMessage = "Security check: Please log out and log in again before changing your password.";
                     break;
                 default:
                     errorMessage = `Password update failed: ${authError.message || authError.code}`;
            }
        } else if (err.message) {
            errorMessage = err.message;
        }
       setPasswordError(errorMessage);
       toast({ title: "Password Update Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

   const handleDeleteAccount = async () => {
       if (!auth?.currentUser) {
            toast({ title: "Action Failed", description: "User not logged in or auth service unavailable.", variant: "destructive"});
           return;
       }
       const currentUser: FirebaseUser = auth.currentUser;

       if (!window.confirm("Are you absolutely sure you want to delete your account? This action is irreversible and will delete your authentication record and potentially associated data (if implemented server-side).")) {
           return;
       }

       setDeleteLoading(true);
       try {
           // TODO: Implement Firestore data deletion (e.g., via Cloud Function triggered by auth delete)
            console.warn("Initiating Firebase Auth account deletion. Associated Firestore data deletion requires separate implementation (e.g., Cloud Function).");

            await currentUser.delete(); // Use Firebase delete method

           toast({ title: "Account Deleted Successfully", description: "You have been logged out." });
           // AuthProvider should handle logout state change and redirect
           router.push('/'); // Redirect to home after deletion

       } catch (err: any) {
           console.error("Account deletion failed:", err);
           let errorMessage = "Failed to delete account.";
            const authError = err as AuthError;
           if (authError.code === 'auth/requires-recent-login') {
               errorMessage = "Security check: Please log out and log in again before deleting your account.";
           } else if (err.message) {
               errorMessage = err.message;
           }
           toast({ title: "Deletion Failed", description: errorMessage, variant: "destructive" });
       } finally {
           setDeleteLoading(false);
       }
   };


  // --- Render Logic ---
   if (authLoading) {
      return (
         <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
         </div>
      );
   }

   if (!user) {
         React.useEffect(() => {
             router.replace('/auth/login?reason=unauthenticated_settings');
         }, [router]);
       return null;
   }

    if (authError || !userProfile) {
        const message = authError?.message || (!userProfile ? "Could not load user profile data." : "An error occurred.");
        return (
            <div className="container mx-auto py-12 px-4 text-center">
                <Alert variant="destructive" className="max-w-md mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Settings</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                    <Link href="/auth/login"><Button className="mt-4">Go to Login</Button></Link>
                </Alert>
            </div>
        );
    }


  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
       <h1 className="text-3xl font-bold mb-8 text-primary">Account Settings</h1>
      <div className="space-y-8">

        {/* Profile Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5"/>Profile Information</CardTitle>
            <CardDescription>Update your personal details.</CardDescription>
          </CardHeader>
          <CardContent>
             {profileError && (
               <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Update Error</AlertTitle>
                 <AlertDescription>{profileError}</AlertDescription>
               </Alert>
             )}
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <Label htmlFor="firstName">First Name</Label>
                   <Input id="firstName" {...profileForm.register("firstName")} aria-invalid={profileForm.formState.errors.firstName ? "true" : "false"}/>
                    {profileForm.formState.errors.firstName && <p className="text-sm text-destructive">{profileForm.formState.errors.firstName.message}</p>}
                 </div>
                 <div className="space-y-1">
                   <Label htmlFor="lastName">Last Name</Label>
                   <Input id="lastName" {...profileForm.register("lastName")} aria-invalid={profileForm.formState.errors.lastName ? "true" : "false"}/>
                   {profileForm.formState.errors.lastName && <p className="text-sm text-destructive">{profileForm.formState.errors.lastName.message}</p>}
                 </div>
               </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={user.email || ''} disabled />
                 <p className="text-xs text-muted-foreground">Email cannot be changed here. Firebase requires separate verification for email changes.</p>
              </div>
               <div className="space-y-1">
                 <Label htmlFor="phone">Phone Number</Label>
                 <Input id="phone" type="tel" {...profileForm.register("phone")} aria-invalid={profileForm.formState.errors.phone ? "true" : "false"}/>
                 {profileForm.formState.errors.phone && <p className="text-sm text-destructive">{profileForm.formState.errors.phone.message}</p>}
               </div>
              <Button type="submit" disabled={profileLoading}>
                 {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Save Profile Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center"><Lock className="mr-2 h-5 w-5"/>Change Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent>
              {passwordError && (
                 <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Update Error</AlertTitle>
                   <AlertDescription>{passwordError}</AlertDescription>
                    {passwordError.includes("recent login") && (
                        <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={async () => { if(auth) { await auth.signOut(); router.push('/auth/login'); } }}>
                           Log in again
                         </Button>
                    )}
                 </Alert>
               )}
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} aria-invalid={passwordForm.formState.errors.newPassword ? "true" : "false"}/>
                 {passwordForm.formState.errors.newPassword ? (
                     <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  ) : (
                      <p className="text-xs text-muted-foreground">Min 8 chars, 1 number, 1 special character.</p>
                  )}
              </div>
               <div className="space-y-1">
                 <Label htmlFor="confirmPassword">Confirm New Password</Label>
                 <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} aria-invalid={passwordForm.formState.errors.confirmPassword ? "true" : "false"}/>
                 {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
               </div>
              <Button type="submit" disabled={passwordLoading}>
                 {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

         {/* Notification Settings Placeholder */}
         <Card className="shadow-md">
           <CardHeader>
             <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5"/>Notification Preferences</CardTitle>
             <CardDescription>Manage how you receive notifications. (Coming Soon)</CardDescription>
           </CardHeader>
           <CardContent>
             <form className="space-y-4">
                <p className="text-muted-foreground">Notification settings options will be available here.</p>
                <Button type="submit" disabled>Save Notification Settings</Button>
             </form>
           </CardContent>
         </Card>

         {/* Account Deletion */}
          <Card className="shadow-md border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive"><ShieldAlert className="mr-2 h-5 w-5"/>Danger Zone</CardTitle>
               <CardDescription className="text-destructive/90">Irreversible account actions.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                     <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted-foreground">Permanently remove your account and associated data. This requires server-side implementation for full data cleanup and cannot be undone.</p>
                  </div>
                  <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
                     {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Delete My Account
                  </Button>
               </div>
               {passwordError?.includes("recent login") && ( // Show re-login prompt if deletion failed due to needing recent login
                 <Alert variant="destructive" className="mt-4">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Action Required</AlertTitle>
                   <AlertDescription>
                     For security, please{' '}
                     <Button variant="link" size="sm" className="p-0 h-auto text-destructive font-bold" onClick={async () => { if(auth) { await auth.signOut(); router.push('/auth/login'); } }}>
                       log out and log back in
                     </Button>
                     {' '}before deleting your account.
                   </AlertDescription>
                 </Alert>
               )}
            </CardContent>
          </Card>

      </div>
    </div>
  );
}
