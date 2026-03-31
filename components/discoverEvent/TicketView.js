'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Ticket } from 'lucide-react'
import { getTicketDetail } from '@/services/discover-events/event.service'
import { formatEventDate } from '@/utils/excelExport'
import QRCodeGenerator from '../common/QRCodeGenerator'

const toImageSrc = u => {
  const s = String(u || '')
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
  return `${origin.replace(/\/$/, '')}/${s.replace(/^\/+/, '')}`
}

// Avoid "Objects are not valid as a React child" when API returns populated refs { _id, name }
const toDisplayString = v => {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  if (typeof v === 'object' && v !== null) return v?.name ?? v?.email ?? ''
  return String(v)
}

export default function TicketView () {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = params?.id || ''
  const eventId = searchParams?.get('eventId') || ''
  const [booking, setBooking] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const r = await getTicketDetail(bookingId)
        const d = r?.data || r || null
        setBooking(d)
        setEvent(d?.event || null)
      } catch (e) {
        setError('Failed to load ticket')
        setBooking(null)
        setEvent(null)
      } finally {
        setLoading(false)
      }
    }
    if (bookingId) fetchData()
  }, [bookingId])

  const formatNaira = v => {
    if (typeof v === 'number') return `₦${v.toLocaleString()}`
    const n = Number(v)
    return isNaN(n) ? String(v || '-') : `₦${n.toLocaleString()}`
  }
  const arrivalDate = booking?.event?.arrivalDate || ''
  const buyer = booking?.buyer || {}
  const issuedOn = booking?.createdAt || booking?.bookedOn || booking?.updatedAt
  const issuedDate = issuedOn
    ? new Date(
        typeof issuedOn === 'object' && issuedOn.$date
          ? issuedOn.$date
          : issuedOn
      )
    : null
  const tickets = Array.isArray(booking?.tickets) ? booking.tickets : []
  const items = tickets.map(t => ({
    quantity: t.quantity,
    name: toDisplayString(t.ticketName ?? t.ticketType),
    price: t.totalPrice
  }))
  const total = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0)
  const attendees = tickets.flatMap(t =>
    Array.isArray(t.attendees)
      ? t.attendees.map(a => ({
          ...a,
          ticketName: t.ticketName || t.ticketType
        }))
      : []
  )

  // API shape: booking.event.eventId contains actual event master fields
  const eventDetails =
    booking?.event?.eventId || event?.eventId || event || null

  const vendorId =
    eventDetails?.hostedBy?._id ||
    booking?.event?.vendorProfile?.userId ||
    booking?.event?.vendorProfile?._id
  const scanBaseUrl =
    process.env.NEXT_PUBLIC_VENDOR_SCAN_BASE_URL || 'https://myonefusion.com'
  const buildQrData = ({ bookingId: b, uniqueId } = {}) => {
    const qs = new URLSearchParams()
    qs.set('vendorId', String(vendorId || ''))
    if (b) qs.set('bookingId', String(b))
    if (uniqueId) qs.set('uniqueId', String(uniqueId))
    return `${String(scanBaseUrl).replace(
      /\/+$/,
      ''
    )}/vendor/scanned-ticket?${qs.toString()}`
  }

  const orderId =
    toDisplayString(booking?.event?.orderId) ||
    toDisplayString(booking?.orderId) ||
    toDisplayString(event?.orderId) ||
    bookingId ||
    '-'
  const paymentStatus = toDisplayString(booking?.paymentStatus) || ''
  const bookingStatus = toDisplayString(booking?.bookingStatus) || ''
  const isPaymentSuccess = /success|paid|completed/i.test(paymentStatus)
  const isBookingSuccess = /success|confirmed|completed/i.test(bookingStatus)

  const eventStartDate = eventDetails?.eventStartDate
  const eventEndDate = eventDetails?.eventEndDate
  const startDate = eventStartDate
    ? new Date(
        typeof eventStartDate === 'object' && eventStartDate.$date
          ? eventStartDate.$date
          : eventStartDate
      )
    : null
  const endDate = eventEndDate
    ? new Date(
        typeof eventEndDate === 'object' && eventEndDate.$date
          ? eventEndDate.$date
          : eventEndDate
      )
    : null
  const openingHours =
    toDisplayString(eventDetails?.openingHours) ||
    [eventDetails?.eventStartTime, eventDetails?.eventEndTime]
      .filter(Boolean)
      .join(' - ') ||
    '—'
  const eventDateRange =
    startDate && endDate
      ? `${formatEventDate(startDate)}${
          eventDetails?.eventStartTime ? `, ${eventDetails.eventStartTime}` : ''
        } to ${formatEventDate(endDate)}${
          eventDetails?.eventEndTime ? `, ${eventDetails.eventEndTime}` : ''
        }`
      : startDate
      ? `${formatEventDate(startDate)}${
          eventDetails?.eventStartTime ? `, ${eventDetails.eventStartTime}` : ''
        }`
      : '—'
  const hostName =
    toDisplayString(eventDetails?.hostedBy?.name || eventDetails?.hostedBy) ||
    toDisplayString(booking?.event?.vendorProfile?.businessName) ||
    '—'
  const locationStr =
    toDisplayString(eventDetails?.location) ||
    toDisplayString(event?.eventId?.location) ||
    'Landmark Event Centre, Lagos'

  const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
  const serviceFee = Number(booking?.pricing?.serviceFee) || 0
  const discountApplied = Number(booking?.pricing?.discountApplied) || 0
  const totalAmount = Number(booking?.totalAmount) || total
  const finalPayable =
    Number(booking?.finalPayableAmount) ||
    totalAmount + serviceFee - discountApplied
  const transactionRef =
    toDisplayString(
      booking?.transactionRef ??
        booking?.transactionId ??
        booking?.paymentReference
    ) || '—'

  const firstAttendee = attendees[0]
  const ticket1Name =
    toDisplayString(firstAttendee?.ticketName ?? items[0]?.name) || '—'
  const ticket1FullName =
    toDisplayString(firstAttendee?.fullName ?? buyer?.fullName) || '—'
  const ticket1Email =
    toDisplayString(firstAttendee?.email ?? buyer?.email) || '—'
  const ticket1Phone =
    toDisplayString(firstAttendee?.phone ?? buyer?.phone) || '—'

  const ticketCards = (tickets.length ? tickets : attendees)
    .map((src, idx) => {
      const holder = src?.holder || {}
      const uniqueId =
        src?.uniqueId ||
        holder?.uniqueId ||
        holder?.uniqueID ||
        src?.ticketUniqueId ||
        src?.qrUniqueId ||
        src?.qrCodeUniqueId ||
        ''
      const ticketName =
        toDisplayString(src?.ticketName ?? src?.ticketType ?? src?.ticket) ||
        '—'
      const name =
        toDisplayString(holder?.fullName ?? holder?.name ?? src?.name) || '—'
      const email = toDisplayString(holder?.email ?? src?.email) || '—'
      const phone = toDisplayString(holder?.phone ?? src?.phone) || '—'
      const purchasedOn = issuedDate
        ? issuedDate.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        : '—'
      return {
        key: String(uniqueId || idx),
        index: idx,
        uniqueId: String(uniqueId || ''),
        ticketName,
        name,
        email,
        phone,
        purchasedOn
      }
    })
    .filter(Boolean)

  const cardClass = 'bg-white rounded-xl border border-[#E5E8F6] shadow-sm p-5'

  if (loading) {
    return (
      <div className='min-h-screen bg-[#F5F6FA] p-6 md:p-10'>
        <div className='mx-auto max-w-3xl text-sm text-[#5E6582]'>
          Loading...
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className='min-h-screen bg-[#F5F6FA] p-6 md:p-10'>
        <div className='mx-auto max-w-3xl text-sm text-red-600'>{error}</div>
        <button
          type='button'
          onClick={() => router.back()}
          className='mt-4 flex items-center gap-1 text-sm text-[#1A1F3F] hover:underline'
        >
          <ArrowLeft className='h-4 w-4' /> Back
        </button>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#F5F6FA] p-6 md:p-10'>
      <div className='mx-auto max-w-3xl space-y-6'>
        {/* Main card: Back + Event + Tickets + Ticket 1 */}
        <div className='bg-white rounded-xl border border-[#E5E8F6] shadow-sm overflow-hidden'>
          <div className='p-5 md:p-7'>
            <button
              type='button'
              onClick={() => router.back()}
              className='flex items-center gap-1 text-sm text-[#5E6582] hover:text-[#1A1F3F]'
            >
              <ArrowLeft className='h-4 w-4' /> Back
            </button>

            <div className='mt-6 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between'>
              <div className='flex flex-1 gap-4'>
                <div className='h-[74px] w-[74px] shrink-0 rounded-lg bg-gray-100 overflow-hidden'>
                  {eventDetails?.image ? (
                    <img
                      src={toImageSrc(eventDetails.image)}
                      alt={toDisplayString(eventDetails?.eventName) || 'Event'}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='h-full w-full flex items-center justify-center text-xs text-gray-400'>
                      Event
                    </div>
                  )}
                </div>
                <div className='min-w-0'>
                  <h1 className='text-xl font-bold text-slate-900'>
                    {toDisplayString(eventDetails?.eventName) ||
                      toDisplayString(booking?.ticketName) ||
                      'Event'}
                  </h1>
                  <p className='mt-2 text-sm text-[#5E6582]'>
                    Opening Hours: {openingHours}
                  </p>
                  <p className='mt-2 flex items-center gap-1 text-sm text-[#5E6582]'>
                    <MapPin className='h-4 w-4 shrink-0 text-[#9CA3AF]' />
                    {locationStr}
                  </p>
                  <p className='mt-2 text-sm text-[#5E6582]'>
                    Hosted by : {hostName}
                  </p>
                  <p className='mt-2 text-sm text-[#5E6582]'>
                    {eventDateRange}
                  </p>
                </div>
              </div>

              <div className='flex flex-col items-start sm:items-end'>
                <div className='text-right text-sm'>
                  <p className='font-semibold text-slate-900'>
                    Order ID: <span className='font-semibold'>{orderId}</span>
                  </p>
                  <p className='mt-1 font-semibold'>
                    <span className='text-slate-700'>Status: </span>
                    <span
                      className={
                        isPaymentSuccess ? 'text-[#16A34A]' : 'text-[#EAB308]'
                      }
                    >
                      {paymentStatus || 'Pending'}
                    </span>
                  </p>
                  <p className='mt-1 text-[#5E6582]'>
                    Issued on:{' '}
                    {issuedDate
                      ? issuedDate.toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '—'}
                  </p>
                  <p className='mt-1 text-[#5E6582]'>
                    Visit Date:{' '}
                    {arrivalDate ? formatEventDate(arrivalDate) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-[#EEF1FA]' />

          {/* Tickets section inside main card */}
          <div className='p-5 md:p-7'>
            <h2 className='text-base font-bold text-slate-900'>Tickets</h2>
            <div className='mt-3 space-y-2'>
              {items.map((it, i) => (
                <div
                  key={i}
                  className='flex items-center justify-between text-sm'
                >
                  <span className='text-slate-700'>
                    {it.quantity}× {it.name}
                  </span>
                  <span className='font-medium text-slate-900'>
                    {formatNaira(it.price)}
                  </span>
                </div>
              ))}
            </div>

            <div className='mt-4 border-t border-[#EEF1FA] pt-4 flex items-center justify-between'>
              <span className='flex items-center gap-2 font-bold text-slate-900'>
                <Ticket className='h-4 w-4 text-[#EF4444]' /> Total
              </span>
              <span className='font-bold text-[#EF4444]'>
                {formatNaira(totalAmount)}
              </span>
            </div>
          </div>

          <div className='border-t border-[#EEF1FA]' />

          {/* Ticket-wise QR section */}
          <div className='p-5 md:p-7'>
            <h2 className='text-base font-bold text-slate-900'>Tickets</h2>
            {ticketCards.length ? (
              <div className='mt-4 space-y-4'>
                {ticketCards.map((t, i) => (
                  <div
                    key={t.key}
                    className='rounded-xl bg-[#F8FAFC] border border-[#EEF1FA] p-5'
                  >
                    <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between gap-3'>
                          <h3 className='text-sm font-bold text-slate-900'>
                            Ticket {i + 1}
                          </h3>
                        </div>
                        <div className='mt-4 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2 sm:gap-x-12'>
                          <div className='text-[#9CA3AF]'>Name</div>
                          <div className='sm:text-right font-medium text-slate-900'>
                            {t.name}
                          </div>
                          <div className='text-[#9CA3AF]'>Email Address</div>
                          <div className='sm:text-right font-medium text-slate-900'>
                            {t.email}
                          </div>
                          <div className='text-[#9CA3AF]'>Phone Number</div>
                          <div className='sm:text-right font-medium text-slate-900'>
                            {t.phone}
                          </div>
                          <div className='text-[#9CA3AF]'>Purchased on</div>
                          <div className='sm:text-right font-medium text-slate-900'>
                            {t.purchasedOn}
                          </div>
                          <div className='text-[#9CA3AF]'>Ticket Name</div>
                          <div className='sm:text-right font-medium text-slate-900'>
                            {t.ticketName}
                          </div>
                          {t.uniqueId ? (
                            <>
                              <div className='text-[#9CA3AF]'>Unique ID</div>
                              <div className='sm:text-right font-medium text-slate-900 break-all'>
                                {t.uniqueId}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className='shrink-0 flex mt-7 flex-col items-center justify-center md:pt-8'>
                        <QRCodeGenerator
                          value={buildQrData({
                            bookingId,
                            uniqueId: t.uniqueId
                          })}
                          size={140}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='mt-4 text-sm text-[#5E6582]'>
                No ticket details found.
              </div>
            )}
          </div>
        </div>

        {/* Buyer Details - two columns: Full Name, Phone, City | Email, Country */}
        <div className={cardClass}>
          <h2 className='mb-4 text-base font-bold text-slate-900'>
            Buyer Details
          </h2>
          <div className='grid grid-cols-1 gap-6 text-sm sm:grid-cols-2'>
            <div className='space-y-3'>
              <div>
                <span className='text-[#5E6582]'>Full Name</span>
                <br />
                <span className='font-semibold text-slate-900'>
                  {toDisplayString(buyer.fullName) || '—'}
                </span>
              </div>
              <div>
                <span className='text-[#5E6582]'>Phone Number</span>
                <br />
                <span className='font-semibold text-slate-900'>
                  {toDisplayString(buyer.phone) || '—'}
                </span>
              </div>
              <div>
                <span className='text-[#5E6582]'>City</span>
                <br />
                <span className='font-semibold text-slate-900'>
                  {toDisplayString(buyer.city) || '—'}
                </span>
              </div>
            </div>
            <div className='space-y-3'>
              <div>
                <span className='text-[#5E6582]'>Email Address</span>
                <br />
                <span className='font-semibold text-slate-900'>
                  {toDisplayString(buyer.email) || '—'}
                </span>
              </div>
              <div>
                <span className='text-[#5E6582]'>Country</span>
                <br />
                <span className='font-semibold text-slate-900'>
                  {toDisplayString(buyer.country) || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Summary - left: Booking ID, Payment Status, Total Amount, Transaction Ref, Service Fee | right: Order ID, Booking Status, Final Payable, Quantity, Discount */}
        <div className={cardClass}>
          <h2 className='mb-4 text-base font-bold text-slate-900'>
            Booking Summary
          </h2>
          <div className='grid grid-cols-1 gap-6 text-sm sm:grid-cols-2'>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Booking ID</span>
                <span className='font-semibold text-slate-900'>
                  {bookingId || '—'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Payment Status</span>
                <span
                  className={`font-semibold ${
                    isPaymentSuccess ? 'text-[#16A34A]' : 'text-[#EAB308]'
                  }`}
                >
                  {paymentStatus || '—'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Total Amount</span>
                <span className='font-semibold text-slate-900'>
                  {formatNaira(total)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Transaction Ref</span>
                <span className='font-semibold text-slate-900'>
                  {transactionRef}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Service Fee</span>
                <span className='font-semibold text-slate-900'>
                  {formatNaira(serviceFee)}
                </span>
              </div>
            </div>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Order ID</span>
                <span className='font-semibold text-[#2563EB]'>{orderId}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Booking Status</span>
                <span
                  className={`font-semibold ${
                    isBookingSuccess ? 'text-[#16A34A]' : 'text-[#EAB308]'
                  }`}
                >
                  {bookingStatus || '—'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Final Payable Amount</span>
                <span className='font-semibold text-slate-900'>
                  {formatNaira(finalPayable)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Quantity</span>
                <span className='font-semibold text-slate-900'>{totalQty}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#5E6582]'>Discount Applied</span>
                <span className='font-semibold text-slate-900'>
                  {formatNaira(discountApplied)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
