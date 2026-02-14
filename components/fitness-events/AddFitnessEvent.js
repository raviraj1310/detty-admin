'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Trash2, Plus, ChevronLeft, Loader2 } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'
import {
  createFitnessEvent,
  getCertificateTemplate,
  getHostList
} from '@/services/fitness-event/fitness-event.service'

export default function AddFitnessEvent () {
  const router = useRouter()
  const fileInputRef = useRef(null)

  // State
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    eventName: '',
    capacity: '',
    certificateTemplate: '',
    duration: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    hostedBy: '',
    location: '',
    locationCoordinates: ''
  })

  const [aboutEvent, setAboutEvent] = useState('')
  const [importantInfo, setImportantInfo] = useState('')

  const [slots, setSlots] = useState([
    {
      id: Date.now(),
      name: '',
      date: '',
      time: ' ',
      inventory: '',
      price: ''
    }
  ])

  const [mainImage, setMainImage] = useState(null)
  const [mainImageUrl, setMainImageUrl] = useState('')
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)
  const [imageMeta, setImageMeta] = useState({
    width: 0,
    height: 0,
    sizeBytes: 0,
    originalSizeBytes: 0,
    format: ''
  })

  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: ''
  })
  const [certificateTemplates, setCertificateTemplates] = useState([])
  const [hostList, setHostList] = useState([])

  // Handlers
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await getCertificateTemplate()
        if (response?.success || response?.data?.success) {
          setCertificateTemplates(response?.data?.data || response?.data)
        }
      } catch (error) {
        console.error('Failed to fetch certificate templates:', error)
        showToast('Failed to fetch certificate templates', 'error')
      }
    }

    const fetchHosts = async () => {
      try {
        const response = await getHostList()
        if (response?.success) {
          setHostList(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch host list:', error)
        showToast('Failed to fetch host list', 'error')
      }
    }

    fetchTemplates()
    fetchHosts()
  }, [])

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
        name: `Slot ${slots.length + 1}`,
        date: '',
        time: '',
        inventory: '',
        price: ''
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

  const handleCropped = ({ file, meta }) => {
    setMainImage(file)
    setMainImageUrl(URL.createObjectURL(file))
    setImageMeta(meta)
  }

  const openCropperFromPreview = () => {
    if (mainImage) {
      setRawImageFile(mainImage)
      setCropOpen(true)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.eventName) return showToast('Event Name is required', 'error')
    if (!aboutEvent) return showToast('About Event is required', 'error')
    if (!formData.startDate || !formData.endDate)
      return showToast('Dates are required', 'error')
    if (!formData.capacity)
      return showToast('Participate Capacity is required', 'error')
    if (!formData.location) return showToast('Location is required', 'error')
    if (!formData.locationCoordinates)
      return showToast('Coordinates are required', 'error')
    if (!formData.hostedBy) return showToast('Hosted By is required', 'error')
    if (!mainImage) return showToast('Image is required', 'error')

    setLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('fitnessEventName', formData.eventName)
      formDataToSend.append('participateCapacity', formData.capacity)
      if (formData.certificateTemplate) {
        formDataToSend.append(
          'certificateTemplateId',
          formData.certificateTemplate
        )
      }
      formDataToSend.append('aboutEvent', aboutEvent)
      formDataToSend.append('duration', formData.duration)
      formDataToSend.append('startDate', formData.startDate)
      formDataToSend.append('endDate', formData.endDate)

      // Format time to 12-hour format with AM/PM
      const formatTime = timeStr => {
        if (!timeStr) return ''
        const [hours, minutes] = timeStr.split(':')
        const h = parseInt(hours, 10)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const h12 = h % 12 || 12
        return `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`
      }

      formDataToSend.append('startTime', formatTime(formData.startTime))
      formDataToSend.append('endTime', formatTime(formData.endTime))
      formDataToSend.append('hostedBy', formData.hostedBy)
      formDataToSend.append('location', formData.location)
      formDataToSend.append('locationCoordinates', formData.locationCoordinates)
      formDataToSend.append('importantInformation', importantInfo)
      formDataToSend.append('status', 'true')

      // Slots
      const formattedSlots = slots.map(slot => ({
        slotName: slot.name,
        date: slot.date,
        time: formatTime(slot.time),
        inventory: Number(slot.inventory),
        price: Number(slot.price.toString().replace(/,/g, ''))
      }))

      formDataToSend.append('slots', JSON.stringify(formattedSlots))
      formDataToSend.append('image', mainImage)

      const response = await createFitnessEvent(formDataToSend)

      if (response?.success || response?.data?.success) {
        showToast('Event added successfully', 'success')
        setTimeout(() => {
          router.push('/fitness-events')
        }, 1500)
      } else {
        showToast(
          response?.message ||
            response?.data?.message ||
            'Failed to create event',
          'error'
        )
      }
    } catch (error) {
      console.error('Submit error:', error)
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'An error occurred while creating the event'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type) => {
    setToast({
      open: true,
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type
    })
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <Toast
        open={toast.open}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        onOpenChange={open => setToast(prev => ({ ...prev, open }))}
      />

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
            <h1 className='text-2xl font-bold text-gray-900'>
              Add New Fitness Events
            </h1>
            <nav className='mt-1 text-sm text-gray-500'>
              <Link href='/dashboard' className='hover:text-gray-700'>
                Dashboard
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-gray-900'>Add New Fitness Events</span>
            </nav>
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        {/* Card Header */}
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Fitness Events Details
          </h2>
          <div className='flex gap-3'>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className='flex items-center gap-2 rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e] disabled:opacity-70 disabled:cursor-not-allowed'
            >
              {loading && <Loader2 className='h-4 w-4 animate-spin' />}
              {loading ? 'Creating...' : 'Add'}
            </button>
          </div>
        </div>

        <div className='p-6 space-y-8'>
          {/* Top Row: Name, Capacity, Certificate */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Fitness Events Name*
              </label>
              <input
                type='text'
                name='eventName'
                value={formData.eventName}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Fitness Bootcamp & Yoga'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Participate Capacity
              </label>
              <input
                type='number'
                name='capacity'
                value={formData.capacity}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='10'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Certificate Template
              </label>
              <div className='relative'>
                <select
                  name='certificateTemplate'
                  value={formData.certificateTemplate}
                  onChange={handleInputChange}
                  className='w-full appearance-none  rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#FF4400] focus:outline-none text-gray-900'
                >
                  <option value=''>Select Template</option>
                  {certificateTemplates.map(template => (
                    <option key={template._id} value={template._id}>
                      {template.certificateName}
                    </option>
                  ))}
                </select>
                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500'>
                  <svg className='h-4 w-4 fill-current' viewBox='0 0 20 20'>
                    <path d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* About Event */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              About Event*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={aboutEvent}
                onChange={setAboutEvent}
                placeholder='Enter event description...'
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
                className='w-full rounded-lg border border-gray-200 text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                  className='w-full rounded-lg border border-gray-200 text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                  className='w-full rounded-lg border border-gray-200 text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
              </div>
            </div>
          </div>

          {/* Times & Hosted By */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
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
                  className='w-full rounded-lg border border-gray-200 text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                  className='w-full rounded-lg border border-gray-200 text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
                <Clock className='absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none' />
              </div>
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Hosted By*
              </label>
              <div className='relative'>
                <select
                  name='hostedBy'
                  value={formData.hostedBy}
                  onChange={handleInputChange}
                  className='w-full appearance-none rounded-lg border border-gray-200 text-gray-900 bg-white px-4 py-2.5 text-sm focus:border-[#FF4400] focus:outline-none'
                >
                  <option value=''>Select Host</option>
                  {hostList.map(host => (
                    <option key={host._id} value={host._id}>
                      {host.hostName}
                    </option>
                  ))}
                </select>
                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500'>
                  <svg className='h-4 w-4 fill-current' viewBox='0 0 20 20'>
                    <path d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' />
                  </svg>
                </div>
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
                      type='text'
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
                className='w-full rounded-lg border border-gray-200 text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                className='w-full rounded-lg border border-gray-200 text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='6.449942, 3.442864'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Upload Image*
              </label>
              <div className='flex rounded-lg border border-gray-200 bg-white'>
                <div className='flex-1 truncate px-4 py-2.5 text-sm text-gray-500'>
                  {mainImage ? mainImage.name : 'Image.jpg'}
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
              <span className='text-xs text-[#B0B7D0] block mt-1'>
                Accepted: JPG, JPEG, PNG, HEIC, GIF (auto-converted to WebP)
              </span>
              {mainImageUrl && (
                <div className='mt-3 relative w-full h-40 rounded-lg overflow-hidden border border-gray-200'>
                  <img
                    src={mainImageUrl}
                    alt='Preview'
                    className='w-full h-full object-cover cursor-pointer'
                    onClick={openCropperFromPreview}
                  />
                  <div className='absolute top-2 right-2 flex gap-2'>
                    <button
                      onClick={openCropperFromPreview}
                      className='bg-white/90 p-1.5 rounded-full text-[#FF4400] hover:text-[#ff551e] shadow-sm transition-colors'
                      title='Crop Image'
                    >
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      >
                        <path d='M6 2v14a2 2 0 0 0 2 2h14' />
                        <path d='M18 22V8a2 2 0 0 0-2-2H2' />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setMainImage(null)
                        setMainImageUrl('')
                        setImageMeta({
                          width: 0,
                          height: 0,
                          sizeBytes: 0,
                          originalSizeBytes: 0,
                          format: ''
                        })
                        if (fileInputRef.current)
                          fileInputRef.current.value = ''
                      }}
                      className='bg-white/90 p-1.5 rounded-full text-red-500 hover:text-red-600 shadow-sm transition-colors'
                      title='Remove Image'
                    >
                      <Trash2 className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              )}
              {mainImage && (
                <div className='text-xs text-[#5E6582] mt-2 flex flex-wrap gap-3'>
                  <span>
                    Dimensions: {imageMeta.width} × {imageMeta.height}
                  </span>
                  <span>
                    Size: {(imageMeta.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                  <span>Format: {imageMeta.format}</span>
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
        </div>
      </div>

      <ImageCropper
        open={cropOpen}
        file={rawImageFile}
        onClose={() => setCropOpen(false)}
        onCropped={handleCropped}
      />
    </div>
  )
}
