'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getBookingList,
  downloadBookingReceipt
} from '../../services/booking/booking.service'
import Modal from '@/components/ui/Modal'

function ActionDropdown ({ transactionId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })

  const actions = [
    {
      label: 'View Detail',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
          />
        </svg>
      )
    },
    {
      label: 'Download Receipt',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
          />
        </svg>
      )
    },
    {
      label: 'Dispute Transaction',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          />
        </svg>
      )
    }
  ]

  const handleButtonClick = e => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const dropdownHeight = 150

      let top = rect.bottom + 8
      let right = window.innerWidth - rect.right

      if (top + dropdownHeight > windowHeight) {
        top = rect.top - dropdownHeight - 8
      }

      setButtonPosition({ top, right })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className='relative'>
      <button
        data-menu-button
        onClick={handleButtonClick}
        className='p-1 hover:bg-gray-100 rounded-full transition-colors'
      >
        <svg
          className='w-5 h-5 text-gray-600'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsOpen(false)}
          />
          <div
            data-menu-content
            className='fixed w-52 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 py-2'
            style={{
              top: `${buttonPosition.top}px`,
              right: `${buttonPosition.right}px`
            }}
          >
            {actions.map((action, index) => (
              <button
                key={index}
                className='flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                onClick={() => {
                  console.log(
                    `${action.label} for transaction ${transactionId}`
                  )
                  setIsOpen(false)
                }}
              >
                <span className='mr-3 text-gray-500'>{action.icon}</span>
                <span className='text-gray-800'>{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: true },
  { id: 'event', label: 'Event', active: true },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: false },
  { id: 'accommodation', label: 'Accommodation', active: false },
  // { id: 'diy', label: 'DIY', active: false },
]

