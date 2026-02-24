'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { QRCodeCanvas } from 'qrcode.react'
import { getPersonalTrainerBookingById } from '@/services/v2/personal-trainer/personal-trainer.service'

const formatCurrency = amount => {
  return `₦${Number(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

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

const toImageSrc = u => {
  const s = String(u || '').trim()
  if (!s) return null
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
  const base = origin ? origin.replace(/\/+$/, '') : ''
  const path = s.replace(/^\/+/, '')
  return base ? `${base}/upload/image/${path}` : `/upload/image/${path}`
}

export default function PersonalTrainerBookingDetails ({ id }) {
  const router = useRouter()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return
      try {
        setLoading(true)
        const response = await getPersonalTrainerBookingById(id)
        if (response?.success) {
          setBooking(response.data)
        }
      } catch (error) {
        console.error('Error fetching booking detail:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [id])

  const trainer = booking?.personalTrainerId
  const buyer = booking?.buyer
  const user = booking?.userId
  const session = booking?.sessions?.[0]

  const orderId = booking?.orderId || ''
  const issuedOn = formatIssuedOn(booking?.createdAt)
  const visitDate = formatVisitDate(session?.date || booking?.sessionDate)
  const dateTime = formatSessionDateTime(
    session?.date || booking?.sessionDate,
    session?.time
  )
  const trainerName = trainer?.trainerName || 'Trainer'
  const trainerImage =
    toImageSrc(trainer?.image) || '/images/dashboard/image-1.webp'
  const location = trainer?.location || ''
  const qrCodeValue = booking?.orderId || booking?.transactionRef || ''
  const items = booking?.sessions || []
  const total = formatCurrency(
    booking?.pricing?.total || booking?.totalAmount || 0
  )
  const paymentStatusLabel =
    booking?.paymentStatus === 'success'
      ? 'Completed'
      : booking?.paymentStatus || '-'
  const bookingStatusLabel = booking?.status
    ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1)
    : '-'

  const buyerName = buyer?.fullName || user?.name || '-'
  const buyerEmail = buyer?.email || user?.email || '-'
  const buyerPhone = buyer?.phone || user?.phoneNumber || '-'
  const buyerCountry = buyer?.country || '-'
  const buyerCity = buyer?.city || '-'

  if (loading) {
    return (
      <div className='min-h-screen bg-[#F8F9FC] p-12 flex items-center justify-center'>
        <div className='text-[#64748B]'>Loading booking details...</div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className='min-h-screen bg-[#F8F9FC] p-12 flex items-center justify-center'>
        <div className='text-[#64748B]'>Booking not found</div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-12'>
      <div className='mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm'>
        {/* Header */}
        <div className='bg-black p-8 text-white'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-4'>
              {/* Logo Placeholder */}
              <div className='relative h-12 w-32'>
                <Image
                  src='/images/logo/fotter_logo.webp'
                  alt='logo'
                  fill
                  className='object-contain object-left'
                />
              </div>
            </div>
            <div className='text-right'>
              <div className='text-sm font-medium opacity-90'>
                Order ID: {orderId}
              </div>
              <div className='mt-1 text-xs text-white/60'>
                Issued On: {issuedOn}
              </div>
              <div className='text-xs text-white/60'>
                Visit Date: {visitDate}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className='p-8'>
          {/* Trainer Info & QR */}
          <div className='mb-8 flex items-start justify-between'>
            <div className='flex items-start gap-4'>
              <div className='relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100'>
                <Image
                  src={trainerImage}
                  alt={trainerName}
                  fill
                  className='object-cover'
                  unoptimized={true}
                />
              </div>
              <div>
                <h3 className='text-lg font-bold text-[#1E293B]'>
                  {trainerName}
                </h3>
                <p className='text-sm text-[#64748B]'>
                  {session?.sessionType || session?.trainingSessionName || '-'}
                </p>
                <div className='mt-1 flex flex-col gap-0.5 text-sm text-[#64748B]'>
                  <span>{dateTime}</span>
                  <div className='flex items-center gap-1'>
                    <svg
                      width='12'
                      height='12'
                      viewBox='0 0 12 12'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        d='M6 6.5C6.82843 6.5 7.5 5.82843 7.5 5C7.5 4.17157 6.82843 3.5 6 3.5C5.17157 3.5 4.5 4.17157 4.5 5C4.5 5.82843 5.17157 6.5 6 6.5Z'
                        stroke='#94A3B8'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                      <path
                        d='M6 10.5C8 8.5 10 7 10 5C10 2.79086 8.20914 1 6 1C3.79086 1 2 2.79086 2 5C2 7 4 8.5 6 10.5Z'
                        stroke='#94A3B8'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    <span>{location}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <QRCodeCanvas value={qrCodeValue} size={80} />
              <div className='mt-1 text-[10px] text-center text-[#64748B] tracking-wider'>
                {qrCodeValue}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className='mb-6 space-y-4 border-b border-dashed border-[#E2E8F0] pb-6'>
            {items.map(item => (
              <div
                key={item._id}
                className='flex items-center justify-between text-sm font-medium text-[#1E293B]'
              >
                <span>
                  {item.quantity}* {item.trainingSessionName}
                </span>
                <span>
                  {formatCurrency(item.totalPrice || item.perSessionPrice)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className='mb-8 flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-8'>
            <span className='text-lg font-bold text-[#1E293B]'>Total</span>
            <span className='text-xl font-extrabold text-[#1E293B]'>
              {total}
            </span>
          </div>

          {/* Status Section */}
          <div className='mb-8 space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-[#64748B]'>Payment Status</span>
              <span className='font-bold text-[#22C55E]'>
                {paymentStatusLabel}
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-[#64748B]'>Booking Status</span>
              <span className='font-bold text-[#94A3B8]'>
                {bookingStatusLabel}
              </span>
            </div>
          </div>

          {/* Buyer Details */}
          <div className='rounded-xl bg-[#F8F9FC] p-6'>
            <h4 className='mb-4 text-sm font-bold text-[#1E293B]'>
              Buyer Details
            </h4>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>Name</span>
                <span className='font-semibold text-[#1E293B]'>
                  {buyerName}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>Email Address</span>
                <span className='font-semibold text-[#1E293B]'>
                  {buyerEmail}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>Phone Number</span>
                <span className='font-semibold text-[#1E293B]'>
                  {buyerPhone}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>Country</span>
                <span className='font-semibold text-[#1E293B]'>
                  {buyerCountry}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>City</span>
                <span className='font-semibold text-[#1E293B]'>
                  {buyerCity}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className='mt-8 flex justify-center'>
        <button
          onClick={() => router.back()}
          className='rounded-xl bg-white px-12 py-3 text-base font-medium text-[#1E293B] shadow-sm transition hover:bg-[#F1F5F9]'
        >
          Back
        </button>
      </div>
    </div>
  )
}
