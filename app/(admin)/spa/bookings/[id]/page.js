'use client'

import SpaBookingList from '@/components/spa/SpaBookingList'
import { getSpaById } from '@/services/v2/spa/spa.service'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const SpaBookingPage = () => {
  const { id } = useParams()
  const [spaName, setSpaName] = useState('')

  useEffect(() => {
    const fetchSpaName = async () => {
      if (id) {
        try {
          const response = await getSpaById(id)
          const data = response.data || response
          if (data && data.spaName) {
            setSpaName(data.spaName)
          }
        } catch (error) {
          console.error('Error fetching spa name:', error)
        }
      }
    }
    fetchSpaName()
  }, [id])

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>
          Spa Session Bookings{' '}
          {spaName && <span className='text-[#FF4400]'>({spaName})</span>}
        </h1>
        <div className='text-sm text-gray-500'>Dashboard / Bookings</div>
      </div>
      <SpaBookingList spaId={id} />
    </div>
  )
}

export default SpaBookingPage
