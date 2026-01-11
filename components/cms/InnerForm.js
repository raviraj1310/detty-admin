'use client'

import { useEffect, useState, useRef } from 'react'
import {
  getInnerCms,
  createUpdateInnerCms
} from '@/services/inner/inner.service'
import Toast from '@/components/ui/Toast'
import { Loader2, Upload, X } from 'lucide-react'

const sections = [
  { key: 'event', label: 'Event' },
  { key: 'activity', label: 'Activity' },
  { key: 'esim', label: 'eSIM' },
  { key: 'merchandise', label: 'Merchandise' },
  { key: 'ride', label: 'Ride' },
  { key: 'stay', label: 'Stay' },
  { key: 'health', label: 'Health' },
  { key: 'royal', label: 'Royal' },
  { key: 'visa', label: 'Visa' }
]

const toImageSrc = u => {
  const s = String(u || '')
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const apiBase = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN || ''
  // Clean up slashes
  const path = s.replace(/^\/+/, '')
  const base = apiBase.replace(/\/+$/, '')
  return `${base}/${path}`
}

export default function InnerForm () {
  const [formData, setFormData] = useState({})
  const [previews, setPreviews] = useState({})
  const [files, setFiles] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  useEffect(() => {
    const fetchInner = async () => {
      setLoading(true)
      try {
        const res = await getInnerCms()
        const data = res?.data || res || {}
        setFormData(data)
      } catch (e) {
        setToast({
          open: true,
          title: 'Error',
          description: 'Failed to fetch Inner Page content',
          variant: 'error'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchInner()
  }, [])

  const handleChange = (sectionKey, field, value) => {
    setFormData(prev => ({
      ...prev,
      [`${sectionKey}${field}`]: value
    }))
  }

  const handleFileChange = (sectionKey, e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Update file state
    setFiles(prev => ({ ...prev, [sectionKey]: file }))

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviews(prev => {
      // Revoke old preview if exists
      if (prev[sectionKey]) URL.revokeObjectURL(prev[sectionKey])
      return { ...prev, [sectionKey]: url }
    })
  }

  const handleRemoveImage = sectionKey => {
    setFiles(prev => {
      const next = { ...prev }
      delete next[sectionKey]
      return next
    })
    setPreviews(prev => {
      if (prev[sectionKey]) URL.revokeObjectURL(prev[sectionKey])
      const next = { ...prev }
      delete next[sectionKey]
      return next
    })
    // Also clear from formData if you want to allow deleting existing images
    // For now we just assume removing the *newly selected* file,
    // or if it's existing, maybe we don't support "delete" only "replace"
    // based on the API structure.
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const fd = new FormData()

      sections.forEach(({ key }) => {
        const title = formData[`${key}Title`] || ''
        const title2 = formData[`${key}Title2`] || ''
        const detail = formData[`${key}Detail`] || ''

        fd.append(`${key}Title`, title)
        fd.append(`${key}Title2`, title2)
        fd.append(`${key}Detail`, detail)

        if (files[key]) {
          fd.append(`${key}Image`, files[key])
        }
      })

      await createUpdateInnerCms(fd)

      setToast({
        open: true,
        title: 'Saved',
        description: 'Inner Page updated successfully',
        variant: 'success'
      })
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || 'Failed to save Inner Page'
      setToast({
        open: true,
        title: 'Error',
        description: msg,
        variant: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='p-8 flex items-center justify-center text-gray-500'>
        <Loader2 className='h-5 w-5 animate-spin mr-2' />
        Loading...
      </div>
    )
  }

  return (
    <div className='p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 bg-gray-50 min-h-screen'>
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />

      {/* Header */}
      <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Inner Page</h1>
          <p className='text-sm text-gray-500 mt-1'>Dashboard / CMS</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className='px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2'
        >
          {saving && <Loader2 className='h-4 w-4 animate-spin' />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
        {sections.map(({ key, label }) => {
          const titleKey = `${key}Title`
          const title2Key = `${key}Title2`
          const detailKey = `${key}Detail`
          const imageKey = `${key}Image`

          const previewUrl = previews[key]
          const serverImageUrl = formData[imageKey]
          const displayImage =
            previewUrl || (serverImageUrl ? toImageSrc(serverImageUrl) : '')

          return (
            <div
              key={key}
              className='bg-white rounded-xl shadow-sm border border-gray-200 p-5'
            >
              <h3 className='text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100'>
                {label} Section
              </h3>

              <div className='space-y-4'>
                {/* Title */}
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                    Title
                  </label>
                  <input
                    type='text'
                    value={formData[titleKey] || ''}
                    onChange={e => handleChange(key, 'Title', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all'
                    placeholder={`Enter ${label} title`}
                  />
                </div>

                {/* Title 2 */}
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                    Title 2
                  </label>
                  <input
                    type='text'
                    value={formData[title2Key] || ''}
                    onChange={e => handleChange(key, 'Title2', e.target.value)}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all'
                    placeholder={`Enter ${label} title 2`}
                  />
                </div>

                {/* Detail */}
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                    Detail
                  </label>
                  <textarea
                    value={formData[detailKey] || ''}
                    onChange={e => handleChange(key, 'Detail', e.target.value)}
                    rows={3}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none'
                    placeholder={`Enter ${label} details`}
                  />
                </div>

                {/* Image */}
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                    Image
                  </label>

                  <div className='flex items-start gap-4'>
                    {/* Preview Area */}
                    <div className='relative w-24 h-24 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center'>
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={label}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <span className='text-xs text-gray-400'>No image</span>
                      )}
                    </div>

                    {/* Upload Control */}
                    <div className='flex-1'>
                      <input
                        type='file'
                        id={`file-${key}`}
                        accept='image/*'
                        className='hidden'
                        onChange={e => handleFileChange(key, e)}
                      />
                      <div className='flex flex-col gap-2'>
                        <label
                          htmlFor={`file-${key}`}
                          className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors w-fit'
                        >
                          <Upload className='h-3.5 w-3.5 mr-2' />
                          Choose Image
                        </label>
                        {files[key] && (
                          <div className='flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded w-fit'>
                            <span className='truncate max-w-[150px]'>
                              {files[key].name}
                            </span>
                            <button
                              onClick={() => handleRemoveImage(key)}
                              className='p-0.5 hover:bg-green-100 rounded-full'
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </div>
                        )}
                        <p className='text-[10px] text-gray-400'>
                          Supported formats: JPG, PNG, WebP
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
