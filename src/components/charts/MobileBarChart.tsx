"use client";

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
  Cell,
  TooltipProps
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { NameType, ValueType, Formatter } from 'recharts/types/component/DefaultTooltipContent';

interface DataItem {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

interface MobileBarChartProps {
  data: DataItem[];
  dataKey?: string;
  valueKey?: string;
  colors?: string[];
  showGrid?: boolean;
  horizontal?: boolean;
  simplifiedLabels?: boolean;
  labelFormatter?: (value: number) => string;
  tickFormatter?: (value: number) => string;
  formatLabel?: (label: string) => string;
  tooltipFormatter?: Formatter<ValueType, NameType>;
  hideXAxis?: boolean;
  hideYAxis?: boolean;
}

/**
 * A bar chart component optimized for mobile devices
 * Simplifies display on small screens while maintaining readability
 */
export function MobileBarChart({
  data,
  dataKey = 'name',
  valueKey = 'value',
  colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'],
  showGrid = false,
  horizontal = false,
  simplifiedLabels = true,
  labelFormatter = (value) => value.toString(),
  tickFormatter = (value) => value.toString(),
  formatLabel = (label) => label,
  tooltipFormatter: customTooltipFormatter,
  hideXAxis = false,
  hideYAxis = false,
}: MobileBarChartProps) {
  const isMobile = useIsMobile();

  // Simplify data for mobile if needed
  const processedData = [...data];
  
  // If no data, return message
  if (!processedData || processedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Format axis and reduce clutter for mobile
  const mobileMargin = { top: 10, right: 10, bottom: 40, left: 10 };
  const desktopMargin = { top: 20, right: 30, left: 20, bottom: 20 };
  const margin = isMobile ? mobileMargin : desktopMargin;

  // For horizontal layout (better for mobile)
  const BarComponent = horizontal ? Bar : Bar;
  const layout = horizontal ? 'vertical' : 'horizontal';

  // Automatically truncate labels on mobile
  const getXAxisTickFormatter = (label: string) => {
    if (!isMobile || !simplifiedLabels) return formatLabel(label);
    return label.length > 10 ? `${label.substring(0, 7)}...` : label;
  };

  // Calculate if we need to angle the x-axis labels (for long labels or many bars)
  const shouldAngleLabels = isMobile && (data.length > 4 || data.some(d => 
    typeof d[dataKey] === 'string' && d[dataKey].length > 6));

  // Custom tick component for XAxis
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const label = getXAxisTickFormatter(payload.value);
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={shouldAngleLabels ? 5 : 10}
          textAnchor={shouldAngleLabels ? 'end' : 'middle'}
          fill="#666"
          fontSize={isMobile ? 10 : 12}
          transform={shouldAngleLabels ? 'rotate(-45)' : 'rotate(0)'}
        >
          {label}
        </text>
      </g>
    );
  };

  // Custom tooltip formatter
  const defaultTooltipFormatter = horizontal 
    ? (value: number, name: string): [string, string] => {
        return [`${formatLabel(String(value))}`, name];
      }
    : (value: ValueType, name: NameType): [string, NameType] => {
        return [typeof value === 'number' ? formatLabel(String(value)) : String(value), name];
      };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={processedData}
        margin={margin}
        layout={layout}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={!horizontal} horizontal={horizontal} />}
        
        {!hideXAxis && (
          <XAxis 
            dataKey={dataKey} 
            type="category"
            tick={CustomXAxisTick}
            tickLine={!isMobile}
            axisLine={!isMobile}
            interval={isMobile ? 'preserveStartEnd' : 0}
            minTickGap={isMobile ? 10 : 0}
          />
        )}
        
        {!hideYAxis && (
          <YAxis
            dataKey={horizontal ? dataKey : undefined}
            type={horizontal ? "category" : "number"}
            tickFormatter={horizontal ? getXAxisTickFormatter : tickFormatter}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            width={horizontal ? 80 : 40}
            axisLine={!isMobile}
            tickLine={!isMobile}
          />
        )}
        
        <Tooltip
          formatter={customTooltipFormatter || (defaultTooltipFormatter as Formatter<ValueType, NameType>)}
          labelFormatter={formatLabel}
          contentStyle={{ fontSize: isMobile ? 10 : 12 }}
        />
        
        {!isMobile && <Legend />}
        
        <BarComponent
          dataKey={valueKey}
          isAnimationActive={!isMobile}
          animationDuration={isMobile ? 0 : 500}
          barSize={isMobile ? 15 : 20}
        >
          {processedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || colors[index % colors.length]} 
            />
          ))}
        </BarComponent>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
} 