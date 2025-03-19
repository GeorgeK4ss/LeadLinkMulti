"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Menu, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardHeaderProps {
  className?: string;
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  const { user, tenant } = useAuth();
  const router = useRouter();

  // Toggle sidebar (this would connect to a more complex sidebar system)
  const toggleSidebar = () => {
    // For now, this is just a placeholder
    console.log('Toggle sidebar');
  };

  // Handle notification click
  const handleNotificationClick = () => {
    router.push('/dashboard/notifications');
  };

  // Handle profile click
  const handleProfileClick = () => {
    router.push('/dashboard/profile');
  };

  return (
    <header className={`flex h-16 items-center gap-4 border-b bg-background px-6 ${className}`}>
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="ml-auto flex items-center gap-4">
        {user && tenant && (
          <Link href="/dashboard/notifications" passHref>
            <Button variant="ghost" size="icon" className="relative">
              <NotificationBadge 
                count={3} // This would come from a notification hook in a real implementation
              />
            </Button>
          </Link>
        )}
        <Link href="/dashboard/profile" passHref>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
} 