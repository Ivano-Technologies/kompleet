/**
 * ML Governance API
 * 
 * RESTful API endpoints for model registry, approval workflows,
 * drift monitoring, and audit logs.
 * 
 * @module server/ml-governance/api
 */

import { Router } from 'express';
import ModelRegistryService from './model-registry';
import ApprovalWorkflowService from './approval-workflow';
import DriftMonitoringService from './drift-monitoring';
import RollbackService from './rollback';
// import { db } from '@/db'; // TODO: Setup Drizzle ORM db instance
// import { mlAuditLogs } from '@/db/schema-ml-governance'; // TODO: Setup after db instance is ready
import { desc, eq } from 'drizzle-orm';

const router = Router();

// ============================================================================
// MODEL REGISTRY ENDPOINTS
// ============================================================================

/**
 * Register a new model
 * POST /api/ml-governance/models
 */
router.post('/models', async (req, res) => {
  try {
    const model = await ModelRegistryService.registerModel(req.body);
    res.status(201).json({ success: true, model });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register model',
    });
  }
});

/**
 * List all models
 * GET /api/ml-governance/models
 */
router.get('/models', async (req, res) => {
  try {
    const { modelName, status, createdBy, limit } = req.query;
    const models = await ModelRegistryService.listModels({
      modelName: modelName as string,
      status: status as string,
      createdBy: createdBy as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, models });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list models',
    });
  }
});

/**
 * Get model by ID
 * GET /api/ml-governance/models/:id
 */
router.get('/models/:id', async (req, res) => {
  try {
    const model = await ModelRegistryService.getModel(req.params.id);
    if (!model) {
      return res.status(404).json({ success: false, error: 'Model not found' });
    }
    res.json({ success: true, model });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get model',
    });
  }
});

/**
 * Get model versions
 * GET /api/ml-governance/models/:modelName/versions
 */
router.get('/models/:modelName/versions', async (req, res) => {
  try {
    const { limit } = req.query;
    const versions = await ModelRegistryService.getModelVersions({
      modelName: req.params.modelName,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, versions });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get versions',
    });
  }
});

/**
 * Update model status
 * PUT /api/ml-governance/models/:id/status
 */
router.put('/models/:id/status', async (req, res) => {
  try {
    const { status, userId, notes } = req.body;
    const model = await ModelRegistryService.updateModelStatus({
      modelId: req.params.id,
      status,
      userId,
      notes,
    });
    res.json({ success: true, model });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    });
  }
});

/**
 * Deprecate a model
 * POST /api/ml-governance/models/:id/deprecate
 */
router.post('/models/:id/deprecate', async (req, res) => {
  try {
    const { reason, userId } = req.body;
    const model = await ModelRegistryService.deprecateModel({
      modelId: req.params.id,
      reason,
      userId,
    });
    res.json({ success: true, model });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deprecate model',
    });
  }
});

// ============================================================================
// APPROVAL WORKFLOW ENDPOINTS
// ============================================================================

/**
 * Create approval workflow
 * POST /api/ml-governance/approvals
 */
router.post('/approvals', async (req, res) => {
  try {
    const workflow = await ApprovalWorkflowService.createWorkflow(req.body);
    res.status(201).json({ success: true, workflow });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workflow',
    });
  }
});

/**
 * Get workflow by ID
 * GET /api/ml-governance/approvals/:id
 */
router.get('/approvals/:id', async (req, res) => {
  try {
    const workflow = await ApprovalWorkflowService.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.json({ success: true, workflow });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get workflow',
    });
  }
});

/**
 * Review approval stage
 * PUT /api/ml-governance/approvals/:workflowId/stages/:stageId
 */
router.put('/approvals/:workflowId/stages/:stageId', async (req, res) => {
  try {
    const { reviewedBy, approved, checklist, comments, evidence } = req.body;
    const stage = await ApprovalWorkflowService.reviewStage({
      workflowId: req.params.workflowId,
      stageId: req.params.stageId,
      reviewedBy,
      approved,
      checklist,
      comments,
      evidence,
    });
    res.json({ success: true, stage });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to review stage',
    });
  }
});

/**
 * Get pending workflows for reviewer
 * GET /api/ml-governance/approvals/pending/:reviewerId
 */
router.get('/approvals/pending/:reviewerId', async (req, res) => {
  try {
    const workflows = await ApprovalWorkflowService.getPendingWorkflowsForReviewer(
      req.params.reviewerId
    );
    res.json({ success: true, workflows });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pending workflows',
    });
  }
});

/**
 * Cancel workflow
 * POST /api/ml-governance/approvals/:id/cancel
 */
