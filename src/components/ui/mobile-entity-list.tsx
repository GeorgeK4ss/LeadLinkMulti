"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { ChevronRight, Clock, Star, UserCheck, UserPlus } from "lucide-react";
import { ColumnDef as ResponsiveColumnDef } from '@/components/ui/responsive-table';

export type EntityStatus = "new" | "active" | "inactive" | "pending" | "archived";

export interface EntityField {
  key: string;
  label: string;
  render?: (value: any, entity: any) => React.ReactNode;
  sortable?: boolean;
  priority?: "high" | "medium" | "low"; // For mobile view priority
  badge?: boolean;
  format?: "date" | "currency" | "number" | "percentage";
}

export interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick: (entity: any) => void;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive";
  showOnMobile?: boolean;
}

export interface EntityColumnDef<T> {
  id: string;
  header: string;
  accessorKey: string;
  cell?: (props: { row: { original: T } }) => React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  format?: 'date' | 'currency' | 'number' | 'percent';
}

export interface EntityListProps<T> {
  entities: T[];
  columns?: EntityColumnDef<T>[];
  fields?: EntityField[];
  keyField: keyof T | string;
  title?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (entity: T) => void;
  actionButtons?: Array<{
    label: string;
    onClick: (entity: T) => void;
  }>;
  statusField?: string;
  loading?: boolean;
  getEntityBadge?: (entity: T) => React.ReactNode;
  getEntityAvatar?: (entity: T) => React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: (entity: T) => void;
  }>;
}

/**
 * Format values based on the specified format
 */
const formatValue = (value: any, format?: string): string => {
  if (value === null || value === undefined) return "-";
  
  switch (format) {
    case "date":
      return new Date(value).toLocaleDateString();
    case "currency":
      return typeof value === "number" 
        ? `$${value.toFixed(2)}` 
        : value;
    case "number":
      return typeof value === "number" 
        ? value.toLocaleString() 
        : value;
    case "percentage":
      return typeof value === "number" 
        ? `${value}%` 
        : value;
    default:
      return String(value);
  }
};

/**
 * Get status icon based on entity status
 */
const getStatusIcon = (status: EntityStatus): React.ReactNode => {
  switch (status) {
    case "new":
      return <UserPlus className="h-4 w-4 mr-1" />;
    case "active":
      return <UserCheck className="h-4 w-4 mr-1" />;
    case "pending":
      return <Clock className="h-4 w-4 mr-1" />;
    case "inactive":
      return <Star className="h-4 w-4 mr-1" />;
    default:
      return null;
  }
};

/**
 * Get status badge variant based on entity status
 */
