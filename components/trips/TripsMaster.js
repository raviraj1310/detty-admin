'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plane,
  Wallet,
  CheckCircle,
  Clock3,
  ChevronUp,
  ChevronDown,
  MoreVertical
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { getAllTripBookings } from '@/services/users/user.service'
import { downloadExcel } from '@/utils/excelExport'

const INITIAL_METRICS = [
  {
    id: 'total-trips',
    title: 'Total Bookings',
    value: '0',
    icon: Plane,
    bg: 'bg-[#E8EEFF]',
    textColor: 'text-indigo-600'
  },
  {
    id: 'paid-trips',
    title: 'Paid Bookings',
    value: '0',
    icon: CheckCircle,
    bg: 'bg-[#E8F8F0]',
    textColor: 'text-emerald-600'
  },
  {
    id: 'pending-trips',
    title: 'Pending Bookings',
    value: '0',
    icon: Clock3,
    bg: 'bg-[#FFF4E8]',
    textColor: 'text-orange-600'
  },
  {
    id: 'trip-revenue',
    title: 'Revenue',
    value: '₦0',
    icon: Wallet,
    bg: 'bg-[#E0F2F1]',
    textColor: 'text-teal-700'
  }
]

const toNumber = value => {
  if (value && typeof value === 'object') {
    if (typeof value.$numberDecimal !== 'undefined') {
      return Number(value.$numberDecimal) || 0
    }
    if (typeof value.$numberInt !== 'undefined') {
      return Number(value.$numberInt) || 0
    }
    if (typeof value.$numberLong !== 'undefined') {
      return Number(value.$numberLong) || 0
    }
  }
  return Number(value) || 0
}

const formatCurrency = amount =>
  `₦${toNumber(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`

const formatDateTime = value => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  })
}

