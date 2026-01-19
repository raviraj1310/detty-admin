'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import RidesForm from '@/components/users/RidesForm'
import TransactionStatsCards from '@/components/users/TransactionStatsCards'

export default function RidesPage () {
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      {/* Title and Breadcrumb */}
      <div className='mb-4'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-1'>
          <div>
            <h1 className='text-xl font-bold text-gray-900 mb-1'>
              Gross Transaction Value
            </h1>
            <nav className='text-sm text-gray-500'>
              <span>Dashboard</span> /{' '}
              <span className='text-gray-900 font-medium'>
                Gross Transaction Value
              </span>
            </nav>
          </div>
          <TransactionStatsCards dateRange={dateRange} />
          <div className='flex items-center gap-2'>
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
      </div>

      {/* Rides Form Component */}
      <RidesForm dateRange={dateRange} />
    </div>
  )
}
