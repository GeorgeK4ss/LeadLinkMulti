"use client";

import { Suspense, lazy } from 'react';
import { Inter } from "next/font/google";
import './globals.css'
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";
import { MainNav } from '@/components/MainNav';
// import { RealTimeAlerts } from '@/components/monitoring/RealTimeAlerts'
// import { UserFeedback } from '@/components/feedback/UserFeedback'
// import { StructuredData } from '@/components/seo/StructuredData'
// import { ContextHelp } from '@/components/help/ContextHelp'

// Lazy load components for better performance
const AuthProvider = lazy(() => import('@/hooks/useAuth').then(mod => ({ 
  default: mod.AuthProvider 
})));

// Removed RealTimeAlerts
const RealTimeAlerts = lazy(() => import('@/components/monitoring/RealTimeAlerts').then(mod => ({
  default: mod.RealTimeAlerts
})));

const UserFeedback = lazy(() => import('@/components/feedback/UserFeedback').then(mod => ({
  default: mod.UserFeedback
})));

const StructuredData = lazy(() => import('@/components/seo/StructuredData').then(mod => ({ 
  default: mod.StructuredData 
})));

const ContextHelp = lazy(() => import('@/components/help/ContextHelp').then(mod => ({ 
  default: mod.ContextHelp 
})));

// Comment out all initialization services
// import { initializeAnalytics } from '@/lib/analytics-init';
// import { initializePerformance } from '@/lib/performance-init';
// import { initializeAppCheckService } from '@/lib/app-check-init';

const inter = Inter({ subsets: ["latin"] });

// Metadata is now in a separate file: ./metadata.tsx

// Performance monitoring
const PerformanceMonitor = () => {
  if (typeof window !== 'undefined') {
    // Track long tasks
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Log long tasks (potential freezes)
        if (entry.duration > 50) {
          console.warn(`%c🔍 Performance Issue Detected: ${entry.duration.toFixed(2)}ms`, 'color: red; font-weight: bold;');
          console.log('Task details:', entry);
        }
      });
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  }
  
  return null;
};

// Make sure all interactive elements are clickable
const styleTag = `
  /* Debug and fix any overlays */
  body * {
    pointer-events: auto;
  }
  
  /* Ensure z-index hierarchy */
  header, footer, button, a {
    position: relative;
    z-index: 10;
  }
  
  /* Fix any invisible overlays */
  .fixed, .absolute {
    pointer-events: auto;
  }
`;

// Skip any wrappers or delays
export const metadata = {
  title: 'LeadLink - Next.js with Firebase',
  description: 'A modern CRM application built with Next.js and Firebase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <style dangerouslySetInnerHTML={{ __html: styleTag }} />
      </head>
      <body className={`${inter.className} h-full bg-background`}>
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Simplified idle-load script
              console.log('Performance monitoring initialized');
            `,
          }}
        />
        
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            Loading...
          </div>
        }>
          <PerformanceMonitor />
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <MainNav />
              <main className="flex-grow">{children}</main>
              <footer className="bg-gray-100 py-6">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                  &copy; {new Date().getFullYear()} LeadLink. All rights reserved.
                </div>
              </footer>
            </div>
            <Toaster />
            
            {/* Lazy-loaded components */}
            <Suspense fallback={null}>
              <UserFeedback />
            </Suspense>
            
            <Suspense fallback={null}>
              <StructuredData 
                type="organization"
                data={{
                  name: "LeadLink CRM",
                  url: "https://leadlink-crm.com",
                  logo: "https://leadlink-crm.com/logo.png",
                  sameAs: [
                    "https://twitter.com/leadlinkcrm",
                    "https://facebook.com/leadlinkcrm",
                    "https://linkedin.com/company/leadlinkcrm"
                  ]
                }}
              />
            </Suspense>
            
            <Suspense fallback={null}>
              <ContextHelp />
            </Suspense>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  );
} 