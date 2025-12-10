'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  Link,
  Image as ImageIcon,
  Code,
  Type,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getAllTickets,
  createTicket,
  getTicketById,
  editTicket,
  deleteTicket
} from '@/services/tickets/ticket.service'
import Toast from '@/components/ui/Toast'

const ticketRows = []

const TableHeaderCell = ({ children, align = 'left' }) => (
  <div
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC] ${
      align === 'right' ? 'justify-end' : 'justify-start'
    }`}
  >
    {children}
    <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
  </div>
)

export default function EditTickets () {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const eventIdFromPath = params?.id
  const eventIdFromQuery =
    searchParams?.get('eventId') || searchParams?.get('id')
  const eventId = eventIdFromPath || eventIdFromQuery || ''
  const [formData, setFormData] = useState({
    ticketName: '',
    ticketType: 'Group Ticket',
    subText: '',
    groupSize: '',
    perTicketPrice: '',
    originalPrice: '',
    ticketCount: '',
    ticketDetails: ''
  })
  const [errors, setErrors] = useState({})
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [editingTicketId, setEditingTicketId] = useState(null)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [rowActionLoading, setRowActionLoading] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const formatPriceInput = value => {
    const s = String(value || '')
    const cleaned = s.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    const intPart = parts[0] || ''
    const decimalPart =
      parts.length > 1
        ? parts
            .slice(1)
            .join('')
            .replace(/[^0-9]/g, '')
        : undefined
    if (intPart === '') {
      return decimalPart !== undefined ? `.${decimalPart}` : ''
    }
    if (intPart.length <= 3) {
      return decimalPart !== undefined ? `${intPart}.${decimalPart}` : intPart
    }
    const last3 = intPart.slice(-3)
    const rest = intPart.slice(0, -3)
    const restWithCommas = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
    const formattedInt = `${restWithCommas},${last3}`
    return decimalPart !== undefined
      ? `${formattedInt}.${decimalPart}`
      : formattedInt
  }

  const handleInputChange = (field, value) => {
    const v =
      field === 'perTicketPrice' || field === 'originalPrice'
        ? formatPriceInput(value)
        : value
    setFormData(prev => ({
      ...prev,
      [field]: v
    }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.ticketName || formData.ticketName.trim().length < 2)
      errs.ticketName = 'Enter a valid ticket name'
    if (!formData.ticketType) errs.ticketType = 'Select a ticket type'
    const isGroup = formData.ticketType === 'Group Ticket'
    if (isGroup) {
      const gs = parseInt(formData.groupSize, 10)
      if (!gs || gs < 1) errs.groupSize = 'Enter group size'
    }
    const price =
      typeof formData.perTicketPrice === 'string'
        ? formData.perTicketPrice.replace(/[^0-9.]/g, '')
        : String(formData.perTicketPrice || '')
    const priceNum = Number(price)
    const original =
      typeof formData.originalPrice === 'string'
        ? formData.originalPrice.replace(/[^0-9.]/g, '')
        : String(formData.originalPrice || '')
    const originalPriceNum = Number(original)

    const countNum = Number(String(formData.ticketCount).replace(/[^0-9]/g, ''))
    if (isNaN(countNum) || countNum < 0)
      errs.ticketCount = 'Enter valid ticket count'
    if (!formData.ticketDetails || formData.ticketDetails.trim().length < 5)
      errs.ticketDetails = 'Enter ticket details'
    return { errs, isGroup, priceNum, originalPriceNum, countNum }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const { errs, isGroup, priceNum, originalPriceNum, countNum } = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    if (!eventId) {
      setError('Missing event id')
      return
    }
    const payload = {
      eventId,
      ticketName: formData.ticketName.trim(),
      ticketType: isGroup ? 'group' : 'regular',
      groupSize: isGroup ? parseInt(formData.groupSize, 10) : undefined,
      subText: formData.subText?.trim() || '',
      perTicketPrice: priceNum,
      ticketCount: countNum,
      ticketDetail: formData.ticketDetails.trim(),
      status: true
    }
    if (String(formData.originalPrice || '').trim()) {
      payload.originalPrice = originalPriceNum
    }
    try {
      setSubmitting(true)
      const res = editingTicketId
        ? await editTicket(payload, editingTicketId)
        : await createTicket(payload)
      if (res?.success) {
        await fetchTickets()
        setFormData({
          ticketName: '',
          ticketType: 'Group Ticket',
          subText: '',
          groupSize: '',
          perTicketPrice: '',
          originalPrice: '',
          ticketCount: '',
          ticketDetails: ''
        })
        setErrors({})
        setToastOpen(true)
        setEditingTicketId(null)
      }
    } catch (err) {
      setError(
        editingTicketId ? 'Failed to update ticket' : 'Failed to create ticket'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = async id => {
    setRowActionLoading(id)
    try {
      const res = await getTicketById(id)
      const t = res?.data || {}
      setFormData({
        ticketName: t.ticketName || '',
        ticketType:
          String(t.ticketType).toLowerCase() === 'group'
            ? 'Group Ticket'
            : 'Regular Ticket',
        subText: t.subText || '',
        groupSize: t.groupSize ? String(t.groupSize) : '',
        perTicketPrice: t.perTicketPrice
          ? formatPriceInput(String(t.perTicketPrice))
          : '',
        originalPrice: t.originalPrice
          ? formatPriceInput(String(t.originalPrice))
          : '',
        ticketCount: t.ticketCount ? String(t.ticketCount) : '',
        ticketDetails: t.ticketDetail || ''
      })
      setErrors({})
      setEditingTicketId(id)
      setMenuOpenId(null)
    } catch (e) {
      setError('Failed to load ticket for edit')
    } finally {
      setRowActionLoading(null)
    }
  }

  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      const res = await deleteTicket(confirmDeleteId)
      if (res?.success) {
        await fetchTickets()
        setToastOpen(true)
      }
    } catch (e) {
      setError('Failed to delete ticket')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmDeleteId(null)
    }
  }

  const handleBack = () => {
    router.push('/discover-events/add')
  }

  const apiFilters = useMemo(() => {
    const filters = {}
    const ticketType = searchParams?.get('ticketType')
    const status = searchParams?.get('status')
    if (ticketType) filters.ticketType = ticketType
    if (status) filters.status = status
    if (searchTerm.trim()) filters.ticketName = searchTerm.trim()
    return filters
  }, [searchParams, searchTerm])

  const fetchTickets = async () => {
    if (!eventId) return
    setLoading(true)
    setError('')
    try {
      const res = await getAllTickets({ eventId, ...apiFilters })
      const data = Array.isArray(res?.data) ? res.data : []
      setTickets(data)
    } catch (e) {
      setError('Failed to load tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, apiFilters])

  useEffect(() => {
    const handleClickOutside = event => {
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

  return (
    <div className='space-y-7 py-12 px-12'>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title="You've successfully added the ticket"
        description='The ticket is now available in the list'
        variant='success'
        duration={4000}
        position='top-right'
      />
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex items-center gap-4'>
          <button
            onClick={handleBack}
            className='flex items-center justify-center w-10 h-10 rounded-xl border border-[#E5E6EF] bg-white hover:bg-gray-50 transition-colors'
          >
            <ArrowLeft className='w-5 h-5 text-gray-600' />
          </button>
          <div className='flex flex-col gap-2'>
            <h1 className='text-2xl font-semibold text-slate-900'>
              Edit Tickets
            </h1>
            <p className='text-sm text-[#99A1BC]'>Dashboard / Edit Tickets</p>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-3 md:justify-end'>
          <button
            onClick={() => router.push('/discover-events')}
            className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD] cursor-pointer'
          >
            Back to event list
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className='rounded-xl bg-[#FF5B2C] cursor-pointer px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A]'
          >
            {submitting ? (
              <span className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                {editingTicketId ? 'Updating...' : 'Adding...'}
              </span>
            ) : editingTicketId ? (
              'Update'
            ) : (
              'Add'
            )}
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Ticket Details Section */}
        <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)] mb-8'>
          <h2 className='text-lg font-semibold text-slate-900 mb-6'>
            Ticket Details
          </h2>

          <div className='space-y-6'>
            {/* First Row - Ticket Name, Type, Sub Text */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              {/* Ticket Name */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Ticket Name*
                </label>
                <input
                  type='text'
                  value={formData.ticketName}
                  onChange={e =>
                    handleInputChange('ticketName', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter ticket name'
                />
                {errors.ticketName && (
                  <p className='text-xs text-red-600'>{errors.ticketName}</p>
                )}
              </div>

              {/* Ticket Type */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Ticket Type*
                </label>
                <div className='flex items-center gap-6 mt-3'>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='ticketType'
                      value='Group Ticket'
                      checked={formData.ticketType === 'Group Ticket'}
                      onChange={e =>
                        handleInputChange('ticketType', e.target.value)
                      }
                      className='w-4 h-4 text-[#FF5735] border-gray-300 focus:ring-[#FF5735]'
                    />
                    <span className='text-sm text-slate-700'>Group Ticket</span>
                  </label>
                  <label className='flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='ticketType'
                      value='Regular Ticket'
                      checked={formData.ticketType === 'Regular Ticket'}
                      onChange={e => {
                        const v = e.target.value
                        handleInputChange('ticketType', v)
                        if (v === 'Regular Ticket')
                          handleInputChange('groupSize', '')
                      }}
                      className='w-4 h-4 text-[#FF5735] border-gray-300 focus:ring-[#FF5735]'
                    />
                    <span className='text-sm text-slate-700'>
                      Regular Ticket
                    </span>
                  </label>
                </div>
                {errors.ticketType && (
                  <p className='text-xs text-red-600'>{errors.ticketType}</p>
                )}
              </div>

              {/* Sub Text */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Sub Text*
                </label>
                <input
                  type='text'
                  value={formData.subText}
                  onChange={e => handleInputChange('subText', e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter sub text'
                />
              </div>
            </div>

            {/* Second Row - Group Size, Price, Original Price, Count */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
              {/* Group Size */}
              {formData.ticketType === 'Group Ticket' && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-slate-700'>
                    Group Size*
                  </label>
                  <input
                    type='text'
                    value={formData.groupSize}
                    onChange={e =>
                      handleInputChange('groupSize', e.target.value)
                    }
                    className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                    placeholder='Enter group size'
                  />
                  {errors.groupSize && (
                    <p className='text-xs text-red-600'>{errors.groupSize}</p>
                  )}
                </div>
              )}

              {/* Per Ticket Price */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Discounted Ticket Price*
                </label>
                <input
                  type='text'
                  value={formData.perTicketPrice}
                  onChange={e =>
                    handleInputChange('perTicketPrice', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter price'
                />
                {errors.perTicketPrice && (
                  <p className='text-xs text-red-600'>
                    {errors.perTicketPrice}
                  </p>
                )}
              </div>

              {/* Original Price */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Original Price
                </label>
                <input
                  type='text'
                  value={formData.originalPrice}
                  onChange={e =>
                    handleInputChange('originalPrice', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter original price'
                />
              </div>

              {/* Ticket Count */}
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Ticket Count*
                </label>
                <input
                  type='text'
                  value={formData.ticketCount}
                  onChange={e =>
                    handleInputChange('ticketCount', e.target.value)
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter count'
                />
                {errors.ticketCount && (
                  <p className='text-xs text-red-600'>{errors.ticketCount}</p>
                )}
              </div>
            </div>

            {/* Ticket Details */}
            <div className='space-y-4'>
              <label className='text-sm font-medium text-slate-700'>
                Ticket Details*
              </label>

              {/* Rich Text Editor Toolbar */}
              <div className='flex items-center gap-1 p-3 border border-[#E5E6EF] rounded-t-xl bg-[#F8F9FC]'>
                <button
                  type='button'
                  className='p-2 hover:bg-white rounded transition-colors'
                >
                  <Type className='w-4 h-4 text-[#6B7280]' />
                </button>
                <button
                  type='button'
                  className='p-2 hover:bg-white rounded transition-colors'
                >
                  <Bold className='w-4 h-4 text-[#6B7280]' />
                </button>
                <button
                  type='button'
                  className='p-2 hover:bg-white rounded transition-colors'
                >
                  <Italic className='w-4 h-4 text-[#6B7280]' />
                </button>
                <button
                  type='button'
                  className='p-2 hover:bg-white rounded transition-colors'
                >
                  <Underline className='w-4 h-4 text-[#6B7280]' />
                </button>
                <div className='w-px h-6 bg-[#E5E6EF] mx-1'></div>
                <button
                  type='button'
                  className='p-2 hover:bg-white rounded transition-colors'
                >
                  <List className='w-4 h-4 text-[#6B7280]' />
                </button>
                <button
                  type='button'
                  className='p-2 hover:bg-white rounded transition-colors'
                >
                  <AlignLeft className='w-4 h-4 text-[#6B7280]' />
                </button>
                <div className='w-px h-6 bg-[#E5E6EF] mx-1'></div>
                <button
                  type='button'
                  className='p-2 hover:bg-white rounded transition-colors'
                >
                  <Link className='w-4 h-4 text-[#6B7280]' />
                </button>
                <button
                  type='button'
                  className='p-2 hover:bg-white rounded transition-colors'
                >
                  <ImageIcon className='w-4 h-4 text-[#6B7280]' />
                </button>
                <button
                  type='button'
                  className='p-2 hover:bg-white rounded transition-colors'
                >
                  <Code className='w-4 h-4 text-[#6B7280]' />
                </button>
              </div>

              {/* Text Area */}
              <textarea
                value={formData.ticketDetails}
                onChange={e =>
                  handleInputChange('ticketDetails', e.target.value)
                }
                rows={4}
                className='w-full rounded-b-xl border border-t-0 border-[#E5E6EF] bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4] resize-none'
                placeholder='Enter ticket details...'
              />
              {errors.ticketDetails && (
                <p className='text-xs text-red-600'>{errors.ticketDetails}</p>
              )}
            </div>
          </div>
        </div>

        {/* Ticket List Section */}
        <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Ticket List
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
              <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
                <IoFilterSharp className='h-4 w-4 text-[#8B93AF]' />
                Filters
              </button>
              <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
                <Download className='h-4 w-4 text-[#8B93AF]' />
              </button>
            </div>
          </div>

          <div className='overflow-visible rounded-2xl border border-[#E5E8F5]'>
            <div className='grid grid-cols-12 gap-3 bg-[#F7F9FD] px-6 py-4'>
              <div className='col-span-2'>
                <TableHeaderCell>Added On</TableHeaderCell>
              </div>
              <div className='col-span-2'>
                <TableHeaderCell>Ticket Name</TableHeaderCell>
              </div>
              <div className='col-span-2'>
                <TableHeaderCell>Ticket Type</TableHeaderCell>
              </div>
              <div className='col-span-1'>
                <TableHeaderCell>Group Size</TableHeaderCell>
              </div>
              <div className='col-span-1'>
                <TableHeaderCell>Per Ticket Price</TableHeaderCell>
              </div>
              <div className='col-span-1'>
                <TableHeaderCell>Ticket Count</TableHeaderCell>
              </div>
              <div className='col-span-1'>
                <TableHeaderCell>Tickets Left</TableHeaderCell>
              </div>
              <div className='col-span-2 flex justify-end'>
                <TableHeaderCell align='right'>Status</TableHeaderCell>
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
                tickets.map((t, idx) => {
                  const addedOn = (() => {
                    const d = t.createdAt || t.updatedAt
                    const date = d ? new Date(d) : null
                    return date
                      ? date.toLocaleString(undefined, {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'
                  })()
                  const ticketTypeLabel =
                    String(t.ticketType).toLowerCase() === 'group'
                      ? 'Group Ticket'
                      : 'Regular Ticket'
                  const statusText = t.status ? 'Active' : 'Inactive'
                  const statusClass = t.status
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                  return (
                    <div
                      key={t._id || idx}
                      className='grid grid-cols-12 gap-3 px-6 py-5 hover:bg-[#F9FAFD]'
                    >
                      <div className='col-span-2 self-center text-sm text-[#5E6582]'>
                        {addedOn}
                      </div>
                      <div className='col-span-2 self-center text-sm font-semibold text-slate-900'>
                        {t.ticketName || '-'}
                      </div>
                      <div className='col-span-2 self-center text-sm text-[#5E6582]'>
                        {ticketTypeLabel}
                      </div>
                      <div className='col-span-1 self-center text-sm text-[#5E6582]'>
                        {t.groupSize ?? '0'}
                      </div>
                      <div className='col-span-1 self-center text-sm text-[#5E6582]'>
                        {t.perTicketPrice ?? '-'}
                      </div>
                      <div className='col-span-1 self-center text-sm text-[#5E6582]'>
                        {t.ticketCount ?? '-'}
                      </div>
                      <div className='col-span-1 self-center text-sm font-medium text-slate-900'>
                        {typeof t.ticketLeft === 'number' ? t.ticketLeft : '-'}
                      </div>
                      <div className='col-span-2 flex items-center justify-end gap-2'>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          {statusText}
                        </span>
                        <div className='relative'>
                          <button
                            data-menu-button
                            onClick={() =>
                              setMenuOpenId(
                                menuOpenId === (t._id || idx)
                                  ? null
                                  : t._id || idx
                              )
                            }
                            className='rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </button>
                          {menuOpenId === (t._id || idx) && (
                            <div
                              data-menu-content
                              className='absolute right-0 mt-2 w-36 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-20'
                            >
                              <button
                                onClick={() => startEdit(t._id)}
                                className='flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                                disabled={rowActionLoading === t._id}
                              >
                                {rowActionLoading === t._id ? (
                                  <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                  <Pencil className='h-4 w-4' />
                                )}
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setConfirmDeleteId(t._id)
                                  setConfirmOpen(true)
                                  setMenuOpenId(null)
                                }}
                                className='flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50'
                              >
                                <Trash2 className='h-4 w-4' />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </form>

      {confirmOpen && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!deleting) {
                setConfirmOpen(false)
                setConfirmDeleteId(null)
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
                  Delete this ticket?
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
                    setConfirmDeleteId(null)
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
  )
}
