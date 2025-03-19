import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  barSize?: number;
}

export function BarChart({
  data,
  xKey,
  yKey,
  name,
  color = '#3498db',
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  barSize = 20,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis 
          dataKey={xKey} 
          tick={{ fill: '#888888', fontSize: 12 }}
        />
        <YAxis 
          tick={{ fill: '#888888', fontSize: 12 }}
        />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        <Bar 
          dataKey={yKey} 
          name={name} 
          fill={color} 
          barSize={barSize} 
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
} 