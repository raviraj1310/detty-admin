'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Trash2, Plus, ChevronLeft, Loader2 } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'
import {
  getFitnessEventById,
  updateFitnessEvent,
  getCertificateTemplate,
  getHostList
} from '@/services/fitness-event/fitness-event.service'

export default function EditFitnessEvent ({ id }) {
  const router = useRouter()
  const fileInputRef = useRef(null)

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    eventName: '',
    capacity: '',
    certificateTemplate: 'Fitness Bootcamp & Yoga',
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

  const [slots, setSlots] = useState([])

  const [mainImage, setMainImage] = useState(null)
  const [mainImageUrl, setMainImageUrl] = useState(null)

  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: ''
  })
  const [certificateTemplates, setCertificateTemplates] = useState([])
  const [hostList, setHostList] = useState([])

  const getImageUrl = path => {
    if (!path) return null
    if (path.startsWith('http')) return path

    const baseUrl =
      process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN ||
      process.env.NEXT_PUBLIC_API_BASE_URL

    if (!baseUrl) return path

    try {
      const { origin } = new URL(baseUrl)
      const cleanPath = path.startsWith('/') ? path.slice(1) : path
      return `${origin}/${cleanPath}`
    } catch {
      return path
    }
  }

  const to24h = s => {
    if (!s) return ''
    const match = s.match(`/^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i`)
    if (!match) return s
    let [_, h, m, ap] = match
    let hour = parseInt(h, 10)
    const isPM = ap.toUpperCase() === 'PM'
    if (isPM && hour !== 12) hour += 12
    if (!isPM && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${m}`
  }

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await getFitnessEventById(id)
        if (response?.success || response?.data?.success) {
          const data = response?.data?.data || response?.data || {}

          setFormData({
            eventName: data.fitnessEventName || '',
            capacity: data.participateCapacity || '',
            certificateTemplate: data.certificateTemplateId || '',
            duration: data.duration || '',
            startDate: data.startDate ? data.startDate.split('T')[0] : '',
            endDate: data.endDate ? data.endDate.split('T')[0] : '',
            startTime: to24h(data.startTime) || '',
            endTime: to24h(data.endTime) || '',
            hostedBy: data.hostedBy || '',
            location: data.location || '',
            locationCoordinates: data.locationCoordinates || ''
          })

          setAboutEvent(data.aboutEvent || '')
          setImportantInfo(data.importantInformation || '')

          // Handle Slots
          // API might return slots as 'slots' or 'fitnessEventSlots' or similar
          // Assuming structure based on previous mock data, but adapting to likely API response
          const fetchedSlots = data.fitnessEventSlots || data.slots || []

          // Map fetched slots to component state structure if needed
          const mappedSlots = fetchedSlots.map((slot, index) => ({
            id: slot._id || Date.now() + index,
            name: slot.slotName || slot.name || `Slot ${index + 1}`,
            date: slot.date ? slot.date.split('T')[0] : '',
            time: to24h(slot.time) || '',
            inventory: slot.inventory || '',
            price: slot.price || ''
          }))

          setSlots(
            mappedSlots.length > 0
              ? mappedSlots
              : [
                  {
                    id: Date.now(),
                    name: 'Slot 1',
                    date: '',
                    time: '',
                    inventory: '',
                    price: ''
                  }
                ]
          )

          if (data.image) {
            setMainImageUrl(getImageUrl(data.image))
          }
        } else {
          showToast('Failed to fetch event details', 'error')
        }
      } catch (error) {
        console.error('Error fetching event:', error)
        showToast('Error fetching event details', 'error')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
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
      setMainImage(file)
      setMainImageUrl(URL.createObjectURL(file))
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
    if (!formData.hostedBy) return showToast('Hosted By is required', 'error')

    setSaving(true)
    try {
      const payload = new FormData()

      const formatTime = timeStr => {
        if (!timeStr) return ''
        const [hours, minutes] = timeStr.split(':')
        const h = parseInt(hours, 10)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const h12 = h % 12 || 12
        return `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`
      }

      payload.append('fitnessEventName', formData.eventName)
      payload.append('participateCapacity', formData.capacity)
      if (formData.certificateTemplate) {
        payload.append('certificateTemplateId', formData.certificateTemplate)
      }
      payload.append('aboutEvent', aboutEvent)
      payload.append('duration', formData.duration)
      payload.append('startDate', formData.startDate)
      payload.append('endDate', formData.endDate)
      payload.append('startTime', formatTime(formData.startTime))
      payload.append('endTime', formatTime(formData.endTime))
      payload.append('hostedBy', formData.hostedBy)
      payload.append('location', formData.location)
      payload.append('locationCoordinates', formData.locationCoordinates)
      payload.append('importantInformation', importantInfo)
      payload.append('status', 'true')

      const formattedSlots = slots.map(slot => ({
        slotName: slot.name,
        date: slot.date,
        time: formatTime(slot.time),
        inventory: Number(slot.inventory),
        price: Number(String(slot.price).replace(/,/g, ''))
      }))
      payload.append('slots', JSON.stringify(formattedSlots))

      // Append Image
      if (mainImage) {
        payload.append('image', mainImage)
      }

      const response = await updateFitnessEvent(id, payload)

      if (response?.success || response?.data?.success) {
        showToast('Event updated successfully', 'success')
        // Optional: refresh or redirect
        // router.push('/fitness-events')
      } else {
        showToast(
          response?.message ||
            response?.data?.message ||
            'Failed to update event',
          'error'
        )
      }
    } catch (error) {
      console.error('Update error:', error)
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'An error occurred while updating'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({
      open: true,
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type
    })
  }

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#FF4400]' />
      </div>
    )
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
              Edit Fitness Events
            </h1>
            <nav className='mt-1 text-sm text-gray-500'>
              <Link href='/dashboard' className='hover:text-gray-700'>
                Dashboard
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-gray-900'>Edit Fitness Events</span>
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
              disabled={saving}
              className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e] disabled:opacity-50 flex items-center gap-2'
            >
              {saving && <Loader2 className='h-4 w-4 animate-spin' />}
              {saving ? 'Updating...' : 'Update'}
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
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                  className='w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#FF4400] focus:outline-none'
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
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Hosted By*
              </label>
              <div className='relative'>
                <select
                  name='hostedBy'
                  value={formData.hostedBy}
                  onChange={handleInputChange}
                  className='w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-[#FF4400] focus:outline-none'
                >
                  <option value=''>Select Host</option>
                  {hostList.map(host => (
                    <option key={host._id} value={host._id}>
                      {host.name}
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

          {/* Location */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Location Coordinates
              </label>
              <input
                type='text'
                name='locationCoordinates'
                value={formData.locationCoordinates}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
              />
            </div>
          </div>

          {/* Important Info */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Important Info*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={importantInfo}
                onChange={setImportantInfo}
                placeholder='Enter important info...'
              />
            </div>
          </div>

          {/* Main Image */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Main Image
            </label>
            <div className='flex items-center gap-4'>
              <div
                onClick={() => fileInputRef.current?.click()}
                className='flex h-32 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100'
              >
                {mainImageUrl ? (
                  <img
                    src={mainImageUrl}
                    alt='Preview'
                    className='h-full w-full rounded-lg object-cover'
                  />
                ) : (
                  <div className='text-center'>
                    <Plus className='mx-auto h-6 w-6 text-gray-400' />
                    <span className='mt-1 block text-xs text-gray-500'>
                      Upload
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleMainImageChange}
                className='hidden'
              />
            </div>
          </div>

          {/* Slots Section */}
          <div>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900'>Slots</h3>
              <button
                onClick={addSlot}
                className='flex items-center gap-2 text-sm font-medium text-[#FF4400] hover:text-[#E63E00]'
              >
                <Plus className='h-4 w-4' /> Add Slot
              </button>
            </div>
            <div className='space-y-4'>
              {slots.map((slot, index) => (
                <div
                  key={slot.id}
                  className='relative grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-5'
                >
                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-500'>
                      Name
                    </label>
                    <input
                      type='text'
                      value={slot.name}
                      onChange={e =>
                        handleSlotChange(slot.id, 'name', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-500'>
                      Date
                    </label>
                    <input
                      type='date'
                      value={slot.date}
                      onChange={e =>
                        handleSlotChange(slot.id, 'date', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-500'>
                      Time
                    </label>
                    <input
                      type='time'
                      value={slot.time}
                      onChange={e =>
                        handleSlotChange(slot.id, 'time', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-500'>
                      Inventory
                    </label>
                    <input
                      type='number'
                      value={slot.inventory}
                      onChange={e =>
                        handleSlotChange(slot.id, 'inventory', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-500'>
                      Price
                    </label>
                    <div className='flex items-center gap-2'>
                      <input
                        type='number'
                        value={slot.price}
                        onChange={e =>
                          handleSlotChange(slot.id, 'price', e.target.value)
                        }
                        className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none'
                      />
                      {slots.length > 1 && (
                        <button
                          onClick={() => removeSlot(slot.id)}
                          className='rounded-lg p-2 text-red-500 hover:bg-red-50'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
