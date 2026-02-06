/**
 * Approval Workflow Service
 * 
 * Manages multi-stage approval workflows for model deployments,
 * ensuring compliance, security, and quality gates are met.
 * 
 * @module server/ml-governance/approval-workflow
 */

import { db } from '@/db';
import {
  mlApprovalWorkflows,
  mlApprovalStages,
  mlAuditLogs,
  type NewMLApprovalWorkflow,
  type NewMLApprovalStage,
  type MLApprovalWorkflow,
  type MLApprovalStage,
} from '@/db/schema-ml-governance';
import { eq, and } from 'drizzle-orm';
import ModelRegistryService from './model-registry';

// ============================================================================
// TYPES
// ============================================================================

export interface ChecklistItem {
  item: string;
  checked: boolean;
  evidence?: string;
}

export interface StageDefinition {
  stageName: string;
  stageOrder: number;
  assignedReviewer: string; // User ID or role
  checklist: ChecklistItem[];
}

export interface CreateWorkflowInput {
  modelId: string;
  requestedBy: string;
  stages: StageDefinition[];
  notes?: string;
}

export interface ReviewStageInput {
  workflowId: string;
  stageId: string;
  reviewedBy: string;
  approved: boolean;
  checklist: ChecklistItem[];
  comments?: string;
  evidence?: Record<string, string>;
}

// ============================================================================
// DEFAULT WORKFLOW TEMPLATES
// ============================================================================

export const DEFAULT_DEPLOYMENT_WORKFLOW: StageDefinition[] = [
  {
    stageName: 'Pre-Deployment Review',
    stageOrder: 1,
    assignedReviewer: 'ml_governance_lead',
    checklist: [
      { item: 'Model performance meets minimum thresholds', checked: false },
      { item: 'Evaluation metrics documented', checked: false },
      { item: 'Training data lineage verified', checked: false },
      { item: 'Code review completed', checked: false },
      { item: 'Unit tests passing', checked: false },
    ],
  },
  {
    stageName: 'Compliance Sign-Off',
    stageOrder: 2,
    assignedReviewer: 'compliance_officer',
    checklist: [
      { item: 'NDPR compliance verified', checked: false },
      { item: 'Data consent status confirmed', checked: false },
      { item: 'Data sources documented', checked: false },
      { item: 'Privacy impact assessment completed (if required)', checked: false },
      { item: 'Processing lawfulness documented', checked: false },
    ],
  },
  {
    stageName: 'Security Review',
    stageOrder: 3,
    assignedReviewer: 'security_reviewer',
    checklist: [
      { item: 'Model artifact integrity verified', checked: false },
      { item: 'Access controls configured', checked: false },
      { item: 'Inference API security reviewed', checked: false },
      { item: 'Rate limiting configured', checked: false },
      { item: 'Sensitive data handling reviewed', checked: false },
    ],
  },
  {
    stageName: 'Final Approval',
    stageOrder: 4,
    assignedReviewer: 'ml_governance_lead',
    checklist: [
      { item: 'All previous stages approved', checked: false },
      { item: 'Deployment plan reviewed', checked: false },
      { item: 'Rollback procedure documented', checked: false },
      { item: 'Monitoring configured', checked: false },
    ],
  },
];

// ============================================================================
// APPROVAL WORKFLOW SERVICE
// ============================================================================

