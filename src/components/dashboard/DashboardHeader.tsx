"use client";

import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Badge } from '@/components/ui/badge';
import { TenantSelector } from '@/components/user/TenantSelector';
import { UserNav } from '@/components/layout/UserNav';
import Link from 'next/link';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DashboardHeaderProps {
  toggleSidebar: () => void;
}

export function DashboardHeader({ toggleSidebar }: DashboardHeaderProps) {
  // Hardcoded notification count for now - will be replaced with real data
  const notificationCount = 3;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <img src="/logo.svg" alt="LeadLink CRM" className="h-6 w-6" />
            <span className="font-bold">LeadLink CRM</span>
          </Link>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="mr-2 md:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex-1">
          <TenantSelector className="hidden md:flex" />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup className="max-h-[300px] overflow-auto">
                <DropdownMenuItem>
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/01.png" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm">
                        <span className="font-medium">John Doe</span>{' '}
                        assigned you a new task
                      </p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/02.png" alt="User" />
                      <AvatarFallback>JS</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm">
                        <span className="font-medium">Jane Smith</span>{' '}
                        commented on your lead
                      </p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/avatars/03.png" alt="User" />
                      <AvatarFallback>RJ</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm">
                        <span className="font-medium">System</span>{' '}
                        Lead status updated to "Qualified"
                      </p>
                      <p className="text-xs text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer justify-center text-center">
                <Link href="/dashboard/notifications">View all notifications</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  );
} 