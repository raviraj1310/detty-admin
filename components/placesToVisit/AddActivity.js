'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar } from 'lucide-react'
import {
  Wand2,
  Bold,
  Underline,
  Italic,
  Strikethrough,
  Palette,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Code,
  Maximize2
} from 'lucide-react'
import { createActivity } from '@/services/places-to-visit/placesToVisit.service'
import { getAllActivityTypes } from '@/services/places-to-visit/activityType.service'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'
export default function AddActivity () {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    activityName: '',
    location: '',
    mapLocation: '',
    activityDays: '',
    openingHours: '',
    openingStart: '',
    openingEnd: '',
    duration: '',
    durationUnit: 'Hours',
    uploadImage: '',
    aboutActivity: '',
    importantInfo: '',
    twitter: '',
    website: '',
    activityTypeId: '',
    activityStartDate: '',
    activityEndDate: ''
  })

  const [errors, setErrors] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)
  const [imageMeta, setImageMeta] = useState({
    width: 0,
    height: 0,
    sizeBytes: 0,
    originalSizeBytes: 0,
    format: ''
  })
  const [activityTypes, setActivityTypes] = useState([])
  const [selectedActivityTypeId, setSelectedActivityTypeId] = useState('')
  const [activityTypesLoading, setActivityTypesLoading] = useState(false)
  const [activityTypesError, setActivityTypesError] = useState('')
  const [selectedDays, setSelectedDays] = useState([])
  const [daysOpen, setDaysOpen] = useState(false)
  const daysDropdownRef = useRef(null)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateImage = file => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif'
    ]
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes

    if (!file) {
      return 'Please select an image file'
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, JPEG, PNG, WEBP, and AVIF files are allowed'
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 2MB'
    }

    return ''
  }

  const handleImageChange = event => {
    const file = event.target.files[0]

    if (file) {
      const error = validateImage(file)

      setErrors(prev => ({ ...prev, uploadImage: error }))

      if (!error) {
        handleChange('uploadImage', file.name)
        setRawImageFile(file)
        setCropOpen(true)
      } else {
        event.target.value = ''
      }
    }
  }

  useEffect(() => {
    return () => {
      if (imageUrl) {
        try {
          URL.revokeObjectURL(imageUrl)
        } catch {}
      }
    }
  }, [imageUrl])

  const toggleDay = key => {
    setSelectedDays(prev =>
      prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]
    )
  }
  const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const displayDays = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun'
  }

  const handleAdd = async () => {
    const newErrors = {}
    if (!formData.activityName.trim()) newErrors.activityName = 'Required'
    if (!formData.location.trim()) newErrors.location = 'Required'
    if (!formData.mapLocation.trim()) newErrors.mapLocation = 'Required'
    if (!formData.openingHours.trim()) newErrors.openingHours = 'Required'
    if (!formData.aboutActivity.trim()) newErrors.aboutActivity = 'Required'
    if (!selectedDays.length) newErrors.activityDays = 'Required'
    if (!formData.twitter.trim()) newErrors.twitter = 'Required'
    if (!formData.website.trim()) newErrors.website = 'Required'
    if (!selectedActivityTypeId && !formData.activityTypeId.trim())
      newErrors.activityTypeId = 'Required'
    if (!imageFile) newErrors.uploadImage = 'Please select an image file'
    if (!formData.activityStartDate.trim())
      newErrors.activityStartDate = 'Required'
    if (!formData.activityEndDate.trim()) newErrors.activityEndDate = 'Required'
    if (formData.activityStartDate && formData.activityEndDate) {
      const start = new Date(formData.activityStartDate)
      const end = new Date(formData.activityEndDate)
      if (start > end) {
        newErrors.activityEndDate = 'End date must be after start date'
      }
    }
    if (calculatedDuration <= 0) {
      newErrors.activityEndDate = 'Please select valid start and end dates'
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const fd = new FormData()
    fd.append('activityDays', selectedDays.join(','))
    fd.append(
      'activityType',
      (selectedActivityTypeId || formData.activityTypeId).trim()
    )
    fd.append('twitterLink', formData.twitter.trim())
    fd.append('about', formData.aboutActivity.trim())
    fd.append('importantInfo', String(formData.importantInfo || '').trim())
    fd.append('mapLocation', formData.mapLocation.trim())
    fd.append('status', 'upcoming')
    fd.append('duration', `${String(calculatedDuration)} Days`)
    fd.append('websiteLink', formData.website.trim())
    fd.append('location', formData.location.trim())
    fd.append('openingHours', formData.openingHours.trim())
    fd.append('activityName', formData.activityName.trim())
    fd.append('image', imageFile)
    fd.append('activityStartDate', formData.activityStartDate.trim())
    fd.append('activityEndDate', formData.activityEndDate.trim())
    fd.append('dateRangeDuration', String(calculatedDuration))

    try {
      setSubmitting(true)
      const res = await createActivity(fd)
      if (res && res.success) {
        const newId =
          res?.data?._id ||
          res?.data?.id ||
          res?.id ||
          res?.activityId ||
          res?.data?.activityId ||
          ''
        setToastOpen(true)
        if (newId) {
          router.push(
            `/places-to-visit/edit-tickets/${encodeURIComponent(String(newId))}`
          )
        } else {
          router.push('/places-to-visit/edit-tickets')
        }
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, submit: 'Failed to create activity' }))
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const fetchTypes = async () => {
      setActivityTypesLoading(true)
      setActivityTypesError('')
      try {
        const res = await getAllActivityTypes()
        const raw = res?.data
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : []
        setActivityTypes(list)
        if (list.length > 0) {
          const first = list[0]
          setSelectedActivityTypeId(first._id || first.id || '')
        } else {
          setSelectedActivityTypeId('')
        }
      } catch (e) {
        setActivityTypes([])
        setSelectedActivityTypeId('')
        setActivityTypesError('Failed to load activity types')
      } finally {
        setActivityTypesLoading(false)
      }
    }
    fetchTypes()
  }, [])

  useEffect(() => {
    const handler = e => {
      if (
        daysDropdownRef.current &&
        !daysDropdownRef.current.contains(e.target)
      ) {
        setDaysOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const s = String(formData.openingStart || '').trim()
    const e = String(formData.openingEnd || '').trim()
    const combined = s && e ? `${s} - ${e}` : ''
    setFormData(prev =>
      prev.openingHours === combined
        ? prev
        : { ...prev, openingHours: combined }
    )
  }, [formData.openingStart, formData.openingEnd])

  // Calculate duration in days based on start and end dates (inclusive)
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
    const diffTime = Math.abs(end - start)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const [calculatedDuration, setCalculatedDuration] = useState(0)

  useEffect(() => {
    if (formData.activityStartDate && formData.activityEndDate) {
      const days = calculateDuration(
        formData.activityStartDate,
        formData.activityEndDate
      )
      setCalculatedDuration(days)
    } else {
      setCalculatedDuration(0)
    }
  }, [formData.activityStartDate, formData.activityEndDate])

  const handleEditTickets = () => {
    router.push('/places-to-visit/edit-tickets')
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-12 relative z-50'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
          Add Activity
        </h1>
        <p className='text-sm text-gray-500 mt-1'>Dashboard / Add Activity</p>
      </div>

      {/* Main Card */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative z-50'>
        {/* Card Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Activity Details
          </h2>
          <div className='flex gap-3'>
            <button
              onClick={handleAdd}
              className='px-6 py-2.5 bg-[#FF5B2C] hover:bg-[#F0481A] text-white font-medium rounded-lg transition-colors'
            >
              Add
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className='space-y-6'>
          {/* Row 1: Activity Name, Location, Map Location */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Activity Name<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.activityName}
                onChange={e => handleChange('activityName', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Location<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.location}
                onChange={e => handleChange('location', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Map Location<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.mapLocation}
                onChange={e => handleChange('mapLocation', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='relative z-50'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Activity Type<span className='text-red-500'>*</span>
              </label>
              <select
                value={selectedActivityTypeId}
                onChange={e => setSelectedActivityTypeId(e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white relative z-50'
                disabled={activityTypesLoading}
              >
                {activityTypesLoading && (
                  <option value=''>Loading activity types...</option>
                )}
                {!activityTypesLoading && activityTypes.length === 0 && (
                  <option value=''>No activity types</option>
                )}
                {!activityTypesLoading && activityTypes.length > 0 && (
                  <option value=''>Select activity type</option>
                )}
                {!activityTypesLoading &&
                  activityTypes.map(t => (
                    <option key={t._id || t.id} value={t._id || t.id}>
                      {t.name || t.activityTypeName || t.title || 'Type'}
                    </option>
                  ))}
              </select>
              {activityTypesError && (
                <p className='text-red-500 text-sm mt-1'>
                  {activityTypesError}
                </p>
              )}
              {errors.activityTypeId && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.activityTypeId}
                </p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Activity Start Date<span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type='date'
                  value={formData.activityStartDate}
                  onChange={e =>
                    handleChange('activityStartDate', e.target.value)
                  }
                  min='2025-12-13'
                  max='2026-01-04'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
                />
                <Calendar className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
              </div>
              {errors.activityStartDate && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.activityStartDate}
                </p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Activity End Date<span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type='date'
                  value={formData.activityEndDate}
                  onChange={e =>
                    handleChange('activityEndDate', e.target.value)
                  }
                  min={formData.activityStartDate || '2025-12-13'}
                  max='2026-01-04'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
                />
                <Calendar className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
              </div>
              {errors.activityEndDate && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.activityEndDate}
                </p>
              )}
              {calculatedDuration > 0 && (
                <p className='text-gray-600 text-sm mt-1'>
                  Duration: {calculatedDuration} day
                  {calculatedDuration !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Activity Days, Opening Hours, Duration */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Activity Days<span className='text-red-500'>*</span>
              </label>
              <div className='relative' ref={daysDropdownRef}>
                <button
                  type='button'
                  onClick={() => setDaysOpen(v => !v)}
                  className='w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500'
                >
                  <span className='truncate'>
                    {selectedDays.length
                      ? selectedDays.map(d => displayDays[d]).join(', ')
                      : 'Select days'}
                  </span>
                  <svg
                    className='h-4 w-4 text-[#99A1BC]'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M19 9l-7 7-7-7'
                    />
                  </svg>
                </button>
                {daysOpen && (
                  <div className='absolute z-50 mt-2 w-full rounded-xl border border-[#E5E6EF] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] p-3'>
                    <div className='grid grid-cols-2 gap-2'>
                      {allDays.map(key => (
                        <label
                          key={key}
                          className='flex items-center gap-2 text-sm text-[#2D3658]'
                        >
                          <input
                            type='checkbox'
                            checked={selectedDays.includes(key)}
                            onChange={() => toggleDay(key)}
                            className='h-4 w-4 text-orange-600 focus:ring-orange-500'
                          />
                          <span>{displayDays[key]}</span>
                        </label>
                      ))}
                    </div>
                    <div className='mt-3 flex items-center justify-between'>
                      <div className='flex gap-2'>
                        <button
                          type='button'
                          onClick={() => setSelectedDays(allDays)}
                          className='px-3 py-1 rounded-md border border-[#E5E6EF] bg-white text-xs font-medium text-[#1A1F3F] hover:bg-[#F9FAFD]'
                        >
                          Select All
                        </button>
                        <button
                          type='button'
                          onClick={() => setSelectedDays([])}
                          className='px-3 py-1 rounded-md border border-[#E5E6EF] bg-white text-xs font-medium text-[#1A1F3F] hover:bg-[#F9FAFD]'
                        >
                          Clear
                        </button>
                      </div>
                      <button
                        type='button'
                        onClick={() => setDaysOpen(false)}
                        className='px-3 py-1 rounded-md bg-[#FF5B2C] text-white text-xs font-semibold hover:bg-[#F0481A]'
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {errors.activityDays && (
                <p className='text-red-500 text-sm mt-1'>
                  {errors.activityDays}
                </p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Opening Hours<span className='text-red-500'>*</span>
              </label>
              <div className='flex gap-2'>
                <div
                  className='relative flex-1'
                  onClick={e => {
                    const i = e.currentTarget.querySelector('input')
                    if (i) i.focus()
                  }}
                >
                  <input
                    type='time'
                    value={formData.openingStart}
                    onChange={e => handleChange('openingStart', e.target.value)}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
                  />
                  <Calendar className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                </div>
                <div className='flex items-center px-1 text-gray-500'>-</div>
                <div
                  className='relative flex-1'
                  onClick={e => {
                    const i = e.currentTarget.querySelector('input')
                    if (i) i.focus()
                  }}
                >
                  <input
                    type='time'
                    value={formData.openingEnd}
                    onChange={e => handleChange('openingEnd', e.target.value)}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
                  />
                  <Calendar className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                </div>
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Duration<span className='text-red-500'>*</span>
              </label>
              <div className='flex gap-2'>
                <input
                  type='number'
                  value={calculatedDuration || ''}
                  disabled
                  className='flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 cursor-not-allowed'
                />
                <select
                  value='Days'
                  disabled
                  className='px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 cursor-not-allowed'
                >
                  <option>Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload Image */}
          <div className='max-w-md'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Upload Image<span className='text-red-500'>*</span>
            </label>
            <div
              className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
              onClick={() => fileInputRef.current?.click()}
            >
              <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                <span className='truncate' title={formData.uploadImage}>
                  {formData.uploadImage || 'Image.jpg'}
                </span>
              </div>
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
              >
                Browse
              </button>
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={handleImageChange}
            />
            {errors.uploadImage && (
              <p className='text-red-500 text-sm mt-1'>{errors.uploadImage}</p>
            )}
            <p className='text-gray-500 text-xs mt-1'>
              Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
            </p>
            {imageUrl && (
              <div className='mt-3'>
                <img
                  src={imageUrl}
                  alt='Activity image preview'
                  className='w-28 h-28 object-cover rounded border border-gray-300'
                />
              </div>
            )}
          </div>

          {/* About Activity - Rich Text Editor */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              About Activity<span className='text-red-500'>*</span>
            </label>
            <div className='border border-gray-300 rounded-lg overflow-hidden'>
              {/* Toolbar */}
              <div className='flex items-center gap-1 p-2 border-b border-gray-300 bg-gray-50 overflow-x-auto'>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Format'
                >
                  <Wand2 className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Bold'
                >
                  <Bold className='w-4 h-4 font-bold' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Underline'
                >
                  <Underline className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Italic'
                >
                  <Italic className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Strikethrough'
                >
                  <Strikethrough className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Text Color'
                >
                  <Palette className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Bullet List'
                >
                  <List className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Numbered List'
                >
                  <ListOrdered className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Align Left'
                >
                  <AlignLeft className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Align Center'
                >
                  <AlignCenter className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Align Right'
                >
                  <AlignRight className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Link'
                >
                  <Link2 className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Image'
                >
                  <ImageIcon className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Code'
                >
                  <Code className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Fullscreen'
                >
                  <Maximize2 className='w-4 h-4' />
                </button>
              </div>
              {/* Text Area */}
              <textarea
                value={formData.aboutActivity}
                onChange={e => handleChange('aboutActivity', e.target.value)}
                rows={6}
                className='w-full px-4 py-3 focus:outline-none resize-none text-gray-900'
              />
            </div>
          </div>

          {/* Important Info */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Important Info
            </label>
            <textarea
              value={formData.importantInfo}
              onChange={e => handleChange('importantInfo', e.target.value)}
              rows={4}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              placeholder='Any special notes, requirements, or tips for visitors'
            />
          </div>

          {/* Contact Information Section */}
          <div className='pt-6'>
            <div className='bg-gray-900 text-white px-4 py-2 rounded-t-lg inline-block mb-4'>
              <h3 className='font-medium'>Contact Information</h3>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Twitter / Instagram <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.twitter}
                  onChange={e => handleChange('twitter', e.target.value)}
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Website<span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={formData.website}
                    onChange={e => handleChange('website', e.target.value)}
                    className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
                  />
                  <Calendar className='absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                </div>
              </div>
            </div>
          </div>
          {errors.submit && (
            <p className='text-red-500 text-sm'>{errors.submit}</p>
          )}
        </div>
      </div>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title='Activity created'
        description='Your activity has been added'
        variant='success'
        duration={2500}
        position='top-right'
      />
      <ImageCropper
        open={cropOpen}
        file={rawImageFile}
        onClose={() => {
          setCropOpen(false)
          setRawImageFile(null)
        }}
        onCropped={({ file, meta }) => {
          setImageFile(file)
          setImageMeta(meta)
          setFormData(prev => ({ ...prev, uploadImage: file.name }))
          setErrors(prev => ({ ...prev, uploadImage: '' }))
          try {
            const u = URL.createObjectURL(file)
            setImageUrl(u)
          } catch {}
        }}
      />
    </div>
  )
}