export class ApprovalWorkflowService {
  /**
   * Create a new approval workflow
   */
  static async createWorkflow(input: CreateWorkflowInput): Promise<MLApprovalWorkflow> {
    // Verify model exists
    const model = await ModelRegistryService.getModel(input.modelId);
    if (!model) {
      throw new Error(`Model ${input.modelId} not found.`);
    }

    // Check for existing pending workflow
    const existingWorkflow = await db.query.mlApprovalWorkflows.findFirst({
      where: and(
        eq(mlApprovalWorkflows.modelId, input.modelId),
        eq(mlApprovalWorkflows.status, 'pending')
      ),
    });

    if (existingWorkflow) {
      throw new Error(`Model ${input.modelId} already has a pending approval workflow.`);
    }

    // Create workflow
    const [workflow] = await db.insert(mlApprovalWorkflows).values({
      modelId: input.modelId,
      status: 'pending',
      requestedBy: input.requestedBy,
      stages: input.stages, // Store stage definitions
      notes: input.notes,
    }).returning();

    // Create individual stage records
    for (const stageDef of input.stages) {
      await db.insert(mlApprovalStages).values({
        workflowId: workflow.id,
        stageName: stageDef.stageName,
        stageOrder: stageDef.stageOrder,
        status: stageDef.stageOrder === 1 ? 'pending' : 'pending', // First stage is active
        assignedReviewer: stageDef.assignedReviewer,
        checklist: stageDef.checklist,
      });
    }

    // Update model status
    await ModelRegistryService.updateModelStatus({
      modelId: input.modelId,
      status: 'pending_approval',
      userId: input.requestedBy,
    });

    // Log audit event
    await this.logAuditEvent({
      eventType: 'approval_requested',
      modelId: input.modelId,
      modelVersion: model.version,
      userId: input.requestedBy,
      action: `Created approval workflow with ${input.stages.length} stages`,
      result: 'success',
      metadata: {
        workflowId: workflow.id,
        stageCount: input.stages.length,
      },
    });

    return workflow;
  }

  /**
   * Get workflow with all stages
   */
  static async getWorkflow(workflowId: string): Promise<MLApprovalWorkflow | null> {
    const workflow = await db.query.mlApprovalWorkflows.findFirst({
      where: eq(mlApprovalWorkflows.id, workflowId),
      with: {
        stages: {
          orderBy: (stages, { asc }) => [asc(stages.stageOrder)],
        },
        model: true,
      },
    });

    return workflow || null;
  }

  /**
   * Review and approve/reject a stage
   */
  static async reviewStage(input: ReviewStageInput): Promise<MLApprovalStage> {
    // Get workflow and stage
    const workflow = await this.getWorkflow(input.workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${input.workflowId} not found.`);
    }

    const stage = workflow.stages?.find((s: any) => s.id === input.stageId);
    if (!stage) {
      throw new Error(`Stage ${input.stageId} not found in workflow.`);
    }

    if (stage.status !== 'pending') {
      throw new Error(`Stage ${stage.stageName} is not pending review.`);
    }

    // Verify all checklist items are checked if approving
    if (input.approved) {
      const allChecked = input.checklist.every((item) => item.checked);
      if (!allChecked) {
        throw new Error('All checklist items must be checked to approve this stage.');
      }
    }

    // Update stage
    const [updatedStage] = await db.update(mlApprovalStages)
      .set({
        status: input.approved ? 'approved' : 'rejected',
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
        checklist: input.checklist,
        comments: input.comments,
        evidence: input.evidence,
      })
      .where(eq(mlApprovalStages.id, input.stageId))
      .returning();

    // Log audit event
    await this.logAuditEvent({
      eventType: input.approved ? 'approval_granted' : 'approval_rejected',
      modelId: workflow.modelId,
      modelVersion: (workflow as any).model?.version,
      userId: input.reviewedBy,
      action: `${input.approved ? 'Approved' : 'Rejected'} stage: ${stage.stageName}`,
      result: 'success',
      metadata: {
        workflowId: input.workflowId,
        stageId: input.stageId,
        stageName: stage.stageName,
        comments: input.comments,
      },
    });

    // Handle workflow completion or rejection
    if (input.approved) {
      await this.handleStageApproval(workflow, stage);
    } else {
      await this.handleStageRejection(workflow);
    }

    return updatedStage;
  }

  /**
   * Handle stage approval - check if workflow is complete
   */
  private static async handleStageApproval(workflow: any, approvedStage: any): Promise<void> {
    const stages = workflow.stages || [];
    const allApproved = stages.every((s: any) => s.status === 'approved' || s.id === approvedStage.id);

    if (allApproved) {
      // All stages approved - complete workflow
      await db.update(mlApprovalWorkflows)
        .set({
          status: 'approved',
          completedAt: new Date(),
        })
        .where(eq(mlApprovalWorkflows.id, workflow.id));

      // Update model status to approved
      await ModelRegistryService.updateModelStatus({
        modelId: workflow.modelId,
        status: 'approved',
        userId: approvedStage.reviewedBy,
        notes: 'All approval stages completed',
      });

      await this.logAuditEvent({
        eventType: 'approval_granted',
        modelId: workflow.modelId,
        modelVersion: workflow.model?.version,
        userId: approvedStage.reviewedBy,
        action: 'Approval workflow completed - all stages approved',
        result: 'success',
        metadata: {
          workflowId: workflow.id,
        },
      });
    }
  }

  /**
   * Handle stage rejection - reject entire workflow
   */
  private static async handleStageRejection(workflow: any): Promise<void> {
    // Reject workflow
    await db.update(mlApprovalWorkflows)
      .set({
        status: 'rejected',
        completedAt: new Date(),
      })
      .where(eq(mlApprovalWorkflows.id, workflow.id));

    // Revert model status to draft
    await ModelRegistryService.updateModelStatus({
      modelId: workflow.modelId,
      status: 'draft',
      userId: 'system',
      notes: 'Approval workflow rejected',
    });
  }

  /**
   * Cancel a workflow
   */
  static async cancelWorkflow(workflowId: string, userId: string): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found.`);
    }

