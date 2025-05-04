
"use client";

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, CalendarCheck, MapPin, Megaphone, Users, Clock, ArrowLeft } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";

// Mock Data - Replace with actual data fetching based on campaignId
const allCampaigns = [
  { id: '1', title: "Summer Blood Drive", date: "July 15-20, 2024", time: "10:00 AM - 4:00 PM Daily", location: "City Hall Plaza", goal: 200, collected: 150, organizer: "Community Blood Bank", status: "Ongoing", description: "Join us for our annual Summer Blood Drive! Help us reach our goal and ensure a stable blood supply during the summer months. Refreshments provided.", image: "https://picsum.photos/seed/summerdrive/600/300", participants: 120 },
  { id: '2', title: "University Challenge", date: "August 5-9, 2024", time: "9:00 AM - 5:00 PM Daily", location: "State University Campus - Student Union", goal: 300, collected: 210, organizer: "Student Health Services & Red Cross", status: "Ongoing", description: "Calling all students and faculty! Compete against rival departments to see who can donate the most blood. Special giveaways for donors.", image: "https://picsum.photos/seed/unichallenge/600/300", participants: 185 },
  { id: '3', title: "Holiday Heroes", date: "December 1-5, 2024", time: "11:00 AM - 6:00 PM Daily", location: "Downtown Center - Main Hall", goal: 250, collected: 0, organizer: "Red Cross Chapter", status: "Upcoming", description: "Be a hero this holiday season! Donate blood and give the gift of life. Festive atmosphere and snacks available.", image: "https://picsum.photos/seed/holidayheroes/600/300", participants: 0 },
  { id: '4', title: "Spring Renewal Drive", date: "April 10-15, 2024", time: "12:00 PM - 5:00 PM Daily", location: "Community Park Pavilion", goal: 150, collected: 165, organizer: "Local Lions Club", status: "Completed", description: "Thank you to everyone who participated in our successful Spring Renewal Drive! Your donations exceeded our goal and helped countless patients.", image: "https://picsum.photos/seed/springdrive/600/300", participants: 130 },
   { id: '5', title: "Emergency Response Appeal", date: "Ongoing", time: "Varies by Location", location: "Multiple Sites - Check Local Listings", goal: 500, collected: 350, organizer: "Regional Blood Services", status: "Ongoing", description: "Urgent need for all blood types due to recent events. Please find a donation center near you and donate if eligible.", image: "https://picsum.photos/seed/emergencyappeal/600/300", participants: 300 },
];


export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.campaignId as string;

  // Find the campaign - replace with actual data fetching
  const campaign = allCampaigns.find(c => c.id === campaignId);

  if (!campaign) {
    return (
       <div className="container mx-auto py-12 px-4 text-center">
         <h1 className="text-2xl font-bold text-destructive mb-4">Campaign Not Found</h1>
         <p className="text-muted-foreground mb-6">The campaign you are looking for does not exist or could not be loaded.</p>
         <Button asChild variant="outline">
           <Link href="/campaigns"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns</Link>
         </Button>
       </div>
     );
  }

  const progress = campaign.goal > 0 ? Math.min(100, (campaign.collected / campaign.goal) * 100) : 0;
  const isCompleted = campaign.status === 'Completed';
  const isUpcoming = campaign.status === 'Upcoming';

  return (
    <div className="container mx-auto py-12 px-4">
       <div className="mb-6">
         <Button variant="outline" size="sm" asChild>
            <Link href="/campaigns">
               <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Campaigns
            </Link>
         </Button>
       </div>

      <Card className="max-w-4xl mx-auto shadow-lg overflow-hidden">
         {campaign.image && (
           <div className="relative w-full h-48 md:h-64">
             <Image
               src={campaign.image}
               alt={`Image for ${campaign.title}`}
               layout="fill"
               objectFit="cover"
               data-ai-hint="blood drive event photo"
             />
             <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                 <h1 className="text-3xl md:text-4xl font-bold text-white text-center px-4">{campaign.title}</h1>
             </div>
           </div>
         )}
        <CardHeader className="pt-6">
           {!campaign.image && <CardTitle className="text-2xl font-bold text-primary">{campaign.title}</CardTitle> }
          <CardDescription className="flex items-center justify-between flex-wrap gap-2 text-sm pt-1">
             <div>
                 {campaign.status === 'Upcoming' && <Badge variant="outline" className="text-blue-600 border-blue-600 mr-2">Upcoming</Badge>}
                 {campaign.status === 'Ongoing' && <Badge variant="outline" className="text-green-600 border-green-600 mr-2">Ongoing</Badge>}
                 {isCompleted && <Badge variant="secondary" className="mr-2">Completed</Badge>}
                 Organized by: <span className="font-medium text-foreground">{campaign.organizer}</span>
             </div>
              <span className="flex items-center"><Users className="mr-1.5 h-4 w-4"/> {campaign.participants} Participants {isCompleted ? 'Attended' : 'Registered'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
              {/* Details Section */}
              <div className="space-y-3 text-muted-foreground">
                  <p className="flex items-start"><CalendarCheck className="mr-2 h-5 w-5 text-primary mt-1 flex-shrink-0"/> <strong>Date:</strong> {campaign.date}</p>
                  <p className="flex items-start"><Clock className="mr-2 h-5 w-5 text-primary mt-1 flex-shrink-0"/> <strong>Time:</strong> {campaign.time}</p>
                  <p className="flex items-start"><MapPin className="mr-2 h-5 w-5 text-primary mt-1 flex-shrink-0"/> <strong>Location:</strong> {campaign.location}</p>
                  <p className="flex items-start"><Megaphone className="mr-2 h-5 w-5 text-primary mt-1 flex-shrink-0"/> <strong>Description:</strong> {campaign.description}</p>
              </div>

              {/* Progress & Action Section */}
              <div className="space-y-4">
                 <Card className="bg-muted/30 p-4">
                    <h3 className="text-lg font-semibold mb-3 text-center text-primary">Campaign Goal</h3>
                     {campaign.goal > 0 ? (
                         <div className="space-y-2">
                             <Progress value={progress} className="h-3" aria-label={`Campaign progress: ${Math.round(progress)}%`} />
                             <div className="flex justify-between text-sm font-medium">
                                 <span>{campaign.collected} Units Collected</span>
                                 <span>{campaign.goal} Unit Goal ({Math.round(progress)}%)</span>
                             </div>
                             {isCompleted && campaign.collected >= campaign.goal && <p className="text-center text-green-600 font-semibold mt-2">Goal Achieved! 🎉</p>}
                         </div>
                     ) : (
                         <p className="text-center text-muted-foreground">No specific unit goal set for this campaign.</p>
                     )}
                 </Card>

                 {!isCompleted && (
                      <Button size="lg" className="w-full" asChild>
                         {/* Link might go to an external registration or the /donate page with pre-filled info */}
                         <Link href="/donate">
                            {isUpcoming ? 'Register to Donate' : 'Find Appointment Slot'}
                         </Link>
                      </Button>
                  )}
                  {isCompleted && (
                      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-md">
                          <p className="font-semibold text-green-700">This campaign has concluded. Thank you to all donors!</p>
                      </div>
                  )}

                 {/* TODO: Add Social Sharing Buttons */}
                  {/* <div className="text-center pt-2">
                     <p className="text-sm text-muted-foreground mb-2">Share this campaign:</p>
                     <div className="flex justify-center gap-3">
                        Share buttons
                     </div>
                  </div> */}
              </div>
           </div>


        </CardContent>
      </Card>
    </div>
  );
}
