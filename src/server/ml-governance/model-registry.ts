/**
 * Model Registry Service
 * 
 * Central service for managing ML model lifecycle including registration,
 * versioning, deployment, and deprecation.
 * 
 * @module server/ml-governance/model-registry
 */

import { db } from '@/db';
import {
  mlModels,
  mlTrainingDatasets,
  mlAuditLogs,
  type NewMLModel,
  type NewMLTrainingDataset,
  type MLModel,
} from '@/db/schema-ml-governance';
import { eq, desc, and } from 'drizzle-orm';
import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterModelInput {
  modelName: string;
  version: string;
  artifactUrl: string;
  artifactBuffer?: Buffer; // For checksum calculation
  framework: string;
  modelType: string;
  description?: string;
  changelog?: string;
  trainingCodeVersion?: string;
  trainingDurationSeconds?: number;
  trainingComputeResources?: string;
  hyperparameters?: Record<string, any>;
  evaluationMetrics?: Record<string, number>;
  fairnessMetrics?: {
    biasChecked: boolean;
    categoriesAnalyzed: string[];
    disparateImpact?: number;
    notes?: string;
  };
  parentModelId?: string;
  trainingDataset?: {
    datasetId: string;
    datasetVersion: string;
    recordCount: number;
    dateRangeStart?: Date;
    dateRangeEnd?: Date;
    consentStatus: 'compliant' | 'review_required';
    legalBasis?: string;
    dataSourceDescription?: string;
    privacyImpactAssessmentCompleted?: boolean;
  };
  createdBy: string;
  metadata?: Record<string, any>;
}

export interface UpdateModelStatusInput {
  modelId: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'deployed' | 'deprecated' | 'archived';
  userId: string;
  notes?: string;
}

export interface GetModelVersionsInput {
  modelName: string;
  limit?: number;
}

export interface DeprecateModelInput {
  modelId: string;
  reason: string;
  userId: string;
}

// ============================================================================
// MODEL REGISTRY SERVICE
// ============================================================================

export class ModelRegistryService {
  /**
   * Register a new model in the registry
   */
  static async registerModel(input: RegisterModelInput): Promise<MLModel> {
    // Calculate artifact checksum
    const artifactChecksum = input.artifactBuffer
      ? createHash('sha256').update(input.artifactBuffer).digest('hex')
      : 'pending';
    
    const artifactSizeBytes = input.artifactBuffer?.length || 0;

    // Validate semantic versioning
    if (!this.isValidSemanticVersion(input.version)) {
      throw new Error(`Invalid semantic version: ${input.version}. Must follow MAJOR.MINOR.PATCH format.`);
    }

    // Check for duplicate version
    const existingModel = await db.query.mlModels.findFirst({
      where: and(
        eq(mlModels.modelName, input.modelName),
        eq(mlModels.version, input.version)
      ),
    });

    if (existingModel) {
      throw new Error(`Model ${input.modelName} version ${input.version} already exists.`);
    }

    // Insert model
    const [model] = await db.insert(mlModels).values({
      modelName: input.modelName,
      version: input.version,
      status: 'draft',
      artifactUrl: input.artifactUrl,
      artifactChecksum,
      artifactSizeBytes,
      framework: input.framework,
      modelType: input.modelType,
      description: input.description,
      changelog: input.changelog,
      trainingCodeVersion: input.trainingCodeVersion,
      trainingDurationSeconds: input.trainingDurationSeconds,
      trainingComputeResources: input.trainingComputeResources,
      hyperparameters: input.hyperparameters,
      evaluationMetrics: input.evaluationMetrics,
      fairnessMetrics: input.fairnessMetrics,
      parentModelId: input.parentModelId,
      createdBy: input.createdBy,
      metadata: input.metadata,
    }).returning();

    // Insert training dataset if provided
    if (input.trainingDataset && model) {
      await db.insert(mlTrainingDatasets).values({
        modelId: model.id,
        datasetId: input.trainingDataset.datasetId,
        datasetVersion: input.trainingDataset.datasetVersion,
        recordCount: input.trainingDataset.recordCount,
        dateRangeStart: input.trainingDataset.dateRangeStart,
        dateRangeEnd: input.trainingDataset.dateRangeEnd,
        consentStatus: input.trainingDataset.consentStatus,
        legalBasis: input.trainingDataset.legalBasis,
        dataSourceDescription: input.trainingDataset.dataSourceDescription,
        privacyImpactAssessmentCompleted: input.trainingDataset.privacyImpactAssessmentCompleted || false,
      });
    }

    // Log audit event
    await this.logAuditEvent({
      eventType: 'model_registered',
      modelId: model.id,
      modelVersion: model.version,
      userId: input.createdBy,
      action: `Registered model ${input.modelName} version ${input.version}`,
      result: 'success',
      metadata: {
        framework: input.framework,
        modelType: input.modelType,
      },
    });

    return model;
  }

  /**
   * Get model by ID with full details
   */
  static async getModel(modelId: string): Promise<MLModel | null> {
    const model = await db.query.mlModels.findFirst({
      where: eq(mlModels.id, modelId),
      with: {
        trainingDatasets: true,
        approvalWorkflows: true,
      },
    });

    return model || null;
  }

