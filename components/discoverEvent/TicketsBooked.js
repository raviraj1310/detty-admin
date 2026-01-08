'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  ArrowLeft,
  Ticket,
  CheckCircle,
  XCircle,
  User,
  Tag,
  Loader2
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getEventTicketSummary,
  getEventBookedTickets,
  getEventBookedTicket,
  downloadBookedTickets
} from '@/services/discover-events/event.service'
import * as XLSX from 'xlsx'
import Modal from '@/components/ui/Modal'

const metricCards = [
  {
    id: 'total',
    title: 'Total Tickets',
    value: '0',
    iconSrc: '/images/backend/icons/icons (1).svg',
    bg: 'bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF]',
    iconBg: 'bg-white',
    textColor: 'text-indigo-600'
  },
  {
    id: 'booked',
    title: 'Tickets Booked',
    value: '0',
    iconSrc: '/images/backend/icons/icons (5).svg',
    bg: 'bg-gradient-to-r from-[#E8F8F0] to-[#B8EDD0]',
    iconBg: 'bg-white',
    textColor: 'text-emerald-600'
  },
  {
    id: 'unbooked',
    title: 'Unbooked Tickets',
    value: '0',
    iconSrc: '/images/backend/icons/icons (6).svg',
    bg: 'bg-gradient-to-r from-[#FFE8E8] to-[#FFC5C5]',
    iconBg: 'bg-white',
    textColor: 'text-red-600'
  }
]

const bookingRows = []

const MetricCard = ({ title, value, iconSrc, bg, iconBg, textColor }) => (
  <div
    className={`${bg} rounded-xl p-3 relative overflow-hidden shadow-md border border-gray-100`}
  >
    <div className='flex items-center justify-between'>
      {/* Icon on the left */}
      <div className={`${iconBg} p-2.5 rounded-xl flex-shrink-0`}>
        <img src={iconSrc} alt={title} className='w-6 h-6' />
      </div>

      {/* Content on the right */}
      <div className='text-right'>
        <p className={`${textColor} opacity-80 text-xs font-medium mb-1`}>
          {title}
        </p>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      </div>
    </div>
  </div>
)

const TableHeaderCell = ({ children, align = 'left' }) => (
  <div
    className={`flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC] ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } whitespace-nowrap overflow-hidden`}
  >
    <span className='truncate max-w-full'>{children}</span>
    <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2] flex-shrink-0' />
  </div>
)

