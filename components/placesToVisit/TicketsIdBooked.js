'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Search, MoreVertical, Download, Ticket, User, Loader2 } from 'lucide-react';
import { IoFilterSharp } from "react-icons/io5";
import { TbCaretUpDownFilled } from "react-icons/tb";
import { getIdWiseActivityBookings, downloadActivityBookedTicket } from '@/services/places-to-visit/placesToVisit.service';
import Modal from '@/components/ui/Modal'
const metricCardsBase = {
  total: {
    id: 'total',
    title: 'Total Tickets',
    iconBg: 'bg-[#4F46E5]',
    iconColor: 'text-[#4F46E5]',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
  },
  booked: {
    id: 'booked',
    title: 'Tickets Booked',
    iconBg: 'bg-[#059669]',
    iconColor: 'text-[#059669]',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
      </svg>
    ),
  },
  unbooked: {
    id: 'unbooked',
    title: 'Unbooked Tickets',
    iconBg: 'bg-[#DC2626]',
    iconColor: 'text-[#DC2626]',
    icon: (
      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/>
      </svg>
    ),
  },
}

const statusClass = s => {
  const v = String(s || '').toLowerCase()
  if (v === 'paid' || v === 'completed') return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  if (v === 'pending' || v === 'incomplete') return 'bg-orange-50 text-orange-600 border border-orange-200'
  return 'bg-red-50 text-red-600 border border-red-200'
}
const statusActivityClass = s => {
  const v = String(s || '').toLowerCase()
  if (v === 'scanned') return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  if (v === 'canceled' || v === 'cancelled') return 'bg-red-50 text-red-600 border border-red-200'
  if (v === 'pending') return 'bg-gray-100 text-gray-600 border border-gray-200'
  return 'bg-orange-50 text-orange-600 border border-orange-200'
}

const TableHeaderCell = ({ children }) => (
  <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]">
    {children}
    <TbCaretUpDownFilled className="h-3.5 w-3.5 text-[#CBCFE2]" />
  </div>
);

