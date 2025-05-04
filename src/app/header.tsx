
"use client";

import * as React from 'react';
import Link from 'next/link';
import { Droplets, UserCircle, HeartHandshake, Search, LogIn, UserPlus, Bell, LayoutDashboard, LogOut } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth'; // Use Supabase-based hook
// Removed direct supabase client import: import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const { user, isAdmin, loading, supabase } = useAuth(); // Get client from hook
  const router = useRouter();
  const { toast } = useToast();

  const isLoggedIn = !!user;
  const notificationCount = isLoggedIn ? 3 : 0; // Placeholder

  const handleLogout = async () => {
     if (!supabase) { // Check if client is available
          toast({ title: "Logout Failed", description: "Authentication service unavailable.", variant: "destructive" });
          return;
     }
    try {
      const { error } = await supabase.auth.signOut(); // Use Supabase signout
      if (error) throw error;
      toast({ title: "Logged out successfully." });
      router.push('/'); // Redirect to home page
      router.refresh(); // Force refresh to update layout state
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
        { key: 'loading1', element: <Button variant="outline" size="sm" disabled className="w-20 h-9 animate-pulse bg-muted"></Button> },
        { key: 'loading2', element: <Button variant="outline" size="sm" disabled className="w-20 h-9 animate-pulse bg-muted"></Button> },
    ];
     mobileAuthItems = [
        { key: 'loading-mobile', element: <div className="h-8 w-full bg-muted rounded animate-pulse"></div> }
     ];

  } else if (isLoggedIn) {
    if (isAdmin) {
      authItems.push({ href: "/dashboard/admin", label: "Admin Panel", icon: LayoutDashboard, key: 'admin-dash' });
       mobileAuthItems.push({ href: "/dashboard/admin", label: "Admin Panel", icon: LayoutDashboard, key: 'admin-dash-mobile' });
    }
    // Always show user dashboard and profile links if logged in
    authItems.push({ href: "/dashboard/user", label: "Dashboard", icon: LayoutDashboard, key: 'user-dash' });
    authItems.push({ href: "/profile", label: "Profile", icon: UserCircle, key: 'profile' });
    authItems.push({ key: 'logout', element: <Button onClick={handleLogout} variant="outline" size="sm"><LogOut className="mr-1 h-4 w-4" /> Logout</Button> });

     mobileAuthItems.push({ href: "/dashboard/user", label: "Dashboard", icon: LayoutDashboard, key: 'user-dash-mobile' });
     mobileAuthItems.push({ href: "/profile", label: "Profile", icon: UserCircle, key: 'profile-mobile' });
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
      <div className="container flex h-14 items-center justify-between">
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

        {/* Desktop Auth, Notification & Theme Buttons */}
        <div className="hidden md:flex items-center space-x-2 ml-auto">
          {isLoggedIn && !loading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="relative">
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
                <Button key={item.key} variant={item.href === "/auth/signup" ? "default" : "outline"} size="sm" asChild>
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
          {isLoggedIn && !loading && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
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
                      <span>Qatrah Hayat Menu</span>
                   </Link>
                 </SheetTitle>
               </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium">
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
```