import React from 'react';
import { cn } from '@/lib/utils';

// Keep type definitions for API compatibility
export interface TouchPosition {
  x: number;
  y: number;
}

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface PinchHandlers {
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
}

export interface LongPressHandlers {
  onLongPress?: () => void;
  longPressDelay?: number;
}

export interface DoubleTapHandlers {
  onDoubleTap?: () => void;
  doubleTapDelay?: number;
}

export interface TouchInteractionProps extends 
  React.HTMLAttributes<HTMLDivElement>,
  SwipeHandlers,
  PinchHandlers,
  LongPressHandlers,
  DoubleTapHandlers {
  /**
   * Minimum distance in pixels to trigger a swipe
   */
  swipeThreshold?: number;
  /**
   * Whether to enable touch interactions
   */
  enabled?: boolean;
  /**
   * Whether to prevent default touch events
   */
  preventDefault?: boolean;
  /**
   * Whether to stop propagation of touch events
   */
  stopPropagation?: boolean;
  /**
   * Children to render
   */
  children: React.ReactNode;
}

/**
 * TouchInteraction - DISABLED: Pass-through component with no touch interaction functionality
 */
export function TouchInteraction({
  children,
  className,
  // Unused props
  swipeThreshold,
  enabled,
  preventDefault,
  stopPropagation,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchIn,
  onPinchOut,
  onLongPress,
  onDoubleTap,
  ...props
}: TouchInteractionProps) {
  // Simple pass-through rendering without any event handlers
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

/**
 * SwipeContainer - DISABLED: Pass-through component
 */
export function SwipeContainer({
  children,
  className,
  ...props
}: Omit<TouchInteractionProps, 'onPinchIn' | 'onPinchOut' | 'onLongPress' | 'onDoubleTap'>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

/**
 * PinchZoomContainer - DISABLED: Pass-through component
 */
export function PinchZoomContainer({
  children,
  className,
  ...props
}: Omit<TouchInteractionProps, 'onSwipeLeft' | 'onSwipeRight' | 'onSwipeUp' | 'onSwipeDown' | 'onLongPress' | 'onDoubleTap'>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

/**
 * LongPressContainer - DISABLED: Pass-through component
 */
export function LongPressContainer({
  children,
  className,
  ...props
}: Omit<TouchInteractionProps, 'onSwipeLeft' | 'onSwipeRight' | 'onSwipeUp' | 'onSwipeDown' | 'onPinchIn' | 'onPinchOut' | 'onDoubleTap'>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

/**
 * DoubleTapContainer - DISABLED: Pass-through component
 */
export function DoubleTapContainer({
  children,
  className,
  ...props
}: Omit<TouchInteractionProps, 'onSwipeLeft' | 'onSwipeRight' | 'onSwipeUp' | 'onSwipeDown' | 'onPinchIn' | 'onPinchOut' | 'onLongPress'>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
} 