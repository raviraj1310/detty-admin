'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { QRCodeCanvas } from 'qrcode.react'

const formatIssuedOn = dateString => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

const formatVisitDate = dateString => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

const formatSessionDateTime = (dateString, timeString) => {
  if (!dateString && !timeString) return '-'
  const date = dateString ? new Date(dateString) : null
  const datePart = date
    ? date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : ''
  const timePart = timeString || ''
  if (!datePart && !timePart) return '-'
  if (!datePart) return timePart
  if (!timePart) return datePart
  return `${datePart} • ${timePart}`
}

const formatCurrency = amount => {
  return `₦${Number(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

export default function FoodPrescriptionBookingDetails () {
  const router = useRouter()
  const params = useParams()
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(null)

  useEffect(() => {
    // When API exists, fetch by id here. For now, mock the structure to match UI.
    const timer = setTimeout(() => {
      setBooking({
        orderId: '78393002875234152',
        issuedOn: '2026-01-27T00:00:00.000Z',
        visitDate: '2026-01-28T00:00:00.000Z',
        title: 'Balanced Daily Nutrition',
        type: 'Food Prescription',
        dateTime: '2026-12-14T00:00:00.000Z',
        time: '3pm',
        venue: 'Landmark Event Centre, Lagos',
        accessLabel: 'General Access',
        accessPrice: 3000,
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
  const dateTime = formatSessionDateTime(booking.dateTime, booking.time)

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-8 md:p-12'>
      <div className='mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        {/* Header */}
        <div className='flex items-start justify-between bg-black px-6 py-5 text-white md:px-8'>
          <div className='flex items-center gap-4'>
            <div className='relative h-16 w-32 md:h-20 md:w-40'>
              <Image
                src='/images/logo/fotter_logo.webp'
                alt='Access Bank Detty Fusion'
                fill
                className='object-contain object-left'
              />
            </div>
          </div>
          <div className='text-right text-xs md:text-sm'>
            <div className='font-semibold'>
              Order ID: {booking.orderId || id || '-'}
            </div>
            <div className='mt-1 text-white/70'>Issued On: {issuedOn}</div>
            <div className='text-white/70'>Visit Date: {visitDate}</div>
          </div>
        </div>

        {/* Body */}
        <div className='space-y-6 px-6 py-6 md:px-8 md:py-8'>
          {/* Top section: prescription info + QR */}
          <div className='flex flex-col items-start justify-between gap-4 md:flex-row'>
            <div className='flex items-start gap-4'>
              <div className='relative h-16 w-20 overflow-hidden rounded-lg bg-gray-100 md:h-20 md:w-28'>
                <Image
                  src='/images/dashboard/image-1.webp'
                  alt={booking.title}
                  fill
                  className='object-cover'
                  unoptimized={true}
                />
              </div>
              <div>
                <h2 className='text-base font-semibold text-[#111827] md:text-lg'>
                  {booking.title}
                </h2>
                <p className='text-xs text-[#64748B] md:text-sm'>
                  {booking.type}
                </p>
                <p className='mt-1 text-xs text-[#64748B] md:text-sm'>
                  {dateTime}
                </p>
                <p className='mt-1 text-xs text-[#6B7280] md:text-sm'>
                  © {booking.venue}
                </p>
              </div>
            </div>
            <div className='flex items-center justify-center rounded-lg bg-white p-2 shadow-sm'>
              <QRCodeCanvas
                value={booking.orderId || id || ''}
                size={96}
                bgColor='#ffffff'
                fgColor='#000000'
              />
            </div>
          </div>

          {/* Access and total */}
          <div className='space-y-2 rounded-2xl bg-[#F9FAFB] p-4 text-sm text-[#111827]'>
            <div className='flex items-center justify-between'>
              <span>{booking.accessLabel}</span>
              <span>{formatCurrency(booking.accessPrice)}</span>
            </div>
            <div className='my-1 h-px bg-[#E5E7EB]' />
            <div className='flex items-center justify-between font-semibold'>
              <span>Total</span>
              <span className='text-[#FF4400]'>
                {formatCurrency(booking.total)}
              </span>
            </div>
          </div>

          {/* Status section */}
          <div className='grid grid-cols-2 gap-4 rounded-2xl bg-[#F9FAFB] p-4 text-sm text-[#4B5563]'>
            <div>Payment Status</div>
            <div className='text-right font-semibold text-emerald-600'>
              {booking.paymentStatus}
            </div>
            <div>Booking Status</div>
            <div className='text-right font-semibold text-amber-600'>
              {booking.bookingStatus}
            </div>
          </div>

          {/* Buyer details */}
          <div className='rounded-2xl bg-[#F9FAFB] p-5 text-sm text-[#111827]'>
            <h3 className='mb-4 text-sm font-semibold text-[#111827]'>
              Buyer Details
            </h3>
            <div className='grid grid-cols-2 gap-y-2 text-xs md:text-sm'>
              <div className='text-[#6B7280]'>Name</div>
              <div>{booking.buyer?.name || '-'}</div>

              <div className='text-[#6B7280]'>Email Address</div>
              <div>{booking.buyer?.email || '-'}</div>

              <div className='text-[#6B7280]'>Phone Number</div>
              <div>{booking.buyer?.phone || '-'}</div>

              <div className='text-[#6B7280]'>Country</div>
              <div>{booking.buyer?.country || '-'}</div>

              <div className='text-[#6B7280]'>City</div>
              <div>{booking.buyer?.city || '-'}</div>
            </div>
          </div>

          <div className='pt-2 text-center'>
            <button
              type='button'
              onClick={() => router.back()}
              className='mt-2 inline-flex items-center justify-center rounded-full bg-[#111827] px-8 py-2.5 text-sm font-medium text-white hover:bg-black'
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

