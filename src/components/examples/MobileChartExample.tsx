"use client";

import React from 'react';
import { MobileBarChart, MobilePieChart, ResponsiveChartContainer, ChartLegend } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Sample data for charts
const salesData = [
  { name: 'Jan', value: 4000, color: '#3498db' },
  { name: 'Feb', value: 3000, color: '#2ecc71' },
  { name: 'Mar', value: 2000, color: '#e74c3c' },
  { name: 'Apr', value: 2780, color: '#f39c12' },
  { name: 'May', value: 1890, color: '#9b59b6' },
  { name: 'Jun', value: 2390, color: '#1abc9c' },
];

const categoryData = [
  { name: 'Electronics', value: 30, color: '#3498db' },
  { name: 'Clothing', value: 25, color: '#2ecc71' },
  { name: 'Home & Kitchen', value: 15, color: '#e74c3c' },
  { name: 'Books', value: 10, color: '#f39c12' },
  { name: 'Beauty', value: 20, color: '#9b59b6' },
];

const platformData = [
  { name: 'Website', value: 45, color: '#3498db' },
  { name: 'Mobile App', value: 35, color: '#2ecc71' },
  { name: 'Marketplace', value: 20, color: '#e74c3c' },
];

/**
 * Example component showing mobile-optimized charts in use
 */
export function MobileChartExample() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = React.useState('sales');
  const [activePieIndex, setActivePieIndex] = React.useState<number | undefined>(undefined);
  
  // Create legend items for pie chart
  const categoryLegendItems = categoryData.map(item => ({
    name: item.name,
    color: item.color,
    value: `$${item.value}k`
  }));

  // Custom formatter for currency values
  const currencyFormatter = (value: number) => `$${value}`;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mobile-Optimized Charts</CardTitle>
          <CardDescription>
            Charts that automatically adapt to different screen sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="sales" className="flex-1">Monthly Sales</TabsTrigger>
              <TabsTrigger value="category" className="flex-1">Categories</TabsTrigger>
              <TabsTrigger value="platform" className="flex-1">Platforms</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              {/* Monthly Sales Bar Chart */}
              {activeTab === 'sales' && (
                <ResponsiveChartContainer 
                  title="Monthly Sales"
                  description="Sales revenue over the last 6 months"
                  height={350}
                  heightMobile={250}
                >
                  <MobileBarChart
                    data={salesData}
                    horizontal={isMobile}
                    showGrid={!isMobile}
                    labelFormatter={currencyFormatter}
                  />
                </ResponsiveChartContainer>
              )}
              
              {/* Product Categories Pie Chart */}
              {activeTab === 'category' && (
                <ResponsiveChartContainer 
                  title="Sales by Category"
                  description="Revenue distribution across product categories"
                  height={350}
                  heightMobile={300}
                  legendContent={<ChartLegend items={categoryLegendItems} />}
                  legendPosition="right"
                >
                  <MobilePieChart
                    data={categoryData}
                    donut={true}
                    valueFormatter={(value) => `$${value}k`}
                    activeIndex={activePieIndex}
                    onActiveIndexChange={setActivePieIndex}
                  />
                </ResponsiveChartContainer>
              )}
              
              {/* Sales Platform Pie Chart */}
              {activeTab === 'platform' && (
                <ResponsiveChartContainer 
                  title="Sales by Platform"
                  description="Revenue distribution across sales platforms"
                  height={350}
                  heightMobile={300}
                >
                  <MobilePieChart
                    data={platformData}
                    valueFormatter={(value) => `${value}%`}
                  />
                </ResponsiveChartContainer>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Example of charts side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResponsiveChartContainer 
          title="Monthly Sales"
          height={300}
          heightMobile={200}
        >
          <MobileBarChart data={salesData} labelFormatter={currencyFormatter} />
        </ResponsiveChartContainer>
        
        <ResponsiveChartContainer 
          title="Sales by Category"
          height={300}
          heightMobile={200}
        >
          <MobilePieChart data={categoryData} valueFormatter={(value) => `$${value}k`} />
        </ResponsiveChartContainer>
      </div>
    </div>
  );
} 