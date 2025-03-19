"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  mobileStack?: boolean;
  mobileReverse?: boolean;
  mobilePadding?: "none" | "sm" | "md" | "lg";
  desktopPadding?: "none" | "sm" | "md" | "lg";
  mobileGap?: "none" | "sm" | "md" | "lg";
  desktopGap?: "none" | "sm" | "md" | "lg";
  mobileFullWidth?: boolean;
  centerContent?: boolean;
}

/**
 * A container component that adjusts its layout based on screen size
 * 
 * @example
 * <ResponsiveContainer mobileStack mobileReverse mobilePadding="sm" desktopPadding="md">
 *   <div>First item</div>
 *   <div>Second item</div>
 * </ResponsiveContainer>
 */
export function ResponsiveContainer({
  children,
  className,
  mobileStack = false,
  mobileReverse = false, 
  mobilePadding = "sm",
  desktopPadding = "md",
  mobileGap = "sm",
  desktopGap = "md",
  mobileFullWidth = true,
  centerContent = false,
  ...props
}: ResponsiveContainerProps) {
  const isMobile = useIsMobile();
  
  const paddingMap = {
    none: "p-0",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  };
  
  const gapMap = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  };

  return (
    <div
      className={cn(
        // Base styles
        "transition-all",
        
        // Direction and stacking
        mobileStack ? "flex flex-col md:flex-row" : "flex flex-row",
        mobileReverse && mobileStack ? "flex-col-reverse md:flex-row" : "",
        
        // Padding
        isMobile ? paddingMap[mobilePadding] : paddingMap[desktopPadding],
        
        // Gap
        isMobile ? gapMap[mobileGap] : gapMap[desktopGap],
        
        // Width
        mobileFullWidth && isMobile ? "w-full" : "",
        
        // Alignment
        centerContent ? "items-center justify-center" : "",
        
        // Additional classes
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A component that shows different content based on screen size
 * 
 * @example
 * <ResponsiveContent
 *   mobileContent={<SimplifiedView />}
 *   desktopContent={<DetailedView />}
 * />
 */
export function ResponsiveContent({
  mobileContent,
  desktopContent,
}: {
  mobileContent: React.ReactNode;
  desktopContent: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  
  return (
    <>
      <div className="md:hidden">{mobileContent}</div>
      <div className="hidden md:block">{desktopContent}</div>
    </>
  );
} 