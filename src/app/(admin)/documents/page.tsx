"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentList } from "@/components/documents/DocumentList";
import DocumentUpload from "@/components/documents/DocumentUpload";
import { PlusCircle, Filter, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DocumentSearchFilters } from "@/types/document";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

export default function DocumentsPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filters, setFilters] = useState<DocumentSearchFilters>({});
  const [activeTab, setActiveTab] = useState("all");
  const isMobile = useIsMobile();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "all") {
      setFilters({});
    } else if (value === "archived") {
      setFilters({ status: "archived" });
    } else {
      setFilters({ category: value as any });
    }
  };

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 px-2 md:px-4">
      {/* Page header - stack vertically on mobile */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Upload, organize, and share documents across your organization
          </p>
        </div>
        <div className="flex gap-2 self-end md:self-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Documents</SheetTitle>
                <SheetDescription>
                  Set filters to find specific documents
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                {/* Filter controls would go here */}
                <p className="text-sm text-muted-foreground py-4">
                  Advanced filtering options will be implemented in a future update.
                </p>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button onClick={() => setIsUploadOpen(true)}>
            {isMobile ? (
              <Plus className="h-4 w-4" />
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2 md:pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription className="hidden md:block">
                Browse and manage your organization's documents
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={handleTabChange}>
            <TabsList className="mb-4 w-full overflow-x-auto flex-wrap md:flex-nowrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="contract">Contracts</TabsTrigger>
              <TabsTrigger value="invoice">Invoices</TabsTrigger>
              <TabsTrigger value="proposal">Proposals</TabsTrigger>
              <TabsTrigger value="report">Reports</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <DocumentList filters={filters} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DocumentUpload
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
} 