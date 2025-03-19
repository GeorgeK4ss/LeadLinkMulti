"use client";

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Filter types
export type FilterType = 'select' | 'multiSelect' | 'range' | 'dateRange' | 'boolean' | 'search';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  id: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface FilterValues {
  [key: string]: any;
}

// Filter condition for search
export interface FilterCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between';
  value: any;
}

export interface AdvancedSearchProps {
  filters: FilterConfig[];
  onSearch: (searchTerm: string, filters: FilterValues) => void;
  onFilterChange?: (filters: FilterValues) => void;
  className?: string;
  placeholder?: string;
  buttonText?: string;
}

export function AdvancedSearch({
  filters,
  onSearch,
  onFilterChange,
  className,
  placeholder = "Search...",
  buttonText = "Search"
}: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  // Initialize filterValues with default values based on filter configurations
  useEffect(() => {
    const initialValues: FilterValues = {};
    
    filters.forEach(filter => {
      switch (filter.type) {
        case 'select':
          initialValues[filter.id] = '';
          break;
        case 'multiSelect':
          initialValues[filter.id] = [];
          break;
        case 'range':
          initialValues[filter.id] = {
            min: undefined,
            max: undefined
          };
          break;
        case 'dateRange':
          initialValues[filter.id] = {
            start: undefined,
            end: undefined
          };
          break;
        case 'boolean':
          initialValues[filter.id] = false;
          break;
        default:
          break;
      }
    });
    
    setFilterValues(initialValues);
  }, [filters]);
  
  useEffect(() => {
    // Count active filters
    let count = 0;
    
    Object.keys(filterValues).forEach(key => {
      const value = filterValues[key];
      
      if (value === undefined || value === null) return;
      
      if (Array.isArray(value) && value.length > 0) {
        count++;
      } else if (typeof value === 'object' && value !== null) {
        // Check range filters
        if (value.min !== undefined || value.max !== undefined || 
            value.start !== undefined || value.end !== undefined) {
          count++;
        }
      } else if (value !== '' && value !== false) {
        count++;
      }
    });
    
    setActiveFilterCount(count);
    
    // Notify parent component of filter changes
    if (onFilterChange) {
      onFilterChange(filterValues);
    }
  }, [filterValues, onFilterChange]);
  
  const handleSearch = () => {
    onSearch(searchTerm, filterValues);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleFilterChange = (id: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const resetFilters = () => {
    const initialValues: FilterValues = {};
    
    filters.forEach(filter => {
      switch (filter.type) {
        case 'select':
          initialValues[filter.id] = '';
          break;
        case 'multiSelect':
          initialValues[filter.id] = [];
          break;
        case 'range':
          initialValues[filter.id] = {
            min: undefined,
            max: undefined
          };
          break;
        case 'dateRange':
          initialValues[filter.id] = {
            start: undefined,
            end: undefined
          };
          break;
        case 'boolean':
          initialValues[filter.id] = false;
          break;
        default:
          break;
      }
    });
    
    setFilterValues(initialValues);
  };
  
  const renderFilterControl = (filter: FilterConfig) => {
    switch (filter.type) {
      case 'select':
        return (
          <div className="space-y-1">
            <Label htmlFor={filter.id}>{filter.label}</Label>
            <select
              id={filter.id}
              className="w-full py-2 px-3 rounded-md border border-input bg-background"
              value={filterValues[filter.id] || ''}
              onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            >
              <option value="">All</option>
              {filter.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'multiSelect':
        return (
          <div className="space-y-1">
            <Label>{filter.label}</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto p-1">
              {filter.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.id}-${option.value}`}
                    checked={(filterValues[filter.id] || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = [...(filterValues[filter.id] || [])];
                      
                      if (checked) {
                        if (!currentValues.includes(option.value)) {
                          currentValues.push(option.value);
                        }
                      } else {
                        const index = currentValues.indexOf(option.value);
                        if (index !== -1) {
                          currentValues.splice(index, 1);
                        }
                      }
                      
                      handleFilterChange(filter.id, currentValues);
                    }}
                  />
                  <Label 
                    htmlFor={`${filter.id}-${option.value}`}
                    className="cursor-pointer text-sm"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'range':
        return (
          <div className="space-y-1">
            <Label>{filter.label}</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder={`Min ${filter.min !== undefined ? `(${filter.min})` : ''}`}
                value={filterValues[filter.id]?.min || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : Number(e.target.value);
                  handleFilterChange(filter.id, {
                    ...filterValues[filter.id],
                    min: value
                  });
                }}
                className="w-1/2"
              />
              <Input
                type="number"
                placeholder={`Max ${filter.max !== undefined ? `(${filter.max})` : ''}`}
                value={filterValues[filter.id]?.max || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? undefined : Number(e.target.value);
                  handleFilterChange(filter.id, {
                    ...filterValues[filter.id],
                    max: value
                  });
                }}
                className="w-1/2"
              />
            </div>
          </div>
        );
        
      case 'dateRange':
        return (
          <div className="space-y-1">
            <Label>{filter.label}</Label>
            <div className="flex space-x-2">
              <Input
                type="date"
                value={filterValues[filter.id]?.start || ''}
                onChange={(e) => {
                  handleFilterChange(filter.id, {
                    ...filterValues[filter.id],
                    start: e.target.value
                  });
                }}
                className="w-1/2"
              />
              <Input
                type="date"
                value={filterValues[filter.id]?.end || ''}
                onChange={(e) => {
                  handleFilterChange(filter.id, {
                    ...filterValues[filter.id],
                    end: e.target.value
                  });
                }}
                className="w-1/2"
              />
            </div>
          </div>
        );
        
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={filter.id}
              checked={filterValues[filter.id] || false}
              onCheckedChange={(checked) => {
                handleFilterChange(filter.id, !!checked);
              }}
            />
            <Label htmlFor={filter.id} className="cursor-pointer">
              {filter.label}
            </Label>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-4"
          />
        </div>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={activeFilterCount > 0 ? "bg-muted" : ""}
              onClick={() => setIsOpen(!isOpen)}
            >
              Filters
              {activeFilterCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 bg-primary text-primary-foreground"
                >
                  {activeFilterCount}
                </Badge>
              )}
              {isOpen ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filter Options</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  className="h-8 px-2 text-xs"
                >
                  Reset
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {filters.map(filter => (
                  <div key={filter.id} className="space-y-2">
                    {renderFilterControl(filter)}
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    handleSearch();
                    setIsOpen(false);
                  }}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button onClick={handleSearch}>{buttonText}</Button>
      </div>
      
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.keys(filterValues).map(key => {
            const value = filterValues[key];
            const filterConfig = filters.find(f => f.id === key);
            
            if (!filterConfig) return null;
            
            if (Array.isArray(value) && value.length > 0) {
              // Handle multiSelect
              return (
                <Badge key={key} variant="outline" className="bg-muted">
                  {filterConfig.label}: {value.length} selected
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange(key, [])}
                  />
                </Badge>
              );
            } else if (typeof value === 'object' && value !== null) {
              // Handle range and dateRange
              if (value.min !== undefined || value.max !== undefined) {
                return (
                  <Badge key={key} variant="outline" className="bg-muted">
                    {filterConfig.label}: {value.min || '-'} to {value.max || '-'}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange(key, { min: undefined, max: undefined })}
                    />
                  </Badge>
                );
              } else if (value.start || value.end) {
                return (
                  <Badge key={key} variant="outline" className="bg-muted">
                    {filterConfig.label}: {value.start || '-'} to {value.end || '-'}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange(key, { start: undefined, end: undefined })}
                    />
                  </Badge>
                );
              }
            } else if (value === true) {
              // Handle boolean
              return (
                <Badge key={key} variant="outline" className="bg-muted">
                  {filterConfig.label}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange(key, false)}
                  />
                </Badge>
              );
            } else if (value !== '' && value !== false) {
              // Handle select
              const option = filterConfig.options?.find(o => o.value === value);
              return (
                <Badge key={key} variant="outline" className="bg-muted">
                  {filterConfig.label}: {option?.label || value}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange(key, '')}
                  />
                </Badge>
              );
            }
            
            return null;
          })}
          
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={resetFilters}
            >
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 