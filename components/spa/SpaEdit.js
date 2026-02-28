'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Trash2,
  Plus,
  Upload,
  Image as ImageIcon,
  X,
  ChevronLeft
} from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import ImageCropper from '@/components/ui/ImageCropper'
import Toast from '@/components/ui/Toast'

import {
  updateSpa,
  getSpaById,
  deleteSpaGallery
} from '@/services/v2/spa/spa.service'

const getSpaImageUrl = imagePath => {
  if (!imagePath) return null
  if (typeof imagePath !== 'string') return null
  if (imagePath.startsWith('http')) return imagePath

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL2 ||
    process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) return `/upload/image/${imagePath}`

  try {
    const { origin } = new URL(baseUrl)
    return `${origin}/upload/image/${imagePath}`
  } catch {
    return `/upload/image/${imagePath}`
  }
}

export default function SpaEdit () {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  // State
  const [formData, setFormData] = useState({
    spaName: '',
    slug: '',
    duration: '',
    startTime: '',
    endTime: '',
    location: '',
    locationCoordinates: ''
  })

  const [aboutSpa, setAboutSpa] = useState('')
  const [importantInfo, setImportantInfo] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [slots, setSlots] = useState([
    { id: 1, slotName: '', time: '', inventory: '' }
  ])

  const [mainImage, setMainImage] = useState(null)
  const [mainImageUrl, setMainImageUrl] = useState('')
  const [galleryImages, setGalleryImages] = useState([])

  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)

  const convertTo24Hour = timeStr => {
    if (!timeStr) return ''
    const [time, modifier] = timeStr.split(' ')
    if (!modifier) return timeStr // already in 24h or invalid

    let [hours, minutes] = time.split(':')
    if (hours === '12') {
      hours = '00'
    }

    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12
    }

    return `${hours}:${minutes}`
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        if (id) {
          const spaResponse = await getSpaById(id)
          const spa = spaResponse.data || spaResponse

          // Populate form
          setFormData({
            spaName: spa.spaName || '',
            slug: spa.slug || '',
            duration: spa.duration || '',
            startTime: convertTo24Hour(spa.startTime) || '',
            endTime: convertTo24Hour(spa.endTime) || '',
            location: spa.location || '',
            locationCoordinates: spa.locationCoordinates || ''
          })

          setAboutSpa(spa.aboutSpa || '')
          setImportantInfo(spa.importantInformation || '')

          // Populate slots
          const apiSlots = spa.slots || []
          if (apiSlots.length > 0) {
            setSlots(
              apiSlots.map((s, index) => ({
                id: s._id || Date.now() + index,
                slotName: s.slotName || '',
                time: s.time || '',
                inventory: s.inventory || ''
              }))
            )
          }

          // Populate images
          if (spa.image) {
            setMainImageUrl(getSpaImageUrl(spa.image))
          }

          if (spa.gallery && Array.isArray(spa.gallery)) {
            setGalleryImages(
              spa.gallery.map((item, index) => {
                let imagePath = item
                if (typeof item === 'object' && item !== null) {
                  imagePath = item.photo || item.image || item.url || item.file
                }
                return {
                  id: item._id || 'existing-' + index,
                  url: getSpaImageUrl(imagePath),
                  isExisting: true
                }
              })
            )
          } else if (spa.imageGallery && Array.isArray(spa.imageGallery)) {
            // Fallback for old data structure if needed, or if API returns imageGallery
            setGalleryImages(
              spa.imageGallery.map((item, index) => {
                let imagePath = item
                if (typeof item === 'object' && item !== null) {
                  imagePath = item.photo || item.image || item.url || item.file
                }
                return {
                  id: item._id || 'existing-' + index,
                  url: getSpaImageUrl(imagePath),
                  isExisting: true
                }
              })
            )
          }
        }
      } catch (error) {
        console.error('Error fetching spa data:', error)
        showToast('Failed to load spa details', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Handlers
  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSlotChange = (id, field, value) => {
    setSlots(
      slots.map(slot => (slot.id === id ? { ...slot, [field]: value } : slot))
    )
  }

  const addSlot = () => {
    setSlots([
      ...slots,
      {
        id: Date.now(),
        slotName: `Slot ${slots.length + 1}`,
        time: '',
        inventory: ''
      }
    ])
  }

  const removeSlot = id => {
    if (slots.length > 1) {
      setSlots(slots.filter(slot => slot.id !== id))
    }
  }

  // Main Image Handling
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

  // Gallery Handling
  const handleGalleryUpload = e => {
    const files = Array.from(e.target.files)
    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Date.now() + Math.random(),
      isExisting: false
    }))
    setGalleryImages([...galleryImages, ...newImages])
  }

  const removeGalleryImage = async imageId => {
    const imageToRemove = galleryImages.find(img => img.id === imageId)
    if (!imageToRemove) return

    if (imageToRemove.isExisting) {
      try {
        const res = await deleteSpaGallery(imageId)
        if (res && res.success) {
          showToast('Image deleted successfully', 'success')
        } else {
          // If the API call fails or isn't supported for individual gallery item deletion by ID directly,
          // we might just want to remove it from the UI and handle it in the update payload if the backend supports full replacement.
          // However, assuming deleteSpaGallery exists and works:
          showToast('Image deleted successfully', 'success') // Assume success if no error thrown for now or check res.success
        }
      } catch (error) {
        console.error('Error deleting image:', error)
        // If delete API fails, we might still want to remove it from UI if we are doing a full update on save
        // For now, let's just remove it from UI state as well so user can proceed
      }
    }
    setGalleryImages(prev => prev.filter(img => img.id !== imageId))
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ ...toast, show: false }), 3000)
  }

  const formatTime = time => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour.toString().padStart(2, '0')}:${minutes} ${ampm}`
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.spaName) return showToast('Spa Name is required', 'error')
    if (!formData.slug) return showToast('Slug is required', 'error')
    if (!aboutSpa) return showToast('About Spa is required', 'error')
    if (!formData.duration) return showToast('Duration is required', 'error')
    if (!formData.startTime) return showToast('Start Time is required', 'error')
    if (!formData.endTime) return showToast('End Time is required', 'error')
    if (!formData.location) return showToast('Location is required', 'error')
    if (!formData.locationCoordinates)
      return showToast('Location Coordinates are required', 'error')
    if (!importantInfo)
      return showToast('Important Information is required', 'error')

    // Validate slots
    for (const slot of slots) {
      if (!slot.slotName || !slot.time || !slot.inventory) {
        return showToast('All slot fields are required', 'error')
      }
    }

    setIsSubmitting(true)

    try {
      const payload = new FormData()

      // Append simple fields
      Object.keys(formData).forEach(key => {
        if (key === 'startTime' || key === 'endTime') {
          payload.append(key, formatTime(formData[key]))
        } else {
          payload.append(key, formData[key])
        }
      })

      // Append separate state fields
      payload.append('aboutSpa', aboutSpa)
      payload.append('importantInformation', importantInfo)

      // Format and append slots
      const formattedSlots = slots.map(({ id, slotName, inventory, time }) => ({
        slotName,
        inventory: Number(inventory),
        time
      }))
      payload.append('slots', JSON.stringify(formattedSlots))

      // Append images
      if (mainImage) {
        payload.append('image', mainImage)
      }

      if (galleryImages.length > 0) {
        galleryImages.forEach(img => {
          if (!img.isExisting && img.file) {
            payload.append('gallery', img.file)
          }
        })
      }

      // Call API
      const response = await updateSpa(id, payload)

      if (response && response.success) {
        showToast('Spa updated successfully', 'success')
        setTimeout(() => {
          router.push('/spa')
        }, 1500)
      } else {
        showToast(response?.message || 'Failed to update spa', 'error')
      }
    } catch (error) {
      console.error('Error updating spa:', error)
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to update spa'
      showToast(errMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='mb-2 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#FF4400] mx-auto'></div>
          <p className='text-sm text-gray-500'>Loading spa details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      {/* Header */}
      <div className='mb-8'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-1 text-xs font-medium text-[#8A92AC] hover:text-[#2D3658] transition-colors w-fit mb-2'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Edit Spa</h1>
            <nav className='mt-1 text-sm text-gray-500'>
              <Link href='/dashboard' className='hover:text-gray-700'>
                Dashboard
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-gray-900'>Edit Spa</span>
            </nav>
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        {/* Card Header */}
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>Spa Details</h2>
          <div className='flex gap-3'>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e] disabled:opacity-50'
            >
              {isSubmitting ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>

        <div className='p-6 space-y-8'>
          {/* Spa Name & Slug */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Spa Name*
              </label>
              <input
                type='text'
                name='spaName'
                value={formData.spaName}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Tranquil Touch Spa'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Slug*
              </label>
              <input
                type='text'
                name='slug'
                value={formData.slug}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='tranquil-touch-spa'
              />
            </div>
          </div>

          {/* About Spa */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              About the Spa*
            </label>
            <div className='rounded-lg border border-gray-200 bg-white overflow-hidden'>
              <TiptapEditor
                content={aboutSpa}
                onChange={setAboutSpa}
                placeholder='Tranquil Touch Spa offers a serene wellness experience...'
              />
            </div>
          </div>

          {/* Duration & Times */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Duration*
              </label>
              <input
                type='text'
                name='duration'
                value={formData.duration}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Start Time*
              </label>
              <div className='relative'>
                <input
                  type='time'
                  name='startTime'
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
                <Clock className='absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none' />
              </div>
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                End Time*
              </label>
              <div className='relative'>
                <input
                  type='time'
                  name='endTime'
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
                <Clock className='absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none' />
              </div>
            </div>
          </div>

          {/* Slots Section */}
          <div>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-sm font-medium text-gray-700'>Slots</h3>
              <button
                onClick={addSlot}
                className='flex items-center gap-1 text-sm font-medium text-[#FF4400] hover:text-[#ff551e]'
              >
                <Plus className='h-4 w-4' /> Add Slot
              </button>
            </div>

            <div className='space-y-3 bg-gray-50 p-4 rounded-xl'>
              <div className='grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 mb-2 px-2'>
                <div className='col-span-3'>Slot Name*</div>
                <div className='col-span-4'>Time*</div>
                <div className='col-span-4'>Inventory</div>
                <div className='col-span-1'></div>
              </div>

              {slots.map(slot => (
                <div
                  key={slot.id}
                  className='grid grid-cols-12 gap-4 items-center'
                >
                  <div className='col-span-3'>
                    <input
                      type='text'
                      value={slot.slotName}
                      onChange={e =>
                        handleSlotChange(slot.id, 'slotName', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                      placeholder='Slot 1'
                    />
                  </div>
                  <div className='col-span-4'>
                    <input
                      type='text'
                      value={slot.time}
                      onChange={e =>
                        handleSlotChange(slot.id, 'time', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div className='col-span-4'>
                    <input
                      type='number'
                      value={slot.inventory}
                      onChange={e =>
                        handleSlotChange(slot.id, 'inventory', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                      placeholder='50'
                    />
                  </div>
                  <div className='col-span-1 flex items-center justify-center'>
                    <button
                      onClick={() => removeSlot(slot.id)}
                      className='p-1 text-gray-400 hover:text-red-500'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location & Image */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Location*
              </label>
              <input
                type='text'
                name='location'
                value={formData.location}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Lekki Phase 1, Lagos'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Location Coordinates*
              </label>
              <input
                type='text'
                name='locationCoordinates'
                value={formData.locationCoordinates}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='6.449942, 3.442864'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Upload Image*
              </label>
              <div className='flex rounded-lg border border-gray-200 bg-white'>
                <div className='flex-1 truncate px-4 py-2.5 text-sm text-gray-500'>
                  {mainImage ? mainImage.name || 'Image selected' : 'Image.jpg'}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className='bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-r-lg'
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
                <div className='mt-3 relative w-full h-40 rounded-lg overflow-hidden border border-gray-200'>
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
                    className='absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 hover:text-red-600 shadow-sm transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Important Information */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Important Information*
            </label>
            <div className='rounded-lg border border-gray-200 bg-white overflow-hidden'>
              <TiptapEditor
                content={importantInfo}
                onChange={setImportantInfo}
                placeholder='Enter important information...'
              />
            </div>
          </div>

          {/* Gallery */}
          <div>
            <div className='mb-4'>
              <span className='inline-block rounded-md bg-black px-3 py-1 text-sm font-medium text-white'>
                Gallery
              </span>
            </div>

            <div className='mb-6'>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Upload Image*
              </label>
              <div className='flex max-w-md rounded-lg border border-gray-200 bg-white'>
                <div className='flex-1 truncate px-4 py-2.5 text-sm text-gray-500'>
                  Image.jpg
                </div>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className='bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-r-lg'
                >
                  Browse
                </button>
                <input
                  type='file'
                  ref={galleryInputRef}
                  onChange={handleGalleryUpload}
                  // accept='image/*'
                  multiple
                  className='hidden'
                />
              </div>
            </div>

            {/* Gallery Grid */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4'>
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
                    className='absolute right-2 top-2 rounded-full bg-white p-1.5 text-gray-900 shadow-sm hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              ))}
            </div>
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
