'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import {
  TbCaretUpDownFilled,
  TbTicket,
  TbTrendingUp,
  TbTrendingDown
} from 'react-icons/tb'
import { FaChartColumn } from 'react-icons/fa6'
import { getLeadwayList } from '@/services/leadway/leadway.service'
import { downloadExcel } from '@/utils/excelExport'
import Modal from '@/components/ui/Modal'

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: false },
  { id: 'event', label: 'Event', active: false },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: false },
  { id: 'accommodation', label: 'Accommodation', active: false },
  { id: 'med-plus', label: 'Med Plus', active: false },
  { id: 'royal-concierge', label: 'Royal Concierge', active: false },
  { id: 'rides', label: 'Rides', active: false },
  { id: 'leadway', label: 'Leadway', active: true }
  // { id: 'diy', label: 'DIY', active: false },
]

export default function LeadwayPage () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [apiStats, setApiStats] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const [stats, setStats] = useState({
    yesterdayCount: 0,
    yesterdayDateStr: '',
    avgGrowthCount: 0,
    isCountIncreasing: false,
    avgGrowthPercent: '0%',
    isPctIncreasing: false,
    filteredTotalCount: 0,
    newCountToday: 0
  })

  const [limit, setLimit] = useState(50)
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getLeadwayList({
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined
        })

        const d = res || {}
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

        const initialStats = {
          yesterdayCount,
          yesterdayDateStr,
          avgGrowthCount,
          isCountIncreasing: avgGrowthCount >= 0,
          avgGrowthPercent: avgGrowthPercentStr,
          isPctIncreasing: avgGrowthPercentVal >= 0,
          filteredTotalCount: 0,
          newCountToday: 0
        }

        setStats(initialStats)
        setApiStats(initialStats)

        const raw = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        const mapped = raw.map((d, idx) => {
          const created = d?.createdAt || d?.updatedAt || ''
          const createdTs = created ? new Date(created).getTime() : 0
          const customer = `${String(d?.firstName || '').trim()} ${String(
            d?.surname || ''
          ).trim()}`.trim()
          const policyType = d?._scheme_id ? `Scheme ${d._scheme_id}` : '-'
          const amount = d?.purchaseAmount || d?.totalPayAmount || 0
          const status = String(d?.paymentStatus || 'Pending').trim()
          const refId = String(d?._id || `ref-${idx}`)

          return {
            id: refId,
            customer: customer || 'Unknown Customer',
            policyType,
            amount,
            status,
            createdOn: created,
            createdTs,
            raw: d
          }
        })
        setRequests(mapped)
      } catch (e) {
        console.error(e)
        setRequests([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateRange.start, dateRange.end])

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
      const type = String(s.policyType || '').toLowerCase()
      const status = String(s.status || '').toLowerCase()
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
      const amountStr = String(s.amount ?? '').toLowerCase()
      const amountDigits = amountStr.replace(/[^0-9]/g, '')

      const matchesText =
        customer.includes(term) ||
        type.includes(term) ||
        status.includes(term) ||
        createdStr.includes(term) ||
        amountStr.includes(term) // ✅

      const matchesDigits =
        (termDigits && createdDigits.includes(termDigits)) ||
        amountDigits.includes(termDigits)

      return matchesText || matchesDigits
    })
  }, [requests, searchTerm, dateRange])

  useEffect(() => {
    if (!apiStats) return

    const isFiltered =
      dateRange.start || dateRange.end || searchTerm || filtered.length > 0

    if (!dateRange.start && !dateRange.end && !searchTerm) {
      const todayStr = new Date().toISOString().split('T')[0]
      const newToday = requests.filter(r =>
        r.createdOn?.startsWith(todayStr)
      ).length

      setStats({
        ...apiStats,
        filteredTotalCount: requests.length,
        newCountToday: newToday
      })
      return
    }

    // Recalculate based on filtered data
    const currentData = filtered
    const totalCount = currentData.length

    const todayStr = new Date().toISOString().split('T')[0]
    const newToday = currentData.filter(r =>
      r.createdOn?.startsWith(todayStr)
    ).length

    // Trends (First Half vs Second Half)
    let growthCount = 0
    let growthPercent = 0

    if (currentData.length > 1) {
      // Sort by date for trend calculation
      const sorted = [...currentData].sort((a, b) => a.createdTs - b.createdTs)
      const mid = Math.floor(sorted.length / 2)
      const firstHalf = sorted.slice(0, mid)
      const secondHalf = sorted.slice(mid)

      const firstCount = firstHalf.length
      const secondCount = secondHalf.length

      growthCount = secondCount - firstCount
      if (firstCount > 0) {
        growthPercent = ((secondCount - firstCount) / firstCount) * 100
      } else {
        growthPercent = secondCount > 0 ? 100 : 0
      }
    }

    // Cap at 100%
    if (growthPercent > 100) growthPercent = 100

    setStats({
      ...apiStats, // Preserve yesterdayCount from API
      avgGrowthCount: growthCount,
      isCountIncreasing: growthCount >= 0,
      avgGrowthPercent: `${growthPercent.toFixed(1)}%`,
      isPctIncreasing: growthPercent >= 0,
      filteredTotalCount: totalCount,
      newCountToday: newToday
    })
  }, [filtered, dateRange, searchTerm, apiStats, requests])

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
        case 'policy':
          return (
            String(a.policyType || '').localeCompare(
              String(b.policyType || '')
            ) * dir
          )
        case 'amount':
          return (Number(a.amount) - Number(b.amount)) * dir
        case 'status':
          return (
            String(a.status || '').localeCompare(String(b.status || '')) * dir
          )
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const paginatedBookings = useMemo(() => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    return sorted.slice(startIndex, endIndex)
  }, [sorted, page, limit])

  useEffect(() => {
    const totalPages = Math.ceil(sorted.length / limit) || 1
    setPageCount(totalPages)

    if (page > totalPages) {
      setPage(1)
    }
  }, [sorted.length, limit])

  const toCurrency = n => {
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(Number(n) || 0)
    } catch {
      return `₦${(Number(n) || 0).toLocaleString()}`
    }
  }

  const handleDownloadExcel = () => {
    if (!sorted.length) return
    const dataToExport = sorted.map(s => {
      const r = s.raw || {}
      return {
        _id: r._id,
        userId: r.userId,
        firstName: r.firstName,
        surname: r.surname,
        otherName: r.otherName,
        dob_MM_dd_yyyy: r.dob_MM_dd_yyyy,
        gender: r.gender,
        maritalStatus: r.maritalStatus,
        emailAddress: r.emailAddress,
        mobileNo: r.mobileNo,
        _scheme_id: r._scheme_id,
        address: r.address,
        state: r.state,
        purchaseAmount: r.purchaseAmount,
        totalPayAmount: r.totalPayAmount,
        paymentStatus: r.paymentStatus,
        enrolleeNo: r.enrolleeNo,
        debiteNoteNo: r.debiteNoteNo,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        __v: r.__v
      }
    })
    downloadExcel(dataToExport, 'Leadway_Requests.xlsx')
  }

  const ActionDropdown = ({ row, onDetail }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })

    const handleButtonClick = e => {
      e.stopPropagation()
      if (!isOpen) {
        const rect = e.currentTarget.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const dropdownHeight = 60
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
              onClick={e => {
                e.stopPropagation()
                setIsOpen(false)
              }}
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
                onClick={e => {
                  e.stopPropagation()
                  onDetail(row)
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

  const handleToggleFilters = () => {
    setFiltersOpen(v => !v)
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
              <span className='text-gray-900 font-medium'>Users</span>
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
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF] p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-2 rounded-lg'>
              <TbTicket className='w-6 h-6 text-indigo-600' />
            </div>
            <div className='text-right'>
              <p className='text-xs text-indigo-600 opacity-90'>
                Total Purchasing Yesterday{' '}
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

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <div className='bg-blue-300 p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTicket className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-gray-600'>Total Leadway Bookings</p>
              <p className='text-2xl font-bold text-gray-900'>
                {stats.filteredTotalCount}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-orange-300 p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTicket className='w-6 h-6 text-orange-600' />
            </div>
            <div>
              <p className='text-xs text-gray-600'>New Bookings Today</p>
              <p className='text-2xl font-bold text-gray-900'>
                {stats.newCountToday}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-gray-200 p-5 rounded-xl flex-1 flex flex-col min-h-0'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0'>
          {/* Header */}
          <div className='p-4 border-b border-gray-200 flex-shrink-0'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Gross Transaction Value of Leadway
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
                  <Search className='w-4 h-4 text-gray-600 absolute left-3 top-2.5' />
                </div>

                {filtersOpen && (
                  <div className='relative'>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className='h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value=''>All Status</option>
                      <option value='Active'>Active</option>
                      <option value='Inactive'>Inactive</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={handleToggleFilters}
                  className='h-9 flex items-center px-4 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
                >
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
                    {filtersOpen ? 'Hide Filters' : 'Filters'}
                  </span>
                </button>

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

                <div className='flex items-center gap-2'>
                  <label className='flex items-center gap-1.5 text-xs text-[#2D3658]'>
                    Show
                    <select
                      value={limit}
                      onChange={e => setLimit(Number(e.target.value) || 20)}
                      className='h-8 px-2 border border-[#E5E6EF] rounded-lg text-xs'
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                      className='h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]'
                    >
                      Prev
                    </button>
                    <span className='text-xs text-[#2D3658]'>
                      Page {page} of {pageCount}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                      disabled={page >= pageCount || loading}
                      className='h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]'
                    >
                      Next
                    </button>
                  </div>
                </div>
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

          {/* Table */}
          <div className='overflow-auto flex-1 min-h-0'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0 z-10'>
                <tr>
                  <th
                    className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
                    onClick={() => toggleSort('date')}
                  >
                    <div className='flex items-center'>
                      <span>Submitted On</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th
                    className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
                    onClick={() => toggleSort('customer')}
                  >
                    <div className='flex items-center'>
                      <span>Customer</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th
                    className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
                    onClick={() => toggleSort('policy')}
                  >
                    <div className='flex items-center'>
                      <span>Policy Type</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th
                    className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
                    onClick={() => toggleSort('amount')}
                  >
                    <div className='flex items-center'>
                      <span>Amount</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th
                    className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer'
                    onClick={() => toggleSort('status')}
                  >
                    <div className='flex items-center'>
                      <span>Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Action</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-6 py-5 text-sm text-[#5E6582] text-center'
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {error && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-6 py-5 text-sm text-red-600 text-center'
                    >
                      {error}
                    </td>
                  </tr>
                )}
                {!loading && !error && sorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-6 py-5 text-center text-sm text-[#5E6582]'
                    >
                      No requests found
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  paginatedBookings?.map((s, idx) => (
                    <tr
                      key={s.id || idx}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
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
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900 leading-tight'>
                          {s.customer || '-'}
                        </div>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {s.policyType || '-'}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900'>
                        {toCurrency(s.amount)}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            s.status.toLowerCase() === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : s.status.toLowerCase() === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {s.status || '-'}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <ActionDropdown
                          row={s.raw || s}
                          onDetail={r => {
                            setSelected(r)
                            setDetailOpen(true)
                          }}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
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
          title={'Request Details'}
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
                    <div className='text-slate-600'>Request ID</div>
                    <div className='font-medium text-right break-all text-slate-900'>
                      {selected?._id || '-'}
                    </div>

                    <div className='text-slate-600'>Status</div>
                    <div className='font-medium text-right'>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          String(
                            selected?.paymentStatus || ''
                          ).toLowerCase() === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : String(
                                selected?.paymentStatus || ''
                              ).toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {selected?.paymentStatus || '-'}
                      </span>
                    </div>

                    <div className='text-slate-600'>Scheme ID</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?._scheme_id || '-'}
                    </div>

                    <div className='text-slate-600'>Enrollee No</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.enrolleeNo || '-'}
                    </div>

                    <div className='text-slate-600'>Debit Note No</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.debiteNoteNo || '-'}
                    </div>

                    <div className='text-slate-600'>Created On</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.createdAt || selected?.created_at
                        ? new Date(
                            selected?.createdAt || selected?.created_at
                          ).toLocaleString()
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
                    <div className='text-slate-600'>Full Name</div>
                    <div className='font-medium text-right text-slate-900'>
                      {`${selected?.firstName || ''} ${
                        selected?.otherName || ''
                      } ${selected?.surname || ''}`.trim() || '-'}
                    </div>

                    <div className='text-slate-600'>Email</div>
                    <div className='font-medium text-right break-all text-slate-900'>
                      {selected?.emailAddress || '-'}
                    </div>

                    <div className='text-slate-600'>Phone</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.mobileNo || '-'}
                    </div>

                    <div className='text-slate-600'>DOB</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.dob_MM_dd_yyyy || '-'}
                    </div>

                    <div className='text-slate-600'>Gender</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.gender || '-'}
                    </div>

                    <div className='text-slate-600'>Marital Status</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.maritalStatus || '-'}
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                {/* Financials */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    Financials
                  </h3>
                  <div className='grid grid-cols-2 gap-y-2 gap-x-4 text-sm'>
                    <div className='text-slate-600'>Purchase Amount</div>
                    <div className='font-medium text-right text-slate-900'>
                      {toCurrency(selected?.purchaseAmount || 0)}
                    </div>

                    <div className='text-slate-600'>Total Pay Amount</div>
                    <div className='font-medium text-right text-green-700'>
                      {toCurrency(selected?.totalPayAmount || 0)}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    Address
                  </h3>
                  <div className='grid grid-cols-2 gap-y-2 gap-x-4 text-sm'>
                    <div className='text-slate-600'>Address</div>
                    <div className='font-medium text-right text-slate-900 whitespace-pre-line'>
                      {selected?.address || '-'}
                    </div>

                    <div className='text-slate-600'>State</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selected?.state || '-'}
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
