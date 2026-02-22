"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader } from "lucide-react";

interface UploadProgressProps {
  progress: number;
  onCancel?: () => void;
}

type ProgressStep = "uploading" | "unlocking" | "reading" | "preparing";

export default function UploadProgress({
  progress,
  onCancel,
}: UploadProgressProps) {
  const [currentStep, setCurrentStep] = useState<ProgressStep>("uploading");

  // Determine current step based on progress
  useEffect(() => {
    if (progress < 25) {
      setCurrentStep("uploading");
    } else if (progress < 50) {
      setCurrentStep("unlocking");
    } else if (progress < 75) {
      setCurrentStep("reading");
    } else {
      setCurrentStep("preparing");
    }
  }, [progress]);

  const steps: Array<{ id: ProgressStep; label: string }> = [
    { id: "uploading", label: "Uploading file" },
    { id: "unlocking", label: "Unlocking statement" },
    { id: "reading", label: "Reading transactions" },
    { id: "preparing", label: "Preparing your data" },
  ];

  const getStepIcon = (step: ProgressStep) => {
    if (
      steps.findIndex((s) => s.id === step) <
      steps.findIndex((s) => s.id === currentStep)
    ) {
      return (
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      );
    }
    if (step === currentStep) {
      return (
        <Loader className="w-5 h-5 text-green-600 dark:text-green-400 animate-spin" />
      );
    }
    return (
      <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20">
        <div className="p-8 sm:p-12">
          {/* Header */}
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Uploading your statement...
          </h2>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {Math.round(progress)}%
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {getStepIcon(step.id)}
                <span
                  className={`text-sm font-medium ${
                    step.id === currentStep
                      ? "text-slate-900 dark:text-white"
                      : steps.findIndex((s) => s.id === step.id) <
                          steps.findIndex((s) => s.id === currentStep)
                        ? "text-green-600 dark:text-green-400"
                        : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Cancel button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline"
            >
              Cancel
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
