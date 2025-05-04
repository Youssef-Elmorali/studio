
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth } from '@/lib/firebase/client'; // Import Firebase auth instance
import { signInWithEmailAndPassword, type AuthError } from 'firebase/auth'; // Import Firebase auth functions
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define Zod schema for form validation
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setLoading(true);
    setError(null);

    try {
      // Ensure auth instance is available
      if (!auth) {
         console.error("Login failed: Firebase Auth service is not available.");
         throw new Error("Authentication service is currently unavailable. Please try again later.");
      }

       // Basic check if essential config values are present in the auth instance
       if (!auth.config?.apiKey) {
            console.error("Firebase API Key is missing from configuration. Check .env.local setup and restart.");
            throw new Error("Firebase configuration error: API Key seems missing. Check console and setup instructions.");
       }
       // Check if essential methods exist (helps catch partial initialization)
       if (typeof auth.signInWithEmailAndPassword !== 'function') {
           console.error("Firebase Auth service is not initialized correctly. Essential functions missing.");
           throw new Error("Firebase Auth is not configured correctly. Please check setup instructions in src/lib/firebase/client.ts.");
       }


      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: "Login Successful", description: "Welcome back!" });
       // Redirect to the main dashboard redirector page after successful login
       router.push('/dashboard');
       router.refresh(); // Refresh to ensure layout picks up new auth state

    } catch (err: any) {
        console.error("Login failed:", err);
        let errorMessage = "An unexpected error occurred. Please try again.";

        // Handle Firebase Auth error codes
        const authError = err as AuthError; // Type assertion
        if (authError.code) {
            switch (authError.code) {
                case 'auth/invalid-credential':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = "Invalid email or password. Please check your credentials.";
                    break;
                case 'auth/user-disabled':
                    errorMessage = "This account has been disabled.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "Too many login attempts. Please try again later.";
                    break;
                 case 'auth/network-request-failed':
                    errorMessage = "Network error. Please check your internet connection.";
                    break;
                 case 'auth/invalid-email':
                     errorMessage = "The email address format is invalid.";
                     break;
                 case 'auth/api-key-not-valid':
                      errorMessage = "Internal configuration error (Invalid API Key). Please contact support.";
                      console.error("Firebase Login Error: Invalid API Key. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set correctly in .env.local and the server was restarted.");
                      break;
                 case 'auth/app-deleted':
                 case 'auth/app-not-authorized':
                 case 'auth/project-not-found':
                 case 'auth/configuration-not-found':
                     errorMessage = "Internal configuration error. Please contact support.";
                     console.error(`Firebase Login Error: ${authError.code}. Check Firebase project setup and configuration in console and .env.local.`);
                     break;
                default:
                    errorMessage = `Login failed: ${authError.message || authError.code}`;
            }
        } else if (err.message) {
             // Fallback if it's not a standard AuthError but has a message
             errorMessage = err.message;
        }

        setError(errorMessage);
        toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] py-12">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-1 text-center">
           <div className="flex justify-center mb-4">
             <User className="w-12 h-12 text-primary" />
           </div>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
         {error && (
            <Alert variant="destructive" className="mb-4">
               <AlertCircle className="h-4 w-4" />
              <AlertTitle>Login Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                 disabled={loading}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline hover:text-primary">
                  Forgot your password?
                </Link>
              </div>
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
               {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !auth}> {/* Disable if no auth instance */}
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login
            </Button>
            {/* Social Login Placeholder - Add Firebase providers if needed */}
            {/*
            <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={loading}>
              <Chrome className="mr-2 h-4 w-4"/> Login with Google
            </Button>
            */}
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="underline hover:text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
