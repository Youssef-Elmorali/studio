
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, CheckCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// TODO: Add authentication check - this page should be protected
// TODO: Fetch actual notifications

export default function NotificationsPage() {
  // Placeholder notifications - replace with actual data
  const notifications = [
    { id: 'n1', type: 'match', text: 'New potential donor match for your request #123 (O-).', date: '2024-07-30 10:00 AM', read: false },
    { id: 'n2', type: 'campaign', text: 'The "Summer Blood Drive" campaign starts tomorrow near you!', date: '2024-07-29 05:30 PM', read: false },
    { id: 'n3', type: 'urgent', text: 'Urgent need for B+ blood at North Regional Hospital.', date: '2024-07-29 02:15 PM', read: true },
    { id: 'n4', type: 'info', text: 'Your donation eligibility resets on 2024-08-15.', date: '2024-07-28 09:00 AM', read: true },
    { id: 'n5', type: 'request_update', text: 'Your request #120 has been fulfilled.', date: '2024-07-27 11:45 AM', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-3xl mx-auto shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
             <CardTitle className="text-2xl font-bold text-primary flex items-center"><BellRing className="mr-2 h-6 w-6"/>Notifications</CardTitle>
             <CardDescription>Updates on your requests, donations, and important alerts.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
             {unreadCount > 0 && (
                <Button variant="outline" size="sm">
                    <CheckCheck className="mr-1 h-4 w-4" /> Mark all as read
                </Button>
             )}
             <Button variant="ghost" size="icon">
                 <Settings className="h-5 w-5" />
                 <span className="sr-only">Notification Settings</span>
             </Button>
           </div>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li key={notification.id} className={`p-4 rounded-md border ${notification.read ? 'bg-card' : 'bg-primary/5 border-primary/20'}`}>
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                      {notification.text}
                    </p>
                     {!notification.read && (
                         <Button variant="ghost" size="sm" className="h-auto p-1 -mr-1 -mt-1 text-xs">
                             Mark read
                         </Button>
                     )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{notification.date}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-8">You have no notifications.</p>
          )}

          {/* Placeholder for pagination or load more */}
           {notifications.length > 5 && ( // Example condition
              <div className="mt-6 text-center">
                 <Button variant="outline">Load More Notifications</Button>
              </div>
           )}

        </CardContent>
      </Card>
    </div>
  );
}
