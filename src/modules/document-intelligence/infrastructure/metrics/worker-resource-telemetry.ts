import { logger } from "@/lib/logger";

export interface WorkerResourceSample {
  documentId: string;
  result: "processed" | "skipped";
  queueLatencyMs: number;
  ocrDurationMs: number;
  extractionDurationMs: number;
  totalPipelineMs: number;
  cpuDurationMs: number;
  memoryRssBytes: number;
}

export interface WorkerResourcePercentiles {
  p50: number;
  p95: number;
  p99: number;
}

export class WorkerResourceTelemetry {
  private readonly samples: WorkerResourceSample[] = [];

  constructor(private readonly reportEvery = 250) {}

  record(sample: WorkerResourceSample): void {
    this.samples.push(sample);

    if (this.samples.length % this.reportEvery === 0) {
      logger.info("Worker resource telemetry percentile snapshot", {
        operation: "worker.document.metrics.resource_percentiles",
        sampleCount: this.samples.length,
        totalPipelineMs: this.percentiles((item) => item.totalPipelineMs),
        cpuDurationMs: this.percentiles((item) => item.cpuDurationMs),
        memoryRssBytes: this.percentiles((item) => item.memoryRssBytes),
      });
    }
  }

  getSamples(): readonly WorkerResourceSample[] {
    return this.samples;
  }

  private percentiles(
    selector: (sample: WorkerResourceSample) => number,
  ): WorkerResourcePercentiles {
    const values = this.samples.map(selector).sort((a, b) => a - b);
    return {
      p50: pickPercentile(values, 0.5),
      p95: pickPercentile(values, 0.95),
      p99: pickPercentile(values, 0.99),
    };
  }
}

function pickPercentile(values: number[], ratio: number): number {
  if (values.length === 0) {
    return 0;
  }
  const index = Math.min(values.length - 1, Math.floor(values.length * ratio));
  return Math.round(values[index] * 100) / 100;
}
