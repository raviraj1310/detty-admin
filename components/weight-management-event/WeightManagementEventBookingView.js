'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { QRCodeCanvas } from 'qrcode.react'
import { Check } from 'lucide-react'

const formatIssuedOn = dateString => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const formatVisitDate = dateString => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

const formatEventDateTime = (dateString, timeString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
  const timePart = timeString || ''
  return timePart ? `${datePart} • ${timePart}` : datePart
}

const formatCurrency = amount => {
  return `₦${Number(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const MOCK_BOOKING = {
  orderId: '78393002875234152',
  issuedOn: '2026-01-27T00:00:00.000Z',
  visitDate: '2026-01-28T00:00:00.000Z',
  eventTitle: 'Everyday Nutrition Workshop',
  eventType: 'Weight Management Event',
  eventDate: '2025-12-14T00:00:00.000Z',
  eventTime: '3pm',
  location: 'Landmark Event Centre, Lagos',
  eventImage: '/images/dashboard/image-1.webp',
  passLabel: '2* General Pass',
  passPrice: 3000,
  total: 6110,
  paymentStatus: 'Completed',
  bookingStatus: 'Pending',
  buyer: {
    name: 'Oromuno Okiemute Grace',
    email: 'loveokiemute@gmail.com',
    phone: '2347031962591',
    country: 'Nigeria',
    city: 'Lagos'
  }
}

export default function WeightManagementEventBookingView () {
  const router = useRouter()
  const params = useParams()
  const id = params?.id

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setBooking({
        ...MOCK_BOOKING,
        orderId: id || MOCK_BOOKING.orderId
      })
      setLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [id])

  if (loading || !booking) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8F9FC]'>
        <p className='text-sm text-[#64748B]'>Loading booking details...</p>
      </div>
    )
  }

  const issuedOn = formatIssuedOn(booking.issuedOn)
  const visitDate = formatVisitDate(booking.visitDate)
  const dateTime = formatEventDateTime(booking.eventDate, booking.eventTime)
  const qrValue = booking.orderId || id || ''

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-4 md:p-8'>
      <div className='mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm'>
        {/* Header - Black bar */}
        <div className='flex flex-col gap-4 bg-black px-6 py-5 text-white md:flex-row md:items-center md:justify-between md:px-8'>
          <div className='flex items-center gap-3'>
            <div className='relative h-10 w-24 shrink-0 md:h-12 md:w-28'>
              <Image
                src='/images/logo/fotter_logo.webp'
                alt='Access Bank Detty Fusion'
                fill
                className='object-contain object-left'
              />
            </div>
            <div className='flex flex-col'>
              <span className='text-[10px] font-medium uppercase tracking-wide text-white/80 md:text-xs'>
                access bank
              </span>
              <span className='font-serif text-lg italic text-white md:text-xl'>
                detty fusion
              </span>
            </div>
          </div>
          <div className='text-left text-xs text-white/90 md:text-right md:text-sm'>
            <div>Order ID: {booking.orderId}</div>
            <div className='mt-0.5 text-white/70'>Issued On: {issuedOn}</div>
            <div className='text-white/70'>Visit Date: {visitDate}</div>
          </div>
        </div>

        {/* Event details + QR */}
        <div className='flex flex-col gap-6 border-b border-[#E2E8F0] px-6 py-6 md:flex-row md:items-start md:justify-between md:px-8 md:py-8'>
          <div className='flex flex-1 gap-4'>
            <div className='relative h-[70px] w-[100px] shrink-0 overflow-hidden rounded-lg bg-gray-100 md:h-20 md:w-28'>
              <Image
                src={booking.eventImage || '/images/dashboard/image-1.webp'}
                alt={booking.eventTitle}
                fill
                className='object-cover'
                unoptimized
              />
            </div>
            <div className='min-w-0'>
              <h2 className='text-base font-bold text-[#1E293B] md:text-lg'>
                {booking.eventTitle}
              </h2>
              <p className='text-xs text-[#64748B] md:text-sm'>
                {booking.eventType}
              </p>
              <p className='mt-1 text-sm text-[#64748B]'>{dateTime}</p>
              <div className='mt-1 flex items-center gap-1.5 text-sm text-[#64748B]'>
                <svg
                  width='12'
                  height='12'
                  viewBox='0 0 12 12'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  className='shrink-0 text-[#94A3B8]'
                >
                  <path
                    d='M6 6.5C6.82843 6.5 7.5 5.82843 7.5 5C7.5 4.17157 6.82843 3.5 6 3.5C5.17157 3.5 4.5 4.17157 4.5 5C4.5 5.82843 5.17157 6.5 6 6.5Z'
                    stroke='currentColor'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <path
                    d='M6 10.5C8 8.5 10 7 10 5C10 2.79086 8.20914 1 6 1C3.79086 1 2 2.79086 2 5C2 7 4 8.5 6 10.5Z'
                    stroke='currentColor'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <span>{booking.location}</span>
              </div>
            </div>
          </div>
          <div className='flex flex-col items-start md:items-end'>
            <div className='rounded-lg bg-white p-2 shadow-sm'>
              <QRCodeCanvas
                value={qrValue}
                size={96}
                bgColor='#ffffff'
                fgColor='#000000'
              />
            </div>
            <p className='mt-1.5 text-[10px] font-medium tracking-wider text-[#64748B]'>
              {qrValue}
            </p>
          </div>
        </div>

        {/* Pass and total */}
        <div className='border-b border-dashed border-[#E2E8F0] px-6 py-4 md:px-8'>
          <div className='flex items-center justify-between text-sm text-[#1E293B]'>
            <span>{booking.passLabel}</span>
            <span>{formatCurrency(booking.passPrice)}</span>
          </div>
          <div className='my-3 border-t border-dashed border-[#E2E8F0]' />
          <div className='flex items-center justify-between'>
            <span className='font-bold text-[#1E293B]'>Total</span>
            <span className='flex items-center gap-1.5 text-lg font-bold text-[#FF4400]'>
              <Check className='h-5 w-5' strokeWidth={2.5} />
              {formatCurrency(booking.total)}
            </span>
          </div>
          <div className='mt-4 space-y-2'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-[#64748B]'>Payment Status</span>
              <span className='font-semibold text-[#22C55E]'>
                {booking.paymentStatus}
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-[#64748B]'>Booking Status</span>
              <span className='font-semibold text-[#94A3B8]'>
                {booking.bookingStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Buyer details */}
        <div className='px-6 pb-6 md:px-8'>
          <div className='rounded-xl bg-[#F1F5F9] p-5'>
          <h4 className='mb-4 text-sm font-bold text-[#1E293B]'>
            Buyer Details
          </h4>
          <div className='space-y-3 text-sm'>
            <div className='flex justify-between'>
              <span className='text-[#64748B]'>Name</span>
              <span className='font-medium text-[#1E293B]'>
                {booking.buyer?.name || '—'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-[#64748B]'>Email Address</span>
              <span className='font-medium text-[#1E293B]'>
                {booking.buyer?.email || '—'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-[#64748B]'>Phone Number</span>
              <span className='font-medium text-[#1E293B]'>
                {booking.buyer?.phone || '—'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-[#64748B]'>Country</span>
              <span className='font-medium text-[#1E293B]'>
                {booking.buyer?.country || '—'}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-[#64748B]'>City</span>
              <span className='font-medium text-[#1E293B]'>
                {booking.buyer?.city || '—'}
              </span>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className='mt-8 flex justify-center'>
        <button
          type='button'
          onClick={() => router.back()}
          className='rounded-xl border border-[#E2E8F0] bg-white px-10 py-3 text-base font-medium text-[#1E293B] shadow-sm transition hover:bg-[#F8F9FC]'
        >
          Back
        </button>
      </div>
    </div>
  )
}
