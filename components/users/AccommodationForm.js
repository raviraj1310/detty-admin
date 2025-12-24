'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { TbTicket, TbTrendingUp, TbTrendingDown } from 'react-icons/tb'
import { FaChartColumn } from 'react-icons/fa6'
import { downloadExcel } from '@/utils/excelExport'
import { getAllAccommodationOrders } from '@/services/merchandise/order.service'

const toCurrency = n => {
  const num = typeof n === 'number' ? n : Number(n || 0)
  if (Number.isNaN(num)) return '-'
  return `₦${num.toLocaleString()}`
}

const toDateText = iso => {
  const dt = iso ? new Date(iso) : null
  if (!dt || isNaN(dt.getTime())) return '-'
  const day = dt.toLocaleDateString(undefined, { weekday: 'short' })
  const month = dt.toLocaleDateString(undefined, { month: 'long' })
  const dayNum = dt.toLocaleDateString(undefined, { day: '2-digit' })
  const year = dt.toLocaleDateString(undefined, { year: 'numeric' })
  const timeStr = dt.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
  return `${day}, ${month} ${dayNum}, ${year}, ${timeStr}`
}

const deriveStatus = (checkInDate, checkOutDate) => {
  const now = Date.now()
  const inTs = checkInDate ? new Date(checkInDate).getTime() : 0
  const outTs = checkOutDate ? new Date(checkOutDate).getTime() : 0
  if (inTs && now < inTs) return 'Upcoming'
  if (inTs && outTs && now >= inTs && now <= outTs) return 'Ongoing'
  if (outTs && now > outTs) return 'Done'
  return 'TBL'
}

const mapAccommodationRows = (arr = []) => {
  const list = Array.isArray(arr) ? arr : []
  return list.map((b, idx) => {
    const id = String(b?._id || idx)
    const addedOn = toDateText(b?.createdAt)
    const propertyName = b?.hotelName || b?.roomName || '-'
    const propertyType = b?.roomName || '-'
    const checkIn = b?.checkInDate
    const checkOut = b?.checkOutDate
    const bookings = `${toDateText(checkIn)} — ${toDateText(checkOut)}`
    const amount = toCurrency(b?.amount)
    const amountNum = Number(b?.amount || 0)
    const status = deriveStatus(checkIn, checkOut)
    const paymentStatus = /paid/i.test(String(b?.paymentStatus || ''))
      ? 'Completed'
      : 'Incomplete'
    const userObj =
      typeof b?.userId === 'object' && b.userId
        ? {
            _id: String(b.userId._id || ''),
            name: String(b.userId.name || ''),
            email: String(b.userId.email || '')
          }
        : null
    const userIdVal = userObj ? userObj._id : String(b?.userId || '')
    return {
      id,
      user: userObj,
      userId: userIdVal,
      transactionRef: b?.transactionRef || '',
      transactionId: b?.transactionId || '',
      addedOn,
      propertyName,
      propertyType,
      bookings,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      additionalInfo: '',
      amount,
      status,
      paymentStatus,
      raw: b
    }
  })
}

