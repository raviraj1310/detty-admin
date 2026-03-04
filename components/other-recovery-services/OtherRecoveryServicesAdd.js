'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Trash2, Plus } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import ImageCropper from '@/components/ui/ImageCropper'
import Toast from '@/components/ui/Toast'
import { createOtherRecoveryService } from '@/services/v2/other-recovery-services/otherRecoveryServices.service'

const SERVICE_CATEGORIES = [
  { value: 'sauna', label: 'Sauna' },
  { value: 'massage', label: 'Massage' },
  { value: 'recovery-therapy', label: 'Recovery Therapy' },
  { value: 'cryotherapy', label: 'Cryotherapy' },
  { value: 'hydrotherapy', label: 'Hydrotherapy' },
  { value: 'physiotherapy', label: 'Physiotherapy' },
  { value: 'other', label: 'Other' }
]

export default function OtherRecoveryServicesAdd () {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const [formData, setFormData] = useState({
    recoveryServiceName: '',
    serviceCategory: '',
    duration: '',
    startTime: '',
    endTime: '',
    location: '',
    coordinate: ''
  })

  const [aboutRecoveryService, setAboutRecoveryService] = useState('')
  const [importantInformation, setImportantInformation] = useState('')

  const [slots, setSlots] = useState([
    { id: 1, slotName: '', slotTime: '', inventory: '' }
  ])

  const [mainImage, setMainImage] = useState(null)
  const [mainImageUrl, setMainImageUrl] = useState('')
  const [galleryImages, setGalleryImages] = useState([])

  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [durationError, setDurationError] = useState('')
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = e => {
    const { name, value } = e.target
    if (name === 'duration') {
      const digitsOnly = value.replace(/\D/g, '')
      setFormData(prev => ({ ...prev, [name]: digitsOnly }))
      setDurationError('')
      return
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSlotChange = (id, field, value) => {
    setSlots(slots.map(slot => (slot.id === id ? { ...slot, [field]: value } : slot)))
  }

  const addSlot = () => {
    setSlots([
      ...slots,
      { id: Date.now(), slotName: `Slot ${slots.length + 1}`, slotTime: '', inventory: '' }
    ])
  }

  const removeSlot = id => {
    if (slots.length > 1) setSlots(slots.filter(slot => slot.id !== id))
  }

  const handleMainImageChange = e => {
    const file = e.target.files[0]
    if (file) {
      setRawImageFile(file)
      setCropOpen(true)
    }
  }

  const handleCroppedImage = ({ file }) => {
    setMainImage(file)
    setMainImageUrl(URL.createObjectURL(file))
    setCropOpen(false)
  }

  const handleGalleryUpload = e => {
    const files = Array.from(e.target.files)
    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }))
    setGalleryImages(prev => [...prev, ...newImages])
  }

  const removeGalleryImage = id => {
    setGalleryImages(prev => prev.filter(img => img.id !== id))
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  const formatTime = time => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour.toString().padStart(2, '0')}:${minutes} ${ampm}`
  }

  const validateDuration = () => {
    const raw = String(formData.duration).trim()
    if (!raw) {
      setDurationError('Duration is required')
      return false
    }
    const num = parseInt(raw, 10)
    if (Number.isNaN(num) || num < 1) {
      setDurationError('Duration must be a positive whole number (e.g. 1, 60, 120)')
      return false
    }
    if (num > 9999) {
      setDurationError('Duration cannot exceed 9999')
      return false
    }
    setDurationError('')
    return true
  }

  const handleSubmit = async () => {
    if (!formData.recoveryServiceName)
      return showToast('Recovery Service Name is required', 'error')
    if (!formData.serviceCategory)
      return showToast('Service Category is required', 'error')
    if (!aboutRecoveryService)
      return showToast('About the Recovery Service is required', 'error')
    if (!validateDuration()) {
      showToast('Please fix the duration', 'error')
      return
    }
    if (!formData.startTime)
      return showToast('Start Time is required', 'error')
    if (!formData.endTime)
      return showToast('End Time is required', 'error')
    if (!formData.location)
      return showToast('Location is required', 'error')
    if (!formData.coordinate)
      return showToast('Location Coordinates are required', 'error')
    if (!mainImage)
      return showToast('Main image is required', 'error')
    if (!importantInformation)
      return showToast('Important Information is required', 'error')

    for (const slot of slots) {
      if (!slot.slotName || !slot.slotTime || !slot.inventory)
        return showToast('All slot fields are required', 'error')
    }

    setIsSubmitting(true)
    try {
      const payload = new FormData()

      payload.append('recoveryServiceName', formData.recoveryServiceName)
      payload.append('serviceCategory', formData.serviceCategory)
      payload.append('duration', formData.duration)
      payload.append('startTime', formatTime(formData.startTime))
      payload.append('endTime', formatTime(formData.endTime))
      payload.append('location', formData.location)
      payload.append('coordinate', formData.coordinate)
      payload.append('aboutRecoveryService', aboutRecoveryService)
      payload.append('importantInformation', importantInformation)
      payload.append('status', true)

      const formattedSlots = slots.map(({ slotName, slotTime, inventory }) => ({
        slotName,
        slotTime,
        inventory: Number(inventory)
      }))
      payload.append('slots', JSON.stringify(formattedSlots))

      if (mainImage) payload.append('image', mainImage)

      if (galleryImages.length > 0) {
        galleryImages.forEach(img => payload.append('gallery', img.file))
      }

      const response = await createOtherRecoveryService(payload)

      if (response && response.success) {
        showToast('Recovery service added successfully', 'success')
        setTimeout(() => router.push('/other-recovery-services'), 1500)
      } else {
        showToast(response?.message || 'Failed to create service', 'error')
      }
    } catch (error) {
      console.error('Error creating recovery service:', error)
      const errMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create recovery service'
      showToast(errMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      {/* Page Header */}
      <div className='mb-6'>
        <h1 className='text-xl font-bold text-gray-900'>
          Add New Recovery Service
        </h1>
        <nav className='mt-1 text-xs text-gray-500'>
          <Link href='/dashboard' className='hover:text-gray-700'>
            Dashboard
          </Link>
          <span className='mx-1'>/</span>
          <span className='text-gray-900'>Add New Spa</span>
        </nav>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        {/* Card Header */}
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h2 className='text-base font-semibold text-gray-900'>
            Recovery Service Details
          </h2>
          <div className='flex items-center gap-3'>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='rounded-lg bg-[#FF5B2C] px-6 py-2 text-xs font-semibold text-white hover:bg-[#F0481A] disabled:opacity-50 transition'
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        <div className='p-6 space-y-7'>
          {/* Recovery Service Name & Category */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-gray-700'>
                Recovery Services Name*
              </label>
              <input
                type='text'
                name='recoveryServiceName'
                value={formData.recoveryServiceName}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C]'
                placeholder='Sauna & Steam Therapy'
              />
            </div>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-gray-700'>
                Service Category*
              </label>
              <select
                name='serviceCategory'
                value={formData.serviceCategory}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C] appearance-none'
              >
                <option value=''>Select Category</option>
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* About the Recovery Service */}
          <div>
            <label className='mb-1.5 block text-xs font-medium text-gray-700'>
              About the Recovery Service*
            </label>
            <div className='rounded-lg border border-gray-200 bg-white overflow-hidden'>
              <TiptapEditor
                content={aboutRecoveryService}
                onChange={setAboutRecoveryService}
                placeholder='Describe the recovery service...'
              />
            </div>
          </div>

          {/* Duration, Start Time, End Time */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-gray-700'>
                Duration*
              </label>
              <input
                type='text'
                name='duration'
                inputMode='numeric'
                value={formData.duration}
                onChange={handleInputChange}
                placeholder='e.g. 60'
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:border-[#FF5B2C] focus:ring-[#FF5B2C] ${
                  durationError ? 'border-red-400' : 'border-gray-200'
                }`}
              />
              {durationError && (
                <p className='mt-1 text-xs text-red-600'>{durationError}</p>
              )}
            </div>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-gray-700'>
                Start Time*
              </label>
              <div className='relative'>
                <input
                  type='time'
                  name='startTime'
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C]'
                />
                <Clock className='absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none' />
              </div>
            </div>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-gray-700'>
                End Time*
              </label>
              <div className='relative'>
                <input
                  type='time'
                  name='endTime'
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C]'
                />
                <Clock className='absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none' />
              </div>
            </div>
          </div>

          {/* Slots */}
          <div>
            <div className='mb-3 flex items-center justify-between'>
              <h3 className='text-xs font-semibold text-gray-700'>Slots</h3>
              <button
                onClick={addSlot}
                className='flex items-center gap-1 text-xs font-medium text-[#FF5B2C] hover:text-[#F0481A]'
              >
                <Plus className='h-3.5 w-3.5' />
                Add Slot
              </button>
            </div>

            <div className='rounded-xl bg-gray-50 p-4 space-y-3'>
              {/* Column headers */}
              <div className='grid grid-cols-12 gap-3 px-1 text-[11px] font-medium text-gray-500'>
                <div className='col-span-3'>Slot Name*</div>
                <div className='col-span-4'>Time*</div>
                <div className='col-span-4'>Inventory</div>
                <div className='col-span-1' />
              </div>

              {slots.map(slot => (
                <div key={slot.id} className='grid grid-cols-12 gap-3 items-center'>
                  <div className='col-span-3'>
                    <input
                      type='text'
                      value={slot.slotName}
                      onChange={e => handleSlotChange(slot.id, 'slotName', e.target.value)}
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF5B2C] focus:outline-none'
                      placeholder='Morning Slot'
                    />
                  </div>
                  <div className='col-span-4'>
                    <input
                      type='text'
                      value={slot.slotTime}
                      onChange={e => handleSlotChange(slot.id, 'slotTime', e.target.value)}
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF5B2C] focus:outline-none'
                      placeholder='09:00 AM'
                    />
                  </div>
                  <div className='col-span-4'>
                    <input
                      type='number'
                      value={slot.inventory}
                      onChange={e => handleSlotChange(slot.id, 'inventory', e.target.value)}
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF5B2C] focus:outline-none'
                      placeholder='5'
                      min='0'
                    />
                  </div>
                  <div className='col-span-1 flex justify-center'>
                    <button
                      onClick={() => removeSlot(slot.id)}
                      className='p-1 text-gray-400 hover:text-red-500 transition-colors'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location, Coordinates, Upload Image */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-gray-700'>
                Location*
              </label>
              <input
                type='text'
                name='location'
                value={formData.location}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C]'
                placeholder='Lekki Phase 1, Lagos'
              />
            </div>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-gray-700'>
                Location Coordinates*
              </label>
              <input
                type='text'
                name='coordinate'
                value={formData.coordinate}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C]'
                placeholder='6.449942, 3.442864'
              />
            </div>
            <div>
              <label className='mb-1.5 block text-xs font-medium text-gray-700'>
                Upload Image*
              </label>
              <div className='flex rounded-lg border border-gray-200 bg-white overflow-hidden'>
                <div className='flex-1 truncate px-4 py-2.5 text-sm text-gray-400'>
                  {mainImage ? mainImage.name || 'Image selected' : 'Image.jpg'}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className='bg-gray-100 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-200'
                >
                  Browse
                </button>
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleMainImageChange}
                  accept='image/*'
                  className='hidden'
                />
              </div>
              {mainImageUrl && (
                <div className='mt-3 relative w-full h-36 rounded-lg overflow-hidden border border-gray-200'>
                  <img
                    src={mainImageUrl}
                    alt='Preview'
                    className='w-full h-full object-cover'
                  />
                  <button
                    onClick={() => {
                      setMainImage(null)
                      setMainImageUrl('')
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className='absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 hover:text-red-600 shadow-sm'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Important Information */}
          <div>
            <label className='mb-1.5 block text-xs font-medium text-gray-700'>
              Important Information*
            </label>
            <div className='rounded-lg border border-gray-200 bg-white overflow-hidden'>
              <TiptapEditor
                content={importantInformation}
                onChange={setImportantInformation}
                placeholder='Enter important information...'
              />
            </div>
          </div>

          {/* Gallery */}
          <div>
            <div className='mb-4'>
              <span className='inline-block rounded-md bg-black px-3 py-1 text-xs font-semibold text-white'>
                Gallery
              </span>
            </div>

            <div className='mb-5'>
              <label className='mb-1.5 block text-xs font-medium text-gray-700'>
                Upload Image*
              </label>
              <div className='flex max-w-sm rounded-lg border border-gray-200 bg-white overflow-hidden'>
                <div className='flex-1 truncate px-4 py-2.5 text-sm text-gray-400'>
                  {galleryImages.length > 0
                    ? `${galleryImages.length} file(s) selected`
                    : 'Image.jpg'}
                </div>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className='bg-gray-100 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-200'
                >
                  Browse
                </button>
                <input
                  type='file'
                  ref={galleryInputRef}
                  onChange={handleGalleryUpload}
                  accept='image/*'
                  multiple
                  className='hidden'
                />
              </div>
            </div>

            {/* Gallery Grid */}
            {galleryImages.length > 0 && (
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
                {galleryImages.map(img => (
                  <div
                    key={img.id}
                    className='group relative aspect-video overflow-hidden rounded-xl bg-gray-100'
                  >
                    <img
                      src={img.url}
                      alt='Gallery'
                      className='h-full w-full object-cover'
                    />
                    <button
                      onClick={() => removeGalleryImage(img.id)}
                      className='absolute right-2 top-2 rounded-full bg-white p-1.5 text-gray-700 shadow-sm hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Toast
        open={toast.show}
        onOpenChange={val => setToast(prev => ({ ...prev, show: val }))}
        title={toast.type === 'error' ? 'Error' : 'Success'}
        description={toast.message}
        variant={toast.type}
      />

      {cropOpen && (
        <ImageCropper
          open={cropOpen}
          file={rawImageFile}
          onCropped={handleCroppedImage}
          onClose={() => setCropOpen(false)}
        />
      )}
    </div>
  )
}