export default function TransactionsForm () {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('event')
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

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

  const formatEventDate = (dateInput, timeInput) => {
    const raw =
      dateInput && typeof dateInput === 'object' && dateInput.$date
        ? dateInput.$date
        : dateInput
    const dt = raw ? new Date(raw) : null
    if (!dt || isNaN(dt.getTime())) return '-'
    const day = dt.toLocaleDateString(undefined, { weekday: 'short' })
    const month = dt.toLocaleDateString(undefined, { month: 'long' })
    const dayNum = dt.toLocaleDateString(undefined, { day: '2-digit' })
    const year = dt.toLocaleDateString(undefined, { year: 'numeric' })
    let timeStr = ''
    if (typeof timeInput === 'string' && timeInput.trim()) {
      timeStr = timeInput.trim()
    } else {
      timeStr = dt.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    return `${day}, ${month} ${dayNum}, ${year} at ${timeStr}`
  }

  const toTimestamp = v => {
    const raw = v && typeof v === 'object' && v.$date ? v.$date : v
    const dt = raw ? new Date(raw) : null
    return dt && !isNaN(dt.getTime()) ? dt.getTime() : 0
  }
  const toImageUrl = p => {
    const s = String(p || '').trim()
    if (!s) return null
    if (/^https?:\/\//i.test(s)) return s
    const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN
    const base = originEnv && originEnv.trim()
      ? originEnv.trim()
      : (typeof window !== 'undefined' && 'https://accessdettyfusion.com')
    const path = s.startsWith('/') ? s : `/${s}`
    return `${base}${path}`
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getBookingList()
        const raw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        const list = raw.map((b, idx) => ({
          id: b.bookingId || b._id || `booking-${idx}`,
          rowKey: `${String(b.bookingId || b._id || 'noid')}-${String(b.createdAt || b.updatedAt || idx)}`,
          bookedOn: b.createdAt || b.updatedAt || '-',
          eventName:
            b.event && (b.event.title || b.event.eventName)
              ? b.event.title || b.event.eventName
              : '-',
          eventImage: toImageUrl(b?.event?.image),
          type:
            b.event && (b.event.eventType || b.event.type)
              ? b.event.eventType || b.event.type
              : '-',
          ticketsBooked: `${
            typeof b.quantity === 'number' ? b.quantity : '-'
          } x ${b.ticketName || '-'}`,
          ticketsQty: typeof b.quantity === 'number' ? b.quantity : 0,
          additionalInfo: '',
          amount:
            typeof b.totalPrice === 'number'
              ? `₦${b.totalPrice.toLocaleString()}`
              : '-',
          amountNum:
            typeof b.totalPrice === 'number'
              ? b.totalPrice
              : Number(b.totalPrice) || 0,
          eventStatus: String(b.status || 'Pending'),
          paymentStatus: String(b.paymentStatus || 'Pending'),
          buyer: b.buyer || null,
          event: b.event || null,
          eventDateText: formatEventDate(
            b?.event?.eventStartDate,
            b?.event?.eventStartTime
          ),
          sortTs: Math.max(
            toTimestamp(b?.event?.eventStartDate),
            toTimestamp(b?.createdAt),
            toTimestamp(b?.updatedAt)
          ),
          raw: b
        }))
        setBookings(list)
      } catch (e) {
        setError('Failed to load bookings')
        setBookings([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredBookings = bookings
    .filter(booking => {
      const term = String(searchTerm || '')
        .trim()
        .toLowerCase()
      if (!term) return true
      const termDigits = term.replace(/[^0-9]/g, '')
      const name = String(
        booking.eventName || booking?.raw?.event?.eventName || ''
      ).toLowerCase()
      const type = String(booking.type || '').toLowerCase()
      const dateStr = String(
        booking.eventDateText || booking.bookedOn || ''
      ).toLowerCase()
      const dateDigits = String(
        booking.eventDateText || booking.bookedOn || ''
      ).replace(/[^0-9]/g, '')
      const matchesText =
        name.includes(term) || type.includes(term) || dateStr.includes(term)
      const matchesDigits = termDigits && dateDigits.includes(termDigits)
      return matchesText || matchesDigits
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const val = key => {
        switch (key) {
          case 'date':
            return a.sortTs - b.sortTs
          case 'name':
            return String(a.eventName || '').localeCompare(
              String(b.eventName || ''),
              undefined,
              { sensitivity: 'base' }
            )
          case 'type':
            return String(a.type || '').localeCompare(
              String(b.type || ''),
              undefined,
              { sensitivity: 'base' }
            )
          case 'tickets':
            return (a.ticketsQty || 0) - (b.ticketsQty || 0)
          case 'amount':
            return (a.amountNum || 0) - (b.amountNum || 0)
          case 'eventStatus':
            return String(a.eventStatus || '').localeCompare(
              String(b.eventStatus || ''),
              undefined,
              { sensitivity: 'base' }
            )
          case 'paymentStatus':
            return String(a.paymentStatus || '').localeCompare(
              String(b.paymentStatus || ''),
              undefined,
              { sensitivity: 'base' }
            )
          default:
            return a.sortTs - b.sortTs
        }
      }
      return dir * val(sortKey)
    })

  const toggleSort = key => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const openTicket = booking => {
    const raw = booking.raw || booking
    const id = toIdString(raw.bookingId || raw._id || booking.id)
    const eid = toIdString(raw?.event?._id || raw?.event?.id)
    const qs = eid ? `?eventId=${encodeURIComponent(String(eid))}` : ''
    if (id) {
      router.push(
        `/discover-events/tickets-booked/view/${encodeURIComponent(
          String(id)
        )}${qs}`
      )
      setMenuOpenId(null)
      return
    }
    setSelectedBooking(raw)
    setTicketOpen(true)
    setMenuOpenId(null)
  }

  const openCustomer = booking => {
    setSelectedBooking(booking.raw || booking)
    setCustomerOpen(true)
  }

  const downloadReceipt = booking => {
    const id = booking?.raw?.bookingId || booking?.raw?._id || booking?.id
    const eid =
      booking?.raw?.event?._id || booking?.raw?.event?.id || booking?.event?.id
    const inferExt = type => {
      const t = String(type || '').toLowerCase()
      if (t.includes('pdf')) return 'pdf'
      if (t.includes('png')) return 'png'
      if (t.includes('jpeg')) return 'jpg'
      if (t.includes('jpg')) return 'jpg'
      if (t.includes('webp')) return 'webp'
      if (t.includes('json')) return 'json'
      if (t.includes('text')) return 'txt'
      return 'bin'
    }
    ;(async () => {
      try {
        if (String(downloadingId || '') === String(id)) return
        setDownloadingId(id)
        const blob = await downloadBookingReceipt(id, eid)
        const type = String(blob?.type || '').toLowerCase()
        if (type.includes('json')) {
          const txt = await blob.text()
          try {
            const j = JSON.parse(txt)
            const msg = j?.message || 'Failed to download receipt'
            throw new Error(msg)
          } catch {
            throw new Error('Failed to download receipt')
          }
        }
        const url = URL.createObjectURL(blob)
        const ext = inferExt(type)
        const a = document.createElement('a')
        a.href = url
        a.download = `receipt-${id}.${ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Failed to download receipt'
        alert(msg)
      } finally {
        setDownloadingId(null)
        setMenuOpenId(null)
      }
    })()
  }

  const getEventStatusColor = status => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800'
      case 'Ongoing':
        return 'bg-blue-100 text-blue-800'
      case 'Upcoming':
        return 'bg-red-100 text-red-800'
      case 'TBL':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = status => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Incomplete':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='bg-gray-200 p-5 rounded-xl'>
        {/* Main Content */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0'>
          {/* Header with Search and Filters */}
          <div className='p-4 border-b border-gray-200 flex-shrink-0'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Booking List
              </h2>
              <div className='flex items-center space-x-4'>
                {/* Search */}
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500'
                  />
                  <svg
                    className='w-5 h-5 text-gray-600 absolute left-3 top-2.5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </div>

                {/* Filters */}
                <button className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'>
                  <svg
                    className='w-4 h-4 mr-2 text-gray-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z'
                    />
                  </svg>
                  <span className='text-gray-700 font-medium'>Filters</span>
                </button>

                {/* Download */}
                <button className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'>
                  <svg
                    className='w-4 h-4 text-gray-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3'
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className='flex space-x-2'>
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    switch (tab.id) {
                      case 'bundle-orders':
                        router.push('/users/bookings')
                        break
                      case 'event':
                        router.push('/users/transactions')
                        break
                      case 'activities':
                        router.push('/users/activities')
                        break
                      case 'accommodation':
                        router.push('/users/accommodation')
                        break
                      case 'diy':
                        router.push('/users/diy')
                        break
                      case 'merchandise':
                        router.push('/users/merchandise')
                        break
                      case 'e-sim':
                        router.push('/users/e-sim')
                        break
                      default:
                        setActiveTab(tab.id)
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    tab.id === activeTab
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className='flex-1 overflow-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('date')}
                      className='flex items-center'
                    >
                      <span>Event Date</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('name')}
                      className='flex items-center'
                    >
                      <span>Event Name</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('type')}
                      className='flex items-center'
                    >
                      <span>Type</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('tickets')}
                      className='flex items-center'
                    >
                      <span>Tickets Booked</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('amount')}
                      className='flex items-center'
                    >
                      <span>Amount</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('eventStatus')}
                      className='flex items-center'
                    >
                      <span>Event Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('paymentStatus')}
                      className='flex items-center'
                    >
                      <span>Payment Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-8 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20'></th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((booking, i) => (
                    <tr key={`${booking.rowKey || booking.id}-${i}`} className='hover:bg-gray-50'>
                      <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {booking.eventDateText || '-'}
                      </td>

                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='flex-shrink-0 h-10 w-10'>
                            {booking.eventImage ? (
                              <img
                                className='h-10 w-10 rounded-lg object-cover'
                                src={booking.eventImage}
                                alt={booking.eventName || 'Event image'}
                                onError={e => {
                                  e.target.style.display = 'none'
                                  const fb = e.target.nextSibling
                                  if (fb) fb.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div className='h-10 w-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center' style={{ display: booking.eventImage ? 'none' : 'flex' }}>
                              <svg
                                className='w-5 h-5 text-white'
                                fill='currentColor'
                                viewBox='0 0 20 20'
                              >
                                <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                              </svg>
                            </div>
                          </div>
                          <div className='ml-3'>
                            <div className='text-sm font-medium text-gray-900'>
                              {booking.eventName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className='px-4 py-4 whitespace-nowrap'>
                        <span className='text-sm font-medium text-gray-900'>
                          {booking.type}
                        </span>
                      </td>

                      <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                        <div>{booking.ticketsBooked}</div>
                        <div className='text-xs text-gray-500'>
                          {booking.additionalInfo}
                        </div>
                      </td>

                      <td className='px-4 py-4 whitespace-nowrap'>
                        <span className='text-sm font-semibold text-gray-900'>
                          {booking.amount}
                        </span>
                      </td>

                      <td className='px-4 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getEventStatusColor(
                            booking.eventStatus
                          )}`}
                        >
                          • {booking.eventStatus}
                        </span>
                      </td>

                      <td className='px-4 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            booking.paymentStatus
                          )}`}
                        >
                          {booking.paymentStatus}
                        </span>
                      </td>

                      <td className='px-8 py-4 whitespace-nowrap text-right'>
                        <div className='relative'>
                          <button
                            data-menu-button
                            onClick={e => {
                              const rect =
                                e.currentTarget.getBoundingClientRect()
                              const widthPx = 208
                              const top = Math.round(rect.bottom + 6)
                              const left = Math.round(rect.right - widthPx)
                              setMenuPos({ top, left })
                              setMenuOpenId(booking.id)
                            }}
                            className='p-1 hover:bg-gray-100 rounded-full transition-colors'
                          >
                            <svg
                              className='w-5 h-5 text-gray-600'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                            </svg>
                          </button>

                          {menuOpenId === booking.id && (
                            <div
                              data-menu-content
                              className='fixed w-52 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 py-2'
                              style={{
                                top: `${menuPos.top}px`,
                                left: `${menuPos.left}px`
                              }}
                            >
                              <button
                                onClick={() => openTicket(booking)}
                                className='flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                              >
                                <span className='mr-3 text-gray-500'>
                                  <svg
                                    className='h-4 w-4'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5'
                                    />
                                  </svg>
                                </span>
                                <span className='text-gray-800'>
                                  View Ticket
                                </span>
                              </button>

                              <button
                                onClick={() => openCustomer(booking)}
                                className='flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                              >
                                <span className='mr-3 text-gray-500'>
                                  <svg
                                    className='h-4 w-4'
                                    fill='none'
                                    stroke='currentColor'
                                    viewBox='0 0 24 24'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M5.121 17.804A2 2 0 016.999 17h10.002a2 2 0 011.878.804M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                                    />
                                  </svg>
                                </span>
                                <span className='text-gray-800'>
                                  Customer Detail
                                </span>
                              </button>

                              <button
                                onClick={() => downloadReceipt(booking)}
                                className='flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                              >
                                <span className='mr-3 text-gray-500'>
                                  {String(downloadingId || '') ===
                                  String(booking.id) ? (
                                    <svg
                                      className='h-4 w-4 animate-spin'
                                      viewBox='0 0 24 24'
                                    >
                                      <circle
                                        cx='12'
                                        cy='12'
                                        r='10'
                                        stroke='currentColor'
                                        strokeWidth='4'
                                        fill='none'
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      className='w-4 h-4'
                                      fill='none'
                                      stroke='currentColor'
                                      viewBox='0 0 24 24'
                                    >
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3'
                                      />
                                    </svg>
                                  )}
                                </span>
                                <span className='text-gray-800'>
                                  Download Ticket
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr key='no-booking'>
                    <td
                      colSpan='8'
                      className='px-4 py-4 text-center text-sm text-gray-500'
                    >
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {ticketOpen && selectedBooking && (
        <Modal
          open={ticketOpen}
          onOpenChange={v => {
            if (!v) {
              setTicketOpen(false)
              setSelectedBooking(null)
            }
          }}
          title={'Ticket'}
        >
          <div className='space-y-2 text-sm text-[#2D3658]'>
            <div className='flex justify-between'>
              <span>Booking ID</span>
              <span>
                {selectedBooking._id ||
                  selectedBooking.id ||
                  selectedBooking.bookingId ||
                  '-'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Booked On</span>
              <span>
                {(() => {
                  const d =
                    selectedBooking.bookedOn ||
                    selectedBooking.createdAt ||
                    selectedBooking.updatedAt
                  const date = d
                    ? new Date(typeof d === 'object' && d.$date ? d.$date : d)
                    : null
                  return date ? date.toLocaleString() : '-'
                })()}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Ticket</span>
              <span>
                {selectedBooking.ticketsBooked ||
                  selectedBooking.ticketName ||
                  '-'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Amount</span>
              <span>
                {typeof selectedBooking.totalPrice === 'number'
                  ? `₦${selectedBooking.totalPrice.toLocaleString()}`
                  : selectedBooking.amount || '-'}
              </span>
            </div>
          </div>
          <div className='mt-6 flex justify-end gap-3'>
            <button
              onClick={() => {
                setTicketOpen(false)
                setSelectedBooking(null)
              }}
              className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {customerOpen && selectedBooking && (
        <Modal
          open={customerOpen}
          onOpenChange={v => {
            if (!v) {
              setCustomerOpen(false)
              setSelectedBooking(null)
            }
          }}
          title={'Customer Details'}
        >
          <div className='space-y-6'>
            <div className='rounded-xl bg-[#F8F9FC] p-4'>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div className='text-[#5E6582]'>Full Name</div>
                <div className='text-right font-semibold text-slate-900'>
                  {selectedBooking?.buyer?.fullName || '-'}
                </div>
                <div className='text-[#5E6582]'>Email Address</div>
                <div className='text-right font-semibold text-slate-900'>
                  {selectedBooking?.buyer?.email || '-'}
                </div>
                <div className='text-[#5E6582]'>Phone</div>
                <div className='text-right font-semibold text-slate-900'>
                  {selectedBooking?.buyer?.phone || '-'}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
