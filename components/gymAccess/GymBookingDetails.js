'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { QRCodeCanvas } from 'qrcode.react'
import { getGymBookingDetail } from '@/services/v2/gym/gym.service'

const getGymImageUrl = imagePath => {
  if (!imagePath) return '/images/placeholder.png'
  if (imagePath.startsWith('http')) return imagePath

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL2 ||
    process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) return `/upload/image/${imagePath}`

  try {
    const { origin } = new URL(baseUrl)
    return `${origin}/upload/image/${imagePath}`
  } catch {
    return `/upload/image/${imagePath}`
  }
}

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const options = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
  if (includeTime) {
    options.hour = 'numeric'
    options.minute = 'numeric'
    options.hour12 = true
  }
  return date.toLocaleString('en-US', options)
}

const formatCurrency = amount => {
  return `₦${Number(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const getStatusColor = status => {
  const s = (status || '').toLowerCase()
  if (['success', 'paid', 'completed'].includes(s)) return 'text-emerald-600'
  if (['abandoned', 'abondoned', 'failed', 'cancelled'].includes(s))
    return 'text-red-600'
  return 'text-orange-600'
}

export default function GymBookingDetails ({ bookingId }) {
  const router = useRouter()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return
      try {
        setLoading(true)
        const response = await getGymBookingDetail(bookingId)
        if (response?.success) {
          setBooking(response.data)
        } else {
          setError(response?.message || 'Failed to fetch booking details')
        }
      } catch (err) {
        console.error('Error fetching booking details:', err)
        setError(err?.message || 'An error occurred while fetching details')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-red-500 text-center'>
          <p className='text-lg font-semibold'>Error</p>
          <p>{error}</p>
          <button
            onClick={() => router.back()}
            className='mt-4 text-blue-500 hover:underline'
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!booking) return null

  // Map API data to UI structure
  const buyer = booking.buyer || booking.userId || {}
  const gym = booking.gymId || {}
  const passes = booking.passes || []
  const pricing = booking.pricing || {}

  return (
    <div className='min-h-screen bg-[#fffff] p-12'>
      <div className='mx-auto max-w-3xl bg-white rounded-lg overflow-hidden shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        {/* Header */}
        <div className='bg-black text-white p-5 flex items-start justify-between'>
          <div className='flex items-center gap-3'>
            {/* Logos Placeholder */}
            <div className='flex items-center gap-3'>
              <div className='relative h-20 w-20'>
                <Image
                  src='/images/logo/fotter_logo.webp'
                  alt='logo'
                  fill
                  className='object-contain'
                />
              </div>
            </div>
          </div>
          <div className='text-right text-sm'>
            <div className='font-semibold'>
              Order ID: {booking.orderId || '-'}
            </div>
            <div className='text-white/80'>
              Issued on: {formatDate(booking.createdAt)}
            </div>
            <div className='text-white/80'>
              Visit Date: {formatDate(booking.arrivalDate)}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className='p-6 space-y-6'>
          {/* Top Section: Gym Info & QR */}
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-3'>
              <div className='h-16 w-16 rounded-lg bg-gray-100 overflow-hidden relative'>
                <Image
                  src={getGymImageUrl(gym.image)}
                  alt={gym.gymName || 'Gym Image'}
                  fill
                  className='object-cover'
                  unoptimized={true}
                />
              </div>
              <div>
                <div className='text-base font-semibold text-slate-900'>
                  {gym.gymName || '-'}
                </div>
                <div className='text-sm text-[#5E6582]'>
                  {formatDate(booking.arrivalDate, true)}
                </div>
                <div className='text-sm text-[#5E6582]'>
                  {gym.location || '-'}
                </div>
                {gym.duration && (
                  <div className='text-sm text-[#5E6582] mt-1'>
                    Duration: {gym.duration}
                  </div>
                )}
                {(gym.startTime || gym.endTime) && (
                  <div className='text-sm text-[#5E6582]'>
                    Hours: {gym.startTime || '-'} - {gym.endTime || '-'}
                  </div>
                )}
              </div>
            </div>
            <div className='h-20 w-20 rounded-lg flex items-center justify-center text-xs text-gray-600 p-2'>
              <QRCodeCanvas value={booking.orderId || booking._id} size={64} />
            </div>
          </div>

          <div className='divide-y divide-[#EEF1FA]'>
            {/* Items List */}
            <div className='py-3 space-y-2'>
              {passes.map((item, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between text-sm'
                >
                  <span>
                    {item.quantity} x {item.gymAccessName}
                  </span>
                  <span>
                    {formatCurrency(
                      item.totalPrice || item.perAccessPrice * item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className='py-3 space-y-2 text-sm text-[#5E6582]'>
              <div className='flex justify-between'>
                <span>Subtotal</span>
                <span>{formatCurrency(pricing.subtotal || 0)}</span>
              </div>
              <div className='flex justify-between'>
                <span>Service Fee</span>
                <span>{formatCurrency(pricing.serviceFee || 0)}</span>
              </div>
              {pricing.discountApplied > 0 && (
                <div className='flex justify-between text-green-600'>
                  <span>Discount</span>
                  <span>-{formatCurrency(pricing.discountApplied)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className='py-3 flex items-center justify-between text-sm border-t border-[#EEF1FA]'>
              <span className='font-medium text-slate-900'>Total Amount</span>
              <span className='font-bold text-slate-900'>
                {formatCurrency(booking.finalPayableAmount)}
              </span>
            </div>

            {/* Transaction & Status Section */}
            <div className='py-3 grid grid-cols-2 gap-4 border-t border-[#EEF1FA]'>
              <div className='text-sm text-[#5E6582]'>Transaction Ref</div>
              <div className='text-right text-sm font-semibold text-slate-900 font-mono'>
                {booking.transactionRef || '-'}
              </div>
              <div className='text-sm text-[#5E6582]'>Payment Status</div>
              <div
                className={`text-right text-sm font-semibold capitalize ${getStatusColor(
                  booking.paymentStatus
                )}`}
              >
                {booking.paymentStatus || 'Pending'}
              </div>
              <div className='text-sm text-[#5E6582]'>Booking Status</div>
              <div className='text-right text-sm font-semibold text-slate-900 capitalize'>
                {booking.status || 'Pending'}
              </div>
            </div>
          </div>

          {/* Gym Additional Info */}
          {/* {(gym.aboutPlace || gym.importantInformation) && (
            <div className='rounded-xl border border-[#E5E8F6] bg-white p-4 space-y-4'>
              {gym.aboutPlace && (
                <div>
                  <div className='text-sm font-semibold text-slate-900 mb-2'>
                    About Place
                  </div>
                  <div
                    className='text-sm text-[#5E6582] prose prose-sm max-w-none'
                    dangerouslySetInnerHTML={{ __html: gym.aboutPlace }}
                  />
                </div>
              )}
              {gym.importantInformation && (
                <div className='pt-4 border-t border-[#EEF1FA]'>
                  <div className='text-sm font-semibold text-slate-900 mb-2'>
                    Important Information
                  </div>
                  <div
                    className='text-sm text-[#5E6582] prose prose-sm max-w-none'
                    dangerouslySetInnerHTML={{
                      __html: gym.importantInformation
                    }}
                  />
                </div>
              )}
            </div>
          )} */}

          {/* Buyer Details */}
          <div className='rounded-xl border border-[#E5E8F6] bg-white p-4'>
            <div className='text-sm font-semibold text-slate-900 mb-3'>
              Buyer Details
            </div>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div className='text-[#5E6582]'>Full Name</div>
              <div className='text-right font-semibold text-slate-900'>
                {buyer.fullName || buyer.name || '-'}
              </div>
              <div className='text-[#5E6582]'>Email Address</div>
              <div className='text-right font-semibold text-slate-900 break-all'>
                {buyer.email || '-'}
              </div>
              <div className='text-[#5E6582]'>Phone</div>
              <div className='text-right font-semibold text-slate-900'>
                {buyer.phone || buyer.phoneNumber || '-'}
              </div>
              <div className='text-[#5E6582]'>Country</div>
              <div className='text-right font-semibold text-slate-900'>
                {buyer.country || '-'}
              </div>
              <div className='text-[#5E6582]'>City</div>
              <div className='text-right font-semibold text-slate-900'>
                {buyer.city || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className='mt-6 flex justify-center'>
        <button
          onClick={() => router.back()}
          className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
        >
          Back
        </button>
      </div>
    </div>
  )
}
