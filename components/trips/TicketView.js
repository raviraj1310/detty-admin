'use client'

import { useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, MapPin, Ticket } from 'lucide-react'
import QRCodeGenerator from '@/components/common/QRCodeGenerator'

const formatDateTime = value => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  })
}

const formatDate = value => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const parseNumber = value => {
  if (value == null) return 0
  if (typeof value === 'number') return value
  const num = Number(String(value).replace(/[^0-9.]/g, ''))
  return Number.isNaN(num) ? 0 : num
}

const formatNaira = value => {
  const amount = parseNumber(value)
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const titleCase = value => {
  const text = String(value || '').trim()
  if (!text) return '—'
  return text
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, ch => ch.toUpperCase())
}

export default function TripTicketView () {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const bookingId = String(params?.id || '')
  const bookingReference = searchParams.get('bookingReference') || ''
  const pnr = searchParams.get('pnr') || ''
  const airline = searchParams.get('airline') || 'Flight Booking'
  const from = searchParams.get('from') || '-'
  const to = searchParams.get('to') || '-'
  const fromLabel = searchParams.get('fromLabel') || ''
  const toLabel = searchParams.get('toLabel') || ''
  const departDate = searchParams.get('departDate') || ''
  const arrivalDate = searchParams.get('arrivalDate') || ''
  const ticketClass = searchParams.get('ticketClass') || '-'
  const tripType = searchParams.get('tripType') || '-'
  const buyerName = searchParams.get('buyerName') || '-'
  const buyerEmail = searchParams.get('buyerEmail') || '-'
  const buyerPhone = searchParams.get('buyerPhone') || '-'
  const paymentStatus = searchParams.get('paymentStatus') || ''
  const bookingStatus = searchParams.get('bookingStatus') || ''
  const transactionRef = searchParams.get('transactionRef') || '-'
  const transactionId = searchParams.get('transactionId') || '-'
  const total = parseNumber(searchParams.get('total') || 0)
  const passengers = parseNumber(searchParams.get('passengers') || 1) || 1
  const issuedOn = searchParams.get('issuedOn') || ''

  const routeTitle = `${from} to ${to}`
  const location = [fromLabel, toLabel].filter(Boolean).join(' • ') || '—'
  const orderId = bookingReference || bookingId || '—'
  const isPaymentSuccess = /success|paid|completed/i.test(paymentStatus)
  const isBookingSuccess = /success|confirmed|completed|issued/i.test(
    bookingStatus
  )

  const qrValue = useMemo(() => {
    return JSON.stringify({
      bookingId,
      bookingReference,
      pnr,
      route: routeTitle,
      airline
    })
  }, [airline, bookingId, bookingReference, pnr, routeTitle])

  if (!bookingId) {
    return (
      <div className='min-h-screen bg-[#F5F6FA] p-6 md:p-10'>
        <div className='mx-auto max-w-3xl text-sm text-red-600'>
          Booking not found.
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#F5F6FA] p-6 md:p-10'>
      <div className='mx-auto max-w-3xl space-y-6'>
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
                <div className='h-[74px] w-[74px] shrink-0 rounded-lg bg-[#FFF4ED] overflow-hidden flex items-center justify-center'>
                  <span className='text-sm font-semibold text-[#FF6A3D]'>
                    Trip
                  </span>
                </div>
                <div className='min-w-0'>
                  <h1 className='text-xl font-bold text-slate-900'>
                    {routeTitle}
                  </h1>
                  <p className='mt-2 text-sm text-[#5E6582]'>
                    Airline: {airline}
                  </p>
                  <p className='mt-2 flex items-center gap-1 text-sm text-[#5E6582]'>
                    <MapPin className='h-4 w-4 shrink-0 text-[#9CA3AF]' />
                    {location}
                  </p>
                  <p className='mt-2 text-sm text-[#5E6582]'>
                    Ticket Class: {ticketClass}
                  </p>
                  <p className='mt-2 text-sm text-[#5E6582]'>
                    Departure: {formatDateTime(departDate)}
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
                      {titleCase(paymentStatus)}
                    </span>
                  </p>
                  <p className='mt-1 text-[#5E6582]'>
                    Issued on: {formatDate(issuedOn)}
                  </p>
                  <p className='mt-1 text-[#5E6582]'>
                    Arrival Date: {formatDateTime(arrivalDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-[#EEF1FA]' />

          <div className='p-5 md:p-7'>
            <h2 className='text-base font-bold text-slate-900'>Tickets</h2>
            <div className='mt-3 space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-slate-700'>
                  {passengers}× {ticketClass} • {tripType}
                </span>
                <span className='font-medium text-slate-900'>
                  {formatNaira(total)}
                </span>
              </div>
            </div>

            <div className='mt-4 border-t border-[#EEF1FA] pt-4 space-y-2'>
              <div className='pt-2 border-t border-[#EEF1FA] flex items-center justify-between'>
                <span className='flex items-center gap-2 font-bold text-slate-900'>
                  <Ticket className='h-4 w-4 text-[#EF4444]' /> Total
                </span>
                <span className='font-bold text-[#EF4444]'>
                  {formatNaira(total)}
                </span>
              </div>
            </div>
          </div>

          <div className='border-t border-[#EEF1FA]' />

          <div className='p-5 md:p-7'>
            <h2 className='text-base font-bold text-slate-900'>Ticket</h2>
            <div className='mt-4 rounded-xl bg-[#F8FAFC] border border-[#EEF1FA] p-5'>
              <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                <div className='flex-1 min-w-0'>
                  <h3 className='text-sm font-bold text-slate-900'>
                    Booking Details
                  </h3>
                  <div className='mt-4 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-2 sm:gap-x-12'>
                    <div className='text-[#9CA3AF]'>Passenger</div>
                    <div className='sm:text-right font-medium text-slate-900'>
                      {buyerName}
                    </div>
                    <div className='text-[#9CA3AF]'>Email Address</div>
                    <div className='sm:text-right font-medium text-slate-900 break-all'>
                      {buyerEmail}
                    </div>
                    <div className='text-[#9CA3AF]'>Phone Number</div>
                    <div className='sm:text-right font-medium text-slate-900'>
                      {buyerPhone}
                    </div>
                    <div className='text-[#9CA3AF]'>Booking Reference</div>
                    <div className='sm:text-right font-medium text-slate-900 break-all'>
                      {bookingReference || '—'}
                    </div>
                    <div className='text-[#9CA3AF]'>PNR</div>
                    <div className='sm:text-right font-medium text-slate-900 break-all'>
                      {pnr || '—'}
                    </div>
                  </div>
                </div>

                <div className='shrink-0 flex mt-7 flex-col items-center justify-center md:pt-8'>
                  <QRCodeGenerator value={qrValue} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl border border-[#E5E8F6] shadow-sm p-5'>
          <h2 className='mb-4 text-base font-bold text-slate-900'>
            Buyer Details
          </h2>
          <div className='grid grid-cols-1 gap-6 text-sm sm:grid-cols-2'>
            <div className='space-y-3'>
              <div>
                <span className='text-[#5E6582]'>Full Name</span>
                <br />
                <span className='font-semibold text-slate-900'>{buyerName}</span>
              </div>
              <div>
                <span className='text-[#5E6582]'>Phone Number</span>
                <br />
                <span className='font-semibold text-slate-900'>{buyerPhone}</span>
              </div>
            </div>
            <div className='space-y-3'>
              <div>
                <span className='text-[#5E6582]'>Email Address</span>
                <br />
                <span className='font-semibold text-slate-900 break-all'>
                  {buyerEmail}
                </span>
              </div>
              <div>
                <span className='text-[#5E6582]'>Trip Type</span>
                <br />
                <span className='font-semibold text-slate-900'>{tripType}</span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-xl border border-[#E5E8F6] shadow-sm p-5'>
          <h2 className='mb-4 text-base font-bold text-slate-900'>
            Booking Summary
          </h2>
          <div className='grid grid-cols-1 gap-6 text-sm sm:grid-cols-2'>
            <div className='space-y-3'>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Booking ID</span>
                <span className='font-semibold text-slate-900 break-all text-right'>
                  {bookingId}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Payment Status</span>
                <span
                  className={`font-semibold ${isPaymentSuccess ? 'text-[#16A34A]' : 'text-[#EAB308]'}`}
                >
                  {titleCase(paymentStatus)}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Total Amount</span>
                <span className='font-semibold text-slate-900'>
                  {formatNaira(total)}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Transaction Ref</span>
                <span className='font-semibold text-slate-900 break-all text-right'>
                  {transactionRef}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Transaction ID</span>
                <span className='font-semibold text-slate-900 break-all text-right'>
                  {transactionId}
                </span>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Order ID</span>
                <span className='font-semibold text-[#2563EB] break-all text-right'>
                  {orderId}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Booking Status</span>
                <span
                  className={`font-semibold ${isBookingSuccess ? 'text-[#16A34A]' : 'text-[#EAB308]'}`}
                >
                  {titleCase(bookingStatus)}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Final Payable Amount</span>
                <span className='font-semibold text-slate-900'>
                  {formatNaira(total)}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Quantity</span>
                <span className='font-semibold text-slate-900'>{passengers}</span>
              </div>
              <div className='flex justify-between gap-4'>
                <span className='text-[#5E6582]'>Flight Schedule</span>
                <span className='font-semibold text-slate-900 text-right'>
                  {formatDateTime(departDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
