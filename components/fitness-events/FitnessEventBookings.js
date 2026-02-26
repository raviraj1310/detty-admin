'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Download,
  MoreVertical,
  User,
  Wallet,
  XCircle,
  Eye,
  ChevronLeft,
  Loader2
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'

import {
  getFitnessEventBookings,
  getBookingsByFitnessId,
  getFitnessEventById
} from '@/services/fitness-event/fitness-event.service'

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
  const params = useParams()
  const id = eventId || params?.id

  const [bookings, setBookings] = useState([])
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    revenue: 0,
    cancelledBookings: 0
  })
  const [eventName, setEventName] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)

  // Toast State
  const [toastOpen, setToastOpen] = useState(false)
  const [toastProps, setToastProps] = useState({
    title: '',
    description: '',
    variant: 'success'
  })

  const showToast = (title, description, variant = 'success') => {
    setToastProps({ title, description, variant })
    setToastOpen(true)
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      let response
      if (id) {
        response = await getBookingsByFitnessId(id, 1, 100, searchTerm)
      } else {
        response = await getFitnessEventBookings(1, 100, searchTerm)
      }

      // Handle response structure: Service returns body directly ({ success: true, ... })
      // but we also handle if it returns the full axios response object
      const responseData = response?.success
        ? response
        : response?.data || response

      if (responseData?.success) {
        const data = responseData.data || {}
        const bookingsList = data.bookings || []
        setBookings(bookingsList)

        // Metrics
        const totalRevenue = data.totalRevenue || 0
        const totalBookings = data.totalBookings || bookingsList.length

        // Calculate cancelled bookings if not provided
        const cancelled = bookingsList.filter(
          b =>
            b.status?.toLowerCase() === 'cancelled' ||
            b.paymentStatus === 'failed'
        ).length

        setMetrics({
          totalBookings,
          revenue: totalRevenue,
          cancelledBookings: cancelled
        })
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      showToast('Error', 'Failed to fetch bookings', 'destructive')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [id, searchTerm])

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (id) {
        try {
          const response = await getFitnessEventById(id)
          const data = response?.data?.data || response?.data || {}
          if (data.fitnessEventName) {
            setEventName(data.fitnessEventName)
          } else if (data.name) {
            setEventName(data.name)
          }
        } catch (error) {
          console.error('Error fetching event details:', error)
        }
      } else {
        setEventName('')
      }
    }
    fetchEventDetails()
  }, [id])

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
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title={toastProps.title}
        description={toastProps.description}
        variant={toastProps.variant}
      />

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
            Fitness Event Bookings{' '}
            {eventName && <span className='text-[#FF4400]'>({eventName})</span>}
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
          value={metrics.totalBookings}
          icon={User}
          bgClass='bg-[#F3E8FF]'
          iconBgClass='bg-white'
          iconColorClass='text-[#9333EA]'
        />
        <MetricCard
          title='Revenue'
          value={formatCurrency(metrics.revenue)}
          icon={Wallet}
          bgClass='bg-[#E0F2F1]'
          iconBgClass='bg-white'
          iconColorClass='text-[#00897B]'
        />
        <MetricCard
          title='Cancelled Bookings'
          value={metrics.cancelledBookings}
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
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
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
                  <tr key={booking._id} className='hover:bg-gray-50/50'>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {formatDate(booking.createdAt || booking.bookingDate)}
                    </td>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      {booking.buyer?.fullName ||
                        booking.userId?.name ||
                        booking.userName ||
                        '-'}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {booking.buyer?.email ||
                        booking.userId?.email ||
                        booking.email ||
                        '-'}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {booking.buyer?.phone ||
                        booking.userId?.phone ||
                        booking.phone ||
                        '-'}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {booking.passes?.[0]?.passName ||
                        booking.passBooked ||
                        '-'}
                    </td>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      {formatCurrency(
                        booking.finalPayableAmount ||
                          booking.totalAmount ||
                          booking.amount
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium border ${
                          booking.paymentStatus === 'success' ||
                          booking.status === 'Completed'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : booking.status === 'Cancelled' ||
                              booking.status === 'failed'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}
                      >
                        {booking.paymentStatus || booking.status || 'Pending'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='relative action-dropdown'>
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === booking._id
                                ? null
                                : booking._id
                            )
                          }
                          className='flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>

                        {activeDropdown === booking._id && (
                          <div className='absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-gray-100 bg-white p-1 shadow-lg'>
                            <button
                              onClick={() =>
                                router.push(
                                  `/fitness-events/bookings/view/${booking._id}`
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
