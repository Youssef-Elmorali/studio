
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, CalendarCheck, MapPin, Megaphone, Link as LinkIcon } from 'lucide-react';
import Link from "next/link";

// Mock Data - Replace with actual data fetching and filtering/pagination
const allCampaigns = [
  { id: 1, title: "Summer Blood Drive", date: "July 15-20, 2024", location: "City Hall Plaza", goal: 200, collected: 150, organizer: "Community Blood Bank", status: "Ongoing" },
  { id: 2, title: "University Challenge", date: "August 5-9, 2024", location: "State University Campus", goal: 300, collected: 210, organizer: "Student Health Services", status: "Ongoing" },
  { id: 3, title: "Holiday Heroes", date: "December 1-5, 2024", location: "Downtown Center", goal: 250, collected: 0, organizer: "Red Cross Chapter", status: "Upcoming" },
  { id: 4, title: "Spring Renewal Drive", date: "April 10-15, 2024", location: "Community Park", goal: 150, collected: 165, organizer: "Local Lions Club", status: "Completed" },
   { id: 5, title: "Emergency Response Appeal", date: "Ongoing", location: "Multiple Sites", goal: 500, collected: 350, organizer: "Regional Blood Services", status: "Ongoing"},
];

export default function CampaignsPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-primary flex items-center justify-center"><Target className="mr-3 h-8 w-8"/> Donation Campaigns</h1>

      {/* TODO: Add Filtering/Sorting Options (e.g., by Status, Date, Location) */}
      {/* <div className="mb-8 flex justify-center gap-4">
        <Button variant="outline">Filter by Status</Button>
        <Button variant="outline">Sort by Date</Button>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allCampaigns.map((campaign) => (
          <Card key={campaign.id} className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{campaign.title}</CardTitle>
              <CardDescription className="flex items-center text-sm pt-1">
                 {campaign.status === 'Upcoming' && <Badge variant="outline" className="text-blue-600 border-blue-600 mr-2">Upcoming</Badge>}
                 {campaign.status === 'Ongoing' && <Badge variant="outline" className="text-green-600 border-green-600 mr-2">Ongoing</Badge>}
                 {campaign.status === 'Completed' && <Badge variant="secondary" className="mr-2">Completed</Badge>}
                 Organized by: {campaign.organizer}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between space-y-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                 <span className="flex items-center"><CalendarCheck className="mr-1.5 h-4 w-4"/> {campaign.date}</span>
                 <span className="flex items-center"><MapPin className="mr-1.5 h-4 w-4"/> {campaign.location}</span>
              </div>
              {campaign.goal > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Collected: {campaign.collected} units</span>
                    <span>Goal: {campaign.goal} units</span>
                  </div>
                   <Progress
                      value={campaign.collected >= campaign.goal ? 100 : (campaign.collected / campaign.goal) * 100}
                      className={`h-2 ${campaign.collected >= campaign.goal ? 'bg-green-500' : ''}`} // Highlight completed goals
                      aria-label={`Campaign progress: ${Math.round((campaign.collected / campaign.goal) * 100)}%`}
                    />
                </div>
              )}
              <div className="pt-2 text-right">
                 <Button variant="link" className="p-0 h-auto text-primary" asChild>
                   <Link href={`/campaigns/${campaign.id}`}> {/* Placeholder link */}
                      Details <LinkIcon className="ml-1 h-4 w-4"/>
                   </Link>
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TODO: Add Pagination if many campaigns */}
       {/* <div className="mt-12 flex justify-center">
         <Button variant="outline">Load More Campaigns</Button>
       </div> */}
    </div>
  );
}
