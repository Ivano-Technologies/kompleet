/**
 * Drift Monitoring Service
 * 
 * Continuous monitoring of model performance in production, detecting
 * data drift, concept drift, and prediction drift with automated alerting.
 * 
 * @module server/ml-governance/drift-monitoring
 */

import { db } from '@/db';
import {
  mlDriftMonitoring,
  mlInferenceLogs,
  mlAuditLogs,
  type NewMLDriftMonitoring,
} from '@/db/schema-ml-governance';
import { eq, and, gte, desc } from 'drizzle-orm';
import ModelRegistryService from './model-registry';

// ============================================================================
// TYPES
// ============================================================================

export interface DriftMetrics {
  dataDriftScore: number; // 0-100
  conceptDriftScore: number; // 0-100
  predictionDriftScore: number; // 0-100
  performanceMetrics: Record<string, number>;
  baselineMetrics: Record<string, number>;
}

export interface DriftAlert {
  modelId: string;
  modelVersion: string;
  alertLevel: 'warning' | 'critical';
  metrics: DriftMetrics;
  timestamp: Date;
  message: string;
}

export interface MonitoringConfig {
  modelId: string;
  modelVersion: string;
  thresholds: {
    dataDriftWarning: number; // 0-100
    dataDriftCritical: number;
    conceptDriftWarning: number;
    conceptDriftCritical: number;
    predictionDriftWarning: number;
    predictionDriftCritical: number;
    accuracyDropWarning: number; // Percentage drop
    accuracyDropCritical: number;
  };
}

// ============================================================================
// DEFAULT THRESHOLDS
// ============================================================================

export const DEFAULT_THRESHOLDS = {
  dataDriftWarning: 30,
  dataDriftCritical: 50,
  conceptDriftWarning: 30,
  conceptDriftCritical: 50,
  predictionDriftWarning: 15,
  predictionDriftCritical: 25,
  accuracyDropWarning: 5, // 5% drop
  accuracyDropCritical: 10, // 10% drop
};

// ============================================================================
// DRIFT MONITORING SERVICE
// ============================================================================

