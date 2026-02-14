
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
import { Loader2, ShieldCheck } from 'lucide-react';

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
          <Loader2 className="animate-spin h-12 w-12 text-primary-500 mx-auto mb-4" />
          <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading ML Governance Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <ShieldCheck className="h-8 w-8 text-primary-500" />
            <div>
                <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    ML Governance Dashboard
                </h1>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    Monitor models, approvals, drift, and compliance
                </p>
            </div>
        </div>
        <Button className="btn-primary rounded-lg">Register New Model</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Total Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{kpis?.totalModels || 0}</div>
          </CardContent>
        </Card>

        <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Deployed Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-500">{kpis?.deployedModels || 0}</div>
          </CardContent>
        </Card>

        <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Rollback Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{kpis?.rollbackSuccessRate || 100}%</div>
          </CardContent>
        </Card>

        <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Avg Rollback Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {kpis ? Math.round(kpis.avgRollbackTimeMs / 1000) : 0}s
            </div>
          </CardContent>
        </Card>

        <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Documentation Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{kpis?.documentationCompleteness || 0}%</div>
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
          <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-light-text-primary dark:text-dark-text-primary">Model Registry</CardTitle>
              <CardDescription className="text-light-text-secondary dark:text-dark-text-secondary">All registered ML models and their versions</CardDescription>
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
                      className="flex items-center justify-between p-4 border border-light-border dark:border-dark-border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary">{model.modelName}</h3>
                          <Badge variant="outline">{model.version}</Badge>
                          <Badge
                            className={model.status === 'deployed' ? 'bg-primary-500' : 'bg-light-text-tertiary'}
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
                      <Button variant="ghost" size="sm" className="rounded-lg">
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
          <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-light-text-primary dark:text-dark-text-primary">Pending Approvals</CardTitle>
              <CardDescription className="text-light-text-secondary dark:text-dark-text-secondary">Models awaiting approval for deployment</CardDescription>
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
          <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-light-text-primary dark:text-dark-text-primary">Drift Alerts</CardTitle>
              <CardDescription className="text-light-text-secondary dark:text-dark-text-secondary">Models with detected drift or performance issues</CardDescription>
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
          <Card className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
            <CardHeader>
              <CardTitle className="text-light-text-primary dark:text-dark-text-primary">Audit Logs</CardTitle>
              <CardDescription className="text-light-text-secondary dark:text-dark-text-secondary">Complete audit trail of ML lifecycle events</CardDescription>
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
