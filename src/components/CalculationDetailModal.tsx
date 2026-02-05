'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import type { CalculationHistory } from '@/types/calculation-history';

interface CalculationDetailModalProps {
  calculation: CalculationHistory | null;
  open: boolean;
  onClose: () => void;
  onExportPDF?: () => void;
}

export function CalculationDetailModal({
  calculation,
  open,
  onClose,
  onExportPDF,
}: CalculationDetailModalProps) {
  if (!calculation) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCalculatorName = (type: string) => {
    const names: Record<string, string> = {
      business_tax: 'Business Tax',
      individual_income_tax: 'Individual Income Tax',
      vat: 'VAT',
      capital_allowance: 'Capital Allowances',
      stamp_duty: 'Stamp Duty',
      property_tax: 'Property Tax',
    };
    return names[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{getCalculatorName(calculation.calculation_type)}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(calculation.created_at)}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Parameters */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Input Parameters</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              {Object.entries(calculation.inputs).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-sm">
                    {typeof value === 'number' ? formatCurrency(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Calculation Results</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              {Object.entries(calculation.results).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm font-medium capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-sm font-semibold">
                    {typeof value === 'number' ? formatCurrency(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Calculation Details</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Rule Version:</span>
                <span className="text-sm">{calculation.rule_version_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Confidence Level:</span>
                <span className="text-sm">High</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Data Sources:</span>
                <span className="text-sm">FIRS, EY, KPMG, PwC, Deloitte</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {onExportPDF && (
              <Button onClick={onExportPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
