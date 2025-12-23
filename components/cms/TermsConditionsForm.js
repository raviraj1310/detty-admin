'use client';

import { useEffect, useState } from 'react';
import {getTermsCondition, createUpdateTermsPrivacy} from '@/services/cms/terms-privacy.service';
import Toast from '@/components/ui/Toast';
import TiptapEditor from '@/components/editor/TiptapEditor';

export default function () {

  const [formData, setFormData] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' });

  const setField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    const fetchTerms = async () => {
      setLoading(true);
      try {
        const res = await getTermsCondition();
        const d = res?.data || res;
        const data = d?.data || d;
        const obj = typeof data === 'object' && data ? data : {};
        setFormData({
          title: obj.title || 'Terms And Conditions',
          content: obj.content || ''
        });
      } catch (e) {
        setToast({ open: true, title: 'Error', description: 'Failed to fetch Terms & Conditions', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { title: formData.title, content: formData.content };
      await createUpdateTermsPrivacy(payload);
      setToast({ open: true, title: 'Saved', description: 'Terms & Conditions updated', variant: 'success' });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save Terms & Conditions';
      setToast({ open: true, title: 'Error', description: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 bg-gray-50 min-h-screen">
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position="top-right"
      />
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-900">Terms & Condition</h1>
        <p className="text-xs text-gray-500 mt-0.5">Dashboard / CMS</p>
      </div>

      <div className="bg-gray-100 p-3 rounded-xl">
        {/* Terms & Condition Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          {/* Card Header with Save Button */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 border-b pb-2 border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Terms & Condition Details</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title<span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setField('title', e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
              placeholder="Enter title"
            />
            <label className="block text-xs font-medium text-gray-700 mb-1 mt-3">Terms & Conditions<span className="text-red-500">*</span></label>
            <TiptapEditor
              content={formData.content}
              onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
              placeholder="Enter terms and conditions..."
              minHeight="500px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}