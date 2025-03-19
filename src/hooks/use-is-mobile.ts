"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile-sized
 * @param breakpoint The max width in pixels to consider as mobile (default: 768px)
 * @returns Boolean indicating if the viewport is mobile-sized
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      return;
    }

    // Set initial state
    setIsMobile(window.innerWidth <= breakpoint);

    // Handler to call on window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]); // Re-run effect if breakpoint changes

  return isMobile;
} 