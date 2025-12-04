'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  Loader2,
  Pencil,
  Trash2,
  RotateCcw,
  AlertCircle
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getAllEventsTypes,
  getEventTypeById,
  createEventType,
  updateEventType,
  deleteEventType,
  restoreEventType
} from '@/services/discover-events/eventType.service'
import Toast from '@/components/ui/Toast'

const eventTypeRows = []

const TableHeaderCell = ({ children, align = 'left', onClick, active = false, order = 'desc' }) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } ${active ? 'text-[#2D3658]' : 'text-[#8A92AC]'} `}
  >
    {children}
    <TbCaretUpDownFilled className={`h-3.5 w-3.5 ${active ? 'text-[#4F46E5]' : 'text-[#CBCFE2]'} ${order === 'asc' ? 'rotate-180' : ''}`} />
  </button>
)

export default function EventTypeMasters () {
  const router = useRouter()
  const formSectionRef = useRef(null)
  const nameInputRef = useRef(null)
  const [formData, setFormData] = useState({
    eventTypeName: '',
    title: '',
    description: '',
    eventFor: '',
    status: 'Active'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' })
  const [eventTypes, setEventTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [rowActionLoading, setRowActionLoading] = useState(null)
  const [editingTypeId, setEditingTypeId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.eventTypeName || formData.eventTypeName.trim().length < 2)
      errs.eventTypeName = 'Enter a valid event type'
    if (!formData.status) errs.status = 'Select status'
    return errs
  }

  const fetchEventTypes = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllEventsTypes()
      const list = Array.isArray(res?.data) ? res.data : []
      setEventTypes(list)
    } catch (e) {
      setError('Failed to load event types')
      setEventTypes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEventTypes()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenId !== null) {
        const target = event.target
        const isMenuButton = target.closest('button[data-menu-button]')
        const isMenuContent = target.closest('[data-menu-content]')
        
        if (!isMenuButton && !isMenuContent) {
          setMenuOpenId(null)
        }
      }
    }

    if (menuOpenId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpenId])

  useEffect(() => {
    fetchEventTypes()
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const payload = {
      eventType: formData.eventTypeName.trim(),
      title: String(formData.title || '').trim(),
      description: String(formData.description || '').trim(),
      eventFor: String(formData.eventFor || '').trim(),
      status: formData.status === 'Active'
    }
    try {
      setSubmitting(true)
      const res = editingTypeId
        ? await updateEventType(editingTypeId, payload)
        : await createEventType(payload)
      if (res?.success) {
        await fetchEventTypes()
        setFormData({ eventTypeName: '', title: '', description: '', eventFor: '', status: 'Active' })
        setErrors({})
        setEditingTypeId(null)
        setToast({
          open: true,
          title: editingTypeId ? 'Event type updated' : 'Event type created',
          description: editingTypeId ? 'Changes have been saved' : 'Your event type has been added',
          variant: 'success'
        })
      }
    } catch (e) {
      setError(
        editingTypeId
          ? 'Failed to update event type'
          : 'Failed to create event type'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = async id => {
    setRowActionLoading(id)
    try {
      const res = await getEventTypeById(id)
      const et = res?.data || {}
      setFormData({
        eventTypeName: et.eventType || '',
        title: et.title || '',
        description: et.description || '',
        eventFor: et.eventFor || '',
        status: et.status ? 'Active' : 'Inactive'
      })
      setEditingTypeId(id)
      setMenuOpenId(null)
      setTimeout(() => {
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        nameInputRef.current?.focus()
      }, 50)
    } catch (e) {
      setError('Failed to load event type')
    } finally {
      setRowActionLoading(null)
    }
  }

  const confirmDelete = async () => {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res = await deleteEventType(confirmId)
      if (res?.success) {
        await fetchEventTypes()
        setToast({
          open: true,
          title: 'Event type deleted',
          description: 'The event type has been removed',
          variant: 'success'
        })
      }
    } catch (e) {
      setError('Failed to delete event type')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmId(null)
    }
  }

  const doRestore = async id => {
    setRowActionLoading(id)
    try {
      const res = await restoreEventType(id)
      if (res?.success) {
        await fetchEventTypes()
        setToast({
          open: true,
          title: 'Event type restored',
          description: 'The event type is now active',
          variant: 'success'
        })
      }
      setMenuOpenId(null)
    } catch (e) {
      setError('Failed to restore event type')
    } finally {
      setRowActionLoading(null)
    }
  }

  const filteredEventTypes = useMemo(() => {
    const base = Array.isArray(eventTypes) ? eventTypes : []
    return base.filter(eventType =>
      String(eventType.eventType || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  }, [eventTypes, searchTerm])

  const getSortValue = (et, key) => {
    if (key === 'addedOn') {
      const d = et.createdAt || et.updatedAt
      return d ? new Date(typeof d === 'object' && d.$date ? d.$date : d).getTime() : 0
    }
    if (key === 'eventType') {
      return String(et.eventType || '').toLowerCase()
    }
    if (key === 'status') {
      return et.status ? 1 : 0
    }
    return 0
  }

  const sortedEventTypes = useMemo(() => {
    const arr = Array.isArray(filteredEventTypes) ? [...filteredEventTypes] : []
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortOrder === 'asc' ? (va - vb) : (vb - va)
    })
    return arr
  }, [filteredEventTypes, sortKey, sortOrder])

  const toggleSort = key => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  return (
    <div className='space-y-7'>
      <Toast
        open={toast.open}
        onOpenChange={(v) => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-semibold text-slate-900'>
            Event Type Masters
          </h1>
          <p className='text-sm text-[#99A1BC]'>Dashboard / Masters</p>
        </div>
      </div>

      {/* Event Type Details Form */}
      <div className='bg-gray-200 p-3 rounded-xl p-4'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Event Type Details
            </h2>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className='rounded-xl bg-[#FF5B2C] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {submitting ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {editingTypeId ? 'Updating...' : 'Adding...'}
                </span>
              ) : editingTypeId ? (
                'Update'
              ) : (
                'Add'
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} ref={formSectionRef}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Event Type Name */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Event Types Name
                </label>
                <input
                  type='text'
                  ref={nameInputRef}
                  value={formData.eventTypeName}
                  onChange={e =>
                    handleInputChange('eventTypeName', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter event type name'
                />
                {errors.eventTypeName && (
                  <p className='text-xs text-red-600'>{errors.eventTypeName}</p>
                )}
              </div>

              {/* Status */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Status
                </label>
                <div className='relative'>
                  <select
                    value={formData.status}
                    onChange={e => handleInputChange('status', e.target.value)}
                    className='w-full h-12 appearance-none rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 pr-10 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  >
                    <option value='Active'>Active</option>
                    <option value='Inactive'>Inactive</option>
                  </select>
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                    <svg
                      className='w-4 h-4 text-[#99A1BC]'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </div>
                  {errors.status && (
                    <p className='text-xs text-red-600'>{errors.status}</p>
                  )}
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>Title</label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter title'
                />
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>Event For</label>
                <input
                  type='text'
                  value={formData.eventFor}
                  onChange={e => handleInputChange('eventFor', e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter audience'
                />
              </div>

              <div className='space-y-2 md:col-span-2'>
                <label className='text-sm font-medium text-slate-700'>Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                  className='w-full rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 py-3 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter description'
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Event Type List */}
      <div className='bg-gray-200 p-3 rounded-xl p-4'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-8'>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Event Type List
            </h2>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='relative flex items-center'>
                <input
                  type='text'
                  placeholder='Search'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                />
                <Search className='absolute left-3 h-4 w-4 text-[#A6AEC7]' />
              </div>
              {/* <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
                <IoFilterSharp className='h-4 w-4 text-[#8B93AF]' />
                Filters
              </button>
              <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
                <Download className='h-4 w-4 text-[#8B93AF]' />
              </button> */}
            </div>
          </div>

          <div className='overflow-visible rounded-2xl border border-[#E5E8F5]'>
            <div className='grid grid-cols-12 gap-6 bg-[#F7F9FD] px-6 py-4'>
              <div className='col-span-4'>
                <TableHeaderCell onClick={() => toggleSort('addedOn')} active={sortKey === 'addedOn'} order={sortOrder}>Added On</TableHeaderCell>
              </div>
              <div className='col-span-4'>
                <TableHeaderCell onClick={() => toggleSort('eventType')} active={sortKey === 'eventType'} order={sortOrder}>Event Type</TableHeaderCell>
              </div>
              <div className='col-span-4'>
                <TableHeaderCell align='right' onClick={() => toggleSort('status')} active={sortKey === 'status'} order={sortOrder}>Status</TableHeaderCell>
              </div>
            </div>

            <div className='divide-y divide-[#EEF1FA] bg-white'>
              {loading && (
                <div className='px-6 py-5 text-sm text-[#5E6582]'>
                  Loading...
                </div>
              )}
              {error && !loading && (
                <div className='px-6 py-5 text-sm text-red-600'>{error}</div>
              )}
              {!loading &&
                !error &&
                sortedEventTypes.map((eventType, idx) => (
                  <div
                    key={eventType._id || idx}
                    className='grid grid-cols-12 gap-6 px-6 py-5 hover:bg-[#F9FAFD]'
                  >
                    <div className='col-span-4 self-center text-sm text-[#5E6582]'>
                      {eventType.createdAt || eventType.updatedAt
                        ? new Date(
                            eventType.createdAt || eventType.updatedAt
                          ).toLocaleString(undefined, {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </div>
                    <div className='col-span-4 self-center text-sm font-semibold text-slate-900'>
                      {eventType.eventType || '-'}
                    </div>
                    <div className='col-span-4 flex items-center justify-between'>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          eventType.status
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {eventType.status ? 'Active' : 'Inactive'}
                      </span>
                      <div className='relative'>
                        <button
                          data-menu-button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === (eventType._id || idx)
                                ? null
                                : eventType._id || idx
                            )
                          }
                          className='rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                        {menuOpenId === (eventType._id || idx) && (
                          <div data-menu-content className='absolute right-0 mt-2 w-40 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-20'>
                            <button
                              onClick={() => startEdit(eventType._id)}
                              className='flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                              disabled={rowActionLoading === eventType._id}
                            >
                              {rowActionLoading === eventType._id ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Pencil className='h-4 w-4' />
                              )}
                              Edit
                            </button>
                            {eventType.status ? (
                              <button
                                onClick={() => {
                                  setConfirmId(eventType._id)
                                  setConfirmOpen(true)
                                  setMenuOpenId(null)
                                }}
                                className='flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50'
                              >
                                <Trash2 className='h-4 w-4' />
                                Delete
                              </button>
                            ) : (
                              <button
                                onClick={() => doRestore(eventType._id)}
                                className='flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                                disabled={rowActionLoading === eventType._id}
                              >
                                {rowActionLoading === eventType._id ? (
                                  <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                  <RotateCcw className='h-4 w-4' />
                                )}
                                Restore
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {confirmOpen && (
          <div className='fixed inset-0 z-40 flex items-center justify-center'>
            <div
              className='absolute inset-0 bg-black/40'
              onClick={() => {
                if (!deleting) {
                  setConfirmOpen(false)
                  setConfirmId(null)
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
                    Delete this event type?
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
                      setConfirmId(null)
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
    </div>
  )
}
