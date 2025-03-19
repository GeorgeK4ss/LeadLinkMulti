"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavigationItem = {
  name: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
};

interface ResponsiveNavigationProps {
  items: NavigationItem[];
  logo?: React.ReactNode;
  userMenu?: React.ReactNode;
  mobileHeader?: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveNavigation - Renders a horizontal navigation bar on desktop
 * and a slide-out drawer navigation on mobile
 */
export function ResponsiveNavigation({
  items,
  logo,
  userMenu,
  mobileHeader,
  className,
}: ResponsiveNavigationProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Desktop Navigation
  if (!isMobile) {
    return (
      <div className={cn("flex h-14 items-center border-b px-4", className)}>
        {logo && <div className="flex-shrink-0 mr-4">{logo}</div>}
        
        <nav className="flex items-center space-x-4 flex-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive(item.href) 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.name}
            </Link>
          ))}
        </nav>
        
        {userMenu && <div className="flex-shrink-0 ml-auto">{userMenu}</div>}
      </div>
    );
  }

  // Mobile Navigation
  return (
    <>
      <div className={cn("flex h-14 items-center border-b px-4", className)}>
        {logo && <div className="flex-shrink-0">{logo}</div>}
        
        <div className="flex-1" />
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <SheetHeader>
              <SheetTitle>
                {mobileHeader || "Menu"}
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col py-6">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center py-3 px-2 text-base rounded-md transition-colors",
                    isActive(item.href) 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  {item.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {userMenu && <div className="flex-shrink-0">{userMenu}</div>}
      </div>
    </>
  );
}

/**
 * A mobile-optimized bottom navigation bar
 */
export function MobileBottomNavigation({
  items,
  className,
}: {
  items: NavigationItem[];
  className?: string;
}) {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };
  
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-10 bg-background border-t flex items-center justify-around h-16",
      className
    )}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            isActive(item.href) 
              ? "text-primary" 
              : "text-muted-foreground"
          )}
        >
          {item.icon && <div className="mb-1">{item.icon}</div>}
          <span className="text-xs font-medium">{item.name}</span>
        </Link>
      ))}
    </div>
  );
} 