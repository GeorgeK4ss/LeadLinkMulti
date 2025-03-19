"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home, MoreHorizontal } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface DropdownBreadcrumbItem {
  label: string;
  href: string;
  isDropdown: boolean;
  dropdownItems: BreadcrumbItem[];
}

type BreadcrumbItemType = BreadcrumbItem | DropdownBreadcrumbItem;

interface ResponsiveBreadcrumbProps {
  items: BreadcrumbItem[];
  homeHref?: string;
  className?: string;
  separator?: React.ReactNode;
  maxItems?: number;
  showHomeIcon?: boolean;
}

/**
 * ResponsiveBreadcrumb - A responsive breadcrumb trail that truncates on mobile
 */
export function ResponsiveBreadcrumb({
  items,
  homeHref = "/",
  className,
  separator = <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />,
  maxItems = 3,
  showHomeIcon = true,
}: ResponsiveBreadcrumbProps) {
  const isMobile = useIsMobile();
  
  if (!items.length) {
    return null;
  }

  // For mobile, we want to show just the home icon and current page
  // With a dropdown for all items in between if needed
  if (isMobile) {
    // Always show home and current page
    const homeItem = {
      label: "Home",
      href: homeHref,
      icon: showHomeIcon ? <Home className="h-4 w-4" /> : undefined,
    };
    
    const currentItem = items[items.length - 1];
    
    // If we have in-between items, show a dropdown
    const middleItems = items.slice(0, items.length - 1);
    
    return (
      <nav className={cn("flex items-center text-sm", className)}>
        <ol className="flex items-center">
          {/* Home item */}
          <li className="flex items-center">
            <Link
              href={homeItem.href}
              className="text-muted-foreground hover:text-foreground flex items-center"
            >
              {homeItem.icon || homeItem.label}
              {homeItem.icon && !showHomeIcon && <span className="sr-only">Home</span>}
            </Link>
          </li>
          
          {/* Separator */}
          <li className="flex items-center">{separator}</li>
          
          {/* Middle items dropdown */}
          {middleItems.length > 0 && (
            <>
              <li className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {middleItems.map((item, index) => (
                      <DropdownMenuItem key={index} asChild>
                        <Link href={item.href} className="flex items-center">
                          {item.icon && <span className="mr-2">{item.icon}</span>}
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              
              {/* Separator */}
              <li className="flex items-center">{separator}</li>
            </>
          )}
          
          {/* Current item */}
          <li className="font-medium truncate">
            <span className="truncate max-w-[150px] inline-block">
              {currentItem.label}
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  // Desktop view with truncation
  const displayItems: BreadcrumbItemType[] = items.length <= maxItems
    ? items
    : [
        // Always include first item
        items[0],
        // Show ellipsis dropdown if we have too many items
        ...(items.length > maxItems + 1
          ? [{
              label: "...",
              href: "#",
              isDropdown: true,
              dropdownItems: items.slice(1, items.length - maxItems + 1)
            }]
          : []),
        // Show last N-1 items
        ...items.slice(Math.max(1, items.length - maxItems + 1))
      ];

  const homeItem = {
    label: "Home",
    href: homeHref,
    icon: showHomeIcon ? <Home className="h-4 w-4" /> : undefined,
  };

  return (
    <nav className={cn("flex items-center text-sm", className)}>
      <ol className="flex items-center">
        {/* Home item */}
        <li className="flex items-center">
          <Link
            href={homeItem.href}
            className="text-muted-foreground hover:text-foreground flex items-center"
          >
            {homeItem.icon || homeItem.label}
            {homeItem.icon && showHomeIcon && <span className="sr-only">Home</span>}
          </Link>
        </li>

        {/* Separator */}
        <li className="flex items-center">{separator}</li>

        {/* Display items */}
        {displayItems.map((item, index) => (
          <React.Fragment key={index}>
            <li className="flex items-center">
              {'isDropdown' in item ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {item.dropdownItems.map((dropdownItem, dropdownIndex) => (
                      <DropdownMenuItem key={dropdownIndex} asChild>
                        <Link href={dropdownItem.href} className="flex items-center">
                          {dropdownItem.icon && <span className="mr-2">{dropdownItem.icon}</span>}
                          {dropdownItem.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                index === displayItems.length - 1 ? (
                  <span className="font-medium">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground flex items-center"
                  >
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.label}
                  </Link>
                )
              )}
            </li>

            {/* Add separator if not last item */}
            {index < displayItems.length - 1 && (
              <li className="flex items-center">{separator}</li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
} 