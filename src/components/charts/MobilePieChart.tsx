"use client";

import React from 'react';
import { 
  PieChart as RechartsChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface DataItem {
  name: string;
  value: number;
  color?: string;
}

interface MobilePieChartProps {
  data: DataItem[];
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
  showLegend?: boolean;
  simplifiedLabels?: boolean;
  valueFormatter?: (value: number) => string;
  percentFormatter?: (percent: number) => string;
  activeIndex?: number;
  onActiveIndexChange?: (index: number | undefined) => void;
  donut?: boolean;
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
];

/**
 * Renders an active shape for the pie chart (when a slice is selected)
 */
const renderActiveShape = (props: any) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value, valueFormatter, percentFormatter
  } = props;

  const formattedValue = valueFormatter ? valueFormatter(value) : value;
  const formattedPercent = percentFormatter ? percentFormatter(percent) : `${(percent * 100).toFixed(0)}%`;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <text x={cx} y={cy - 5} textAnchor="middle" fill="#333" fontSize={12}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" fill="#333" fontSize={12}>
        {formattedValue} ({formattedPercent})
      </text>
    </g>
  );
};

/**
 * A pie chart component optimized for mobile devices
 * Features simplified labels, optimized size, and interactive elements
 */
export function MobilePieChart({ 
  data,
  innerRadius: propInnerRadius,
  outerRadius: propOuterRadius,
  colors = defaultColors,
  showLegend = true,
  simplifiedLabels = true,
  valueFormatter = (value) => value.toString(),
  percentFormatter = (percent) => `${(percent * 100).toFixed(0)}%`,
  activeIndex,
  onActiveIndexChange,
  donut = false
}: MobilePieChartProps) {
  const isMobile = useIsMobile();
  const [localActiveIndex, setLocalActiveIndex] = React.useState<number | undefined>(undefined);
  
  // Use either controlled or uncontrolled active index
  const currentActiveIndex = activeIndex !== undefined ? activeIndex : localActiveIndex;
  
  // Handle click on a pie slice
  const handlePieClick = (data: any, index: number) => {
    const newIndex = currentActiveIndex === index ? undefined : index;
    
    if (onActiveIndexChange) {
      onActiveIndexChange(newIndex);
    } else {
      setLocalActiveIndex(newIndex);
    }
  };
  
  // Filter out zero values
  const filteredData = data.filter(item => item.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }
  
  // Calculate sizes based on mobile or desktop
  const innerRadius = propInnerRadius ?? (donut ? (isMobile ? 45 : 60) : 0);
  const outerRadius = propOuterRadius ?? (isMobile ? 70 : 90);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={!isMobile && currentActiveIndex === undefined}
          label={!isMobile && currentActiveIndex === undefined ? 
            ({ name, percent }) => simplifiedLabels ? 
              `${(percent * 100).toFixed(0)}%` : 
              `${name}: ${percentFormatter(percent)}` : 
            undefined
          }
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
          activeIndex={currentActiveIndex}
          activeShape={(props: any) => renderActiveShape({ 
            ...props, 
            valueFormatter, 
            percentFormatter 
          })}
          onClick={handlePieClick}
        >
          {filteredData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || colors[index % colors.length]}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [valueFormatter(value as number), 'Value']}
          contentStyle={{ fontSize: isMobile ? 10 : 12 }}
        />
        {showLegend && !isMobile && (
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center"
          />
        )}
      </RechartsChart>
    </ResponsiveContainer>
  );
} 