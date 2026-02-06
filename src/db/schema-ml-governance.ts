/**
 * ML Governance Database Schema
 * 
 * Comprehensive schema for model registry, versioning, audit trails,
 * approval workflows, and compliance tracking.
 * 
 * @module db/schema-ml-governance
 */

import { pgTable, text, timestamp, uuid, jsonb, integer, boolean, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const modelStatusEnum = pgEnum('model_status', [
  'draft',
  'pending_approval',
  'approved',
  'deployed',
  'deprecated',
  'archived'
]);

export const approvalStageStatusEnum = pgEnum('approval_stage_status', [
  'pending',
  'approved',
  'rejected',
  'skipped'
]);

export const workflowStatusEnum = pgEnum('workflow_status', [
  'pending',
  'approved',
  'rejected',
  'cancelled'
]);

export const alertLevelEnum = pgEnum('alert_level', [
  'normal',
  'warning',
  'critical'
]);

export const auditEventTypeEnum = pgEnum('audit_event_type', [
  'model_registered',
  'model_updated',
  'model_deployed',
  'model_deprecated',
  'model_archived',
  'approval_requested',
  'approval_granted',
  'approval_rejected',
  'inference_executed',
  'drift_detected',
  'rollback_initiated',
  'rollback_completed',
  'training_started',
  'training_completed'
]);

// ============================================================================
// MODEL REGISTRY
// ============================================================================

/**
 * Central registry for all ML models
 */
export const mlModels = pgTable('ml_models', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelName: text('model_name').notNull(), // e.g., "transaction-categorizer"
  version: text('version').notNull(), // Semantic version: MAJOR.MINOR.PATCH
  status: modelStatusEnum('status').notNull().default('draft'),
  
  // Model artifact storage
  artifactUrl: text('artifact_url').notNull(), // S3/storage location
  artifactChecksum: text('artifact_checksum').notNull(), // SHA-256 hash
  artifactSizeBytes: integer('artifact_size_bytes').notNull(),
  
  // Model metadata
  framework: text('framework').notNull(), // e.g., "scikit-learn", "tensorflow"
  modelType: text('model_type').notNull(), // e.g., "classifier", "regressor", "detector"
  description: text('description'),
  changelog: text('changelog'), // Markdown description of changes
  
  // Training information
  trainingCodeVersion: text('training_code_version'), // Git commit SHA
  trainingDurationSeconds: integer('training_duration_seconds'),
  trainingComputeResources: text('training_compute_resources'),
  hyperparameters: jsonb('hyperparameters'), // Training hyperparameters
  
  // Evaluation metrics
  evaluationMetrics: jsonb('evaluation_metrics'), // accuracy, precision, recall, etc.
  fairnessMetrics: jsonb('fairness_metrics'), // bias checks, disparate impact
  
  // Lineage
  parentModelId: uuid('parent_model_id'), // Reference to parent model if fine-tuned
  
  // Ownership and timestamps
  createdBy: text('created_by').notNull(), // User ID
  createdAt: timestamp('created_at').notNull().defaultNow(),
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  deployedAt: timestamp('deployed_at'),
  deprecatedAt: timestamp('deprecated_at'),
  archivedAt: timestamp('archived_at'),
  
  // Metadata
  metadata: jsonb('metadata'), // Additional custom metadata
}, (table) => ({
  modelNameIdx: index('ml_models_model_name_idx').on(table.modelName),
  statusIdx: index('ml_models_status_idx').on(table.status),
  createdByIdx: index('ml_models_created_by_idx').on(table.createdBy),
}));

/**
 * Training datasets used for model training
 */
export const mlTrainingDatasets = pgTable('ml_training_datasets', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull().references(() => mlModels.id, { onDelete: 'cascade' }),
  
  datasetId: text('dataset_id').notNull(), // External dataset identifier
  datasetVersion: text('dataset_version').notNull(),
  recordCount: integer('record_count').notNull(),
  dateRangeStart: timestamp('date_range_start'),
  dateRangeEnd: timestamp('date_range_end'),
  
  // NDPR compliance
  consentStatus: text('consent_status').notNull(), // 'compliant', 'review_required'
  legalBasis: text('legal_basis'), // NDPR legal basis for processing
  dataSourceDescription: text('data_source_description'),
  privacyImpactAssessmentCompleted: boolean('privacy_impact_assessment_completed').default(false),
  
  // Metadata
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  modelIdIdx: index('ml_training_datasets_model_id_idx').on(table.modelId),
}));

// ============================================================================
// APPROVAL WORKFLOWS
// ============================================================================

/**
 * Approval workflows for model deployments
 */
