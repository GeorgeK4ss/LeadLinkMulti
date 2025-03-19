"use client";

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  BarChart2, 
  Settings, 
  Users, 
  LayoutDashboard,
  UserPlus,
  LogOut,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar>
          <SidebarHeader className="border-b border-border px-6 py-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold">LeadLink</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="flex flex-1 flex-col h-full">
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link href="/dashboard" passHref className="w-full">
                    <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                      <span className="flex items-center">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        <span>Dashboard</span>
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/leads" passHref className="w-full">
                    <SidebarMenuButton asChild isActive={pathname === "/leads"}>
                      <span className="flex items-center">
                        <UserPlus className="h-4 w-4 mr-2" />
                        <span>Leads</span>
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/customers" passHref className="w-full">
                    <SidebarMenuButton asChild isActive={pathname === "/customers"}>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>Customers</span>
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/documents" passHref className="w-full">
                    <SidebarMenuButton asChild isActive={pathname === "/documents" || pathname.startsWith("/documents/")}>
                      <span className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Documents</span>
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/reports" passHref className="w-full">
                    <SidebarMenuButton asChild isActive={pathname === "/reports"}>
                      <span className="flex items-center">
                        <BarChart2 className="h-4 w-4 mr-2" />
                        <span>Reports</span>
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/settings" passHref className="w-full">
                    <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                      <span className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        <span>Settings</span>
                      </span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <div className="mt-auto p-4">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SidebarContent>
          <SidebarTrigger />
        </Sidebar>
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
} 