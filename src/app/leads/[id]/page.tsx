import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, ArrowLeft, PhoneCall, Mail, Calendar } from "lucide-react";
import Link from "next/link";

// Using any as a temporary workaround for the type issue
export default function LeadDetailPage({ params }: any) {
  // This would normally fetch from the database based on the ID
  const lead = {
    id: params.id,
    name: "John Smith",
    email: "john@example.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Inc.",
    position: "Chief Technology Officer",
    status: "New",
    source: "Website Contact Form",
    dateAdded: "April 5, 2024",
    lastContact: "April 6, 2024",
    notes: "John expressed interest in our enterprise plan. Schedule a demo next week.",
    activities: [
      { id: 1, type: "Email", date: "April 6, 2024", description: "Sent initial follow-up email" },
      { id: 2, type: "Note", date: "April 6, 2024", description: "Added to weekly newsletter list" },
      { id: 3, type: "Call", date: "April 5, 2024", description: "Initial contact via phone, discussed basic needs" },
    ],
    tasks: [
      { id: 1, title: "Schedule product demo", dueDate: "April 12, 2024", completed: false },
      { id: 2, title: "Send pricing proposal", dueDate: "April 15, 2024", completed: false },
      { id: 3, title: "Follow up on initial email", dueDate: "April 8, 2024", completed: true },
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/leads">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{lead.name}</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Status</p>
              <div className="flex items-center">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                  {lead.status}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Contact Information</p>
              <div className="text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.email}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <PhoneCall className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Company Information</p>
              <div className="text-sm">
                <p>{lead.company}</p>
                <p className="text-muted-foreground">{lead.position}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Lead Source</p>
              <p className="text-sm">{lead.source}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Important Dates</p>
              <div className="text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Added: </span>
                  <span>{lead.dateAdded}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Contact: </span>
                  <span>{lead.lastContact}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button className="w-full" size="sm">
                <PhoneCall className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button className="w-full" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{lead.notes}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="activities">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="activities" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Activity History</CardTitle>
                    <Button size="sm">
                      Log Activity
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {lead.activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 border-b pb-4 last:border-0 last:pb-0">
                        <div className="bg-primary/10 p-2 rounded-full">
                          {activity.type === "Email" ? (
                            <Mail className="h-4 w-4 text-primary" />
                          ) : activity.type === "Call" ? (
                            <PhoneCall className="h-4 w-4 text-primary" />
                          ) : (
                            <Pencil className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{activity.type}</p>
                            <p className="text-xs text-muted-foreground">{activity.date}</p>
                          </div>
                          <p className="text-sm">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Tasks</CardTitle>
                    <Button size="sm">
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lead.tasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-2 border-b pb-4 last:border-0 last:pb-0">
                        <input 
                          type="checkbox" 
                          defaultChecked={task.completed} 
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="flex flex-1 items-center justify-between">
                          <span className={`text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </span>
                          <span className="text-xs text-muted-foreground">Due: {task.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 