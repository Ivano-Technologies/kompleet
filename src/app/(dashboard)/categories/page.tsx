'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description,
      keywords: [...category.keywords],
    });
    setNewKeyword('');
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/categories/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await fetchCategories();
        setEditingId(null);
        setEditForm({});
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    setEditForm({
      ...editForm,
      keywords: [...(editForm.keywords || []), newKeyword.trim()],
    });
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    setEditForm({
      ...editForm,
      keywords: (editForm.keywords || []).filter(k => k !== keyword),
    });
  };

  const filteredCategories = categories.filter(cat => {
    if (filter === 'all') return true;
    return cat.category_type === filter;
  });

  const getCategoryTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      income: 'bg-green-100 text-green-800',
      expense: 'bg-red-100 text-red-800',
      asset: 'bg-blue-100 text-blue-800',
      liability: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTaxTreatmentColor = (treatment: string) => {
    const colors: Record<string, string> = {
      deductible: 'bg-green-100 text-green-800',
      non_deductible: 'bg-red-100 text-red-800',
      capital_allowance: 'bg-blue-100 text-blue-800',
      exempt: 'bg-gray-100 text-gray-800',
    };
    return colors[treatment] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
            <p className="text-gray-600 mt-1">
              Manage transaction categories and keywords for auto-categorization
            </p>
          </div>
          <Link
            href="/transactions"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            View Transactions →
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {['all', 'income', 'expense', 'asset', 'liability'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                filter === type
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {type}
              {type !== 'all' && (
                <span className="ml-2 text-sm text-gray-500">
                  ({categories.filter(c => c.category_type === type).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            {editingId === category.id ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    disabled={category.is_system}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  />
                  {category.is_system && (
                    <p className="text-xs text-gray-500 mt-1">System categories cannot be renamed</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Optional description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords for Auto-Categorization
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                      placeholder="Add keyword..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddKeyword}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(editForm.keywords || []).map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="hover:text-green-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Keywords help automatically categorize transactions based on their description
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditForm({});
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {category.name}
                      {category.is_system && (
                        <span className="ml-2 text-xs text-gray-500">(System)</span>
                      )}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Edit
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryTypeColor(category.category_type)}`}>
                    {category.category_type}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaxTreatmentColor(category.tax_treatment)}`}>
                    {category.tax_treatment.replace('_', ' ')}
                  </span>
                </div>

                {category.keywords.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-2">Keywords:</div>
                    <div className="flex flex-wrap gap-2">
                      {category.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No categories found in this filter</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 How Auto-Categorization Works
        </h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
          <li>Keywords are matched against transaction descriptions</li>
          <li>More specific keywords get higher confidence scores</li>
          <li>You can add multiple keywords per category</li>
          <li>Keywords are case-insensitive</li>
          <li>System categories provide baseline tax treatment rules</li>
        </ul>
      </div>
    </div>
  );
}
