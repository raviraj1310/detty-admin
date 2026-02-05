'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Calendar } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'
import {
  getActivityById,
  updateActivity,
  deleteActivity
} from '@/services/places-to-visit/placesToVisit.service'
import { getAllActivityTypes } from '@/services/places-to-visit/activityType.service'
import { getVendors } from '@/services/discover-events/event.service'

export default function EditActivity ({ activityId }) {
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
  const [imageMeta, setImageMeta] = useState({
    width: 0,
    height: 0,
    sizeBytes: 0,
    originalSizeBytes: 0,
    format: ''
  })
  const [imageUrl, setImageUrl] = useState('')
  const [existingImagePath, setExistingImagePath] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)
  const [activityTypes, setActivityTypes] = useState([])
  const [selectedActivityTypeId, setSelectedActivityTypeId] = useState('')
  const [activityTypesLoading, setActivityTypesLoading] = useState(false)
  const [activityTypesError, setActivityTypesError] = useState('')
  const [loading, setLoading] = useState(true)
  const [previewError, setPreviewError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState([])
  const [daysOpen, setDaysOpen] = useState(false)
  const daysDropdownRef = useRef(null)

  const [vendors, setVendors] = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [vendorsError, setVendorsError] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState('')

  // Permission check
  const [user, setUser] = useState(null)
  const [isPartner, setIsPartner] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) {
      try {
        const parsed = JSON.parse(u)
        setUser(parsed)
        if (parsed.role && parsed.role.name === 'Partner') {
          setIsPartner(true)
        }
      } catch (e) {
        console.error('Failed to parse user', e)
      }
    }
  }, [])

  const checkPermission = permissionKey => {
    if (!user) return false
    if (!permissionKey) return true
    const permissions = user.role?.permissions
    if (Array.isArray(permissions)) {
      return permissions.some(
        p =>
          (p.module && p.module === permissionKey) ||
          (p.name && p.name.toLowerCase().includes(permissionKey.toLowerCase()))
      )
    } else if (permissions && typeof permissions === 'object') {
      const modulePerms = permissions[permissionKey]
      return Array.isArray(modulePerms) && modulePerms.length > 0
    }
    return false
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

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

  const toDaysParam = val => {
    const s = String(val || '').toLowerCase()
    if (s.includes('mon') && s.includes('sun'))
      return 'mon,tue,wed,thu,fri,sat,sun'
    if (s.includes('mon') && s.includes('fri')) return 'mon,tue,wed,thu,fri'
    if (s.includes('sat') && s.includes('sun')) return 'sat,sun'
    return 'mon,tue,wed,thu,fri,sat,sun'
  }

  const to24 = ampm => {
    const m = String(ampm || '')
      .trim()
      .match(/^([0-1]?\d):([0-5]\d)\s*(AM|PM)$/i)
    if (!m) return ''
    let hh = Number(m[1])
    const mm = m[2]
    const mer = m[3].toUpperCase()
    if (mer === 'PM' && hh !== 12) hh += 12
    if (mer === 'AM' && hh === 12) hh = 0
    const hhStr = String(hh).padStart(2, '0')
    return `${hhStr}:${mm}`
  }
  const toAmPm = h24 => {
    const m = String(h24 || '')
      .trim()
      .match(/^([0-1]?\d|2[0-3]):([0-5]\d)$/)
    if (!m) return ''
    let hh = Number(m[1])
    const mm = m[2]
    const mer = hh >= 12 ? 'PM' : 'AM'
    hh = hh % 12
    if (hh === 0) hh = 12
    return `${hh}:${mm} ${mer}`
  }
  const parseOpeningHours = text => {
    const s = String(text || '')
    const parts = s.split(/\s*[\-–—]\s*/).map(p => p.trim())
    if (parts.length >= 2) return { start: to24(parts[0]), end: to24(parts[1]) }
    return { start: '', end: '' }
  }

  // Convert ISO date string to YYYY-MM-DD format for HTML date inputs
  const formatDateForInput = dateValue => {
    if (!dateValue) return ''
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return ''
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      // If it's already in YYYY-MM-DD format, return as is
      const str = String(dateValue || '').trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
      return ''
    }
  }

  useEffect(() => {
    const fetchVendors = async () => {
      setVendorsLoading(true)
      setVendorsError('')
      try {
        const res = await getVendors()
        let list = []
        if (res && Array.isArray(res.data)) {
          list = res.data
        } else if (Array.isArray(res)) {
          list = res
        }
        setVendors(list)
      } catch (e) {
        setVendors([])
        setVendorsError('Failed to load vendors')
      } finally {
        setVendorsLoading(false)
      }
    }
    fetchVendors()
  }, [])

  useEffect(() => {
    const s = String(formData.openingStart || '').trim()
    const e = String(formData.openingEnd || '').trim()
    if (s && e) {
      const combined = `${toAmPm(s)} – ${toAmPm(e)}`
      setFormData(prev =>
        prev.openingHours === combined
          ? prev
          : { ...prev, openingHours: combined }
      )
    }
  }, [formData.openingStart, formData.openingEnd])

  // Calculate duration in days (inclusive). If end date missing, default to 1 day.
  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return 0
    const start = new Date(startDate)
    if (!endDate) return 1
    const end = new Date(endDate)
    if (isNaN(start.getTime())) return 0
    if (isNaN(end.getTime())) return 1
    if (end < start) return 1
    const diffTime = Math.abs(end - start)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, diffDays)
  }

  const [calculatedDuration, setCalculatedDuration] = useState(0)

  useEffect(() => {
    const days = calculateDuration(
      formData.activityStartDate,
      formData.activityEndDate
    )
    setCalculatedDuration(days)
  }, [formData.activityStartDate, formData.activityEndDate])

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

  const handleImageChange = event => {
    const file = event.target.files[0]
    if (file) {
      const error = validateImage(file)
      setErrors(prev => ({ ...prev, uploadImage: error }))
      if (!error) {
        handleChange('uploadImage', file.name)
        setRawImageFile(file)
        setImageFile(file)
        setCropOpen(true)
        try {
          const u = URL.createObjectURL(file)
          setImageUrl(u)
        } catch {}
      } else {
        event.target.value = ''
      }
    }
  }

  const normalizeUrl = u => {
    if (!u) return ''
    const v = u.trim()
    if (/^https?:\/\//i.test(v)) return v
    return `https://${v}`
  }

  const toImageSrc = u => {
    const s = String(u || '')
    if (!s) return ''
    if (/^https?:\/\//i.test(s)) return s
    const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    let origin = originEnv
    console.log('image url', originEnv, apiBase)
    if (!origin) {
      try {
        origin = new URL(apiBase).origin
      } catch {
        origin = ''
      }
    }
    if (!origin) origin = originEnv
    return `${origin.replace(/\/$/, '')}/${s.replace(/^\/+/, '')}`
  }
  const withBuster = (u, token) => {
    if (!u) return ''
    const sep = u.includes('?') ? '&' : '?'
    return `${u}${sep}t=${token}`
  }

  const openCropperFromPreview = async () => {
    try {
      setPreviewError('')
      if (imageFile instanceof File) {
        setRawImageFile(imageFile)
        setCropOpen(true)
        return
      }
      if (imageUrl) {
        const res = await fetch(imageUrl, { cache: 'no-store' })
        const blob = await res.blob()
        const guessName = (() => {
          try {
            const u = new URL(imageUrl)
            const p = u.pathname.split('/').filter(Boolean)
            return p[p.length - 1] || 'image.webp'
          } catch {
            const parts = imageUrl.split('/')
            return parts[parts.length - 1] || 'image.webp'
          }
        })()
        const f = new File([blob], guessName, { type: blob.type || 'image/*' })
        setRawImageFile(f)
        setCropOpen(true)
        return
      }
      if (rawImageFile instanceof File) {
        setCropOpen(true)
        return
      }
    } catch (e) {
      setPreviewError('Failed to open cropper')
    }
  }

  const handleUpdate = async () => {
    const newErrors = {}
    if (!formData.activityName.trim()) newErrors.activityName = 'Required'
    if (!formData.location.trim()) newErrors.location = 'Required'
    if (!formData.mapLocation.trim()) newErrors.mapLocation = 'Required'
    if (!formData.openingHours.trim()) newErrors.openingHours = 'Required'
    if (!formData.aboutActivity.trim()) newErrors.aboutActivity = 'Required'
    if (!selectedDays.length) newErrors.activityDays = 'Required'
    if (!selectedVendorId) newErrors.hostedBy = 'Required'
    if (!selectedActivityTypeId && !formData.activityTypeId.trim())
      newErrors.activityTypeId = 'Required'
    if (!formData.activityStartDate.trim())
      newErrors.activityStartDate = 'Required'
    if (formData.activityStartDate && formData.activityEndDate) {
      const start = new Date(formData.activityStartDate)
      const end = new Date(formData.activityEndDate)
      if (start > end) {
        newErrors.activityEndDate = 'End date must be after start date'
      }
    }
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const fd = new FormData()
    fd.append('activityDays', selectedDays.join(','))
    fd.append('hostedBy', selectedVendorId)
    fd.append(
      'activityType',
      (selectedActivityTypeId || formData.activityTypeId).trim()
    )
    fd.append('twitterLink', formData.twitter.trim())
    fd.append('about', formData.aboutActivity.trim())
    fd.append('importantInfo', String(formData.importantInfo || '').trim())
    fd.append('mapLocation', formData.mapLocation.trim())
    fd.append('duration', `${String(calculatedDuration)} Days`)
    fd.append('websiteLink', formData.website.trim())
    fd.append('location', formData.location.trim())
    fd.append('openingHours', formData.openingHours.trim())
    fd.append('activityName', formData.activityName.trim())
    fd.append('status', 'upcoming')
    if (imageFile || rawImageFile) {
      const fileToSend = imageFile || rawImageFile
      fd.append('image', fileToSend)
    } else {
      fd.append('image', String(existingImagePath || ''))
    }
    fd.append(
      'activityTypeId',
      (selectedActivityTypeId || formData.activityTypeId).trim()
    )
    const effectiveEndDate = (
      formData.activityEndDate || formData.activityStartDate
    ).trim()
    fd.append('activityStartDate', formData.activityStartDate.trim())
    fd.append('activityEndDate', effectiveEndDate)
    fd.append('dateRangeDuration', String(calculatedDuration || 1))

    try {
      setSubmitting(true)
      const res = await updateActivity(activityId, fd)
      if (res && res.success) {
        setToast({
          open: true,
          title: 'Activity updated',
          description: 'Your changes have been saved',
          variant: 'success'
        })
        router.push('/places-to-visit')
      }
    } catch (e) {
      setErrors(prev => ({ ...prev, submit: 'Failed to update activity' }))
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to update activity',
        variant: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        setActivityTypesLoading(true)
        setActivityTypesError('')
        const typesRes = await getAllActivityTypes()
        const list = Array.isArray(typesRes?.data) ? typesRes.data : []
        setActivityTypes(list)
        const actRes = await getActivityById(activityId)
        const d = actRes?.data || {}
        const typeId = d.activityTypeId || d.activityType?._id || ''
        const days = Array.isArray(d.activityDays)
          ? d.activityDays.join(',')
          : String(d.activityDays || '')
        const dur = String(d.duration || '').split(' ')
        const durVal = dur[0] || ''
        const durUnit = dur[1] || 'Hours'
        setSelectedActivityTypeId(
          String(typeId || list[0]?._id || list[0]?.id || '')
        )
        const hostedBy = d.hostedBy
        let hostedById = ''
        if (typeof hostedBy === 'object' && hostedBy !== null) {
          hostedById =
            hostedBy._id ||
            hostedBy.id ||
            hostedBy.userId ||
            hostedBy.vendorId ||
            ''
        } else {
          hostedById = String(hostedBy || '')
        }
        setSelectedVendorId(hostedById)
        setFormData({
          activityName: String(d.activityName || ''),
          location: String(d.location || ''),
          mapLocation: String(d.mapLocation || ''),
          activityDays: days,
          openingHours: String(d.openingHours || ''),
          openingStart: parseOpeningHours(d.openingHours).start,
          openingEnd: parseOpeningHours(d.openingHours).end,
          duration: String(durVal),
          durationUnit: String(durUnit || 'Hours'),
          uploadImage: '',
          aboutActivity: String(d.about || ''),
          importantInfo: String(d.importantInfo || ''),
          twitter: String(d.twitterLink || ''),
          website: String(d.websiteLink || ''),
          activityTypeId: String(typeId || ''),
          activityStartDate: formatDateForInput(d.activityStartDate),
          activityEndDate: formatDateForInput(d.activityEndDate)
        })
        const parsedDays = days
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean)
        const validDays = parsedDays.filter(k => allDays.includes(k))
        setSelectedDays(validDays)
        const baseSrc = toImageSrc(d.image || d.uploadImage || '')
        setExistingImagePath(String(d.image || d.uploadImage || ''))
        const t = (() => {
          const x = d.updatedAt || d.createdAt || Date.now()
          try {
            return new Date(
              typeof x === 'object' && x.$date ? x.$date : x
            ).getTime()
          } catch {
            return Date.now()
          }
        })()
        setImageUrl(withBuster(baseSrc, t))
      } catch (e) {
        setActivityTypes([])
        setActivityTypesError('Failed to load activity types')
        setErrors(prev => ({ ...prev, load: 'Failed to load activity' }))
        setToast({
          open: true,
          title: 'Error',
          description: 'Failed to load activity',
          variant: 'error'
        })
      } finally {
        setActivityTypesLoading(false)
        setLoading(false)
      }
    }
    if (activityId) init()
  }, [activityId])

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-12 relative'>
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
          Edit Activity
        </h1>
        <p className='text-sm text-gray-500 mt-1'>Dashboard / Edit Activity</p>
      </div>

      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative '>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Activity Details
          </h2>
          <div className='flex gap-3'>
            {!isPartner && checkPermission('places-delete') && (
              <button
                onClick={() => setConfirmOpen(true)}
                className='px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors'
                disabled={loading}
              >
                Delete
              </button>
            )}
            {!isPartner && checkPermission('places-edit') && (
              <button
                onClick={handleUpdate}
                className='px-6 py-2.5 bg-[#FF5B2C] hover:bg-[#F0481A] text-white font-medium rounded-lg transition-colors'
                disabled={submitting || loading}
              >
                {submitting ? (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' /> Updating...
                  </span>
                ) : (
                  'Update'
                )}
              </button>
            )}
          </div>
        </div>

        <div className='space-y-6'>
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
              {errors.activityName && (
                <p className='text-xs text-red-600'>{errors.activityName}</p>
              )}
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
              {errors.location && (
                <p className='text-xs text-red-600'>{errors.location}</p>
              )}
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
              {errors.mapLocation && (
                <p className='text-xs text-red-600'>{errors.mapLocation}</p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='md:col-span-3'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Hosted by vendor<span className='text-red-500'>*</span>
              </label>
              <select
                value={selectedVendorId}
                onChange={e => setSelectedVendorId(e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white'
                disabled={vendorsLoading}
              >
                {vendorsLoading && <option value=''>Loading vendors...</option>}
                {!vendorsLoading && vendors.length === 0 && (
                  <option value=''>No vendors</option>
                )}
                {!vendorsLoading &&
                  vendors.map(v => (
                    <option
                      key={String(v.userId || v.vendorId || v._id || v.id)}
                      value={String(v.userId || v.vendorId || v._id || v.id)}
                    >
                      {v.businessName || v.name || 'Vendor'}
                    </option>
                  ))}
              </select>
              {errors.hostedBy && (
                <p className='text-xs text-red-600'>{errors.hostedBy}</p>
              )}
              {vendorsError && (
                <p className='text-xs text-red-600'>{vendorsError}</p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Activity Type<span className='text-red-500'>*</span>
              </label>
              <select
                value={selectedActivityTypeId}
                onChange={e => setSelectedActivityTypeId(e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white'
                disabled={activityTypesLoading}
              >
                {activityTypesLoading && (
                  <option value=''>Loading activity types...</option>
                )}
                {!activityTypesLoading && activityTypes.length === 0 && (
                  <option value=''>No activity types</option>
                )}
                {!activityTypesLoading &&
                  activityTypes.length > 0 &&
                  activityTypes.map(t => (
                    <option
                      key={String(t._id || t.id)}
                      value={String(t._id || t.id)}
                    >
                      {t.activityTypeName || t.name || 'Type'}
                    </option>
                  ))}
              </select>
              {errors.activityTypeId && (
                <p className='text-xs text-red-600'>{errors.activityTypeId}</p>
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
                <p className='text-xs text-red-600'>
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
                <p className='text-xs text-red-600'>{errors.activityEndDate}</p>
              )}
              {calculatedDuration > 0 && (
                <p className='text-gray-600 text-sm mt-1'>
                  Duration: {calculatedDuration} day
                  {calculatedDuration !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
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
              {errors.openingHours && (
                <p className='text-xs text-red-600'>{errors.openingHours}</p>
              )}
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Duration<span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  value={calculatedDuration || ''}
                  disabled
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 cursor-not-allowed'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Unit<span className='text-red-500'>*</span>
                </label>
                <select
                  value='Days'
                  disabled
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 cursor-not-allowed'
                >
                  <option>Days</option>
                </select>
              </div>
            </div>
          </div>

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
              <p className='text-xs text-red-600'>{errors.activityDays}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              About Activity<span className='text-red-500'>*</span>
            </label>
            <textarea
              value={formData.aboutActivity}
              onChange={e => handleChange('aboutActivity', e.target.value)}
              className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 min-h-[120px]'
            ></textarea>
            {errors.aboutActivity && (
              <p className='text-xs text-red-600'>{errors.aboutActivity}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Important Info
            </label>
            <textarea
              value={formData.importantInfo}
              onChange={e => handleChange('importantInfo', e.target.value)}
              className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 min-h-[100px]'
              placeholder='Special notes, requirements, or tips for visitors'
            ></textarea>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                {' '}
                Twitter / Instagram{' '}
              </label>
              <input
                type='text'
                value={formData.twitter}
                onChange={e => handleChange('twitter', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
              {errors.twitter && (
                <p className='text-xs text-red-600'>{errors.twitter}</p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Website
              </label>
              <input
                type='text'
                value={formData.website}
                onChange={e => handleChange('website', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
              {errors.website && (
                <p className='text-xs text-red-600'>{errors.website}</p>
              )}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Upload Image
            </label>
            <div
              className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF] max-w-md'
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
            {imageUrl && (
              <div className='mt-2'>
                <img
                  src={imageUrl}
                  alt='Current activity image'
                  className='w-24 h-24 object-cover rounded border border-[#E5E6EF] cursor-pointer'
                  onClick={openCropperFromPreview}
                />
                <div className='flex items-center gap-2 mt-2'>
                  <button
                    onClick={openCropperFromPreview}
                    className='h-8 px-3 rounded-md bg-[#FF5B2C] text-white text-xs font-semibold'
                  >
                    Crop
                  </button>
                  {previewError && (
                    <span className='text-xs text-red-600'>{previewError}</span>
                  )}
                </div>
                <p className='text-xs text-[#5E6582] mt-1'>
                  Click image to crop
                </p>
              </div>
            )}
            {imageFile && (
              <div className='text-xs text-[#5E6582] mt-2'>
                <span>
                  Dimensions: {imageMeta.width} × {imageMeta.height}
                </span>
                <span className='ml-3'>
                  Size: {(imageMeta.sizeBytes / 1024).toFixed(1)} KB
                </span>
                <span className='ml-3'>
                  Original: {(imageMeta.originalSizeBytes / 1024).toFixed(1)} KB
                </span>
                <span className='ml-3'>Format: {imageMeta.format}</span>
              </div>
            )}
            {errors.uploadImage && (
              <p className='text-xs text-red-600'>{errors.uploadImage}</p>
            )}
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
          setCropOpen(false)
          setRawImageFile(null)
          try {
            const u = URL.createObjectURL(file)
            setImageUrl(u)
          } catch {}
        }}
        layoutMode='horizontal'
      />
      {confirmOpen && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!deleting) {
                setConfirmOpen(false)
              }
            }}
          />
          <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-3'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-lg font-semibold text-slate-900'>
                  Delete this activity?
                </div>
                <div className='mt-1 text-sm text-[#5E6582]'>
                  This action cannot be undone.
                </div>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  if (!deleting) {
                    setConfirmOpen(false)
                  }
                }}
                className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!activityId) return
                  setDeleting(true)
                  const proceedSuccess = async () => {
                    setToast({
                      open: true,
                      title: 'Activity deleted',
                      description: 'Removed successfully',
                      variant: 'success'
                    })
                    router.push('/places-to-visit')
                  }
                  try {
                    const res = await deleteActivity(activityId)
                    if (res && res.success) {
                      await proceedSuccess()
                    } else {
                      try {
                        const check = await getActivityById(activityId)
                        const exists = Boolean(
                          check?.data && (check.data._id || check.data.id)
                        )
                        if (!exists) {
                          await proceedSuccess()
                        } else {
                          const msg =
                            res?.message || 'Failed to delete activity'
                          setErrors(prev => ({ ...prev, submit: msg }))
                          setToast({
                            open: true,
                            title: 'Error',
                            description: msg,
                            variant: 'error'
                          })
                        }
                      } catch {
                        await proceedSuccess()
                      }
                    }
                  } catch {
                    try {
                      const check = await getActivityById(activityId)
                      const exists = Boolean(
                        check?.data && (check.data._id || check.data.id)
                      )
                      if (!exists) {
                        await proceedSuccess()
                      } else {
                        setErrors(prev => ({
                          ...prev,
                          submit: 'Failed to delete activity'
                        }))
                        setToast({
                          open: true,
                          title: 'Error',
                          description: 'Failed to delete activity',
                          variant: 'error'
                        })
                      }
                    } catch {
                      await proceedSuccess()
                    }
                  } finally {
                    setDeleting(false)
                    setConfirmOpen(false)
                  }
                }}
                className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
                disabled={deleting}
              >
                {deleting ? (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' /> Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
