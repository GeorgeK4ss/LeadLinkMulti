import React from 'react';
import { 
  PieChart as RechartsChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface DataItem {
  name: string;
  value: number;
}

interface PieChartProps {
  data: DataItem[];
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
}

const defaultColors = [
  '#3498db', // blue
  '#2ecc71', // green
  '#e74c3c', // red
  '#f39c12', // yellow
  '#9b59b6', // purple
  '#1abc9c', // teal
  '#d35400', // orange
  '#34495e', // dark blue
  '#16a085', // sea green
  '#c0392b', // dark red
  '#f1c40f', // light yellow
  '#8e44ad', // violet
];

export function PieChart({ 
  data, 
  innerRadius = 0, 
  outerRadius = 80,
  colors = defaultColors 
}: PieChartProps) {
  // Filter out zero values
  const filteredData = data.filter(item => item.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {filteredData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [value, 'Value']} 
          labelFormatter={(name) => `${name}`}
        />
        <Legend />
      </RechartsChart>
    </ResponsiveContainer>
  );
} 