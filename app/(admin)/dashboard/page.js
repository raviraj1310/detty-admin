'use client'

import { useEffect, useState } from 'react'
import AdminDashboard from '@/components/admin_dashboard/AdminDashboard'
import MerchandiseDashboard from '@/components/admin_dashboard/MerchandiseDashboard'
import AdditionalDashboard from '@/components/admin_dashboard/AdditionalDashboard'
import { dashboardData } from '@/services/auth/login.service'
import { X } from 'lucide-react'

export default function DashboardPage () {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const params = {}
        if (dateRange.start) params.startDate = dateRange.start
        if (dateRange.end) params.endDate = dateRange.end

        const response = await dashboardData(params)
        if (response?.success) {
          setStats({ ...response.data, growth: response.growth })
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [dateRange.start, dateRange.end])

  if (loading && !stats) {
    return (
      <div className='min-h-screen bg-white py-8 px-8 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white py-8 px-8'>
      {/* Header */}
      <div className='mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
          <p className='text-sm text-gray-500 mt-1'>Admin / Dashboard</p>
        </div>

        {/* Date Filter */}
        <div className='flex items-center gap-2'>
          <div className='flex flex-col'>
            <label className='text-[10px] text-gray-500 font-medium ml-1'>
              Start Date
            </label>
            <input
              type='date'
              max={new Date().toISOString().split('T')[0]}
              value={dateRange.start}
              onChange={e =>
                setDateRange(prev => ({ ...prev, start: e.target.value }))
              }
              className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500'
            />
          </div>
          <span className='text-gray-400 mt-4'>-</span>
          <div className='flex flex-col'>
            <label className='text-[10px] text-gray-500 font-medium ml-1'>
              End Date
            </label>
            <input
              type='date'
              max={new Date().toISOString().split('T')[0]}
              value={dateRange.end}
              onChange={e =>
                setDateRange(prev => ({ ...prev, end: e.target.value }))
              }
              className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500'
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className='mt-4 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
              title='Clear Date Filter'
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className='bg-gray-50 p-5 rounded-xl space-y-6'>
        {loading && (
          <div className='flex justify-center py-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
          </div>
        )}
        {!loading && (
          <>
            <AdminDashboard stats={stats} />
            <MerchandiseDashboard stats={stats} />
            <AdditionalDashboard stats={stats} />
          </>
        )}
      </div>
    </div>
  )
}