router.post('/approvals/:id/cancel', async (req, res) => {
  try {
    const { userId } = req.body;
    await ApprovalWorkflowService.cancelWorkflow(req.params.id, userId);
    res.json({ success: true, message: 'Workflow cancelled' });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel workflow',
    });
  }
});

// ============================================================================
// DRIFT MONITORING ENDPOINTS
// ============================================================================

/**
 * Monitor model and calculate drift
 * POST /api/ml-governance/drift/monitor
 */
router.post('/drift/monitor', async (req, res) => {
  try {
    const { modelId, modelVersion, config } = req.body;
    const driftRecord = await DriftMonitoringService.monitorModel(modelId, modelVersion, config);
    res.json({ success: true, driftRecord });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to monitor model',
    });
  }
});

/**
 * Get drift history
 * GET /api/ml-governance/drift/:modelId
 */
router.get('/drift/:modelId', async (req, res) => {
  try {
    const { modelVersion, limit } = req.query;
    const history = await DriftMonitoringService.getDriftHistory(
      req.params.modelId,
      modelVersion as string,
      limit ? parseInt(limit as string) : undefined
    );
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get drift history',
    });
  }
});

/**
 * Get latest drift metrics
 * GET /api/ml-governance/drift/:modelId/:modelVersion/latest
 */
router.get('/drift/:modelId/:modelVersion/latest', async (req, res) => {
  try {
    const metrics = await DriftMonitoringService.getLatestDriftMetrics(
      req.params.modelId,
      req.params.modelVersion
    );
    if (!metrics) {
      return res.status(404).json({ success: false, error: 'No drift metrics found' });
    }
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get drift metrics',
    });
  }
});

// ============================================================================
// ROLLBACK ENDPOINTS
// ============================================================================

/**
 * Initiate rollback
 * POST /api/ml-governance/rollback
 */
router.post('/rollback', async (req, res) => {
  try {
    const result = await RollbackService.initiateRollback(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate rollback',
    });
  }
});

/**
 * Get rollback history
 * GET /api/ml-governance/rollback/history
 */
router.get('/rollback/history', async (req, res) => {
  try {
    const { modelName, limit } = req.query;
    const history = await RollbackService.getRollbackHistory(
      modelName as string,
      limit ? parseInt(limit as string) : undefined
    );
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rollback history',
    });
  }
});

/**
 * Get rollback by ID
 * GET /api/ml-governance/rollback/:id
 */
router.get('/rollback/:id', async (req, res) => {
  try {
    const rollback = await RollbackService.getRollback(req.params.id);
    if (!rollback) {
      return res.status(404).json({ success: false, error: 'Rollback not found' });
    }
    res.json({ success: true, rollback });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rollback',
    });
  }
});

// ============================================================================
// AUDIT LOG ENDPOINTS
// ============================================================================

/**
 * Query audit logs
 * GET /api/ml-governance/audit-logs
 */
router.get('/audit-logs', async (req, res) => {
  try {
    // TODO: Implement after db instance is setup
    res.json({ success: true, logs: [] });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to query audit logs',
    });
  }
});

/**
 * Get audit logs for specific model
 * GET /api/ml-governance/audit-logs/:modelId
 */
router.get('/audit-logs/:modelId', async (req, res) => {
  try {
    // TODO: Implement after db instance is setup
    res.json({ success: true, logs: [] });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get audit logs',
    });
  }
});

// ============================================================================
// GOVERNANCE METRICS ENDPOINTS
// ============================================================================

/**
 * Get governance KPIs
 * GET /api/ml-governance/metrics/kpis
 */
router.get('/metrics/kpis', async (req, res) => {
  try {
    const { modelName } = req.query;

    // Calculate KPIs
    const rollbackSuccessRate = await RollbackService.calculateRollbackSuccessRate(
      modelName as string
    );
    const avgRollbackTime = await RollbackService.getAverageRollbackTime(modelName as string);

    // Get model documentation completeness
    const models = await ModelRegistryService.listModels({
      modelName: modelName as string,
    });
    const modelsWithCompleteDoc = models.filter(
      (m) =>
        m.description &&
        m.changelog &&
        m.evaluationMetrics &&
        m.trainingCodeVersion
    ).length;
    const documentationCompleteness = models.length > 0
      ? Math.round((modelsWithCompleteDoc / models.length) * 100)
      : 100;

    res.json({
      success: true,
      kpis: {
        rollbackSuccessRate,
        avgRollbackTimeMs: avgRollbackTime,
        documentationCompleteness,
        totalModels: models.length,
        deployedModels: models.filter((m) => m.status === 'deployed').length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate KPIs',
    });
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export default router;
