'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Trash2, Plus, ChevronLeft, X } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'

export default function EditTeamBondingRetreat() {
  const router = useRouter()
  const fileInputRef = useRef(null)

  // State
  const [formData, setFormData] = useState({
    retreatName: 'Outdoor Team Challenge',
    duration: '3 hours',
    startDate: '2025-06-12',
    endDate: '2025-06-12',
    startTime: '10:00',
    endTime: '13:00',
    location: 'Lekki Conservation Centre',
    locationCoordinates: '6.441158, 3.537678'
  })

  const [aboutRetreat, setAboutRetreat] = useState('<p>An exciting outdoor challenge designed to build trust and collaboration among team members through various obstacle courses and problem-solving activities.</p>')
  const [trainingTypes, setTrainingTypes] = useState('<ul><li>Obstacle Course</li><li>Trust Fall</li><li>Relay Race</li></ul>')
  const [importantInfo, setImportantInfo] = useState('<p>Please wear comfortable sportswear and running shoes. Water and snacks will be provided.</p>')

  const [slots, setSlots] = useState([
    { id: 1, name: 'Morning Slot', date: '2025-06-12', time: '10:00', inventory: '20', price: '15000' },
    { id: 2, name: 'Afternoon Slot', date: '2025-06-12', time: '14:00', inventory: '20', price: '15000' }
  ])

  const [mainImage, setMainImage] = useState(null)
  const [mainImageUrl, setMainImageUrl] = useState('/images/dashboard/image-1.webp') // Placeholder

  const [toast, setToast] = useState({ show: false, message: '', type: '' })

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
    if (!formData.retreatName)
      return showToast('Retreat Name is required', 'error')
    if (!aboutRetreat) return showToast('About Retreat is required', 'error')
    if (!trainingTypes) return showToast('Training Types are required', 'error')
    if (!formData.startDate || !formData.endDate)
      return showToast('Dates are required', 'error')
    
    // Mock Submit
    console.log({
      ...formData,
      aboutRetreat,
      trainingTypes,
      importantInfo,
      slots,
      mainImage
    })

    showToast('Retreat updated successfully', 'success')
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ ...toast, show: false }), 3000)
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
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
              Edit Team Bonding Retreat
            </h1>
            <nav className='mt-1 text-sm text-gray-500'>
              <Link href='/dashboard' className='hover:text-gray-700'>
                Dashboard
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-gray-900'>
                Edit Team Bonding Retreat
              </span>
            </nav>
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        {/* Card Header */}
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Team Bonding Retreat Details
          </h2>
          <div className='flex gap-3'>
            <button
              onClick={handleSubmit}
              className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e]'
            >
              Save Changes
            </button>
          </div>
        </div>

        <div className='p-6 space-y-8'>
          {/* Retreat Name */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Team Bonding Retreat Name*
            </label>
            <input
              type='text'
              name='retreatName'
              value={formData.retreatName}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
              placeholder='Outdoor Team Challenge'
            />
          </div>

          {/* About Retreat */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              About Team Bonding Retreat*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={aboutRetreat}
                onChange={setAboutRetreat}
                placeholder='Enter retreat description...'
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
                  {mainImage ? mainImage.name : 'image-1.webp'}
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
