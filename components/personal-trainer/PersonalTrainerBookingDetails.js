'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { QRCodeCanvas } from 'qrcode.react'

// Mock Data
const BOOKING_DATA = {
  orderId: '78393002875234152',
  issuedOn: '27/1/2026',
  visitDate: 'Wednesday, Jan 28',
  trainerName: 'Tunde Adeyemi',
  trainerImage: '/images/dashboard/image-1.webp', // Placeholder
  sessionType: '1:1 Training',
  dateTime: 'Sat, Dec 14 • 3pm',
  location: 'Landmark Event Centre, Lagos',
  qrCodeValue: '928095101915334814409001',
  items: [
    { name: '2* General Session', price: '₦3,000.00', quantity: 2 },
    { name: '2* General Session', price: '₦3,000.00', quantity: 2 }
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

export default function PersonalTrainerBookingDetails ({ id }) {
  const router = useRouter()

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
                Order ID: {BOOKING_DATA.orderId}
              </div>
              <div className='mt-1 text-xs text-white/60'>
                Issued On: {BOOKING_DATA.issuedOn}
              </div>
              <div className='text-xs text-white/60'>
                Visit Date: {BOOKING_DATA.visitDate}
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
                  src={BOOKING_DATA.trainerImage}
                  alt={BOOKING_DATA.trainerName}
                  fill
                  className='object-cover'
                />
              </div>
              <div>
                <h3 className='text-lg font-bold text-[#1E293B]'>
                  {BOOKING_DATA.trainerName}
                </h3>
                <p className='text-sm text-[#64748B]'>
                  {BOOKING_DATA.sessionType}
                </p>
                <div className='mt-1 flex flex-col gap-0.5 text-sm text-[#64748B]'>
                  <span>{BOOKING_DATA.dateTime}</span>
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
                    <span>{BOOKING_DATA.location}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <QRCodeCanvas value={BOOKING_DATA.qrCodeValue} size={80} />
              <div className='mt-1 text-[10px] text-center text-[#64748B] tracking-wider'>
                {BOOKING_DATA.qrCodeValue}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className='mb-6 space-y-4 border-b border-dashed border-[#E2E8F0] pb-6'>
            {BOOKING_DATA.items.map((item, index) => (
              <div
                key={index}
                className='flex items-center justify-between text-sm font-medium text-[#1E293B]'
              >
                <span>{item.name}</span>
                <span>{item.price}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className='mb-8 flex items-center justify-between border-b border-dashed border-[#E2E8F0] pb-8'>
            <span className='text-lg font-bold text-[#1E293B]'>Total</span>
            <span className='text-xl font-extrabold text-[#1E293B]'>
              {BOOKING_DATA.total}
            </span>
          </div>

          {/* Status Section */}
          <div className='mb-8 space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-[#64748B]'>Payment Status</span>
              <span className='font-bold text-[#22C55E]'>
                {BOOKING_DATA.paymentStatus}
              </span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-[#64748B]'>Booking Status</span>
              <span className='font-bold text-[#94A3B8]'>
                {BOOKING_DATA.bookingStatus}
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
                  {BOOKING_DATA.buyer.name}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>Email Address</span>
                <span className='font-semibold text-[#1E293B]'>
                  {BOOKING_DATA.buyer.email}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>Phone Number</span>
                <span className='font-semibold text-[#1E293B]'>
                  {BOOKING_DATA.buyer.phone}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>Country</span>
                <span className='font-semibold text-[#1E293B]'>
                  {BOOKING_DATA.buyer.country}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[#64748B]'>City</span>
                <span className='font-semibold text-[#1E293B]'>
                  {BOOKING_DATA.buyer.city}
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
