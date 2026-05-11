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
import { getVendors } from '@/services/discover-events/event.service'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'

function RichTextEditor ({ value, onChange, minHeight = 140 }) {
  const editorRef = useRef(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const runCommand = (command, commandValue = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    onChange(editorRef.current?.innerHTML || '')
  }

  const addLink = () => {
    const url = window.prompt('Enter URL')
    if (url) runCommand('createLink', url)
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL')
    if (url) runCommand('insertImage', url)
  }

  const pickColor = () => {
    const color = window.prompt('Enter color hex code', '#FF5733')
    if (color) runCommand('foreColor', color)
  }

  const buttonClass =
    'p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-4 z-[9999] bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden'
          : 'border border-gray-300 rounded-lg overflow-hidden'
      }
    >
      <div className='flex items-center gap-1 p-1.5 border-b border-gray-300 bg-gray-50 overflow-x-auto'>
        <button
          type='button'
          className={buttonClass}
          title='Clear Format'
          onClick={() => runCommand('removeFormat')}
        >
          <Wand2 className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Bold'
          onClick={() => runCommand('bold')}
        >
          <Bold className='w-3.5 h-3.5 font-bold' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Underline'
          onClick={() => runCommand('underline')}
        >
          <Underline className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Italic'
          onClick={() => runCommand('italic')}
        >
          <Italic className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Strikethrough'
          onClick={() => runCommand('strikeThrough')}
        >
          <Strikethrough className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Text Color'
          onClick={pickColor}
        >
          <Palette className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Bullet List'
          onClick={() => runCommand('insertUnorderedList')}
        >
          <List className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Numbered List'
          onClick={() => runCommand('insertOrderedList')}
        >
          <ListOrdered className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Align Left'
          onClick={() => runCommand('justifyLeft')}
        >
          <AlignLeft className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Align Center'
          onClick={() => runCommand('justifyCenter')}
        >
          <AlignCenter className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Align Right'
          onClick={() => runCommand('justifyRight')}
        >
          <AlignRight className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Link'
          onClick={addLink}
        >
          <Link2 className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Image'
          onClick={addImage}
        >
          <ImageIcon className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Code Block'
          onClick={() => runCommand('formatBlock', 'pre')}
        >
          <Code className='w-3.5 h-3.5' />
        </button>
        <button
          type='button'
          className={buttonClass}
          title='Fullscreen'
          onClick={() => setFullscreen(prev => !prev)}
        >
          <Maximize2 className='w-3.5 h-3.5' />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={e => onChange(e.currentTarget.innerHTML)}
        className='w-full px-3 py-2 focus:outline-none text-sm text-gray-900 overflow-auto'
        style={{ minHeight: fullscreen ? 'calc(100vh - 120px)' : minHeight }}
      />
    </div>
  )
}

const DEFAULT_MAP_CENTER = { lat: 6.5244, lng: 3.3792 }

const parseMapLocation = value => {
  const [lat, lng] = String(value || '')
    .split(',')
    .map(v => Number(v.trim()))

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

const lngToTileX = (lng, zoom) => ((lng + 180) / 360) * 2 ** zoom
const latToTileY = (lat, zoom) => {
  const rad = (lat * Math.PI) / 180
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    2 ** zoom
  )
}
const tileXToLng = (x, zoom) => (x / 2 ** zoom) * 360 - 180
const tileYToLat = (y, zoom) => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
}

