"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  header: string;
  accessorKey: string;
  cell?: (row: T) => React.ReactNode;
  enableSorting?: boolean;
  enableHiding?: boolean;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyField: keyof T;
  emptyState?: React.ReactNode;
  mobileCardRenderer?: (item: T, columns: ColumnDef<T>[]) => React.ReactNode;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * A responsive table that displays as a normal table on desktop
 * and transforms into cards on mobile for better usability
 */
export function ResponsiveTable<T>({
  data,
  columns,
  keyField,
  emptyState,
  mobileCardRenderer,
  onRowClick,
  isLoading = false,
  className,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Empty state
  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        {emptyState || <p className="text-muted-foreground">No data available</p>}
      </div>
    );
  }
  
  // Mobile card view
  if (isMobile) {
    if (mobileCardRenderer) {
      return (
        <div className="space-y-3">
          {data.map((item) => (
            <div 
              key={String(item[keyField])} 
              onClick={() => onRowClick && onRowClick(item)}
              className={onRowClick ? "cursor-pointer" : ""}
            >
              {mobileCardRenderer(item, columns)}
            </div>
          ))}
        </div>
      );
    }
    
    // Default mobile card view if no custom renderer provided
    return (
      <div className="space-y-3">
        {data.map((item) => (
          <Card 
            key={String(item[keyField])} 
            className="p-4"
            onClick={() => onRowClick && onRowClick(item)}
          >
            <div className="space-y-2">
              {columns
                .filter(col => !col.hideOnMobile)
                .map((column) => (
                  <div key={column.accessorKey} className="flex justify-between items-start">
                    <span className="text-xs font-medium text-muted-foreground">
                      {column.header}
                    </span>
                    <div className="text-sm text-right">
                      {column.cell
                        ? column.cell(item)
                        : (item[column.accessorKey as keyof T] as React.ReactNode)}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }
  
  // Desktop table view
  return (
    <div className={cn("rounded-md border", className)}>
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow 
                key={String(item[keyField])}
                onClick={() => onRowClick && onRowClick(item)}
                className={onRowClick ? "cursor-pointer" : ""}
              >
                {columns.map((column) => (
                  <TableCell key={column.accessorKey}>
                    {column.cell
                      ? column.cell(item)
                      : (item[column.accessorKey as keyof T] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
} 