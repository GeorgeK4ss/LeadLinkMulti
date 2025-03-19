"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDocuments } from "@/hooks/useDocuments";
import { DocumentList } from "@/components/documents/DocumentList";
import DocumentUpload from "@/components/documents/DocumentUpload";
import { 
  FileText, 
  FolderOpen, 
  Archive, 
  Package, 
  FileBadge, 
  Receipt, 
  FileBarChart2, 
  Plus,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentCategory, DocumentStatus } from "@/types/document";

export default function DocumentsPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { documents, stats, loading } = useDocuments();

  const categoryIcons = {
    all: <FileText className="mr-2 h-4 w-4" />,
    general: <FolderOpen className="mr-2 h-4 w-4" />,
    contract: <FileBadge className="mr-2 h-4 w-4" />,
    invoice: <Receipt className="mr-2 h-4 w-4" />,
    proposal: <Package className="mr-2 h-4 w-4" />,
    report: <FileBarChart2 className="mr-2 h-4 w-4" />,
    archived: <Archive className="mr-2 h-4 w-4" />,
  };

  const getFilterByTab = (tab: string) => {
    if (tab === "all") return {};
    if (tab === "archived") return { status: "archived" as DocumentStatus };
    return { category: tab as DocumentCategory };
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Upload, organize, and manage your documents
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Documents"
          value={stats.total}
          icon={<FileText className="h-4 w-4" />}
          loading={loading}
        />
        <StatsCard
          title="Active Documents"
          value={stats.active}
          icon={<FolderOpen className="h-4 w-4" />}
          loading={loading}
        />
        <StatsCard
          title="Archived Documents"
          value={stats.archived}
          icon={<Archive className="h-4 w-4" />}
          loading={loading}
        />
        <StatsCard
          title="Categories"
          value={Object.keys(stats.byCategory || {}).length}
          icon={<Package className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            {categoryIcons.all} All Documents
          </TabsTrigger>
          <TabsTrigger value="general">
            {categoryIcons.general} General
          </TabsTrigger>
          <TabsTrigger value="contract">
            {categoryIcons.contract} Contracts
          </TabsTrigger>
          <TabsTrigger value="invoice">
            {categoryIcons.invoice} Invoices
          </TabsTrigger>
          <TabsTrigger value="proposal">
            {categoryIcons.proposal} Proposals
          </TabsTrigger>
          <TabsTrigger value="report">
            {categoryIcons.report} Reports
          </TabsTrigger>
          <TabsTrigger value="archived">
            {categoryIcons.archived} Archived
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>
                {activeTab === "all"
                  ? "All Documents"
                  : activeTab === "archived"
                  ? "Archived Documents"
                  : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s`}
              </CardTitle>
              <CardDescription>
                {activeTab === "all"
                  ? "All your documents across all categories"
                  : activeTab === "archived"
                  ? "Documents that have been archived"
                  : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} documents and files`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList filters={getFilterByTab(activeTab)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DocumentUpload
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
      />
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatsCard({ title, value, icon, loading = false }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                value.toLocaleString()
              )}
            </h3>
          </div>
          <div className={cn("p-2 rounded-full bg-primary/10")}>
            <div className="text-primary">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 