function MapLocationPicker ({ value, onChange, error }) {
  const [zoom, setZoom] = useState(13)
  const selected = parseMapLocation(value)
  const center = selected || DEFAULT_MAP_CENTER
  const centerX = lngToTileX(center.lng, zoom)
  const centerY = latToTileY(center.lat, zoom)
  const tileSize = 256
  const tiles = []
  const maxTile = 2 ** zoom

  for (let dx = -2; dx <= 2; dx += 1) {
    for (let dy = -2; dy <= 2; dy += 1) {
      const rawX = Math.floor(centerX) + dx
      const rawY = Math.floor(centerY) + dy
      if (rawY < 0 || rawY >= maxTile) continue
      const x = ((rawX % maxTile) + maxTile) % maxTile
      tiles.push({ x, y: rawY, rawX })
    }
  }

  const handleMapClick = event => {
    const rect = event.currentTarget.getBoundingClientRect()
    const worldX = centerX * tileSize + event.clientX - rect.left - rect.width / 2
    const worldY =
      centerY * tileSize + event.clientY - rect.top - rect.height / 2
    const lat = tileYToLat(worldY / tileSize, zoom)
    const lng = tileXToLng(worldX / tileSize, zoom)
    onChange(`${lat.toFixed(6)},${lng.toFixed(6)}`)
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-1.5'>
        <label className='block text-xs font-medium text-gray-700'>
          Map Location<span className='text-red-500'>*</span>
        </label>
        <div className='flex gap-1'>
          <button
            type='button'
            onClick={() => setZoom(z => Math.max(3, z - 1))}
            className='px-2 py-1 text-xs border border-gray-300 rounded bg-white'
          >
            -
          </button>
          <button
            type='button'
            onClick={() => setZoom(z => Math.min(18, z + 1))}
            className='px-2 py-1 text-xs border border-gray-300 rounded bg-white'
          >
            +
          </button>
        </div>
      </div>
      <div
        onClick={handleMapClick}
        className='relative h-64 overflow-hidden rounded-lg border border-gray-300 bg-gray-100 cursor-crosshair'
      >
        {tiles.map(tile => (
          <img
            key={`${zoom}-${tile.rawX}-${tile.y}`}
            src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
            alt=''
            className='absolute select-none pointer-events-none'
            style={{
              width: tileSize,
              height: tileSize,
              left: `calc(50% + ${(tile.rawX - centerX) * tileSize}px)`,
              top: `calc(50% + ${(tile.y - centerY) * tileSize}px)`
            }}
            draggable={false}
          />
        ))}
        {selected && (
          <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full'>
            <div className='h-7 w-7 rounded-full bg-[#FF5733] border-2 border-white shadow-lg flex items-center justify-center'>
              <div className='h-2 w-2 rounded-full bg-white' />
            </div>
          </div>
        )}
        <div className='absolute bottom-2 left-2 rounded bg-white/90 px-2 py-1 text-[10px] text-gray-600 shadow'>
          Click map to select location
        </div>
      </div>
      <input
        type='text'
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder='lat,lng e.g. 6.524400,3.379200'
        className='mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
      />
      {error && <p className='text-red-500 text-xs mt-1'>{error}</p>}
    </div>
  )
}

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
    durationData: '',
    uploadImage: '',
    aboutActivity: '',
    description: '',
    importantInfo: '',
    direction: '',
    contactUs: '',
    getPassUrl: 'https://annualpass.giwagardens.com/OpenDay',
    getPassLabel: 'Get Pass',
    inquiryUrl: 'https://annualpass.giwagardens.com/PaymentLink',
    inquiryLabel: 'Inquiries',
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

  const [vendors, setVendors] = useState([])
  const [vendorsLoading, setVendorsLoading] = useState(false)
  const [vendorsError, setVendorsError] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState('')

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
    if (!formData.description.trim()) newErrors.description = 'Required'
    if (!selectedDays.length) newErrors.activityDays = 'Required'
    if (!formData.twitter.trim()) newErrors.twitter = 'Required'
    if (!formData.website.trim()) newErrors.website = 'Required'
    if (!selectedActivityTypeId && !formData.activityTypeId.trim())
      newErrors.activityTypeId = 'Required'
    if (!selectedVendorId) newErrors.hostedBy = 'Select vendor'
    if (!imageFile) newErrors.uploadImage = 'Please select an image file'
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
    fd.append(
      'activityType',
      (selectedActivityTypeId || formData.activityTypeId).trim()
    )
    fd.append('twitterLink', formData.twitter.trim())
    fd.append('about', formData.aboutActivity.trim())
    fd.append('description', formData.description.trim())
    fd.append('importantInfo', String(formData.importantInfo || '').trim())
    fd.append('direction', String(formData.direction || '').trim())
    fd.append('contactUs', String(formData.contactUs || '').trim())
    fd.append('getPassUrl', String(formData.getPassUrl || '').trim())
    fd.append('getPassLabel', String(formData.getPassLabel || '').trim())
    fd.append('inquiryUrl', String(formData.inquiryUrl || '').trim())
    fd.append('inquiryLabel', String(formData.inquiryLabel || '').trim())
    fd.append('mapLocation', formData.mapLocation.trim())
    fd.append('status', 'upcoming')
    const durationText = `${String(calculatedDuration || 1)} Days`
    fd.append('duration', durationText)
    fd.append('durationData', (formData.durationData || durationText).trim())
    fd.append('websiteLink', formData.website.trim())
    fd.append('location', formData.location.trim())
    fd.append('openingHours', formData.openingHours.trim())
    fd.append('activityName', formData.activityName.trim())
    fd.append('image', imageFile)
    const effectiveEndDate = (
      formData.activityEndDate || formData.activityStartDate
    ).trim()
    fd.append('activityStartDate', formData.activityStartDate.trim())
    fd.append('activityEndDate', effectiveEndDate)
    fd.append('dateRangeDuration', String(calculatedDuration || 1))
    fd.append('hostedBy', selectedVendorId)

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
    const fetchVendors = async () => {
      setVendorsLoading(true)
      setVendorsError('')
      try {
        const res = await getVendors()
        const list = Array.isArray(res?.data) ? res.data : []
        setVendors(list)
        if (list.length > 0) {
          const first = list[0]
          setSelectedVendorId(String(first.userId))
        } else {
          setSelectedVendorId('')
        }
      } catch (e) {
        setVendors([])
        setSelectedVendorId('')
        setVendorsError('Failed to load vendors')
      } finally {
        setVendorsLoading(false)
      }
    }
    fetchVendors()
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

  const handleEditTickets = () => {
    router.push('/places-to-visit/edit-tickets')
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-12 relative z-50'>
      {/* Header */}
      <div className='mb-4'>
        <h1 className='text-xl sm:text-2xl font-bold text-gray-900'>
          Add Activity
        </h1>
        <p className='text-xs text-gray-500 mt-1'>Dashboard / Add Activity</p>
      </div>

      {/* Main Card */}
      <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-4 relative z-50'>
        {/* Card Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-3 border-b border-gray-200'>
          <h2 className='text-base font-semibold text-gray-900'>
            Activity Details
          </h2>
          <div className='flex gap-2'>
            <button
              onClick={handleAdd}
              className='px-4 py-2 bg-[#FF5B2C] hover:bg-[#F0481A] text-white text-sm font-medium rounded-lg transition-colors'
            >
              Add
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className='space-y-4'>
          {/* Row 1: Activity Name, Location, Map Location */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                Activity Name<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.activityName}
                onChange={e => handleChange('activityName', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
              />
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                Location<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.location}
                onChange={e => handleChange('location', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
              />
            </div>
            <div className='md:col-span-3'>
              <MapLocationPicker
                value={formData.mapLocation}
                onChange={value => handleChange('mapLocation', value)}
                error={errors.mapLocation}
              />
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <div className='md:col-span-3'>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                Hosted by vendor<span className='text-red-500'>*</span>
              </label>
              <select
                value={selectedVendorId}
                onChange={e => setSelectedVendorId(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 bg-white'
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
              {vendorsError && (
                <p className='text-red-500 text-xs mt-1'>{vendorsError}</p>
              )}
              {!selectedVendorId && (
                <p className='text-red-500 text-xs mt-1'>Select vendor</p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <div className='relative z-50'>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                Activity Type<span className='text-red-500'>*</span>
              </label>
              <select
                value={selectedActivityTypeId}
                onChange={e => setSelectedActivityTypeId(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900 bg-white relative z-50'
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
                <p className='text-red-500 text-xs mt-1'>
                  {activityTypesError}
                </p>
              )}
              {errors.activityTypeId && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.activityTypeId}
                </p>
              )}
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                Activity Start Date<span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type='date'
                  value={formData.activityStartDate}
                  onChange={e =>
                    handleChange('activityStartDate', e.target.value)
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                />
                <Calendar className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
              </div>
              {errors.activityStartDate && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.activityStartDate}
                </p>
              )}
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                Activity End Date<span className='text-red-500'>*</span>
              </label>
              <div className='relative'>
                <input
                  type='date'
                  value={formData.activityEndDate}
                  onChange={e =>
                    handleChange('activityEndDate', e.target.value)
                  }
                  min={formData.activityStartDate || undefined}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                />
                <Calendar className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
              </div>
              {errors.activityEndDate && (
                <p className='text-red-500 text-xs mt-1'>
                  {errors.activityEndDate}
                </p>
              )}
              {calculatedDuration > 0 && (
                <p className='text-gray-600 text-xs mt-1'>
                  Duration: {calculatedDuration} day
                  {calculatedDuration !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Activity Days, Opening Hours, Duration */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                Activity Days<span className='text-red-500'>*</span>
              </label>
              <div className='relative' ref={daysDropdownRef}>
                <button
                  type='button'
                  onClick={() => setDaysOpen(v => !v)}
                  className='w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500'
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
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
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
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                  />
                  <Calendar className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                </div>
                <div className='flex items-center px-1 text-gray-500 text-sm'>-</div>
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
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                  />
                  <Calendar className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                </div>
              </div>
            </div>
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                Duration<span className='text-red-500'>*</span>
              </label>
              <div className='flex gap-2'>
                <input
                  type='number'
                  value={calculatedDuration || ''}
                  disabled
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-900 cursor-not-allowed'
                />
                <select
                  value='Days'
                  disabled
                  className='px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-900 cursor-not-allowed'
                >
                  <option>Days</option>
                </select>
              </div>
              <input
                type='text'
                value={formData.durationData}
                onChange={e => handleChange('durationData', e.target.value)}
                placeholder={
                  calculatedDuration > 0
                    ? `${calculatedDuration} Days`
                    : 'e.g. 31 Days'
                }
                className='mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
              />
              <p className='text-gray-500 text-xs mt-1'>
                Shows as Duration on the tour detail page.
              </p>
            </div>
          </div>

          {/* Upload Image */}
          <div className='max-w-md'>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>
              Upload Image<span className='text-red-500'>*</span>
            </label>
            <div
              className='flex h-10 items-stretch overflow-hidden rounded-lg border border-[#E5E6EF]'
              onClick={() => fileInputRef.current?.click()}
            >
              <div className='flex-1 bg-[#F8F9FC] px-3 text-xs text-slate-700 flex items-center justify-between cursor-pointer'>
                <span className='truncate' title={formData.uploadImage}>
                  {formData.uploadImage || 'Image.jpg'}
                </span>
              </div>
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='px-4 text-xs font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
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
              <p className='text-red-500 text-xs mt-1'>{errors.uploadImage}</p>
            )}
            <p className='text-gray-500 text-xs mt-1'>
              Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
            </p>
            {imageUrl && (
              <div className='mt-2'>
                <img
                  src={imageUrl}
                  alt='Activity image preview'
                  className='w-24 h-24 object-cover rounded border border-gray-300'
                />
              </div>
            )}
          </div>

          {/* About Activity - Rich Text Editor */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>
              About Activity<span className='text-red-500'>*</span>
            </label>
            <RichTextEditor
              value={formData.aboutActivity}
              onChange={value => handleChange('aboutActivity', value)}
            />
            {errors.aboutActivity && (
              <p className='text-red-500 text-xs mt-1'>
                {errors.aboutActivity}
              </p>
            )}
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>
              Description<span className='text-red-500'>*</span>
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={value => handleChange('description', value)}
              minHeight={120}
            />
            {errors.description && (
              <p className='text-red-500 text-xs mt-1'>
                {errors.description}
              </p>
            )}
          </div>

          {/* Important Info */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>
              Important Info
            </label>
            <RichTextEditor
              value={formData.importantInfo}
              onChange={value => handleChange('importantInfo', value)}
              minHeight={120}
            />
          </div>

          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1.5'>
              Contact Us
            </label>
            <RichTextEditor
              value={formData.contactUs}
              onChange={value => handleChange('contactUs', value)}
              minHeight={120}
            />
          </div>

          <div className='pt-4'>
            <div className='bg-gray-900 text-white px-3 py-1.5 rounded-t-lg inline-block mb-3'>
              <h3 className='font-medium text-sm'>CTA Buttons</h3>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                  Get Pass Label
                </label>
                <input
                  type='text'
                  value={formData.getPassLabel}
                  onChange={e => handleChange('getPassLabel', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                  Get Pass URL
                </label>
                <input
                  type='text'
                  value={formData.getPassUrl}
                  onChange={e => handleChange('getPassUrl', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                  Inquiry Label
                </label>
                <input
                  type='text'
                  value={formData.inquiryLabel}
                  onChange={e => handleChange('inquiryLabel', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                  Inquiry URL
                </label>
                <input
                  type='text'
                  value={formData.inquiryUrl}
                  onChange={e => handleChange('inquiryUrl', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className='pt-4'>
            <div className='bg-gray-900 text-white px-3 py-1.5 rounded-t-lg inline-block mb-3'>
              <h3 className='font-medium text-sm'>Contact Information</h3>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                  Twitter / Instagram <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.twitter}
                  onChange={e => handleChange('twitter', e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                  Website<span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <input
                    type='text'
                    value={formData.website}
                    onChange={e => handleChange('website', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-900'
                  />
                  <Calendar className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                </div>
              </div>
            </div>
          </div>
          {errors.submit && (
            <p className='text-red-500 text-xs'>{errors.submit}</p>
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
