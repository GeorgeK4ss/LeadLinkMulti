"use client";

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
}

export function NotificationBadge({ count, onClick, className }: NotificationBadgeProps) {
  // Don't show a badge for zero notifications
  const showBadge = count > 0;
  
  // Format the count (show 9+ for counts greater than 9)
  const formattedCount = count > 9 ? '9+' : count.toString();
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={onClick} 
      className={cn("relative", className)}
    >
      <Bell className="h-[1.2rem] w-[1.2rem]" />
      {showBadge && (
        <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[0.65rem] font-medium text-white">
          {formattedCount}
        </span>
      )}
    </Button>
  );
} 