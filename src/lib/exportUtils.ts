import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';

// Types
export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  orientation?: 'portrait' | 'landscape';
  extraMetadata?: Record<string, any>;
  dateFormat?: string;
}

const defaultOptions: ExportOptions = {
  filename: `export-${new Date().toISOString().split('T')[0]}`,
  includeHeaders: true,
  orientation: 'portrait',
  dateFormat: 'yyyy-MM-dd'
};

/**
 * Formats dates in the data according to the specified format
 */
const formatDates = (data: any[], dateFormat?: string): any[] => {
  return data.map(item => {
    const formattedItem = { ...item };
    
    // Find date objects or Firebase Timestamps
    Object.keys(formattedItem).forEach(key => {
      const value = formattedItem[key];
      
      // Check for Date objects
      if (value instanceof Date) {
        formattedItem[key] = formatDate(value, dateFormat);
      }
      
      // Check for Firebase Timestamps
      if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
        formattedItem[key] = formatDate(value.toDate(), dateFormat);
      }
    });
    
    return formattedItem;
  });
};

/**
 * Format a date according to the specified format
 */
const formatDate = (date: Date, format = 'yyyy-MM-dd'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('yyyy', year.toString())
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: any[], options: ExportOptions = {}): void => {
  try {
    const opts = { ...defaultOptions, ...options };
    const formattedData = formatDates(data, opts.dateFormat);
    
    const fields = opts.includeHeaders 
      ? Object.keys(formattedData[0] || {}) 
      : undefined;
    
    const parser = new Parser({ fields });
    const csv = parser.parse(formattedData);
    
    downloadFile(csv, `${opts.filename}.csv`, 'text/csv');
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Failed to export data to CSV');
  }
};

/**
 * Export data to Excel format
 */
export const exportToExcel = (data: any[], options: ExportOptions = {}): void => {
  try {
    const opts = { ...defaultOptions, ...options };
    const formattedData = formatDates(data, opts.dateFormat);
    
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Add metadata if provided
    if (opts.extraMetadata) {
      workbook.Props = {
        ...workbook.Props,
        ...opts.extraMetadata
      };
    }
    
    XLSX.writeFile(workbook, `${opts.filename}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw new Error('Failed to export data to Excel');
  }
};

/**
 * Export data to PDF format
 */
export const exportToPDF = (data: any[], options: ExportOptions = {}): void => {
  try {
    const opts = { ...defaultOptions, ...options };
    const formattedData = formatDates(data, opts.dateFormat);
    
    const doc = new jsPDF({
      orientation: opts.orientation,
      unit: 'mm',
      format: 'a4'
    });
    
    // Add metadata
    if (opts.extraMetadata) {
      doc.setProperties({
        title: opts.extraMetadata.title || opts.filename,
        subject: opts.extraMetadata.subject || '',
        author: opts.extraMetadata.author || 'LeadLink CRM',
        keywords: opts.extraMetadata.keywords || '',
        creator: 'LeadLink CRM Export Tool'
      });
    }
    
    // Add title
    doc.setFontSize(16);
    doc.text(opts.extraMetadata?.title || 'Exported Data', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);
    
    // Create the table
    const headers = opts.includeHeaders 
      ? Object.keys(formattedData[0] || {})
      : [];
      
    const rows = formattedData.map(item => Object.values(item));
    
    (doc as any).autoTable({
      head: opts.includeHeaders ? [headers] : undefined,
      body: rows,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255
      }
    });
    
    doc.save(`${opts.filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export data to PDF');
  }
};

/**
 * Export data to JSON format
 */
export const exportToJSON = (data: any[], options: ExportOptions = {}): void => {
  try {
    const opts = { ...defaultOptions, ...options };
    const formattedData = formatDates(data, opts.dateFormat);
    
    const json = JSON.stringify(formattedData, null, 2);
    downloadFile(json, `${opts.filename}.json`, 'application/json');
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw new Error('Failed to export data to JSON');
  }
};

/**
 * Generic export function that delegates to the appropriate format-specific function
 */
export const exportData = (
  data: any[], 
  format: ExportFormat = 'csv', 
  options: ExportOptions = {}
): void => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  switch (format) {
    case 'csv':
      exportToCSV(data, options);
      break;
    case 'excel':
      exportToExcel(data, options);
      break;
    case 'pdf':
      exportToPDF(data, options);
      break;
    case 'json':
      exportToJSON(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Helper function to download the file
 */
const downloadFile = (content: string, filename: string, contentType: string): void => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}; 