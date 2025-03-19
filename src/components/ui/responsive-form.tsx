"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ResponsiveFormProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveFormSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

interface ResponsiveFormRowProps {
  children: React.ReactNode;
  className?: string;
  stackOnMobile?: boolean;
  reverse?: boolean;
  gap?: "none" | "sm" | "md" | "lg";
}

interface ResponsiveFormItemProps {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  className?: string;
  fullWidth?: boolean;
  required?: boolean;
}

/**
 * ResponsiveForm - Container for form components that adapts to screen size
 */
export function ResponsiveForm({ children, className }: ResponsiveFormProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

/**
 * ResponsiveFormSection - Grouping for related form items
 */
export function ResponsiveFormSection({ 
  children, 
  title, 
  description, 
  className 
}: ResponsiveFormSectionProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className={cn(
              "font-medium",
              isMobile ? "text-base" : "text-lg"
            )}>
              {title}
            </h3>
          )}
          {description && (
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

/**
 * ResponsiveFormRow - Horizontal layout for form items that stacks on mobile if specified
 */
export function ResponsiveFormRow({ 
  children, 
  className, 
  stackOnMobile = true,
  reverse = false,
  gap = "md"
}: ResponsiveFormRowProps) {
  const isMobile = useIsMobile();
  
  const gapClasses = {
    none: "gap-0",
    sm: isMobile ? "gap-2" : "gap-3",
    md: isMobile ? "gap-3" : "gap-4",
    lg: isMobile ? "gap-4" : "gap-6",
  };
  
  const shouldStack = isMobile && stackOnMobile;
  
  return (
    <div className={cn(
      "flex",
      shouldStack ? "flex-col" : "flex-row items-start",
      reverse && !shouldStack && "flex-row-reverse",
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * ResponsiveFormItem - Container for a single form input with label
 */
export function ResponsiveFormItem({ 
  children,
  label,
  description,
  error,
  className,
  fullWidth = false,
  required = false
}: ResponsiveFormItemProps) {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "flex flex-col",
      fullWidth ? "w-full" : "flex-1",
      className
    )}>
      {label && (
        <div className="flex items-baseline justify-between mb-1.5">
          <label className={cn(
            "text-sm font-medium",
            error ? "text-destructive" : "text-foreground"
          )}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        </div>
      )}
      
      {description && (
        <p className={cn(
          "text-muted-foreground mb-1.5",
          isMobile ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
      )}
      
      {children}
      
      {error && (
        <p className="text-xs text-destructive mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * ResponsiveFormActions - Container for form action buttons
 */
export function ResponsiveFormActions({ 
  children, 
  className,
  align = "right" 
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}) {
  const isMobile = useIsMobile();
  
  const alignClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };
  
  return (
    <div className={cn(
      "flex items-center gap-2",
      isMobile ? "flex-col-reverse" : "flex-row",
      isMobile ? "items-stretch" : alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
} 