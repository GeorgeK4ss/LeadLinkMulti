import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface LineChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  name: string;
  color?: string;
  strokeWidth?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
}

export function LineChart({
  data,
  xKey,
  yKey,
  name,
  color = '#3498db',
  strokeWidth = 2,
  showGrid = true,
  showTooltip = true,
  showLegend = true
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
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
        <Line
          type="monotone"
          dataKey={yKey}
          name={name}
          stroke={color}
          strokeWidth={strokeWidth}
          activeDot={{ r: 8 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
} 