export class DriftMonitoringService {
  /**
   * Calculate drift metrics for a model
   */
  static async calculateDriftMetrics(
    modelId: string,
    modelVersion: string,
    windowHours: number = 24
  ): Promise<DriftMetrics> {
    // Get baseline metrics from model registry
    const model = await ModelRegistryService.getModel(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found.`);
    }

    const baselineMetrics = (model.evaluationMetrics as Record<string, number>) || {};

    // Get recent inference logs
    const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const recentInferences = await db.query.mlInferenceLogs.findMany({
      where: and(
        eq(mlInferenceLogs.modelId, modelId),
        eq(mlInferenceLogs.modelVersion, modelVersion),
        gte(mlInferenceLogs.timestamp, windowStart)
      ),
      orderBy: [desc(mlInferenceLogs.timestamp)],
      limit: 1000,
    });

    if (recentInferences.length === 0) {
      throw new Error('No recent inference data available for drift calculation.');
    }

    // Calculate data drift (input distribution changes)
    const dataDriftScore = this.calculateDataDrift(recentInferences);

    // Calculate concept drift (performance degradation)
    const conceptDriftScore = this.calculateConceptDrift(recentInferences, baselineMetrics);

    // Calculate prediction drift (output distribution changes)
    const predictionDriftScore = this.calculatePredictionDrift(recentInferences);

    // Calculate current performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(recentInferences);

    return {
      dataDriftScore,
      conceptDriftScore,
      predictionDriftScore,
      performanceMetrics,
      baselineMetrics,
    };
  }

  /**
   * Monitor model and create drift record
   */
  static async monitorModel(
    modelId: string,
    modelVersion: string,
    config?: MonitoringConfig
  ): Promise<NewMLDriftMonitoring> {
    const thresholds = config?.thresholds || DEFAULT_THRESHOLDS;

    // Calculate drift metrics
    const metrics = await this.calculateDriftMetrics(modelId, modelVersion);

    // Determine alert level
    const alertLevel = this.determineAlertLevel(metrics, thresholds);
    const alertTriggered = alertLevel !== 'normal';

    // Create drift monitoring record
    const [driftRecord] = await db.insert(mlDriftMonitoring).values({
      modelId,
      modelVersion,
      dataDriftScore: metrics.dataDriftScore,
      conceptDriftScore: metrics.conceptDriftScore,
      predictionDriftScore: metrics.predictionDriftScore,
      performanceMetrics: metrics.performanceMetrics,
      baselineMetrics: metrics.baselineMetrics,
      alertLevel,
      alertTriggered,
    }).returning();

    // Log audit event if alert triggered
    if (alertTriggered) {
      await this.logAuditEvent({
        eventType: 'drift_detected',
        modelId,
        modelVersion,
        action: `Drift alert triggered: ${alertLevel}`,
        result: 'success',
        metadata: {
          alertLevel,
          dataDriftScore: metrics.dataDriftScore,
          conceptDriftScore: metrics.conceptDriftScore,
          predictionDriftScore: metrics.predictionDriftScore,
        },
      });

      // Send alert notification
      await this.sendDriftAlert({
        modelId,
        modelVersion,
        alertLevel: alertLevel as 'warning' | 'critical',
        metrics,
        timestamp: new Date(),
        message: this.generateAlertMessage(metrics, thresholds),
      });
    }

    return driftRecord;
  }

  /**
   * Get drift history for a model
   */
  static async getDriftHistory(
    modelId: string,
    modelVersion?: string,
    limit: number = 100
  ): Promise<any[]> {
    const conditions = modelVersion
      ? and(eq(mlDriftMonitoring.modelId, modelId), eq(mlDriftMonitoring.modelVersion, modelVersion))
      : eq(mlDriftMonitoring.modelId, modelId);

    return db.query.mlDriftMonitoring.findMany({
      where: conditions,
      orderBy: [desc(mlDriftMonitoring.timestamp)],
      limit,
    });
  }

  /**
   * Get latest drift metrics
   */
  static async getLatestDriftMetrics(modelId: string, modelVersion: string): Promise<any | null> {
    return db.query.mlDriftMonitoring.findFirst({
      where: and(
        eq(mlDriftMonitoring.modelId, modelId),
        eq(mlDriftMonitoring.modelVersion, modelVersion)
      ),
      orderBy: [desc(mlDriftMonitoring.timestamp)],
    });
  }

  // ============================================================================
  // DRIFT CALCULATION METHODS
  // ============================================================================

  /**
   * Calculate data drift score (input distribution changes)
   */
  private static calculateDataDrift(inferences: any[]): number {
    // Simplified implementation - in production, use statistical tests
    // like Kolmogorov-Smirnov test, Population Stability Index (PSI), etc.
    
    // For now, return a mock score based on variance in confidence scores
    const confidenceScores = inferences
      .map((inf) => inf.confidence)
      .filter((c) => c !== null && c !== undefined);

    if (confidenceScores.length === 0) return 0;

    const mean = confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length;
    const variance = confidenceScores.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidenceScores.length;
    
    // Normalize to 0-100 scale (higher variance = higher drift)
    return Math.min(100, Math.round(variance * 10));
  }

  /**
   * Calculate concept drift score (performance degradation)
   */
  private static calculateConceptDrift(inferences: any[], baselineMetrics: Record<string, number>): number {
    // Simplified implementation - in production, compare actual vs predicted
    // performance using labeled data or proxy metrics
    
    // For now, use average confidence as a proxy for performance
    const avgConfidence = inferences
      .map((inf) => inf.confidence || 50)
      .reduce((sum, c) => sum + c, 0) / inferences.length;

    const baselineConfidence = baselineMetrics.confidence || 80;
    const drop = baselineConfidence - avgConfidence;

    // Normalize to 0-100 scale (higher drop = higher drift)
    return Math.max(0, Math.min(100, Math.round(drop)));
  }

  /**
   * Calculate prediction drift score (output distribution changes)
   */
  private static calculatePredictionDrift(inferences: any[]): number {
    // Simplified implementation - in production, compare prediction distributions
    // using statistical tests or entropy measures
    
    // For now, calculate distribution of predictions
    const predictions = inferences.map((inf) => JSON.stringify(inf.prediction));
    const predictionCounts = predictions.reduce((acc, pred) => {
      acc[pred] = (acc[pred] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate entropy (higher entropy = more diverse predictions = potential drift)
    const total = predictions.length;
    const entropy = Object.values(predictionCounts).reduce((sum, count) => {
      const p = count / total;
      return sum - p * Math.log2(p);
    }, 0);

    // Normalize to 0-100 scale
    return Math.min(100, Math.round(entropy * 20));
  }

  /**
   * Calculate current performance metrics
   */
  private static calculatePerformanceMetrics(inferences: any[]): Record<string, number> {
    const avgConfidence = inferences
      .map((inf) => inf.confidence || 50)
      .reduce((sum, c) => sum + c, 0) / inferences.length;

    const avgLatency = inferences
      .map((inf) => inf.latencyMs)
      .reduce((sum, l) => sum + l, 0) / inferences.length;

    const errorRate = inferences.filter((inf) => inf.errorOccurred).length / inferences.length;

    return {
      avgConfidence: Math.round(avgConfidence),
      avgLatencyMs: Math.round(avgLatency),
      errorRate: Math.round(errorRate * 100),
      inferenceCount: inferences.length,
    };
  }

  // ============================================================================
  // ALERT METHODS
  // ============================================================================

  /**
   * Determine alert level based on thresholds
   */
  private static determineAlertLevel(
    metrics: DriftMetrics,
    thresholds: typeof DEFAULT_THRESHOLDS
  ): 'normal' | 'warning' | 'critical' {
    // Check critical thresholds first
    if (
      metrics.dataDriftScore >= thresholds.dataDriftCritical ||
      metrics.conceptDriftScore >= thresholds.conceptDriftCritical ||
      metrics.predictionDriftScore >= thresholds.predictionDriftCritical
    ) {
      return 'critical';
    }

    // Check warning thresholds
    if (
      metrics.dataDriftScore >= thresholds.dataDriftWarning ||
      metrics.conceptDriftScore >= thresholds.conceptDriftWarning ||
      metrics.predictionDriftScore >= thresholds.predictionDriftWarning
    ) {
      return 'warning';
    }

    return 'normal';
  }

  /**
   * Generate alert message
   */
  private static generateAlertMessage(
    metrics: DriftMetrics,
    thresholds: typeof DEFAULT_THRESHOLDS
  ): string {
    const issues: string[] = [];

    if (metrics.dataDriftScore >= thresholds.dataDriftWarning) {
      issues.push(`Data drift detected (score: ${metrics.dataDriftScore})`);
    }

    if (metrics.conceptDriftScore >= thresholds.conceptDriftWarning) {
      issues.push(`Concept drift detected (score: ${metrics.conceptDriftScore})`);
    }

    if (metrics.predictionDriftScore >= thresholds.predictionDriftWarning) {
      issues.push(`Prediction drift detected (score: ${metrics.predictionDriftScore})`);
    }

    return issues.join('. ');
  }

  /**
   * Send drift alert notification
   */
  private static async sendDriftAlert(alert: DriftAlert): Promise<void> {
    // In production, integrate with notification system (email, Slack, PagerDuty, etc.)
    console.warn('[ML Governance] Drift Alert:', {
      modelId: alert.modelId,
      modelVersion: alert.modelVersion,
      alertLevel: alert.alertLevel,
      message: alert.message,
      timestamp: alert.timestamp,
    });

    // TODO: Implement actual notification delivery
    // - Email to ML Governance Lead
    // - Slack message to #ml-alerts channel
    // - PagerDuty incident for critical alerts
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Log audit event
   */
  private static async logAuditEvent(event: {
    eventType: any;
    modelId?: string;
    modelVersion?: string;
    userId?: string;
    action: string;
    result: 'success' | 'failure';
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await db.insert(mlAuditLogs).values({
      eventType: event.eventType,
      modelId: event.modelId,
      modelVersion: event.modelVersion,
      userId: event.userId,
      action: event.action,
      result: event.result,
      errorMessage: event.errorMessage,
      metadata: event.metadata,
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DriftMonitoringService;
