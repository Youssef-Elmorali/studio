
// src/app/page.tsx
import { EmergencyRequestBadge } from "@/components/emergency-request-badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Megaphone, Droplets, CalendarCheck, Target, MapPin, UserCheck, Link as LinkIcon, HeartPulse, CheckCircle, Search, Gift } from 'lucide-react';
import Link from "next/link";
import Image from 'next/image';

// Mock Data - Replace with actual data fetching (e.g., from Firestore)
const campaigns = [
  { id: 1, title: "Summer Blood Drive", date: "July 15-20, 2024", location: "City Hall Plaza", goal: 200, collected: 150, organizer: "Community Blood Bank" },
  { id: 2, title: "University Challenge", date: "August 5-9, 2024", location: "State University Campus", goal: 300, collected: 210, organizer: "Student Health Services" },
  { id: 3, title: "Holiday Heroes", date: "December 1-5, 2024", location: "Downtown Center", goal: 250, collected: 0, organizer: "Red Cross Chapter" }, // Example upcoming
];


export default async function Home() {
  // Server component - Cannot use Firebase client-side utilities directly here.
  // Data fetching for server components would use Firebase Admin SDK or fetch API routes.


  return (
    <div className="space-y-12 py-8"> {/* Adjusted spacing */}

      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-b from-primary/5 to-background rounded-lg shadow-inner">
         <Droplets className="mx-auto h-16 w-16 text-primary mb-4 animate-bounce" />
         <h1 className="text-4xl font-bold mb-3 text-primary">Welcome to Qatrah Hayat</h1>
         <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Your connection to saving lives. Donate blood, find donation centers, and track your impact.</p>
         <div className="flex justify-center gap-4 flex-wrap"> {/* Added flex-wrap */}
           <Button size="lg" asChild>
              <Link href="/donate">Find a Donation Center</Link>
           </Button>
           <Button size="lg" variant="outline" asChild>
             <Link href="/request">Request Blood</Link>
           </Button>
         </div>
      </section>

       {/* Emergency Requests Section */}
      <Card className="shadow-md border border-destructive/50 bg-destructive/5"> {/* Added border and subtle bg */}
        <CardHeader>
           <CardTitle className="text-xl font-semibold text-destructive flex items-center"><Megaphone className="mr-2 h-5 w-5 animate-pulse"/>Urgent Needs</CardTitle>
           <CardDescription>Critical blood requests in your area. Your donation can make a difference immediately.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-wrap justify-center gap-4">
              <EmergencyRequestBadge bloodType="O-" location="Downtown General" urgency="Critical" />
              <EmergencyRequestBadge bloodType="A+" location="North Clinic" urgency="High" />
              <EmergencyRequestBadge bloodType="B-" location="Westside Hospital" urgency="High" />
           </div>
           <div className="text-center mt-6">
              <Button variant="destructive" asChild>
                 <Link href="/request">View All Urgent Requests</Link>
              </Button>
           </div>
        </CardContent>
      </Card>


      {/* Why Donate Blood Section */}
       <section className="py-12 px-6 bg-muted/50 rounded-lg shadow-md">
         <h2 className="text-3xl font-bold text-center mb-8 text-primary flex items-center justify-center"><HeartPulse className="mr-3 h-8 w-8"/>Why Donate Blood?</h2>
         <div className="grid md:grid-cols-3 gap-8 text-center">
           <div className="p-6 bg-card rounded-lg shadow transition-transform hover:scale-105">
             <Image src="https://picsum.photos/seed/saveLife/300/200" data-ai-hint="saving life illustration" alt="Save Lives" width={300} height={200} className="rounded-md mb-4 mx-auto" />
             <h3 className="text-xl font-semibold mb-2">Save Lives</h3>
             <p className="text-muted-foreground">A single donation can save up to three lives. Your blood is crucial for surgeries, cancer treatments, chronic illnesses, and traumatic injuries.</p>
           </div>
           <div className="p-6 bg-card rounded-lg shadow transition-transform hover:scale-105">
             <Image src="https://picsum.photos/seed/healthCheck/300/200" data-ai-hint="health checkup illustration" alt="Health Benefits" width={300} height={200} className="rounded-md mb-4 mx-auto" />
             <h3 className="text-xl font-semibold mb-2">Health Check-up</h3>
             <p className="text-muted-foreground">Before donating, you receive a mini-health screening (pulse, blood pressure, temperature, hemoglobin) which can provide valuable health insights.</p>
           </div>
           <div className="p-6 bg-card rounded-lg shadow transition-transform hover:scale-105">
             <Image src="https://picsum.photos/seed/community/300/200" data-ai-hint="community helping hands" alt="Community Support" width={300} height={200} className="rounded-md mb-4 mx-auto" />
             <h3 className="text-xl font-semibold mb-2">Support Your Community</h3>
             <p className="text-muted-foreground">Blood donation strengthens the community's health resources, ensuring blood is available when neighbours, friends, or family need it.</p>
           </div>
         </div>
         <div className="text-center mt-10">
             <Button variant="link" asChild className="text-primary">
                 <Link href="/about#why-donate">Learn More About the Impact</Link>
             </Button>
         </div>
       </section>

       {/* How It Works Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-10 text-primary">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center relative">
           {/* Connecting Lines (Desktop Only) */}
           <div className="hidden md:block absolute top-1/3 left-0 right-0 transform -translate-y-1/2 h-16">
               <div className="flex justify-center items-center h-full">
                 <div className="w-1/4 border-t-2 border-primary/30 border-dashed"></div>
                 <div className="w-1/4 border-t-2 border-primary/30 border-dashed"></div>
               </div>
           </div>

          <div className="relative flex flex-col items-center p-6 z-10">
            <div className="bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4 shadow-lg">
              <Search className="h-8 w-8"/>
            </div>
            <h3 className="text-xl font-semibold mb-2">1. Find a Center</h3>
            <p className="text-muted-foreground">Use our search tool to locate nearby donation centers or mobile blood drives.</p>
          </div>
          <div className="relative flex flex-col items-center p-6 z-10">
            <div className="bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4 shadow-lg">
              <Gift className="h-8 w-8"/>
            </div>
            <h3 className="text-xl font-semibold mb-2">2. Donate Blood</h3>
            <p className="text-muted-foreground">Schedule an appointment and complete the simple, safe donation process (about 1 hour).</p>
          </div>
          <div className="relative flex flex-col items-center p-6 z-10">
            <div className="bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4 shadow-lg">
               <CheckCircle className="h-8 w-8"/>
            </div>
            <h3 className="text-xl font-semibold mb-2">3. Make an Impact</h3>
            <p className="text-muted-foreground">Your donation is processed and delivered to hospitals, ready to help patients in need.</p>
          </div>
        </div>
      </section>


      {/* User Donation Tracking Section (Conditional) */}
      <Card className="shadow-md bg-gradient-to-r from-primary/5 via-background to-primary/5"> {/* Added subtle gradient */}
        <CardHeader>
           <CardTitle className="text-xl font-semibold text-primary flex items-center"><UserCheck className="mr-2 h-5 w-5"/>Your Donation Journey</CardTitle>
           <CardDescription>Track your contributions and eligibility. Every drop counts!</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Logged in state needs to be handled client-side with useAuth hook */}
          <div className="text-center py-6 space-y-3">
              <p className="text-muted-foreground">Log in or sign up to track your donations and view your impact.</p>
              <div className="flex justify-center gap-4 flex-wrap"> {/* Added flex-wrap */}
                 <Button asChild>
                   <Link href="/auth/login">Login</Link>
                 </Button>
                 <Button variant="outline" asChild>
                   <Link href="/auth/signup">Sign Up</Link>
                 </Button>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details Section */}
      <Card className="shadow-md">
         <CardHeader>
           <CardTitle className="text-xl font-semibold text-primary flex items-center"><Target className="mr-2 h-5 w-5"/>Featured Donation Campaigns</CardTitle>
           <CardDescription>Join upcoming events or see results from recent drives in your community.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           {campaigns.map((campaign) => (
             <div key={campaign.id} className="p-4 border rounded-lg bg-card space-y-3 transition-shadow hover:shadow-md">
               <h3 className="text-lg font-semibold">{campaign.title}</h3>
               <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center"><CalendarCheck className="mr-1 h-4 w-4"/> {campaign.date}</span>
                  <span className="flex items-center"><MapPin className="mr-1 h-4 w-4"/> {campaign.location}</span>
                  <span className="flex items-center"><Megaphone className="mr-1 h-4 w-4"/> Organized by: {campaign.organizer}</span>
               </div>
               {campaign.collected >= 0 && campaign.goal > 0 ? ( // Show progress if collection started or it's upcoming
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                      <span>Collected: {campaign.collected} units</span>
                      <span>Goal: {campaign.goal} units</span>
                   </div>
                   <Progress value={campaign.goal > 0 ? Math.min(100, (campaign.collected / campaign.goal) * 100) : 0} className="h-2" aria-label={`Campaign progress: ${campaign.goal > 0 ? Math.round((campaign.collected / campaign.goal) * 100) : 0}%`} />
                    {campaign.collected === 0 && <Badge variant="outline" className="text-primary border-primary mt-2">Upcoming Event</Badge>}
                 </div>
               ) : (
                 <Badge variant="outline">Details Soon</Badge> // Fallback if goal isn't set
               )}
               <div className="pt-2">
                  <Button variant="link" className="p-0 h-auto text-primary" asChild>
                     <Link href={`/campaigns/${campaign.id}`}> {/* Example link */}
                        Learn More & Participate <LinkIcon className="ml-1 h-4 w-4"/>
                     </Link>
                  </Button>
               </div>
             </div>
           ))}
           <div className="text-center mt-6">
             <Button variant="outline" asChild>
                <Link href="/campaigns">View All Campaigns</Link>
             </Button>
           </div>
         </CardContent>
      </Card>

    </div>
  );
}
