'use client';

import { useEffect, useState } from 'react';
import { Wand2, Bold, Underline, Italic, Palette, List, ListOrdered, AlignJustify, Table, Link2, Image, Video, Maximize2, Code, ChevronDown, Loader2 } from 'lucide-react';
import { createFAQ,getAllFAQCategories } from '@/services/cms/faqs.service';
import Toast from '@/components/ui/Toast';
export default function AddFAQs() {
  const [formData, setFormData] = useState({
    category: '',
    question: '',
    answer: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' });
  const [catOptions, setCatOptions] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState('');

  useEffect(() => {
    const loadCats = async () => {
      setCatLoading(true);
      setCatError('');
      try {
        const res = await getAllFAQCategories();
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const opts = list
          .map(c => {
            const label = c?.title || c?.faqCategory || c?.categoryName || c?.name || '';
            const value = c?._id || '';
            return label && value ? { label, value } : null;
          })
          .filter(Boolean);
        setCatOptions(opts);
      } catch (e) {
        setCatError('Failed to load categories');
        setCatOptions([]);
      } finally {
        setCatLoading(false);
      }
    };
    loadCats();
  }, []);

  const validate = () => {
    const e = {};
    if (!String(formData.question || '').trim()) e.question = 'Question is required';
    if (!String(formData.answer || '').trim()) e.answer = 'Answer is required';
    if (!String(formData.category || '').trim()) e.category = 'Select a category';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setToast({ open: true, title: 'Validation failed', description: 'Please fill all required fields', variant: 'error' });
      return;
    }
    const payload = {
      question: String(formData.question || '').trim(),
      answer: String(formData.answer || '').trim(),
      category: String(formData.category || '').trim()
    };
    try {
      setSubmitting(true);
      const res = await createFAQ(payload);
      setToast({ open: true, title: 'FAQ created', description: 'Your FAQ has been added', variant: 'success' });
      setFormData({ category: '', question: '', answer: '' });
      setErrors({});
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create FAQ';
      setToast({ open: true, title: 'Error', description: msg, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add FAQs</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Dashboard / CMS</p>
      </div>
    <div className='bg-gray-200 p-3 sm:p-4 lg:p-6 rounded-xl'> 

      {/* FAQ Details Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        {/* Card Header with Add Button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">FAQ Details</h2>
          <button
            onClick={handleSave}
            disabled={submitting}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Adding...</span>
            ) : (
              'Add'
            )}
          </button>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* FAQ Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FAQ Category<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value });
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer text-gray-900 bg-white"
              >
                {catLoading && <option value="" disabled>Loading...</option>}
                {!catLoading && catOptions.length === 0 && <option value="" disabled>No categories</option>}
                {catOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {/* <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" /> */}
              {errors.category && (
                <div className="text-sm text-red-600 mt-2">{errors.category}</div>
              )}
              {!errors.category && catError && (
                <div className="text-sm text-red-600 mt-2">{catError}</div>
              )}
            </div>
          </div>

          {/* FAQ Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FAQ Question<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
              placeholder="Enter FAQ question"
            />
            {errors.question && (
              <div className="text-sm text-red-600 mt-2">{errors.question}</div>
            )}
          </div>
        </div>

        {/* FAQ Answer with Rich Text Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            FAQ Answer<span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-300 rounded-lg">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-300 bg-gray-50 overflow-x-auto">
              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Format">
                <Wand2 className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Bold">
                <Bold className="w-4 h-4 font-bold text-gray-700" />
              </button>
              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Underline">
                <Underline className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Italic">
                <Italic className="w-4 h-4 text-gray-700" />
              </button>
              
              {/* Text Color with Dropdown */}
              <div className="relative">
                <button className="flex items-center gap-1 p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Text Color">
                  <Palette className="w-4 h-4 text-gray-700" />
                  <ChevronDown className="w-3 h-3 text-gray-700" />
                </button>
              </div>

              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Bullet List">
                <List className="w-4 h-4 text-gray-700" />
              </button>
              
              {/* Numbered List with Dropdown */}
              <div className="relative">
                <button className="flex items-center gap-1 p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Numbered List">
                  <ListOrdered className="w-4 h-4 text-gray-700" />
                  <ChevronDown className="w-3 h-3 text-gray-700" />
                </button>
              </div>

              {/* Alignment with Dropdown */}
              <div className="relative">
                <button className="flex items-center gap-1 p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Alignment">
                  <AlignJustify className="w-4 h-4 text-gray-700" />
                  <ChevronDown className="w-3 h-3 text-gray-700" />
                </button>
              </div>

              {/* Table with Dropdown */}
              <div className="relative">
                <button className="flex items-center gap-1 p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Table">
                  <Table className="w-4 h-4 text-gray-700" />
                  <ChevronDown className="w-3 h-3 text-gray-700" />
                </button>
              </div>

              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Link">
                <Link2 className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Image">
                <Image className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Video">
                <Video className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Fullscreen">
                <Maximize2 className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer" title="Code">
                <Code className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {/* Text Area */}
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              className="w-full p-4 min-h-[150px] focus:outline-none rounded-b-lg resize-none text-gray-900 bg-white"
              placeholder="Enter FAQ answer"
            />
          </div>
          {errors.answer && (
            <div className="text-sm text-red-600 mt-2">{errors.answer}</div>
          )}
        </div>
      </div>
      </div>

      <Toast
        open={toast.open}
        onOpenChange={(v) => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />
    </div>
  );
}
