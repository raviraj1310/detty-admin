'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import {
  TbCaretUpDownFilled,
  TbTicket,
  TbTrendingUp,
  TbTrendingDown
} from 'react-icons/tb'
import { FaChartColumn } from 'react-icons/fa6'
import { getAllEsimBookingList } from '@/services/booking/booking.service'
import { downloadExcel } from '@/utils/excelExport'

const toCurrency = n => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(Number(n) || 0)
  } catch {
    const x = Number(n) || 0
    return `₦${x.toLocaleString('en-NG')}`
  }
}

const formatDate = iso => {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  try {
    const opts = {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
    const s = d.toLocaleString('en-NG', opts)
    return s
  } catch {
    return d.toISOString()
  }
}

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: false },
  { id: 'event', label: 'Event', active: false },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: true },
  { id: 'accommodation', label: 'Accommodation', active: false },
  { id: 'med-plus', label: 'Med Plus', active: false },
  { id: 'royal-concierge', label: 'Royal Concierge', active: false },
  { id: 'rides', label: 'Rides', active: false },
  { id: 'leadway', label: 'Leadway', active: false }
  // { id: 'diy', label: 'DIY', active: false },
]

export default function EsimUsersPage () {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [activeTab, setActiveTab] = useState('e-sim')
  const [rowsRaw, setRowsRaw] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState(null)
  const router = useRouter()
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
    ;(async () => {
      try {
        const res = await getAllEsimBookingList()
        let list = []
        let hasApiStats = false

        if (typeof res?.totalBookingsYesterday !== 'undefined') {
          const d = res
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

          // Cap at 100%
          const finalGrowthPercentVal = Math.min(avgGrowthPercentVal, 100)
          const avgGrowthPercentStrCapped = `${finalGrowthPercentVal.toFixed(
            2
          )}%`

          setStats({
            yesterdayCount,
            yesterdayDateStr,
            avgGrowthCount,
            isCountIncreasing: avgGrowthCount >= 0,
            avgGrowthPercent: avgGrowthPercentStrCapped,
            isPctIncreasing: finalGrowthPercentVal >= 0
          })
          setStatsLoadedFromApi(true)
          hasApiStats = true
          if (Array.isArray(res.data)) list = res.data
          else if (Array.isArray(res.bookings)) list = res.bookings
          else if (Array.isArray(res.orders)) list = res.orders
        } else if (
          res?.data &&
          !Array.isArray(res.data) &&
          typeof res.data.totalBookingsYesterday !== 'undefined'
        ) {
          const d = res.data
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

          // Cap at 100%
          const finalGrowthPercentVal = Math.min(avgGrowthPercentVal, 100)
          const avgGrowthPercentStrCapped = `${finalGrowthPercentVal.toFixed(
            2
          )}%`

          setStats({
            yesterdayCount,
            yesterdayDateStr,
            avgGrowthCount,
            isCountIncreasing: avgGrowthCount >= 0,
            avgGrowthPercent: avgGrowthPercentStrCapped,
            isPctIncreasing: finalGrowthPercentVal >= 0
          })
          setStatsLoadedFromApi(true)
          hasApiStats = true
          if (Array.isArray(d.data)) list = d.data
          else if (Array.isArray(d.bookings)) list = d.bookings
          else if (Array.isArray(d.orders)) list = d.orders
        }

        if (!hasApiStats) {
          const payload = res?.data || res || {}
          list = Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload)
            ? payload
            : []
          setStatsLoadedFromApi(false)
        }

        setRowsRaw(list)
      } catch {
        setRowsRaw([])
      }
    })()
  }, [])

  useEffect(() => {
    if (statsLoadedFromApi || !rowsRaw || rowsRaw.length === 0) return
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
    const yesterdayCount = rowsRaw.filter(o => {
      const d = new Date(o.createdAt)
      return d >= yesterday && d <= yesterdayEnd
    }).length
    const bookingsByDate = {}
    rowsRaw.forEach(o => {
      const d = new Date(o.createdAt)
      if (isNaN(d.getTime())) return
      const dateKey = d.toISOString().split('T')[0]
      bookingsByDate[dateKey] = (bookingsByDate[dateKey] || 0) + 1
    })
    const days30 = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().split('T')[0]
      days30.push({ date: dateKey, count: bookingsByDate[dateKey] || 0 })
    }
    days30.reverse()
    const totalCount30 = days30.reduce((acc, curr) => acc + curr.count, 0)
    const avgGrowthCount = Math.round(totalCount30 / 30)
    const last7 = days30.slice(-7)
    const prev7 = days30.slice(-14, -7)
    const avgLast7 = last7.reduce((a, c) => a + c.count, 0) / 7
    const avgPrev7 = prev7.reduce((a, c) => a + c.count, 0) / 7
    const isCountIncreasing = avgLast7 >= avgPrev7
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
  }, [rowsRaw, statsLoadedFromApi])

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

  const rows = useMemo(() => {
    const list = Array.isArray(rowsRaw) ? rowsRaw : []
    const sortedList = [...list].sort((a, b) => {
      const dateA = new Date(a?.createdAt || 0)
      const dateB = new Date(b?.createdAt || 0)
      return dateB - dateA
    })
    return sortedList.map(r => ({
      id: String(r?._id || r?.id || Math.random()),
      orderId: String(r?._id || '-'),
      customerName: String(r?.name || '-'),
      eventDate: formatDate(r?.createdAt) || '-',
      amount: toCurrency(r?.amount || 0),
      activityStatus: 'Done',
      paymentStatus:
        String(r?.paymentStatus || '').toLowerCase() === 'paid'
          ? 'Completed'
          : String(r?.paymentStatus || '-')
              .charAt(0)
              .toUpperCase() +
            String(r?.paymentStatus || '-')
              .slice(1)
              .toLowerCase(),
      raw: r
    }))
  }, [rowsRaw])

  const filteredRows = rows.filter(row => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()

    // Date Range Filtering
    const bookingTime = new Date(row.raw?.createdAt).getTime()
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

    const tDigits = term.replace(/[^0-9]/g, '')
    const orderId = String(row.orderId || '').toLowerCase()
    const dateStr = String(row.eventDate || '').toLowerCase()
    const amount = String(row.amount || '').toLowerCase()
    const activity = String(row.activityStatus || '').toLowerCase()
    const payment = String(row.paymentStatus || '').toLowerCase()
    const matchesText =
      orderId.includes(term) ||
      dateStr.includes(term) ||
      amount.includes(term) ||
      activity.includes(term) ||
      payment.includes(term)
    const dateDigits = String(row.eventDate || '').replace(/[^0-9]/g, '')
    const matchesDigits = tDigits && dateDigits.includes(tDigits)
    return matchesDate && (matchesText || matchesDigits)
  })

  const handleDownloadExcel = () => {
    if (!filteredRows || filteredRows.length === 0) {
      return
    }
    const dataToExport = filteredRows.map(row => {
      const r = row.raw || {}
      const u = r.userId || {}
      return {
        'Order ID': r._id,
        Reference: r.reference,
        'Created At': r.createdAt,
        'Updated At': r.updatedAt,

        // Payment Details
        Amount: r.amount,
        'Final Payable Amount': r.finalPayableAmount,
        'Payment Status': r.paymentStatus,
        'Activity Status': row.activityStatus,

        // Customer Details
        'Customer Name': r.name,
        'Customer Email': r.email,

        // User Account Details
        'User ID': u._id,
        'User Name': u.name,
        'User Email': u.email,
        'User Status': u.status,
        'Wallet Funds': u.walletFunds
      }
    })
    downloadExcel(dataToExport, 'eSIM_Orders.xlsx')
  }

  const ActionDropdown = ({ row }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })
    const handleButtonClick = e => {
      if (!isOpen) {
        const rect = e.currentTarget.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const dropdownHeight = 90
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
              className='fixed inset-0 z-[99998]'
              onClick={() => setIsOpen(false)}
            />
            <div
              className='fixed w-44 bg-white rounded-lg shadow-2xl border border-gray-200 z-[99999] py-1'
              style={{
                top: `${buttonPosition.top}px`,
                right: `${buttonPosition.right}px`
              }}
            >
              <button
                className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                onClick={() => {
                  setDetailRow(row.raw)
                  setDetailOpen(true)
                  setIsOpen(false)
                }}
              >
                <span className='mr-3 text-gray-500'>
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
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                </span>
                <span className='text-gray-800'>View Details</span>
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderDetailModal = () => {
    const r = detailRow
    if (!detailOpen || !r) return null
    const u = r?.userId || {}
    return (
      <div className='fixed inset-0 z-[10000] flex items-center justify-center'>
        <div
          className='absolute inset-0 bg-black/30'
          onClick={() => setDetailOpen(false)}
        />
        <div className='relative bg-white rounded-2xl shadow-xl w-[90%] max-w-2xl'>
          <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
            <h3 className='text-xl font-semibold text-gray-900'>
              Gross Transaction Value of e-Sim
            </h3>
            <button
              onClick={() => setDetailOpen(false)}
              className='p-2 rounded-full hover:bg-gray-100 transition-colors'
              aria-label='Close'
            >
              <svg
                className='w-5 h-5 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
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
          <div className='p-6 space-y-6'>
            <div className='grid grid-cols-2 gap-x-6 gap-y-3'>
              <div className='text-sm text-gray-500'>Order ID</div>
              <div className='text-sm text-gray-900'>
                {String(r?._id || '')}
              </div>
              <div className='text-sm text-gray-500'>Payment Status</div>
              <div className='text-sm text-gray-900'>
                {String(r?.paymentStatus || '-')}
              </div>
              <div className='text-sm text-gray-500'>Amount</div>
              <div className='text-sm font-semibold text-gray-900'>
                {toCurrency(r?.amount || 0)}
              </div>
              <div className='text-sm text-gray-500'>Customer Name</div>
              <div className='text-sm text-gray-900'>
                {String(r?.name || '-')}
              </div>
              <div className='text-sm text-gray-500'>Email</div>
              <div className='text-sm text-gray-900'>
                {String(r?.email || '-')}
              </div>
              <div className='text-sm text-gray-500'>Created At</div>
              <div className='text-sm text-gray-900'>
                {formatDate(r?.createdAt) || '-'}
              </div>
              <div className='text-sm text-gray-500'>Updated At</div>
              <div className='text-sm text-gray-900'>
                {formatDate(r?.updatedAt) || '-'}
              </div>
            </div>
            <div className='border-t border-gray-200 pt-4'>
              <div className='text-sm font-semibold text-gray-900 mb-2'>
                User
              </div>
              <div className='grid grid-cols-2 gap-x-6 gap-y-3'>
                <div className='text-sm text-gray-500'>User ID</div>
                <div className='text-sm text-gray-900'>
                  {String(u?._id || '')}
                </div>
                <div className='text-sm text-gray-500'>Name</div>
                <div className='text-sm text-gray-900'>
                  {String(u?.name || '-')}
                </div>
                <div className='text-sm text-gray-500'>Email</div>
                <div className='text-sm text-gray-900'>
                  {String(u?.email || '-')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-4 min-h-screen bg-white'>
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
        {/* Total Purchasing Yesterday */}
        <div className='bg-indigo-300 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTicket className='w-6 h-6 text-indigo-600' />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                Total purchasing Yesterday{' '}
                <span className='text-[10px] opacity-75'>
                  ({stats.yesterdayDateStr})
                </span>
              </p>
              <p className='text-2xl text-black font-bold'>
                {stats.yesterdayCount}
              </p>
            </div>
          </div>
        </div>

        {/* Avg Daily Growth (Count) */}
        <div className='bg-purple-300 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTrendingUp className='w-6 h-6 text-purple-600' />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                Avg Daily Growth (Count)
              </p>
              <div className='flex items-end gap-2'>
                {stats.isCountIncreasing ? (
                  <>
                    <p className='text-2xl text-black font-bold'>
                      {stats.avgGrowthCount}
                    </p>
                    <span className='text-xs flex items-center mb-1 text-green-600'>
                      <TbTrendingUp className='w-3 h-3 mr-0.5' />
                      Increasing
                    </span>
                  </>
                ) : (
                  <>
                    <p className='text-2xl text-black font-bold'>
                      {stats.avgGrowthCount}
                    </p>
                    <span className='text-xs flex items-center mb-1 text-red-500'>
                      <TbTrendingDown className='w-3 h-3 mr-0.5' />
                      Decreasing
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Avg Daily Growth (%) */}
        <div className='bg-teal-300 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <FaChartColumn className='w-6 h-6 text-teal-600' />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                Avg Daily Growth (%)
              </p>
              <div className='flex items-end gap-2'>
                <p className='text-2xl text-black font-bold'>
                  {stats.avgGrowthPercent}
                </p>
                {stats.isPctIncreasing ? (
                  <span className='text-xs flex items-center mb-1 text-green-600'>
                    <TbTrendingUp className='w-3 h-3 mr-0.5' />
                    Increasing
                  </span>
                ) : (
                  <span className='text-xs flex items-center mb-1 text-red-500'>
                    <TbTrendingDown className='w-3 h-3 mr-0.5' />
                    Decreasing
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Cards (Filtered) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        {/* Total E-Sim Bookings (Filtered) */}
        <div className='bg-blue-300 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTicket className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                Total E-Sim Bookings
              </p>
              <p className='text-2xl text-black font-bold'>
                {filteredRows.length}{' '}
                <span className='text-lg font-semibold opacity-90'>
                  (₦
                  {filteredRows
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
                  filteredRows.filter(b => {
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
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-4 border-b border-gray-200'>
            <div className='flex justify-between items-center mb-3'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Gross Transaction Value of Internet Connectivity
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
            <div className='flex flex-wrap gap-1.5'>
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

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Order ID</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Customer Name</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Date & Time</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Amount</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Activity Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Payment Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Action</span>
                      <span className='w-3 h-3 ml-1' />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No eSIM orders found
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(row => (
                    <tr
                      key={row.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {row.orderId}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {row.customerName}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900 leading-tight'>
                          {row.eventDate}
                        </div>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='text-sm font-semibold text-gray-900'>
                          {row.amount}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {row.activityStatus}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <ActionDropdown row={row} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {renderDetailModal()}
    </div>
  )
}
