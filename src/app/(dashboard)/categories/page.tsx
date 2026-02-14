'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tags, Pencil, Plus, X, Save, Loader2, ArrowRight, Lightbulb } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  category_type: string;
  tax_treatment: string;
  keywords: string[];
  description?: string;
  is_system: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [newKeyword, setNewKeyword] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) setCategories(data.categories || []);
    } catch (error) { console.error('Error fetching categories:', error); }
    finally { setLoading(false); }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({ name: category.name, description: category.description, keywords: [...category.keywords] });
    setNewKeyword('');
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      const response = await fetch(`/api/categories/${editingId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm),
      });
      if (response.ok) { await fetchCategories(); setEditingId(null); setEditForm({}); }
    } catch (error) { console.error('Error saving category:', error); }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    setEditForm({ ...editForm, keywords: [...(editForm.keywords || []), newKeyword.trim()] });
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    setEditForm({ ...editForm, keywords: (editForm.keywords || []).filter(k => k !== keyword) });
  };

  const filteredCategories = categories.filter(cat => filter === 'all' || cat.category_type === filter);

  const typeColor: Record<string, string> = {
    income: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    expense: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    asset: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    liability: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  };
  const taxColor: Record<string, string> = {
    deductible: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    non_deductible: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    capital_allowance: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    exempt: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary-500';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="ml-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tags className="w-5 h-5 text-primary-500" />
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Categories</h1>
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Manage transaction categories and keywords for auto-categorization
          </p>
        </div>
        <Link href="/transactions" className="text-sm font-medium text-primary-500 hover:text-primary-400 flex items-center gap-1">
          View Transactions <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-light-border dark:border-dark-border">
        {['all', 'income', 'expense', 'asset', 'liability'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-2 text-sm font-medium capitalize transition-colors ${
              filter === type
                ? 'border-b-2 border-primary-500 text-primary-500'
                : 'text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary'
            }`}
          >
            {type}
            {type !== 'all' && (
              <span className="ml-1 text-xs opacity-60">({categories.filter(c => c.category_type === type).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {filteredCategories.map((category) => (
          <div key={category.id} className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:border-primary-500/30 transition-colors">
            {editingId === category.id ? (
              /* Edit Mode */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Category Name</label>
                  <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} disabled={category.is_system} className={`${inputCls} disabled:opacity-50`} />
                  {category.is_system && <p className="text-[10px] text-light-text-tertiary dark:text-dark-text-tertiary mt-1">System categories cannot be renamed</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Description</label>
                  <textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className={inputCls} placeholder="Optional description..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Keywords</label>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()} placeholder="Add keyword..." className={`flex-1 ${inputCls}`} />
                    <button onClick={handleAddKeyword} className="btn-primary text-xs px-3 py-2 flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(editForm.keywords || []).map((keyword) => (
                      <span key={keyword} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-xs">
                        {keyword}
                        <button onClick={() => handleRemoveKeyword(keyword)} className="hover:text-primary-800"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-light-border dark:border-dark-border">
                  <button onClick={handleSave} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => { setEditingId(null); setEditForm({}); }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {category.name}
                      {category.is_system && <span className="ml-1.5 text-[10px] text-light-text-tertiary dark:text-dark-text-tertiary">(System)</span>}
                    </h3>
                    {category.description && <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">{category.description}</p>}
                  </div>
                  <button onClick={() => handleEdit(category)} className="text-xs font-medium text-primary-500 hover:text-primary-400 flex items-center gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColor[category.category_type] || 'bg-gray-100 text-gray-700'}`}>
                    {category.category_type}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${taxColor[category.tax_treatment] || 'bg-gray-100 text-gray-700'}`}>
                    {category.tax_treatment.replace('_', ' ')}
                  </span>
                </div>
                {category.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {category.keywords.map((keyword) => (
                      <span key={keyword} className="px-2 py-0.5 bg-light-background dark:bg-dark-background text-light-text-tertiary dark:text-dark-text-tertiary rounded text-[10px]">{keyword}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="py-12 text-center rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <Tags className="w-6 h-6 mx-auto mb-2 text-light-text-tertiary dark:text-dark-text-tertiary opacity-40" />
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">No categories found in this filter</p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-xl border border-primary-200 dark:border-primary-800/30 bg-primary-50/50 dark:bg-primary-900/10">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1.5">How Auto-Categorization Works</h3>
            <ul className="space-y-1 text-xs text-light-text-secondary dark:text-dark-text-secondary">
              <li>• Keywords are matched against transaction descriptions (case-insensitive)</li>
              <li>• More specific keywords get higher confidence scores</li>
              <li>• System categories provide baseline tax treatment rules</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
