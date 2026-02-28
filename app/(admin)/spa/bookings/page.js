'use client'

import SpaBookingList from '@/components/spa/SpaBookingList'

const AllSpaBookingPage = () => {
  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>
          Spa Session Bookings
        </h1>
        <div className='text-sm text-gray-500'>Dashboard / Bookings</div>
      </div>
      <SpaBookingList />
    </div>
  )
}

export default AllSpaBookingPage
