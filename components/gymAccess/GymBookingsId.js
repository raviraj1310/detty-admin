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
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { getAllGymBookings } from '@/services/v2/gym/gym.service'
import Toast from '@/components/ui/Toast'

// Mock Data for Metric Cards
const INITIAL_METRIC_CARDS = [
  {
    id: 'total-bookings',
    title: 'Total Bookings',
    value: '0',
    icon: User,
    bg: 'bg-[#F3E8FF]',
    textColor: 'text-purple-600',
    iconBg: 'bg-white'
  },
  {
    id: 'revenue',
    title: 'Revenue',
    value: '₦0.00',
    icon: Wallet,
    bg: 'bg-[#E0F2F1]',
    textColor: 'text-teal-700',
    iconBg: 'bg-white'
  },
  {
    id: 'cancelled',
    title: 'Cancelled Bookings',
    value: '0',
    icon: XCircle,
    bg: 'bg-[#FCE4EC]',
    textColor: 'text-pink-600',
    iconBg: 'bg-white'
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocs: 0
  })
  const [metrics, setMetrics] = useState(INITIAL_METRIC_CARDS)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPagination(prev => ({ ...prev, page: 1 }))
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch data
  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      }
      const response = await getAllGymBookings(
        pagination.page,
        pagination.limit,
        params
      )

      if (response?.success) {
        setBookings(response.data.gymBookings || [])
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }))

        // Update metrics
        const updatedMetrics = [...INITIAL_METRIC_CARDS]

        // Total Bookings
        updatedMetrics[0].value = response.data.totalBookings?.toString() || '0'

        // Revenue
        const revenue = response.data.totalRevenue || 0
        updatedMetrics[1].value = `₦${revenue.toLocaleString('en-NG', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`

        // Cancelled (Not available in API yet, keeping 0)
        updatedMetrics[2].value = '0'

        setMetrics(updatedMetrics)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setToast({
        open: true,
        title: 'Error',
        description: error?.message || 'Failed to fetch bookings',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [pagination.page, pagination.limit, debouncedSearch])

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

  const formatDate = dateString => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  return (
    <div className='space-y-6 py-6 px-6'>
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
      />

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
        {metrics.map(card => {
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
              <TableHeaderCell>Gym Name</TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell>User Details</TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell>Contact Info</TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell>Access Details</TableHeaderCell>
            </div>
            <div className='col-span-1'>
              <TableHeaderCell>Amount</TableHeaderCell>
            </div>
            <div className='col-span-1 text-right'>
              <TableHeaderCell align='right'>Status</TableHeaderCell>
            </div>
          </div>

          {/* Table Rows */}
          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {loading ? (
              <div className='p-8 text-center text-gray-500 text-sm'>
                Loading...
              </div>
            ) : bookings.length === 0 ? (
              <div className='p-8 text-center text-gray-500 text-sm'>
                No bookings found
              </div>
            ) : (
              bookings.map(item => (
                <div
                  key={item._id}
                  className='grid grid-cols-12 gap-4 px-4 py-3 items-start hover:bg-[#F9FAFD]'
                >
                  <div className='col-span-2'>
                    <div className='text-xs text-[#5E6582]'>
                      {formatDate(item.createdAt)}
                    </div>
                    <div className='text-[10px] text-[#8A92AC] mt-0.5 font-mono'>
                      #{item.orderId || '-'}
                    </div>
                  </div>
                  <div
                    className='col-span-2 text-xs font-medium text-slate-900 truncate'
                    title={item.gymId?.gymName}
                  >
                    {item.gymId?.gymName || '-'}
                  </div>
                  <div className='col-span-2'>
                    <div className='text-xs font-medium text-slate-900'>
                      {item.buyer?.fullName || item.userId?.name || '-'}
                    </div>
                  </div>
                  <div className='col-span-2'>
                    <div
                      className='text-xs text-[#5E6582] truncate'
                      title={item.buyer?.email || item.userId?.email || '-'}
                    >
                      {item.buyer?.email || item.userId?.email || '-'}
                    </div>
                    <div className='text-xs text-[#5E6582] mt-0.5'>
                      {item.buyer?.phone || item.userId?.phoneNumber || '-'}
                    </div>
                  </div>
                  <div className='col-span-2 space-y-1'>
                    {item.passes?.map((pass, idx) => (
                      <div key={idx} className='text-xs text-[#5E6582]'>
                        {pass.quantity} x {pass.gymAccessName}
                      </div>
                    ))}
                    <div className='text-[10px] text-[#8A92AC] mt-1'>
                      <span className='font-medium'>Visit:</span>{' '}
                      {formatDate(item.arrivalDate)}
                    </div>
                  </div>
                  <div className='col-span-1 text-xs font-bold text-slate-900'>
                    ₦
                    {item.finalPayableAmount?.toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                  <div className='col-span-1 flex justify-end items-center gap-2'>
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[10px] font-semibold capitalize ${
                        ['success', 'paid', 'completed'].includes(
                          (item.paymentStatus || '').toLowerCase()
                        )
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : [
                              'abandoned',
                              'abondoned',
                              'failed',
                              'cancelled'
                            ].includes((item.paymentStatus || '').toLowerCase())
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-orange-50 text-orange-600 border border-orange-200'
                      }`}
                    >
                      {item.paymentStatus === 'success'
                        ? 'Success'
                        : item.paymentStatus || 'Pending'}
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
                            className='block w-full px-4 cursor-pointer py-2 text-left text-xs font-medium text-slate-700 hover:bg-[#F8F9FC]'
                          >
                            View Access Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalDocs > 0 && (
          <div className='mt-4 flex items-center justify-between border-t border-[#E1E6F7] pt-4'>
            <div className='text-sm text-[#64748B]'>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(
                pagination.page * pagination.limit,
                pagination.totalDocs
              )}{' '}
              of {pagination.totalDocs} entries
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className='flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 disabled:opacity-50'
              >
                <ChevronLeft className='h-4 w-4' />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className='flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 disabled:opacity-50'
              >
                <ChevronRight className='h-4 w-4' />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