export default function TicketsBooked () {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id
  const [searchTerm, setSearchTerm] = useState('')
  const [summary, setSummary] = useState({
    total: 0,
    booked: 0,
    unbooked: 0,
    totalAmount: '-',
    bookedAmount: '-',
    unbookedAmount: '-'
  })
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const toTime = v => {
          const x = typeof v === 'object' && v && v.$date ? v.$date : v
          const t = Date.parse(x)
          return Number.isFinite(t) ? t : 0
        }
        if (eventId) {
          const [summaryRes, bookingsRes] = await Promise.all([
            getEventTicketSummary(eventId),
            getEventBookedTickets(eventId)
          ])
          const s = summaryRes?.data || {}
          setSummary({
            total: Number(s.totalTicket) || 0,
            booked: Number(s.totalBooked) || 0,
            unbooked:
              Number(s.totalAvailableTicket) ||
              Math.max(
                0,
                (Number(s.totalTicket) || 0) - (Number(s.totalBooked) || 0)
              ),
            totalAmount: '-',
            bookedAmount: '-',
            unbookedAmount: '-',
            eventName: s.eventName || 'Event'
          })
          const rawList = Array.isArray(bookingsRes?.data?.tickets)
            ? bookingsRes.data.tickets
            : Array.isArray(bookingsRes?.tickets)
            ? bookingsRes.tickets
            : Array.isArray(bookingsRes?.data)
            ? bookingsRes.data
            : []
          const list = rawList.map((b, idx) => ({
            ...b,
            id: b.bookingId || b._id || `booking-${idx}`,
            arrivalDate: b.arrivalDate || null,
            bookedOn: b.createdAt || '-',
            userName: b.buyer && b.buyer.fullName ? b.buyer.fullName : '-',
            email: b.buyer && b.buyer.email ? b.buyer.email : '-',
            phoneNumber: b.buyer && b.buyer.phone ? b.buyer.phone : '-',
            ticketsBooked: `${
              typeof b.quantity === 'number' ? b.quantity : '-'
            } x ${b.ticketName || '-'}`,
            amount: typeof b.totalPrice === 'number' ? b.totalPrice : '-',
            paymentStatus: String(b.paymentStatus || 'Pending'),
            status: String(b.status || 'Pending'),
            attendees: Array.isArray(b.attendees) ? b.attendees : [],
            ticketId: b.ticketId
          }))

          // Calculate stats from unique ticket types in the list
          const uniqueTickets = new Map()
          list.forEach(b => {
            if (b.ticketId && b.ticketId._id) {
              uniqueTickets.set(b.ticketId._id, b.ticketId)
            }
          })

          let totalSold = 0
          let totalLeft = 0

          uniqueTickets.forEach(t => {
            totalSold += Number(t.ticketCount || 0)
            totalLeft += Number(t.ticketLeft || 0)
          })

          const calculatedBooked = list.reduce(
            (acc, curr) => acc + (Number(curr.quantity) || 0),
            0
          )

          setSummary({
            total:
              totalSold > 0
                ? totalSold + totalLeft
                : Number(s.totalTicket) || 0,
            booked:
              totalSold > 0
                ? totalSold
                : Number(s.totalBooked) || calculatedBooked,
            unbooked:
              totalLeft > 0
                ? totalLeft
                : Number(s.totalAvailableTicket) ||
                  Math.max(
                    0,
                    (Number(s.totalTicket) || 0) -
                      (Number(s.totalBooked) || calculatedBooked)
                  ),
            totalAmount: '-',
            bookedAmount: '-',
            unbookedAmount: '-',
            eventName: s.eventName || 'Event'
          })

          const sorted = [...list].sort(
            (a, b) => toTime(b.bookedOn) - toTime(a.bookedOn)
          )
          setBookings(sorted)
        } else {
          const res = await getEventBookedTicket()
          const raw = Array.isArray(res?.data?.tickets)
            ? res.data.tickets
            : Array.isArray(res?.tickets)
            ? res.tickets
            : Array.isArray(res?.data)
            ? res.data
            : []
          const list = raw.map((b, idx) => ({
            id: b.bookingId || b._id || `booking-${idx}`,
            bookedOn: b.createdAt || '-',
            userName: b.buyer && b.buyer.fullName ? b.buyer.fullName : '-',
            email: b.buyer && b.buyer.email ? b.buyer.email : '-',
            phoneNumber: b.buyer && b.buyer.phone ? b.buyer.phone : '-',
            ticketsBooked: `${
              typeof b.quantity === 'number' ? b.quantity : '-'
            } x ${b.ticketName || '-'}`,
            amount: typeof b.totalPrice === 'number' ? b.totalPrice : '-',
            paymentStatus: String(b.paymentStatus || 'Pending'),
            status: String(b.status || 'Pending'),
            attendees: Array.isArray(b.attendees) ? b.attendees : [],
            buyer: b.buyer || null,
            event: b.event || null,
            arrivalDate: b.arrivalDate || null,
            quantity: b.quantity,
            ticketId: b.ticketId
          }))

          // Calculate stats from unique ticket types in the list
          const uniqueTickets = new Map()
          list.forEach(b => {
            if (b.ticketId && b.ticketId._id) {
              uniqueTickets.set(b.ticketId._id, b.ticketId)
            }
          })

          let totalSold = 0
          let totalLeft = 0

          uniqueTickets.forEach(t => {
            totalSold += Number(t.ticketCount || 0)
            totalLeft += Number(t.ticketLeft || 0)
          })

          const calculatedBooked = list.reduce(
            (acc, curr) => acc + (Number(curr.quantity) || 0),
            0
          )

          setSummary({
            total: totalSold > 0 ? totalSold + totalLeft : 0,
            booked: totalSold > 0 ? totalSold : calculatedBooked,
            unbooked: totalLeft > 0 ? totalLeft : 0,
            totalAmount: '-',
            bookedAmount: '-',
            unbookedAmount: '-'
          })
          const sorted = [...list].sort(
            (a, b) => toTime(b.bookedOn) - toTime(a.bookedOn)
          )
          setBookings(sorted)
        }
      } catch (e) {
        setError('Failed to load bookings')
        setSummary({
          total: 0,
          booked: 0,
          unbooked: 0,
          totalAmount: '-',
          bookedAmount: '-',
          unbookedAmount: '-'
        })
        setBookings([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [eventId])

  useEffect(() => {
    const onDocClick = e => {
      const el = e.target.closest(
        '[data-row-menu="true"], [data-menu-overlay="true"]'
      )
      if (!el) setMenuOpenId(null)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

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

  const filteredBookings = bookings.filter(booking => {
    const term = String(searchTerm || '').toLowerCase()
    if (!term) return true

    const userName = String(booking.userName || '').toLowerCase()
    const email = String(booking.email || '').toLowerCase()
    const phone = String(booking.phoneNumber || '').toLowerCase()

    // 🔹 Format bookedOn to a searchable string
    let bookedOnStr = ''
    if (booking.bookedOn) {
      const dt = new Date(booking.bookedOn)
      if (!isNaN(dt)) {
        bookedOnStr = dt
          .toLocaleString(undefined, {
            weekday: 'short',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          .toLowerCase()
      }
    }

    // 🔹 Also allow numeric search on date parts
    const bookedOnDigits = bookedOnStr.replace(/[^0-9]/g, '')
    const termDigits = term.replace(/[^0-9]/g, '')

    return (
      userName.includes(term) ||
      email.includes(term) ||
      phone.includes(term) ||
      bookedOnStr.includes(term) ||
      (termDigits && bookedOnDigits.includes(termDigits))
    )
  })

  const handleBack = () => {
    router.push('/discover-events')
  }

  const openTicket = booking => {
    const id = toIdString(booking._id || booking.id || booking.bookingId)
    const eid = booking.eventId || (booking.event && booking.event._id) || ''
    const qs = eid ? `?eventId=${encodeURIComponent(String(eid))}` : ''
    if (id) {
      router.push(
        `/discover-events/tickets-booked/view/${encodeURIComponent(
          String(id)
        )}${qs}`
      )
    } else {
      setSelectedBooking(booking)
      setTicketOpen(true)
    }
    setMenuOpenId(null)
  }

  const openCustomer = booking => {
    setSelectedBooking(booking)
    setCustomerOpen(true)
    setMenuOpenId(null)
  }

  const downloadReceipt = booking => {
    const id = toIdString(booking._id || booking.id || booking.bookingId)
    const eid = toIdString(
      booking.eventId || (booking.event && booking.event._id)
    )
    if (!id) {
      alert('Invalid booking id')
      return
    }
    if (
      !(
        (booking.buyer && booking.buyer.fullName) ||
        (Array.isArray(booking.attendees) && booking.attendees.length > 0)
      )
    ) {
      alert('Buyer or attendee details missing for this booking')
      return
    }
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
        const blob = await downloadBookedTickets(id, eid)
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

  const handleDownloadExcel = () => {
    if (!bookings || bookings.length === 0) {
      alert('No data to download')
      return
    }

    const toLocal = v => {
      if (!v) return '-'
      const x = typeof v === 'object' && v.$date ? v.$date : v
      const t = Date.parse(x)
      return Number.isFinite(t) ? new Date(x).toLocaleDateString() : String(v)
    }

    const dataToExport = bookings.map(b => ({
      'Booking ID': b.bookingId || b.id || '',
      'Booked On': toLocal(b.bookedOn || b.createdAt || b.updatedAt),
      'Payment Status': b.paymentStatus || '-',
      Status: b.status || '-',
      'Event ID': (b.event && (b.event._id || b.event.id)) || '',
      'Event Name': (b.event && b.event.eventName) || summary?.eventName || '-',
      'Event Slug': (b.event && b.event.slug) || '-',
      Location: (b.event && b.event.location) || '-',
      'Event Start Date': toLocal(b.event && b.event.eventStartDate),
      'Event End Date': toLocal(b.event && b.event.eventEndDate),
      Image: (b.event && b.event.image) || '-',
      'Buyer Name': (b.buyer && b.buyer.fullName) || b.userName || '-',
      'Buyer Email': (b.buyer && b.buyer.email) || b.email || '-',
      'Buyer Country': (b.buyer && b.buyer.country) || '-',
      'Buyer City': (b.buyer && b.buyer.city) || '-',
      'Buyer Phone': (b.buyer && b.buyer.phone) || b.phoneNumber || '-',
      'User Name': (b.user && (b.user.name || b.user.fullName)) || '-',
      'User Email': (b.user && b.user.email) || '-',
      'Ticket Name': b.ticketName || '-',
      'Ticket Type': b.ticketType || '-',
      Quantity: typeof b.quantity === 'number' ? b.quantity : 0,
      'Price Per Ticket':
        (b.ticketId && b.ticketId.perTicketPrice) ||
        (typeof b.perTicketPrice === 'number' ? b.perTicketPrice : 0),
      'Total Price':
        typeof b.totalPrice === 'number'
          ? b.totalPrice
          : typeof b.amount === 'number'
          ? b.amount
          : 0,
      'Arrival Date': toLocal(b.arrivalDate)
      // Attendees: Array.isArray(b.attendees)
      //   ? b.attendees.map(a => a.fullName).join(', ')
      //   : '-'
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings')

    const nameForFile = (
      'all events bookings' ||
      summary?.eventName ||
      'Event Bookings'
    ).replace(/[\\/:*?"<>|]+/g, '-')
    const filename = `${nameForFile}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const formatEventDateWthOutTime = isoDate => {
    if (!isoDate) return '-'
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return '-'
    const options = {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    }
    return date.toLocaleString('en-US', options)
  }

  return (
    <div className='space-y-4 py-4 px-6'>
      {/* Header */}
      <div className='flex flex-col gap-1 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>
            Tickets Booked - {summary?.eventName || 'Event'}
          </h1>
          <p className='text-xs text-[#99A1BC]'>Dashboard / Tickets Booked</p>
        </div>
        <div className='flex items-center'>
          <button
            onClick={handleBack}
            className='rounded-xl border border-[#E5E6EF] bg-white px-4 py-2 text-xs font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
          >
            <span className='flex items-center gap-1.5'>
              <ArrowLeft className='h-4 w-4' />
              Back to Discover Events
            </span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
        {metricCards.map(card => {
          const value =
            card.id === 'total'
              ? summary?.total || card.value
              : card.id === 'booked'
              ? summary?.booked || card.value
              : summary?.unbooked || card.value

          return (
            <MetricCard
              key={card.id}
              title={card.title}
              value={String(value)}
              iconSrc={card.iconSrc}
              bg={card.bg}
              iconBg={card.iconBg}
              textColor={card.textColor}
            />
          )
        })}
      </div>

      {/* Tickets Booked List */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold text-slate-900'>
            Tickets Booked List
          </h2>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='relative flex items-center'>
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-8 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] pl-8 pr-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
              <Search className='absolute left-2.5 h-3.5 w-3.5 text-[#A6AEC7]' />
            </div>
            <button className='flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <IoFilterSharp className='h-3.5 w-3.5 text-[#8B93AF]' />
              Filters
            </button>
            <button
              onClick={handleDownloadExcel}
              className='flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
            >
              <Download className='h-3.5 w-3.5 text-[#8B93AF]' />
            </button>
          </div>
        </div>

        <div
          className='overflow-x-auto overflow-y-hidden rounded-2xl border border-[#E5E8F5]'
          onScroll={() => setMenuOpenId(null)}
        >
          <div className='min-w-[1300px]'>
            <div className='grid grid-cols-[14%_14%_16%_12%_14%_10%_10%_10%_10%] gap-2 bg-[#F7F9FD] px-6 py-4'>
              <div>
                <TableHeaderCell>Booked On</TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell>User Name</TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell>Email Id</TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell>Phone Number</TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell>Tickets Booked</TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell>Amount</TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell>Arrival Date</TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell>Payment Status</TableHeaderCell>
              </div>
              <div className='flex justify-end'>
                <TableHeaderCell align='right'>Activity Status</TableHeaderCell>
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
                filteredBookings.map((booking, idx) => {
                  const rowKey = String(
                    booking._id || booking.id || booking.bookingId || idx
                  )
                  return (
                    <div
                      key={`${
                        booking._id ||
                        booking.id ||
                        booking.bookingId ||
                        'booking'
                      }-${idx}`}
                      className='grid grid-cols-[14%_14%_16%_12%_14%_10%_10%_10%_10%] gap-2 px-6 py-5 hover:bg-[#F9FAFD]'
                    >
                      <div className='text-sm text-[#5E6582] truncate'>
                        {(() => {
                          const d =
                            booking.bookedOn ||
                            booking.createdAt ||
                            booking.updatedAt
                          const date = d
                            ? new Date(
                                typeof d === 'object' && d.$date ? d.$date : d
                              )
                            : null
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
                      <div className='text-sm font-semibold text-slate-900 truncate'>
                        {(booking.buyer && booking.buyer.fullName) || '-'}
                        {/* {Array.isArray(booking.attendees) &&
                          booking.attendees.length > 0 && (
                            <div className='mt-1 text-xs font-normal text-[#5E6582] truncate'>
                              {booking.attendees
                                .map(a => a.fullName)
                                .join(', ')}
                            </div>
                          )} */}
                      </div>
                      <div className='text-sm text-[#5E6582] truncate'>
                        {(booking.buyer && booking.buyer.email) || '-'}
                        {/* {Array.isArray(booking.attendees) &&
                          booking.attendees.length > 0 && (
                            <div className='mt-1 text-xs truncate'>
                              {booking.attendees.map(a => a.email).join(', ')}
                            </div>
                          )} */}
                      </div>
                      <div className='text-sm text-[#5E6582] truncate'>
                        {(booking.buyer && booking.buyer.phone) || '-'}
                        {/* {Array.isArray(booking.attendees) &&
                          booking.attendees.length > 0 && (
                            <div className='mt-1 text-xs truncate'>
                              {booking.attendees
                                .map(a => a.phone || '-')
                                .join(', ')}
                            </div>
                          )} */}
                      </div>
                      <div className='text-sm text-[#5E6582] truncate'>
                        {booking.ticketsBooked || booking.ticketName || '-'}
                      </div>
                      <div className='text-sm font-semibold text-slate-900 whitespace-nowrap'>
                        {(() => {
                          const amt =
                            typeof booking.amount === 'number'
                              ? booking.amount
                              : typeof booking.totalPrice === 'number'
                              ? booking.totalPrice
                              : null
                          return amt != null
                            ? `₦${amt.toLocaleString()}`
                            : booking.amount || booking.totalPrice || '-'
                        })()}
                      </div>

                      <div className='text-sm font-semibold text-slate-900 whitespace-nowrap'>
                        {formatEventDateWthOutTime(booking.arrivalDate) || '-'}
                      </div>
                      <div className='flex items-center'>
                        {(() => {
                          const perTicketPrice =
                            (booking?.ticketId &&
                            typeof booking.ticketId.perTicketPrice === 'number'
                              ? booking.ticketId.perTicketPrice
                              : undefined) ??
                            (typeof booking?.perTicketPrice === 'number'
                              ? booking.perTicketPrice
                              : undefined) ??
                            (typeof booking?.unitPrice === 'number'
                              ? booking.unitPrice
                              : undefined) ??
                            (typeof booking?.pricePerTicket === 'number'
                              ? booking.pricePerTicket
                              : undefined) ??
                            (typeof booking?.price === 'number'
                              ? booking.price
                              : undefined)
                          const displayPaymentStatus =
                            perTicketPrice === 0
                              ? 'Completed'
                              : booking.paymentStatus || booking.payment || '-'
                          const status =
                            String(displayPaymentStatus).toLowerCase()
                          const statusClass =
                            status === 'completed'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : status === 'failed'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          return (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass} whitespace-nowrap`}
                            >
                              {displayPaymentStatus}
                            </span>
                          )
                        })()}
                      </div>
                      <div className='flex items-center justify-end gap-3'>
                        {(() => {
                          const perTicketPrice =
                            (booking?.ticketId &&
                            typeof booking.ticketId.perTicketPrice === 'number'
                              ? booking.ticketId.perTicketPrice
                              : undefined) ??
                            (typeof booking?.perTicketPrice === 'number'
                              ? booking.perTicketPrice
                              : undefined) ??
                            (typeof booking?.unitPrice === 'number'
                              ? booking.unitPrice
                              : undefined) ??
                            (typeof booking?.pricePerTicket === 'number'
                              ? booking.pricePerTicket
                              : undefined) ??
                            (typeof booking?.price === 'number'
                              ? booking.price
                              : undefined)
                          const displayActivityStatus =
                            perTicketPrice === 0
                              ? 'Completed'
                              : booking.status || '-'
                          const status = String(
                            displayActivityStatus
                          ).toLowerCase()
                          const statusClass =
                            status === 'scanned'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : status === 'canceled' || status === 'cancelled'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : status === 'pending'
                              ? 'bg-gray-100 text-gray-600 border border-gray-200'
                              : 'bg-orange-50 text-orange-600 border border-orange-200'
                          return (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass} whitespace-nowrap`}
                            >
                              {displayActivityStatus}
                            </span>
                          )
                        })()}
                        <div
                          className='relative flex items-center justify-center'
                          data-row-menu='true'
                        >
                          <button
                            onClick={e => {
                              if (menuOpenId === rowKey) {
                                setMenuOpenId(null)
                              } else {
                                const rect =
                                  e.currentTarget.getBoundingClientRect()
                                const widthPx = 208
                                const top = Math.round(rect.bottom + 6)
                                const left = Math.round(rect.right - widthPx)
                                setMenuPos({ top, left })
                                setMenuOpenId(rowKey)
                              }
                            }}
                            className='rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </button>
                          {menuOpenId === rowKey && (
                            <div
                              data-menu-overlay='true'
                              className='fixed min-w-48 w-52 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-50'
                              style={{ top: menuPos.top, left: menuPos.left }}
                            >
                              <button
                                onClick={() => openTicket(booking)}
                                className='flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                              >
                                <Ticket className='h-4 w-4' />
                                View Ticket
                              </button>
                              <button
                                onClick={() => openCustomer(booking)}
                                className='flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                              >
                                <User className='h-4 w-4' />
                                Customer Detail
                              </button>
                              {(() => {
                                const isDownloading =
                                  String(downloadingId || '') ===
                                  String(
                                    booking._id ||
                                      booking.id ||
                                      booking.bookingId ||
                                      ''
                                  )
                                return (
                                  <button
                                    onClick={() => downloadReceipt(booking)}
                                    disabled={isDownloading}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${
                                      isDownloading
                                        ? 'text-[#8C93AF] cursor-not-allowed opacity-70'
                                        : 'text-[#2D3658] hover:bg-[#F6F7FD]'
                                    }`}
                                  >
                                    {isDownloading ? (
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : (
                                      <Download className='h-4 w-4' />
                                    )}
                                    {isDownloading
                                      ? 'Processing…'
                                      : 'Download Receipt'}
                                  </button>
                                )
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              {!loading && !error && filteredBookings.length === 0 && (
                <div className='px-6 py-5 text-sm text-[#5E6582]'>
                  No bookings found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {ticketOpen && selectedBooking && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              setTicketOpen(false)
              setSelectedBooking(null)
            }}
          />
          <div className='relative z-50 w-full max-w-lg rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='text-lg font-semibold text-slate-900 mb-3'>
              Ticket
            </div>
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
                  {selectedBooking.totalPrice ||
                    selectedBooking.totalPrice ||
                    '-'}
                </span>
              </div>
              {/* {Array.isArray(selectedBooking.attendees) &&
                selectedBooking.attendees.length > 0 && (
                  <div>
                    <div className='font-medium'>Attendees</div>
                    <div className='mt-1 text-xs text-[#5E6582]'>
                      {selectedBooking.attendees
                        .map(a => `${a.fullName || '-'} (${a.email || '-'})`)
                        .join(', ')}
                    </div>
                  </div>
                )} */}
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
          </div>
        </div>
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
                  {(() => {
                    const b = selectedBooking
                    const c =
                      b.buyer ||
                      (Array.isArray(b.attendees) && b.attendees[0]) ||
                      {}
                    return c.fullName || '-'
                  })()}
                </div>
                <div className='text-[#5E6582]'>Email Address</div>
                <div className='text-right font-semibold text-slate-900'>
                  {(() => {
                    const b = selectedBooking
                    const c =
                      b.buyer ||
                      (Array.isArray(b.attendees) && b.attendees[0]) ||
                      {}
                    return c.email || '-'
                  })()}
                </div>
                <div className='text-[#5E6582]'>Phone</div>
                <div className='text-right font-semibold text-slate-900'>
                  {(() => {
                    const b = selectedBooking
                    const c =
                      b.buyer ||
                      (Array.isArray(b.attendees) && b.attendees[0]) ||
                      {}
                    return c.phone || '-'
                  })()}
                </div>
              </div>
            </div>

            {/* {Array.isArray(selectedBooking.attendees) &&
              selectedBooking.attendees.length > 0 && (
                <div className='rounded-xl border border-[#E5E8F6] bg-white p-4'>
                  <div className='text-sm font-semibold text-slate-900 mb-3'>
                    Attendees
                  </div>
                  <div className='space-y-2'>
                    {selectedBooking.attendees.map((a, i) => (
                      <div
                        key={`att-${i}`}
                        className='grid grid-cols-2 gap-4 text-sm'
                      >
                        <div className='text-[#5E6582]'>
                          {a.fullName || '-'}
                        </div>
                        <div className='text-right text-[#2D3658]'>
                          {a.email || a.phone || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

            <div className='rounded-xl bg-orange-50 p-4'>
              <div className='flex items-center justify-between text-sm font-semibold text-slate-900 mb-3'>
                <span>
                  Order ID{' '}
                  {selectedBooking._id ||
                    selectedBooking.id ||
                    selectedBooking.bookingId ||
                    '-'}
                </span>
                <span>
                  {(() => {
                    const amt =
                      selectedBooking.totalPrice || selectedBooking.totalPrice
                    return typeof amt === 'number'
                      ? `₦${amt.toLocaleString()}`
                      : amt || '-'
                  })()}
                </span>
              </div>
              <div className='flex items-center justify-between text-sm text-[#2D3658]'>
                <span>
                  {(() => {
                    const q = selectedBooking.quantity
                    const nm = selectedBooking.ticketName || 'Ticket'
                    const unit =
                      typeof selectedBooking.unitPrice === 'number'
                        ? selectedBooking.unitPrice
                        : null
                    const unitStr = unit ? `₦${unit.toLocaleString()}` : ''
                    const qtyStr =
                      typeof q === 'number'
                        ? `${unitStr} x ${q} ${nm}`
                        : `${selectedBooking.ticketsBooked || nm}`
                    return qtyStr
                  })()}
                </span>
                <span>
                  {(() => {
                    const amt =
                      selectedBooking.totalPrice || selectedBooking.totalPrice
                    return typeof amt === 'number'
                      ? `₦${amt.toLocaleString()}`
                      : amt || '-'
                  })()}
                </span>
              </div>
            </div>

            <div className='mt-4 pt-4 border-t border-[#EEF1FA]'>
              <div className='flex items-center justify-between'>
                <span className='text-base font-semibold text-slate-900'>
                  Total
                </span>
                <span className='flex items-center gap-2 text-base font-bold text-slate-900'>
                  <Tag className='h-4 w-4 text-orange-500' />
                  {(() => {
                    const amt =
                      selectedBooking.totalPrice || selectedBooking.totalPrice
                    return typeof amt === 'number'
                      ? `₦${amt.toLocaleString()}`
                      : amt || '-'
                  })()}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
