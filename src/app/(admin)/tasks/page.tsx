import { TaskManager } from "@/components/tasks/TaskManager";

export const metadata = {
  title: "Tasks - LeadLink CRM",
  description: "Manage your tasks in LeadLink CRM",
};

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tasks</h1>
      <TaskManager tenantId="default" />
    </div>
  );
} 