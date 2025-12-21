'use client'

import { useEffect, useState } from 'react'
import AdminDashboard from '@/components/admin_dashboard/AdminDashboard'
import MerchandiseDashboard from '@/components/admin_dashboard/MerchandiseDashboard'
import AdditionalDashboard from '@/components/admin_dashboard/AdditionalDashboard'
import { dashboardData } from '@/services/auth/login.service'

export default function DashboardPage () {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardData()
        if (response?.success) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className='min-h-screen bg-white py-8 px-8 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-white py-8 px-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-sm text-gray-500 mt-1'>Admin / Dashboard</p>
      </div>
      <div className='bg-gray-50 p-5 rounded-xl space-y-6'>
        <AdminDashboard stats={stats} />
        <MerchandiseDashboard stats={stats} />
        <AdditionalDashboard stats={stats} />
      </div>
    </div>
  )
}
