"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDocuments } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DownloadCloud,
  ArrowLeft,
  Clock,
  FileType,
  Tag,
  Users,
  History,
  Trash,
  Archive,
  Star,
  Pencil,
  MoreVertical,
} from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { formatDistance } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Document, DocumentVersion } from "@/types/document";
import DocumentUpload from "@/components/documents/DocumentUpload";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DocumentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const documentId = Array.isArray(id) ? id[0] : id;
  const isMobile = useIsMobile();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { getDocument, updateDocumentStatus, downloadDocument, updateDocumentStar } = useDocuments();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocument = async () => {
      if (documentId) {
        try {
          const doc = await getDocument(documentId);
          if (doc) {
            setDocument(doc);
          } else {
            router.push("/documents");
            toast({
              title: "Document not found",
              description: "The requested document could not be found.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error fetching document:", error);
          toast({
            title: "Error",
            description: "Failed to load document details.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchDocument();
  }, [documentId, getDocument, router, toast]);

  const handleStatusChange = async (status: 'active' | 'archived' | 'deleted') => {
    if (!document) return;
    
    try {
      await updateDocumentStatus(document.id, status);
      
      if (status === 'deleted') {
        router.push("/documents");
        toast({
          title: "Document deleted",
          description: "The document has been moved to trash.",
        });
      } else {
        toast({
          title: status === 'archived' ? "Document archived" : "Document restored",
          description: `The document has been ${status === 'archived' ? 'archived' : 'restored'}.`,
        });
      }
    } catch (error) {
      console.error(`Error changing document status:`, error);
      toast({
        title: "Action failed",
        description: `Failed to ${status} document.`,
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (version: DocumentVersion) => {
    if (!document) return;
    
    try {
      await downloadDocument(document.id, version.id);
      toast({
        title: "Download started",
        description: "Your document is being downloaded.",
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Download failed",
        description: "Failed to download the document.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStar = async () => {
    if (!document) return;
    
    try {
      await updateDocumentStar(document.id, !document.starred);
      toast({
        title: document.starred ? "Removed from favorites" : "Added to favorites",
        description: document.starred 
          ? "Document removed from favorites." 
          : "Document added to favorites.",
      });
    } catch (error) {
      console.error("Error toggling star:", error);
      toast({
        title: "Action failed",
        description: "Failed to update favorite status.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <h1 className="text-xl font-semibold">Document not found</h1>
        <Button onClick={() => router.push("/documents")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Button>
      </div>
    );
  }

  const currentVersion = document.versions.find(v => v.id === document.currentVersion);

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-2 md:px-4">
      {/* Header with back button and title */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/documents")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{document.name}</h1>
          <Badge variant={document.status === "active" ? "default" : "secondary"}>
            {document.status}
          </Badge>
        </div>
        
        {/* Action buttons - Desktop view */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleStar}
            >
              <Star className={`h-4 w-4 ${document.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </Button>
            {document.status === "active" ? (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("archived")}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleStatusChange("active")}
              >
                <History className="mr-2 h-4 w-4" />
                Restore
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
            {currentVersion && (
              <Button
                onClick={() => handleDownload(currentVersion)}
              >
                <DownloadCloud className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        )}
        
        {/* Action buttons - Mobile view */}
        {isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleToggleStar}>
                <Star className={`h-4 w-4 mr-2 ${document.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                {document.starred ? "Remove star" : "Star document"}
              </DropdownMenuItem>
              {document.status === "active" ? (
                <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                  <History className="h-4 w-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsUploadOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                New Version
              </DropdownMenuItem>
              {currentVersion && (
                <DropdownMenuItem onClick={() => handleDownload(currentVersion)}>
                  <DownloadCloud className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-destructive"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="md:col-span-2 space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">Category</h3>
                  <p className="text-sm">{document.category}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">Permission</h3>
                  <p className="text-sm">{document.permission}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">Created</h3>
                  <p className="text-sm">
                    {document.createdAt instanceof Date
                      ? formatDistance(document.createdAt, new Date(), { addSuffix: true })
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">Updated</h3>
                  <p className="text-sm">
                    {document.updatedAt instanceof Date
                      ? formatDistance(document.updatedAt, new Date(), { addSuffix: true })
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground">Created By</h3>
                  <p className="text-sm">{document.createdBy.name}</p>
                </div>
                {document.entityType && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground">Related To</h3>
                    <p className="text-sm">{document.entityType}</p>
                  </div>
                )}
              </div>
              
              {document.description && (
                <div className="mt-4">
                  <h3 className="text-xs font-medium text-muted-foreground">Description</h3>
                  <p className="mt-1 text-sm">{document.description}</p>
                </div>
              )}
              
              {document.tags && document.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-medium text-muted-foreground">Tags</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {document.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Versions</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setIsUploadOpen(true)}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  <span className="text-xs">Upload New Version</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="space-y-3">
                {document.versions.length === 0 ? (
                  <p className="text-muted-foreground text-sm p-6">No versions available</p>
                ) : (
                  <div className="space-y-3">
                    {document.versions.map((version) => (
                      <div 
                        key={version.id}
                        className={`flex items-center justify-between p-3 rounded-md border ${
                          version.id === document.currentVersion ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileType className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{version.fileName}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {version.uploadedAt instanceof Date
                                  ? formatDistance(version.uploadedAt, new Date(), { addSuffix: true })
                                  : "Unknown"}
                              </span>
                              <span>{formatFileSize(version.fileSize)}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() => handleDownload(version)}
                        >
                          <DownloadCloud className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <FileType className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">File Type</p>
                  <p className="text-xs text-muted-foreground">
                    {currentVersion ? currentVersion.fileType : "Unknown"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Category</p>
                  <p className="text-xs text-muted-foreground">{document.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Visibility</p>
                  <p className="text-xs text-muted-foreground">{document.permission}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Version Count</p>
                  <p className="text-xs text-muted-foreground">{document.versions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upload new version dialog */}
      <DocumentUpload
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        entityId={document.entityId}
        entityType={document.entityType}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleStatusChange("deleted");
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 