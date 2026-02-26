'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Trash2, Plus, ChevronLeft, Loader2 } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'

import {
  getPersonalTrainerById,
  updatePersonalTrainer,
  getTrainerHostList
} from '@/services/v2/personal-trainer/personal-trainer.service'

const toImageSrc = u => {
  const s = String(u || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
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
  return base ? `${base}/upload/image/${path}` : `/upload/image/${path}`
}

export default function EditPersonalTrainer ({ id }) {
  const router = useRouter()
  const fileInputRef = useRef(null)

  // State
  const [formData, setFormData] = useState({
    trainerName: '',
    hostedBy: '',
    duration: '',
    startTime: '',
    endTime: '',
    location: '',
    locationCoordinates: ''
  })

  const [hosts, setHosts] = useState([])
  const [aboutTrainer, setAboutTrainer] = useState('')
  const [trainingTypes, setTrainingTypes] = useState('')
  const [importantInfo, setImportantInfo] = useState('')

  const [slots, setSlots] = useState([])

  const [mainImage, setMainImage] = useState(null)
  const [mainImageUrl, setMainImageUrl] = useState('')

  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch hosts and trainer data in parallel
        const [hostsResponse, trainerResponse] = await Promise.all([
          getTrainerHostList(),
          getPersonalTrainerById(id)
        ])

        if (hostsResponse?.success) {
          setHosts(hostsResponse.data || [])
        }

        if (trainerResponse?.success && trainerResponse.data) {
          const trainer = trainerResponse.data

          setFormData({
            trainerName: trainer.trainerName || '',
            hostedBy: trainer.hostedBy || '',
            duration: trainer.duration || '',
            startTime: trainer.startTime || '',
            endTime: trainer.endTime || '',
            location: trainer.location || '',
            locationCoordinates: trainer.locationCoordinates || ''
          })

          setAboutTrainer(trainer.aboutTrainer || '')
          setTrainingTypes(trainer.trainingTypesAvailable || '')
          setImportantInfo(trainer.importantInformation || '')

          if (trainer.image) {
            setMainImageUrl(toImageSrc(trainer.image))
          }

          if (
            trainer.personalTrainerSlots &&
            Array.isArray(trainer.personalTrainerSlots)
          ) {
            setSlots(
              trainer.personalTrainerSlots.map((slot, index) => ({
                id: slot._id || Date.now() + index,
                name: slot.slotName || '',
                time: slot.time || '',
                inventory: slot.inventory || ''
              }))
            )
          } else if (
            trainer.personalTrainerSlots &&
            typeof trainer.personalTrainerSlots === 'string'
          ) {
            // Handle case where it might be returned as string (unlikely but safe)
            try {
              const parsed = JSON.parse(trainer.personalTrainerSlots)
              setSlots(
                parsed.map((slot, index) => ({
                  id: slot._id || Date.now() + index,
                  name: slot.slotName || '',
                  time: slot.time || '',
                  inventory: slot.inventory || ''
                }))
              )
            } catch (e) {
              console.error('Error parsing slots', e)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        showToast('Failed to fetch trainer details', 'error')
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
        time: '',
        inventory: ''
      }
    ])
  }

  const removeSlot = id => {
    // For existing items, we might want to track deletions, but simple removal from array
    // and sending full array on update usually works if backend replaces the list.
    // Assuming backend replaces the list for now.
    setSlots(slots.filter(slot => slot.id !== id))
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
    if (!formData.trainerName)
      return showToast('Trainer Name is required', 'error')
    if (!formData.hostedBy) return showToast('Host is required', 'error')
    if (!aboutTrainer) return showToast('About Trainer is required', 'error')
    if (!trainingTypes) return showToast('Training Types are required', 'error')
    // Dates removed; no need to validate

    // Image is required only if creating, but for edit it's optional if one exists.
    // However, if no image url and no new image, then it's an error.
    if (!mainImage && !mainImageUrl)
      return showToast('Trainer image is required', 'error')

    try {
      const payload = new FormData()

      // Append simple fields
      Object.keys(formData).forEach(key => {
        if (key === 'hostedBy') {
          if (formData[key]) payload.append('hostedBy', formData[key])
        } else {
          payload.append(key, formData[key])
        }
      })

      // Append separate state fields
      payload.append('aboutTrainer', aboutTrainer)
      payload.append('trainingTypesAvailable', trainingTypes)
      payload.append('importantInformation', importantInfo)

      // Format and append slots
      const formattedSlots = slots.map(({ id, name, inventory, ...rest }) => ({
        slotName: name,
        inventory: Number(inventory),
        ...rest
      }))
      payload.append('personalTrainerSlots', JSON.stringify(formattedSlots))

      // Append image only if changed
      if (mainImage) {
        payload.append('image', mainImage)
      }

      const response = await updatePersonalTrainer(id, payload)
      if (response && response.success) {
        showToast('Trainer updated successfully', 'success')
        setTimeout(() => {
          router.push('/personal-trainer')
        }, 1500)
      } else {
        showToast(response?.message || 'Failed to update trainer', 'error')
      }
    } catch (error) {
      console.error('Error updating trainer:', error)
      showToast('Failed to update trainer', 'error')
    }
  }

  const showToast = (message, type) => {
    setToast({
      open: true,
      title:
        type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info',
      description: message,
      variant: type
    })
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='flex items-center gap-2 text-gray-500'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Loading trainer details...</span>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
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
            <h1 className='text-2xl font-bold text-gray-900'>Edit Trainer</h1>
            <nav className='mt-1 text-sm text-gray-500'>
              <Link href='/dashboard' className='hover:text-gray-700'>
                Dashboard
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-gray-900'>Edit Trainer</span>
            </nav>
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        {/* Card Header */}
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Trainer Details
          </h2>
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
          {/* Trainer Name */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Trainer Name*
            </label>
            <input
              type='text'
              name='trainerName'
              value={formData.trainerName}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
              placeholder='Tunde Adeyemi'
            />
          </div>

          {/* Hosted By */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Hosted By*
            </label>
            <select
              name='hostedBy'
              value={formData.hostedBy}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:border-[#FF4400] focus:outline-none'
            >
              <option value=''>Select Host</option>
              {hosts.map(host => (
                <option key={host._id} value={host._id}>
                  {host.name}
                </option>
              ))}
            </select>
          </div>

          {/* About Trainer */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              About Trainer*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={aboutTrainer}
                onChange={setAboutTrainer}
                placeholder='Enter trainer description...'
              />
            </div>
          </div>

          {/* Training Types Available */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Training Types Available*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={trainingTypes}
                onChange={setTrainingTypes}
                placeholder='Enter training types...'
              />
            </div>
          </div>

          {/* Duration */}
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
                <div className='col-span-5'>Slot Name*</div>
                <div className='col-span-3'>Time*</div>
                <div className='col-span-3'>Inventory</div>
                <div className='col-span-1'></div>
              </div>

              {slots.map(slot => (
                <div
                  key={slot.id}
                  className='grid grid-cols-12 gap-4 items-center'
                >
                  <div className='col-span-5'>
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
                      type='time'
                      value={slot.time}
                      onChange={e =>
                        handleSlotChange(slot.id, 'time', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div className='col-span-3'>
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
        </div>
      </div>
    </div>
  )
}
