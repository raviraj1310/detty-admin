'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock,
  Trash2,
  Plus,
  ChevronLeft,
  Loader2,
  Calendar
} from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'
import {
  createWeightManagementEvent,
  getAllCertificates
} from '@/services/weight-management-event/weight-management-event.service'
import { getGymHostList } from '@/services/v2/gym/gym.service'

const slugify = value =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function WeightManagementEventAdd () {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [certificatesLoading, setCertificatesLoading] = useState(false)
  const [certificates, setCertificates] = useState([])
  const [hostsLoading, setHostsLoading] = useState(false)
  const [hosts, setHosts] = useState([])
  const [formData, setFormData] = useState({
    eventName: '',
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
      name: 'Slot 1',
      date: '',
      time: '',
      inventory: '',
      price: ''
    }
  ])

  const [mainImage, setMainImage] = useState(null)
  const [mainImageUrl, setMainImageUrl] = useState('')
  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)

  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  const showToast = (message, type = 'success') => {
    setToast({
      open: true,
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type
    })
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  useEffect(() => {
    const fetchCertificates = async () => {
      setCertificatesLoading(true)
      try {
        const res = await getAllCertificates()
        if (!res?.success) {
          showToast(res?.message || 'Failed to fetch certificates', 'error')
          setCertificates([])
          return
        }
        const list = Array.isArray(res?.data) ? res.data : []
        const activeList = list.filter(c => c?.status !== false)
        setCertificates(activeList)

        // If currently selected certificate no longer exists, clear it
        setFormData(prev => {
          if (!prev.certificateTemplate) return prev
          const exists = activeList.some(
            c => String(c?._id) === String(prev.certificateTemplate)
          )
          return exists ? prev : { ...prev, certificateTemplate: '' }
        })
      } catch (err) {
        showToast(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to fetch certificates',
          'error'
        )
        setCertificates([])
      } finally {
        setCertificatesLoading(false)
      }
    }
    fetchCertificates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchHosts = async () => {
      setHostsLoading(true)
      try {
        const res = await getGymHostList()
        if (!res?.success) {
          showToast(res?.message || 'Failed to fetch host list', 'error')
          setHosts([])
          return
        }
        const list = Array.isArray(res?.data) ? res.data : []
        const activeList = list.filter(h => h?.status !== false)
        setHosts(activeList)

        setFormData(prev => {
          if (!prev.hostedBy) return prev
          const exists = activeList.some(
            h => String(h?._id) === String(prev.hostedBy)
          )
          return exists ? prev : { ...prev, hostedBy: '' }
        })
      } catch (err) {
        showToast(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to fetch host list',
          'error'
        )
        setHosts([])
      } finally {
        setHostsLoading(false)
      }
    }
    fetchHosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSlotChange = (id, field, value) => {
    setSlots(prev =>
      prev.map(slot => (slot.id === id ? { ...slot, [field]: value } : slot))
    )
  }

  const addSlot = () => {
    setSlots(prev => [
      ...prev,
      {
        id: Date.now(),
        name: `Slot ${prev.length + 1}`,
        date: '',
        time: '',
        inventory: '',
        price: ''
      }
    ])
  }

  const removeSlot = id => {
    if (slots.length > 1) {
      setSlots(prev => prev.filter(slot => slot.id !== id))
    }
  }

  const handleMainImageChange = e => {
    const file = e.target.files?.[0]
    if (file) {
      setRawImageFile(file)
      setCropOpen(true)
    }
  }

  const handleCropped = ({ file }) => {
    setMainImage(file)
    setMainImageUrl(URL.createObjectURL(file))
    setRawImageFile(null)
    setCropOpen(false)
  }

  const handleSubmit = async () => {
    if (!formData.eventName?.trim()) {
      showToast('Weight Management Event Name is required', 'error')
      return
    }
    if (!aboutEvent?.trim()) {
      showToast('About Event is required', 'error')
      return
    }
    if (!formData.duration?.trim()) {
      showToast('Duration is required', 'error')
      return
    }
    if (!formData.startDate || !formData.endDate) {
      showToast('Start Date and End Date are required', 'error')
      return
    }
    if (!formData.startTime || !formData.endTime) {
      showToast('Start Time and End Time are required', 'error')
      return
    }
    if (!formData.hostedBy) {
      showToast('Hosted By is required', 'error')
      return
    }
    if (!formData.location?.trim()) {
      showToast('Location is required', 'error')
      return
    }
    if (!formData.locationCoordinates?.trim()) {
      showToast('Location Coordinates are required', 'error')
      return
    }
    if (!mainImage) {
      showToast('Upload Image is required', 'error')
      return
    }
    if (!importantInfo?.trim()) {
      showToast('Important Information is required', 'error')
      return
    }
    const normalizedSlots = (slots || []).map(s => ({
      slotName: String(s.name || '').trim(),
      date: String(s.date || '').trim(),
      time: String(s.time || '').trim(),
      inventory: Number(s.inventory || 0),
      price: Number(s.price || 0)
    }))
    const hasInvalidSlot = normalizedSlots.some(
      s =>
        !s.slotName ||
        !s.date ||
        !s.time ||
        !Number.isFinite(s.inventory) ||
        s.inventory <= 0 ||
        !Number.isFinite(s.price) ||
        s.price <= 0
    )
    if (hasInvalidSlot) {
      showToast(
        'All slots must have Slot Name, Date, Time, Inventory (>0) and Price (>0)',
        'error'
      )
      return
    }

    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('eventName', String(formData.eventName || '').trim())
      payload.append('slug', slugify(formData.eventName))
      if (formData.certificateTemplate) {
        payload.append('certificateId', String(formData.certificateTemplate))
      }
      payload.append('about', aboutEvent)
      payload.append('duration', String(formData.duration || '').trim())
      payload.append('startDate', String(formData.startDate || '').trim())
      payload.append('endDate', String(formData.endDate || '').trim())
      payload.append('startTime', String(formData.startTime || '').trim())
      payload.append('endTime', String(formData.endTime || '').trim())
      payload.append('hostedBy', String(formData.hostedBy || '').trim())
      payload.append('location', String(formData.location || '').trim())
      payload.append(
        'locationCoordinates',
        String(formData.locationCoordinates || '').trim()
      )
      payload.append('importantInformation', importantInfo)
      payload.append('status', 'true')
      payload.append('slots', JSON.stringify(normalizedSlots))
      payload.append('image', mainImage)

      const res = await createWeightManagementEvent(payload)
      if (!res?.success) {
        showToast(res?.message || 'Failed to add event', 'error')
        return
      }

      showToast(
        res?.message || 'Weight management event added successfully',
        'success'
      )
      setTimeout(() => router.push('/weight-management-event'), 1200)
    } catch (err) {
      showToast(
        err?.response?.data?.message || err?.message || 'Failed to add event',
        'error'
      )
    } finally {
      setLoading(false)
    }
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

      <div className='mb-8'>
        <button
          onClick={() => router.back()}
          type='button'
          className='mb-2 flex w-fit items-center gap-1 text-xs font-medium text-[#8A92AC] transition-colors hover:text-[#2D3658]'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Add New Weight Management Event
          </h1>
          <nav className='mt-1 text-sm text-gray-500'>
            <Link href='/dashboard' className='hover:text-gray-700'>
              Dashboard
            </Link>
            <span className='mx-2'>/</span>
            <span className='text-gray-900'>
              Add New Weight Management Event
            </span>
          </nav>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Weight Management Event Details
          </h2>
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={loading}
              className='flex items-center gap-2 rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e] disabled:opacity-70 disabled:cursor-not-allowed'
            >
              {loading && <Loader2 className='h-4 w-4 animate-spin' />}
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        <div className='p-6 space-y-8'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div className='md:col-span-2'>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Weight Management Event Name*
              </label>
              <input
                type='text'
                name='eventName'
                value={formData.eventName}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Everyday Nutrition Workshop'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Certificate Template
              </label>
              <select
                name='certificateTemplate'
                value={formData.certificateTemplate}
                onChange={handleInputChange}
                className='w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#FF4400] focus:outline-none'
              >
                <option value=''>Select Template</option>
                {certificatesLoading ? (
                  <option value='' disabled>
                    Loading...
                  </option>
                ) : (
                  certificates.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.certificateName}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              About Event*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={aboutEvent}
                onChange={setAboutEvent}
                placeholder='The Everyday Nutrition Workshop is a practical, beginner-friendly session designed to help you understand what your body truly needs...'
                minHeight='120px'
              />
            </div>
          </div>

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
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='1-3 hours (based on selected access or activation)'
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
                  className='w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
                <Calendar className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none' />
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
                  className='w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
                <Calendar className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none' />
              </div>
            </div>
          </div>

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
                  className='w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
                <Clock className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none' />
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
                  className='w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                />
                <Clock className='absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none' />
              </div>
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Hosted By*
              </label>
              <select
                name='hostedBy'
                value={formData.hostedBy}
                onChange={handleInputChange}
                className='w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-[#FF4400] focus:outline-none'
              >
                <option value=''>Select Host</option>
                {hostsLoading ? (
                  <option value='' disabled>
                    Loading...
                  </option>
                ) : (
                  hosts.map(h => (
                    <option key={h._id} value={h._id}>
                      {h.name || h.hostName || h.gymHostName || 'Host'}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-sm font-semibold text-gray-700'>Slots</h3>
              <button
                type='button'
                onClick={addSlot}
                className='flex items-center gap-1 text-sm font-medium text-[#FF4400] hover:text-[#ff551e]'
              >
                <Plus className='h-4 w-4' /> Add Slot
              </button>
            </div>
            <div className='overflow-x-auto rounded-xl border border-[#E5E8F5]'>
              <table className='w-full min-w-[640px] border-collapse'>
                <thead>
                  <tr className='border-b border-gray-200 bg-gray-50/80'>
                    <th className='py-2.5 px-3 text-left text-xs font-medium text-gray-500'>
                      Slot Name*
                    </th>
                    <th className='py-2.5 px-3 text-left text-xs font-medium text-gray-500'>
                      Date*
                    </th>
                    <th className='py-2.5 px-3 text-left text-xs font-medium text-gray-500'>
                      Time*
                    </th>
                    <th className='py-2.5 px-3 text-left text-xs font-medium text-gray-500'>
                      Inventory
                    </th>
                    <th className='py-2.5 px-3 text-left text-xs font-medium text-gray-500'>
                      Price
                    </th>
                    <th className='py-2.5 px-3 w-10' />
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {slots.map(slot => (
                    <tr key={slot.id} className='bg-white'>
                      <td className='py-2 px-3'>
                        <input
                          type='text'
                          value={slot.name}
                          onChange={e =>
                            handleSlotChange(slot.id, 'name', e.target.value)
                          }
                          className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                          placeholder='Slot 1'
                        />
                      </td>
                      <td className='py-2 px-3'>
                        <input
                          type='date'
                          value={slot.date}
                          onChange={e =>
                            handleSlotChange(slot.id, 'date', e.target.value)
                          }
                          className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none'
                        />
                      </td>
                      <td className='py-2 px-3'>
                        <input
                          type='time'
                          value={slot.time}
                          onChange={e =>
                            handleSlotChange(slot.id, 'time', e.target.value)
                          }
                          className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#FF4400] focus:outline-none'
                        />
                      </td>
                      <td className='py-2 px-3'>
                        <input
                          type='number'
                          min='0'
                          value={slot.inventory}
                          onChange={e =>
                            handleSlotChange(
                              slot.id,
                              'inventory',
                              e.target.value
                            )
                          }
                          className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                          placeholder='50'
                        />
                      </td>
                      <td className='py-2 px-3'>
                        <div className='flex items-center gap-1'>
                          <span className='text-sm text-gray-500'>₦</span>
                          <input
                            type='text'
                            inputMode='numeric'
                            value={slot.price}
                            onChange={e =>
                              handleSlotChange(
                                slot.id,
                                'price',
                                e.target.value.replace(/\D/g, '')
                              )
                            }
                            className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                            placeholder='10,000'
                          />
                        </div>
                      </td>
                      <td className='py-2 px-3'>
                        <button
                          type='button'
                          onClick={() => removeSlot(slot.id)}
                          className='p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50'
                          aria-label='Remove slot'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
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
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='6.449942, 3.442864'
              />
            </div>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Upload Image*
              </label>
              <div className='flex rounded-lg border border-gray-200 bg-white overflow-hidden'>
                <div className='flex-1 min-w-0 truncate px-4 py-2.5 text-sm text-gray-500'>
                  {mainImage ? mainImage.name : 'Image.jpg'}
                </div>
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='shrink-0 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200'
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
                <div className='mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-gray-200'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mainImageUrl}
                    alt='Preview'
                    className='w-full h-full object-cover'
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Important Information*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={importantInfo}
                onChange={setImportantInfo}
                placeholder='A valid ID may be required for entry. Entry passes are non-transferable...'
                minHeight='120px'
              />
            </div>
          </div>
        </div>
      </div>

      {cropOpen && rawImageFile && (
        <ImageCropper
          open={cropOpen}
          file={rawImageFile}
          onClose={() => {
            setCropOpen(false)
            setRawImageFile(null)
          }}
          onCropped={handleCropped}
        />
      )}
    </div>
  )
}
