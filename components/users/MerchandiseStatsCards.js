'use client'
import { useEffect, useState } from 'react'
import { merchandiseCount } from '@/services/auth/login.service'

export default function MerchandiseStatsCards({ dateRange }) {
  const [stats, setStats] = useState({
    totalOrderCount: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = {}
        if (dateRange?.start) params.startDate = dateRange.start
        if (dateRange?.end) params.endDate = dateRange.end

        const res = await merchandiseCount(params)
        if (res?.success && res?.data) {
          setStats({
            totalOrderCount: res.data.totalOrderCount || 0,
            totalRevenue: res.data.totalRevenue || 0
          })
        }
      } catch (error) {
        console.error('Error fetching merchandise stats:', error)
      }
    }
    fetchStats()
  }, [dateRange])

  return (
    <div className='flex gap-4'>
      <div className='bg-purple-50 p-3 rounded-lg border border-purple-100 min-w-[150px]'>
        <p className='text-xs text-purple-600 mb-1'>Total Merchandise Booking</p>
        <p className='text-lg font-bold text-purple-700'>
          {stats.totalOrderCount}
        </p>
      </div>
      <div className='bg-green-50 p-3 rounded-lg border border-green-100 min-w-[150px]'>
        <p className='text-xs text-green-600 mb-1'>Total Revenue</p>
        <p className='text-lg font-bold text-green-700'>
          ₦{stats.totalRevenue.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
