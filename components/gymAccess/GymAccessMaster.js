'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  Loader2,
  Filter,
  ChevronLeft
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import TiptapEditor from '@/components/editor/TiptapEditor'

// Mock Data matching the image
const MOCK_DATA = [
  {
    id: 1,
    addedOn: '12 June 2025, 10:00 AM',
    name: 'Day Gym Pass (Adult)',
    duration: '1 Day',
    price: '₦10,000',
    status: 'Active'
  },
  {
    id: 2,
    addedOn: '12 June 2025, 10:00 AM',
    name: 'Gym Trial Access',
    duration: '7 Days',
    price: '₦10,000',
    status: 'Active'
  },
  {
    id: 3,
    addedOn: '12 June 2025, 10:00 AM',
    name: 'Fitness Access',
    duration: '25 Days',
    price: '₦10,000',
    status: 'Inactive'
  }
]

const TableHeaderCell = ({ children, align = 'left' }) => (
  <div
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[#8A92AC] whitespace-nowrap ${
      align === 'right' ? 'justify-end' : 'justify-start'
    }`}
  >
    {children}
    <TbCaretUpDownFilled className='h-3 w-3 text-[#CBCFE2]' />
  </div>
)

export default function GymAccessMaster () {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: 'Day Gym Pass (Adult)',
    durationValue: '1',
    durationUnit: 'Day',
    price: '₦10,000',
    details:
      '<p>Full-day access to the gym with use of all standard equipment, cardio zones, and training areas.</p>'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (menuOpenId !== null && !event.target.closest('.action-menu')) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpenId])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className='space-y-6 py-6 px-6'>
      <div className='flex flex-col gap-1'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-1 text-xs font-medium text-[#8A92AC] hover:text-[#2D3658] transition-colors w-fit mb-2'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <h1 className='text-xl font-semibold text-slate-900'>
          Edit Gym Access
        </h1>
        <p className='text-xs text-[#99A1BC]'>Dashboard / Edit Gym Access</p>
      </div>

      {/* Form Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-slate-900'>
            Gym Access Details
          </h2>
          <button className='rounded-xl bg-[#FF5B2C] px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#F0481A] transition'>
            Add
          </button>
        </div>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>
                Gym Access Name*
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className='w-full h-10 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
            </div>

            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>
                Access Duration*
              </label>
              <div className='flex h-10 items-center rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 focus-within:border-[#C5CAE3] focus-within:ring-2 focus-within:ring-[#C2C8E4]'>
                <input
                  type='text'
                  value={formData.durationValue}
                  onChange={e =>
                    handleInputChange('durationValue', e.target.value)
                  }
                  className='w-full bg-transparent text-xs text-slate-700 focus:outline-none'
                />
                <div className='mx-2 h-4 w-[1px] bg-gray-300'></div>
                <select
                  value={formData.durationUnit}
                  onChange={e =>
                    handleInputChange('durationUnit', e.target.value)
                  }
                  className='bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer'
                >
                  <option value='Day'>Day</option>
                  <option value='Week'>Week</option>
                  <option value='Month'>Month</option>
                  <option value='Year'>Year</option>
                </select>
              </div>
            </div>

            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>
                Gym Access Price*
              </label>
              <input
                type='text'
                value={formData.price}
                onChange={e => handleInputChange('price', e.target.value)}
                className='w-full h-10 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
            </div>
          </div>

          <div className='space-y-1'>
            <label className='text-xs font-medium text-slate-700'>
              Details*
            </label>
            <div className='rounded-lg border border-[#E5E6EF] overflow-hidden'>
              <TiptapEditor
                content={formData.details}
                onChange={html => handleInputChange('details', html)}
                placeholder='Enter details...'
                minHeight='120px'
              />
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-sm'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-slate-900'>
            Gym Access List
          </h2>
          <div className='flex items-center gap-2'>
            <div className='relative flex items-center'>
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-9 w-64 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] pl-9 pr-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
              <Search className='absolute left-3 h-3.5 w-3.5 text-[#A6AEC7]' />
            </div>
            <button className='flex h-9 items-center gap-2 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-slate-600 hover:bg-gray-50'>
              Filters <Filter className='h-3.5 w-3.5' />
            </button>
            <button className='flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E6EF] bg-white text-slate-600 hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-visible rounded-xl border border-[#E5E8F5]'>
          {/* Table Header */}
          <div className='grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3 border-b border-[#E5E8F6]'>
            <div className='col-span-3'>
              <TableHeaderCell>Added On</TableHeaderCell>
            </div>
            <div className='col-span-3'>
              <TableHeaderCell>Gym Access Name</TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell>Access Duration</TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell>Price</TableHeaderCell>
            </div>
            <div className='col-span-1'>
              <TableHeaderCell>Status</TableHeaderCell>
            </div>
            <div className='col-span-1 text-right'>
              <div className='flex justify-end'>
                <MoreVertical className='h-4 w-4 opacity-0' />
              </div>
            </div>
          </div>

          {/* Table Rows */}
          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {MOCK_DATA.map(item => (
              <div
                key={item.id}
                className='grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-[#F9FAFD]'
              >
                <div className='col-span-3 text-xs text-[#5E6582]'>
                  {item.addedOn}
                </div>
                <div className='col-span-3 text-xs font-medium text-slate-900'>
                  {item.name}
                </div>
                <div className='col-span-2 text-xs text-[#5E6582]'>
                  {item.duration}
                </div>
                <div className='col-span-2 text-xs text-[#5E6582]'>
                  {item.price}
                </div>
                <div className='col-span-1'>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      item.status === 'Active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : 'border-red-200 bg-red-50 text-red-600'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        item.status === 'Active'
                          ? 'bg-emerald-500'
                          : 'bg-red-500'
                      }`}
                    ></span>
                    {item.status}
                  </span>
                </div>
                <div className='col-span-1 flex justify-end relative action-menu'>
                  <button
                    onClick={() =>
                      setMenuOpenId(menuOpenId === item.id ? null : item.id)
                    }
                    className='text-[#8A92AC] hover:text-[#2D3658]'
                  >
                    <MoreVertical className='h-4 w-4' />
                  </button>
                  {menuOpenId === item.id && (
                    <div className='absolute right-0 top-6 z-10 w-32 rounded-lg border border-[#E1E6F7] bg-white py-2 shadow-lg'>
                      <button className='block w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#F8F9FC]'>
                        Edit
                      </button>
                      <div className='my-1 border-t border-[#F1F3F9]'></div>
                      <button className='block w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#F8F9FC]'>
                        Delete
                      </button>
                      <div className='my-1 border-t border-[#F1F3F9]'></div>
                      <button className='block w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#F8F9FC]'>
                        Active
                      </button>
                      <div className='my-1 border-t border-[#F1F3F9]'></div>
                      <button className='block w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#F8F9FC]'>
                        Inactive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