const getStatusVariant = (status: EntityStatus): string => {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "active":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "inactive":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    case "archived":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

/**
 * Get value from entity by field key (supports nested keys)
 */
const getEntityValue = (entity: any, key: string): any => {
  const parts = key.split('.');
  return parts.reduce((obj, part) => obj && obj[part] !== undefined ? obj[part] : null, entity);
};

// Add a function to convert from fields to columns if needed
function convertFieldsToColumns<T>(fields?: EntityField[]): EntityColumnDef<T>[] {
  if (!fields) return [];
  
  return fields.map(field => ({
    id: field.key,
    header: field.label,
    accessorKey: field.key,
    priority: field.priority,
    cell: field.render 
      ? ({ row }: { row: { original: T } }) => {
          const value = (row.original as any)[field.key];
          return field.render!(value, row.original);
        }
      : undefined
  }));
}

/**
 * MobileEntityList component - transforms tables into cards on mobile devices
 */
export function MobileEntityList<T>({
  entities,
  columns,
  fields,
  keyField,
  title,
  isLoading = false,
  loading = false, // Support both isLoading and loading props
  emptyMessage = "No items found",
  onRowClick,
  actionButtons,
  statusField = 'status',
  getEntityBadge,
  getEntityAvatar,
  actions,
}: EntityListProps<T>) {
  const isMobile = useIsMobile();
  
  // Convert fields to columns format if columns aren't provided
  const entityColumns = columns || convertFieldsToColumns<T>(fields);
  
  // Render a mobile card
  const renderMobileCard = (entity: T) => {
    const status = entityColumns.find(c => c.accessorKey === statusField)?.cell?.({ row: { original: entity } }) as EntityStatus;
    const entityKey = getEntityValue(entity, keyField as string);
    
    // Get high priority fields for header, and rest for content
    const primaryField = entityColumns.find(c => c.priority === "high");
    const secondaryFields = entityColumns.filter(c => c.priority === "medium");
    const otherFields = entityColumns.filter(c => !c.priority || c.priority === "low");
    
    return (
      <Card 
        key={entityKey} 
        className={cn(
          "mb-3 overflow-hidden transition-all hover:shadow-md",
          onRowClick && "cursor-pointer"
        )}
        onClick={() => onRowClick?.(entity)}
      >
        <CardContent className="p-0">
          {/* Header with avatar, primary field, status */}
          <div className="flex items-center p-4 border-b">
            {primaryField && (
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {primaryField.cell?.({ row: { original: entity } })
                    ? primaryField.cell({ row: { original: entity } })
                    : formatValue(getEntityValue(entity, primaryField.accessorKey), primaryField.format)}
                </div>
              </div>
            )}
            
            <div className="ml-2 flex items-center">
              {status && (
                <Badge 
                  className={cn(
                    getStatusVariant(status),
                    "mr-2 px-2 py-1 text-xs"
                  )}
                >
                  {getStatusIcon(status)}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              )}
              
              {onRowClick && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>
          
          {/* Content with remaining fields */}
          {otherFields.length > 0 && (
            <div className="px-4 py-3 grid grid-cols-2 gap-y-2 text-sm">
              {otherFields.map(field => (
                <div key={field.accessorKey} className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    {field.header}
                  </div>
                  <div>
                    {field.cell?.({ row: { original: entity } })
                      ? field.cell({ row: { original: entity } })
                      : formatValue(getEntityValue(entity, field.accessorKey), field.format)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Actions */}
          {actionButtons && actionButtons.length > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-end space-x-2">
              {actionButtons.map((action, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(entity);
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("text-center py-8")}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  
  // Empty state
  if (!entities.length) {
    return (
      <div className={cn("text-center py-8")}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  
  // Render appropriate view based on device
  return (
    <div className={cn("text-center py-8")}>
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      
      {isMobile ? (
        // Mobile card view
        <div>
          {entities.map(renderMobileCard)}
        </div>
      ) : (
        // Desktop table view using ResponsiveTable
        <ResponsiveTable<T>
          columns={entityColumns.map(field => ({ 
            header: field.header, 
            accessorKey: field.accessorKey,
            cell: field.cell 
              ? (row: T) => field.cell!({ row: { original: row } }) 
              : undefined
          }))}
          data={entities}
          keyField={keyField as any}
          onRowClick={onRowClick}
        />
      )}
    </div>
  );
}

/**
 * Usage Example:
 * 
 * ```tsx
 * <MobileEntityList
 *   entities={customers}
 *   columns={[
 *     { id: 'name', header: 'Name', accessorKey: 'name', priority: 'high' },
 *     { id: 'email', header: 'Email', accessorKey: 'email', priority: 'medium' },
 *     { id: 'phone', header: 'Phone', accessorKey: 'phone', priority: 'medium' },
 *     { id: 'status', header: 'Status', accessorKey: 'status', badge: true },
 *     { id: 'lastContact', header: 'Last Contact', accessorKey: 'lastContact', format: 'date' },
 *     { id: 'totalPurchases', header: 'Purchases', accessorKey: 'totalPurchases', format: 'currency' },
 *   ]}
 *   keyField="id"
 *   title="Customers"
 *   isLoading={false}
 *   emptyMessage="No customers found"
 *   onRowClick={(customer) => router.push(`/customers/${customer.id}`)}
 *   actionButtons={[
 *     { label: 'Edit', onClick: (customer) => console.log('Edit', customer) },
 *     { label: 'Delete', onClick: (customer) => console.log('Delete', customer) },
 *   ]}
 * />
 * ```
 */ 