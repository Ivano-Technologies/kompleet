/**
 * MED-003: Data Quality Monitoring Service
 * Tracks and reports data quality metrics for transaction processing
 */

export interface QualityMetrics {
  parseSuccessRate: number;
  autoCategorizedRate: number;
  manualOverrideRate: number;
  duplicateDetectionRate: number;
  falsePositiveRate: number;
  averageConfidence: number;
  totalTransactionsProcessed: number;
  totalErrors: number;
}

export interface QualityThresholds {
  parseSuccessRate: number; // Target: >95%
  autoCategorizedRate: number; // Target: >70%
  manualOverrideRate: number; // Target: <15%
  duplicateDetectionRate: number; // Target: >90%
  falsePositiveRate: number; // Target: <5%
}

const DEFAULT_THRESHOLDS: QualityThresholds = {
  parseSuccessRate: 0.95,
  autoCategorizedRate: 0.70,
  manualOverrideRate: 0.15,
  duplicateDetectionRate: 0.90,
  falsePositiveRate: 0.05
};

/**
 * Data Quality Monitor
 * Tracks metrics and generates quality reports
 */
class DataQualityMonitor {
  private metrics: Partial<QualityMetrics> = {
    totalTransactionsProcessed: 0,
    totalErrors: 0
  };
  
  private thresholds: QualityThresholds = DEFAULT_THRESHOLDS;
  
  /**
   * Record parsing results
   */
  recordParseResult(total: number, successful: number, errors: number): void {
    this.metrics.parseSuccessRate = total > 0 ? successful / total : 0;
    this.metrics.totalTransactionsProcessed = (this.metrics.totalTransactionsProcessed || 0) + successful;
    this.metrics.totalErrors = (this.metrics.totalErrors || 0) + errors;
    
    console.log(`Parse result recorded: ${successful}/${total} successful (${(this.metrics.parseSuccessRate * 100).toFixed(1)}%)`);
  }
  
  /**
   * Record categorization results
   */
  recordCategorization(auto: number, manual: number, total: number): void {
    if (total > 0) {
      this.metrics.autoCategorizedRate = auto / total;
      this.metrics.manualOverrideRate = manual / total;
      
      console.log(`Categorization recorded: ${auto} auto, ${manual} manual out of ${total}`);
    }
  }
  
  /**
   * Record duplicate detection results
   */
  recordDuplicateDetection(detected: number, total: number, falsePositives: number = 0): void {
    if (total > 0) {
      this.metrics.duplicateDetectionRate = detected / total;
      this.metrics.falsePositiveRate = falsePositives / total;
      
      console.log(`Duplicate detection recorded: ${detected}/${total} detected, ${falsePositives} false positives`);
    }
  }
  
