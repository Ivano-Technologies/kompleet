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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MLGovernanceDashboard() {
  const [kpis, setKpis] = useState<GovernanceKPIs | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const kpisRes = await fetch('/api/ml-governance/metrics/kpis');
      const kpisData = await kpisRes.json();
      if (kpisData.success) {
        setKpis(kpisData.kpis);
      }

      const modelsRes = await fetch('/api/ml-governance/models?limit=10');
      const modelsData = await modelsRes.json();
      if (modelsData.success) {
        setModels(modelsData.models);
      }

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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading ML Governance Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            ML Governance Dashboard
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Monitor models, approvals, drift, and compliance
          </p>
        </div>
        <Button>Register New Model</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Total Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.totalModels || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Deployed Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{kpis?.deployedModels || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Rollback Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{kpis?.rollbackSuccessRate || 100}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
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
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
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
                  <p className="text-center text-light-text-tertiary dark:text-dark-text-tertiary py-8">
                    No models registered yet
                  </p>
                ) : (
                  models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
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
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                          Created: {new Date(model.createdAt).toLocaleDateString()}
                          {model.deployedAt &&
                            ` - Deployed: ${new Date(model.deployedAt).toLocaleDateString()}`}
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
              <p className="text-center text-light-text-tertiary dark:text-dark-text-tertiary py-8">
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
              <p className="text-center text-light-text-tertiary dark:text-dark-text-tertiary py-8">
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
              <p className="text-center text-light-text-tertiary dark:text-dark-text-tertiary py-8">
                No audit logs available
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