const titleCase = value => {
  const text = String(value || '').trim()
  if (!text) return '-'
  return text
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

const getPaymentStatusClass = status => {
  const value = String(status || '').toLowerCase()
  if (/paid|success|completed/.test(value)) return 'bg-green-100 text-green-800'
  if (/failed|abandoned/.test(value)) return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
}

const getBookingStatusClass = status => {
  const value = String(status || '').toLowerCase()
  if (/issued|confirmed|completed|success/.test(value)) {
    return 'bg-green-100 text-green-800'
  }
  if (/cancel|failed/.test(value)) return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
}

const buildTripRoute = booking => {
  const travel = booking?.travel || {}
  const from = travel?.DepartureTerminalCode || booking?.search?.from || '-'
  const to = travel?.ArrivalTerminalCode || booking?.search?.to || '-'
  return `${from} to ${to}`
}

const buildTripQuery = booking => {
  const raw = booking?.raw || booking
  const provider = raw?.provider || {}
  const payload = provider?.payload || {}
  const travel = Array.isArray(payload?.TravelInformations)
    ? payload.TravelInformations[0] || {}
    : {}
  const billing = payload?.PassengerDetails?.BillingAddress || {}
  const passengers =
    toNumber(raw?.search?.adults) +
      toNumber(raw?.search?.children) +
      toNumber(raw?.search?.infants) ||
    toNumber(travel?.NumberOfPassengers) ||
    (Array.isArray(payload?.PassengerDetails?.AirTravellers)
      ? payload.PassengerDetails.AirTravellers.length
      : 0) ||
    1

  const params = new URLSearchParams()
  params.set('bookingReference', provider?.bookingReference || '')
  params.set('pnr', provider?.pnr || '')
  params.set('airline', travel?.OperatorName || 'Flight Booking')
  params.set('from', travel?.DepartureTerminalCode || raw?.search?.from || '-')
  params.set('to', travel?.ArrivalTerminalCode || raw?.search?.to || '-')
  params.set('fromLabel', travel?.DepartureTerminal || '')
  params.set('toLabel', travel?.ArrivalTerminal || '')
  params.set('departDate', travel?.DepartureDate || raw?.search?.departDate || '')
  params.set('arrivalDate', travel?.ArrivalDate || raw?.search?.returnDate || '')
  params.set('ticketClass', travel?.TicketClass || '')
  params.set('tripType', provider?.tripType || raw?.search?.tripType || '')
  params.set(
    'buyerName',
    raw?.buyer?.fullName || raw?.userId?.name || billing?.ContactName || '-'
  )
  params.set(
    'buyerEmail',
    raw?.buyer?.email || raw?.userId?.email || billing?.ContactEmail || '-'
  )
  params.set('buyerPhone', raw?.buyer?.phone || billing?.ContactMobileNo || '-')
  params.set('paymentStatus', raw?.paymentStatus || '')
  params.set('bookingStatus', provider?.bookingStatus || raw?.status || '')
  params.set('transactionRef', raw?.transactionRef || '')
  params.set('transactionId', raw?.transactionId || '')
  params.set(
    'total',
    String(toNumber(raw?.finalPayableAmount || raw?.totalAmount || provider?.totalFare))
  )
  params.set('passengers', String(passengers))
  params.set('issuedOn', raw?.createdAt || raw?.updatedAt || '')
  return params.toString()
}

const TableHeaderCell = ({
  children,
  onClick,
  active = false,
  direction = 'asc',
  align = 'left'
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium tracking-wider ${
      active ? 'text-gray-700' : 'text-gray-500'
    } ${align === 'right' ? 'justify-end' : 'justify-start'} hover:text-gray-700 w-full`}
  >
    {children}
    {active ? (
      direction === 'asc' ? (
        <ChevronUp className='h-3.5 w-3.5 text-[#2D3658]' />
      ) : (
        <ChevronDown className='h-3.5 w-3.5 text-[#2D3658]' />
      )
    ) : (
      <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
    )}
  </button>
)

export default function TripsMaster () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(INITIAL_METRICS)
  const [sortKey, setSortKey] = useState('bookedOn')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true)
        const response = await getAllTripBookings()
        const raw = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : []

        const mapped = raw.map((booking, index) => {
          const provider = booking?.provider || {}
          const payload = provider?.payload || {}
          const travel = Array.isArray(payload?.TravelInformations)
            ? payload.TravelInformations[0] || {}
            : {}
          const billing = payload?.PassengerDetails?.BillingAddress || {}
          const amount = toNumber(
            booking?.finalPayableAmount || booking?.totalAmount || provider?.totalFare
          )

          return {
            id: booking?._id || `trip-${index}`,
            raw: booking,
            travel,
            bookedOn: booking?.createdAt || booking?.updatedAt || '',
            route: buildTripRoute({ travel, search: booking?.search }),
            airline: travel?.OperatorName || 'Flight',
            buyerName:
              booking?.buyer?.fullName || booking?.userId?.name || billing?.ContactName || '-',
            buyerEmail:
              booking?.buyer?.email || booking?.userId?.email || billing?.ContactEmail || '-',
            bookingReference: provider?.bookingReference || '-',
            pnr: provider?.pnr || '-',
            passengers:
              toNumber(booking?.search?.adults) +
                toNumber(booking?.search?.children) +
                toNumber(booking?.search?.infants) ||
              toNumber(travel?.NumberOfPassengers) ||
              1,
            amount,
            paymentStatus: booking?.paymentStatus || 'pending',
            bookingStatus: provider?.bookingStatus || booking?.status || 'pending'
          }
        })

        const totalRevenue = mapped.reduce((sum, booking) => sum + booking.amount, 0)
        const paidCount = mapped.filter(booking =>
          /paid|success|completed/i.test(booking.paymentStatus)
        ).length
        const pendingCount = mapped.filter(
          booking => !/paid|success|completed/i.test(booking.paymentStatus)
        ).length

        setMetrics([
          { ...INITIAL_METRICS[0], value: String(mapped.length) },
          { ...INITIAL_METRICS[1], value: String(paidCount) },
          { ...INITIAL_METRICS[2], value: String(pendingCount) },
          { ...INITIAL_METRICS[3], value: formatCurrency(totalRevenue) }
        ])
        setBookings(mapped)
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [])

  const filteredBookings = useMemo(() => {
    const term = String(searchTerm || '').trim().toLowerCase()
    const filtered = bookings.filter(booking => {
      if (!term) return true
      return [
        booking.route,
        booking.airline,
        booking.buyerName,
        booking.buyerEmail,
        booking.bookingReference,
        booking.pnr,
        booking.paymentStatus,
        booking.bookingStatus
      ].some(value => String(value || '').toLowerCase().includes(term))
    })

    const direction = sortOrder === 'asc' ? 1 : -1
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'route':
          return direction * a.route.localeCompare(b.route)
        case 'airline':
          return direction * a.airline.localeCompare(b.airline)
        case 'buyerName':
          return direction * a.buyerName.localeCompare(b.buyerName)
        case 'amount':
          return direction * (a.amount - b.amount)
        case 'paymentStatus':
          return direction * a.paymentStatus.localeCompare(b.paymentStatus)
        case 'bookingStatus':
          return direction * a.bookingStatus.localeCompare(b.bookingStatus)
        case 'bookedOn':
        default:
          return (
            direction *
            (new Date(a.bookedOn).getTime() - new Date(b.bookedOn).getTime())
          )
      }
    })

    return sorted
  }, [bookings, searchTerm, sortKey, sortOrder])

  const toggleSort = key => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortOrder(key === 'bookedOn' ? 'desc' : 'asc')
  }

  const handleExport = () => {
    const rows = filteredBookings.map(booking => ({
      'Booked On': booking.bookedOn,
      Route: booking.route,
      Airline: booking.airline,
      Passenger: booking.buyerName,
      'Passenger Email': booking.buyerEmail,
      'Booking Reference': booking.bookingReference,
      PNR: booking.pnr,
      Passengers: booking.passengers,
      Amount: booking.amount,
      'Payment Status': booking.paymentStatus,
      'Booking Status': booking.bookingStatus
    }))
    downloadExcel(rows, 'Trips_Bookings.xlsx')
  }

  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 mb-1'>Trips Master</h1>
          <nav className='text-sm text-gray-500'>
            <span>Dashboard</span> / <span>Trips Master</span>
          </nav>
        </div>

        <div className='flex items-center gap-3'>
          <div className='relative'>
            <Search className='w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2' />
            <input
              type='text'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder='Search trips'
              className='h-10 w-64 pl-9 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500'
            />
          </div>
          <button
            type='button'
            onClick={handleExport}
            className='h-10 px-4 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:bg-gray-50'
          >
            Export
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6'>
        {metrics.map(item => {
          const Icon = item.icon
          return (
            <div key={item.id} className={`${item.bg} p-4 rounded-lg shadow-sm`}>
              <div className='flex items-center justify-between'>
                <div className='bg-white p-2 rounded-lg'>
                  <Icon className={`w-5 h-5 ${item.textColor}`} />
                </div>
                <div className='text-right'>
                  <p className={`text-xs ${item.textColor}`}>{item.title}</p>
                  <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className='bg-gray-200 p-5 rounded-xl flex-1 min-h-0'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden'>
          <div className='p-4 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>All Trip Bookings</h2>
          </div>

          <div className='overflow-auto h-full'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    <TableHeaderCell
                      onClick={() => toggleSort('bookedOn')}
                      active={sortKey === 'bookedOn'}
                      direction={sortOrder}
                    >
                      Booked On
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    <TableHeaderCell
                      onClick={() => toggleSort('route')}
                      active={sortKey === 'route'}
                      direction={sortOrder}
                    >
                      Trip Route
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    <TableHeaderCell
                      onClick={() => toggleSort('airline')}
                      active={sortKey === 'airline'}
                      direction={sortOrder}
                    >
                      Airline
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    <TableHeaderCell
                      onClick={() => toggleSort('buyerName')}
                      active={sortKey === 'buyerName'}
                      direction={sortOrder}
                    >
                      Passenger
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Booking Ref
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    PNR
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    <TableHeaderCell
                      onClick={() => toggleSort('amount')}
                      active={sortKey === 'amount'}
                      direction={sortOrder}
                    >
                      Amount
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    <TableHeaderCell
                      onClick={() => toggleSort('paymentStatus')}
                      active={sortKey === 'paymentStatus'}
                      direction={sortOrder}
                    >
                      Payment
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    <TableHeaderCell
                      onClick={() => toggleSort('bookingStatus')}
                      active={sortKey === 'bookingStatus'}
                      direction={sortOrder}
                    >
                      Booking
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {loading ? (
                  <tr>
                    <td colSpan='10' className='px-4 py-8 text-center text-sm text-gray-500'>
                      Loading trips...
                    </td>
                  </tr>
                ) : filteredBookings.length ? (
                  filteredBookings.map(booking => (
                    <tr key={booking.id} className='hover:bg-gray-50'>
                      <td className='px-4 py-4 text-xs text-gray-600'>
                        {formatDateTime(booking.bookedOn)}
                      </td>
                      <td className='px-4 py-4 text-xs font-medium text-gray-900'>
                        {booking.route}
                      </td>
                      <td className='px-4 py-4 text-xs text-gray-700'>{booking.airline}</td>
                      <td className='px-4 py-4'>
                        <div className='text-xs font-medium text-gray-900'>
                          {booking.buyerName}
                        </div>
                        <div className='text-xs text-gray-500'>{booking.buyerEmail}</div>
                      </td>
                      <td className='px-4 py-4 text-xs text-gray-700'>
                        {booking.bookingReference}
                      </td>
                      <td className='px-4 py-4 text-xs text-gray-700'>{booking.pnr}</td>
                      <td className='px-4 py-4 text-xs font-semibold text-gray-900'>
                        {formatCurrency(booking.amount)}
                      </td>
                      <td className='px-4 py-4'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusClass(
                            booking.paymentStatus
                          )}`}
                        >
                          {titleCase(booking.paymentStatus)}
                        </span>
                      </td>
                      <td className='px-4 py-4'>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getBookingStatusClass(
                            booking.bookingStatus
                          )}`}
                        >
                          {titleCase(booking.bookingStatus)}
                        </span>
                      </td>
                      <td className='px-4 py-4 text-right'>
                        <button
                          type='button'
                          onClick={() =>
                            router.push(
                              `/trips/tickets-booked/view/${encodeURIComponent(
                                String(booking.id)
                              )}?${buildTripQuery(booking)}`
                            )
                          }
                          className='inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50'
                        >
                          <MoreVertical className='h-4 w-4' />
                          View Booking
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan='10' className='px-4 py-8 text-center text-sm text-gray-500'>
                      No trip bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
