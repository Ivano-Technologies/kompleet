'use client';

import type { ComplianceMetrics } from '@/lib/dashboard/data-aggregation';

interface ComplianceHealthMeterProps {
  data: ComplianceMetrics;
}

export function ComplianceHealthMeter({ data }: ComplianceHealthMeterProps) {
  const { categorizedTransactions, totalTransactions, reconciliationRate, taxReadinessScore } = data;

  // Determine health status and color
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-500', bgColor: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-500' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
    return { label: 'Needs Attention', color: 'text-red-500', bgColor: 'bg-red-500' };
  };

  const healthStatus = getHealthStatus(taxReadinessScore);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
      {/* Circular Progress Meter */}
      <div className="relative w-48 h-48 mb-6">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="16"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            stroke="currentColor"
            strokeWidth="16"
            fill="none"
            strokeDasharray={`${(taxReadinessScore / 100) * 502.4} 502.4`}
            strokeLinecap="round"
            className={healthStatus.color}
          />
        </svg>
        {/* Score in the center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-5xl font-bold ${healthStatus.color}`}>
            {taxReadinessScore}%
          </div>
          <div className="text-sm text-gray-300 mt-1">Tax Readiness</div>
        </div>
      </div>

      {/* Status Label */}
      <div className={`text-2xl font-semibold ${healthStatus.color} mb-6`}>
        {healthStatus.label}
      </div>

      {/* Metrics Grid */}
      <div className="w-full grid grid-cols-2 gap-4">
        <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="text-2xl font-bold text-white">
            {categorizedTransactions}/{totalTransactions}
          </div>
          <div className="text-xs text-gray-400 mt-1">Categorized</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="text-2xl font-bold text-white">
            {reconciliationRate}%
          </div>
          <div className="text-xs text-gray-400 mt-1">Reconciled</div>
        </div>
      </div>

      {/* Action Hint */}
      {taxReadinessScore < 80 && (
        <div className="mt-4 text-xs text-center text-gray-400">
          {taxReadinessScore < 40 
            ? 'Categorize more transactions to improve your score'
            : 'Keep categorizing and reconciling to reach excellent status'}
        </div>
      )}
    </div>
  );
}
