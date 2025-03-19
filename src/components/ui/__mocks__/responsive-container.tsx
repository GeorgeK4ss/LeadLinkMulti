import React from 'react';

// Mock component that just renders children without any responsive behavior
export function ResponsiveContainer({ 
  children, 
  className = "",
  ...props 
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div className={className} data-testid="mock-responsive-container">
      {children}
    </div>
  );
}

export function ResponsiveContent({ 
  desktopContent,
  mobileContent
}: {
  desktopContent: React.ReactNode;
  mobileContent: React.ReactNode;
}) {
  // In tests, always render desktop content
  return <>{desktopContent}</>;
} 