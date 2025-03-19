"use client";

import React from 'react';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { CollapsibleSection, CollapsibleGroup } from '@/components/ui/collapsible-section';
import { MobileReportViewer, ReportData, ReportPage } from '@/components/ui/mobile-report-viewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart, PieChart, LineChart, DollarSign, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Badge } from '@/components/ui/badge';
import { MobileEntityList } from '@/components/ui/mobile-entity-list';

/**
 * Test component that demonstrates all mobile responsive components
 * This component is intended for visual testing the responsive behavior on various devices
 */
export function ResponsiveComponentsTest() {
  const isMobile = useIsMobile();

  // Sample data for the mobile report viewer
  const sampleReport: ReportData = {
    title: "Mobile Responsive Test Report",
    date: "April 23, 2024",
    summary: "This report tests the responsive layout capabilities of our reporting system.",
    metrics: [
      { 
        label: "Test Metric 1", 
        value: "$1,248,350", 
        change: 12.4, 
        status: "positive",
        icon: <DollarSign className="h-5 w-5 text-green-500" />
      },
      { 
        label: "Test Metric 2", 
        value: "847", 
        change: 8.2, 
        status: "positive",
        icon: <Users className="h-5 w-5 text-blue-500" />
      },
      { 
        label: "Test Metric 3", 
        value: "4,271", 
        change: -5.7, 
        status: "negative",
        icon: <ShoppingCart className="h-5 w-5 text-red-500" />
      },
      { 
        label: "Test Metric 4", 
        value: "$292", 
        change: 0, 
        status: "neutral",
        icon: <TrendingUp className="h-5 w-5 text-gray-500" />
      }
    ],
    sections: [
      {
        title: "Test Section 1",
        content: "This is a test section to demonstrate the display of content in the MobileReportViewer component on both mobile and desktop devices."
      },
      {
        title: "Test Section 2",
        content: "This section tests the collapsible functionality of sections within the mobile report viewer.",
        subsections: [
          {
            title: "Subsection 2.1",
            content: "This is a test subsection to demonstrate nested content."
          },
          {
            title: "Subsection 2.2",
            content: "This is another test subsection to demonstrate multiple nested items."
          }
        ]
      }
    ],
    charts: [
      {
        title: "Test Bar Chart",
        type: "bar",
        description: "This is a test bar chart",
        component: (
          <div className="flex items-center justify-center h-full">
            <BarChart className="h-16 w-16 text-primary opacity-40" />
            <div className="ml-4 text-muted-foreground">
              Bar chart would render here
            </div>
          </div>
        )
      },
      {
        title: "Test Pie Chart",
        type: "pie",
        description: "This is a test pie chart",
        component: (
          <div className="flex items-center justify-center h-full">
            <PieChart className="h-16 w-16 text-primary opacity-40" />
            <div className="ml-4 text-muted-foreground">
              Pie chart would render here
            </div>
          </div>
        )
      }
    ],
    tables: [
      {
        title: "Test Table 1",
        headers: ["Column 1", "Column 2", "Column 3", "Column 4"],
        rows: [
          ["Data 1-1", "Data 1-2", "Data 1-3", "Data 1-4"],
          ["Data 2-1", "Data 2-2", "Data 2-3", "Data 2-4"],
          ["Data 3-1", "Data 3-2", "Data 3-3", "Data 3-4"]
        ],
        summary: "This is a test table to demonstrate responsive table behavior"
      }
    ]
  };

  // Sample data for mobile entity list
  const sampleEntities = [
    { id: 1, name: "Test Customer 1", email: "customer1@example.com", status: "Active", amount: "$1,200" },
    { id: 2, name: "Test Customer 2", email: "customer2@example.com", status: "Inactive", amount: "$850" },
    { id: 3, name: "Test Customer 3", email: "customer3@example.com", status: "Active", amount: "$3,400" },
    { id: 4, name: "Test Customer 4", email: "customer4@example.com", status: "Pending", amount: "$500" },
  ];

  const columns = [
    { id: "name", header: "Name", accessorKey: "name" },
    { id: "email", header: "Email", accessorKey: "email" },
    { id: "status", header: "Status", accessorKey: "status", 
      cell: ({ row }: any) => (
        <Badge className={row.original.status === "Active" ? "bg-green-100 text-green-800" : 
                           row.original.status === "Inactive" ? "bg-red-100 text-red-800" : 
                           "bg-yellow-100 text-yellow-800"}>
          {row.original.status}
        </Badge>
      )
    },
    { id: "amount", header: "Amount", accessorKey: "amount" },
  ];

  // Define sample report pages
  const sampleReportPages: ReportPage[] = [
    {
      id: 'page1',
      imageUrl: '/images/report-page1.png',
      title: 'Sales Overview'
    },
    {
      id: 'page2',
      imageUrl: '/images/report-page2.png',
      title: 'Regional Analysis'
    },
    {
      id: 'page3',
      imageUrl: '/images/report-page3.png',
      title: 'Future Projections'
    }
  ];

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Mobile Responsive Components Test</h1>
      
      <div className="bg-muted p-2 text-center rounded-md">
        <p>Current device: <Badge>{isMobile ? 'Mobile' : 'Desktop'}</Badge></p>
        <p className="text-xs text-muted-foreground mt-1">Resize your window to test responsive behavior</p>
      </div>
      
      <section className="space-y-4" id="responsive-container-test">
        <h2 className="text-xl font-semibold">ResponsiveContainer Test</h2>
        <p className="text-muted-foreground">This component adjusts layout based on screen size</p>
        
        <ResponsiveContainer 
          mobileStack 
          mobileGap="md" 
          desktopGap="lg"
          mobilePadding="sm"
          desktopPadding="md"
          className="border rounded-md"
        >
          <Card className="p-4 h-32 flex items-center justify-center">
            <p>Item 1</p>
          </Card>
          <Card className="p-4 h-32 flex items-center justify-center">
            <p>Item 2</p>
          </Card>
          <Card className="p-4 h-32 flex items-center justify-center">
            <p>Item 3</p>
          </Card>
        </ResponsiveContainer>
      </section>
      
      <section className="space-y-4" id="collapsible-section-test">
        <h2 className="text-xl font-semibold">CollapsibleSection Test</h2>
        <p className="text-muted-foreground">This component provides collapsible sections for dense information</p>
        
        <Card className="p-4">
          <CollapsibleGroup>
            <CollapsibleSection title="Collapsible Section 1" defaultOpen>
              <p className="p-4">This content can be collapsed to save space on mobile devices.</p>
            </CollapsibleSection>
            
            <CollapsibleSection title="Collapsible Section 2">
              <p className="p-4">This is another collapsible section to test multiple sections.</p>
            </CollapsibleSection>
            
            <CollapsibleSection title="Collapsible Section with Subsections">
              <div className="p-4">
                <p className="mb-4">This section contains nested collapsible content.</p>
                
                <CollapsibleGroup>
                  <CollapsibleSection 
                    title="Nested Section 1" 
                    showBorder={false}
                    headerClassName="bg-accent/50 rounded-md p-2"
                  >
                    <p className="p-2">Nested content 1</p>
                  </CollapsibleSection>
                  
                  <CollapsibleSection 
                    title="Nested Section 2"
                    showBorder={false}
                    headerClassName="bg-accent/50 rounded-md p-2"
                  >
                    <p className="p-2">Nested content 2</p>
                  </CollapsibleSection>
                </CollapsibleGroup>
              </div>
            </CollapsibleSection>
          </CollapsibleGroup>
        </Card>
      </section>
      
      <section className="space-y-4" id="mobile-entity-list-test">
        <h2 className="text-xl font-semibold">MobileEntityList Test</h2>
        <p className="text-muted-foreground">This component optimizes entity lists for mobile viewing</p>
        
        <Card className="p-4">
          <MobileEntityList
            entities={sampleEntities}
            columns={columns}
            keyField="id"
            title="Test Entities"
            isLoading={false}
            emptyMessage="No entities found"
            onRowClick={(entity) => console.log("Clicked entity:", entity)}
            actionButtons={[
              { label: "View", onClick: (entity) => console.log("View:", entity) },
              { label: "Edit", onClick: (entity) => console.log("Edit:", entity) }
            ]}
          />
        </Card>
      </section>
      
      <section className="space-y-4" id="mobile-report-viewer-test">
        <h2 className="text-xl font-semibold">MobileReportViewer Test</h2>
        <p className="text-muted-foreground">This component provides a mobile-optimized report viewing experience</p>
        
        <Card className="p-4">
          <MobileReportViewer 
            pages={sampleReportPages}
            onDownload={() => console.log('Download report')}
            onShare={() => console.log('Share report')}
          />
        </Card>
      </section>
      
      <div className="flex justify-center mt-8" id="test-actions">
        <Button variant="outline" className="mr-2" onClick={() => console.log("Test action 1")}>Test Action 1</Button>
        <Button onClick={() => console.log("Test action 2")}>Test Action 2</Button>
      </div>
    </div>
  );
} 