export const mlApprovalWorkflows = pgTable('ml_approval_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull().references(() => mlModels.id, { onDelete: 'cascade' }),
  status: workflowStatusEnum('status').notNull().default('pending'),
  
  // Workflow metadata
  requestedBy: text('requested_by').notNull(), // User ID
  requestedAt: timestamp('requested_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  
  // Workflow configuration
  stages: jsonb('stages').notNull(), // Array of stage definitions
  
  // Comments and notes
  notes: text('notes'),
  
  // Metadata
  metadata: jsonb('metadata'),
}, (table) => ({
  modelIdIdx: index('ml_approval_workflows_model_id_idx').on(table.modelId),
  statusIdx: index('ml_approval_workflows_status_idx').on(table.status),
}));

/**
 * Individual approval stages within workflows
 */
export const mlApprovalStages = pgTable('ml_approval_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => mlApprovalWorkflows.id, { onDelete: 'cascade' }),
  
  stageName: text('stage_name').notNull(), // e.g., "Pre-Deployment Review"
  stageOrder: integer('stage_order').notNull(), // 1, 2, 3, ...
  status: approvalStageStatusEnum('status').notNull().default('pending'),
  
  // Reviewer information
  assignedReviewer: text('assigned_reviewer'), // User ID or role
  reviewedBy: text('reviewed_by'), // Actual reviewer user ID
  reviewedAt: timestamp('reviewed_at'),
  
  // Review details
  checklist: jsonb('checklist'), // Array of checklist items
  comments: text('comments'),
  evidence: jsonb('evidence'), // Links to supporting documents
  
  // Metadata
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  workflowIdIdx: index('ml_approval_stages_workflow_id_idx').on(table.workflowId),
  statusIdx: index('ml_approval_stages_status_idx').on(table.status),
}));

// ============================================================================
// AUDIT TRAILS
// ============================================================================

/**
 * Comprehensive audit log for all ML lifecycle events
 */
export const mlAuditLogs = pgTable('ml_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  
  // Event information
  eventType: auditEventTypeEnum('event_type').notNull(),
  modelId: uuid('model_id'), // May be null for system-level events
  modelVersion: text('model_version'),
  
  // Actor information
  userId: text('user_id'), // User who triggered the event
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  // Event details
  action: text('action').notNull(), // Human-readable description
  result: text('result').notNull(), // 'success' or 'failure'
  errorMessage: text('error_message'),
  
  // Event metadata
  metadata: jsonb('metadata'), // Event-specific data
}, (table) => ({
  timestampIdx: index('ml_audit_logs_timestamp_idx').on(table.timestamp),
  eventTypeIdx: index('ml_audit_logs_event_type_idx').on(table.eventType),
  modelIdIdx: index('ml_audit_logs_model_id_idx').on(table.modelId),
  userIdIdx: index('ml_audit_logs_user_id_idx').on(table.userId),
}));

// ============================================================================
// DRIFT MONITORING
// ============================================================================

/**
 * Drift detection monitoring results
 */
export const mlDriftMonitoring = pgTable('ml_drift_monitoring', {
  id: uuid('id').primaryKey().defaultRandom(),
  modelId: uuid('model_id').notNull().references(() => mlModels.id, { onDelete: 'cascade' }),
  modelVersion: text('model_version').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  
  // Drift metrics
  dataDriftScore: integer('data_drift_score'), // 0-100
  conceptDriftScore: integer('concept_drift_score'), // 0-100
  predictionDriftScore: integer('prediction_drift_score'), // 0-100
  
  // Performance metrics
  performanceMetrics: jsonb('performance_metrics'), // Current accuracy, precision, etc.
  baselineMetrics: jsonb('baseline_metrics'), // Baseline for comparison
  
  // Alert information
  alertLevel: alertLevelEnum('alert_level').notNull().default('normal'),
  alertTriggered: boolean('alert_triggered').default(false),
  actionTaken: text('action_taken'),
  
  // Metadata
  metadata: jsonb('metadata'),
}, (table) => ({
  modelIdIdx: index('ml_drift_monitoring_model_id_idx').on(table.modelId),
  timestampIdx: index('ml_drift_monitoring_timestamp_idx').on(table.timestamp),
  alertLevelIdx: index('ml_drift_monitoring_alert_level_idx').on(table.alertLevel),
}));

// ============================================================================
// INFERENCE LOGGING
// ============================================================================

/**
 * Inference execution logs
 */
export const mlInferenceLogs = pgTable('ml_inference_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  
  // Model information
  modelId: uuid('model_id').notNull().references(() => mlModels.id, { onDelete: 'cascade' }),
  modelVersion: text('model_version').notNull(),
  
  // Request information
  userId: text('user_id'), // If user-initiated
  transactionId: text('transaction_id'), // If transaction-related
  
  // Inference details
  inputFeatures: jsonb('input_features'), // Anonymized if sensitive
  prediction: jsonb('prediction'),
  confidence: integer('confidence'), // 0-100
  latencyMs: integer('latency_ms').notNull(),
  
  // Error handling
  errorOccurred: boolean('error_occurred').default(false),
  errorMessage: text('error_message'),
  
  // Metadata
  metadata: jsonb('metadata'),
}, (table) => ({
  timestampIdx: index('ml_inference_logs_timestamp_idx').on(table.timestamp),
  modelIdIdx: index('ml_inference_logs_model_id_idx').on(table.modelId),
  userIdIdx: index('ml_inference_logs_user_id_idx').on(table.userId),
}));