    if (workflow.status !== 'pending') {
      throw new Error('Only pending workflows can be cancelled.');
    }

    await db.update(mlApprovalWorkflows)
      .set({
        status: 'cancelled',
        completedAt: new Date(),
      })
      .where(eq(mlApprovalWorkflows.id, workflowId));

    // Revert model status
    await ModelRegistryService.updateModelStatus({
      modelId: workflow.modelId,
      status: 'draft',
      userId,
      notes: 'Approval workflow cancelled',
    });

    await this.logAuditEvent({
      eventType: 'approval_rejected',
      modelId: workflow.modelId,
      modelVersion: (workflow as any).model?.version,
      userId,
      action: 'Cancelled approval workflow',
      result: 'success',
      metadata: {
        workflowId,
      },
    });
  }

  /**
   * Get pending workflows for a reviewer
   */
  static async getPendingWorkflowsForReviewer(reviewerId: string): Promise<any[]> {
    const workflows = await db.query.mlApprovalWorkflows.findMany({
      where: eq(mlApprovalWorkflows.status, 'pending'),
      with: {
        stages: true,
        model: true,
      },
    });

    // Filter workflows where reviewer has pending stages
    return workflows.filter((workflow) => {
      return workflow.stages?.some(
        (stage: any) => stage.assignedReviewer === reviewerId && stage.status === 'pending'
      );
    });
  }

  /**
   * Create expedited rollback approval workflow
   */
  static async createExpeditedRollbackWorkflow(input: {
    modelId: string;
    requestedBy: string;
    reason: string;
  }): Promise<MLApprovalWorkflow> {
    const expeditedStages: StageDefinition[] = [
      {
        stageName: 'Emergency Rollback Approval',
        stageOrder: 1,
        assignedReviewer: 'ml_governance_lead',
        checklist: [
          { item: 'Rollback reason documented', checked: false },
          { item: 'Target version verified', checked: false },
          { item: 'Incident severity assessed', checked: false },
        ],
      },
    ];

    return this.createWorkflow({
      modelId: input.modelId,
      requestedBy: input.requestedBy,
      stages: expeditedStages,
      notes: `Expedited rollback workflow: ${input.reason}`,
    });
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

export default ApprovalWorkflowService;
