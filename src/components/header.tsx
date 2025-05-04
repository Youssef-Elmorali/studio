
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Droplets, UserCircle, HeartHandshake, Search, LogIn, UserPlus, Bell, LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth'; // Use Firebase-based hook
import { auth } from '@/lib/firebase/client'; // Import Firebase auth instance
import { signOut } from 'firebase/auth'; // Import Firebase sign out function
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils'; // Import cn

export function Header() {
  const { user, userProfile, isAdmin, loading } = useAuth(); // Get user, profile, and admin status
  const router = useRouter();
  const { toast } = useToast();

  const isLoggedIn = !!user;
  const notificationCount = isLoggedIn ? 3 : 0; // Placeholder

  const handleLogout = async () => {
    try {
       if (!auth) {
            toast({ title: "Logout Failed", description: "Authentication service unavailable.", variant: "destructive" });
            return;
       }
      await signOut(auth); // Use Firebase sign out
      toast({ title: "Logged out successfully." });
      router.push('/'); // Redirect to home page
      router.refresh(); // Force refresh to update layout state if needed elsewhere
    } catch (error: any) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: error.message || "An error occurred during logout.", variant: "destructive" });
    }
  };

  const navItems = [
    { href: "/donate", label: "Find Donation", icon: Search },
    { href: "/request", label: "Request Blood", icon: HeartHandshake },
    { href: "/campaigns", label: "Campaigns", icon: HeartHandshake },
  ];

  let authItems = [];
  let mobileAuthItems = [];

  if (loading) {
    authItems = [
        { key: 'loading1', element: <Button variant="ghost" size="icon" disabled className="w-8 h-8 animate-pulse bg-muted rounded-full"></Button> },
        { key: 'loading2', element: <Button variant="ghost" size="icon" disabled className="w-8 h-8 animate-pulse bg-muted rounded-full"></Button> },
    ];
     mobileAuthItems = [
        { key: 'loading-mobile', element: <div className="h-8 w-full bg-muted rounded animate-pulse"></div> }
     ];

  } else if (isLoggedIn) {
    // User Dashboard Link
    authItems.push({ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: 'user-dash' }); // Point to the redirector
    mobileAuthItems.push({ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: 'user-dash-mobile' }); // Point to the redirector

    // Admin Panel Link (if admin)
    if (isAdmin) {
      authItems.push({ href: "/dashboard/admin", label: "Admin", icon: LayoutDashboard, key: 'admin-dash' });
       mobileAuthItems.push({ href: "/dashboard/admin", label: "Admin Panel", icon: LayoutDashboard, key: 'admin-dash-mobile' });
    }

    // Profile Link
    authItems.push({ href: "/profile", label: "Profile", icon: UserCircle, key: 'profile' });
    mobileAuthItems.push({ href: "/profile", label: "Profile", icon: UserCircle, key: 'profile-mobile' });

    // Logout Button
    authItems.push({ key: 'logout', element: <Button onClick={handleLogout} variant="outline" size="sm"><LogOut className="mr-1 h-4 w-4" /> Logout</Button> });
    mobileAuthItems.push({ key: 'logout-mobile', element: (
          <button onClick={handleLogout} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground w-full text-left">
             <LogOut className="h-5 w-5" />
             Logout
          </button>
      ) });


  } else {
    authItems = [
      { href: "/auth/login", label: "Login", icon: LogIn, key: 'login' },
      { href: "/auth/signup", label: "Sign Up", icon: UserPlus, key: 'signup' },
    ];
     mobileAuthItems = [
        { href: "/auth/login", label: "Login", icon: LogIn, key: 'login-mobile' },
        { href: "/auth/signup", label: "Sign Up", icon: UserPlus, key: 'signup-mobile' },
     ];
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Added pl-4 for left padding */}
      <div className="container flex h-14 items-center justify-between pl-4">
        <Link href="/" className="flex items-center mr-6">
          <Droplets className="mr-2 h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Qatrah Hayat</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth, Greeting, Notification & Theme Buttons */}
        <div className="hidden md:flex items-center space-x-3 ml-auto"> {/* Adjusted space-x */}
          {isLoggedIn && !loading && userProfile && (
             <span className="text-sm text-muted-foreground hidden lg:inline">
                Hello, {userProfile.firstName || 'User'}!
             </span>
          )}
          {isLoggedIn && !loading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="relative rounded-full"> {/* Made icon buttons round */}
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full">
                        {notificationCount}
                      </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {notificationCount > 0 ? (
                     <>
                        <DropdownMenuItem>New match for request #123</DropdownMenuItem>
                        <DropdownMenuItem>Campaign "Summer Drive" starting soon</DropdownMenuItem>
                        <DropdownMenuItem>Blood needed: O- at City Central</DropdownMenuItem>
                     </>
                 ) : (
                     <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                 )}

                <DropdownMenuSeparator />
                 <DropdownMenuItem asChild>
                    <Link href="/notifications">View All</Link>
                 </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {authItems.map((item) => {
             if (item.element) {
               return <React.Fragment key={item.key}>{item.element}</React.Fragment>;
             }
             return (
                <Button key={item.key} variant={item.href === "/auth/signup" ? "default" : "outline"} size="sm" asChild className={cn(item.label === 'Admin' && 'bg-secondary hover:bg-secondary/80 text-secondary-foreground')}>
                 <Link href={item.href}>
                    {item.icon && <item.icon className="mr-1 h-4 w-4" /> }
                    {item.label}
                  </Link>
                </Button>
             );
           })}
           <ThemeToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden ml-auto flex items-center space-x-2">
           {loading && (
             <>
                <Button variant="ghost" size="icon" disabled className="w-8 h-8 animate-pulse bg-muted rounded-full"></Button>
                <Button variant="ghost" size="icon" disabled className="w-8 h-8 animate-pulse bg-muted rounded-full"></Button>
             </>
           )}
          {isLoggedIn && !loading && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full"> {/* Made icon buttons round */}
                      <Bell className="h-5 w-5" />
                      {notificationCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs rounded-full">
                          {notificationCount}
                        </Badge>
                      )}
                      <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     {notificationCount > 0 ? (
                       <>
                         <DropdownMenuItem>New match for request #123</DropdownMenuItem>
                         <DropdownMenuItem>Campaign "Summer Drive" starting soon</DropdownMenuItem>
                         <DropdownMenuItem>Blood needed: O- at City Central</DropdownMenuItem>
                       </>
                     ) : (
                       <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                     )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/notifications">View All</Link>
                    </DropdownMenuItem>
                 </DropdownMenuContent>
              </DropdownMenu>
           )}
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
               <SheetHeader className="border-b pb-4 mb-4">
                  <SheetTitle>
                    <Link href="/" className="flex items-center justify-center gap-2">
                       <Droplets className="h-6 w-6 text-primary" />
                       <span className="font-bold text-lg">Qatrah Hayat</span> {/* Added name here */}
                    </Link>
                  </SheetTitle>
               </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium">
                {isLoggedIn && !loading && userProfile && (
                  <span className="text-sm text-muted-foreground px-2.5">
                     Hello, {userProfile.firstName || 'User'}!
                  </span>
                )}
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  >
                     <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                 <DropdownMenuSeparator />
                  {mobileAuthItems.map((item) => {
                      if (item.element) {
                          return <div key={item.key} className="w-full">{item.element}</div>;
                      }
                      return (
                          <Link
                              key={item.key}
                              href={item.href}
                              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                          >
                              {item.icon && <item.icon className="h-5 w-5" /> }
                              {item.label}
                          </Link>
                      );
                  })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
