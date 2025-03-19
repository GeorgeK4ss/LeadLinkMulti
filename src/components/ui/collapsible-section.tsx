"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface CollapsibleSectionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  summary?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showBorder?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onToggle?: (isOpen: boolean) => void;
  id?: string;
}

/**
 * CollapsibleSection component for showing/hiding dense information
 * Optimized for both mobile and desktop interfaces
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  summary,
  className,
  headerClassName,
  contentClassName,
  showBorder = true,
  icon,
  iconPosition = 'right',
  onToggle,
  id,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
  const isMobile = useIsMobile();
  const uniqueId = id || `collapsible-${Math.random().toString(36).substring(2, 9)}`;

  // Update content height when content changes or when opened/closed
  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        const height = contentRef.current.scrollHeight;
        setContentHeight(height);
      } else {
        setContentHeight(0);
      }
    }
  }, [isOpen, children]);

  // Handle resize to update content height when window size changes
  useEffect(() => {
    const handleResize = () => {
      if (contentRef.current && isOpen) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (onToggle) {
      onToggle(newIsOpen);
    }
  };

  const chevronIcon = isOpen 
    ? <ChevronUp className="h-4 w-4 transition-transform" /> 
    : <ChevronDown className="h-4 w-4 transition-transform" />;

  return (
    <div className={cn(
      "w-full",
      showBorder && "border rounded-md",
      className
    )}>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen && showBorder && "border-b",
          headerClassName
        )}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={uniqueId}
      >
        <div className={cn(
          "flex items-center gap-2 flex-1",
          iconPosition === 'left' ? 'flex-row' : 'flex-row-reverse justify-end'
        )}>
          {icon || (iconPosition === 'left' && chevronIcon)}
          <div className="flex-1">
            <div className={cn(
              "font-medium",
              isMobile ? "text-base" : "text-sm"
            )}>
              {title}
            </div>
            {summary && !isOpen && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {summary}
              </p>
            )}
          </div>
          {!icon && iconPosition === 'right' && chevronIcon}
        </div>
      </button>
      <div
        id={uniqueId}
        ref={contentRef}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          !isOpen && "visibility-hidden"
        )}
        style={{ maxHeight: contentHeight !== undefined ? `${contentHeight}px` : undefined }}
        aria-hidden={!isOpen}
      >
        <div className={cn("p-4", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * CollapsibleGroup component for grouping related collapsible sections
 * Allows for accordion-like behavior where only one section can be open at a time
 */
export function CollapsibleGroup({
  children,
  className,
  defaultOpenIndex = -1,
  allowMultiple = false,
}: {
  children: React.ReactNode;
  className?: string;
  defaultOpenIndex?: number;
  allowMultiple?: boolean;
}) {
  const [openIndices, setOpenIndices] = useState<number[]>(
    defaultOpenIndex >= 0 ? [defaultOpenIndex] : []
  );

  // Process child elements to add onToggle handlers
  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === CollapsibleSection) {
      return React.cloneElement(child, {
        defaultOpen: openIndices.includes(index),
        onToggle: (isOpen: boolean) => {
          if (child.props.onToggle) {
            child.props.onToggle(isOpen);
          }
          
          if (isOpen) {
            setOpenIndices(prev => 
              allowMultiple 
                ? [...prev, index]
                : [index]
            );
          } else {
            setOpenIndices(prev => prev.filter(i => i !== index));
          }
        },
      } as CollapsibleSectionProps);
    }
    return child;
  });

  return (
    <div className={cn("space-y-2", className)}>
      {childrenWithProps}
    </div>
  );
} 