"use client";

import React, { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ResponsiveChartContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  height?: number | string;
  heightMobile?: number | string;
  className?: string;
  showMobileLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  legendContent?: ReactNode;
  noDataMessage?: string;
  isLoading?: boolean;
}

/**
 * A responsive container for charts that adapts to mobile screens
 * This container handles proper sizing, legends, and empty/loading states
 */
export function ResponsiveChartContainer({
  children,
  title,
  description,
  height = 400,
  heightMobile = 300,
  className,
  showMobileLegend = true,
  legendPosition = 'bottom',
  legendContent,
  noDataMessage = "No data available",
  isLoading = false,
}: ResponsiveChartContainerProps) {
  const isMobile = useIsMobile();
  
  // Calculate the chart height based on device
  const chartHeight = isMobile ? heightMobile : height;
  
  return (
    <div className={cn("rounded-md border bg-card text-card-foreground shadow-sm", className)}>
      {/* Chart header with title and description */}
      {(title || description) && (
        <div className="p-4 pb-0">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      
      {/* Chart content with responsive layout */}
      <div className={cn(
        "flex flex-col",
        legendPosition === 'left' && !isMobile && "md:flex-row",
        legendPosition === 'right' && !isMobile && "md:flex-row-reverse"
      )}>
        {/* Legend on left or top position when not on mobile */}
        {legendContent && !isMobile && (legendPosition === 'left' || legendPosition === 'top') && (
          <div className={cn(
            "p-4 shrink-0",
            legendPosition === 'left' && "md:w-48",
            legendPosition === 'top' && "w-full"
          )}>
            {legendContent}
          </div>
        )}
        
        {/* Chart container */}
        <div className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center" style={{ height: chartHeight }}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div style={{ height: chartHeight }}>
              {children}
            </div>
          )}
        </div>
        
        {/* Legend on right or bottom position when not on mobile */}
        {legendContent && !isMobile && (legendPosition === 'right' || legendPosition === 'bottom') && (
          <div className={cn(
            "p-4 shrink-0",
            legendPosition === 'right' && "md:w-48",
            legendPosition === 'bottom' && "w-full"
          )}>
            {legendContent}
          </div>
        )}
      </div>
      
      {/* Mobile legend (shown at bottom) */}
      {legendContent && isMobile && showMobileLegend && (
        <div className="p-4 pt-0 w-full">
          {legendContent}
        </div>
      )}
    </div>
  );
}

/**
 * A simple legend component to use with ResponsiveChartContainer
 */
export function ChartLegend({ 
  items 
}: { 
  items: { name: string; color: string; value?: string | number }[] 
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm flex-1">{item.name}</span>
          {item.value !== undefined && (
            <span className="text-sm font-medium">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
} 