function ActionDropdown ({ accommodationId, row, openCustomer }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })

  const actions = [
    {
      label: 'View Order',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3 7h18M3 12h18M3 17h18'
          />
        </svg>
      )
    },
    {
      label: 'Customer Detail',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M5.121 17.804A8 8 0 1116.88 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z'
          />
        </svg>
      )
    }
  ]

  const handleButtonClick = e => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const dropdownHeight = 150

      let top = rect.bottom + 8
      let right = window.innerWidth - rect.right

      if (top + dropdownHeight > windowHeight) {
        top = rect.top - dropdownHeight - 8
      }

      setButtonPosition({ top, right })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className='relative'>
      <button
        onClick={handleButtonClick}
        className='p-1 hover:bg-gray-100 rounded-full transition-colors'
      >
        <svg
          className='w-5 h-5 text-gray-600'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsOpen(false)}
          />
          <div
            className='fixed w-52 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 py-2'
            style={{
              top: `${buttonPosition.top}px`,
              right: `${buttonPosition.right}px`
            }}
          >
            {actions.map((action, index) => (
              <button
                key={index}
                className='flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                onClick={() => {
                  if (action.label === 'Customer Detail' && openCustomer) {
                    openCustomer(row)
                  } else if (action.label === 'View Order') {
                    const idStr = String(accommodationId || '').trim()
                    if (idStr) {
                      router.push(
                        `/accommodation/order-view/${encodeURIComponent(idStr)}`
                      )
                    }
                  } else {
                    console.log(
                      `${action.label} for accommodation ${accommodationId}`
                    )
                  }
                  setIsOpen(false)
                }}
              >
                <span className='mr-3 text-gray-500'>{action.icon}</span>
                <span className='text-gray-800'>{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: false },
  { id: 'event', label: 'Event', active: false },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: false },
  { id: 'accommodation', label: 'Accommodation', active: true },
  { id: 'med-plus', label: 'Med Plus', active: false },
  { id: 'royal-concierge', label: 'Royal Concierge', active: false },
  { id: 'rides', label: 'Rides', active: false },
  { id: 'leadway', label: 'Leadway', active: false }
  // { id: 'diy', label: 'DIY', active: false },
]

