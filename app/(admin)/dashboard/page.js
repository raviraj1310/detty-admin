'use client'

import AdminDashboard from '@/components/admin_dashboard/AdminDashboard'
import MerchandiseDashboard from '@/components/admin_dashboard/MerchandiseDashboard'
import AdditionalDashboard from '@/components/admin_dashboard/AdditionalDashboard'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white py-8 px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Admin / Dashboard</p>
      </div>
      <div className='bg-gray-50 p-5 rounded-xl space-y-6'>
        <AdminDashboard />
        <MerchandiseDashboard />
        <AdditionalDashboard />
      </div>
      
    </div>
  )
}
