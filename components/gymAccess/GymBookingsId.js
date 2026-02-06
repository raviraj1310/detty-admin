'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  Filter,
  User,
  Wallet,
  XCircle,
  ChevronLeft
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'

// Mock Data for Metric Cards
const METRIC_CARDS = [
  {
    id: 'total-bookings',
    title: 'Total Bookings',
    value: '1155',
    icon: User,
    bg: 'bg-[#F3E8FF]',
    textColor: 'text-purple-600',
    iconBg: 'bg-white'
  },
  {
    id: 'revenue',
    title: 'Revenue',
    value: '865(₦10,00,000)',
    icon: Wallet,
    bg: 'bg-[#E0F2F1]',
    textColor: 'text-teal-700',
    iconBg: 'bg-white'
  },
  {
    id: 'cancelled',
    title: 'Cancelled Bookings',
    value: '299(₦2,00,000)',
    icon: XCircle,
    bg: 'bg-[#FCE4EC]',
    textColor: 'text-pink-600',
    iconBg: 'bg-white'
  }
]

// Mock Data for Booking List
const MOCK_BOOKINGS = [
  {
    id: 1,
    bookedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Ayo Famuyiwa',
    email: 'ayo.famuyiwa@email.com',
    phoneNumber: '+234 802 123 4567',
    accessBooked: [
      '3 x Day Gym Access (Adult) (₦2,000)',
      '2 x Day Gym Access (Adult) (₦10,000)'
    ],
    amount: '₦16,000',
    status: 'Completed'
  },
  {
    id: 2,
    bookedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Bolu Onabanjo',
    email: 'bolu.onabanjo@email.com',
    phoneNumber: '+234 802 234 5678',
    accessBooked: ['3 x Day Gym Access (Adult) (₦2,000)'],
    amount: '₦6,000',
    status: 'Cancelled'
  },
  {
    id: 3,
    bookedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Segun Adebayo',
    email: 'segun.adebayo@email.com',
    phoneNumber: '+234 802 345 6789',
    accessBooked: ['3 x Day Gym Access (Adult) (₦2,000)'],
    amount: '₦6,000',
    status: 'Completed'
  },
  {
    id: 4,
    bookedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Tunde Bakare',
    email: 'tunde.bakare@email.com',
    phoneNumber: '+234 802 456 7890',
    accessBooked: ['3 x Day Gym Access (Adult) (₦2,000)'],
    amount: '₦6,000',
    status: 'Completed'
  },
  {
    id: 5,
    bookedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Kunle Afolayan',
    email: 'kunle.afolayan@email.com',
    phoneNumber: '+234 802 567 8901',
    accessBooked: ['3 x Day Gym Access (Adult) (₦2,000)'],
    amount: '₦6,000',
    status: 'Completed'
  },
  {
    id: 6,
    bookedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Bisi Alimi',
    email: 'bisi.alimi@email.com',
    phoneNumber: '+234 802 678 9012',
    accessBooked: ['3 x Day Gym Access (Adult) (₦2,000)'],
    amount: '₦6,000',
    status: 'Completed'
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

export default function GymBookingsId () {
  const router = useRouter()
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
          Gym Access Bookings
        </h1>
        <p className='text-xs text-[#99A1BC]'>Dashboard / Bookings</p>
      </div>

      {/* Metric Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {METRIC_CARDS.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.id}
              className={`flex items-center justify-between rounded-2xl p-4 ${card.bg}`}
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconBg}`}
                >
                  <Icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
                <div className='flex flex-col'>
                  <p className={`text-xs font-medium ${card.textColor}`}>
                    {card.title}
                  </p>
                  <p className={`text-xl font-bold ${card.textColor}`}>
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Booking List Table */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-sm'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-slate-900'>Booking List</h2>
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
            <div className='col-span-2'>
              <TableHeaderCell>Booked On</TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell>User Name</TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell>Email Id</TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell>Phone Number</TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell>Access Booked</TableHeaderCell>
            </div>
            <div className='col-span-1'>
              <TableHeaderCell>Amount</TableHeaderCell>
            </div>
            <div className='col-span-1 text-right'>
              <TableHeaderCell align='right'>Payment Status</TableHeaderCell>
            </div>
          </div>

          {/* Table Rows */}
          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {MOCK_BOOKINGS.map(item => (
              <div
                key={item.id}
                className='grid grid-cols-12 gap-4 px-4 py-3 items-start hover:bg-[#F9FAFD]'
              >
                <div className='col-span-2 text-xs text-[#5E6582]'>
                  {item.bookedOn}
                </div>
                <div className='col-span-2 text-xs font-medium text-slate-900'>
                  {item.userName}
                </div>
                <div
                  className='col-span-2 text-xs text-[#5E6582] truncate'
                  title={item.email}
                >
                  {item.email}
                </div>
                <div className='col-span-2 text-xs text-[#5E6582]'>
                  {item.phoneNumber}
                </div>
                <div className='col-span-2 space-y-1'>
                  {item.accessBooked.map((access, idx) => (
                    <div key={idx} className='text-xs text-[#5E6582]'>
                      {access}
                    </div>
                  ))}
                </div>
                <div className='col-span-1 text-xs font-bold text-slate-900'>
                  {item.amount}
                </div>
                <div className='col-span-1 flex justify-end items-center gap-2'>
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-semibold ${
                      item.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-orange-50 text-orange-600 border border-orange-200'
                    }`}
                  >
                    {item.status}
                  </span>

                  {/* Action Menu */}
                  <div className='relative action-menu'>
                    <button
                      onClick={() =>
                        setMenuOpenId(menuOpenId === item.id ? null : item.id)
                      }
                      className='text-[#8A92AC] hover:text-[#2D3658]'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </button>
                    {menuOpenId === item.id && (
                      <div className='absolute right-0 top-6 z-10 w-40 rounded-lg border border-[#E1E6F7] bg-white py-2 shadow-lg'>
                        <button
                          onClick={() => {
                            router.push(`/gym/bookings/view/${item.id}`)
                          }}
                          className='block w-full px-4 cursor-pointer py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#F8F9FC]'
                        >
                          View Access Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
