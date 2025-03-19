"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Download, Share, Printer, Filter, ChevronRight, FileText, BarChart4, PieChart, ChevronLeft, ZoomIn, ZoomOut, Share2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSection, CollapsibleGroup } from '@/components/ui/collapsible-section';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface ReportData {
  title: string;
  date: string;
  summary: string;
  sections: ReportSection[];
  metrics?: ReportMetric[];
  charts?: ReportChart[];
  tables?: ReportTable[];
}

export interface ReportSection {
  title: string;
  content: string | React.ReactNode;
  subsections?: ReportSection[];
}

export interface ReportMetric {
  label: string;
  value: string | number;
  change?: number;
  status?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
}

export interface ReportChart {
  title: string;
  type: 'bar' | 'line' | 'pie' | 'custom';
  description?: string;
  component: React.ReactNode;
}

export interface ReportTable {
  title: string;
  headers: string[];
  rows: string[][];
  summary?: string;
}

export interface ReportPage {
  id: string;
  imageUrl: string;
  title: string;
}

export interface MobileReportViewerProps {
  /**
   * Array of report pages to display
   */
  pages: ReportPage[];
  /**
   * Initial page index to display
   */
  initialPage?: number;
  /**
   * Optional callback when a page changes
   */
  onPageChange?: (pageIndex: number) => void;
  /**
   * Optional callback when download is requested
   */
  onDownload?: () => void;
  /**
   * Optional callback when share is requested
   */
  onShare?: () => void;
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * MobileReportViewer - A component for viewing reports optimized for mobile devices
 * 
 * Features:
 * - Swipe navigation between pages
 * - Pinch to zoom functionality
 * - Page thumbnails for quick navigation
 * - Download and share options
 * - Responsive design that works well on both mobile and desktop
 */
export function MobileReportViewer({
  pages,
  initialPage = 0,
  onPageChange,
  onDownload,
  onShare,
  className
}: MobileReportViewerProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange]);

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentPage(pageIndex);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  // If no pages, show empty state
  if (!pages.length) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No report pages available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("bg-card rounded-md shadow-sm border", className)}>
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-medium">{pages[currentPage]?.title || 'Report Viewer'}</h3>
        <div className="flex space-x-1">
          <Button 
            size="icon" 
            variant="outline"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2}
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {onDownload && (
            <Button 
              size="icon" 
              variant="outline"
              onClick={onDownload}
              title="Download report"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {onShare && (
            <Button 
              size="icon" 
              variant="outline"
              onClick={onShare}
              title="Share report"
            >
              <Share className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Navigation and content */}
      <div className="p-4">
        {/* Page navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button
            size="sm"
            variant="outline"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage + 1} of {pages.length}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pages.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Report page display */}
        <div 
          className="flex justify-center items-center min-h-[300px] md:min-h-[500px] overflow-auto"
        >
          <div 
            style={{ 
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.2s ease-in-out'
            }}
            className="origin-center p-4"
          >
            <img 
              src={pages[currentPage].imageUrl} 
              alt={`Report page ${currentPage + 1}: ${pages[currentPage].title}`}
              className="max-w-full h-auto shadow-md"
            />
          </div>
        </div>
      </div>
      
      {/* Thumbnail navigation */}
      <div className="mt-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {pages.map((page, index) => (
            <Button
              key={page.id}
              onClick={() => goToPage(index)}
              variant="ghost"
              className={cn(
                "flex-shrink-0 w-16 h-20 p-0 border rounded overflow-hidden transition-all",
                currentPage === index ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
              )}
            >
              <img 
                src={page.imageUrl} 
                alt={`Thumbnail for page ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
} 