'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { QRCodeCanvas } from 'qrcode.react'
import { Loader2 } from 'lucide-react'
import { getBookingDetails } from '@/services/v2/team/team-bonding-retreat.service'

const formatDate = dateString => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatDateTime = (dateString, timeString) => {
  if (!dateString) return '-'
  const date = new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  if (!timeString) return date
  return `${date} • ${timeString}`
}

const formatCurrency = amount => {
  return `₦${Number(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const toImageSrc = path => {
  if (!path) return '/images/dashboard/image-1.webp'
  if (path.startsWith('http')) return path
  const baseUrl = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  const cleanBase = baseUrl.endsWith('/')
    ? baseUrl.substring(0, baseUrl.length - 1)
    : baseUrl
  return `${cleanBase}/${cleanPath}`
}

export default function TeamBondingRetreatBookingDetails ({ id }) {
  const router = useRouter()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return
      try {
        setLoading(true)
        const response = await getBookingDetails(id)
        const responseData = response?.data || response
        if (responseData?.success) {
          setBooking(responseData.data)
        }
      } catch (error) {
        console.error('Error fetching booking details:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [id])

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8F9FC]'>
        <div className='flex items-center gap-2 text-[#64748B]'>
          <Loader2 className='h-6 w-6 animate-spin' />
          <span>Loading booking details...</span>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[#F8F9FC]'>
        <div className='text-[#64748B]'>Booking not found</div>
      </div>
    )
  }

  const {
    transactionRef,
    _id,
    createdAt,
    bookingDate,
    teamBondingId,
    slotId,
    sessions,
    totalAmount,
    finalPayableAmount,
    paymentStatus,
    status,
    buyer,
    userId,
    email,
    phoneNumber,
    phone,
    userName,
    name,
    pricing,
    totalParticipants,
    discountCode
  } = booking

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-4 md:p-12'>
      <div className='mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-sm'>
        {/* Header */}
        <div className='bg-black p-6 md:p-8 text-white'>
          <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
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
            <div className='text-left md:text-right'>
              <div className='text-sm font-medium opacity-90'>
                Order ID: {transactionRef || _id}
              </div>
              <div className='mt-1 text-xs text-white/60'>
                Issued On: {formatDate(createdAt)}
              </div>
              <div className='text-xs text-white/60'>
                Visit Date: {formatDate(bookingDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className='p-6 md:p-8'>
          {/* Retreat Info & QR */}
          <div className='mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
            <div className='flex items-start gap-4'>
              <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100'>
                <Image
                  src={toImageSrc(teamBondingId?.image)}
                  alt={teamBondingId?.teamBondingRetreatName || 'Retreat Image'}
                  fill
                  className='object-cover'
                />
              </div>
              <div>
                <h3 className='text-lg font-bold text-[#1E293B]'>
                  {teamBondingId?.teamBondingRetreatName}
                </h3>
                <p className='text-sm text-[#64748B]'>
                  {sessions?.[0]?.sessionName || 'Session'}
                </p>
                {teamBondingId?.duration && (
                  <p className='mt-1 text-xs text-[#64748B]'>
                    Duration: {teamBondingId.duration}
                  </p>
                )}
                <div className='mt-1 flex flex-col gap-0.5 text-sm text-[#64748B]'>
                  <span>
                    {formatDateTime(slotId?.date || bookingDate, slotId?.time)}
                    {slotId?.slotName && ` • ${slotId.slotName}`}
                  </span>
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
                    <span>{teamBondingId?.location || 'Location'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className='flex flex-col items-center md:items-end'>
              <QRCodeCanvas value={transactionRef || _id} size={80} />
              <div className='mt-1 text-[10px] text-center text-[#64748B] tracking-wider'>
                {transactionRef || _id}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className='mb-6 space-y-4 border-b border-dashed border-[#E2E8F0] pb-6'>
            {sessions?.map((session, index) => (
              <div
                key={index}
                className='flex items-center justify-between text-sm font-medium text-[#1E293B]'
              >
                <span>
                  {session.participants || 1}x {session.sessionName}
                </span>
                <span>{formatCurrency(session.sessionPrice)}</span>
              </div>
            ))}
            {totalParticipants > 0 && (
              <div className='flex justify-end pt-2 text-xs text-[#64748B]'>
                Total Participants: {totalParticipants}
              </div>
            )}
          </div>

          {/* Pricing Breakdown */}
          {pricing && (
            <div className='mb-4 space-y-2 border-b border-dashed border-[#E2E8F0] pb-4 text-sm'>
              <div className='flex justify-between text-[#64748B]'>
                <span>Subtotal</span>
                <span>{formatCurrency(pricing.subtotal || totalAmount)}</span>
              </div>
              {pricing.serviceFee > 0 && (
                <div className='flex justify-between text-[#64748B]'>
                  <span>Service Fee</span>
                  <span>{formatCurrency(pricing.serviceFee)}</span>
                </div>
              )}
              {pricing.discountApplied > 0 && (
                <div className='flex justify-between text-[#22C55E]'>
                  <span>
                    Discount {discountCode ? `(${discountCode})` : ''}
                  </span>
                  <span>-{formatCurrency(pricing.discountApplied)}</span>
                </div>
              )}
            </div>
          )}

          {/* Total */}
          <div className='mb-8 flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-8'>
            <span className='text-lg font-bold text-[#1E293B]'>Total</span>
            <span className='text-xl font-extrabold text-[#FF4400]'>
              {formatCurrency(
                pricing?.total || finalPayableAmount || totalAmount
              )}
            </span>
          </div>

          {/* Status Section */}
          <div className='mb-8 space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-[#64748B]'>Payment Status</span>
              <span
                className={`font-bold capitalize ${
                  paymentStatus?.toLowerCase() === 'success' ||
                  paymentStatus?.toLowerCase() === 'completed'
                    ? 'text-[#22C55E]'
                    : 'text-[#FF9E42]'
                }`}
              >
                {paymentStatus || 'Pending'}
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-[#64748B]'>Booking Status</span>
              <span className='font-bold capitalize text-[#94A3B8]'>
                {status || 'Pending'}
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
                  {buyer?.fullName || userId?.name || userName || name || '-'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>Email Address</span>
                <span className='font-semibold text-[#1E293B]'>
                  {buyer?.email || userId?.email || email || '-'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>Phone Number</span>
                <span className='font-semibold text-[#1E293B]'>
                  {buyer?.phoneNumber ||
                    buyer?.phone ||
                    userId?.phoneNumber ||
                    userId?.phone ||
                    phoneNumber ||
                    phone ||
                    '-'}
                </span>
              </div>
              {buyer?.country && (
                <div className='flex justify-between'>
                  <span className='text-[#64748B]'>Country</span>
                  <span className='font-semibold text-[#1E293B]'>
                    {buyer.country}
                  </span>
                </div>
              )}
              {buyer?.city && (
                <div className='flex justify-between'>
                  <span className='text-[#64748B]'>City</span>
                  <span className='font-semibold text-[#1E293B]'>
                    {buyer.city}
                  </span>
                </div>
              )}
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