export default function AccommodationPage () {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [activeTab, setActiveTab] = useState('accommodation')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customerOpen, setCustomerOpen] = useState(false)
  const [customerLoading, setCustomerLoading] = useState(false)
  const [customer, setCustomer] = useState(null)
  const router = useRouter()
  const [stats, setStats] = useState({
    yesterdayCount: 0,
    yesterdayDateStr: '',
    avgGrowthCount: 0,
    isCountIncreasing: false,
    avgGrowthPercent: '0%',
    isPctIncreasing: false
  })

  const handleTabClick = tabId => {
    switch (tabId) {
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
      case 'e-sim':
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
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getAllAccommodationOrders({
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined
        })
        const d = res
        const yesterdayCount = Number(d.totalPurchasingYesterday || 0)

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayDateStr = yesterday.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })

        const avgGrowthCount = Number(
          d.growthCount ?? d.avgDailyGrowthCount ?? 0
        )
        const gp = d.growthPercent ?? d.avgDailyGrowthPercent ?? '0%'
        const avgGrowthPercentStr =
          typeof gp === 'number' ? `${gp}%` : String(gp)
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

        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        setRows(mapAccommodationRows(list))
      } catch (e) {
        setRows([])
        setError('Failed to load accommodation bookings')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [dateRange.start, dateRange.end])

  // Calculate stats client-side if not loaded from API or if filtered
  useEffect(() => {
    if (!rows || rows.length === 0) return

    // If a filter is active, we recalculate based on the filtered range.
    const isFiltered = dateRange.start || dateRange.end

    // Only recalculate if filtered. If not filtered, we trust the API stats (loaded in the first useEffect)
    // UNLESS we want to support dynamic updates even without filter if rows change?
    // The pattern in other files is: if statsLoadedFromApi && !isFiltered return.
    // But here I don't have `statsLoadedFromApi` state. I should probably add it or just check isFiltered.
    // However, the initial load fetches ALL orders (presumably) or just a list.
    // Let's assume we want to recalculate if filtered.
    if (!isFiltered) return

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

    // 1. Total Purchasing Yesterday (Always absolute based on loaded data?)
    // Actually, if we are filtering, "Yesterday" might not be relevant to the filter range,
    // but the card says "Total purchasing Yesterday". Usually this stays static or respects the filter?
    // In previous files, we kept yesterday count absolute based on "Yesterday", but derived from the data.
    const yesterdayCount = rows.filter(o => {
      const d = new Date(o.raw?.createdAt)
      return d >= yesterday && d <= yesterdayEnd
    }).length

    // 2. Avg Daily Growth Logic (Filter Aware)
    let start, end, daysCount

    if (dateRange.start) {
      start = new Date(dateRange.start)
      start.setHours(0, 0, 0, 0)
    } else {
      // No start, default to 30 days before end
      end = new Date(dateRange.end)
      start = new Date(end)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
    }

    if (dateRange.end) {
      end = new Date(dateRange.end)
      end.setHours(23, 59, 59, 999)
    } else {
      // Start but no end, default to Today
      end = new Date()
      end.setHours(23, 59, 59, 999)
    }

    // Validate
    if (start > end) {
      end = new Date()
      start = new Date()
      start.setDate(now.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }

    const diffTime = Math.abs(end - start)
    daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (daysCount < 1) daysCount = 1

    const bookingsByDate = {}
    rows.forEach(o => {
      const d = new Date(o.raw?.createdAt)
      if (isNaN(d.getTime())) return
      if (d >= start && d <= end) {
        const dateKey = d.toISOString().split('T')[0]
        bookingsByDate[dateKey] = (bookingsByDate[dateKey] || 0) + 1
      }
    })

    // Generate daily buckets
    const dailyData = []
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateKey = d.toISOString().split('T')[0]
      dailyData.push({ date: dateKey, count: bookingsByDate[dateKey] || 0 })
    }

    // Avg Daily Count
    const totalCount = dailyData.reduce((acc, curr) => acc + curr.count, 0)
    const avgGrowthCount = Math.round(totalCount / daysCount)

    // Trend for Count (Compare first half vs second half of the period)
    let isCountIncreasing = false
    if (dailyData.length >= 2) {
      const mid = Math.floor(dailyData.length / 2)
      const firstHalf = dailyData.slice(0, mid)
      const secondHalf = dailyData.slice(mid)
      const avgFirst =
        firstHalf.reduce((a, c) => a + c.count, 0) / firstHalf.length
      const avgSecond =
        secondHalf.reduce((a, c) => a + c.count, 0) / secondHalf.length
      isCountIncreasing = avgSecond >= avgFirst
    }

    // Avg Daily Growth %
    let totalPctChange = 0
    let validDays = 0
    const pctChanges = []

    for (let i = 1; i < dailyData.length; i++) {
      const prev = dailyData[i - 1].count
      const curr = dailyData[i].count
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
    const finalGrowthPercent = Math.min(avgGrowthPercentVal, 100)
    const avgGrowthPercent = `${finalGrowthPercent.toFixed(2)}%`

    // Trend for %
    let isPctIncreasing = false
    if (pctChanges.length >= 2) {
      const mid = Math.floor(pctChanges.length / 2)
      const firstHalf = pctChanges.slice(0, mid)
      const secondHalf = pctChanges.slice(mid)
      const avgFirst = firstHalf.reduce((a, c) => a + c, 0) / firstHalf.length
      const avgSecond =
        secondHalf.reduce((a, c) => a + c, 0) / secondHalf.length
      isPctIncreasing = avgSecond >= avgFirst
    }

    setStats({
      yesterdayCount,
      yesterdayDateStr,
      avgGrowthCount,
      isCountIncreasing,
      avgGrowthPercent,
      isPctIncreasing
    })
  }, [rows, dateRange])

  const filteredAccommodations = useMemo(
    () =>
      rows.filter(accommodation => {
        const term = String(searchTerm || '')
          .trim()
          .toLowerCase()

        // Date Range Filtering
        const bookingTime = new Date(accommodation.raw?.createdAt).getTime()
        const startTime = dateRange.start
          ? new Date(dateRange.start).setHours(0, 0, 0, 0)
          : null
        const endTime = dateRange.end
          ? new Date(dateRange.end).setHours(23, 59, 59, 999)
          : null

        const matchesDate =
          (!startTime || bookingTime >= startTime) &&
          (!endTime || bookingTime <= endTime)

        if (!term) return matchesDate

        const termDigits = term.replace(/[^0-9]/g, '')
        const name = String(accommodation.propertyName || '').toLowerCase()
        const type = String(accommodation.propertyType || '').toLowerCase()
        const addedStr = String(accommodation.addedOn || '').toLowerCase()
        const addedDigits = String(accommodation.addedOn || '').replace(
          /[^0-9]/g,
          ''
        )
        const matchesText =
          name.includes(term) || type.includes(term) || addedStr.includes(term)
        const matchesDigits = termDigits && addedDigits.includes(termDigits)
        return matchesDate && (matchesText || matchesDigits)
      }),
    [rows, searchTerm, dateRange]
  )

  const openCustomer = async row => {
    setCustomerOpen(true)
    setCustomerLoading(true)
    try {
      const user = row?.user || {}
      setCustomer({
        name: String(user?.name || user?.fullName || '-'),
        email: String(user?.email || '-'),
        phone: String(user?.phone || user?.phoneNumber || '-'),
        transactionId: row?.transactionId || '-',
        transactionRef: row?.transactionRef || '-',
        amount: row?.amount || '-',
        paymentStatus: row?.paymentStatus || '-',
        checkInDate: toDateText(row?.checkInDate) || '-',
        checkOutDate: toDateText(row?.checkOutDate) || '-',
        propertyName: row?.propertyName || '-'
      })
    } catch (e) {
      setCustomer({
        name: '-',
        email: '-',
        phone: '-',
        transactionId: '-',
        transactionRef: '-',
        amount: '-',
        paymentStatus: '-',
        checkInDate: '-',
        checkOutDate: '-',
        propertyName: '-'
      })
    } finally {
      setCustomerLoading(false)
    }
  }

  const getStatusColor = status => {
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
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Incomplete':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDownloadExcel = () => {
    if (!filteredAccommodations || filteredAccommodations.length === 0) {
      return
    }
    const dataToExport = filteredAccommodations.map(r => {
      const b = r.raw || {}
      const user = b.userId || {}
      return {
        _id: b._id,
        finalPayableAmount: b.finalPayableAmount || 0,
        hotelName: b.hotelName,
        roomName: b.roomName,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        amount: b.amount,
        paymentStatus: b.paymentStatus,
        transactionRef: b.transactionRef,
        transactionId: b.transactionId,
        noOfRooms: b.noOfRooms,
        guests: b.guests,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        __v: b.__v,

        // User Details flattened
        'user._id': user._id,
        'user.name': user.name,
        'user.email': user.email
      }
    })
    downloadExcel(dataToExport, 'Accommodation_Bookings.xlsx')
  }

  return (
    <div className='p-4 min-h-screen bg-white overflow-x-hidden'>
      {/* Title and Breadcrumb */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 mb-1'>
            Gross Transaction Value
          </h1>
          <nav className='text-sm text-gray-500'>
            <span>Dashboard</span> / <span>Gross Transaction Value</span>
          </nav>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2'>
            <div className='flex flex-col'>
              <label className='text-[10px] text-gray-500 font-medium ml-1'>
                Start Date
              </label>
              <input
                type='date'
                value={dateRange.start}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, start: e.target.value }))
                }
                className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500'
              />
            </div>
            <span className='text-gray-400 mt-4'>-</span>
            <div className='flex flex-col'>
              <label className='text-[10px] text-gray-500 font-medium ml-1'>
                End Date
              </label>
              <input
                type='date'
                max={new Date().toISOString().split('T')[0]}
                value={dateRange.end}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, end: e.target.value }))
                }
                className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500'
              />
            </div>
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className='mt-4 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
              title='Clear Date Filter'
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF] p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-2 rounded-lg'>
              <TbTicket className='w-6 h-6 text-indigo-600' />
            </div>
            <div className='text-right'>
              <p className='text-xs text-indigo-600 opacity-90'>
                Total purchasing Yesterday{' '}
                <span className='text-[10px] opacity-75'>
                  ({stats.yesterdayDateStr})
                </span>
              </p>
              <p className='text-2xl text-indigo-600 font-bold'>
                {stats.yesterdayCount}
              </p>
            </div>
          </div>
        </div>
        <div className='bg-gradient-to-r from-[#F3E8FF] to-[#DDD6FE] p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-2 rounded-lg'>
              <TbTrendingUp className='w-6 h-6 text-purple-600' />
            </div>
            <div className='text-right'>
              <p className='text-xs text-purple-600 opacity-90'>
                Avg Daily Growth (Count)
              </p>
              <div className='flex items-end justify-end gap-2'>
                <p className='text-2xl text-purple-600 font-bold'>
                  {stats.avgGrowthCount}
                </p>
                {stats.isCountIncreasing ? (
                  <span className='text-xs flex items-center mb-1 text-green-500'>
                    <TbTrendingUp className='w-3 h-3 mr-0.5' />
                    Increasing
                  </span>
                ) : (
                  <>
                    <p className='text-2xl text-red-600 font-bold'>
                      {stats.avgGrowthCount}
                    </p>
                    <span className='text-xs flex items-center mb-1 text-red-600'>
                      <TbTrendingDown className='w-3 h-3 mr-0.5' />
                      Decreasing
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className='bg-gradient-to-r from-[#CCFBF1] to-[#99F6E4] p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-2 rounded-lg'>
              <FaChartColumn className='w-6 h-6 text-teal-600' />
            </div>
            <div className='text-right'>
              <p className='text-xs text-teal-600 opacity-90'>
                Avg Daily Growth (%)
              </p>
              <div className='flex items-end justify-end gap-2'>
                <p className='text-2xl text-teal-600 font-bold'>
                  {stats.avgGrowthPercent}
                </p>
                {stats.isPctIncreasing ? (
                  <span className='text-xs flex items-center mb-1 text-green-500'>
                    <TbTrendingUp className='w-3 h-3 mr-0.5' />
                    Increasing
                  </span>
                ) : (
                  <>
                    <p className='text-2xl text-red-600 font-bold'>
                      {stats.avgGrowthPercent}
                    </p>
                    <span className='text-xs flex items-center mb-1 text-red-600'>
                      <TbTrendingDown className='w-3 h-3 mr-0.5' />
                      Decreasing
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Cards (Filtered) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        {/* Total Accommodation Bookings (Filtered) */}
        <div className='bg-blue-300 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTicket className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                Total Accommodation Bookings
              </p>
              <p className='text-2xl text-black font-bold'>
                {filteredAccommodations.length}{' '}
                <span className='text-lg font-semibold opacity-90'>
                  (₦
                  {filteredAccommodations
                    .reduce((acc, curr) => acc + (curr.amountNum || 0), 0)
                    .toLocaleString()}
                  )
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* New Bookings Today (Filtered) */}
        <div className='bg-orange-300 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTicket className='w-6 h-6 text-orange-600' />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                New Bookings Today
              </p>
              <p className='text-2xl text-black font-bold'>
                {
                  filteredAccommodations.filter(b => {
                    if (!b.raw?.createdAt) return false
                    const d = new Date(b.raw.createdAt)
                    const today = new Date()
                    return (
                      d.getDate() === today.getDate() &&
                      d.getMonth() === today.getMonth() &&
                      d.getFullYear() === today.getFullYear()
                    )
                  }).length
                }
              </p>
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
                Gross Transaction Value of Accommodation
              </h2>
              <div className='flex items-center space-x-3'>
                {/* Search */}
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='h-9 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-gray-900 placeholder-gray-500'
                  />
                  <svg
                    className='w-4 h-4 text-gray-600 absolute left-3 top-2.5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
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
                  <span className='text-xs text-gray-700 font-medium'>
                    Filters
                  </span>
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
                  <span className='ml-2 text-xs text-gray-700 font-medium'>
                    Export
                  </span>
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
                    <div className='flex items-center'>
                      <span>Added On</span>
                      <svg
                        className='w-3 h-3 text-gray-400 ml-1'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Property Name</span>
                      <svg
                        className='w-3 h-3 text-gray-400 ml-1'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Property Type</span>
                      <svg
                        className='w-3 h-3 text-gray-400 ml-1'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Bookings</span>
                      <svg
                        className='w-3 h-3 text-gray-400 ml-1'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Amount</span>
                      <svg
                        className='w-3 h-3 text-gray-400 ml-1'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Status</span>
                      <svg
                        className='w-3 h-3 text-gray-400 ml-1'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Payment Status</span>
                      <svg
                        className='w-3 h-3 text-gray-400 ml-1'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </th>
                  <th className='px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20'></th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredAccommodations.map(accommodation => (
                  <tr
                    key={accommodation.id}
                    className='hover:bg-gray-50 border-b border-gray-100'
                  >
                    <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                      {accommodation.addedOn}
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='flex-shrink-0 h-10 w-10 item-center'>
                          <div
                            className='h-10 w-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center'
                            style={{ display: 'none' }}
                          >
                            <svg
                              className='w-5 h-5 text-white'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path d='M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z' />
                            </svg>
                          </div>
                        </div>
                        <div className='ml-3'>
                          <div className='text-sm font-medium text-gray-900 leading-tight'>
                            {accommodation.propertyName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      <span className='text-sm font-medium text-gray-900'>
                        {accommodation.propertyType}
                      </span>
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                      <div>{accommodation.bookings}</div>
                      {accommodation.additionalInfo && (
                        <div className='text-xs text-gray-500'>
                          {accommodation.additionalInfo}
                        </div>
                      )}
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      <span className='text-sm font-semibold text-gray-900'>
                        {accommodation.amount}
                      </span>
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          accommodation.status
                        )}`}
                      >
                        • {accommodation.status}
                      </span>
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          accommodation.paymentStatus
                        )}`}
                      >
                        {accommodation.paymentStatus}
                      </span>
                    </td>
                    <td className='px-6 py-3 whitespace-nowrap text-right relative'>
                      <ActionDropdown
                        accommodationId={accommodation.id}
                        row={accommodation}
                        openCustomer={openCustomer}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {customerOpen && (
        <div className='fixed inset-0 z-[1000]'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setCustomerOpen(false)}
          ></div>
          <div className='absolute inset-0 flex items-center justify-center p-4'>
            <div className='bg-white rounded-xl shadow-xl w-full max-w-lg'>
              <div className='flex items-center justify-between px-5 py-4 border-b'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Customer Details
                </h3>
                <button
                  className='text-gray-500 hover:text-gray-700'
                  onClick={() => setCustomerOpen(false)}
                >
                  <svg
                    className='w-5 h-5'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
              <div className='px-5 py-4'>
                {customerLoading ? (
                  <div className='py-6 text-center text-sm text-[#5E6582]'>
                    Loading customer...
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>Name</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {customer?.name}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>Email</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {customer?.email}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>Phone</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {customer?.phone}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>
                        Transaction Ref
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {customer?.transactionRef}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>
                        Transaction ID
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {customer?.transactionId}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>
                        Payment Status
                      </span>
                      <span className='text-sm font-medium text-gray-900'>
                        {customer?.paymentStatus}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>Check-in</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {customer?.checkInDate}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>Check-out</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {customer?.checkOutDate}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-500'>Property</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {customer?.propertyName}
                      </span>
                    </div>
                    <div className='flex items-center justify-between pt-2 border-t'>
                      <span className='text-sm font-semibold text-gray-900'>
                        Total
                      </span>
                      <span className='text-orange-600 font-bold'>
                        {customer?.amount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
