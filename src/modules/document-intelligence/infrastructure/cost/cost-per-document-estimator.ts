export interface CostEstimatorInput {
  averageOcrDurationMs: number;
  averageCpuDurationMs: number;
  averagePipelineDurationMs: number;
  documentCount: number;
}

export interface CostEstimatorPricing {
  ocrCpuUsdPerHour?: number;
  workerCpuUsdPerHour?: number;
  redisUsdPerMillionOps?: number;
  supabaseUsdPerMillionQueries?: number;
}

export interface CostEstimatorReport {
  averageOcrDurationMs: number;
  averageCpuDurationMs: number;
  averagePipelineDurationMs: number;
  estimatedUsdPerDocument: number;
  estimatedUsdPer1000Documents: number;
}

const DEFAULT_PRICING: Required<CostEstimatorPricing> = {
  ocrCpuUsdPerHour: 0.12,
  workerCpuUsdPerHour: 0.08,
  redisUsdPerMillionOps: 0.25,
  supabaseUsdPerMillionQueries: 0.4,
};

export function estimateCostPerDocument(
  input: CostEstimatorInput,
  pricing: CostEstimatorPricing = {},
): CostEstimatorReport {
  const activePricing = { ...DEFAULT_PRICING, ...pricing };
  const ocrHours = input.averageOcrDurationMs / 3_600_000;
  const workerHours = input.averageCpuDurationMs / 3_600_000;

  const computeCost =
    ocrHours * activePricing.ocrCpuUsdPerHour +
    workerHours * activePricing.workerCpuUsdPerHour;

  const infrastructureOverhead =
    activePricing.redisUsdPerMillionOps / 1_000_000 +
    activePricing.supabaseUsdPerMillionQueries / 1_000_000;

  const estimatedUsdPerDocument = round6(computeCost + infrastructureOverhead);

  return {
    averageOcrDurationMs: round2(input.averageOcrDurationMs),
    averageCpuDurationMs: round2(input.averageCpuDurationMs),
    averagePipelineDurationMs: round2(input.averagePipelineDurationMs),
    estimatedUsdPerDocument,
    estimatedUsdPer1000Documents: round4(estimatedUsdPerDocument * 1000),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
