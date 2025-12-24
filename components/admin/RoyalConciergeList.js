'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  Mail,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import {
  TbCaretUpDownFilled,
  TbTicket,
  TbTrendingUp,
  TbTrendingDown
} from 'react-icons/tb'
import { FaChartColumn } from 'react-icons/fa6'
import { getRoyalBookingList } from '@/services/royal-concierge/royal.service'
import Modal from '@/components/ui/Modal'
import { downloadExcel } from '@/utils/excelExport'

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: false },
  { id: 'event', label: 'Event', active: false },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: false },
  { id: 'accommodation', label: 'Accommodation', active: false },
  { id: 'med-plus', label: 'Med Plus', active: false },
  { id: 'royal-concierge', label: 'Royal Concierge', active: true },
  { id: 'rides', label: 'Rides', active: false },
  { id: 'leadway', label: 'Leadway', active: false }
  // { id: 'diy', label: 'DIY', active: false },
]

const cardDefs = [
  { id: 'total', title: 'Total Requests', bg: 'bg-[#1F57D6]', Icon: Mail },
  { id: 'new', title: 'New Today', bg: 'bg-[#15803D]', Icon: PlusCircle },
  { id: 'completed', title: 'Completed', bg: 'bg-[#B91C1C]', Icon: CheckCircle }
]

const TableHeaderCell = ({ children, onClick }) => (
  <button
    type='button'
    onClick={onClick}
    className='flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC] hover:text-[#2D3658]'
  >
    {children}
    <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
  </button>
)

