'use client'
import { useEffect, useState } from 'react'
import { overallBookingCounts } from '@/services/auth/login.service'

export default function TransactionStatsCards({ dateRange }) {
  const [overallStats, setOverallStats] = useState({
    totalBookingCount: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    const fetchOverallStats = async () => {
      try {
        const params = {}
        if (dateRange?.start) params.startDate = dateRange.start
        if (dateRange?.end) params.endDate = dateRange.end

        const res = await overallBookingCounts(params)
        if (res?.success && res?.data) {
          setOverallStats({
            totalBookingCount: res.data.totalBookingCount || 0,
            totalRevenue: res.data.totalRevenue || 0
          })
        }
      } catch (error) {
        console.error('Error fetching overall stats:', error)
      }
    }
    fetchOverallStats()
  }, [dateRange])

  return (
    <div className='flex gap-4'>
      <div className='bg-purple-50 p-3 rounded-lg border border-purple-100 min-w-[150px]'>
        <p className='text-xs text-purple-600 mb-1'>Total Bookings</p>
        <p className='text-lg font-bold text-purple-700'>
          {overallStats.totalBookingCount}
        </p>
      </div>
      <div className='bg-green-50 p-3 rounded-lg border border-green-100 min-w-[150px]'>
        <p className='text-xs text-green-600 mb-1'>Total Revenue</p>
        <p className='text-lg font-bold text-green-700'>
          ₦{overallStats.totalRevenue.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