  /**
   * Record average confidence score
   */
  recordAverageConfidence(confidence: number): void {
    this.metrics.averageConfidence = confidence;
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): Partial<QualityMetrics> {
    return { ...this.metrics };
  }
  
  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<QualityThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }
  
  /**
   * Get thresholds
   */
  getThresholds(): QualityThresholds {
    return { ...this.thresholds };
  }
  
  /**
   * Check if metrics meet quality thresholds
   */
  meetsQualityStandards(): { passes: boolean; failures: string[] } {
    const failures: string[] = [];
    
    if (this.metrics.parseSuccessRate !== undefined && this.metrics.parseSuccessRate < this.thresholds.parseSuccessRate) {
      failures.push(`Parse success rate ${(this.metrics.parseSuccessRate * 100).toFixed(1)}% below target ${(this.thresholds.parseSuccessRate * 100).toFixed(1)}%`);
    }
    
    if (this.metrics.autoCategorizedRate !== undefined && this.metrics.autoCategorizedRate < this.thresholds.autoCategorizedRate) {
      failures.push(`Auto-categorization rate ${(this.metrics.autoCategorizedRate * 100).toFixed(1)}% below target ${(this.thresholds.autoCategorizedRate * 100).toFixed(1)}%`);
    }
    
    if (this.metrics.manualOverrideRate !== undefined && this.metrics.manualOverrideRate > this.thresholds.manualOverrideRate) {
      failures.push(`Manual override rate ${(this.metrics.manualOverrideRate * 100).toFixed(1)}% above target ${(this.thresholds.manualOverrideRate * 100).toFixed(1)}%`);
    }
    
    if (this.metrics.duplicateDetectionRate !== undefined && this.metrics.duplicateDetectionRate < this.thresholds.duplicateDetectionRate) {
      failures.push(`Duplicate detection rate ${(this.metrics.duplicateDetectionRate * 100).toFixed(1)}% below target ${(this.thresholds.duplicateDetectionRate * 100).toFixed(1)}%`);
    }
    
    if (this.metrics.falsePositiveRate !== undefined && this.metrics.falsePositiveRate > this.thresholds.falsePositiveRate) {
      failures.push(`False positive rate ${(this.metrics.falsePositiveRate * 100).toFixed(1)}% above target ${(this.thresholds.falsePositiveRate * 100).toFixed(1)}%`);
    }
    
    return {
      passes: failures.length === 0,
      failures
    };
  }
  
  /**
   * Generate comprehensive quality report
   */
  generateReport(): string {
    const metrics = this.metrics;
    const quality = this.meetsQualityStandards();
    
    const report = `
┌─────────────────────────────────────────────────────────────┐
│           DATA QUALITY REPORT                               │
└─────────────────────────────────────────────────────────────┘

PARSING METRICS
───────────────────────────────────────────────────────────────
Parse Success Rate:     ${formatMetric(metrics.parseSuccessRate, this.thresholds.parseSuccessRate, 'percentage')}
Total Processed:        ${metrics.totalTransactionsProcessed || 0} transactions
Total Errors:           ${metrics.totalErrors || 0} errors

CATEGORIZATION METRICS
───────────────────────────────────────────────────────────────
Auto-categorized:       ${formatMetric(metrics.autoCategorizedRate, this.thresholds.autoCategorizedRate, 'percentage')}
Manual Override:        ${formatMetric(metrics.manualOverrideRate, this.thresholds.manualOverrideRate, 'percentage', true)}
Average Confidence:     ${metrics.averageConfidence !== undefined ? (metrics.averageConfidence * 100).toFixed(1) + '%' : 'N/A'}

DUPLICATE DETECTION METRICS
───────────────────────────────────────────────────────────────
Detection Rate:         ${formatMetric(metrics.duplicateDetectionRate, this.thresholds.duplicateDetectionRate, 'percentage')}
False Positive Rate:    ${formatMetric(metrics.falsePositiveRate, this.thresholds.falsePositiveRate, 'percentage', true)}

OVERALL QUALITY STATUS
───────────────────────────────────────────────────────────────
Status:                 ${quality.passes ? '✅ PASSING' : '❌ FAILING'}
${quality.failures.length > 0 ? '\nIssues:\n' + quality.failures.map(f => `  • ${f}`).join('\n') : ''}

RECOMMENDATIONS
───────────────────────────────────────────────────────────────
${generateRecommendations(metrics, this.thresholds)}
    `.trim();
    
    return report;
  }
  
  /**
   * Generate JSON report for API consumption
   */
  generateJSONReport(): {
    metrics: Partial<QualityMetrics>;
    thresholds: QualityThresholds;
    quality: { passes: boolean; failures: string[] };
    timestamp: string;
  } {
    return {
      metrics: this.getMetrics(),
      thresholds: this.getThresholds(),
      quality: this.meetsQualityStandards(),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      totalTransactionsProcessed: 0,
      totalErrors: 0
    };
  }
}

/**
 * Format metric with threshold comparison
 */
function formatMetric(
  value: number | undefined,
  threshold: number,
  format: 'percentage' | 'number' = 'percentage',
  inverse: boolean = false
): string {
  if (value === undefined) return 'N/A';
  
  const displayValue = format === 'percentage' ? `${(value * 100).toFixed(1)}%` : value.toFixed(2);
  const targetValue = format === 'percentage' ? `${(threshold * 100).toFixed(1)}%` : threshold.toFixed(2);
  
  const meetsThreshold = inverse ? value <= threshold : value >= threshold;
  const status = meetsThreshold ? '✅' : '⚠️';
  
  return `${displayValue} (Target: ${inverse ? '<' : '>'}${targetValue}) ${status}`;
}

/**
 * Generate recommendations based on metrics
 */
function generateRecommendations(
  metrics: Partial<QualityMetrics>,
  thresholds: QualityThresholds
): string {
  const recommendations: string[] = [];
  
  if (metrics.parseSuccessRate !== undefined && metrics.parseSuccessRate < thresholds.parseSuccessRate) {
    recommendations.push('• Improve file format validation and error handling');
    recommendations.push('• Review failed parsing errors for common patterns');
  }
  
  if (metrics.autoCategorizedRate !== undefined && metrics.autoCategorizedRate < thresholds.autoCategorizedRate) {
    recommendations.push('• Expand categorization rules and keywords');
    recommendations.push('• Retrain ML model with more diverse data');
    recommendations.push('• Review uncategorized transactions for patterns');
  }
  
  if (metrics.manualOverrideRate !== undefined && metrics.manualOverrideRate > thresholds.manualOverrideRate) {
    recommendations.push('• Analyze manual overrides to improve auto-categorization');
    recommendations.push('• Add new rules based on common override patterns');
  }
  
  if (metrics.duplicateDetectionRate !== undefined && metrics.duplicateDetectionRate < thresholds.duplicateDetectionRate) {
    recommendations.push('• Review duplicate detection algorithm parameters');
    recommendations.push('• Adjust similarity thresholds');
  }
  
  if (metrics.falsePositiveRate !== undefined && metrics.falsePositiveRate > thresholds.falsePositiveRate) {
    recommendations.push('• Reduce duplicate detection sensitivity');
    recommendations.push('• Review false positive cases for patterns');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('• All metrics within acceptable ranges');
    recommendations.push('• Continue monitoring for any degradation');
  }
  
  return recommendations.join('\n');
}

/**
 * Singleton instance
 */
export const qualityMonitor = new DataQualityMonitor();

/**
 * Export class for testing
 */
export { DataQualityMonitor };
