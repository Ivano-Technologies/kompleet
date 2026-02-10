'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchForms();
  }, [selectedFormType, selectedYear]);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFormType !== 'all') params.append('formType', selectedFormType);
      if (selectedYear) params.append('taxYear', selectedYear.toString());

      const response = await fetch(`/api/forms/list?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setForms(data.forms);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (form: Form) => {
    const link = document.createElement('a');
    link.href = form.pdf_url;
    link.download = `NRS_${form.form_type}_${form.tax_year}_${form.id.slice(0, 8)}.pdf`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      generated: { color: 'bg-blue-100 text-blue-800', icon: FileText },
      filed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      archived: { color: 'bg-purple-100 text-purple-800', icon: FileText }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getFormTypeColor = (formType: string) => {
    const colors = {
      PIT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CIT: 'bg-blue-100 text-blue-800 border-blue-200',
      VAT: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[formType as keyof typeof colors] || colors.PIT;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Filing Center</h1>
          <p className="text-gray-600">Generate and manage your NRS tax forms</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              {/* Form Type Filter */}
              <select
                value={selectedFormType}
                onChange={(e) => setSelectedFormType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Forms</option>
                <option value="PIT">Personal Income Tax (PIT)</option>
                <option value="CIT">Company Income Tax (CIT)</option>
                <option value="VAT">Value Added Tax (VAT)</option>
              </select>

              {/* Tax Year Filter */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>

            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate New Form
            </button>
          </div>
        </div>

        {/* Filing Workflow Guide */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 mb-6 border border-emerald-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-600" />
            Filing Workflow Guide
          </h3>
          <ol className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">1.</span>
              <span>Generate your NRS form by clicking "Generate New Form" and filling in the required information</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">2.</span>
              <span>Download the generated PDF form from the list below</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">3.</span>
              <span>Review the form carefully and ensure all information is accurate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">4.</span>
              <span>Submit the form to the Nigerian Revenue Service (NRS) portal or your nearest tax office</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-emerald-600">5.</span>
              <span>Mark the form as "Filed" once submitted and enter your confirmation number</span>
            </li>
          </ol>
        </div>

        {/* Forms List */}
        <div className="bg-white rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Forms</h2>
            <p className="text-sm text-gray-600 mt-1">
              {forms.length} {forms.length === 1 ? 'form' : 'forms'} found
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="mt-4 text-gray-600">Loading forms...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
              <p className="text-gray-600 mb-6">Generate your first NRS tax form to get started</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Generate Form
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {forms.map((form) => (
                <div key={form.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg border-2 ${getFormTypeColor(form.form_type)}`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {form.form_type === 'PIT' && 'Personal Income Tax Return'}
                            {form.form_type === 'CIT' && 'Company Income Tax Return'}
                            {form.form_type === 'VAT' && 'VAT Return'}
                          </h3>
                          {getStatusBadge(form.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Tax Year: {form.tax_year}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Generated: {new Date(form.created_at).toLocaleDateString('en-NG')}
                          </span>
                        </div>

                        {form.filing_status && form.filing_status.length > 0 && (
                          <div className="mt-2 text-sm text-emerald-600 font-medium">
                            Filed on {new Date(form.filing_status[0].filed_date).toLocaleDateString('en-NG')}
                            {form.filing_status[0].confirmation_number && 
                              ` • Confirmation: ${form.filing_status[0].confirmation_number}`
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(form)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
