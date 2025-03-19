"use client";

import React, { useState } from "react";
import { MultiStepWizard, WizardStep } from "@/components/ui/multi-step-wizard";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";

// Step 1: Basic Information Component
const BasicInfoStep: React.FC<{
  wizardData?: any;
  updateWizardData?: (key: string, value: any) => void;
}> = ({ wizardData = {}, updateWizardData = () => {} }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            placeholder="John Doe" 
            defaultValue={wizardData.name || ""}
            onChange={(e) => updateWizardData("name", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="john@example.com" 
            defaultValue={wizardData.email || ""}
            onChange={(e) => updateWizardData("email", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            placeholder="(123) 456-7890" 
            defaultValue={wizardData.phone || ""}
            onChange={(e) => updateWizardData("phone", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

// Step 2: Company Information Component
const CompanyInfoStep: React.FC<{
  wizardData?: any;
  updateWizardData?: (key: string, value: any) => void;
}> = ({ wizardData = {}, updateWizardData = () => {} }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="company">Company Name</Label>
          <Input 
            id="company" 
            placeholder="Acme Inc." 
            defaultValue={wizardData.company || ""}
            onChange={(e) => updateWizardData("company", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input 
            id="jobTitle" 
            placeholder="Marketing Manager" 
            defaultValue={wizardData.jobTitle || ""}
            onChange={(e) => updateWizardData("jobTitle", e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="industry">Industry</Label>
          <Select 
            defaultValue={wizardData.industry || ""} 
            onValueChange={(value) => updateWizardData("industry", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

// Step 3: Subscription Preferences Component
const SubscriptionStep: React.FC<{
  wizardData?: any;
  updateWizardData?: (key: string, value: any) => void;
}> = ({ wizardData = {}, updateWizardData = () => {} }) => {
  const planOptions = [
    { id: "basic", name: "Basic", price: "$9.99/month", features: ["Core features", "Email support", "1 project"] },
    { id: "pro", name: "Professional", price: "$19.99/month", features: ["All Basic features", "Priority support", "5 projects", "Advanced analytics"] },
    { id: "enterprise", name: "Enterprise", price: "$49.99/month", features: ["All Pro features", "Dedicated support", "Unlimited projects", "Custom integrations"] }
  ];

  const handlePlanChange = (planId: string) => {
    updateWizardData("plan", planId);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base">Choose a Subscription Plan</Label>
        <RadioGroup 
          defaultValue={wizardData.plan || "basic"} 
          onValueChange={handlePlanChange}
          className="grid gap-4 mt-3"
        >
          {planOptions.map((plan) => (
            <div key={plan.id} className="relative">
              <RadioGroupItem 
                value={plan.id} 
                id={`plan-${plan.id}`} 
                className="absolute top-4 left-4 z-10"
              />
              <Label 
                htmlFor={`plan-${plan.id}`}
                className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${wizardData.plan === plan.id ? "border-primary bg-primary/5" : "border-muted"}`}
              >
                <div className="ml-6">
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-sm text-muted-foreground mb-2">{plan.price}</div>
                  <ul className="text-sm space-y-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <span className="mr-2 text-xs">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
};

// Step 4: Final Confirmation Component
const ConfirmationStep: React.FC<{
  wizardData?: any;
  updateWizardData?: (key: string, value: any) => void;
}> = ({ wizardData = {}, updateWizardData = () => {} }) => {
  const getPlanName = (planId: string) => {
    const plans = {
      "basic": "Basic Plan",
      "pro": "Professional Plan",
      "enterprise": "Enterprise Plan"
    };
    return plans[planId as keyof typeof plans] || planId;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Review Your Information</h3>
      <div className="grid gap-4">
        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-muted-foreground">Personal Information</h4>
          <div className="text-sm">
            <p><strong>Name:</strong> {wizardData.name}</p>
            <p><strong>Email:</strong> {wizardData.email}</p>
            <p><strong>Phone:</strong> {wizardData.phone}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-muted-foreground">Company Information</h4>
          <div className="text-sm">
            <p><strong>Company:</strong> {wizardData.company}</p>
            <p><strong>Job Title:</strong> {wizardData.jobTitle}</p>
            <p><strong>Industry:</strong> {wizardData.industry}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-medium text-muted-foreground">Subscription</h4>
          <div className="text-sm">
            <p><strong>Selected Plan:</strong> {getPlanName(wizardData.plan || "")}</p>
          </div>
        </div>
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              onCheckedChange={(checked) => updateWizardData("termsAccepted", checked)}
            />
            <label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the terms and conditions
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export function MultiStepWizardExample() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const { toast } = useToast();

  // Define the steps for the wizard
  const steps: WizardStep[] = [
    {
      id: "personal-info",
      title: "Personal Information",
      description: "Enter your basic contact information.",
      component: <BasicInfoStep />,
      validationFn: async () => {
        // Simple validation example
        return true;
      }
    },
    {
      id: "company-info",
      title: "Company Details",
      description: "Tell us about your company.",
      component: <CompanyInfoStep />,
      isOptional: true,
    },
    {
      id: "subscription",
      title: "Choose Plan",
      description: "Select a subscription plan that works for you.",
      component: <SubscriptionStep />
    },
    {
      id: "confirmation",
      title: "Confirm",
      description: "Review and confirm your information.",
      component: <ConfirmationStep />,
      validationFn: async () => {
        // Ensure terms are accepted
        return true;
      }
    }
  ];

  const handleComplete = (data: any) => {
    setFormData(data);
    setShowSuccess(true);
    toast({
      title: "Registration Complete!",
      description: "Thank you for completing the registration process.",
    });
  };

  const handleCancel = () => {
    toast({
      title: "Registration Cancelled",
      description: "You've cancelled the registration process.",
      variant: "destructive",
    });
  };

  const handleReset = () => {
    setShowSuccess(false);
    setFormData(null);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="pt-6">
        {!showSuccess ? (
          <MultiStepWizard
            steps={steps}
            onComplete={handleComplete}
            onCancel={handleCancel}
            allowSkip={true}
            showStepNumbers={true}
          />
        ) : (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Registration Complete!</h2>
              <p className="text-muted-foreground">
                Thank you for completing the registration. We've received your information.
              </p>
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/10">
              <h3 className="font-medium mb-2">Submitted Information:</h3>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button onClick={handleReset}>
                Start New Registration
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 