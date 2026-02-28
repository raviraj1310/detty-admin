import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  getSpaBookings,
  getAllSpaBookings,
  getSpaById
} from '@/services/v2/spa/spa.service'
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Loader2,
  User,
  Wallet,
  XCircle,
  ArrowLeft
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const SpaBookingList = ({ spaId }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState([])
  const [spaName, setSpaName] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    revenue: 0,
    revenueCount: 0,
    cancelled: 0,
    cancelledAmount: 0
  })

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState('')

  const fetchBookings = async () => {
    setLoading(true)
    try {
      let response
      if (spaId) {
        response = await getSpaBookings(spaId)
        // Also fetch spa name if spaId is present
        const spaRes = await getSpaById(spaId)
        if (spaRes?.success || spaRes?.data) {
          const spaData = spaRes.data || spaRes
          setSpaName(spaData.spaName)
        }
      } else {
        response = await getAllSpaBookings()
      }

      if (response?.success) {
        // Handle response.data array directly or response.data.data array
        let data = []
        if (Array.isArray(response.data)) {
          data = response.data
        } else if (response.data && Array.isArray(response.data.data)) {
          data = response.data.data
        } else if (Array.isArray(response.data?.bookings)) {
          data = response.data.bookings
        } else if (Array.isArray(response.bookings)) {
          // Handle case where bookings might be at root level in some responses
          data = response.bookings
        } else if (response.data && typeof response.data === 'object') {
          // Fallback: if data is an object but not an array, check if it has a 'data' property that is an array
          if (Array.isArray(response.data.data)) {
            data = response.data.data
          }
        }

        // If response has top-level 'data' array (like the example provided), use it
        if (
          Array.isArray(response.data) &&
          !data.length &&
          response.data.length > 0
        ) {
          data = response.data
        }

        setBookings(data)
        calculateStats(data)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = data => {
    let total = Array.isArray(data) ? data.length : 0
    let rev = 0
    let revCount = 0
    let canc = 0
    let cancAmt = 0

    if (Array.isArray(data)) {
      data.forEach(booking => {
        // Use pricing.total or amount
        const amount =
          Number(booking.pricing?.total) || Number(booking.amount) || 0

        if (booking.status === 'Cancelled' || booking.status === 'cancelled') {
          canc++
          cancAmt += amount
        } else if (
          booking.paymentStatus === 'Completed' ||
          booking.status === 'Active' ||
          booking.paymentStatus === 'paid'
        ) {
          revCount++
          rev += amount
        }
      })
    }

    setStats({
      total,
      revenue: rev,
      revenueCount: revCount,
      cancelled: canc,
      cancelledAmount: cancAmt
    })
  }

  useEffect(() => {
    fetchBookings()
  }, [spaId])

  const filteredBookings = Array.isArray(bookings)
    ? bookings.filter(
        booking =>
          (booking.buyer?.fullName || booking.userName || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (booking.buyer?.email || booking.email || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (booking.buyer?.phone || booking.phoneNumber || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (booking._id || booking.bookingId || '')
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : []

  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      <div className='grid gap-6 md:grid-cols-3'>
        <div className='flex items-center justify-between rounded-xl bg-[#F3E8FF] p-6'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#9333EA]'>
            <User className='h-6 w-6' />
          </div>
          <div className='text-right'>
            <p className='text-sm font-medium text-[#9333EA]'>Total Bookings</p>
            <p className='text-2xl font-bold text-[#9333EA]'>{stats.total}</p>
          </div>
        </div>

        <div className='flex items-center justify-between rounded-xl bg-[#E0F2F1] p-6'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#00897B]'>
            <Wallet className='h-6 w-6' />
          </div>
          <div className='text-right'>
            <p className='text-sm font-medium text-[#00897B]'>Revenue</p>
            <div className='flex items-baseline justify-end gap-1'>
              <span className='text-xl font-bold text-[#00897B]'>
                {stats.revenueCount}
              </span>
              <span className='text-sm font-medium text-[#00897B]'>
                ({formatCurrency(stats.revenue)})
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center justify-between rounded-xl bg-[#FCE4EC] p-6'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#C2185B]'>
            <XCircle className='h-6 w-6' />
          </div>
          <div className='text-right'>
            <p className='text-sm font-medium text-[#C2185B]'>
              Cancelled Bookings
            </p>
            <div className='flex items-baseline justify-end gap-1'>
              <span className='text-xl font-bold text-[#C2185B]'>
                {stats.cancelled}
              </span>
              <span className='text-sm font-medium text-[#C2185B]'>
                ({formatCurrency(stats.cancelledAmount)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex flex-col gap-4 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => router.back()}
              className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100'
            >
              <ArrowLeft className='h-4 w-4' />
            </button>
            <h2 className='text-lg font-semibold text-gray-900'>
              Booking List{' '}
              {spaId && spaName && (
                <span className='text-gray-500 text-sm font-normal'>
                  (For {spaName})
                </span>
              )}
            </h2>
          </div>
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
              <Filter className='h-4 w-4' />
              Filters
            </button>
            <button className='flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm text-gray-500'>
            <thead className='bg-gray-50 text-xs uppercase text-gray-700'>
              <tr>
                <th className='px-6 py-3 font-medium'>Booked On</th>
                <th className='px-6 py-3 font-medium'>User Name</th>
                <th className='px-6 py-3 font-medium'>Email Id</th>
                <th className='px-6 py-3 font-medium'>Phone Number</th>
                <th className='px-6 py-3 font-medium'>Sessions</th>
                <th className='px-6 py-3 font-medium'>Slot</th>
                <th className='px-6 py-3 font-medium'>Amount</th>
                <th className='px-6 py-3 font-medium'>Payment Status</th>
                <th className='px-6 py-3 font-medium'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {loading ? (
                <tr>
                  <td colSpan='8' className='px-6 py-8 text-center'>
                    <Loader2 className='mx-auto h-6 w-6 animate-spin text-gray-400' />
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan='8'
                    className='px-6 py-8 text-center text-gray-500'
                  >
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking, index) => (
                  <tr key={booking._id || index} className='hover:bg-gray-50'>
                    <td className='whitespace-nowrap px-6 py-4'>
                      {new Date(booking.createdAt).toLocaleString()}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 font-medium text-gray-900'>
                      {booking.buyer?.fullName || booking.userName}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      {booking.buyer?.email || booking.email}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      {booking.buyer?.phone || booking.phoneNumber}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      {Array.isArray(booking.sessions) ? (
                        <div className='space-y-1'>
                          {booking.sessions.map((item, i) => (
                            <div key={i} className='text-sm text-gray-900'>
                              {item.quantity} x {item.sessionName}{' '}
                              <span className='text-xs text-gray-500'>
                                (
                                {formatCurrency(
                                  item.totalPrice || item.sessionPrice
                                )}
                                )
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : Array.isArray(booking.items) ? (
                        <div className='space-y-1'>
                          {booking.items.map((item, i) => (
                            <div key={i} className='text-sm text-gray-900'>
                              {item.quantity} x {item.name}{' '}
                              <span className='text-xs text-gray-500'>
                                ({formatCurrency(item.price)})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        booking.accessBooked || '-'
                      )}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      {booking.slotId ? (
                        <div className='text-sm text-gray-900'>
                          {booking.slotId.slotName} <br />
                          <span className='text-xs text-gray-500'>
                            {booking.slotId.time}
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 font-medium text-gray-900'>
                      {formatCurrency(booking.pricing?.total || booking.amount)}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          booking.paymentStatus === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : booking.paymentStatus === 'Pending'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-right'>
                      <button className='text-gray-400 hover:text-gray-600'>
                        <MoreVertical className='h-4 w-4' />
                      </button>
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

export default SpaBookingList
