'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import { getFAQById, updateFAQ, getAllFAQCategories } from '@/services/cms/faqs.service'

export default function EditFAQForm({ id }) {
  const [formData, setFormData] = useState({ category: '', question: '', answer: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' })
  const [catOptions, setCatOptions] = useState([])
  const [catLoading, setCatLoading] = useState(false)
  const [catError, setCatError] = useState('')

  useEffect(() => {
    const loadCats = async () => {
      setCatLoading(true)
      setCatError('')
      try {
        const res = await getAllFAQCategories()
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        const opts = list
          .map(c => {
            const label = c?.title || c?.faqCategory || c?.categoryName || c?.name || ''
            const value = c?._id || ''
            return label && value ? { label, value } : null
          })
          .filter(Boolean)
        setCatOptions(opts)
      } catch (e) {
        setCatError('Failed to load categories')
        setCatOptions([])
      } finally {
        setCatLoading(false)
      }
    }
    loadCats()
  }, [])

  useEffect(() => {
    const loadFAQ = async () => {
      if (!id) return
      setLoading(true)
      try {
        const res = await getFAQById(id)
        const d = res?.data?.data || res?.data || res || {}
        const categoryId = d?.category?._id || d?.categoryId || d?.category || ''
        setFormData({
          category: String(categoryId || '').trim(),
          question: String(d?.question || d?.faqQuestion || '').trim(),
          answer: String(d?.answer || '').trim()
        })
      } catch (e) {
        setToast({ open: true, title: 'Error', description: 'Failed to load FAQ', variant: 'error' })
      } finally {
        setLoading(false)
      }
    }
    loadFAQ()
  }, [id])

  const validate = () => {
    const e = {}
    if (!String(formData.question || '').trim()) e.question = 'Question is required'
    if (!String(formData.answer || '').trim()) e.answer = 'Answer is required'
    if (!String(formData.category || '').trim()) e.category = 'Select a category'
    return e
  }

  const handleUpdate = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) {
      setToast({ open: true, title: 'Validation failed', description: 'Please fill all required fields', variant: 'error' })
      return
    }
    const payload = {
      question: String(formData.question || '').trim(),
      answer: String(formData.answer || '').trim(),
      category: String(formData.category || '').trim()
    }
    try {
      setSubmitting(true)
      await updateFAQ(id, payload)
      setToast({ open: true, title: 'FAQ updated', description: 'Changes have been saved', variant: 'success' })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update FAQ'
      setToast({ open: true, title: 'Error', description: msg, variant: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit FAQs</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Dashboard / CMS</p>
      </div>

      <div className='bg-gray-200 p-3 sm:p-4 lg:p-6 rounded-xl'>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">FAQ Details</h2>
            <button
              onClick={handleUpdate}
              disabled={submitting || loading}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Updating...</span>
              ) : (
                'Update'
              )}
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-600">
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading FAQ...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    FAQ Category<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer text-gray-900 bg-white"
                    >
                      {catLoading && <option value="" disabled>Loading...</option>}
                      {!catLoading && catOptions.length === 0 && <option value="" disabled>No categories</option>}
                      {catOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <div className="text-sm text-red-600 mt-2">{errors.category}</div>
                    )}
                    {!errors.category && catError && (
                      <div className="text-sm text-red-600 mt-2">{catError}</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    FAQ Question<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    placeholder="Enter FAQ question"
                  />
                  {errors.question && (
                    <div className="text-sm text-red-600 mt-2">{errors.question}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FAQ Answer<span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg">
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                    className="w-full p-4 min-h-[150px] focus:outline-none rounded-lg resize-none text-gray-900 bg-white"
                    placeholder="Enter FAQ answer"
                  />
                </div>
                {errors.answer && (
                  <div className="text-sm text-red-600 mt-2">{errors.answer}</div>
                )}
              </div>
            </>
          )}
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
  )
}

