"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WidgetWidth = "full" | "half" | "third" | "two-thirds" | "quarter";
type WidgetHeight = "auto" | "small" | "medium" | "large";
type MobilePosition = "top" | "middle" | "bottom" | number;

interface DashboardWidgetProps {
  children: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  desktopWidth?: WidgetWidth;
  mobileWidth?: "full" | "half";
  height?: WidgetHeight;
  mobilePosition?: MobilePosition;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  loading?: boolean;
  actionButton?: React.ReactNode;
}

/**
 * A single dashboard widget component
 */
export function DashboardWidget({
  children,
  title,
  description,
  desktopWidth = "half",
  mobileWidth = "full",
  height = "auto",
  mobilePosition,
  className,
  padding = "md",
  loading = false,
  actionButton,
}: DashboardWidgetProps) {
  const widthClasses = {
    full: "col-span-12",
    half: "col-span-12 md:col-span-6",
    third: "col-span-12 md:col-span-4",
    "two-thirds": "col-span-12 md:col-span-8",
    quarter: "col-span-12 sm:col-span-6 md:col-span-3"
  };

  const mobileWidthClasses = {
    full: "col-span-12",
    half: "col-span-6"
  };
  
  const heightClasses = {
    auto: "h-auto",
    small: "h-[150px]",
    medium: "h-[300px]",
    large: "h-[450px]"
  };
  
  const paddingClasses = {
    none: "p-0",
    sm: "p-2",
    md: "p-4",
    lg: "p-6"
  };
  
  const isMobile = useIsMobile();

  return (
    <div 
      className={cn(
        isMobile ? mobileWidthClasses[mobileWidth] : widthClasses[desktopWidth],
        typeof mobilePosition === 'number' ? `order-[${mobilePosition}]` : mobilePosition ? `order-${mobilePosition}` : '',
        className
      )}
    >
      <Card className="h-full">
        {title && (
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium">{title}</CardTitle>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            {actionButton && (
              <div className="flex-shrink-0">
                {actionButton}
              </div>
            )}
          </CardHeader>
        )}
        <CardContent className={cn(
          heightClasses[height],
          paddingClasses[padding],
          !title && paddingClasses[padding],
          "overflow-auto"
        )}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : children}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * A responsive dashboard layout
 * Automatically arranges widgets based on screen size
 */
export function ResponsiveDashboard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div 
      className={cn(
        "grid grid-cols-12 gap-3 md:gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A dashboard summary cards row
 * Optimized for displaying small metric cards
 */
export function DashboardSummaryCards({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const isMobile = useIsMobile();
  
  return (
    <div 
      className={cn(
        "col-span-12 grid",
        isMobile ? "grid-cols-2 gap-2" : "grid-cols-4 gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A dashboard summary card for displaying a single metric
 */
export function DashboardSummaryCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  loading = false,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
  className?: string;
}) {
  const isMobile = useIsMobile();
  
  const trendColors = {
    up: "text-green-500",
    down: "text-red-500",
    neutral: "text-muted-foreground"
  };
  
  return (
    <Card className={cn("h-full overflow-hidden", className)}>
      <CardContent className={cn(
        "flex flex-col justify-between h-full",
        isMobile ? "p-2" : "p-4"
      )}>
        {loading ? (
          <div className="h-full w-full flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className={cn(
              "flex",
              isMobile ? "mb-1" : "mb-2",
              icon ? "justify-between items-start" : "justify-start"
            )}>
              <p className={cn(
                "font-medium text-muted-foreground",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {title}
              </p>
              {icon && <div className="text-muted-foreground">{icon}</div>}
            </div>
            
            <div>
              <div className={cn(
                "font-semibold",
                isMobile ? "text-lg" : "text-2xl"
              )}>
                {value}
              </div>
              
              {(description || trend) && (
                <div className={cn(
                  "flex items-center",
                  isMobile ? "mt-0.5 text-xs gap-1" : "mt-1 text-sm gap-2"
                )}>
                  {trend && trendValue && (
                    <span className={trendColors[trend]}>{trendValue}</span>
                  )}
                  {description && (
                    <span className={cn(
                      "text-muted-foreground",
                      isMobile ? "text-[10px]" : "text-xs"
                    )}>
                      {description}
                    </span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 