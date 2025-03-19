"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad" | "onError"> {
  fallbackSrc?: string;
  loadingComponent?: React.ReactNode;
  containerClassName?: string;
  showLoadingEffect?: boolean;
  placeholderColor?: string;
  renderError?: (error: Error) => React.ReactNode;
  onLoadingComplete?: () => void;
}

/**
 * OptimizedImage - A performance-optimized image component with lazy loading,
 * blur placeholders, fallbacks for errors, and smooth loading transitions.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc,
  loadingComponent,
  containerClassName,
  showLoadingEffect = true,
  placeholderColor = "#e2e8f0",
  renderError,
  onLoadingComplete,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [imgSrc, setImgSrc] = useState(src);

  // Reset loading state when src changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setImgSrc(src);
  }, [src]);

  // Handle successful image load
  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
    onLoadingComplete?.();
  };

  // Handle image load error
  const handleError = () => {
    setIsLoading(false);
    
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      // Try fallback image
      setImgSrc(fallbackSrc);
      setError(new Error("Failed to load image, using fallback"));
    } else {
      // No fallback or fallback also failed
      setError(new Error("Failed to load image"));
    }
  };

  // Calculate aspect ratio for placeholder
  const aspectRatio = width && height && typeof width === 'number' && typeof height === 'number' 
    ? width / height 
    : undefined;

  // Generic loading placeholder
  const LoadingPlaceholder = loadingComponent || (
    <div
      className={cn(
        "w-full h-full flex items-center justify-center bg-muted animate-pulse",
        showLoadingEffect && "pulse"
      )}
      style={{ backgroundColor: placeholderColor }}
    >
      {width && height && typeof width === 'number' && typeof height === 'number' && width > 40 && height > 40 && (
        <svg
          className="w-8 h-8 text-muted-foreground"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );

  // Render error state
  if (error && !imgSrc) {
    return renderError ? (
      renderError(error)
    ) : (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/30 border border-muted",
          containerClassName
        )}
        style={{ aspectRatio: aspectRatio }}
      >
        <div className="text-muted-foreground text-sm text-center p-4">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-muted-foreground/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Failed to load image
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10">{LoadingPlaceholder}</div>
      )}

      {/* Actual image with Next.js Image optimization */}
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "transition-opacity duration-300 object-cover",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoadingComplete={handleLoad}
        onError={handleError}
        loading="lazy"
        placeholder="blur"
        blurDataURL={`data:image/svg+xml;base64,${Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${placeholderColor}"/></svg>`
        ).toString("base64")}`}
        {...props}
      />
    </div>
  );
}

/**
 * Example usage:
 * 
 * <OptimizedImage
 *   src="/images/product.jpg"
 *   alt="Product image"
 *   width={400}
 *   height={300}
 *   fallbackSrc="/images/placeholder.jpg"
 *   containerClassName="rounded-lg overflow-hidden"
 *   className="object-cover"
 *   placeholderColor="#f3f4f6"
 * />
 */ 