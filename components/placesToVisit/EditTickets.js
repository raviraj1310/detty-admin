'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Search, MoreVertical, Loader2, AlertCircle } from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  Wand2,
  Bold,
  Underline,
  Italic,
  Strikethrough,
  Palette,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Code,
  Maximize2
} from 'lucide-react'
import {
  getAllActivityTickets,
  createActivityTicket,
  getActivityTicketById,
  updateActivityTicket,
  deleteActivityTicket
} from '@/services/tickets/placesToVisitTicket.service'
import Toast from '@/components/ui/Toast'

export default function EditTickets () {
  const router = useRouter()
  const params = useParams()

  const [formData, setFormData] = useState({
    activityId: '',
    ticketName: '',
    ticketType: 'group',
    subText: '',
    groupSize: '',
    perTicketPrice: '',
    ticketCount: '',
    ticketDetails: '',
    ticketLeft: '',
    status: true
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastContent, setToastContent] = useState({
    title: '',
    description: '',
    variant: 'success'
  })
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingTicketId, setEditingTicketId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [activityName, setActivityName] = useState('')

  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const raw = params?.id
    const aid = Array.isArray(raw) ? raw[0] : raw || ''
    if (aid && aid !== formData.activityId) {
      setFormData(prev => ({ ...prev, activityId: aid }))
    }
  }, [params?.id])

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
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return decimalPart !== undefined
      ? `${formattedInt}.${decimalPart}`
      : formattedInt
  }

  const handleChange = (field, value) => {
    const v =
      field === 'perTicketPrice' || field === 'originalPrice'
        ? formatPriceInput(value)
        : value
    setFormData(prev => ({ ...prev, [field]: v }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.ticketName.trim()) errs.ticketName = 'Required'
    if (!formData.ticketType) errs.ticketType = 'Required'
    if (formData.ticketType === 'group') {
      if (!String(formData.groupSize || '').trim()) errs.groupSize = 'Required'
      else if (Number(formData.groupSize) <= 0)
        errs.groupSize = 'Must be positive'
      if (!formData.subText.trim()) errs.subText = 'Required'
    }
    if (!String(formData.perTicketPrice || '').trim())
      errs.perTicketPrice = 'Required'
    const countNum = Number(String(formData.ticketCount || '').trim())
    if (Number.isNaN(countNum) || countNum < 0)
      errs.ticketCount = 'Enter valid ticket count'
    if (!formData.ticketDetails.trim()) errs.ticketDetails = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const toNumber = v => {
    const s = String(v || '').replace(/[^0-9.]/g, '')
    const n = Number(s)
    return Number.isFinite(n) ? n : 0
  }

  const toIdString = v => {
    if (!v) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object') {
      if (v.$oid) return String(v.$oid)
      if (v.$id) return String(v.$id)
      if (v.oid) return String(v.oid)
      if (v._id) return toIdString(v._id)
    }
    return String(v)
  }

  const toPayload = () => {
    const p = {
      activityId: String(formData.activityId || '').trim(),
      ticketName: formData.ticketName.trim(),
      ticketType: formData.ticketType === 'group' ? 'group' : 'regular',
      groupSize:
        formData.ticketType === 'group' ? Number(formData.groupSize) : 0,
      subText: formData.subText.trim(),
      perTicketPrice: toNumber(formData.perTicketPrice),
      ticketCount: toNumber(formData.ticketCount),
      ticketDetail: formData.ticketDetails.trim(),
      ticketLeft: toNumber(formData.ticketLeft),
      status: Boolean(formData.status)
    }
    const op = String(formData.originalPrice || '').trim()
    if (op) p.originalPrice = toNumber(formData.originalPrice)
    return p
  }

  const handleAdd = async () => {
    if (!validate()) return
    try {
      setSubmitting(true)
      const payload = toPayload()
      const res = editingTicketId
        ? await updateActivityTicket(editingTicketId, payload)
        : await createActivityTicket(payload)
      if (res?.success) {
        setToastContent({
          title: editingTicketId ? 'Ticket updated' : 'Ticket created',
          description: 'Operation successful',
          variant: 'success'
        })
        setToastOpen(true)
        await fetchTickets(formData.activityId)
        setEditingTicketId(null)
        setFormData(prev => ({
          ...prev,
          ticketName: '',
          ticketType: 'group',
          subText: '',
          groupSize: '',
          perTicketPrice: '',
          originalPrice: '',
          ticketCount: '',
          ticketDetails: '',
          ticketLeft: '',
          status: true
        }))
      }
    } catch (e) {
      setToastContent({
        title: 'Error',
        description: 'Failed to save ticket',
        variant: 'error'
      })
      setToastOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewEditTickets = () => {
    router.push('/places-to-visit/bookings')
  }

  const TableHeaderCell = ({ children }) => (
    <div className='flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>
      <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
      {children}
    </div>
  )
  const fetchTickets = async aid => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllActivityTickets(aid ? { activityId: aid } : {})
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : []
      setTickets(list)
      try {
        const nm = String(
          (list[0] && list[0].activityId && list[0].activityId.activityName) ||
            ''
        ).trim()
        if (nm) setActivityName(nm)
      } catch {}
    } catch (e) {
      setError('Failed to load tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const raw = params?.id
    const aid = Array.isArray(raw) ? raw[0] : raw || ''
    fetchTickets(aid)
  }, [params?.id])

  const startEdit = async id => {
    try {
      setLoading(true)
      const res = await getActivityTicketById(id)
      const t = res?.data || {}
      try {
        const nm = String(t?.activityId?.activityName || '').trim()
        if (nm) setActivityName(nm)
      } catch {}
      setFormData({
        activityId: t.activityId || '',
        ticketName: t.ticketName || '',
        ticketType:
          String(t.ticketType).toLowerCase() === 'group' ? 'group' : 'regular',
        subText: t.subText || '',
        groupSize: t.groupSize ? String(t.groupSize) : '',
        perTicketPrice:
          typeof t.perTicketPrice === 'number'
            ? formatPriceInput(String(t.perTicketPrice))
            : formatPriceInput(String(t.perTicketPrice || '')),
        originalPrice:
          typeof t.originalPrice === 'number'
            ? formatPriceInput(String(t.originalPrice))
            : formatPriceInput(String(t.originalPrice || '')),
        ticketCount:
          typeof t.ticketCount === 'number'
            ? String(t.ticketCount)
            : String(t.ticketCount || ''),
        ticketDetails: t.ticketDetail || '',
        ticketLeft:
          typeof t.ticketLeft === 'number'
            ? String(t.ticketLeft)
            : String(t.ticketLeft || ''),
        status: typeof t.status === 'boolean' ? t.status : Boolean(t.status)
      })
      setErrors({})
      setEditingTicketId(toIdString(t._id || t.id || id))
    } catch (e) {
      setToastContent({
        title: 'Error',
        description: 'Failed to load ticket',
        variant: 'error'
      })
      setToastOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!confirmId) return
    try {
      setDeleting(true)
      const res = await deleteActivityTicket(confirmId)
      if (res?.success) {
        setToastContent({
          title: 'Ticket deleted',
          description: 'Removed successfully',
          variant: 'success'
        })
        setToastOpen(true)
        await fetchTickets(formData.activityId)
      } else {
        setToastContent({
          title: 'Error',
          description: res?.message || 'Failed to delete ticket',
          variant: 'error'
        })
        setToastOpen(true)
      }
    } catch (e) {
      setToastContent({
        title: 'Error',
        description: 'Failed to delete ticket',
        variant: 'error'
      })
      setToastOpen(true)
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmId(null)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-12'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
          Add/Edit Tickets - {activityName || '-'}
        </h1>
        <p className='text-sm text-gray-500 mt-1'>Dashboard / Edit Tickets</p>
      </div>

      {/* Ticket Details Card */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
        {/* Card Header */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Ticket Details
          </h2>
          <div className='flex gap-3'>
            <button
              onClick={() => router.push('/places-to-visit')}
              className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD] cursor-pointer'
            >
              Back to activity list
            </button>
            <button
              onClick={handleAdd}
              disabled={submitting}
              className='px-6 py-2.5 bg-[#FF5B2C] hover:bg-[#F0481A] text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {submitting ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Saving...
                </span>
              ) : editingTicketId ? (
                'Update'
              ) : (
                'Add'
              )}
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className='space-y-6'>
          {/* Row 1: Ticket Name, Ticket Type, Sub Text */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Ticket Name<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.ticketName}
                onChange={e => handleChange('ticketName', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Ticket Type<span className='text-red-500'>*</span>
              </label>
              <div className='flex items-center gap-6 pt-2'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='ticketType'
                    value='group'
                    checked={formData.ticketType === 'group'}
                    onChange={e => handleChange('ticketType', e.target.value)}
                    className='w-4 h-4 text-orange-600 focus:ring-orange-500'
                  />
                  <span className='text-sm text-gray-700'>Group Ticket</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='ticketType'
                    value='regular'
                    checked={formData.ticketType === 'regular'}
                    onChange={e => handleChange('ticketType', e.target.value)}
                    className='w-4 h-4 text-orange-600 focus:ring-orange-500'
                  />
                  <span className='text-sm text-gray-700'>Regular Ticket</span>
                </label>
              </div>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Sub Text<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.subText}
                onChange={e => handleChange('subText', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
              {errors.subText && (
                <p className='text-red-600 text-xs mt-1'>{errors.subText}</p>
              )}
            </div>
          </div>

          {/* Row 2: Group Size, Per Ticket Price, Original Price, Ticket Count */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {formData.ticketType === 'group' && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Group Size<span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  value={formData.groupSize}
                  onChange={e => handleChange('groupSize', e.target.value)}
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
                />
                {errors.groupSize && (
                  <p className='text-red-600 text-xs mt-1'>
                    {errors.groupSize}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Per Ticket Price<span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                value={formData.perTicketPrice}
                onChange={e => handleChange('perTicketPrice', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
              {errors.perTicketPrice && (
                <p className='text-red-600 text-xs mt-1'>
                  {errors.perTicketPrice}
                </p>
              )}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Original Price
              </label>
              <input
                type='text'
                value={formData.originalPrice}
                onChange={e => handleChange('originalPrice', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Ticket Count<span className='text-red-500'>*</span>
              </label>
              <input
                type='number'
                value={formData.ticketCount}
                onChange={e => handleChange('ticketCount', e.target.value)}
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900'
              />
              {errors.ticketCount && (
                <p className='text-red-600 text-xs mt-1'>
                  {errors.ticketCount}
                </p>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Status<span className='text-red-500'>*</span>
              </label>
              <select
                value={formData.status ? 'Active' : 'Inactive'}
                onChange={e =>
                  handleChange('status', e.target.value === 'Active')
                }
                className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white'
              >
                <option value='Active'>Active</option>
                <option value='Inactive'>Inactive</option>
              </select>
            </div>
          </div>

          {/* Ticket Details - Rich Text Editor */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Ticket Details<span className='text-red-500'>*</span>
            </label>
            <div className='border border-gray-300 rounded-lg overflow-hidden'>
              {/* Toolbar */}
              <div className='flex items-center gap-1 p-2 border-b border-gray-300 bg-gray-50 overflow-x-auto'>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Format'
                >
                  <Wand2 className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Bold'
                >
                  <Bold className='w-4 h-4 font-bold' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Underline'
                >
                  <Underline className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Italic'
                >
                  <Italic className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Strikethrough'
                >
                  <Strikethrough className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Text Color'
                >
                  <Palette className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Bullet List'
                >
                  <List className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Numbered List'
                >
                  <ListOrdered className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Align Left'
                >
                  <AlignLeft className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Align Center'
                >
                  <AlignCenter className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Align Right'
                >
                  <AlignRight className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Link'
                >
                  <Link2 className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Image'
                >
                  <ImageIcon className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Code'
                >
                  <Code className='w-4 h-4' />
                </button>
                <button
                  className='p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer flex-shrink-0'
                  title='Fullscreen'
                >
                  <Maximize2 className='w-4 h-4' />
                </button>
              </div>
              {/* Text Area */}
              <textarea
                value={formData.ticketDetails}
                onChange={e => handleChange('ticketDetails', e.target.value)}
                rows={4}
                className='w-full px-4 py-3 focus:outline-none resize-none text-gray-900'
              />
              {errors.ticketDetails && (
                <p className='text-red-600 text-xs mt-1 px-2'>
                  {errors.ticketDetails}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List Card */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <h2 className='text-lg font-semibold text-slate-900'>Ticket List</h2>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative flex items-center'>
              <input
                type='text'
                placeholder='Search'
                className='h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
              <Search className='absolute left-3 h-4 w-4 text-[#A6AEC7]' />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <IoFilterSharp className='h-4 w-4 text-[#8B93AF]' />
              Filters
            </button>
            <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <svg
                className='h-4 w-4 text-[#8B93AF]'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                />
              </svg>
            </button>
          </div>
        </div>

        <div className='overflow-visible rounded-2xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1fr_1fr_1fr_1fr_60px] gap-3 bg-[#F7F9FD] px-6 py-4'>
            <div>
              <TableHeaderCell>Added On</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Ticket Name</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Ticket Type</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Group Size</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Ticket Price</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Ticket Count</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Tickets Left</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Status</TableHeaderCell>
            </div>
            <div></div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {loading && (
              <div className='px-6 py-5 text-sm text-[#5E6582]'>Loading...</div>
            )}
            {error && !loading && (
              <div className='px-6 py-5 text-sm text-red-600'>{error}</div>
            )}
            {!loading &&
              !error &&
              tickets.map((ticket, idx) => (
                <div
                  key={ticket._id || ticket.id || idx}
                  className='grid grid-cols-[1.5fr_2fr_1.5fr_1fr_1fr_1fr_1fr_1fr_60px] gap-3 px-6 py-5 hover:bg-[#F9FAFD]'
                >
                  <div className='self-center text-sm text-[#5E6582]'>
                    {(() => {
                      const d = ticket.createdAt || ticket.updatedAt
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
                    })()}
                  </div>
                  <div className='self-center text-sm font-medium text-slate-900'>
                    {ticket.ticketName || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {String(ticket.ticketType).toLowerCase() === 'group'
                      ? 'Group Ticket'
                      : 'Regular Ticket'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {ticket.groupSize ?? '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {ticket.perTicketPrice ?? '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {ticket.ticketCount ?? '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {typeof ticket.ticketLeft === 'number'
                      ? ticket.ticketLeft
                      : '-'}
                  </div>
                  <div className='flex items-center self-center'>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                        ticket.status
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {ticket.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className='flex items-center justify-center self-center relative'>
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === (ticket._id || ticket.id || idx)
                            ? null
                            : ticket._id || ticket.id || idx
                        )
                      }
                      className='rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </button>
                    {activeDropdown === (ticket._id || ticket.id || idx) && (
                      <div
                        ref={dropdownRef}
                        className='absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-[#E5E8F5] z-50'
                      >
                        <div className='py-1'>
                          <button
                            onClick={() => {
                              startEdit(ticket._id || ticket.id)
                              setActiveDropdown(null)
                            }}
                            className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                          >
                            Edit Ticket
                          </button>
                          <button
                            onClick={() => {
                              setConfirmId(ticket._id || ticket.id)
                              setConfirmOpen(true)
                              setActiveDropdown(null)
                            }}
                            className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50'
                          >
                            Delete Ticket
                          </button>
                        </div>
                      </div>
                    )}
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
                className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
                disabled={deleting}
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
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title={toastContent.title}
        description={toastContent.description}
        variant={toastContent.variant}
        duration={2500}
        position='top-right'
      />
    </div>
  )
}
