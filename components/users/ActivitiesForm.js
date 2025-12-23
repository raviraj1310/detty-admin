'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  Search,
  MoreVertical,
  Download,
  Ticket,
  User,
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart2
} from 'lucide-react'
import { getActivityBookedTickets } from '../../services/booking/booking.service'
import { downloadActivityBookedTicket } from '@/services/places-to-visit/placesToVisit.service'
import { downloadExcel } from '@/utils/excelExport'

const fmtCurrency = n => `₦${Number(n || 0).toLocaleString('en-NG')}`

const formatBookedOn = iso => {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  const day = d.toLocaleDateString('en-US', { weekday: 'short' })
  const datePart = d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  const timePart = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  return `${day}, ${datePart} at ${timePart}`
}

const ticketsText = tList => {
  if (!Array.isArray(tList)) return '-'
  return tList
    .map(
      t => `${t.quantity} x ${t.ticketName} (${fmtCurrency(t.perTicketPrice)})`
    )
    .join(', ')
}
const ticketsTotal = b => {
  const list = Array.isArray(b?.tickets) ? b.tickets : []
  return list.reduce(
    (sum, t) =>
      sum +
      (Number(
        t.totalPrice ||
          (Number(t.perTicketPrice) || 0) * (Number(t.quantity) || 0)
      ) || 0),
    0
  )
}
const toIdString = v => {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') {
    if (v.$oid) return String(v.$oid)
    if (v.$id) return String(v.$id)
    if (v.oid) return String(v.oid)
    if (v._id) return toIdString(v._id)
  }
  return String(v)
}

const toImageUrl = p => {
  const s = String(p || '').trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN
  const base =
    originEnv && originEnv.trim()
      ? originEnv.trim()
      : 'https://accessdettyfusion.com'
  const path = s.startsWith('/') ? s : `/${s}`
  return `${base}${path}`
}

function statusClass (v) {
  const s = String(v || '').toLowerCase()
  if (s === 'paid' || s === 'completed')
    return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  if (s === 'pending' || s === 'incomplete')
    return 'bg-orange-50 text-orange-600 border border-orange-200'
  return 'bg-red-50 text-red-600 border border-red-200'
}

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: false },
  { id: 'event', label: 'Event', active: false },
  { id: 'activities', label: 'Places to Visit', active: true },
  { id: 'merchandise', label: 'Merchandise', active: false },
  {
    id: 'Internet Connectivity',
    label: 'Internet Connectivity',
    active: false
  },
  { id: 'accommodation', label: 'Accommodation', active: false },
  { id: 'med-plus', label: 'Med Plus', active: false },
  { id: 'royal-concierge', label: 'Royal Concierge', active: false },
  { id: 'rides', label: 'Rides', active: false },
  { id: 'leadway', label: 'Leadway', active: false }
  // { id: 'diy', label: 'DIY', active: false },
]