export default function RoyalConciergeList () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [requests, setRequests] = useState([])
  const [metrics, setMetrics] = useState({ total: 0, new: 0, completed: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState({
    yesterdayCount: 0,
    yesterdayDateStr: '',
    avgGrowthCount: 0,
    isCountIncreasing: false,
    avgGrowthPercent: '0%',
    isPctIncreasing: false
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getRoyalBookingList({
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

        const raw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        const mapped = raw.map((d, idx) => {
          const created = d?.createdAt || d?.updatedAt || ''
          const createdTs = created ? new Date(created).getTime() : 0
          const customer = `${String(
            d?.customer?.first_name || ''
          ).trim()} ${String(d?.customer?.last_name || '').trim()}`.trim()
          const partner = String(d?.partnerId || '').trim()
          const transactionId = String(
            d?.transactionId || d?._id || `txn-${idx}`
          )
          const service = String(d?.serviceDetails?.tier || '').trim()
          const status = String(d?.rcStatus || d?.status || '').trim()
          const amountNum = Number(
            d?.financials?.remittance_amount ||
              d?.financials?.rcs_line_item_value ||
              0
          )
          return {
            id: d?._id || transactionId,
            customer,
            partner,
            transactionId,
            service,
            status,
            amountNum,
            createdOn: created,
            createdTs,
            raw: d
          }
        })
        setRequests(mapped)
        const total = mapped.length
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const newToday = mapped.filter(
          m => m.createdTs >= startOfToday.getTime()
        ).length
        const completed = mapped.filter(
          m => String(m.status).toLowerCase() === 'completed'
        ).length
        setMetrics({ total, new: newToday, completed })
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Failed to load concierge requests'
        setError(msg)
        setRequests([])
        setMetrics({ total: 0, new: 0, completed: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateRange.start, dateRange.end])

  // Calculate stats client-side if not loaded from API or if filtered
  useEffect(() => {
    if (!requests || requests.length === 0) return

    // If a filter is active, we recalculate based on the filtered range.
    const isFiltered = dateRange.start || dateRange.end

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

    const yesterdayCount = requests.filter(o => {
      const d = new Date(o.createdTs)
      return d >= yesterday && d <= yesterdayEnd
    }).length

    // 2. Avg Daily Growth Logic (Filter Aware)
    let start, end, daysCount

    if (dateRange.start) {
      start = new Date(dateRange.start)
      start.setHours(0, 0, 0, 0)
    } else {
      end = new Date(dateRange.end)
      start = new Date(end)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
    }

    if (dateRange.end) {
      end = new Date(dateRange.end)
      end.setHours(23, 59, 59, 999)
    } else {
      end = new Date()
      end.setHours(23, 59, 59, 999)
    }

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
    requests.forEach(o => {
      const d = new Date(o.createdTs)
      if (isNaN(d.getTime())) return
      if (d >= start && d <= end) {
        const dateKey = d.toISOString().split('T')[0]
        bookingsByDate[dateKey] = (bookingsByDate[dateKey] || 0) + 1
      }
    })

    const dailyData = []
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateKey = d.toISOString().split('T')[0]
      dailyData.push({ date: dateKey, count: bookingsByDate[dateKey] || 0 })
    }

    const totalCount = dailyData.reduce((acc, curr) => acc + curr.count, 0)
    const avgGrowthCount = Math.round(totalCount / daysCount)

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
  }, [requests, dateRange])

  const filtered = useMemo(() => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()

    // Date Range Filtering
    const startTime = dateRange.start
      ? new Date(dateRange.start).setHours(0, 0, 0, 0)
      : null
    const endTime = dateRange.end
      ? new Date(dateRange.end).setHours(23, 59, 59, 999)
      : null

    const dateFiltered = requests.filter(s => {
      const bookingTime = s.createdTs
      const matchesDate =
        (!startTime || bookingTime >= startTime) &&
        (!endTime || bookingTime <= endTime)
      return matchesDate
    })

    if (!term) return dateFiltered

    const termDigits = term.replace(/[^0-9]/g, '')
    return dateFiltered.filter(s => {
      const customer = String(s.customer || '').toLowerCase()
      const partner = String(s.partner || '').toLowerCase()
      const txn = String(s.transactionId || '').toLowerCase()
      const service = String(s.service || '').toLowerCase()
      const createdStr = s.createdOn
        ? new Date(s.createdOn)
            .toLocaleString(undefined, {
              weekday: 'short',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
            .toLowerCase()
        : ''
      const createdDigits = String(createdStr || '').replace(/[^0-9]/g, '')
      const matchesText =
        customer.includes(term) ||
        partner.includes(term) ||
        txn.includes(term) ||
        service.includes(term) ||
        createdStr.includes(term)
      const matchesDigits = termDigits && createdDigits.includes(termDigits)
      return matchesText || matchesDigits
    })
  }, [requests, searchTerm, dateRange])

  const toggleSort = key => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'date':
          return (a.createdTs - b.createdTs) * dir
        case 'customer':
          return (
            String(a.customer || '').localeCompare(String(b.customer || '')) *
            dir
          )
        case 'partner':
          return (
            String(a.partner || '').localeCompare(String(b.partner || '')) * dir
          )
        case 'transactionId':
          return (
            String(a.transactionId || '').localeCompare(
              String(b.transactionId || '')
            ) * dir
          )
        case 'service':
          return (
            String(a.service || '').localeCompare(String(b.service || '')) * dir
          )
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const handleDownloadExcel = () => {
    if (!sorted || sorted.length === 0) {
      return
    }
    const dataToExport = sorted.map(item => {
      const r = item.raw || item
      return {
        _id: r._id,
        userId: r.userId,
        partnerId: r.partnerId,
        transactionId: r.transactionId,

        // Customer
        'customer.first_name': r.customer?.first_name,
        'customer.last_name': r.customer?.last_name,
        'customer.email': r.customer?.email,
        'customer.phone': r.customer?.phone,
        'customer.nationality': r.customer?.nationality,

        // Service Details
        'service.tier': r.serviceDetails?.tier,
        'service.flight_number': r.serviceDetails?.flight_number,
        'service.travel_date': r.serviceDetails?.travel_date,
        'service.passenger_count': r.serviceDetails?.passenger_count,

        // Financials
        'financials.currency': r.financials?.currency,
        'financials.rcs_line_item_value': r.financials?.rcs_line_item_value,
        'financials.remittance_amount': r.financials?.remittance_amount,
        'financials.marketplace_fee': r.financials?.marketplace_fee,

        signature: r.signature,
        rcBookingReference: r.rcBookingReference,
        rcStatus: r.rcStatus,

        // RC Raw Response
        'rcRawResponse.booking_reference': r.rcRawResponse?.booking_reference,
        'rcRawResponse.status': r.rcRawResponse?.status,

        status: r.status,
        source: r.source,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        __v: r.__v
      }
    })
    downloadExcel(dataToExport, 'Royal_Concierge_Requests.xlsx')
  }

  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='mb-4'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-1'>
          <div>
            <h1 className='text-xl font-bold text-gray-900 mb-1'>
              Gross Transaction Value
            </h1>
            <nav className='text-sm text-gray-500'>
              <span>Dashboard</span> /{' '}
              <span className='text-gray-900 font-medium'>
                Gross Transaction Value
              </span>
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
                  max={new Date().toISOString().split('T')[0]}
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
      </div>

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
        {/* Total Royal Concierge Bookings (Filtered) */}
        <div className='bg-blue-300 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTicket className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                Total Royal Concierge Bookings
              </p>
              <p className='text-2xl text-black font-bold'>
                {filtered.length}{' '}
                <span className='text-lg font-semibold opacity-90'>
                  (₦
                  {filtered
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
                  filtered.filter(b => {
                    if (!b.createdTs) return false
                    const d = new Date(b.createdTs)
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

      <div className='bg-gray-200 p-5 rounded-xl flex-1 flex flex-col min-h-0'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0'>
          <div className='p-4 border-b border-gray-200 flex-shrink-0'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Gross Transaction Value of Royal Concierge
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
                      d='M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659 1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z'
                    />
                  </svg>
                  <span className='text-xs text-gray-700 font-medium'>
                    Filters
                  </span>
                </button>

                <button
                  className='h-9 flex items-center px-4 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
                  onClick={handleDownloadExcel}
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
                  onClick={() => {
                    switch (tab.id) {
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
                        break
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    tab.active
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className='overflow-x-auto flex-1'>
            <div className='min-w-[1000px]'>
              <div className='grid grid-cols-[1.2fr_1.4fr_1.4fr_1.2fr_1.4fr_1fr_0.8fr] gap-3 bg-[#F7F9FD] px-6 py-4'>
                <div>
                  <TableHeaderCell onClick={() => toggleSort('date')}>
                    Submitted On
                  </TableHeaderCell>
                </div>
                <div>
                  <TableHeaderCell onClick={() => toggleSort('customer')}>
                    Customer
                  </TableHeaderCell>
                </div>
                <div>
                  <TableHeaderCell onClick={() => toggleSort('partner')}>
                    Partner
                  </TableHeaderCell>
                </div>
                <div>
                  <TableHeaderCell onClick={() => toggleSort('transactionId')}>
                    Transaction ID
                  </TableHeaderCell>
                </div>
                <div>
                  <TableHeaderCell onClick={() => toggleSort('service')}>
                    Service
                  </TableHeaderCell>
                </div>
                <div>
                  <TableHeaderCell>Status</TableHeaderCell>
                </div>
                <div>
                  <TableHeaderCell>Action</TableHeaderCell>
                </div>
              </div>

              <div className='divide-y divide-[#EEF1FA] bg-white'>
                {loading && (
                  <div className='px-6 py-5 text-sm text-[#5E6582]'>
                    Loading...
                  </div>
                )}
                {error && !loading && (
                  <div className='px-6 py-5 text-sm text-red-600'>{error}</div>
                )}
                {!loading &&
                  !error &&
                  sorted.map((s, idx) => (
                    <div
                      key={s.id || idx}
                      className='grid grid-cols-[1.2fr_1.4fr_1.4fr_1.2fr_1.4fr_1fr_0.8fr] gap-3 px-6 py-5 hover:bg-[#F9FAFD]'
                    >
                      <div className='self-center text-sm text-[#5E6582]'>
                        {(() => {
                          const d = s.createdOn
                          if (!d || d === '-') return '-'
                          const date = new Date(d)
                          return date.toLocaleString(undefined, {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        })()}
                      </div>
                      <div className='self-center text-sm text-[#5E6582] truncate'>
                        {s.customer || '-'}
                      </div>
                      <div className='self-center text-sm text-[#5E6582] truncate'>
                        {s.partner || '-'}
                      </div>
                      <div className='self-center text-sm text-[#5E6582] truncate'>
                        {s.transactionId || '-'}
                      </div>
                      <div className='self-center text-sm text-[#5E6582] truncate'>
                        {s.service || '-'}
                      </div>
                      <div className='self-center text-sm text-[#5E6582] truncate'>
                        {s.status || '-'}
                      </div>
                      <div className='self-center'>
                        <button
                          className='rounded-xl border border-[#E5E6EF] bg-white px-3 py-1.5 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
                          onClick={() => {
                            setSelected(s.raw || s)
                            setDetailOpen(true)
                          }}
                        >
                          View Detail
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {detailOpen && selected && (
        <Modal
          open={detailOpen}
          onOpenChange={v => {
            if (!v) {
              setDetailOpen(false)
              setSelected(null)
            }
          }}
          title={'Booking Details'}
          maxWidth='max-w-6xl'
          className='!p-5'
        >
          <div className='max-h-[70vh] overflow-y-auto pr-2'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-4'>
                {/* General Info */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    General Information
                  </h3>
                  <div className='grid grid-cols-2 gap-y-2 gap-x-4 text-sm'>
                    <div className='text-slate-600'>Transaction ID</div>
                    <div className='font-medium text-right break-all text-slate-900'>
                      {selected?.transactionId || selected?._id || '-'}
                    </div>

                    <div className='text-slate-600'>Booking Reference</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.rcBookingReference || '-'}
                    </div>

                    <div className='text-slate-600'>Status</div>
                    <div className='font-medium text-right'>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          selected?.rcStatus === 'created' ||
                          selected?.status === 'created'
                            ? 'bg-blue-100 text-blue-800'
                            : selected?.rcStatus === 'completed' ||
                              selected?.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {selected?.rcStatus || selected?.status || '-'}
                      </span>
                    </div>

                    <div className='text-slate-600'>Source</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.source || '-'}
                    </div>

                    <div className='text-slate-600'>Created At</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.createdAt
                        ? new Date(selected.createdAt).toLocaleString()
                        : '-'}
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    Customer Details
                  </h3>
                  <div className='grid grid-cols-2 gap-y-2 gap-x-4 text-sm'>
                    <div className='text-slate-600'>Name</div>
                    <div className='font-medium text-right text-slate-900'>
                      {`${selected?.customer?.first_name || ''} ${
                        selected?.customer?.last_name || ''
                      }`.trim() || '-'}
                    </div>

                    <div className='text-slate-600'>Email</div>
                    <div className='font-medium text-right break-all text-slate-900'>
                      {selected?.customer?.email || '-'}
                    </div>

                    <div className='text-slate-600'>Phone</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.customer?.phone || '-'}
                    </div>

                    <div className='text-slate-600'>Nationality</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.customer?.nationality || '-'}
                    </div>

                    <div className='text-slate-600'>User ID</div>
                    <div className='font-medium text-right text-xs text-slate-500'>
                      {selected?.userId || '-'}
                    </div>
                  </div>
                </div>

                {/* System Info */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    System Info
                  </h3>
                  <div className='space-y-2 text-sm'>
                    <div className='grid grid-cols-[100px_1fr] gap-2'>
                      <div className='text-slate-600'>Partner ID</div>
                      <div className='font-mono text-xs text-right break-all text-slate-500'>
                        {selected?.partnerId || '-'}
                      </div>
                    </div>
                    <div className='grid grid-cols-[100px_1fr] gap-2'>
                      <div className='text-slate-600'>Signature</div>
                      <div className='font-mono text-xs text-right break-all text-slate-500'>
                        {selected?.signature || '-'}
                      </div>
                    </div>
                    <div className='grid grid-cols-[100px_1fr] gap-2'>
                      <div className='text-slate-600'>Raw Status</div>
                      <div className='font-mono text-xs text-right text-slate-600'>
                        {selected?.rcRawResponse?.status || '-'} (Ref:{' '}
                        {selected?.rcRawResponse?.booking_reference || '-'})
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                {/* Service Details */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    Service Details
                  </h3>
                  <div className='grid grid-cols-2 gap-y-2 gap-x-4 text-sm'>
                    <div className='text-slate-600'>Tier</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.serviceDetails?.tier || '-'}
                    </div>

                    <div className='text-slate-600'>Flight Number</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.serviceDetails?.flight_number || '-'}
                    </div>

                    <div className='text-slate-600'>Travel Date</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.serviceDetails?.travel_date
                        ? new Date(
                            selected.serviceDetails.travel_date
                          ).toLocaleDateString()
                        : '-'}
                    </div>

                    <div className='text-slate-600'>Passenger Count</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.serviceDetails?.passenger_count || '-'}
                    </div>
                  </div>
                </div>

                {/* Financials */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    Financials
                  </h3>
                  <div className='grid grid-cols-2 gap-y-2 gap-x-4 text-sm'>
                    <div className='text-slate-600'>Currency</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.financials?.currency || 'NGN'}
                    </div>

                    <div className='text-slate-600'>Line Item Value</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.financials?.rcs_line_item_value?.toLocaleString() ||
                        '0'}
                    </div>

                    <div className='text-slate-600'>Remittance Amount</div>
                    <div className='font-medium text-right text-green-700'>
                      {selected?.financials?.remittance_amount?.toLocaleString() ||
                        '0'}
                    </div>

                    <div className='text-slate-600'>Marketplace Fee</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.financials?.marketplace_fee?.toLocaleString() ||
                        '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-4 flex justify-end gap-3'>
            <button
              onClick={() => {
                setDetailOpen(false)
                setSelected(null)
              }}
              className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