// ============================================================================
// ROLLBACK HISTORY
// ============================================================================

/**
 * Model rollback events
 */
export const mlRollbackHistory = pgTable('ml_rollback_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  
  // Rollback details
  fromModelId: uuid('from_model_id').notNull().references(() => mlModels.id),
  fromVersion: text('from_version').notNull(),
  toModelId: uuid('to_model_id').notNull().references(() => mlModels.id),
  toVersion: text('to_version').notNull(),
  
  // Trigger information
  triggeredBy: text('triggered_by').notNull(), // User ID
  triggerReason: text('trigger_reason').notNull(), // 'drift_alert', 'incident', 'manual'
  
  // Execution details
  executionTimeMs: integer('execution_time_ms'),
  success: boolean('success').notNull(),
  errorMessage: text('error_message'),
  
  // Post-rollback monitoring
  postRollbackMetrics: jsonb('post_rollback_metrics'),
  incidentReportUrl: text('incident_report_url'),
  
  // Metadata
  metadata: jsonb('metadata'),
}, (table) => ({
  timestampIdx: index('ml_rollback_history_timestamp_idx').on(table.timestamp),
  fromModelIdIdx: index('ml_rollback_history_from_model_id_idx').on(table.fromModelId),
  triggeredByIdx: index('ml_rollback_history_triggered_by_idx').on(table.triggeredBy),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const mlModelsRelations = relations(mlModels, ({ one, many }) => ({
  parent: one(mlModels, {
    fields: [mlModels.parentModelId],
    references: [mlModels.id],
  }),
  trainingDatasets: many(mlTrainingDatasets),
  approvalWorkflows: many(mlApprovalWorkflows),
  driftMonitoring: many(mlDriftMonitoring),
  inferenceLogs: many(mlInferenceLogs),
}));

export const mlTrainingDatasetsRelations = relations(mlTrainingDatasets, ({ one }) => ({
  model: one(mlModels, {
    fields: [mlTrainingDatasets.modelId],
    references: [mlModels.id],
  }),
}));

export const mlApprovalWorkflowsRelations = relations(mlApprovalWorkflows, ({ one, many }) => ({
  model: one(mlModels, {
    fields: [mlApprovalWorkflows.modelId],
    references: [mlModels.id],
  }),
  stages: many(mlApprovalStages),
}));

export const mlApprovalStagesRelations = relations(mlApprovalStages, ({ one }) => ({
  workflow: one(mlApprovalWorkflows, {
    fields: [mlApprovalStages.workflowId],
    references: [mlApprovalWorkflows.id],
  }),
}));

export const mlDriftMonitoringRelations = relations(mlDriftMonitoring, ({ one }) => ({
  model: one(mlModels, {
    fields: [mlDriftMonitoring.modelId],
    references: [mlModels.id],
  }),
}));

export const mlInferenceLogsRelations = relations(mlInferenceLogs, ({ one }) => ({
  model: one(mlModels, {
    fields: [mlInferenceLogs.modelId],
    references: [mlModels.id],
  }),
}));

export const mlRollbackHistoryRelations = relations(mlRollbackHistory, ({ one }) => ({
  fromModel: one(mlModels, {
    fields: [mlRollbackHistory.fromModelId],
    references: [mlModels.id],
  }),
  toModel: one(mlModels, {
    fields: [mlRollbackHistory.toModelId],
    references: [mlModels.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MLModel = typeof mlModels.$inferSelect;
export type NewMLModel = typeof mlModels.$inferInsert;

export type MLTrainingDataset = typeof mlTrainingDatasets.$inferSelect;
export type NewMLTrainingDataset = typeof mlTrainingDatasets.$inferInsert;

export type MLApprovalWorkflow = typeof mlApprovalWorkflows.$inferSelect;
export type NewMLApprovalWorkflow = typeof mlApprovalWorkflows.$inferInsert;

export type MLApprovalStage = typeof mlApprovalStages.$inferSelect;
export type NewMLApprovalStage = typeof mlApprovalStages.$inferInsert;

export type MLAuditLog = typeof mlAuditLogs.$inferSelect;
export type NewMLAuditLog = typeof mlAuditLogs.$inferInsert;

export type MLDriftMonitoring = typeof mlDriftMonitoring.$inferSelect;
export type NewMLDriftMonitoring = typeof mlDriftMonitoring.$inferInsert;

export type MLInferenceLog = typeof mlInferenceLogs.$inferSelect;
export type NewMLInferenceLog = typeof mlInferenceLogs.$inferInsert;

export type MLRollbackHistory = typeof mlRollbackHistory.$inferSelect;
export type NewMLRollbackHistory = typeof mlRollbackHistory.$inferInsert;
