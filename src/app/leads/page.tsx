import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Leads - LeadLink CRM",
  description: "Manage your leads in LeadLink CRM",
};

export default function LeadsPage() {
  // This would normally fetch from the database
  const leads = [
    { id: 1, name: "John Smith", email: "john@example.com", company: "Acme Inc.", status: "New", date: "2024-04-05" },
    { id: 2, name: "Sarah Johnson", email: "sarah@example.com", company: "TechCorp", status: "Contacted", date: "2024-04-04" },
    { id: 3, name: "Michael Chen", email: "michael@example.com", company: "Startup LLC", status: "Qualified", date: "2024-04-03" },
    { id: 4, name: "Jessica Williams", email: "jessica@example.com", company: "Growth Partners", status: "New", date: "2024-04-02" },
    { id: 5, name: "David Miller", email: "david@example.com", company: "Enterprise Solutions", status: "Contacted", date: "2024-04-01" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Link href="/leads/new">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
          <CardDescription>View and manage all your leads in one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search leads..."
                  className="w-full pl-8"
                />
              </div>
              <Button variant="outline" size="sm">
                Filter
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          lead.status === "New" 
                            ? "bg-blue-100 text-blue-800" 
                            : lead.status === "Contacted" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell>{lead.date}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/leads/${lead.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 