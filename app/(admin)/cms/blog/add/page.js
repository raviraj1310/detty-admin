'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/ui/Toast'
import { createBlog } from '@/services/cms/blog.service'
import { Loader2 } from 'lucide-react'
import { convertToWebp } from '@/src/utils/image'
import ImageCropper from '@/components/ui/ImageCropper'
import TiptapEditor from '@/components/editor/TiptapEditor'
export default function AddBlogPage () {
  const router = useRouter()
  const fileRef = useRef(null)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    imageFile: null,
    content: '',
    metaTitle: '',
    metaDescription: '',
    status: true
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [imageMeta, setImageMeta] = useState({
    width: 0,
    height: 0,
    sizeBytes: 0,
    originalSizeBytes: 0,
    format: ''
  })
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    return () => {
      if (imageUrl) {
        try {
          URL.revokeObjectURL(imageUrl)
        } catch {}
      }
    }
  }, [imageUrl])

  const slugify = str => {
    return String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const setField = (k, v) => setFormData(prev => ({ ...prev, [k]: v }))

  const validateImage = file => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif'
    ]
    const maxSize = 2 * 1024 * 1024
    if (!file) return 'Please select an image file'
    if (!allowedTypes.includes(file.type))
      return 'Only JPG, JPEG, PNG, WEBP, and AVIF files are allowed'
    if (file.size > maxSize) return 'Image size must be less than 2MB'
    return ''
  }

  const validateForm = () => {
    const e = {}
    if (!String(formData.title || '').trim()) e.title = 'Required'
    if (!String(formData.content || '').trim()) e.content = 'Required'
    if (!String(formData.metaTitle || '').trim()) e.metaTitle = 'Required'
    if (!String(formData.metaDescription || '').trim())
      e.metaDescription = 'Required'
    const imgErr = validateImage(formData.imageFile)
    if (imgErr) e.imageFile = imgErr
    return e
  }

  const handleSave = async () => {
    if (!slugTouched && !String(formData.slug || '').trim()) {
      setField('slug', slugify(formData.title))
    }
    const e = validateForm()
    setErrors(e)
    if (Object.keys(e).length) {
      setToast({
        open: true,
        title: 'Validation failed',
        description: 'Please fix highlighted fields',
        variant: 'error'
      })
      return
    }
    try {
      setSaving(true)
      const fd = new FormData()
      fd.append('title', String(formData.title || '').trim())
      fd.append('slug', String(formData.slug || '').trim())
      fd.append('content', String(formData.content || '').trim())
      fd.append('metaTitle', String(formData.metaTitle || '').trim())
      fd.append(
        'metaDescription',
        String(formData.metaDescription || '').trim()
      )
      if (formData.imageFile) fd.append('image', formData.imageFile)
      await createBlog(fd)
      setToast({
        open: true,
        title: 'Blog created',
        description: 'Your blog has been added',
        variant: 'success'
      })
      router.push('/cms/blog')
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to create blog'
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

  return (
    <div className='p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 bg-gray-50 min-h-screen'>
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
          Add Blog
        </h1>
        <p className='text-xs sm:text-sm text-gray-500 mt-1'>Dashboard / CMS</p>
      </div>

      <div className='bg-gray-200 p-3 sm:p-4 lg:p-6 rounded-xl'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6'>
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>
              Blog Details
            </h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className='px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {saving ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Saving...
                </span>
              ) : (
                'Add'
              )}
            </button>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Title<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.title}
                onChange={e => {
                  const v = e.target.value
                  setField('title', v)
                  if (!slugTouched) setField('slug', slugify(v))
                }}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Slug<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.slug}
                onChange={e => {
                  setSlugTouched(true)
                  setField('slug', slugify(e.target.value))
                }}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6'>
            <div className='lg:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Content<span className='text-red-500'>*</span>
              </label>
              <div className='border border-gray-300 rounded-lg overflow-hidden'>
                <TiptapEditor
                  content={formData.content}
                  onChange={html => setField('content', html)}
                  placeholder='Write your blog content here...'
                />
              </div>
              {errors.content && (
                <p className='text-red-500 text-sm mt-1'>{errors.content}</p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Image<span className='text-red-500'>*</span>
              </label>
              <div
                className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                onClick={() => fileRef.current?.click()}
              >
                <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                  <span
                    className='truncate'
                    title={formData.imageFile ? formData.imageFile.name : ''}
                  >
                    {(formData.imageFile ? formData.imageFile.name : '') ||
                      'Image.jpg'}
                  </span>
                </div>
                <button
                  type='button'
                  onClick={() => fileRef.current?.click()}
                  className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                >
                  Browse
                </button>
              </div>
              <input
                ref={fileRef}
                type='file'
                accept='.jpg,.jpeg,.png,.webp,.avif'
                className='hidden'
                onChange={async e => {
                  const file = e.target.files[0] || null
                  if (!file) {
                    setErrors(prev => ({
                      ...prev,
                      imageFile: 'Please select an image file'
                    }))
                    setField('imageFile', null)
                    setImageMeta({
                      width: 0,
                      height: 0,
                      sizeBytes: 0,
                      originalSizeBytes: 0,
                      format: ''
                    })
                    setImageUrl('')
                    return
                  }
                  setCropFile(file)
                  setCropOpen(true)
                }}
              />
              {errors.imageFile && (
                <p className='text-red-500 text-sm mt-1'>{errors.imageFile}</p>
              )}
              <p className='text-gray-500 text-xs mt-1'>
                Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
              </p>
              {imageMeta.sizeBytes > 0 && (
                <p className='text-[#5E6582] text-xs mt-1'>
                  {imageMeta.width} × {imageMeta.height} •{' '}
                  {(imageMeta.sizeBytes / 1024).toFixed(1)} KB •{' '}
                  {imageMeta.format}
                </p>
              )}
              {imageUrl && (
                <div className='mt-2'>
                  <img
                    src={imageUrl}
                    alt='Blog image preview'
                    className='w-28 h-28 object-cover rounded border border-gray-300'
                  />
                </div>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Status<span className='text-red-500'>*</span>
              </label>
              <select
                value={formData.status ? 'active' : 'inactive'}
                onChange={e => setField('status', e.target.value === 'active')}
                className='w-full h-12 appearance-none rounded-xl border border-gray-300 bg-white px-4 text-sm text-slate-700 focus:border-gray-400 focus:outline-none'
              >
                <option value='active'>Active</option>
                <option value='inactive'>Inactive</option>
              </select>
            </div>
            <div className='lg:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Meta Title<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.metaTitle}
                onChange={e => setField('metaTitle', e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900'
              />
              {errors.metaTitle && (
                <p className='text-red-500 text-sm mt-1'>{errors.metaTitle}</p>
              )}
            </div>
            <div className='lg:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Meta Description<span className='text-red-500'>*</span>
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={e => setField('metaDescription', e.target.value)}
                rows={3}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none resize-none text-gray-900'
              />
              {errors.metaDescription && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.metaDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />
      <ImageCropper
        open={cropOpen}
        file={cropFile}
        onClose={() => {
          setCropOpen(false)
          setCropFile(null)
        }}
        onCropped={({ file, meta }) => {
          const err = validateImage(file)
          setErrors(prev => ({ ...prev, imageFile: err }))
          if (!err) {
            setField('imageFile', file)
            setImageMeta({
              width: meta?.width || 0,
              height: meta?.height || 0,
              sizeBytes: meta?.sizeBytes || 0,
              originalSizeBytes: meta?.originalSizeBytes || 0,
              format: meta?.format || 'webp'
            })
            try {
              const u = URL.createObjectURL(file)
              setImageUrl(u)
            } catch {}
          }
        }}
      />
    </div>
  )
}
