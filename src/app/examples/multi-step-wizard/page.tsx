import { MultiStepWizardExample } from "@/components/examples/MultiStepWizardExample";

export const metadata = {
  title: "Multi-Step Wizard Example | LeadLink",
  description: "Example of a multi-step wizard implementation for complex form workflows"
};

export default function MultiStepWizardPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold">Multi-Step Wizard Component</h1>
        <p className="text-muted-foreground max-w-3xl">
          This component provides a guided, step-by-step user experience for complex workflows.
          It supports validation, data collection across steps, and customizable navigation.
        </p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Registration Example</h2>
        <MultiStepWizardExample />
      </div>
      
      <div className="mt-10 pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Usage Notes</h2>
        <div className="prose prose-sm max-w-3xl">
          <ul>
            <li>Use for complex multi-stage forms (registration, setup wizards, etc.)</li>
            <li>Each step can have its own validation logic</li>
            <li>Supports optional steps that can be skipped</li>
            <li>Maintains state between steps</li>
            <li>Customizable appearance and controls</li>
            <li>Supports both horizontal and vertical layouts</li>
          </ul>
          
          <h3 className="mt-4">Accessibility Considerations</h3>
          <ul>
            <li>Keyboard navigable (Enter to advance, Alt+Backspace to go back)</li>
            <li>Screen reader friendly with appropriate ARIA attributes</li>
            <li>Focus management between steps</li>
            <li>Clear validation messaging</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 