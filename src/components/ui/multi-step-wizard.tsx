"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  AlertCircle 
} from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  isOptional?: boolean;
  validationFn?: () => Promise<boolean> | boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface MultiStepWizardProps {
  steps: WizardStep[];
  onComplete: (data: any) => void;
  onCancel?: () => void;
  initialStep?: number;
  className?: string;
  showStepIndicator?: boolean;
  showStepNumbers?: boolean;
  allowSkip?: boolean;
  allowBack?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
  completeButtonText?: string;
  cancelButtonText?: string;
  orientation?: "horizontal" | "vertical";
}

export const MultiStepWizard: React.FC<MultiStepWizardProps> = ({
  steps,
  onComplete,
  onCancel,
  initialStep = 0,
  className = "",
  showStepIndicator = true,
  showStepNumbers = true,
  allowSkip = false,
  allowBack = true,
  nextButtonText = "Next",
  backButtonText = "Back",
  completeButtonText = "Complete",
  cancelButtonText = "Cancel",
  orientation = "horizontal",
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState<Record<string, any>>({});

  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  // Function to update wizard data
  const updateWizardData = (key: string, value: any) => {
    setWizardData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Validate the current step
  const validateStep = useCallback(async () => {
    const step = steps[currentStep];
    
    if (!step.validationFn) {
      return true;
    }

    setIsValidating(true);
    setValidationError(null);
    
    try {
      const isValid = await step.validationFn();
      setCompletedSteps((prev) => ({
        ...prev,
        [step.id]: isValid,
      }));
      return isValid;
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Validation failed');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [currentStep, steps]);

  // Handle next step
  const handleNext = useCallback(async () => {
    const isValid = await validateStep();
    
    if (!isValid) {
      return;
    }
    
    const step = steps[currentStep];
    if (step.onExit) {
      step.onExit();
    }
    
    if (isLastStep) {
      onComplete(wizardData);
      return;
    }
    
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    
    const nextStepData = steps[nextStep];
    if (nextStepData.onEnter) {
      nextStepData.onEnter();
    }
  }, [currentStep, isLastStep, onComplete, steps, validateStep, wizardData]);

  // Handle going back
  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      return;
    }
    
    const step = steps[currentStep];
    if (step.onExit) {
      step.onExit();
    }
    
    const previousStep = currentStep - 1;
    setCurrentStep(previousStep);
    
    const previousStepData = steps[previousStep];
    if (previousStepData.onEnter) {
      previousStepData.onEnter();
    }
  }, [currentStep, steps]);

  // Handle skipping a step
  const handleSkip = useCallback(() => {
    if (isLastStep || !steps[currentStep].isOptional) {
      return;
    }
    
    const step = steps[currentStep];
    if (step.onExit) {
      step.onExit();
    }
    
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    
    const nextStepData = steps[nextStep];
    if (nextStepData.onEnter) {
      nextStepData.onEnter();
    }
  }, [currentStep, isLastStep, steps]);

  // Initialize first step
  useEffect(() => {
    const initialStepData = steps[initialStep];
    if (initialStepData?.onEnter) {
      initialStepData.onEnter();
    }
  }, [initialStep, steps]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        handleNext();
      } else if (e.key === "Backspace" && e.altKey && allowBack) {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleBack, handleNext, allowBack]);

  return (
    <div className={cn("w-full", className)}>
      {/* Step indicator */}
      {showStepIndicator && (
        <div 
          className={cn(
            "flex mb-6 bg-muted/20 p-1 rounded-lg", 
            orientation === "vertical" ? "flex-col" : "flex-row"
          )}
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center",
                orientation === "vertical" ? "mb-2 last:mb-0" : "flex-1",
                index < currentStep 
                  ? "text-primary" 
                  : index === currentStep 
                  ? "text-primary font-medium" 
                  : "text-muted-foreground"
              )}
            >
              <div className="flex items-center justify-center">
                <div 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full mr-2 transition-colors",
                    index < currentStep 
                      ? "bg-primary text-primary-foreground" 
                      : index === currentStep 
                      ? "bg-primary/20 text-primary border border-primary" 
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    showStepNumbers && (index + 1)
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    index === currentStep ? "font-medium" : ""
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && orientation === "horizontal" && (
                <div 
                  className={cn(
                    "flex-1 h-0.5 mx-2", 
                    index < currentStep 
                      ? "bg-primary" 
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="relative">
        {/* Step description */}
        {currentStepData.description && (
          <div className="mb-4 text-sm text-muted-foreground">
            {currentStepData.description}
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Step component */}
        <div className="py-4">
          {React.isValidElement(currentStepData.component)
            ? React.cloneElement(currentStepData.component as React.ReactElement, {
                wizardData,
                updateWizardData,
              })
            : currentStepData.component}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 mt-6 border-t">
        <div>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="mr-2"
            >
              {cancelButtonText}
            </Button>
          )}
          {allowBack && currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center"
              disabled={isValidating}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {backButtonText}
            </Button>
          )}
        </div>
        <div>
          {allowSkip && currentStepData.isOptional && !isLastStep && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="mr-2"
              disabled={isValidating}
            >
              Skip
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={isValidating}
            className="flex items-center"
          >
            {isLastStep ? (
              completeButtonText
            ) : (
              <>
                {nextButtonText}
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MultiStepWizard; 