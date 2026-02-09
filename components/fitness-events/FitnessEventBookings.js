'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Download,
  MoreVertical,
  User,
  Wallet,
  XCircle,
  Eye,
  ChevronLeft
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'

// Mock Data for Metrics
const METRICS = {
  totalBookings: 1155,
  revenue: '865(₦10,00,000)',
  cancelledBookings: '299(₦2,00,000)'
}

// Mock Data for Bookings
const MOCK_BOOKINGS = [
  {
    id: 1,
    bookedOn: '2025-06-12T10:00:00',
    userName: 'Ayo Famuyiwa',
    email: 'ayo.famuyiwa@email.com',
    phone: '+234 802 123 4567',
    passBooked: 'Entry Pass (₦2,000)',
    amount: '16,000',
    status: 'Completed'
  },
  {
    id: 2,
    bookedOn: '2025-06-12T10:00:00',
    userName: 'Bolu Onabanjo',
    email: 'bolu.onabanjo@email.com',
    phone: '+234 802 234 5678',
    passBooked: 'Entry Pass (₦2,000)',
    amount: '6,000',
    status: 'Cancelled'
  },
  {
    id: 3,
    bookedOn: '2025-06-12T10:00:00',
    userName: 'Segun Adebayo',
    email: 'segun.adebayo@email.com',
    phone: '+234 802 345 6789',
    passBooked: 'Entry Pass (₦2,000)',
    amount: '6,000',
    status: 'Completed'
  },
  {
    id: 4,
    bookedOn: '2025-06-12T10:00:00',
    userName: 'Tunde Bakare',
    email: 'tunde.bakare@email.com',
    phone: '+234 802 456 7890',
    passBooked: 'Entry Pass (₦2,000)',
    amount: '6,000',
    status: 'Completed'
  },
  {
    id: 5,
    bookedOn: '2025-06-12T10:00:00',
    userName: 'Kunle Afolayan',
    email: 'kunle.afolayan@email.com',
    phone: '+234 802 567 8901',
    passBooked: 'Entry Pass (₦2,000)',
    amount: '6,000',
    status: 'Completed'
  },
  {
    id: 6,
    bookedOn: '2025-06-12T10:00:00',
    userName: 'Bisi Alimi',
    email: 'bisi.alimi@email.com',
    phone: '+234 802 678 9012',
    passBooked: 'Entry Pass (₦2,000)',
    amount: '6,000',
    status: 'Completed'
  }
]

const MetricCard = ({
  title,
  value,
  icon: Icon,
  bgClass,
  iconBgClass,
  iconColorClass
}) => (
  <div className={`relative overflow-hidden rounded-2xl ${bgClass} p-4`}>
    <div className='flex items-center justify-between'>
      <div className={`rounded-full ${iconBgClass} p-3`}>
        <Icon className={`h-6 w-6 ${iconColorClass}`} />
      </div>
      <div className='text-right'>
        <p className='text-xs font-medium text-gray-500 mb-1'>{title}</p>
        <p className='text-xl font-bold text-gray-900'>{value}</p>
      </div>
    </div>
  </div>
)

const TableHeaderCell = ({ children }) => (
  <div className='flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[#8A92AC] whitespace-nowrap'>
    {children}
    <TbCaretUpDownFilled className='h-3 w-3 text-[#CBCFE2]' />
  </div>
)

export default function FitnessEventBookings ({ eventId }) {
  const router = useRouter()
  const [activeDropdown, setActiveDropdown] = useState(null)

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = event => {
      if (activeDropdown && !event.target.closest('.action-dropdown')) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown])

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      {/* Header */}
      <div className='mb-8'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-1 text-xs font-medium text-[#8A92AC] hover:text-[#2D3658] transition-colors w-fit mb-2'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Fitness Event Bookings
          </h1>
          <nav className='mt-1 text-sm text-gray-500'>
            <Link href='/dashboard' className='hover:text-gray-700'>
              Dashboard
            </Link>
            <span className='mx-2'>/</span>
            <span className='text-gray-900'>Bookings</span>
          </nav>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8'>
        <MetricCard
          title='Total Bookings'
          value={METRICS.totalBookings}
          icon={User}
          bgClass='bg-[#F3E8FF]'
          iconBgClass='bg-white'
          iconColorClass='text-[#9333EA]'
        />
        <MetricCard
          title='Revenue'
          value={METRICS.revenue}
          icon={Wallet}
          bgClass='bg-[#E0F2F1]'
          iconBgClass='bg-white'
          iconColorClass='text-[#00897B]'
        />
        <MetricCard
          title='Cancelled Bookings'
          value={METRICS.cancelledBookings}
          icon={XCircle}
          bgClass='bg-[#FFEBEE]'
          iconBgClass='bg-white'
          iconColorClass='text-[#D32F2F]'
        />
      </div>

      {/* Booking List */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex flex-col gap-4 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>Booking List</h2>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Search'
                className='h-10 w-64 rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50'>
              Filters
              <IoFilterSharp className='h-4 w-4' />
            </button>
            <button className='flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Booked On</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>User Name</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Email Id</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Phone Number</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Pass Booked</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Amount</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Payment Status</TableHeaderCell>
                </th>
                <th className='px-6 py-4'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {MOCK_BOOKINGS.map(booking => (
                <tr key={booking.id} className='hover:bg-gray-50/50'>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {new Date(booking.bookedOn).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                    {booking.userName}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {booking.email}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {booking.phone}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {booking.passBooked}
                  </td>
                  <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                    ₦{booking.amount}
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium border ${
                        booking.status === 'Completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='relative action-dropdown'>
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === booking.id ? null : booking.id
                          )
                        }
                        className='flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>

                      {activeDropdown === booking.id && (
                        <div className='absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-100 bg-white p-1 shadow-lg'>
                          <button
                            onClick={() =>
                              router.push(
                                `/fitness-events/bookings/view/${booking.id}`
                              )
                            }
                            className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                          >
                            <Eye className='h-4 w-4' /> View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
