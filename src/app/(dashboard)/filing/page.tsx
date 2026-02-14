'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Calendar, CheckCircle, Clock, Info } from 'lucide-react';

interface Form {
  id: string;
  form_type: 'PIT' | 'CIT' | 'VAT';
  tax_year: number;
  status: string;
  created_at: string;
  pdf_url: string;
  filing_status?: {
    status: string;
    filed_date: string;
    confirmation_number: string;
  }[];
}

export default function FilingCenterPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormType, setSelectedFormType] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFormType !== 'all') params.append('formType', selectedFormType);
      if (selectedYear) params.append('taxYear', selectedYear.toString());
      const response = await fetch(`/api/forms/list?${params}`);
      const data = await response.json();
      if (data.success) setForms(data.forms);
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedFormType, selectedYear]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleDownload = (form: Form) => {
    const link = document.createElement('a');
    link.href = form.pdf_url;
    link.download = `NRS_${form.form_type}_${form.tax_year}_${form.id.slice(0, 8)}.pdf`;
    link.click();
  };

  const statusStyles: Record<string, { cls: string; Icon: typeof Clock }> = {
    draft: { cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400', Icon: Clock },
    generated: { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', Icon: FileText },
    filed: { cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', Icon: CheckCircle },
    archived: { cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-500', Icon: FileText },
  };

  const formTypeStyles: Record<string, string> = {
    PIT: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/40',
    CIT: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/40',
    VAT: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/40',
  };

  const formTypeLabels: Record<string, string> = {
    PIT: 'Personal Income Tax Return',
    CIT: 'Company Income Tax Return',
    VAT: 'VAT Return',
  };

  const selectCls =
    'px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Filing Center
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Generate and manage your NRS tax forms
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 self-start"
        >
          <FileText className="w-3.5 h-3.5" /> Generate New Form
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedFormType} onChange={(e) => setSelectedFormType(e.target.value)} className={selectCls}>
          <option value="all">All Forms</option>
          <option value="PIT">Personal Income Tax (PIT)</option>
          <option value="CIT">Company Income Tax (CIT)</option>
          <option value="VAT">Value Added Tax (VAT)</option>
        </select>
        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className={selectCls}>
          <option value={2026}>2026</option>
          <option value={2025}>2025</option>
          <option value={2024}>2024</option>
        </select>
      </div>

      {/* Filing Workflow Guide */}
      <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Filing Workflow</h3>
        </div>
        <ol className="space-y-1 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          {[
            'Generate your NRS form by clicking "Generate New Form"',
            'Download the generated PDF form',
            'Review the form and ensure all information is accurate',
            'Submit to the NRS portal or nearest tax office',
            'Mark as "Filed" and enter your confirmation number',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-semibold text-primary-500">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Forms List */}
      <div className="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-light-border dark:border-dark-border">
          <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary">
            Your Forms
          </h2>
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-0.5">
            {forms.length} {forms.length === 1 ? 'form' : 'forms'} found
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">Loading forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-light-text-tertiary dark:text-dark-text-tertiary opacity-40" />
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">No forms yet</p>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-4">
              Generate your first NRS tax form to get started
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="btn-primary text-sm px-4 py-2"
            >
              Generate Form
            </button>
          </div>
        ) : (
          <div className="divide-y divide-light-border/50 dark:divide-dark-border/50">
            {forms.map((form) => {
              const badge = statusStyles[form.status] || statusStyles.draft;
              const BadgeIcon = badge.Icon;
              return (
                <div
                  key={form.id}
                  className="p-5 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-lg border ${formTypeStyles[form.form_type] || formTypeStyles.PIT}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                            {formTypeLabels[form.form_type] || form.form_type}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                            <BadgeIcon className="w-3 h-3" />
                            {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Year: {form.tax_year}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(form.created_at).toLocaleDateString('en-NG')}
                          </span>
                        </div>
                        {form.filing_status && form.filing_status.length > 0 && (
                          <p className="mt-1 text-xs text-primary-500 font-medium">
                            Filed {new Date(form.filing_status[0].filed_date).toLocaleDateString('en-NG')}
                            {form.filing_status[0].confirmation_number &&
                              ` · Ref: ${form.filing_status[0].confirmation_number}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(form)}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
