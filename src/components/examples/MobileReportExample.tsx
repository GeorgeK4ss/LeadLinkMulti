"use client";

import React from 'react';
import { MobileReportViewer, ReportPage } from '@/components/ui/mobile-report-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Sample report pages for demonstration
const sampleReportPages: ReportPage[] = [
  {
    id: '1',
    imageUrl: 'https://via.placeholder.com/800x1100/f5f5f5/333333?text=Sales+Report+Page+1',
    title: 'Sales Overview - Q1 2024'
  },
  {
    id: '2',
    imageUrl: 'https://via.placeholder.com/800x1100/f5f5f5/333333?text=Sales+Report+Page+2',
    title: 'Regional Performance'
  },
  {
    id: '3',
    imageUrl: 'https://via.placeholder.com/800x1100/f5f5f5/333333?text=Sales+Report+Page+3',
    title: 'Product Category Analysis'
  },
  {
    id: '4',
    imageUrl: 'https://via.placeholder.com/800x1100/f5f5f5/333333?text=Sales+Report+Page+4',
    title: 'Customer Segments'
  },
  {
    id: '5',
    imageUrl: 'https://via.placeholder.com/800x1100/f5f5f5/333333?text=Sales+Report+Page+5',
    title: 'Future Projections'
  }
];

export function MobileReportExample() {
  const { toast } = useToast();
  
  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your report is being prepared for download.",
    });
  };
  
  const handleShare = () => {
    toast({
      title: "Share options",
      description: "Sharing options would appear here in a production environment.",
    });
  };
  
  const handlePageChange = (pageIndex: number) => {
    console.log(`Navigated to page ${pageIndex + 1}`);
  };
  
  return (
    <div className="space-y-8 p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Mobile-Optimized Report Viewer</CardTitle>
          <CardDescription>
            A responsive report viewer that works well on both mobile and desktop devices.
            Try swiping left/right on mobile to navigate between pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MobileReportViewer
            pages={sampleReportPages}
            initialPage={0}
            onPageChange={handlePageChange}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            Key features of the mobile-optimized report viewer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Swipe navigation between pages on mobile devices</li>
            <li>Pinch to zoom functionality (simulated with zoom buttons)</li>
            <li>Thumbnail navigation for quick access to specific pages</li>
            <li>Responsive design that adapts to screen size</li>
            <li>Download and share functionality</li>
            <li>Optimized for touch interactions</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Full Report
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 