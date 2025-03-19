"use client";

import { useState, useEffect } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentSearchFilters } from "@/types/document";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Search,
  MoreVertical,
  Download,
  Eye,
  Archive,
  Trash,
  Undo2,
  Clock,
  Filter,
  File,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";

interface DocumentListProps {
  filters?: DocumentSearchFilters;
  entityId?: string;
  entityType?: string;
}

export function DocumentList({ filters = {}, entityId, entityType }: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<DocumentSearchFilters>({
    ...filters,
    entityId,
    entityType
  });
  
  const { 
    documents, 
    loading, 
    applyFilters, 
    updateDocumentStatus,
    deleteDocument,
    permanentlyDeleteDocument 
  } = useDocuments();
  
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [filteredDocs, setFilteredDocs] = useState(documents);

  // Apply initial filters and search
  useEffect(() => {
    setAppliedFilters({ ...filters, entityId, entityType });
  }, [filters, entityId, entityType]);

  // Update filtered documents when documents or filters change
  useEffect(() => {
    let filtered = applyFilters(appliedFilters);
    
    // Apply search term client-side
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(term) ||
          doc.description?.toLowerCase().includes(term) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }
    
    setFilteredDocs(filtered);
  }, [documents, appliedFilters, searchTerm, applyFilters]);

  const handleStatusChange = async (documentId: string, status: 'active' | 'archived' | 'deleted') => {
    try {
      await updateDocumentStatus(documentId, status);
      
      toast({
        title: 'Status updated',
        description: `Document has been ${status === 'active' ? 'restored' : status === 'archived' ? 'archived' : 'deleted'}`,
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      toast({
        title: 'Action failed',
        description: 'Failed to update document status',
        variant: 'destructive',
      });
    }
  };

  const handlePermanentDelete = async (documentId: string) => {
    try {
      await permanentlyDeleteDocument(documentId);
      
      toast({
        title: 'Document deleted',
        description: 'Document has been permanently deleted',
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge>Active</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      case 'deleted':
        return <Badge variant="destructive">Deleted</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
      general: "default",
      contract: "destructive",
      invoice: "secondary",
      proposal: "outline",
      report: "secondary",
    };
    
    return (
      <Badge variant={variants[category] || "default"}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center my-8">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 self-end sm:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => setAppliedFilters({ ...appliedFilters, status: 'active' })}
              >
                Active Only
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setAppliedFilters({ ...appliedFilters, status: 'archived' })}
              >
                Archived Only
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setAppliedFilters({ entityId, entityType })}
              >
                Clear Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <Card className="w-full p-8 flex flex-col items-center text-center">
          <div className="rounded-full bg-primary/10 p-3 mb-4">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-medium">No documents found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {searchTerm
              ? "Try adjusting your search term or filters"
              : "Upload some documents to get started"}
          </p>
        </Card>
      ) : isMobile ? (
        // Mobile card view
        <div className="grid grid-cols-1 gap-3">
          {filteredDocs.map((doc) => {
            const currentVersion = doc.versions.find(
              (v) => v.id === doc.currentVersion
            );
            
            return (
              <Card key={doc.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-muted p-2 flex-shrink-0">
                    <File className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate" onClick={() => handleViewDetails(doc.id)}>
                      {doc.name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1 mb-2">
                      {getCategoryBadge(doc.category)}
                      {getStatusBadge(doc.status)}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {new Date(
                          (doc.updatedAt as any)?.toDate?.() || doc.updatedAt
                        ).toLocaleDateString()}
                      </span>
                      {currentVersion && (
                        <>
                          <span className="mx-1">•</span>
                          <span>{formatFileSize(currentVersion.fileSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="cursor-pointer"
                        onClick={() => handleViewDetails(doc.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      {doc.status === 'active' ? (
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleStatusChange(doc.id, 'archived')}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleStatusChange(doc.id, 'active')}
                        >
                          <Undo2 className="h-4 w-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => handleStatusChange(doc.id, 'deleted')}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        // Desktop table view
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Size</TableHead>
                <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.map((doc) => {
                const currentVersion = doc.versions.find(
                  (v) => v.id === doc.currentVersion
                );
                
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      <span 
                        className="cursor-pointer hover:underline" 
                        onClick={() => handleViewDetails(doc.id)}
                      >
                        {doc.name}
                      </span>
                    </TableCell>
                    <TableCell>{getCategoryBadge(doc.category)}</TableCell>
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {currentVersion && formatFileSize(currentVersion.fileSize)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(
                            (doc.updatedAt as any)?.toDate?.() || doc.updatedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleViewDetails(doc.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          {doc.status === 'active' && (
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleStatusChange(doc.id, 'archived')}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {doc.status === 'archived' && (
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleStatusChange(doc.id, 'active')}
                            >
                              <Undo2 className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => handleStatusChange(doc.id, 'deleted')}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 