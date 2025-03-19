"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileDown, FileText, Table } from 'lucide-react';
import { exportData, ExportFormat } from '@/lib/exportUtils';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
  onExport?: (format: ExportFormat) => void;
}

export function ExportButton({
  data,
  filename = 'export',
  label = 'Export',
  variant = 'outline',
  size = 'default',
  disabled = false,
  className = '',
  onExport
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  
  const handleExport = (format: ExportFormat) => {
    try {
      exportData(data, format, { filename });
      
      if (onExport) {
        onExport(format);
      }
      
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };
  
  const formatIcons = {
    csv: <Table className="h-4 w-4" />,
    excel: <Table className="h-4 w-4" />,
    pdf: <FileText className="h-4 w-4" />,
    json: <FileDown className="h-4 w-4" />
  };
  
  const formatLabels = {
    csv: 'CSV File (.csv)',
    excel: 'Excel Spreadsheet (.xlsx)',
    pdf: 'PDF Document (.pdf)',
    json: 'JSON File (.json)'
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          disabled={disabled || !data || data.length === 0}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="end">
        <div className="px-4 py-3 border-b">
          <h4 className="font-medium text-sm">Export Options</h4>
          <p className="text-muted-foreground text-xs">Choose export format</p>
        </div>
        <div className="p-4">
          <RadioGroup 
            value={selectedFormat}
            onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
            className="flex flex-col space-y-3"
          >
            {(Object.keys(formatLabels) as ExportFormat[]).map((format) => (
              <div key={format} className="flex items-center space-x-2">
                <RadioGroupItem value={format} id={`format-${format}`} />
                <Label htmlFor={`format-${format}`} className="flex items-center cursor-pointer">
                  <div className="flex items-center mr-2 text-muted-foreground">
                    {formatIcons[format]}
                  </div>
                  <span>{formatLabels[format]}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Separator />
        <div className="p-4 flex justify-end">
          <Button size="sm" onClick={() => handleExport(selectedFormat)}>
            Export Now
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 