'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { QRCodeCanvas } from 'qrcode.react'

// Mock Data
const BOOKING_DATA = {
  orderId: '78393002875234152',
  issuedOn: '27/1/2026',
  visitDate: 'Wednesday, Jan 28',
  gymName: 'Elevate Fitness Club',
  gymImage: '/images/dashboard/image-1.webp', // Using a placeholder from existing files
  accessType: 'Gym Access',
  dateTime: 'Sat, Dec 14 • 3pm',
  location: 'Landmark Event Centre, Lagos',
  qrCodeValue: '928095101915334814409001',
  items: [
    { name: '2* General Access', price: '₦3,000.00', quantity: 2 },
    { name: '2* General Access', price: '₦3,000.00', quantity: 2 }
  ],
  total: '₦6,110.00',
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

export default function GymBookingDetails ({ id }) {
  const router = useRouter()

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
              Order ID: {BOOKING_DATA.orderId}
            </div>
            <div className='text-white/80'>
              Issued on: {BOOKING_DATA.issuedOn}
            </div>
            <div className='text-white/80'>
              Visit Date: {BOOKING_DATA.visitDate}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className='p-6 space-y-6'>
          {/* Top Section: Gym Info & QR */}
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-start gap-3'>
              <div className='h-16 w-16 rounded-lg bg-gray-100 overflow-hidden'>
                <Image
                  src={BOOKING_DATA.gymImage}
                  alt={BOOKING_DATA.gymName}
                  width={64}
                  height={64}
                  className='h-full w-full object-cover'
                />
              </div>
              <div>
                <div className='text-base font-semibold text-slate-900'>
                  {BOOKING_DATA.gymName}
                </div>
                <div className='text-sm text-[#5E6582]'>
                  {BOOKING_DATA.dateTime}
                </div>
                <div className='text-sm text-[#5E6582]'>
                  {BOOKING_DATA.location}
                </div>
              </div>
            </div>
            <div className='h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600'>
              <QRCodeCanvas value={BOOKING_DATA.qrCodeValue} size={64} />
            </div>
          </div>

          <div className='divide-y divide-[#EEF1FA]'>
            {/* Items List */}
            <div className='py-3 space-y-2'>
              {BOOKING_DATA.items.map((item, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between text-sm'
                >
                  <span>{item.name}</span>
                  <span>{item.price}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className='py-3 flex items-center justify-between text-sm'>
              <span>Total</span>
              <span className='font-medium'>{BOOKING_DATA.total}</span>
            </div>

            {/* Status Section */}
            <div className='py-3 grid grid-cols-2 gap-4'>
              <div className='text-sm text-[#5E6582]'>Payment Status</div>
              <div className='text-right text-sm font-semibold text-slate-900'>
                {BOOKING_DATA.paymentStatus}
              </div>
              <div className='text-sm text-[#5E6582]'>Booking Status</div>
              <div className='text-right text-sm font-semibold text-slate-900'>
                {BOOKING_DATA.bookingStatus}
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className='rounded-xl border border-[#E5E8F6] bg-white p-4'>
            <div className='text-sm font-semibold text-slate-900 mb-3'>
              Buyer Details
            </div>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div className='text-[#5E6582]'>Full Name</div>
              <div className='text-right font-semibold text-slate-900'>
                {BOOKING_DATA.buyer.name}
              </div>
              <div className='text-[#5E6582]'>Email Address</div>
              <div className='text-right font-semibold text-slate-900'>
                {BOOKING_DATA.buyer.email}
              </div>
              <div className='text-[#5E6582]'>Phone</div>
              <div className='text-right font-semibold text-slate-900'>
                {BOOKING_DATA.buyer.phone}
              </div>
              <div className='text-[#5E6582]'>Country</div>
              <div className='text-right font-semibold text-slate-900'>
                {BOOKING_DATA.buyer.country}
              </div>
              <div className='text-[#5E6582]'>City</div>
              <div className='text-right font-semibold text-slate-900'>
                {BOOKING_DATA.buyer.city}
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
