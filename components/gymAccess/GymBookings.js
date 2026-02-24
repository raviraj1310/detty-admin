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
import { getBookingsByGymId } from '@/services/v2/gym/gym.service'

const formatDate = dateString => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  })
}

const formatCurrency = amount => {
  return `₦${Number(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

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

export default function GymBookings ({ id }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        const response = await getBookingsByGymId(1, 100, id, searchTerm)
        if (response?.success) {
          setBookings(response.data.gymBookings || [])
          setMetrics({
            totalBookings: response.data.totalBookings || 0,
            totalRevenue: response.data.totalRevenue || 0
          })
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBookings()
    }
  }, [id, searchTerm])

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
          Gym Access Bookings{' '}
          <span className='text-[#FF5B2C]'>(Elevate Fitness Club)</span>
        </h1>
        <p className='text-xs text-[#99A1BC]'>Dashboard / Bookings</p>
      </div>

      {/* Metric Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='flex items-center justify-between rounded-2xl p-4 bg-[#F3E8FF]'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white'>
              <User className='h-5 w-5 text-purple-600' />
            </div>
            <div className='flex flex-col'>
              <p className='text-xs font-medium text-purple-600'>
                Total Bookings
              </p>
              <p className='text-xl font-bold text-purple-600'>
                {metrics.totalBookings}
              </p>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between rounded-2xl p-4 bg-[#E0F2F1]'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white'>
              <Wallet className='h-5 w-5 text-teal-700' />
            </div>
            <div className='flex flex-col'>
              <p className='text-xs font-medium text-teal-700'>Revenue</p>
              <p className='text-xl font-bold text-teal-700'>
                {formatCurrency(metrics.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between rounded-2xl p-4 bg-[#FCE4EC]'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-white'>
              <XCircle className='h-5 w-5 text-pink-600' />
            </div>
            <div className='flex flex-col'>
              <p className='text-xs font-medium text-pink-600'>
                Cancelled Bookings
              </p>
              <p className='text-xl font-bold text-pink-600'>-</p>
            </div>
          </div>
        </div>
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
            {loading ? (
              <div className='p-8 text-center text-gray-500'>
                Loading bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className='p-8 text-center text-gray-500'>
                No bookings found
              </div>
            ) : (
              bookings.map(item => {
                const buyer = item.buyer || item.userId || {}
                const paymentStatus = (item.paymentStatus || '').toLowerCase()

                return (
                  <div
                    key={item._id}
                    className='grid grid-cols-12 gap-4 px-4 py-3 items-start hover:bg-[#F9FAFD]'
                  >
                    <div className='col-span-2 text-xs text-[#5E6582]'>
                      {formatDate(item.createdAt)}
                    </div>
                    <div className='col-span-2 text-xs font-medium text-slate-900'>
                      {buyer.fullName || buyer.name || '-'}
                    </div>
                    <div
                      className='col-span-2 text-xs text-[#5E6582] truncate'
                      title={buyer.email}
                    >
                      {buyer.email || '-'}
                    </div>
                    <div className='col-span-2 text-xs text-[#5E6582]'>
                      {buyer.phone || buyer.phoneNumber || '-'}
                    </div>
                    <div className='col-span-2 space-y-1'>
                      {(item.passes || []).map((pass, idx) => (
                        <div key={idx} className='text-xs text-[#5E6582]'>
                          {pass.quantity} x {pass.gymAccessName} (
                          {formatCurrency(pass.totalPrice)})
                        </div>
                      ))}
                    </div>
                    <div className='col-span-1 text-xs font-bold text-slate-900'>
                      {formatCurrency(
                        item.totalAmount ?? item.finalPayableAmount
                      )}
                    </div>
                    <div className='col-span-1 flex justify-end items-center gap-2'>
                      <span
                        className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-semibold capitalize ${
                          ['success', 'paid', 'completed'].includes(
                            paymentStatus
                          )
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : [
                                'abandoned',
                                'abondoned',
                                'failed',
                                'cancelled'
                              ].includes(paymentStatus)
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-orange-50 text-orange-600 border border-orange-200'
                        }`}
                      >
                        {item.paymentStatus || 'Pending'}
                      </span>

                      {/* Action Menu */}
                      <div className='relative action-menu'>
                        <button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === item._id ? null : item._id
                            )
                          }
                          className='text-[#8A92AC] hover:text-[#2D3658]'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                        {menuOpenId === item._id && (
                          <div className='absolute right-0 top-6 z-10 w-40 rounded-lg border border-[#E1E6F7] bg-white py-2 shadow-lg'>
                            <button
                              onClick={() => {
                                router.push(`/gym/bookings/view/${item._id}`)
                              }}
                              className='block w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#F8F9FC]'
                            >
                              View Access Details
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
