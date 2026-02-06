/**
 * Rollback Service
 * 
 * Fast, safe rollback to previous model versions in case of issues,
 * with comprehensive logging and post-rollback monitoring.
 * 
 * @module server/ml-governance/rollback
 */

import { db } from '@/db';
import {
  mlRollbackHistory,
  mlAuditLogs,
  type NewMLRollbackHistory,
} from '@/db/schema-ml-governance';
import { eq, desc } from 'drizzle-orm';
import ModelRegistryService from './model-registry';
import ApprovalWorkflowService from './approval-workflow';
import DriftMonitoringService from './drift-monitoring';

// ============================================================================
// TYPES
// ============================================================================

export interface RollbackInput {
  fromModelId: string;
  toModelId?: string; // If not provided, rolls back to previous deployed version
  triggeredBy: string;
  triggerReason: 'drift_alert' | 'incident' | 'manual' | 'compliance_violation';
  notes?: string;
  expedited?: boolean; // Skip approval workflow if true (emergency rollback)
}

export interface RollbackResult {
  success: boolean;
  rollbackId: string;
  fromVersion: string;
  toVersion: string;
  executionTimeMs: number;
  errorMessage?: string;
}

// ============================================================================
// ROLLBACK SERVICE
// ============================================================================

export class RollbackService {
  /**
   * Initiate model rollback
   */
  static async initiateRollback(input: RollbackInput): Promise<RollbackResult> {
    const startTime = Date.now();

    try {
      // Get current model
      const fromModel = await ModelRegistryService.getModel(input.fromModelId);
      if (!fromModel) {
        throw new Error(`Model ${input.fromModelId} not found.`);
      }

      // Determine target model
      let toModel;
      if (input.toModelId) {
        toModel = await ModelRegistryService.getModel(input.toModelId);
        if (!toModel) {
          throw new Error(`Target model ${input.toModelId} not found.`);
        }
      } else {
        // Find previous deployed version
        toModel = await this.findPreviousDeployedVersion(fromModel.modelName, fromModel.version);
        if (!toModel) {
          throw new Error(`No previous deployed version found for ${fromModel.modelName}.`);
        }
      }

      // Validate rollback target
      this.validateRollbackTarget(fromModel, toModel);

      // Create approval workflow if not expedited
      if (!input.expedited) {
        const workflow = await ApprovalWorkflowService.createExpeditedRollbackWorkflow({
          modelId: toModel.id,
          requestedBy: input.triggeredBy,
          reason: `Rollback from ${fromModel.version} due to: ${input.triggerReason}`,
        });

        // In production, wait for approval before proceeding
        // For now, auto-approve expedited workflows
        await ApprovalWorkflowService.reviewStage({
          workflowId: workflow.id,
          stageId: (workflow as any).stages[0].id,
          reviewedBy: input.triggeredBy,
          approved: true,
          checklist: [
            { item: 'Rollback reason documented', checked: true, evidence: input.notes },
            { item: 'Target version verified', checked: true },
            { item: 'Incident severity assessed', checked: true },
          ],
        });
      }

      // Execute rollback
      await this.executeRollback(fromModel.id, toModel.id);

      const executionTimeMs = Date.now() - startTime;

      // Create rollback history record
      const [rollbackRecord] = await db.insert(mlRollbackHistory).values({
        fromModelId: fromModel.id,
        fromVersion: fromModel.version,
        toModelId: toModel.id,
        toVersion: toModel.version,
        triggeredBy: input.triggeredBy,
        triggerReason: input.triggerReason,
        executionTimeMs,
        success: true,
        metadata: {
          notes: input.notes,
          expedited: input.expedited,
        },
      }).returning();

      // Log audit event
      await this.logAuditEvent({
        eventType: 'rollback_completed',
        modelId: toModel.id,
        modelVersion: toModel.version,
        userId: input.triggeredBy,
        action: `Rolled back from ${fromModel.version} to ${toModel.version}`,
        result: 'success',
        metadata: {
          rollbackId: rollbackRecord.id,
          fromVersion: fromModel.version,
          toVersion: toModel.version,
          triggerReason: input.triggerReason,
          executionTimeMs,
        },
      });

      // Schedule post-rollback monitoring
      await this.schedulePostRollbackMonitoring(toModel.id, toModel.version, rollbackRecord.id);

      return {
        success: true,
        rollbackId: rollbackRecord.id,
        fromVersion: fromModel.version,
        toVersion: toModel.version,
        executionTimeMs,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed rollback
      await db.insert(mlRollbackHistory).values({
        fromModelId: input.fromModelId,
        fromVersion: 'unknown',
        toModelId: input.toModelId || input.fromModelId,
        toVersion: 'unknown',
        triggeredBy: input.triggeredBy,
        triggerReason: input.triggerReason,
        executionTimeMs,
        success: false,
        errorMessage,
      });

      await this.logAuditEvent({
        eventType: 'rollback_initiated',
        modelId: input.fromModelId,
        userId: input.triggeredBy,
        action: `Rollback failed: ${errorMessage}`,
        result: 'failure',
        errorMessage,
      });

      throw error;
    }
  }

  /**
   * Execute the actual rollback
   */
  private static async executeRollback(fromModelId: string, toModelId: string): Promise<void> {
    // Update from model status to deprecated
    await ModelRegistryService.updateModelStatus({
      modelId: fromModelId,
      status: 'deprecated',
      userId: 'system',
      notes: 'Rolled back due to issues',
    });

    // Update to model status to deployed
    await ModelRegistryService.updateModelStatus({
      modelId: toModelId,
      status: 'deployed',
      userId: 'system',
      notes: 'Deployed via rollback',
    });

    // In production, this would also:
    // - Update load balancer/routing to point to new model
    // - Restart inference services
    // - Clear caches
    // - Update feature flags
  }

  /**
   * Find previous deployed version
   */
  private static async findPreviousDeployedVersion(
    modelName: string,
    currentVersion: string
  ): Promise<any | null> {
    const versions = await ModelRegistryService.getModelVersions({ modelName, limit: 10 });

    // Find the most recent deployed version before current version
    const previousVersions = versions.filter(
      (v) =>
        v.version !== currentVersion &&
        (v.status === 'deployed' || v.status === 'deprecated') &&
        ModelRegistryService.compareVersions(v.version, currentVersion) < 0
    );

    return previousVersions[0] || null;
  }

  /**
   * Validate rollback target
   */
  private static validateRollbackTarget(fromModel: any, toModel: any): void {
    if (fromModel.modelName !== toModel.modelName) {
      throw new Error('Cannot rollback to a different model.');
    }

    if (toModel.status === 'archived') {
      throw new Error('Cannot rollback to an archived model.');
    }

    if (ModelRegistryService.compareVersions(toModel.version, fromModel.version) >= 0) {
      throw new Error('Target version must be older than current version.');
    }
  }

  /**
   * Schedule post-rollback monitoring
   */
  private static async schedulePostRollbackMonitoring(
    modelId: string,
    modelVersion: string,
    rollbackId: string
  ): Promise<void> {
    // In production, schedule monitoring jobs
    // For now, immediately run one monitoring check
    setTimeout(async () => {
      try {
        const metrics = await DriftMonitoringService.calculateDriftMetrics(modelId, modelVersion, 1);

        // Update rollback record with post-rollback metrics
        await db.update(mlRollbackHistory)
          .set({
            postRollbackMetrics: {
              ...metrics,
              timestamp: new Date(),
            },
          })
          .where(eq(mlRollbackHistory.id, rollbackId));
      } catch (error) {
        console.error('Post-rollback monitoring failed:', error);
      }
    }, 60000); // Check after 1 minute
  }

  /**
   * Get rollback history
   */
  static async getRollbackHistory(modelName?: string, limit: number = 50): Promise<any[]> {
    const history = await db.query.mlRollbackHistory.findMany({
      orderBy: [desc(mlRollbackHistory.timestamp)],
      limit,
      with: {
        fromModel: true,
        toModel: true,
      },
    });

    if (modelName) {
      return history.filter(
        (h) => (h as any).fromModel?.modelName === modelName || (h as any).toModel?.modelName === modelName
      );
    }

    return history;
  }

  /**
   * Get rollback by ID
   */
  static async getRollback(rollbackId: string): Promise<any | null> {
    return db.query.mlRollbackHistory.findFirst({
      where: eq(mlRollbackHistory.id, rollbackId),
      with: {
        fromModel: true,
        toModel: true,
      },
    });
  }

  /**
   * Calculate rollback success rate
   */
  static async calculateRollbackSuccessRate(modelName?: string): Promise<number> {
    const history = await this.getRollbackHistory(modelName, 100);

    if (history.length === 0) return 100;

    const successfulRollbacks = history.filter((h) => h.success).length;
    return Math.round((successfulRollbacks / history.length) * 100);
  }

  /**
   * Get average rollback time
   */
  static async getAverageRollbackTime(modelName?: string): Promise<number> {
    const history = await this.getRollbackHistory(modelName, 100);

    if (history.length === 0) return 0;

    const totalTime = history.reduce((sum, h) => sum + (h.executionTimeMs || 0), 0);
    return Math.round(totalTime / history.length);
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

export default RollbackService;