export default function Activities () {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('activities')
  const router = useRouter()
  const dropdownRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [statsLoadedFromApi, setStatsLoadedFromApi] = useState(false)

  const [stats, setStats] = useState({
    yesterdayCount: 0,
    yesterdayDateStr: '',
    avgGrowthCount: 0,
    isCountIncreasing: false,
    avgGrowthPercent: '0%',
    isPctIncreasing: false
  })

  useEffect(() => {
    // If stats are already loaded from API, skip client-side calc
    if (statsLoadedFromApi || !rows || rows.length === 0) return

    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    const yesterdayDateStr = yesterday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })

    // 1. Total Bookings Yesterday
    const yesterdayCount = rows.filter(b => {
      const d = new Date(b.bookedOnRaw)
      return d >= yesterday && d <= yesterdayEnd
    }).length

    // 2. Avg Daily Growth Logic
    const bookingsByDate = {}
    rows.forEach(b => {
      const d = new Date(b.bookedOnRaw)
      if (isNaN(d.getTime())) return
      const dateKey = d.toISOString().split('T')[0]
      bookingsByDate[dateKey] = (bookingsByDate[dateKey] || 0) + 1
    })

    // Get last 30 days
    const days30 = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().split('T')[0]
      days30.push({ date: dateKey, count: bookingsByDate[dateKey] || 0 })
    }
    days30.reverse() // Oldest to newest

    // Avg Daily Count
    const totalCount30 = days30.reduce((acc, curr) => acc + curr.count, 0)
    const avgGrowthCount = Math.round(totalCount30 / 30)

    // Trend for Count (Last 7 vs Prev 7)
    const last7 = days30.slice(-7)
    const prev7 = days30.slice(-14, -7)
    const avgLast7 = last7.reduce((a, c) => a + c.count, 0) / 7
    const avgPrev7 = prev7.reduce((a, c) => a + c.count, 0) / 7
    const isCountIncreasing = avgLast7 >= avgPrev7

    // Avg Daily Growth %
    let totalPctChange = 0
    let validDays = 0
    const pctChanges = []

    for (let i = 1; i < days30.length; i++) {
      const prev = days30[i - 1].count
      const curr = days30[i].count
      let pct = 0
      if (prev === 0) {
        pct = curr > 0 ? 100 : 0
      } else {
        pct = ((curr - prev) / prev) * 100
      }
      pctChanges.push(pct)
      totalPctChange += pct
      validDays++
    }

    const avgGrowthPercentVal = validDays > 0 ? totalPctChange / validDays : 0
    const avgGrowthPercent = `${avgGrowthPercentVal.toFixed(2)}%`

    // Trend for % (Last 7 vs Prev 7)
    const last7Pct = pctChanges.slice(-7)
    const prev7Pct = pctChanges.slice(-14, -7)
    const avgLast7Pct =
      last7Pct.length > 0
        ? last7Pct.reduce((a, c) => a + c, 0) / last7Pct.length
        : 0
    const avgPrev7Pct =
      prev7Pct.length > 0
        ? prev7Pct.reduce((a, c) => a + c, 0) / prev7Pct.length
        : 0
    const isPctIncreasing = avgLast7Pct >= avgPrev7Pct

    setStats({
      yesterdayCount,
      yesterdayDateStr,
      avgGrowthCount,
      isCountIncreasing,
      avgGrowthPercent,
      isPctIncreasing
    })
  }, [rows, statsLoadedFromApi])

  const handleTabClick = tabId => {
    switch (tabId) {
      case 'bundle-orders':
        router.push('/users/bookings')
        break
      case 'event':
        router.push('/users/transactions')
        break
      case 'activities':
        router.push('/users/activities')
        break
      case 'accommodation':
        router.push('/users/accommodation')
        break
      case 'diy':
        router.push('/users/diy')
        break
      case 'merchandise':
        router.push('/users/merchandise')
        break
      case 'Internet Connectivity':
        router.push('/users/e-sim')
        break
      case 'med-plus':
        router.push('/med-orders')
        break
      case 'royal-concierge':
        router.push('/royal-concierge')
        break
      case 'rides':
        router.push('/users/rides')
        break
      case 'leadway':
        router.push('/leadway')
        break
      default:
        setActiveTab(tabId)
    }
  }

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getActivityBookedTickets()
        let data = []

        if (
          res?.data &&
          typeof res.data === 'object' &&
          !Array.isArray(res.data) &&
          (typeof res.totalBookingsYesterday !== 'undefined' ||
            typeof res.data.totalBookingsYesterday !== 'undefined' ||
            res.data ||
            res.data.bookings)
        ) {
          // Structure from user snippet: { success: true, message: "...", total: 2, totalBookingsYesterday: 0, yesterdayDate: "...", ... data: [...] }
          // OR it might be inside res.data depending on axios interceptor
          // Let's assume 'res' is the response object from axios interceptor which returns response.data
          // The snippet shows keys at root level if res is the object.

          const d = res // The object itself as per snippet

          if (Array.isArray(d.data)) data = d.data
          else if (Array.isArray(d.bookings)) data = d.bookings
          else data = []

          // Extract Stats
          const yesterdayCount = Number(d.totalBookingsYesterday || 0)
          let yesterdayDateStr = d.yesterdayDate || ''
          const yDate = new Date(yesterdayDateStr)
          if (!isNaN(yDate.getTime())) {
            yesterdayDateStr = yDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })
          }

          const avgGrowthCount = Number(d.avgDailyGrowthCount || 0)
          const avgGrowthPercentStr = String(d.avgDailyGrowthPercent || '0%')
          const avgGrowthPercentVal = parseFloat(
            avgGrowthPercentStr.replace('%', '')
          )

          setStats({
            yesterdayCount,
            yesterdayDateStr,
            avgGrowthCount,
            isCountIncreasing: avgGrowthCount >= 0,
            avgGrowthPercent: avgGrowthPercentStr,
            isPctIncreasing: avgGrowthPercentVal >= 0
          })
          setStatsLoadedFromApi(true)
        } else {
          // Fallback or different structure
          data = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
            ? res
            : []
          setStatsLoadedFromApi(false)
        }

        const mapped = data.map((b, idx) => {
          const activityObj = b?.activityId || b?.activity || {}
          const img = toImageUrl(activityObj?.image || b?.activityImage)
          const type =
            activityObj?.activityType?.activityTypeName ||
            b?.activity?.activityType?.activityTypeName ||
            activityObj?.type ||
            b?.type ||
            '-'
          const pay = String(b?.paymentStatus || '-')
          const payNice = pay.toLowerCase() === 'paid' ? 'Paid' : pay

          const bookedOnRaw = b.createdAt || b.updatedAt
          const bookedOn = formatBookedOn(bookedOnRaw)
          const arrivalDate = formatBookedOn(b.arrivalDate)

          const buyer = b.buyer || {}
          const buyerName = buyer.fullName || buyer.name || '-'
          const buyerEmail = buyer.email || '-'
          const buyerPhone = buyer.phone || buyer.phoneNumber || '-'

          const createdTs = bookedOnRaw ? new Date(bookedOnRaw).getTime() : 0

          return {
            id: b._id || b.id || b.bookingId || `booking-${idx}`,
            bookedOn,
            bookedOnRaw,
            arrivalDate,
            activityName: activityObj?.activityName || b?.activityName || '-',
            activityImage: img,
            type: type,
            ticketsBooked: ticketsText(b?.tickets),
            additionalInfo: '',
            amount: fmtCurrency(ticketsTotal(b)),
            activityStatus: String(b?.status || b?.bookingStatus || 'Pending'),
            paymentStatus: payNice,
            paymentStatusClass: statusClass(b?.paymentStatus),
            buyerName,
            buyerEmail,
            buyerPhone,
            raw: b,
            sortTs: createdTs
          }
        })
        setRows(mapped)
      } catch (e) {
        setError('Failed to load activity bookings')
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredActivities = rows.filter(r => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    const termDigits = term.replace(/[^0-9]/g, '')
    const name = String(r.activityName || '').toLowerCase()
    const type = String(r.type || '').toLowerCase()
    const bookedOn = String(r.bookedOn || '').toLowerCase()
    const buyerName = String(r.buyerName || '').toLowerCase()
    const buyerEmail = String(r.buyerEmail || '').toLowerCase()
    const buyerPhone = String(r.buyerPhone || '').toLowerCase()
    const tickets = String(r.ticketsBooked || '').toLowerCase()
    const amount = String(r.amount || '').toLowerCase()
    const ps = String(r.paymentStatus || '').toLowerCase()
    const as = String(r.activityStatus || '').toLowerCase()
    const matchesText =
      name.includes(term) ||
      type.includes(term) ||
      bookedOn.includes(term) ||
      buyerName.includes(term) ||
      buyerEmail.includes(term) ||
      buyerPhone.includes(term) ||
      tickets.includes(term) ||
      amount.includes(term) ||
      ps.includes(term) ||
      as.includes(term)
    const matchesDigits =
      termDigits &&
      (buyerPhone.includes(termDigits) ||
        String(r.amount || '')
          .replace(/[^0-9]/g, '')
          .includes(termDigits))
    return matchesText || matchesDigits
  })

  const toggleSort = key => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'date':
        return (a.sortTs - b.sortTs) * dir
      case 'activityName':
        return (
          String(a.activityName || '').localeCompare(
            String(b.activityName || '')
          ) * dir
        )
      case 'userName':
        return (
          String(a.buyerName || '').localeCompare(String(b.buyerName || '')) *
          dir
        )
      case 'email':
        return (
          String(a.buyerEmail || '').localeCompare(String(b.buyerEmail || '')) *
          dir
        )
      case 'phone':
        return (
          String(a.buyerPhone || '').localeCompare(String(b.buyerPhone || '')) *
          dir
        )
      case 'tickets':
        return (
          String(a.ticketsBooked || '').localeCompare(
            String(b.ticketsBooked || '')
          ) * dir
        )
      case 'amount':
        return (
          (Number(String(a.amount).replace(/[^0-9.-]/g, '')) -
            Number(String(b.amount).replace(/[^0-9.-]/g, ''))) *
          dir
        )
      case 'arrivalDate':
        return (
          String(a.arrivalDate || '').localeCompare(
            String(b.arrivalDate || '')
          ) * dir
        )
      case 'activityStatus':
        return (
          String(a.activityStatus || '').localeCompare(
            String(b.activityStatus || '')
          ) * dir
        )
      case 'paymentStatus':
        return (
          String(a.paymentStatus || '').localeCompare(
            String(b.paymentStatus || '')
          ) * dir
        )
      default:
        return 0
    }
  })

  const getActivityStatusColor = status => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800'
      case 'Ongoing':
        return 'bg-blue-100 text-blue-800'
      case 'Upcoming':
        return 'bg-red-100 text-red-800'
      case 'TBL':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = status => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800'
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Pending':
        return 'bg-orange-100 text-orange-800'
      case 'Incomplete':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDownloadExcel = () => {
    if (!sortedActivities || sortedActivities.length === 0) {
      return
    }
    const dataToExport = sortedActivities.map(r => {
      const b = r.raw || {}
      const buyer = b.buyer || {}
      const user = b.userId || {}
      const pricing = b.pricing || {}

      // Format tickets and attendees details
      const ticketsInfo = Array.isArray(b.tickets)
        ? b.tickets
            .map(t => {
              const attendees = Array.isArray(t.attendees)
                ? t.attendees.map(a => `${a.fullName} (${a.email})`).join(', ')
                : ''
              return `[Ticket: ${t.ticketName || '-'}, Type: ${
                t.ticketType || '-'
              }, Qty: ${t.quantity || 0}, Price: ${
                t.perTicketPrice || 0
              }, Total: ${t.totalPrice || 0}, Attendees: (${attendees})]`
            })
            .join('; ')
        : ''

      return {
        'Booking ID': b._id || b.id,
        'Order ID': b.orderId,
        'Created At': b.createdAt,
        'Arrival Date': b.arrivalDate,
        Status: r.activityStatus,
        'Payment Status': b.paymentStatus,
        'Referral Code': b.referralCode,

        // Buyer Details
        'Buyer Name': buyer.fullName,
        'Buyer Email': buyer.email,
        'Buyer Phone': buyer.phone,
        'Buyer Country': buyer.country,
        'Buyer City': buyer.city,

        // User Details
        'User ID': user._id,
        'User Name': user.name,
        'User Email': user.email,
        'User Phone': user.phoneNumber,

        // Activity Details
        'Activity Name': r.activityName,
        'Activity Type': r.type,

        // Pricing
        'Service Fee': pricing.serviceFee,
        'Discount Applied': pricing.discountApplied,
        'Total Amount': r.amount,

        // Tickets & Attendees
        'Tickets Details': ticketsInfo
      }
    })
    downloadExcel(dataToExport, 'Places_To_Visit_Bookings.xlsx')
  }

  return (
    <div className='p-4 min-h-screen bg-white overflow-x-hidden'>
      {/* Title and Breadcrumb */}
      <div className='mb-4'>
        <h1 className='text-xl font-bold text-gray-900 mb-1'>Bookings</h1>
        <nav className='text-sm text-gray-500'>
          <span>Dashboard</span> / <span>Users</span>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        {/* Total Bookings Yesterday */}
        <div className='bg-indigo-600 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <Ticket className='w-6 h-6 text-indigo-600' />
            </div>
            <div>
              <p className='text-xs opacity-90'>
                Total Bookings Yesterday{' '}
                <span className='text-[10px] opacity-75'>
                  ({stats.yesterdayDateStr})
                </span>
              </p>
              <p className='text-2xl font-bold'>{stats.yesterdayCount}</p>
            </div>
          </div>
        </div>

        {/* Avg Daily Growth (Count) */}
        <div className='bg-purple-600 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TrendingUp className='w-6 h-6 text-purple-600' />
            </div>
            <div>
              <p className='text-xs opacity-90'>Avg Daily Growth (Count)</p>
              <div className='flex items-end gap-2'>
                <p className='text-2xl font-bold'>{stats.avgGrowthCount}</p>
                {stats.isCountIncreasing ? (
                  <span className='text-xs flex items-center mb-1 text-green-200'>
                    <TrendingUp className='w-3 h-3 mr-0.5' />
                    Increasing
                  </span>
                ) : (
                  <span className='text-xs flex items-center mb-1 text-red-200'>
                    <TrendingDown className='w-3 h-3 mr-0.5' />
                    Decreasing
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Avg Daily Growth (%) */}
        <div className='bg-teal-600 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <BarChart2 className='w-6 h-6 text-teal-600' />
            </div>
            <div>
              <p className='text-xs opacity-90'>Avg Daily Growth (%)</p>
              <div className='flex items-end gap-2'>
                <p className='text-2xl font-bold'>{stats.avgGrowthPercent}</p>
                {stats.isPctIncreasing ? (
                  <span className='text-xs flex items-center mb-1 text-green-200'>
                    <TrendingUp className='w-3 h-3 mr-0.5' />
                    Increasing
                  </span>
                ) : (
                  <span className='text-xs flex items-center mb-1 text-red-200'>
                    <TrendingDown className='w-3 h-3 mr-0.5' />
                    Decreasing
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-gray-200 p-5 rounded-xl'>
        {/* Main Content */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          {/* Header with Search and Filters */}
          <div className='p-4 border-b border-gray-200'>
            <div className='flex justify-between items-center mb-3'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Booking List
              </h2>
              <div className='flex items-center space-x-3'>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='h-9 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-gray-900 placeholder-gray-500'
                  />
                  <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-600' />
                </div>

                {/* Filters */}
                <button className='h-9 flex items-center px-4 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'>
                  <svg
                    className='w-4 h-4 mr-2 text-gray-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z'
                    />
                  </svg>
                  <span className='text-xs text-gray-700 font-medium'>Filters</span>
                </button>

                {/* Download */}
                <button
                  onClick={handleDownloadExcel}
                  className='h-9 flex items-center px-4 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
                >
                  <svg
                    className='w-4 h-4 text-gray-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3'
                    />
                  </svg>
                  <span className='ml-2 text-xs text-gray-700 font-medium'>Export</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className='flex flex-wrap gap-1.5 mt-3'>
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
                    tab.id === activeTab
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('date')}
                      className='flex items-center'
                    >
                      <span>Booked On</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('activityName')}
                      className='flex items-center'
                    >
                      <span>Activity Name</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('userName')}
                      className='flex items-center'
                    >
                      <span>User Name</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('email')}
                      className='flex items-center'
                    >
                      <span>Email ID</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('phone')}
                      className='flex items-center'
                    >
                      <span>Phone Number</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('tickets')}
                      className='flex items-center'
                    >
                      <span>Tickets Booked</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('amount')}
                      className='flex items-center'
                    >
                      <span>Amount</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('arrivalDate')}
                      className='flex items-center'
                    >
                      <span>Arrival Date</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('paymentStatus')}
                      className='flex items-center'
                    >
                      <span>Payment Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <button
                      type='button'
                      onClick={() => toggleSort('activityStatus')}
                      className='flex items-center'
                    >
                      <span>Activity Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </button>
                  </th>
                  <th className='px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20'></th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {error && rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {error}
                    </td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td
                      colSpan={11}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : sortedActivities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  sortedActivities.map(activity => (
                    <tr
                      key={activity.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {activity.bookedOn}
                      </td>

                      <td className='px-3 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='flex-shrink-0 h-10 w-10'>
                            {activity.activityImage ? (
                              <img
                                className='h-10 w-10 rounded-lg object-cover'
                                src={activity.activityImage}
                                alt={activity.activityName}
                                onError={e => {
                                  e.target.style.display = 'none'
                                  const fb = e.target.nextSibling
                                  if (fb) fb.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div
                              className='h-10 w-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center'
                              style={{
                                display: activity.activityImage
                                  ? 'none'
                                  : 'flex'
                              }}
                            >
                              <svg
                                className='w-5 h-5 text-white'
                                fill='currentColor'
                                viewBox='0 0 20 20'
                              >
                                <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                              </svg>
                            </div>
                          </div>
                          <div className='ml-3'>
                            <div className='text-sm font-medium text-gray-900'>
                              {activity.activityName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className='px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {activity.buyerName}
                      </td>

                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {activity.buyerEmail}
                      </td>

                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {activity.buyerPhone}
                      </td>

                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {activity.ticketsBooked}
                      </td>

                      <td className='px-3 py-4 whitespace-nowrap text-sm font-bold text-gray-900'>
                        {activity.amount}
                      </td>

                      <td className='px-3 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {activity.arrivalDate}
                      </td>

                      <td className='px-3 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${activity.paymentStatusClass}`}
                        >
                          {activity.paymentStatus}
                        </span>
                      </td>

                      <td className='px-3 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActivityStatusColor(
                            activity.activityStatus
                          )}`}
                        >
                          {activity.activityStatus}
                        </span>
                      </td>

                      <td className='px-6 py-3 whitespace-nowrap text-right relative'>
                        <div className='flex items-center justify-center self-center relative'>
                          <button
                            onClick={e => {
                              if (menuOpenId === activity.id) {
                                setMenuOpenId(null)
                              } else {
                                const rect =
                                  e.currentTarget.getBoundingClientRect()
                                const widthPx = 208
                                const top = Math.round(rect.bottom + 6)
                                const left = Math.round(rect.right - widthPx)
                                setMenuPos({ top, left })
                                setMenuOpenId(activity.id)
                              }
                            }}
                            className='rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </button>
                          {menuOpenId === activity.id && (
                            <div
                              ref={dropdownRef}
                              className='fixed min-w-48 w-52 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-50'
                              style={{ top: menuPos.top, left: menuPos.left }}
                            >
                              <button
                                onClick={() => {
                                  const b = activity.raw || activity
                                  const id = toIdString(
                                    b._id || b.id || b.bookingId
                                  )
                                  const aid = toIdString(
                                    b.activityId ||
                                      (b.activity && b.activity._id)
                                  )
                                  const qs = aid
                                    ? `?activityId=${encodeURIComponent(
                                        String(aid)
                                      )}`
                                    : ''
                                  if (id) {
                                    router.push(
                                      `/places-to-visit/tickets-booked/view/${encodeURIComponent(
                                        String(id)
                                      )}${qs}`
                                    )
                                  } else {
                                    setSelectedBooking(b)
                                    setTicketOpen(true)
                                  }
                                  setMenuOpenId(null)
                                }}
                                className='flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                              >
                                <Ticket className='h-4 w-4' />
                                View Ticket
                              </button>
                              <button
                                onClick={() => {
                                  const b = activity.raw || activity
                                  setSelectedBooking(b)
                                  setCustomerOpen(true)
                                  setMenuOpenId(null)
                                }}
                                className='flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                              >
                                <User className='h-4 w-4' />
                                Customer Detail
                              </button>
                              {(() => {
                                const bid = toIdString(
                                  (activity.raw &&
                                    (activity.raw._id ||
                                      activity.raw.id ||
                                      activity.raw.bookingId)) ||
                                    activity.id
                                )
                                const isDownloading =
                                  String(downloadingId || '') === String(bid)
                                return (
                                  <button
                                    onClick={() => {
                                      const b = activity.raw || activity
                                      const id = toIdString(
                                        b._id || b.id || b.bookingId
                                      )
                                      const aid = toIdString(
                                        b.activityId ||
                                          (b.activity && b.activity._id)
                                      )
                                      if (!id) {
                                        alert('Invalid booking id')
                                        return
                                      }
                                      if (
                                        !(
                                          (b.buyer && b.buyer.fullName) ||
                                          (Array.isArray(b.tickets) &&
                                            b.tickets.some(
                                              t =>
                                                Array.isArray(t.attendees) &&
                                                t.attendees.length > 0
                                            ))
                                        )
                                      ) {
                                        alert(
                                          'Buyer or attendee details missing for this booking'
                                        )
                                        return
                                      }
                                      ;(async () => {
                                        try {
                                          if (
                                            String(downloadingId || '') ===
                                            String(id)
                                          )
                                            return
                                          setDownloadingId(id)
                                          const res =
                                            await downloadActivityBookedTicket(
                                              id,
                                              aid
                                            )
                                          const pdfUrl =
                                            res?.data?.pdfUrl ||
                                            res?.pdfUrl ||
                                            ''
                                          if (!pdfUrl) {
                                            const msg =
                                              res?.message ||
                                              'Failed to download ticket'
                                            throw new Error(msg)
                                          }
                                          try {
                                            const r = await fetch(pdfUrl)
                                            const blob = await r.blob()
                                            const a =
                                              document.createElement('a')
                                            const objectUrl =
                                              URL.createObjectURL(blob)
                                            a.href = objectUrl
                                            a.download = `ticket-${id}.pdf`
                                            document.body.appendChild(a)
                                            a.click()
                                            document.body.removeChild(a)
                                            URL.revokeObjectURL(objectUrl)
                                          } catch {
                                            window.open(pdfUrl, '_blank')
                                          }
                                        } catch (e) {
                                          const msg =
                                            e?.response?.data?.message ||
                                            e?.message ||
                                            'Failed to download ticket'
                                          alert(msg)
                                        } finally {
                                          setDownloadingId(null)
                                          setMenuOpenId(null)
                                        }
                                      })()
                                    }}
                                    disabled={isDownloading}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${
                                      isDownloading
                                        ? 'text-[#8C93AF] cursor-not-allowed opacity-70'
                                        : 'text-[#2D3658] hover:bg-[#F6F7FD]'
                                    }`}
                                  >
                                    {isDownloading ? (
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : (
                                      <Download className='h-4 w-4' />
                                    )}
                                    {isDownloading
                                      ? 'Processing…'
                                      : 'Download Ticket'}
                                  </button>
                                )
                              })()}
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

      {ticketOpen && selectedBooking && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              setTicketOpen(false)
              setSelectedBooking(null)
            }}
          />
          <div className='relative z-50 w-full max-w-lg rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='text-lg font-semibold text-slate-900 mb-3'>
              Ticket
            </div>
            <div className='space-y-2 text-sm text-[#2D3658]'>
              <div className='flex justify-between'>
                <span>Booking ID</span>
                <span>
                  {selectedBooking._id ||
                    selectedBooking.id ||
                    selectedBooking.bookingId ||
                    '-'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Booked On</span>
                <span>
                  {(() => {
                    const d =
                      selectedBooking.createdAt || selectedBooking.updatedAt
                    const date = d
                      ? new Date(typeof d === 'object' && d.$date ? d.$date : d)
                      : null
                    return date ? date.toLocaleString() : '-'
                  })()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Tickets</span>
                <span>
                  {Array.isArray(selectedBooking.tickets)
                    ? selectedBooking.tickets
                        .map(t => `${t.quantity} x ${t.ticketName}`)
                        .join(', ')
                    : '-'}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>Amount</span>
                <span>{fmtCurrency(ticketsTotal(selectedBooking))}</span>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setTicketOpen(false)
                  setSelectedBooking(null)
                }}
                className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {customerOpen && selectedBooking && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              setCustomerOpen(false)
              setSelectedBooking(null)
            }}
          />
          <div className='relative z-50 w-full max-w-2xl rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='text-lg font-semibold text-slate-900 mb-3'>
              Customer Detail
            </div>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div className='text-[#5E6582]'>Name</div>
              <div className='text-right font-semibold text-slate-900'>
                {(() => {
                  const c = selectedBooking.buyer || {}
                  return c.fullName || c.name || '-'
                })()}
              </div>
              <div className='text-[#5E6582]'>Email</div>
              <div className='text-right font-semibold text-slate-900'>
                {(() => {
                  const c = selectedBooking.buyer || {}
                  return c.email || '-'
                })()}
              </div>
              <div className='text-[#5E6582]'>Phone</div>
              <div className='text-right font-semibold text-slate-900'>
                {(() => {
                  const c = selectedBooking.buyer || {}
                  return c.phone || '-'
                })()}
              </div>
            </div>
            {/* {Array.isArray(selectedBooking.tickets) &&
            selectedBooking.tickets.some(
              t => Array.isArray(t.attendees) && t.attendees.length > 0
            ) ? (
              <div className='rounded-xl border border-[#E5E8F6] bg-white p-4 mt-4'>
                <div className='text-sm font-semibold text-slate-900 mb-3'>
                  Attendees
                </div>
                <div className='space-y-2'>
                  {selectedBooking.tickets
                    .flatMap(t =>
                      Array.isArray(t.attendees)
                        ? t.attendees.map(a => ({ ...a }))
                        : []
                    )
                    .map((a, i) => (
                      <div
                        key={`att-${i}`}
                        className='grid grid-cols-2 gap-4 text-sm'
                      >
                        <div className='text-[#5E6582]'>
                          {a.fullName || '-'}
                        </div>
                        <div className='text-right text-[#2D3658]'>
                          {a.email || a.phone || '-'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : null} */}
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setCustomerOpen(false)
                  setSelectedBooking(null)
                }}
                className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
