import Link from "next/link";
import { cn } from "@/lib/utils";
import { Search, FileText } from "lucide-react";

const pathname = "/dashboard/search";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-background p-6 space-y-6">
        <Link
          href="/dashboard/search"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent",
            pathname.includes("/dashboard/search") ? "bg-accent" : "transparent"
          )}
        >
          <Search className="h-4 w-4" />
          Search
        </Link>
        
        <Link
          href="/dashboard/documents"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent",
            pathname.includes("/dashboard/documents") ? "bg-accent" : "transparent"
          )}
        >
          <FileText className="h-4 w-4" />
          Documents
        </Link>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 space-y-6">
        {/* Rest of the component */}
      </main>
    </div>
  );
};

export default DashboardLayout; 