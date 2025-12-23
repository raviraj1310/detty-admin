'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  Mail,
  PlusCircle,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { TbCaretUpDownFilled, TbTicket, TbTrendingUp, TbTrendingDown } from 'react-icons/tb'
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
        const res = await getRoyalBookingList()

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
          return {
            id: d?._id || transactionId,
            customer,
            partner,
            transactionId,
            service,
            status,
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
  }, [])

  const filtered = useMemo(() => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return requests
    const termDigits = term.replace(/[^0-9]/g, '')
    return requests.filter(s => {
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
  }, [requests, searchTerm])

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

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
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
                <p className='text-2xl text-black font-bold'>
                  {stats.avgGrowthCount}
                </p>
                {stats.isCountIncreasing ? (
                  <span className='text-xs flex items-center mb-1 text-green-500'>
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
                  <span className='text-xs flex items-center mb-1 text-green-500'>
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
