'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import { convertToWebp } from '@/src/utils/image'
import ImageCropper from '@/components/ui/ImageCropper'
import {
  getEventById,
  getEventTypes,
  updateEvent,
  deleteEvent,
  getVendors
} from '@/services/discover-events/event.service'

export default function EditEvent ({ eventId }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    eventName: '',
    location: '',
    mapLocation: '',
    eventStartDate: '',
    eventStartTime: '',
    eventEndDate: '',
    eventEndTime: '',
    eventType: 'Concert',
    uploadImage: '',
    aboutEvent: '',
    twitter: '',
    website: ''
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
  const fileInputRef = useRef(null)
  const [eventTypes, setEventTypes] = useState([])
  const [selectedEventTypeId, setSelectedEventTypeId] = useState('')
  const [vendors, setVendors] = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [vendorsError, setVendorsError] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toastOpen, setToastOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageUrlAlt, setImageUrlAlt] = useState('')

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toIdString = v => {
    if (!v) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object') {
      if (v.$oid) return String(v.$oid)
      if (v.$id) return String(v.$id)
      if (v.oid) return String(v.oid)
      if (v._id) return toIdString(v._id)
    }
    return String(v)
  }

  const buildImageUrls = u => {
    let s = String(u || '').trim()
    if (!s) return { primary: '', alt: '' }
    s = s
      .replace(/`/g, '')
      .replace(/^['"]/g, '')
      .replace(/['"]$/g, '')
      .replace(/^\(+/, '')
      .replace(/\)+$/, '')
    if (!s) return { primary: '', alt: '' }
    if (/^https?:\/\//i.test(s)) return { primary: s, alt: '' }
    const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    let origin = originEnv
    if (!origin) {
      try {
        origin = new URL(apiBase).origin
      } catch {
        origin = ''
      }
    }
    if (!origin) origin = originEnv
    const base = origin.replace(/\/+$/, '')
    const path = s.replace(/^\/+/, '')
    const primary = `${base}/${path}`
    const withoutApi = base.replace(/\/api\/?$/i, '')
    const alt = withoutApi && withoutApi !== base ? `${withoutApi}/${path}` : ''
    return { primary, alt }
  }

  const validate = () => {
    const errs = {}
    if (!formData.eventName || formData.eventName.trim().length < 3)
      errs.eventName = 'Enter a valid event name'
    if (!formData.location) errs.location = 'Enter a location'
    const mapRegex = /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/
    if (!formData.mapLocation || !mapRegex.test(formData.mapLocation))
      errs.mapLocation = 'Enter coordinates as lat, long'
    if (!formData.eventStartDate) errs.eventStartDate = 'Select start date'
    if (!formData.eventStartTime) errs.eventStartTime = 'Select start time'
    if (!formData.eventEndTime) errs.eventEndTime = 'Select end time'
    if (formData.eventStartDate && formData.eventEndDate) {
      const s = new Date(
        `${formData.eventStartDate}T${formData.eventStartTime || '00:00'}`
      )
      const e = new Date(
        `${formData.eventEndDate}T${formData.eventEndTime || '00:00'}`
      )
      if (s > e) errs.eventEndDate = 'End date must be after start date'
    }
    if (!selectedEventTypeId) errs.eventType = 'Select event type'
    if (!formData.aboutEvent || formData.aboutEvent.trim().length < 10)
      errs.aboutEvent = 'Enter a meaningful description'
    const normalizeUrl = u => {
      if (!u) return ''
      const v = u.trim()
      if (/^https?:\/\//i.test(v)) return v
      return `https://${v}`
    }
    const tw = normalizeUrl(formData.twitter)
    const ws = normalizeUrl(formData.website)
    const urlRegex =
      /^(https?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:\/?#[\]@!$&'()*+,;=.]+$/i
    if (!!formData.twitter && !urlRegex.test(tw))
      errs.twitter = 'Enter a valid Twitter URL'
    if (!!formData.website && !urlRegex.test(ws))
      errs.website = 'Enter a valid website URL'
    return { errs, tw, ws }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const { errs, tw, ws } = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const fd = new FormData()
    fd.append('eventName', formData.eventName.trim())
    fd.append('twitterLink', tw)
    fd.append('about', formData.aboutEvent.trim())
    fd.append('eventTypeId', toIdString(selectedEventTypeId))
    const effectiveEndDate = (
      formData.eventEndDate || formData.eventStartDate
    ).trim()
    fd.append('eventEndDate', effectiveEndDate)
    fd.append('mapLocation', formData.mapLocation)
    fd.append('websiteLink', ws)
    fd.append('location', formData.location)
    fd.append('eventStartDate', formData.eventStartDate.trim())
    const openingHours =
      `${formData.eventStartTime} - ${formData.eventEndTime}`.trim()
    fd.append('openingHours', openingHours)
    if (imageFile) fd.append('image', imageFile)
    if (imageFile) {
      fd.append('imageWidth', String(imageMeta.width || 0))
      fd.append('imageHeight', String(imageMeta.height || 0))
      fd.append('imageSizeBytes', String(imageMeta.sizeBytes || 0))
      fd.append(
        'imageOriginalSizeBytes',
        String(imageMeta.originalSizeBytes || 0)
      )
      fd.append('imageFormat', imageMeta.format || 'webp')
    }
    fd.append('hostedBy', selectedVendorId)
    try {
      setSubmitting(true)
      const res = await updateEvent(eventId, fd)
      console.log('res', res)
      if (res && res.success) {
        setTimeout(() => {
          setToastOpen(true)
        }, 800)
        router.push('/discover-events')
      }
    } catch (err) {
      setErrors({ submit: 'Failed to update event' })
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        if (!eventId) {
          setErrors({ load: 'Invalid event id' })
          setLoading(false)
          return
        }
        const typesRes = await getEventTypes()
        const typesList = Array.isArray(typesRes?.data) ? typesRes.data : []
        setEventTypes(typesList)
        const eventRes = await getEventById(eventId)
        console.log('eventRes', eventRes)
        const d = eventRes?.data || {}
        const typeId = d.eventTypeId || d.eventType?._id || ''
        const toDateInput = v => {
          if (!v) return ''
          const dt =
            typeof v === 'object' && v.$date ? new Date(v.$date) : new Date(v)
          if (isNaN(dt.getTime())) return ''
          return dt.toISOString().slice(0, 10)
        }
        const parseOpeningHours = s => {
          let str = String(s || '')
          str = str.replace(/[`'"\(\)]/g, '').trim()
          if (!str) return { start: '', end: '' }
          const timeMatches = str.match(/\b(\d{1,2}:\d{2})\b/g)
          if (timeMatches && timeMatches.length >= 2) {
            return { start: timeMatches[0], end: timeMatches[1] }
          }
          const parts = str.split(/\s*-\s*/)
          if (parts.length === 2) {
            const left = parts[0].trim()
            const right = parts[1].trim()
            const m1 = left.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}:\d{2})/)
            const m2 = right.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}:\d{2})/)
            const startTime = m1 ? m1[2] : ''
            const endTime = m2 ? m2[2] : ''
            return { start: startTime, end: endTime }
          }
          return { start: '', end: '' }
        }
        const oh = parseOpeningHours(d.openingHours)
        setSelectedEventTypeId(
          toIdString(typeId) ||
            toIdString(typesList[0]?._id || typesList[0]?.id || '')
        )
        setFormData({
          eventName: String(d.eventName || ''),
          location: String(d.location || ''),
          mapLocation: String(d.mapLocation || ''),
          eventStartDate: toDateInput(d.eventStartDate),
          eventStartTime: String(d.eventStartTime || oh.start || ''),
          eventEndDate: toDateInput(d.eventEndDate),
          eventEndTime: String(d.eventEndTime || oh.end || ''),
          eventType: String(d.eventType?.name || 'Concert'),
          uploadImage: '',
          aboutEvent: String(d.about || ''),
          twitter: String(d.twitterLink || ''),
          website: String(d.websiteLink || ''),
          hostedBy: String(d.hostedBy || '')
        })
        const urls = buildImageUrls(d.image || d.uploadImage || '')
        setImageUrl(urls.primary)
        setImageUrlAlt(urls.alt)
        const initialVendorId = String(d.hostedBy || d.vendor?.userId || '')
        setSelectedVendorId(initialVendorId || '')
      } catch (e) {
        setErrors({ load: 'Failed to load event' })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [eventId])

  useEffect(() => {
    const fetchVendors = async () => {
      setVendorsLoading(true)
      setVendorsError('')
      try {
        const res = await getVendors()
        const list = Array.isArray(res?.data) ? res.data : []
        setVendors(list)
        if (!selectedVendorId && list.length > 0) {
          const first = list[0]
          setSelectedVendorId(String(first.userId))
        }
      } catch (e) {
        setVendors([])
        setVendorsError('Failed to load vendors')
      } finally {
        setVendorsLoading(false)
      }
    }
    fetchVendors()
  }, [])

  const handleBack = () => {
    router.push('/discover-events')
  }

  const confirmDelete = async () => {
    if (!eventId) return
    try {
      setDeleting(true)
      const res = await deleteEvent(eventId)
      if (res && res.success) {
        router.push('/discover-events')
      } else {
        setErrors({ submit: res?.message || 'Failed to delete event' })
      }
    } catch (e) {
      setErrors({ submit: 'Failed to delete event' })
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  const openCropperFromPreview = async () => {
    try {
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
    } catch {}
  }

  return (
    <div className='space-y-7 py-12 px-12'>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title='Event updated'
        description='Your changes have been saved'
        variant='success'
        duration={3000}
        position='top-right'
      />
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex items-center gap-4'>
          <button
            onClick={handleBack}
            className='flex items-center justify-center w-10 h-10 rounded-xl border border-[#E5E6EF] bg-white hover:bg-gray-50 transition-colors'
          >
            <ArrowLeft className='w-5 h-5 text-gray-600' />
          </button>
          <div className='flex flex-col gap-2'>
            <h1 className='text-2xl font-semibold text-slate-900'>
              Edit Event
            </h1>
            <p className='text-sm text-[#99A1BC]'>Dashboard / Edit Event</p>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-3 md:justify-end'>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting || loading}
            className='rounded-xl border border-[#E5E6EF] px-5 py-2.5 text-sm font-semibold text-[#FF5B2C] shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {deleting ? (
              <span className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className='rounded-xl bg-[#FF5B2C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {submitting ? (
              <span className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Updating...
              </span>
            ) : (
              'Update'
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
          <h2 className='text-lg font-semibold text-slate-900 mb-6'>
            Event Details
          </h2>

          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Event Name*
                </label>
                <input
                  type='text'
                  value={formData.eventName}
                  onChange={e => handleInputChange('eventName', e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter event name'
                />
                {errors.eventName && (
                  <p className='text-xs text-red-600'>{errors.eventName}</p>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Location*
                </label>
                <input
                  type='text'
                  value={formData.location}
                  onChange={e => handleInputChange('location', e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter location'
                />
                {errors.location && (
                  <p className='text-xs text-red-600'>{errors.location}</p>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Map Coordinates*
                </label>
                <input
                  type='text'
                  value={formData.mapLocation}
                  onChange={e =>
                    handleInputChange('mapLocation', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='lat, long'
                />
                {errors.mapLocation && (
                  <p className='text-xs text-red-600'>{errors.mapLocation}</p>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Start Date*
                </label>
                <input
                  type='date'
                  value={formData.eventStartDate}
                  onChange={e =>
                    handleInputChange('eventStartDate', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                />
                {errors.eventStartDate && (
                  <p className='text-xs text-red-600'>
                    {errors.eventStartDate}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  End Date*
                </label>
                <input
                  type='date'
                  value={formData.eventEndDate}
                  onChange={e =>
                    handleInputChange('eventEndDate', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                />
                {errors.eventEndDate && (
                  <p className='text-xs text-red-600'>{errors.eventEndDate}</p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Event Type*
                </label>
                <select
                  value={selectedEventTypeId}
                  onChange={e => setSelectedEventTypeId(e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                >
                  <option value=''>Select type</option>
                  {eventTypes.map((t, idx) => (
                    <option
                      key={`${toIdString(t._id || t.id)}-${idx}`}
                      value={toIdString(t._id || t.id)}
                    >
                      {t.name || t.eventType || 'Type'}
                    </option>
                  ))}
                </select>
                {errors.eventType && (
                  <p className='text-xs text-red-600'>{errors.eventType}</p>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Start Time*
                </label>
                <input
                  type='time'
                  value={formData.eventStartTime}
                  onChange={e =>
                    handleInputChange('eventStartTime', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                />
                {errors.eventStartTime && (
                  <p className='text-xs text-red-600'>
                    {errors.eventStartTime}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  End Time*
                </label>
                <input
                  type='time'
                  value={formData.eventEndTime}
                  onChange={e =>
                    handleInputChange('eventEndTime', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                />
                {errors.eventEndTime && (
                  <p className='text-xs text-red-600'>{errors.eventEndTime}</p>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-2 md:col-span-3'>
                <label className='text-sm font-medium text-slate-700'>
                  Hosted by vendor
                </label>
                <select
                  value={selectedVendorId}
                  onChange={e => setSelectedVendorId(e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  disabled={vendorsLoading}
                >
                  {vendorsLoading && (
                    <option value=''>Loading vendors...</option>
                  )}
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
                {vendorsError && (
                  <p className='text-xs text-red-600'>{vendorsError}</p>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-slate-700'>
                About*
              </label>
              <textarea
                value={formData.aboutEvent}
                onChange={e => handleInputChange('aboutEvent', e.target.value)}
                className='w-full min-h-28 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 py-3 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                placeholder='Describe the event'
              />
              {errors.aboutEvent && (
                <p className='text-xs text-red-600'>{errors.aboutEvent}</p>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  {' '}
                  Twitter / Instagram URL
                </label>
                <input
                  type='url'
                  value={formData.twitter}
                  onChange={e => handleInputChange('twitter', e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='https://twitter.com/...'
                />
                {errors.twitter && (
                  <p className='text-xs text-red-600'>{errors.twitter}</p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Website URL
                </label>
                <input
                  type='url'
                  value={formData.website}
                  onChange={e => handleInputChange('website', e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='https://example.com'
                />
                {errors.website && (
                  <p className='text-xs text-red-600'>{errors.website}</p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Upload Image
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
                  onChange={e => {
                    const f = e.target.files?.[0] || null
                    if (f) {
                      setRawImageFile(f)
                      try {
                        const u = URL.createObjectURL(f)
                        setImageUrl(u)
                      } catch {}
                      setImageFile(null)
                      setImageMeta({
                        width: 0,
                        height: 0,
                        sizeBytes: 0,
                        originalSizeBytes: 0,
                        format: ''
                      })
                    } else {
                      setImageFile(null)
                      setImageMeta({
                        width: 0,
                        height: 0,
                        sizeBytes: 0,
                        originalSizeBytes: 0,
                        format: ''
                      })
                    }
                  }}
                />
                {imageUrl && (
                  <div className='mt-2'>
                    <img
                      src={imageUrl}
                      alt='Current event image'
                      className='w-24 h-24 object-cover rounded border border-[#E5E6EF] cursor-pointer'
                      onError={e => {
                        if (
                          imageUrlAlt &&
                          e.currentTarget.src !== imageUrlAlt
                        ) {
                          e.currentTarget.src = imageUrlAlt
                        } else {
                          e.currentTarget.src = '/images/no-image.webp'
                        }
                      }}
                      onClick={openCropperFromPreview}
                    />
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
                      Original:{' '}
                      {(imageMeta.originalSizeBytes / 1024).toFixed(1)} KB
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
        </div>
      </form>
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
                  Delete this event?
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
                onClick={confirmDelete}
                disabled={deleting}
                className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {deleting ? (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Deleting...
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
