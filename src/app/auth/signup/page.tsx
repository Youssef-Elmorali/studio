
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, getDaysInMonth, isValid } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth, db } from '@/lib/firebase/client'; // Import Firebase auth and db
import { createUserWithEmailAndPassword, type AuthError } from 'firebase/auth'; // Firebase auth functions
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'; // Firestore functions
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { UserProfile, BloodGroup, Gender, UserRole } from '@/types/user'; // Keep using local types
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from 'lucide-react';


// --- Constants ---
const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders: Exclude<Gender, 'Other' | 'Prefer not to say'>[] = ['Male', 'Female'];
const roles: UserRole[] = ['donor', 'recipient'];
const MIN_AGE = 16;
const MAX_YEAR_RANGE = 120;

// --- Zod Schema Definition ---
const signupSchema = z.object({
  role: z.enum(['donor', 'recipient'], { required_error: "Please select a role (Donor or Recipient)" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }).regex(/^\+?[0-9\s\-()]+$/, { message: "Invalid phone number format" }),
  dob: z.date({ required_error: "A valid date of birth is required" }).refine(date => {
     const today = new Date();
     today.setHours(0, 0, 0, 0);
     const minAgeDate = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate());
     minAgeDate.setHours(0, 0, 0, 0);
     const selectedDate = new Date(date);
     selectedDate.setHours(0, 0, 0, 0);
     return selectedDate <= minAgeDate;
  }, { message: `You must be at least ${MIN_AGE} years old` }),
  bloodGroup: z.enum(bloodGroups, { required_error: "Blood group is required" }),
  gender: z.enum(genders, { required_error: "Gender is required" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms and conditions" }) }),
  lastDonationDate: z.date().optional().nullable(),
  medicalConditions: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormInputs = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [selectedDay, setSelectedDay] = React.useState<string>('');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<string>('');

  const { register, handleSubmit, control, watch, formState: { errors }, setValue } = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
       role: undefined,
       terms: false,
       lastDonationDate: null,
       medicalConditions: '',
       dob: undefined,
       gender: undefined,
    }
  });

  React.useEffect(() => {
    if (selectedDay && selectedMonth && selectedYear) {
      const day = parseInt(selectedDay, 10);
      const month = parseInt(selectedMonth, 10); // Month is 0-indexed in JS Date
      const year = parseInt(selectedYear, 10);
      // Use UTC date to avoid timezone issues if possible, otherwise ensure local time is handled consistently
      const date = new Date(Date.UTC(year, month, day));
      // Check if the constructed date components match the selected ones to ensure validity
      if (isValid(date) && date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
         setValue("dob", date, { shouldValidate: true });
      } else {
         setValue("dob", undefined, { shouldValidate: true }); // Set to undefined if date is invalid
      }
    } else {
       setValue("dob", undefined, { shouldValidate: true }); // Set to undefined if any part is missing
    }
  }, [selectedDay, selectedMonth, selectedYear, setValue]);


  const currentYear = new Date().getFullYear();
  // Adjust end year to allow selecting the current year
  const startYearDropdown = currentYear - MAX_YEAR_RANGE;
  const endYearDropdown = currentYear;
  const years = Array.from({ length: endYearDropdown - startYearDropdown + 1 }, (_, i) => startYearDropdown + i).reverse();

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(), // 0-indexed month value
    label: format(new Date(2000, i, 1), 'MMMM'),
  }));

  // Calculate days in month, considering leap years
   const daysInMonth = React.useMemo(() => {
       if (selectedYear && selectedMonth) {
           // Month is 0-indexed for Date constructor
           return getDaysInMonth(new Date(parseInt(selectedYear, 10), parseInt(selectedMonth, 10)));
       }
       return 31; // Default max days
   }, [selectedMonth, selectedYear]);


  const days = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

  // Reset day selection if it becomes invalid for the selected month/year
   React.useEffect(() => {
       if (selectedDay && parseInt(selectedDay, 10) > daysInMonth) {
           setSelectedDay('');
           setValue("dob", undefined, { shouldValidate: true }); // Also clear the main dob value
       }
   }, [daysInMonth, selectedDay, setValue]);

  const selectedRole = watch("role");

  const onSubmit: SubmitHandler<SignupFormInputs> = async (data) => {
    if (!auth || !db) { // Ensure Firebase services are available
        setError("Authentication or database service is not available. Please try again later.");
        toast({ title: "Signup Failed", description: "Service unavailable.", variant: "destructive" });
        return;
    }
    setLoading(true);
    setError(null);
    try {
        // 1. Sign up the user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        if (!user) throw new Error("Signup successful but user data missing.");

        // 2. Prepare the user profile data for Firestore
        // Use camelCase for application logic, Firestore might use snake_case or camelCase depending on your setup
        // We'll use camelCase here and assume Firestore is set up accordingly or uses converters.
        const profileData: Omit<UserProfile, 'uid' | 'email'> & { createdAt: Timestamp; updatedAt: Timestamp } = {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            dob: data.dob ? Timestamp.fromDate(data.dob) : null, // Convert JS Date to Firestore Timestamp
            bloodGroup: data.bloodGroup,
            gender: data.gender,
            role: data.role,
            createdAt: serverTimestamp() as Timestamp, // Use server timestamp for creation
            updatedAt: serverTimestamp() as Timestamp, // Use server timestamp for update
            // Donor specific fields
            ...(data.role === 'donor' && {
                lastDonationDate: data.lastDonationDate ? Timestamp.fromDate(data.lastDonationDate) : null,
                medicalConditions: data.medicalConditions || null,
                isEligible: true, // Default eligibility
                nextEligibleDate: null, // Calculate later if needed
                totalDonations: 0,
            }),
        };

        // 3. Insert the user profile into Firestore 'users' collection
        const userDocRef = doc(db, 'users', user.uid); // Create a doc reference with the user's UID
        await setDoc(userDocRef, profileData);

        // Optional: Send email verification (Firebase handles this if enabled in console)
        // await sendEmailVerification(user);

        toast({ title: "Account Created Successfully!", description: "Please check your email to verify your account (if applicable)." });
        // Redirect to login or a confirmation page
        router.push('/auth/login?status=signup_success');

    } catch (err: any) {
       console.error("Signup failed:", err);
        let errorMessage = "An unexpected error occurred. Please try again.";
         const authError = err as AuthError; // Type assertion for Firebase errors
        if (authError.code) {
            switch (authError.code) {
                 case 'auth/email-already-in-use':
                     errorMessage = "This email address is already registered.";
                     break;
                 case 'auth/weak-password':
                     errorMessage = "Password is too weak. Please choose a stronger one (min 8 chars, number, special char).";
                     break;
                 case 'auth/invalid-email':
                     errorMessage = "The email address is not valid.";
                     break;
                 case 'auth/operation-not-allowed':
                     errorMessage = "Email/password sign-up is not enabled. Contact support.";
                     break;
                 case 'auth/network-request-failed':
                     errorMessage = "Network error. Please check connection and try again.";
                     break;
                 default:
                     errorMessage = `Signup failed: ${authError.message || authError.code}`;
            }
        } else if (err.message) {
             // Handle Firestore or other errors
             if (err.message.includes("firestore/permission-denied")) {
                errorMessage = "Database permission error. Could not save profile.";
             } else {
                errorMessage = err.message;
             }
        }
        setError(errorMessage);
        toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] py-12 px-4">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="space-y-2 text-center">
           <div className="flex justify-center mb-4">
             <UserPlus className="w-12 h-12 text-primary" />
           </div>
          <CardTitle className="text-3xl font-bold">Create Your Account</CardTitle>
          <CardDescription>Join our community and start saving lives today</CardDescription>
        </CardHeader>
        <CardContent>
           {error && (
               <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Signup Error</AlertTitle>
                 <AlertDescription>{error}</AlertDescription>
               </Alert>
             )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             <Controller
               name="role"
               control={control}
               render={({ field }) => (
                 <div className="space-y-2">
                   <Label className="text-base font-semibold">Register As *</Label>
                    <RadioGroup
                     onValueChange={field.onChange}
                     value={field.value}
                     className="flex flex-col sm:flex-row gap-4 pt-2"
                   >
                      {roles.map((roleOption) => (
                        <div key={roleOption} className={cn(
                           "flex items-center space-x-2 p-4 border rounded-md flex-1 cursor-pointer hover:bg-accent",
                           field.value === roleOption && "bg-primary/10 border-primary ring-1 ring-primary"
                           )}>
                           <RadioGroupItem value={roleOption} id={`role-${roleOption}`} />
                           <Label htmlFor={`role-${roleOption}`} className="text-lg font-medium cursor-pointer capitalize">
                               {roleOption}
                           </Label>
                        </div>
                      ))}
                   </RadioGroup>
                   {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
                 </div>
               )}
             />

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <Label htmlFor="firstName">First Name *</Label>
                 <Input id="firstName" placeholder="John" {...register("firstName")} aria-invalid={errors.firstName ? "true" : "false"} disabled={loading} />
                 {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
               </div>
               <div className="space-y-1">
                 <Label htmlFor="lastName">Last Name *</Label>
                 <Input id="lastName" placeholder="Doe" {...register("lastName")} aria-invalid={errors.lastName ? "true" : "false"} disabled={loading} />
                 {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
               </div>
               <div className="space-y-1">
                 <Label htmlFor="email">Email Address *</Label>
                 <Input id="email" type="email" placeholder="m@example.com" {...register("email")} aria-invalid={errors.email ? "true" : "false"} disabled={loading} />
                 {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
               </div>
               <div className="space-y-1">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" placeholder="(123) 456-7890" {...register("phone")} aria-invalid={errors.phone ? "true" : "false"} disabled={loading} />
                   {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>

                <div className="md:col-span-2 space-y-1">
                   <Label>Date of Birth *</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Select value={selectedYear} onValueChange={setSelectedYear} disabled={loading}>
                        <SelectTrigger aria-label="Year of birth" id="dob-year">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={!selectedYear || loading}>
                         <SelectTrigger aria-label="Month of birth" id="dob-month">
                           <SelectValue placeholder="Month" />
                         </SelectTrigger>
                         <SelectContent>
                           {months.map(month => (
                             <SelectItem key={month.value} value={month.value}>
                               {month.label}
                             </SelectItem>
                           ))}
                         </SelectContent>
                      </Select>
                       <Select value={selectedDay} onValueChange={setSelectedDay} disabled={!selectedMonth || !selectedYear || loading}>
                         <SelectTrigger aria-label="Day of birth" id="dob-day">
                           <SelectValue placeholder="Day" />
                         </SelectTrigger>
                         <SelectContent>
                           {days.map(day => (
                             <SelectItem key={day} value={day}>
                               {day}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                    </div>
                   <input type="hidden" {...register("dob")} />
                   {errors.dob && <p className="text-sm text-destructive pt-1">{errors.dob.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="blood-group">Blood Group *</Label>
                  <Controller
                      name="bloodGroup"
                      control={control}
                      render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                              <SelectTrigger id="blood-group" aria-invalid={errors.bloodGroup ? "true" : "false"}>
                                  <SelectValue placeholder="Select Blood Group" />
                              </SelectTrigger>
                              <SelectContent>
                                  {bloodGroups.map(type => (
                                      <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      )}
                  />
                   {errors.bloodGroup && <p className="text-sm text-destructive">{errors.bloodGroup.message}</p>}
                </div>
                <div className="space-y-1">
                   <Label htmlFor="gender">Gender *</Label>
                   <Controller
                       name="gender"
                       control={control}
                       render={({ field }) => (
                           <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={loading}>
                               <SelectTrigger id="gender" aria-invalid={errors.gender ? "true" : "false"}>
                                   <SelectValue placeholder="Select Gender" />
                               </SelectTrigger>
                               <SelectContent>
                                   {genders.map(gender => (
                                       <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                                   ))}
                               </SelectContent>
                           </Select>
                       )}
                   />
                   {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="password">Password *</Label>
                   <div className="relative">
                       <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          aria-invalid={errors.password ? "true" : "false"}
                          className="pr-10"
                          disabled={loading}
                       />
                        <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           className="absolute inset-y-0 right-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground"
                           onClick={() => setShowPassword(!showPassword)}
                           aria-label={showPassword ? "Hide password" : "Show password"}
                           disabled={loading}
                         >
                           {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                         </Button>
                   </div>
                   {errors.password ? (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                   ) : (
                      <p className="text-xs text-muted-foreground">Min 8 chars, 1 number, 1 special character.</p>
                   )}
                </div>
                 <div className="space-y-1">
                   <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                       <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          {...register("confirmPassword")}
                          aria-invalid={errors.confirmPassword ? "true" : "false"}
                           className="pr-10"
                           disabled={loading}
                       />
                       <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           className="absolute inset-y-0 right-0 h-full px-3 flex items-center text-muted-foreground hover:text-foreground"
                           onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                           aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                           disabled={loading}
                         >
                           {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                         </Button>
                   </div>
                   {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                 </div>
              </div>

            {selectedRole === 'donor' && (
              <div className="space-y-4 pt-4 border-t mt-6">
                  <h3 className="text-lg font-semibold text-primary">Donor Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <Label htmlFor="lastDonationDate">Last Donation Date (if applicable)</Label>
                       <Controller
                           name="lastDonationDate"
                           control={control}
                           render={({ field }) => (
                               <Popover>
                                <PopoverTrigger asChild>
                                   <Button
                                     variant={"outline"}
                                     className={cn(
                                       "w-full justify-start text-left font-normal",
                                       !field.value && "text-muted-foreground"
                                     )}
                                     disabled={loading}
                                   >
                                     <CalendarIcon className="mr-2 h-4 w-4" />
                                     {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-auto p-0">
                                   <Calendar
                                     mode="single"
                                     selected={field.value ?? undefined}
                                     onSelect={(date) => field.onChange(date ?? null)}
                                     disabled={(date) => date > new Date() || loading} // Prevent future dates & disable when loading
                                     initialFocus
                                     captionLayout="dropdown-buttons" // Use dropdowns for year/month
                                     fromYear={currentYear - 5} // Example range: last 5 years
                                     toYear={currentYear}
                                   />
                                 </PopoverContent>
                               </Popover>
                           )}
                       />
                       {errors.lastDonationDate && <p className="text-sm text-destructive">{errors.lastDonationDate.message}</p>}
                     </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="medicalConditions">Any Medical Conditions?</Label>
                      <Textarea id="medicalConditions" placeholder="Please list any conditions that might affect donation eligibility (e.g., heart condition, recent surgery, medications)..." {...register("medicalConditions")} disabled={loading}/>
                       {errors.medicalConditions && <p className="text-sm text-destructive">{errors.medicalConditions.message}</p>}
                      <p className="text-xs text-muted-foreground">This helps determine eligibility. Details are kept confidential.</p>
                    </div>
               </div>
            )}

            <div className="flex items-start space-x-2 pt-4">
                 <Controller
                     name="terms"
                     control={control}
                     render={({ field }) => (
                         <Checkbox
                             id="terms"
                             checked={field.value}
                             onCheckedChange={field.onChange}
                              aria-invalid={errors.terms ? "true" : "false"}
                             className="mt-0.5"
                              disabled={loading}
                         />
                     )}
                 />
                <div className="grid gap-1.5 leading-none">
                     <Label htmlFor="terms" className={cn("text-sm font-medium leading-none", loading && "cursor-not-allowed opacity-70")}>
                       I agree to the <Link href="/terms" className="underline hover:text-primary">Terms and Conditions</Link> and <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link> *
                     </Label>
                      {errors.terms && <p className="text-sm font-medium text-destructive">{errors.terms.message}</p>}
                 </div>
            </div>

            <Button type="submit" className="w-full text-lg py-3" size="lg" disabled={loading || !auth || !db}> {/* Disable if loading or firebase services missing */}
               {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
               Create Account
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline hover:text-primary">
              Log In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