  /**
   * Get all versions of a model
   */
  static async getModelVersions(input: GetModelVersionsInput): Promise<MLModel[]> {
    const versions = await db.query.mlModels.findMany({
      where: eq(mlModels.modelName, input.modelName),
      orderBy: [desc(mlModels.createdAt)],
      limit: input.limit || 50,
    });

    return versions;
  }

  /**
   * Get currently deployed model version
   */
  static async getDeployedModel(modelName: string): Promise<MLModel | null> {
    const model = await db.query.mlModels.findFirst({
      where: and(
        eq(mlModels.modelName, modelName),
        eq(mlModels.status, 'deployed')
      ),
      orderBy: [desc(mlModels.deployedAt)],
    });

    return model || null;
  }

  /**
   * Update model status
   */
  static async updateModelStatus(input: UpdateModelStatusInput): Promise<MLModel> {
    const model = await this.getModel(input.modelId);
    if (!model) {
      throw new Error(`Model ${input.modelId} not found.`);
    }

    // Validate status transition
    this.validateStatusTransition(model.status, input.status);

    // Prepare update data
    const updateData: any = {
      status: input.status,
    };

    // Set timestamps based on status
    if (input.status === 'approved') {
      updateData.approvedBy = input.userId;
      updateData.approvedAt = new Date();
    } else if (input.status === 'deployed') {
      updateData.deployedAt = new Date();
    } else if (input.status === 'deprecated') {
      updateData.deprecatedAt = new Date();
    } else if (input.status === 'archived') {
      updateData.archivedAt = new Date();
    }

    // Update model
    const [updatedModel] = await db.update(mlModels)
      .set(updateData)
      .where(eq(mlModels.id, input.modelId))
      .returning();

    // Log audit event
    await this.logAuditEvent({
      eventType: this.getEventTypeForStatus(input.status),
      modelId: input.modelId,
      modelVersion: model.version,
      userId: input.userId,
      action: `Updated model status to ${input.status}`,
      result: 'success',
      metadata: {
        previousStatus: model.status,
        newStatus: input.status,
        notes: input.notes,
      },
    });

    return updatedModel;
  }

  /**
   * Deprecate a model
   */
  static async deprecateModel(input: DeprecateModelInput): Promise<MLModel> {
    const model = await this.getModel(input.modelId);
    if (!model) {
      throw new Error(`Model ${input.modelId} not found.`);
    }

    if (model.status === 'deprecated' || model.status === 'archived') {
      throw new Error(`Model is already ${model.status}.`);
    }

    const [updatedModel] = await db.update(mlModels)
      .set({
        status: 'deprecated',
        deprecatedAt: new Date(),
      })
      .where(eq(mlModels.id, input.modelId))
      .returning();

    await this.logAuditEvent({
      eventType: 'model_deprecated',
      modelId: input.modelId,
      modelVersion: model.version,
      userId: input.userId,
      action: `Deprecated model: ${input.reason}`,
      result: 'success',
      metadata: {
        reason: input.reason,
        previousStatus: model.status,
      },
    });

    return updatedModel;
  }

  /**
   * List all models with filters
   */
  static async listModels(filters?: {
    modelName?: string;
    status?: string;
    createdBy?: string;
    limit?: number;
  }): Promise<MLModel[]> {
    let query = db.query.mlModels.findMany({
      orderBy: [desc(mlModels.createdAt)],
      limit: filters?.limit || 100,
    });

    // Apply filters (simplified - in production use proper query building)
    const models = await query;

    return models.filter((model) => {
      if (filters?.modelName && model.modelName !== filters.modelName) return false;
      if (filters?.status && model.status !== filters.status) return false;
      if (filters?.createdBy && model.createdBy !== filters.createdBy) return false;
      return true;
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Validate semantic version format
   */
  private static isValidSemanticVersion(version: string): boolean {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return semverRegex.test(version);
  }

  /**
   * Validate status transition
   */
  private static validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      draft: ['pending_approval', 'archived'],
      pending_approval: ['approved', 'draft', 'archived'],
      approved: ['deployed', 'archived'],
      deployed: ['deprecated', 'archived'],
      deprecated: ['archived'],
      archived: [], // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}.`);
    }
  }

  /**
   * Get audit event type for status change
   */
  private static getEventTypeForStatus(status: string): any {
    const eventTypeMap: Record<string, string> = {
      deployed: 'model_deployed',
      deprecated: 'model_deprecated',
      archived: 'model_archived',
      approved: 'approval_granted',
    };

    return eventTypeMap[status] || 'model_updated';
  }

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

  /**
   * Compare semantic versions
   */
  static compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1;
      if (parts1[i] < parts2[i]) return -1;
    }

    return 0;
  }

  /**
   * Get latest version for a model
   */
  static async getLatestVersion(modelName: string): Promise<string | null> {
    const versions = await this.getModelVersions({ modelName, limit: 1 });
    return versions[0]?.version || null;
  }

  /**
   * Suggest next version based on change type
   */
  static suggestNextVersion(currentVersion: string, changeType: 'major' | 'minor' | 'patch'): string {
    const parts = currentVersion.split('.').map(Number);

    if (changeType === 'major') {
      return `${parts[0] + 1}.0.0`;
    } else if (changeType === 'minor') {
      return `${parts[0]}.${parts[1] + 1}.0`;
    } else {
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ModelRegistryService;
