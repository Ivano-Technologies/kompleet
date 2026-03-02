import { promises as fs } from "node:fs";
import { dirname } from "node:path";
import type { ConfidenceDistributionBucket } from "../../application/ports/metrics.port";

export interface DashboardMetricSummary {
  documentCount: number;
  duplicateRate: number;
  mismatchRate: number;
  recoveryRate: number;
  confidenceDistribution: Record<ConfidenceDistributionBucket, number>;
  averageProcessingTimeMs: number;
}

export async function exportDashboardMetricSummary(
  outputPath: string,
  summary: DashboardMetricSummary,
): Promise<void> {
  await fs.mkdir(dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}
