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
  updateGym,
  getGymById,
  getGymHostList,
  deleteGymGallery
} from '@/services/v2/gym/gym.service'

const getGymImageUrl = imagePath => {
  if (!imagePath) return null
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

export default function GymAccessEdit () {
  const router = useRouter()
  const params = useParams()
  const { gymId } = params
  const id = gymId // Map gymId to id for existing logic
  const fileInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  // State
  const [formData, setFormData] = useState({
    gymName: '',
    hostedBy: '',
    duration: '1-3 hours (based on selected access or activation)',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    locationCoordinates: ''
  })

  const [hosts, setHosts] = useState([])
  const [aboutPlace, setAboutPlace] = useState('')
  const [importantInfo, setImportantInfo] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [slots, setSlots] = useState([
    { id: 1, name: '', date: '', time: '', inventory: '', price: '' }
  ])

  const [mainImage, setMainImage] = useState(null)
  const [mainImageUrl, setMainImageUrl] = useState('')
  const [galleryImages, setGalleryImages] = useState([])

  // Track deleted existing images if needed, or just handle current view
  // For now we will just display existing and allow adding new.
  // Deleting existing images might require backend support not visible here.

  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch Hosts
        const hostsResponse = await getGymHostList()
        if (hostsResponse?.success) {
          setHosts(hostsResponse.data || [])
        }

        // Fetch Gym Details
        if (id) {
          const gymResponse = await getGymById(id)
          const gym = gymResponse.data || gymResponse

          // Populate form
          setFormData({
            gymName: gym.gymName || '',
            hostedBy: gym.hostId || gym.hostedBy || '', // Adjust based on API response
            duration: gym.duration || '',
            startDate: gym.startDate
              ? new Date(gym.startDate).toISOString().split('T')[0]
              : '',
            endDate: gym.endDate
              ? new Date(gym.endDate).toISOString().split('T')[0]
              : '',
            startTime: gym.startTime || '',
            endTime: gym.endTime || '',
            location: gym.location || '',
            locationCoordinates: gym.locationCoordinates || ''
          })

          setAboutPlace(gym.aboutPlace || '')
          setImportantInfo(gym.importantInformation || '')

          // Populate slots
          if (gym.gymSlots && gym.gymSlots.length > 0) {
            setSlots(
              gym.gymSlots.map((s, index) => ({
                id: s._id || Date.now() + index,
                name: s.slotName || '',
                date: s.date
                  ? new Date(s.date).toISOString().split('T')[0]
                  : '',
                time: s.time || '',
                inventory: s.inventory || '',
                price: s.price || ''
              }))
            )
          }

          // Populate images
          if (gym.image) {
            setMainImageUrl(getGymImageUrl(gym.image))
          }

          if (gym.imageGallery && Array.isArray(gym.imageGallery)) {
            setGalleryImages(
              gym.imageGallery.map((item, index) => ({
                id: item._id || 'existing-' + index,
                url: getGymImageUrl(item.image),
                isExisting: true
              }))
            )
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        showToast('Failed to load gym details', 'error')
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
      { id: Date.now(), name: '', date: '', time: '', inventory: '', price: '' }
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
        await deleteGymGallery(imageId)
        showToast('Image deleted successfully', 'success')
      } catch (error) {
        console.error('Error deleting image:', error)
        showToast('Failed to delete image', 'error')
        return
      }
    }
    setGalleryImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.gymName) return showToast('Gym Name is required', 'error')
    if (!aboutPlace) return showToast('About Place is required', 'error')
    // if (!formData.startDate || !formData.endDate)
    //   return showToast('Dates are required', 'error')
    // validation can be looser for edit if needed, but keeping same for consistency

    try {
      const payload = new FormData()

      // Append simple fields from formData
      Object.keys(formData).forEach(key => {
        if (key === 'hostedBy') {
          if (formData[key]) payload.append('hostedBy', formData[key])
        } else {
          payload.append(key, formData[key])
        }
      })

      // Append separate state fields
      payload.append('aboutPlace', aboutPlace)
      payload.append('importantInformation', importantInfo)
      // payload.append('status', true) // Maybe don't reset status on edit
      payload.append('slots', 'placeholder')

      // Format and append gymSlots
      const formattedSlots = slots.map(
        ({ id, name, inventory, price, ...rest }) => ({
          slotName: name,
          inventory: Number(inventory),
          price: Number(price),
          ...rest
        })
      )
      payload.append('gymSlots', JSON.stringify(formattedSlots))

      // Append images
      if (mainImage) {
        payload.append('image', mainImage)
      }

      if (galleryImages.length > 0) {
        galleryImages.forEach(img => {
          if (!img.isExisting && img.file) {
            payload.append('imageGallery', img.file)
          }
        })
      }

      // Call API
      await updateGym(id, payload)

      showToast('Gym updated successfully', 'success')

      setTimeout(() => {
        router.push('/gym')
      }, 1500)
    } catch (error) {
      console.error('Error updating gym:', error)
      showToast(error.message || 'Failed to update gym', 'error')
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ ...toast, show: false }), 3000)
  }

  if (isLoading) {
    return <div className='p-8 text-center'>Loading...</div>
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
            <h1 className='text-2xl font-bold text-gray-900'>Edit Gym</h1>
            <nav className='mt-1 text-sm text-gray-500'>
              <Link href='/dashboard' className='hover:text-gray-700'>
                Dashboard
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-gray-900'>Edit Gym</span>
            </nav>
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        {/* Card Header */}
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>Gym Details</h2>
          <div className='flex gap-3'>
            <button
              onClick={handleSubmit}
              className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e]'
            >
              Update
            </button>
          </div>
        </div>

        <div className='p-6 space-y-8'>
          {/* Gym Name & Hosted By */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Gym Name*
              </label>
              <input
                type='text'
                name='gymName'
                value={formData.gymName}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Elevate Fitness Club'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Hosted By
              </label>
              <select
                name='hostedBy'
                value={formData.hostedBy}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
              >
                <option value=''>Select Host</option>
                {hosts.map(host => (
                  <option key={host._id} value={host._id}>
                    {host.name ||
                      host.firstName + ' ' + host.lastName ||
                      host.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* About Place */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              About Place*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={aboutPlace}
                onChange={setAboutPlace}
                placeholder='Enter description...'
              />
            </div>
          </div>

          {/* Duration & Dates */}
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
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Start Date*
              </label>
              <div className='relative'>
                <input
                  type='date'
                  name='startDate'
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
              </div>
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                End Date*
              </label>
              <div className='relative'>
                <input
                  type='date'
                  name='endDate'
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
              </div>
            </div>
          </div>

          {/* Times */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
                  className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                  className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                <div className='col-span-3'>Date*</div>
                <div className='col-span-2'>Time*</div>
                <div className='col-span-2'>Inventory</div>
                <div className='col-span-2'>Price</div>
              </div>

              {slots.map(slot => (
                <div
                  key={slot.id}
                  className='grid grid-cols-12 gap-4 items-center'
                >
                  <div className='col-span-3'>
                    <input
                      type='text'
                      value={slot.name}
                      onChange={e =>
                        handleSlotChange(slot.id, 'name', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                      placeholder='Slot 1'
                    />
                  </div>
                  <div className='col-span-3'>
                    <input
                      type='date'
                      value={slot.date}
                      onChange={e =>
                        handleSlotChange(slot.id, 'date', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div className='col-span-2'>
                    <input
                      type='time'
                      value={slot.time}
                      onChange={e =>
                        handleSlotChange(slot.id, 'time', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div className='col-span-2'>
                    <input
                      type='number'
                      value={slot.inventory}
                      onChange={e =>
                        handleSlotChange(slot.id, 'inventory', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                      placeholder='50'
                    />
                  </div>
                  <div className='col-span-2 flex items-center gap-2'>
                    <input
                      type='number'
                      value={slot.price}
                      onChange={e =>
                        handleSlotChange(slot.id, 'price', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                      placeholder='₦10,000'
                    />
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
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
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
                  accept='image/*'
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
        isOpen={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        message={toast.message}
        type={toast.type}
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
