/**
 * ML System Monitoring and Alerting
 * Tracks model performance, drift, and system health
 */

import { createServerClient as createClient } from "@/lib/supabase/server";

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  inferenceCount: number;
  avgLatency: number;
  errorRate: number;
}

interface DriftAlert {
  type: "data_drift" | "concept_drift" | "prediction_drift";
  severity: "low" | "medium" | "high";
  metric: string;
  currentValue: number;
  threshold: number;
  message: string;
}

/**
 * Log ML inference for monitoring
 */
export async function logInference(params: {
  userId: string;
  inferenceId: string;
  merchant: string;
  amount: number;
  predictedCategory: string;
  confidence: number;
  latencyMs: number;
  modelVersion: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("ml_inference_logs").insert({
    user_id: params.userId,
    inference_id: params.inferenceId,
    merchant: params.merchant,
    amount: params.amount,
    predicted_category: params.predictedCategory,
    confidence: params.confidence,
    latency_ms: params.latencyMs,
    model_version: params.modelVersion,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[Log Inference Error]", error);
  }
}

/**
 * Get model performance metrics
 */
export async function getModelMetrics(
  modelVersion: string,
  timeWindowHours: number = 24,
): Promise<ModelMetrics | null> {
  const supabase = await createClient();

  const since = new Date();
  since.setHours(since.getHours() - timeWindowHours);

  // Get inference logs
  const { data: inferences, error: inferenceError } = await supabase
    .from("ml_inference_logs")
    .select("confidence, latency_ms, created_at")
    .eq("model_version", modelVersion)
    .gte("created_at", since.toISOString());

  if (inferenceError || !inferences) {
    console.error("[Get Model Metrics Error]", inferenceError);
    return null;
  }

  // Get corrections (for accuracy calculation)
  const { data: corrections, error: correctionError } = await supabase
    .from("ml_corrections")
    .select("predicted_category, corrected_category")
    .gte("created_at", since.toISOString());

  if (correctionError) {
    console.error("[Get Corrections Error]", correctionError);
  }

  // Calculate metrics
  const inferenceCount = inferences.length;
  const avgLatency =
    inferences.reduce((sum, i) => sum + i.latency_ms, 0) / inferenceCount;
  const avgConfidence =
    inferences.reduce((sum, i) => sum + i.confidence, 0) / inferenceCount;

  // Calculate accuracy from corrections
  const correctionCount = corrections?.length || 0;
  const accuracy =
    correctionCount > 0 ? 1 - correctionCount / inferenceCount : 0.87; // Default to training accuracy

  return {
    accuracy,
    precision: avgConfidence, // Simplified - would need full confusion matrix
    recall: avgConfidence,
    f1Score: avgConfidence,
    inferenceCount,
    avgLatency,
    errorRate: correctionCount / inferenceCount,
  };
}

/**
 * Detect model drift
 */
export async function detectDrift(modelVersion: string): Promise<DriftAlert[]> {
  const supabase = await createClient();
  const alerts: DriftAlert[] = [];

  // Get recent metrics (last 7 days)
  const recentMetrics = await getModelMetrics(modelVersion, 24 * 7);

  // Get baseline metrics (training data)
  const baselineAccuracy = 0.8703;
  const baselineLatency = 200; // ms

  if (!recentMetrics) {
    return alerts;
  }

  // Check concept drift (accuracy degradation)
  if (recentMetrics.accuracy < baselineAccuracy - 0.05) {
    alerts.push({
      type: "concept_drift",
      severity: "high",
      metric: "accuracy",
      currentValue: recentMetrics.accuracy,
      threshold: baselineAccuracy - 0.05,
      message: `Model accuracy dropped to ${(recentMetrics.accuracy * 100).toFixed(1)}% (baseline: ${(baselineAccuracy * 100).toFixed(1)}%)`,
    });
  }

  // Check prediction drift (confidence drop)
  if (recentMetrics.precision < 0.7) {
    alerts.push({
      type: "prediction_drift",
      severity: "medium",
      metric: "confidence",
      currentValue: recentMetrics.precision,
      threshold: 0.7,
      message: `Average prediction confidence dropped to ${(recentMetrics.precision * 100).toFixed(1)}%`,
    });
  }

  // Check latency drift
  if (recentMetrics.avgLatency > baselineLatency * 2) {
    alerts.push({
      type: "data_drift",
      severity: "medium",
      metric: "latency",
      currentValue: recentMetrics.avgLatency,
      threshold: baselineLatency * 2,
      message: `Inference latency increased to ${recentMetrics.avgLatency.toFixed(0)}ms (baseline: ${baselineLatency}ms)`,
    });
  }

  // Check error rate
  if (recentMetrics.errorRate > 0.15) {
    alerts.push({
      type: "concept_drift",
      severity: "high",
      metric: "error_rate",
      currentValue: recentMetrics.errorRate,
      threshold: 0.15,
      message: `Error rate increased to ${(recentMetrics.errorRate * 100).toFixed(1)}%`,
    });
  }

  // Log alerts
  if (alerts.length > 0) {
    for (const alert of alerts) {
      await supabase.from("ml_drift_alerts").insert({
        model_version: modelVersion,
        alert_type: alert.type,
        severity: alert.severity,
        metric: alert.metric,
        current_value: alert.currentValue,
        threshold: alert.threshold,
        message: alert.message,
        created_at: new Date().toISOString(),
      });
    }
  }

  return alerts;
}

/**
 * Get system health status
 */
export async function getSystemHealth(): Promise<{
  status: "healthy" | "degraded" | "critical";
  checks: Array<{
    name: string;
    status: "pass" | "fail";
    message: string;
  }>;
}> {
  const checks: Array<{
    name: string;
    status: "pass" | "fail";
    message: string;
  }> = [];

  // Check ML service availability
  try {
    const response = await fetch("http://localhost:5000/health", {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      checks.push({
        name: "ML Service",
        status: "pass",
        message: "ML inference service is healthy",
      });
    } else {
      checks.push({
        name: "ML Service",
        status: "fail",
        message: "ML inference service returned error",
      });
    }
  } catch (error) {
    checks.push({
      name: "ML Service",
      status: "fail",
      message: "ML inference service is unreachable",
    });
  }

  // Check database connectivity
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("ml_inference_logs")
      .select("id")
      .limit(1);

    if (!error) {
      checks.push({
        name: "Database",
        status: "pass",
        message: "Database is accessible",
      });
    } else {
      checks.push({
        name: "Database",
        status: "fail",
        message: "Database query failed",
      });
    }
  } catch (error) {
    checks.push({
      name: "Database",
      status: "fail",
      message: "Database is unreachable",
    });
  }

  // Check model drift
  const driftAlerts = await detectDrift("1.0.0_20260206_051815");
  const highSeverityAlerts = driftAlerts.filter((a) => a.severity === "high");

  if (highSeverityAlerts.length === 0) {
    checks.push({
      name: "Model Drift",
      status: "pass",
      message: "No high-severity drift detected",
    });
  } else {
    checks.push({
      name: "Model Drift",
      status: "fail",
      message: `${highSeverityAlerts.length} high-severity drift alerts`,
    });
  }

  // Determine overall status
  const failedChecks = checks.filter((c) => c.status === "fail").length;
  let status: "healthy" | "degraded" | "critical";

  if (failedChecks === 0) {
    status = "healthy";
  } else if (failedChecks === 1) {
    status = "degraded";
  } else {
    status = "critical";
  }

  return { status, checks };
}

/**
 * Send alert notification (placeholder for production notification system)
 */
export async function sendAlert(alert: DriftAlert) {
  console.log("[ML Alert]", {
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
  });

  // In production, integrate with:
  // - Email notifications
  // - Slack/Teams webhooks
  // - PagerDuty/Opsgenie
  // - SMS alerts for critical issues
}

/**
 * Run monitoring checks (scheduled job)
 */
export async function runMonitoringChecks() {
  console.log("[ML Monitoring] Running checks...");

  // Check system health
  const health = await getSystemHealth();
  console.log(`[ML Monitoring] System status: ${health.status}`);

  // Check for drift
  const driftAlerts = await detectDrift("1.0.0_20260206_051815");

  if (driftAlerts.length > 0) {
    console.log(`[ML Monitoring] ${driftAlerts.length} drift alerts detected`);

    for (const alert of driftAlerts) {
      if (alert.severity === "high") {
        await sendAlert(alert);
      }
    }
  }

  // Get current metrics
  const metrics = await getModelMetrics("1.0.0_20260206_051815", 24);
  if (metrics) {
    console.log("[ML Monitoring] Metrics:", {
      accuracy: `${(metrics.accuracy * 100).toFixed(1)}%`,
      inferenceCount: metrics.inferenceCount,
      avgLatency: `${metrics.avgLatency.toFixed(0)}ms`,
      errorRate: `${(metrics.errorRate * 100).toFixed(1)}%`,
    });
  }
}
