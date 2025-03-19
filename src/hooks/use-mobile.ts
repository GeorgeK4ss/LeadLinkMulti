"use client";

import { useState, useEffect } from "react";

// Default breakpoint for mobile devices
const DEFAULT_MOBILE_BREAKPOINT = 768;

/**
 * Hook to determine if the current viewport is mobile-sized
 * 
 * @param breakpoint - Optional custom breakpoint in pixels (default: 768px)
 * @returns boolean indicating if the current viewport is mobile-sized
 */
export function useIsMobile(breakpoint: number = DEFAULT_MOBILE_BREAKPOINT): boolean {
  // Default to non-mobile to avoid layout shifts during hydration
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === "undefined") return;

    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Run on mount
    checkMobile();

    // Add event listener for resize
    window.addEventListener("resize", checkMobile);

    // Clean up
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Hook to get viewport dimensions
 * 
 * @returns Object containing viewport width and height
 */
export function useViewportSize() {
  // Initialize with undefined to prevent hydration mismatch
  const [size, setSize] = useState<{ width: number | undefined; height: number | undefined }>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === "undefined") return;

    // Handler to call on window resize
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away to update size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

/**
 * Hook to get predefined breakpoint statuses
 * 
 * @returns Object with boolean values for different breakpoints
 */
export function useBreakpoints() {
  const { width } = useViewportSize();
  
  // Return false for all breakpoints during server-side rendering
  if (typeof width === "undefined") {
    return {
      isMobile: false,      // < 768px
      isTablet: false,      // >= 768px && < 1024px
      isDesktop: false,     // >= 1024px
      isLargeDesktop: false // >= 1280px
    };
  }
  
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLargeDesktop: width >= 1280
  };
} 