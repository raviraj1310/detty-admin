'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Calendar, Clock, Ticket } from 'lucide-react'

export default function FitnessEventBookingDetails ({ bookingId }) {
  const router = useRouter()

  // Mock Booking Data
  const booking = {
    id: '78393002875234152',
    issuedOn: '27/1/2026',
    visitDate: 'Wednesday, Jan 28',
    event: {
      name: 'Fitness Bootcamp & Yoga',
      location: 'Landmark Event Centre, Lagos',
      date: 'Sat, Dec 14',
      time: '3pm',
      image: '/images/dashboard/image-1.webp' // Placeholder
    },
    passes: [
      { name: 'General Pass', quantity: 2, price: '3,000.00' },
      { name: 'General Pass', quantity: 2, price: '3,000.00' }
    ],
    total: '6,110.00',
    paymentStatus: 'Completed',
    bookingStatus: 'Pending',
    buyer: {
      name: 'Oromuno Okiemute Grace',
      email: 'loveokiemute@gmail.com',
      phone: '2347031962591',
      country: 'Nigeria',
      city: 'Lagos'
    },
    qrCode: '/images/qr-placeholder.png' // Placeholder for QR Code
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center justify-center'>
      <div className='w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-lg'>
        {/* Header (Black Section) */}
        <div className='bg-black text-white p-6 flex justify-between items-start'>
          <div className='flex items-center gap-4'>
            {/* Logo Placeholder - You might want to replace with actual Logo */}
            <div className='relative h-20 w-64'>
              <Image
                src='/images/logo/fotter_logo.webp'
                alt='logo'
                fill
                className='object-contain object-left'
              />
            </div>
          </div>
          <div className='text-right text-xs text-gray-300'>
            <p className='font-bold text-white mb-1'>Order ID: {booking.id}</p>
            <p>Issued On: {booking.issuedOn}</p>
            <p>Visit Date: {booking.visitDate}</p>
          </div>
        </div>

        {/* Ticket Content */}
        <div className='p-6 md:p-8'>
          {/* Event Info Row */}
          <div className='flex flex-col md:flex-row gap-6 mb-8 border-b border-dashed border-gray-200 pb-8'>
            <div className='w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-200'>
              {/* Use a placeholder div if image fails, or real image */}
              <div className='w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs'>
                Event Image
              </div>
            </div>

            <div className='flex-1'>
              <h2 className='text-lg font-bold text-gray-900 mb-1'>
                {booking.event.name}
              </h2>
              <p className='text-sm text-gray-500 mb-2'>Tradefair</p>
              <div className='flex items-center gap-4 text-xs text-gray-600 mb-1'>
                <span>
                  {booking.event.date} • {booking.event.time}
                </span>
              </div>
              <div className='flex items-center gap-1 text-xs text-gray-500'>
                <MapPin className='h-3 w-3' />
                {booking.event.location}
              </div>
            </div>

            <div className='flex flex-col items-center'>
              {/* QR Code Placeholder */}
              <div className='w-24 h-24 bg-gray-100 mb-1 flex items-center justify-center'>
                <Ticket className='h-10 w-10 text-gray-400' />
              </div>
              <p className='text-[10px] text-gray-400 font-mono'>
                928095101915334814409001
              </p>
            </div>
          </div>

          {/* Passes List */}
          <div className='space-y-3 mb-6 border-b border-dashed border-gray-200 pb-6'>
            {booking.passes.map((pass, index) => (
              <div
                key={index}
                className='flex justify-between items-center text-sm'
              >
                <span className='text-gray-600'>
                  <span className='font-medium text-gray-900'>
                    {pass.quantity}*
                  </span>{' '}
                  {pass.name}
                </span>
                <span className='font-bold text-gray-900'>₦{pass.price}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className='flex justify-between items-center mb-8 border-b border-dashed border-gray-200 pb-8'>
            <span className='font-bold text-lg text-gray-900'>Total</span>
            <span className='font-bold text-lg text-[#FF4400]'>
              🏷️ ₦{booking.total}
            </span>
          </div>

          {/* Statuses */}
          <div className='space-y-3 mb-8'>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-gray-500'>Payment Status</span>
              <span className='font-bold text-green-600'>
                {booking.paymentStatus}
              </span>
            </div>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-gray-500'>Booking Status</span>
              <span className='font-bold text-gray-400'>
                {booking.bookingStatus}
              </span>
            </div>
          </div>

          {/* Buyer Details */}
          <div className='bg-gray-50 rounded-xl p-6'>
            <h3 className='font-bold text-sm text-gray-900 mb-4'>
              Buyer Details
            </h3>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Name</span>
                <span className='font-medium text-gray-900 text-right'>
                  {booking.buyer.name}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Email Address</span>
                <span className='font-medium text-gray-900 text-right'>
                  {booking.buyer.email}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Phone Number</span>
                <span className='font-medium text-gray-900 text-right'>
                  {booking.buyer.phone}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>Country</span>
                <span className='font-medium text-gray-900 text-right'>
                  {booking.buyer.country}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-500'>City</span>
                <span className='font-medium text-gray-900 text-right'>
                  {booking.buyer.city}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className='mt-8'>
        <button
          onClick={() => router.back()}
          className='bg-white px-12 py-3 rounded-full text-sm font-medium text-gray-900 shadow-sm hover:shadow-md transition-shadow'
        >
          Back
        </button>
      </div>
    </div>
  )
}
