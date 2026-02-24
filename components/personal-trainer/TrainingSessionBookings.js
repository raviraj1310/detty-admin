'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  User,
  Wallet,
  XCircle,
  Loader2,
  Calendar,
  ChevronLeft
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'
import {
  getAllPersonalTrainerBooking,
  getBookingsByTrainerId
} from '@/services/v2/personal-trainer/personal-trainer.service'

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

const MetricCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  iconBgClass
}) => (
  <div className={`relative overflow-hidden rounded-2xl ${bgClass} p-6`}>
    <div className='flex items-center justify-between'>
      <div className={`rounded-full ${iconBgClass} p-3`}>
        <Icon className={`h-6 w-6 ${colorClass}`} />
      </div>
      <div className='text-right'>
        <p className={`text-sm font-medium ${colorClass} mb-1`}>{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>{value}</h3>
      </div>
    </div>
  </div>
)

export default function TrainingSessionBookings () {
  const router = useRouter()
  const params = useParams()
  const { id } = params || {}

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    revenue: 0,
    cancelledBookings: 0
  })
  const dropdownRef = useRef(null)

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  const fetchBookings = async () => {
    try {
      setLoading(true)
      if (id) {
        const response = await getBookingsByTrainerId(id)
        if (response?.success) {
          const trainerBookings = Array.isArray(response.data)
            ? response.data
            : response.data?.bookings || response.data?.data || []

          setBookings(Array.isArray(trainerBookings) ? trainerBookings : [])

          // Calculate metrics from the bookings list
          const totalRevenue = Array.isArray(trainerBookings)
            ? trainerBookings.reduce((sum, booking) => {
                return (
                  sum + (booking.pricing?.total || booking.totalAmount || 0)
                )
              }, 0)
            : 0

          const cancelled = Array.isArray(trainerBookings)
            ? trainerBookings.filter(
                b => b.status?.toLowerCase() === 'cancelled'
              ).length
            : 0

          setMetrics({
            totalBookings: trainerBookings.length || 0,
            revenue: totalRevenue,
            cancelledBookings: cancelled
          })
        }
      } else {
        const response = await getAllPersonalTrainerBooking(1, 100, searchTerm)
        if (response?.success) {
          const allBookings = response.data.bookings || []
          setBookings(Array.isArray(allBookings) ? allBookings : [])
          setMetrics({
            totalBookings: response.data.totalBookings || 0,
            revenue: response.data.totalRevenue || 0,
            cancelledBookings: response.data.cancelledBookings || 0
          })
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setToast({
        show: true,
        message: 'Failed to fetch bookings',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [searchTerm, id])

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDropdown = (e, id) => {
    e.stopPropagation()
    setActiveDropdown(activeDropdown === id ? null : id)
  }

  const getStatusColor = status => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-[#E6F8EF] text-[#22C55E] border border-[#22C55E]'
      case 'cancelled':
        return 'bg-[#FFF0F0] text-[#FF9E42] border border-[#FF9E42]' // Using Orange/Reddish for cancelled based on image
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200'
    }
  }

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      <div className='mb-8 flex items-center gap-4'>
        <button
          onClick={() => router.back()}
          className='flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition hover:bg-gray-50'
        >
          <ChevronLeft className='h-5 w-5' />
        </button>
        <div>
          <h1 className='text-2xl font-bold text-[#1E293B]'>
            Training Session Bookings{' '}
            {id && <span className='text-[#FF4400]'>(Tunde Adeyemi)</span>}
          </h1>
          <nav className='mt-1 text-sm text-[#64748B]'>
            <span className='cursor-pointer hover:text-[#1E293B]'>
              Dashboard
            </span>
            <span className='mx-2'>/</span>
            <span className='text-[#1E293B]'>Bookings</span>
          </nav>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <MetricCard
          title='Total Bookings'
          value={metrics.totalBookings}
          icon={User}
          bgClass='bg-[#F3E8FF]'
          colorClass='text-[#9333EA]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Revenue'
          value={formatCurrency(metrics.revenue)}
          icon={Wallet}
          bgClass='bg-[#E0F2F1]'
          colorClass='text-[#00897B]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Cancelled Bookings'
          value={metrics.cancelledBookings}
          icon={XCircle}
          bgClass='bg-[#FCE4EC]'
          colorClass='text-[#D81B60]'
          iconBgClass='bg-white'
        />
      </div>

      {/* Table Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <h2 className='text-lg font-bold text-[#1E293B]'>Booking List</h2>
          <div className='flex gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-[300px] rounded-lg border border-[#E2E8F0] pl-10 pr-4 text-sm focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 text-sm font-medium text-[#64748B] hover:bg-gray-50'>
              <IoFilterSharp className='h-4 w-4' />
              Filters
            </button>
            <button className='flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-[#E1E6F7] bg-[#F8F9FC]'>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Booked On</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>User Name</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Email Id</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Phone Number</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Session Booked</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Amount</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Payment Status</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-right'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E1E6F7]'>
              {loading ? (
                <tr>
                  <td colSpan='8' className='py-8 text-center text-[#64748B]'>
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      Loading bookings...
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan='8' className='py-8 text-center text-[#64748B]'>
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map(booking => (
                  <tr key={booking._id} className='hover:bg-[#F8F9FC]'>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {formatDate(booking.createdAt || booking.bookedOn)}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {booking.buyer?.fullName || booking.userId?.name || '-'}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {booking.buyer?.email || '-'}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {booking.buyer?.phone || '-'}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {booking.sessions?.[0]?.trainingSessionName ||
                        booking.session ||
                        '-'}{' '}
                      <span className='font-semibold text-[#1E293B]'>
                        (
                        {formatCurrency(
                          booking.sessions?.[0]?.perSessionPrice ||
                            booking.perSessionPrice ||
                            0
                        )}
                        )
                      </span>
                    </td>
                    <td className='py-4 px-6 text-sm font-bold text-[#1E293B]'>
                      {formatCurrency(booking.pricing?.total || booking.amount)}
                    </td>
                    <td className='py-4 px-6'>
                      <span
                        className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className='py-4 px-6 text-right relative'>
                      <button
                        onClick={e => toggleDropdown(e, booking._id)}
                        className='rounded-lg p-2 text-[#94A3B8] hover:bg-gray-100 hover:text-[#1E293B]'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>

                      {activeDropdown === booking._id && (
                        <div
                          ref={dropdownRef}
                          className='absolute right-6 top-12 z-10 w-40 rounded-xl border border-[#E1E6F7] bg-white p-1.5 shadow-lg'
                        >
                          <button
                            onClick={() =>
                              router.push(
                                `/personal-trainer/bookings/view/${booking._id}`
                              )
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
