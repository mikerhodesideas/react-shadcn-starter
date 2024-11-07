// src/components/ui/steps.tsx
import { ReactNode } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  title: string;
  description: ReactNode;
}

interface StepsProps {
  steps: Step[];
  currentStep?: number;
}

export function Steps({ steps, currentStep = 1 }: StepsProps) {
  return (
    <div className="space-y-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = currentStep > stepNumber;
        const isCurrent = currentStep === stepNumber;
        
        return (
          <div key={index} className="relative">
            {index !== steps.length - 1 && (
              <div 
                className={cn(
                  "absolute left-6 top-16 h-full w-px",
                  isComplete ? "bg-green-500" : "bg-border"
                )}
              />
            )}
            <div className="flex gap-4">
              <div 
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border text-lg font-semibold",
                  isComplete && "border-green-500 bg-green-50 text-green-600",
                  isCurrent && "border-blue-500 bg-blue-50 text-blue-600",
                  !isComplete && !isCurrent && "bg-background"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="space-y-2">
                <h3 className={cn(
                  "text-lg font-semibold",
                  isComplete && "text-green-600",
                  isCurrent && "text-blue-600"
                )}>
                  {step.title}
                </h3>
                <div className={cn(
                  "opacity-100",
                  !isComplete && !isCurrent && "opacity-50"
                )}>
                  {step.description}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}