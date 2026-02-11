'use client';

/**
 * ML Governance Dashboard
 * 
 * Comprehensive dashboard for monitoring ML models, approval workflows,
 * drift detection, and governance KPIs.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ============================================================================
// TYPES
// ============================================================================

interface GovernanceKPIs {
  rollbackSuccessRate: number;
  avgRollbackTimeMs: number;
  documentationCompleteness: number;
  totalModels: number;
  deployedModels: number;
}

interface Model {
  id: string;
  modelName: string;
  version: string;
  status: string;
  createdAt: string;
  deployedAt?: string;
}

interface DriftMetrics {
  dataDriftScore: number;
  conceptDriftScore: number;
  predictionDriftScore: number;
  alertLevel: string;
  timestamp: string;
}

interface ApprovalWorkflow {
  id: string;
  modelId: string;
  status: string;
  requestedBy: string;
  requestedAt: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MLGovernanceDashboard() {
  const [kpis, setKpis] = useState<GovernanceKPIs | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [driftAlerts, setDriftAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      // Load KPIs
      const kpisRes = await fetch('/api/ml-governance/metrics/kpis');
      const kpisData = await kpisRes.json();
      if (kpisData.success) {
        setKpis(kpisData.kpis);
      }

      // Load models
      const modelsRes = await fetch('/api/ml-governance/models?limit=10');
      const modelsData = await modelsRes.json();
      if (modelsData.success) {
        setModels(modelsData.models);
      }

      // TODO: Load workflows and drift alerts
      // const workflowsRes = await fetch('/api/ml-governance/approvals/pending/current-user');
      // const driftRes = await fetch('/api/ml-governance/drift/alerts');

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ML Governance Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ML Governance Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor models, approvals, drift, and compliance
          </p>
        </div>
        <Button>Register New Model</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.totalModels || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deployed Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{kpis?.deployedModels || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rollback Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.rollbackSuccessRate || 100}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Rollback Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {kpis ? Math.round(kpis.avgRollbackTimeMs / 1000) : 0}s
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documentation Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.documentationCompleteness || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="models" className="space-y-4">
        <TabsList>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="drift">Drift Monitoring</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Registry</CardTitle>
              <CardDescription>All registered ML models and their versions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No models registered yet
                  </p>
                ) : (
                  models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{model.modelName}</h3>
                          <Badge variant="outline">{model.version}</Badge>
                          <Badge
                            variant={
                              model.status === 'deployed'
                                ? 'default'
                                : model.status === 'approved'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {model.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created: {new Date(model.createdAt).toLocaleDateString()}
                          {model.deployedAt &&
                            ` • Deployed: ${new Date(model.deployedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Models awaiting approval for deployment</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No pending approvals
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drift Monitoring Tab */}
        <TabsContent value="drift" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drift Alerts</CardTitle>
              <CardDescription>Models with detected drift or performance issues</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No drift alerts
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>Complete audit trail of ML lifecycle events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                No audit logs available
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
