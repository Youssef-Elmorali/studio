"use client";

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EmergencyRequestBadgeProps {
  bloodType: string;
  location: string;
  urgency: 'High' | 'Critical'; // Example levels
  className?: string;
}

export function EmergencyRequestBadge({ bloodType, location, urgency, className }: EmergencyRequestBadgeProps) {
  const urgencyClasses = urgency === 'Critical'
    ? 'bg-destructive text-destructive-foreground animate-pulse' // Use destructive variant for critical
    : 'bg-amber-500 text-white animate-pulse-slow'; // Amber for high urgency, slower pulse

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={urgency === 'Critical' ? 'destructive' : 'secondary'} // Use destructive variant from badge
            className={cn(
              'flex items-center space-x-1 p-2 rounded-full shadow-lg',
               urgency === 'Critical' ? 'animate-pulse' : 'animate-pulse-slow', // Use Tailwind animations defined in globals.css or tailwind.config
               className
            )}
             // Manually set background for High urgency if secondary doesn't fit
             style={urgency === 'High' ? { backgroundColor: '#f59e0b', color: 'white' } : {}}
          >
            <AlertCircle className="h-4 w-4" />
            <span className="font-semibold">{urgency} Urgency:</span>
            <span>{bloodType} needed</span>
            <span className="hidden sm:inline">in {location}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Urgent request for blood type {bloodType} in {location}. Urgency: {urgency}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Add custom animation to tailwind.config.js if needed, or use existing pulse
// tailwind.config.js:
// theme: {
//   extend: {
//     animation: {
//       'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//     }
//   }
// }