export default function TicketsIdBooked({ activityId }) {
  const router = useRouter();
  const params = useParams();
  
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [metrics, setMetrics] = useState({ totalTickets: 0, totalAmount: 0, bookedTickets: 0, bookedAmount: 0, unbookedTickets: 0, unbookedAmount: 0 });
  const [headerName, setHeaderName] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  const fmtCurrency = n => `₦${Number(n || 0).toLocaleString('en-NG')}`
  const fmtDate = d => {
    if (!d) return '-'
    const date = new Date(typeof d === 'object' && d.$date ? d.$date : d)
    return date.toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  const ticketsText = tList => {
    if (!Array.isArray(tList)) return '-'
    return tList.map(t => `${t.quantity} x ${t.ticketName} (${fmtCurrency(t.perTicketPrice)})`).join('\n')
  }
  const ticketsTotal = b => {
    const list = Array.isArray(b?.tickets) ? b.tickets : []
    return list.reduce((sum, t) => sum + (Number(t.totalPrice || ((Number(t.perTicketPrice) || 0) * (Number(t.quantity) || 0))) || 0), 0)
  }

  useEffect(() => {
    const fetchBookings = async () => {
      const idFromParams = params?.id
      const pid = Array.isArray(idFromParams) ? idFromParams[0] : idFromParams
      const aidRaw = activityId ?? pid
      const aid = String(aidRaw || '').trim()
      if (!aid) return
      setLoading(true)
      setError('')
      try {
        const res = await getIdWiseActivityBookings(aid)
        const data = Array.isArray(res?.data) ? res.data : []
        const mapped = data.map(b => ({
          id: b._id || b.id,
          bookedOn: fmtDate(b.createdAt || b.updatedAt),
          userName: String(b?.buyer?.fullName || '-'),
          email: String(b?.buyer?.email || '-'),
          phoneNumber: String(b?.buyer?.phone || '-'),
          ticketsBooked: ticketsText(b?.tickets),
          amount: fmtCurrency(ticketsTotal(b)),
          arrivalDate: fmtDate(b?.arrivalDate),
          paymentStatus: String(b?.paymentStatus || '-').toLowerCase() === 'paid' ? 'Paid' : String(b?.paymentStatus || '-'),
          statusClass: statusClass(b?.paymentStatus),
          status: String(b?.status || b?.bookingStatus || 'Pending'),
          activityStatusClass: statusActivityClass(b?.status || b?.bookingStatus),
          raw: b
        }))
        setRows(mapped)
        setHeaderName(String(data?.[0]?.activityId?.activityName || ''))
        // Metrics
        const sumQuantities = list => list.reduce((acc, b) => acc + (Array.isArray(b.tickets) ? b.tickets.reduce((s, t) => s + Number(t.quantity || 0), 0) : 0), 0)
        const sumAmounts = list => list.reduce((acc, b) => acc + Number(b?.pricing?.total || 0), 0)
        const paidList = data.filter(b => String(b?.paymentStatus || '').toLowerCase() === 'paid')
        const totalTickets = sumQuantities(data)
        const totalAmount = sumAmounts(data)
        const bookedTickets = sumQuantities(paidList)
        const bookedAmount = sumAmounts(paidList)
        const unbookedTickets = totalTickets - bookedTickets
        const unbookedAmount = totalAmount - bookedAmount
        setMetrics({ totalTickets, totalAmount, bookedTickets, bookedAmount, unbookedTickets, unbookedAmount })
      } catch (e) {
        setError('Failed to load bookings')
        setRows([])
        setHeaderName('')
        setMetrics({ totalTickets: 0, totalAmount: 0, bookedTickets: 0, bookedAmount: 0, unbookedTickets: 0, unbookedAmount: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [activityId])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setMenuOpenId(null)
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const openTicket = booking => {
    const b = booking?.raw || booking || {}
    const id = toIdString(b._id || b.id || b.bookingId)
    const aid = toIdString(b.activityId || (b.activity && b.activity._id) || params?.id)
    const qs = aid ? `?activityId=${encodeURIComponent(String(aid))}` : ''
    if (id) {
      router.push(`/places-to-visit/tickets-booked/view/${encodeURIComponent(String(id))}${qs}`)
    } else {
      setSelectedBooking(b)
      setTicketOpen(true)
    }
    setActiveDropdown(null)
    setMenuOpenId(null)
  }

  const openCustomer = booking => {
    const b = booking?.raw || booking || {}
    setSelectedBooking(b)
    setCustomerOpen(true)
    setActiveDropdown(null)
    setMenuOpenId(null)
  }

  const downloadReceipt = booking => {
    const b = booking?.raw || booking || {}
    const id = toIdString(b._id || b.id || b.bookingId)
    const aid = toIdString(b.activityId || (b.activity && b.activity._id) || params?.id)
    if (!id) {
      alert('Invalid booking id')
      return
    }
    if (!((b.buyer && b.buyer.fullName) || (Array.isArray(b.tickets) && b.tickets.some(t => Array.isArray(t.attendees) && t.attendees.length > 0)))) {
      alert('Buyer or attendee details missing for this booking')
      return
    }
    ;(async () => {
      try {
        if (String(downloadingId || '') === String(id)) return
        setDownloadingId(id)
        const res = await downloadActivityBookedTicket(id, aid)
        const pdfUrl = res?.data?.pdfUrl || res?.pdfUrl || ''
        if (!pdfUrl) {
          const msg = res?.message || 'Failed to download ticket'
          throw new Error(msg)
        }
        try {
          const r = await fetch(pdfUrl)
          const blob = await r.blob()
          const a = document.createElement('a')
          const objectUrl = URL.createObjectURL(blob)
          a.href = objectUrl
          a.download = `ticket-${id}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(objectUrl)
        } catch {
          window.open(pdfUrl, '_blank')
        }
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || 'Failed to download ticket'
        alert(msg)
      } finally {
        setDownloadingId(null)
        setActiveDropdown(null)
        setMenuOpenId(null)
      }
    })()
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tickets Booked{headerName ? ` - ${headerName}` : ''}</h1>
        <p className="text-sm text-gray-500 mt-1">Dashboard / Tickets Booked</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { ...metricCardsBase.total, value: String(metrics.totalTickets), amount: `(${fmtCurrency(metrics.totalAmount)})` },
          { ...metricCardsBase.booked, value: String(metrics.bookedTickets), amount: `(${fmtCurrency(metrics.bookedAmount)})` },
          { ...metricCardsBase.unbooked, value: String(metrics.unbookedTickets), amount: `(${fmtCurrency(metrics.unbookedAmount)})` },
        ].map((card) => (
          <div
            key={card.id}
            className={`${card.iconBg} rounded-2xl p-6 text-white relative overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <div className="bg-white p-4 rounded-2xl flex-shrink-0">
                <div className={card.iconColor}>
                  {card.icon}
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/90 text-sm font-medium mb-2">{card.title}</p>
                <p className="text-3xl font-bold text-white">{card.value} <span className="text-lg font-normal">{card.amount}</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tickets Booked List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Tickets Booked List</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search"
                className="h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              />
              <Search className="absolute left-3 h-4 w-4 text-[#A6AEC7]" />
            </div>
            <button className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]">
              <IoFilterSharp className="h-4 w-4 text-[#8B93AF]" />
              Filters
            </button>
            <button className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]">
              <svg className="h-4 w-4 text-[#8B93AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E5E8F5]">
          <div className="grid grid-cols-[1.5fr_1.5fr_2fr_1.5fr_2fr_1fr_1.2fr_1fr_1.2fr_60px] gap-3 bg-[#F7F9FD] px-6 py-4">
            <div><TableHeaderCell>Booked On</TableHeaderCell></div>
            <div><TableHeaderCell>User Name</TableHeaderCell></div>
            <div><TableHeaderCell>Email Id</TableHeaderCell></div>
            <div><TableHeaderCell>Phone Number</TableHeaderCell></div>
            <div><TableHeaderCell>Tickets Booked</TableHeaderCell></div>
            <div><TableHeaderCell>Amount</TableHeaderCell></div>
            <div><TableHeaderCell>Arrival Date</TableHeaderCell></div>
            <div><TableHeaderCell>Payment Status</TableHeaderCell></div>
            <div><TableHeaderCell>Activity Status</TableHeaderCell></div>
            <div></div>
          </div>

          <div className="divide-y divide-[#EEF1FA] bg-white">
            {loading && <div className='px-6 py-5 text-sm text-[#5E6582]'>Loading...</div>}
            {error && !loading && <div className='px-6 py-5 text-sm text-red-600'>{error}</div>}
            {!loading && !error && rows.map((booking) => (
              <div
                key={booking.id}
                className="grid grid-cols-[1.5fr_1.5fr_2fr_1.5fr_2fr_1fr_1.2fr_1fr_1.2fr_60px] gap-3 px-6 py-5 hover:bg-[#F9FAFD]"
              >
                <div className="self-center text-sm text-[#5E6582]">{booking.bookedOn}</div>
                <div className="self-center text-sm font-medium text-slate-900">{booking.userName}</div>
                <div className="self-center text-sm text-[#5E6582]">{booking.email}</div>
                <div className="self-center text-sm text-[#5E6582]">{booking.phoneNumber}</div>
                <div className="self-center text-xs text-[#5E6582] leading-relaxed whitespace-pre-line">
                  {booking.ticketsBooked}
                </div>
                <div className="self-center text-sm font-semibold text-slate-900">{booking.amount}</div>
                <div className="self-center text-sm font-semibold text-slate-900">{booking.arrivalDate}</div>
                <div className="flex items-center self-center">
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${booking.statusClass}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
                <div className="flex items-center self-center">
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${booking.activityStatusClass}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex items-center justify-center self-center relative" data-row-menu="true">
                  <button
                    onClick={e => {
                      if (menuOpenId === booking.id) {
                        setMenuOpenId(null)
                        setActiveDropdown(null)
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const widthPx = 208
                        const top = Math.round(rect.bottom + 6)
                        const left = Math.round(rect.right - widthPx)
                        setMenuPos({ top, left })
                        setMenuOpenId(booking.id)
                        setActiveDropdown(booking.id)
                      }
                    }}
                    className="rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenId === booking.id && (
                    <div
                      ref={dropdownRef}
                      data-menu-overlay="true"
                      className="fixed min-w-48 w-52 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-50"
                      style={{ top: menuPos.top, left: menuPos.left }}
                    >
                      <button
                        onClick={() => openTicket(booking)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]"
                      >
                        <Ticket className="h-4 w-4" />
                        View Ticket
                      </button>
                      <button
                        onClick={() => openCustomer(booking)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]"
                      >
                        <User className="h-4 w-4" />
                        Customer Detail
                      </button>
                      {(() => {
                        const bid = toIdString((booking.raw && (booking.raw._id || booking.raw.id || booking.raw.bookingId)) || booking.id)
                        const isDownloading = String(downloadingId || '') === String(bid)
                        return (
                          <button
                            onClick={() => downloadReceipt(booking)}
                            disabled={isDownloading}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${isDownloading ? 'text-[#8C93AF] cursor-not-allowed opacity-70' : 'text-[#2D3658] hover:bg-[#F6F7FD]'}`}
                          >
                            {isDownloading ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Download className="h-4 w-4" />)}
                            {isDownloading ? 'Processing…' : 'Download Ticket'}
                          </button>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!loading && !error && rows.length === 0 && (
              <div className='px-6 py-5 text-sm text-[#5E6582]'>No bookings found</div>
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
              <span>{selectedBooking._id || selectedBooking.id || selectedBooking.bookingId || '-'}</span>
            </div>
            <div className='flex justify-between'>
              <span>Booked On</span>
              <span>{(() => { const d = selectedBooking.createdAt || selectedBooking.updatedAt; const date = d ? new Date(typeof d === 'object' && d.$date ? d.$date : d) : null; return date ? date.toLocaleString() : '-' })()}</span>
            </div>
            <div className='flex justify-between'>
              <span>Arrival Date</span>
              <span>{fmtDate(selectedBooking?.arrivalDate)}</span>
            </div>
            <div className='flex justify-between'>
              <span>Tickets</span>
              <span>{Array.isArray(selectedBooking.tickets) ? selectedBooking.tickets.map(t => `${t.quantity} x ${t.ticketName}`).join(', ') : '-'}</span>
            </div>
            <div className='flex justify-between'>
              <span>Amount</span>
              <span>{(() => { const amt = ticketsTotal(selectedBooking); return typeof amt === 'number' ? `₦${amt.toLocaleString()}` : amt || '-' })()}</span>
            </div>
          </div>
          <div className='mt-6 flex justify-end gap-3'>
            <button onClick={() => { setTicketOpen(false); setSelectedBooking(null) }} className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'>Close</button>
          </div>
        </div>
      </div>
    )}

    {customerOpen && selectedBooking && (
      <Modal
        open={customerOpen}
        onOpenChange={v => { if (!v) { setCustomerOpen(false); setSelectedBooking(null) } }}
        title={'Customer Details'}
      >
        <div className='space-y-6'>
          <div className='rounded-xl bg-[#F8F9FC] p-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div className='text-[#5E6582]'>Full Name</div>
              <div className='text-right font-semibold text-slate-900'>
                {(() => { const c = selectedBooking.buyer || (Array.isArray(selectedBooking.tickets) && selectedBooking.tickets[0]?.attendees?.[0]) || {}; return c?.fullName || '-' })()}
              </div>
              <div className='text-[#5E6582]'>Email Address</div>
              <div className='text-right font-semibold text-slate-900'>
                {(() => { const c = selectedBooking.buyer || (Array.isArray(selectedBooking.tickets) && selectedBooking.tickets[0]?.attendees?.[0]) || {}; return c?.email || '-' })()}
              </div>
              <div className='text-[#5E6582]'>Phone</div>
              <div className='text-right font-semibold text-slate-900'>
                {(() => { const c = selectedBooking.buyer || (Array.isArray(selectedBooking.tickets) && selectedBooking.tickets[0]?.attendees?.[0]) || {}; return c?.phone || '-' })()}
              </div>
            </div>
          </div>

          {Array.isArray(selectedBooking.tickets) && selectedBooking.tickets.some(t => Array.isArray(t.attendees) && t.attendees.length > 0) ? (
            <div className='rounded-xl border border-[#E5E8F6] bg-white p-4'>
              <div className='text-sm font-semibold text-slate-900 mb-3'>Attendees</div>
              <div className='space-y-2'>
                {selectedBooking.tickets.flatMap(t => (Array.isArray(t.attendees) ? t.attendees.map(a => ({ ...a })) : [])).map((a, i) => (
                  <div key={`att-${i}`} className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='text-[#5E6582]'>{a.fullName || '-'}</div>
                    <div className='text-right text-[#2D3658]'>{a.email || a.phone || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className='rounded-xl bg-orange-50 p-4'>
            <div className='flex items-center justify-between text-sm font-semibold text-slate-900 mb-3'>
              <span>Order ID {selectedBooking._id || selectedBooking.id || selectedBooking.bookingId || '-'}</span>
              <span>{(() => { const amt = selectedBooking?.pricing?.total; return typeof amt === 'number' ? `₦${amt.toLocaleString()}` : amt || '-' })()}</span>
            </div>
            <div className='flex items-center justify-between text-sm text-[#2D3658]'>
              <span>
                {(() => {
                  const q = Array.isArray(selectedBooking.tickets) ? selectedBooking.tickets.reduce((sum, t) => sum + (Number(t.quantity) || 0), 0) : null
                  const nm = 'Ticket'
                  const unitStr = ''
                  const qtyStr = typeof q === 'number' ? `${unitStr} x ${q} ${nm}` : `${selectedBooking.ticketsBooked || nm}`
                  return qtyStr
                })()}
              </span>
              <span>{(() => { const amt = selectedBooking?.pricing?.total; return typeof amt === 'number' ? `₦${amt.toLocaleString()}` : amt || '-' })()}</span>
            </div>
          </div>

          <div className='mt-4 pt-4 border-t border-[#EEF1FA]'>
            <div className='flex items-center justify-between'>
              <span className='text-base font-semibold text-slate-900'>Total</span>
              <span className='flex items-center gap-2 text-base font-bold text-slate-900'>
                {(() => { const amt = selectedBooking?.pricing?.total; return typeof amt === 'number' ? `₦${amt.toLocaleString()}` : amt || '-' })()}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    )}
    </>
  );
}
