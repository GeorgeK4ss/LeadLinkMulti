"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { calculateVisibleWindowRange } from "@/lib/performance/data-virtualization";

interface UseVirtualizedListOptions<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

/**
 * Hook for implementing virtualized lists that efficiently render only visible items
 * 
 * @param options Configuration options for the virtualized list
 */
export function useVirtualizedList<T>({
  items,
  itemHeight,
  overscan = 3,
  getItemKey = (_, index) => index,
}: UseVirtualizedListOptions<T>) {
  // Refs for tracking container measurements
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate which items are visible in the current window
  const { startIndex, endIndex, offsetY } = calculateVisibleWindowRange({
    itemCount: items.length,
    itemHeight,
    overscan,
    viewportHeight,
    scrollTop,
  });
  
  // Get just the visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);
  
  // Total height of the content (all items)
  const totalHeight = items.length * itemHeight;
  
  // Update dimensions on resize and scroll
  const measureContainer = useCallback(() => {
    if (containerRef.current) {
      setViewportHeight(containerRef.current.clientHeight);
    }
  }, []);
  
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);
  
  // Set up resize observer and scroll handler
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Measure initially
    measureContainer();
    
    // Add scroll event listener
    const container = containerRef.current;
    container.addEventListener("scroll", handleScroll);
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(measureContainer);
    resizeObserver.observe(container);
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [measureContainer, handleScroll]);
  
  // Generate props for container and content
  const containerProps = {
    ref: containerRef,
    style: { 
      height: "100%", 
      overflow: "auto",
      position: "relative" as const,
    },
  };
  
  const contentProps = {
    style: {
      height: `${totalHeight}px`,
      position: "relative" as const,
      width: "100%",
    },
  };
  
  const itemsContainerProps = {
    style: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: "100%",
      transform: `translateY(${offsetY}px)`,
    },
  };
  
  // Map visible items to include their index and key
  const mappedVisibleItems = visibleItems.map((item, index) => {
    const virtualIndex = startIndex + index;
    return {
      item,
      index: virtualIndex,
      key: getItemKey(item, virtualIndex),
      style: {
        height: `${itemHeight}px`,
        position: "absolute" as const,
        top: `${virtualIndex * itemHeight}px`,
        left: 0,
        width: "100%",
      },
    };
  });
  
  return {
    containerProps,
    contentProps,
    itemsContainerProps,
    visibleItems: mappedVisibleItems,
    startIndex,
    endIndex,
    scrollTo: (index: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    },
    scrollToItem: (index: number, align: "auto" | "start" | "center" | "end" = "auto") => {
      if (!containerRef.current) return;
      
      const top = index * itemHeight;
      const bottom = top + itemHeight;
      
      const containerTop = containerRef.current.scrollTop;
      const containerBottom = containerTop + containerRef.current.clientHeight;
      
      if (align === "start" || (align === "auto" && top < containerTop)) {
        containerRef.current.scrollTop = top;
      } else if (align === "end" || (align === "auto" && bottom > containerBottom)) {
        containerRef.current.scrollTop = bottom - containerRef.current.clientHeight;
      } else if (align === "center") {
        containerRef.current.scrollTop = top - (containerRef.current.clientHeight - itemHeight) / 2;
      }
    },
  };
}

/**
 * Example usage:
 * 
 * const MyVirtualizedList = () => {
 *   const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, text: `Item ${i}` }));
 *   
 *   const {
 *     containerProps,
 *     contentProps,
 *     itemsContainerProps,
 *     visibleItems,
 *     scrollToItem
 *   } = useVirtualizedList({
 *     items,
 *     itemHeight: 50,
 *     getItemKey: (item) => item.id,
 *   });
 *   
 *   return (
 *     <div style={{ height: "500px" }}>
 *       <div {...containerProps}>
 *         <div {...contentProps}>
 *           <div {...itemsContainerProps}>
 *             {visibleItems.map(({ item, key, style }) => (
 *               <div key={key} style={style} className="p-4 border-b">
 *                 {item.text}
 *               </div>
 *             ))}
 *           </div>
 *         </div>
 *       </div>
 *       <button onClick={() => scrollToItem(500, 'center')}>
 *         Jump to item 500
 *       </button>
 *     </div>
 *   );
 * };
 */ 