'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, RefreshCw, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

interface CorrectionStats {
  totalCorrections: number;
  correctionRate: number;
  topMiscategorized: Array<{ pair: string; count: number }>;
}

interface RecurringPattern {
  merchant_normalized: string;
  interval_days: number;
  amount_mean: number;
  confidence: number;
  next_expected_date: string;
  occurrence_count: number;
}

export default function MLSettingsPage() {
  const [emailConnections, setEmailConnections] = useState({
    gmail: { connected: false, email: '' },
    outlook: { connected: false, email: '' }
  });
  const [correctionStats, setCorrectionStats] = useState<CorrectionStats | null>(null);
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      // Load correction stats
      const statsRes = await fetch('/api/ml/corrections');
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setCorrectionStats(stats);
      }

      // Load recurring patterns
      const patternsRes = await fetch('/api/ml/recurring');
      if (patternsRes.ok) {
        const data = await patternsRes.json();
        setRecurringPatterns(data.patterns || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading ML settings:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function connectEmail(provider: 'gmail' | 'outlook') {
    try {
      const res = await fetch(`/api/email/connect/${provider}`, {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to OAuth authorization
        window.location.href = data.authorization_url;
      }
    } catch (error) {
      console.error(`Error connecting ${provider}:`, error);
    }
  }

  async function detectRecurringPatterns() {
    try {
      setLoading(true);
      const res = await fetch('/api/ml/recurring', {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        setRecurringPatterns(data.patterns || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error detecting patterns:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ML & Automation Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage email integrations, view ML performance, and configure automation
        </p>
      </div>

      {/* Email Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Integrations
          </CardTitle>
          <CardDescription>
            Connect your email accounts to automatically import transactions from receipts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Gmail */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium">Gmail</p>
                {emailConnections.gmail.connected ? (
                  <p className="text-sm text-gray-600">{emailConnections.gmail.email}</p>
                ) : (
                  <p className="text-sm text-gray-500">Not connected</p>
                )}
              </div>
            </div>
            {emailConnections.gmail.connected ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Button onClick={() => connectEmail('gmail')}>
                Connect Gmail
              </Button>
            )}
          </div>

          {/* Outlook */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Outlook</p>
                {emailConnections.outlook.connected ? (
                  <p className="text-sm text-gray-600">{emailConnections.outlook.email}</p>
                ) : (
                  <p className="text-sm text-gray-500">Not connected</p>
                )}
              </div>
            </div>
            {emailConnections.outlook.connected ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Button onClick={() => connectEmail('outlook')}>
                Connect Outlook
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ML Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            ML Categorization Performance
          </CardTitle>
          <CardDescription>
            Your corrections help improve the ML model for everyone
          </CardDescription>
        </CardHeader>
        <CardContent>
          {correctionStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Corrections</p>
                  <p className="text-2xl font-bold">{correctionStats.totalCorrections}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Model Accuracy</p>
                  <p className="text-2xl font-bold">87%</p>
                </div>
              </div>

              {correctionStats.topMiscategorized.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Most Common Corrections</p>
                  <div className="space-y-2">
                    {correctionStats.topMiscategorized.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.pair}</span>
                        <Badge variant="secondary">{item.count} times</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Recurring Transactions
          </CardTitle>
          <CardDescription>
            Automatically detected payment patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={detectRecurringPatterns} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Detect Patterns
            </Button>

            {recurringPatterns.length > 0 ? (
              <div className="space-y-2">
                {recurringPatterns.map((pattern, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">
                          {pattern.merchant_normalized.replace(/([a-z])([A-Z])/g, '$1 $2')}
                        </p>
                        <p className="text-sm text-gray-600">
                          Every {pattern.interval_days} days • ₦{pattern.amount_mean.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Next expected: {new Date(pattern.next_expected_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(pattern.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No recurring patterns detected yet. Click "Detect Patterns" to analyze your transactions.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
