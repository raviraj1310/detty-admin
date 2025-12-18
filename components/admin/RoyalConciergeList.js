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
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { getRoyalBookingList } from '@/services/royal-concierge/royal.service'
import Modal from '@/components/ui/Modal'

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

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getRoyalBookingList()
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

  const toCsvCell = v => {
    const s = String(v ?? '')
    const needsQuotes = /[\"",\n]/.test(s)
    const escaped = s.replace(/\"/g, '""')
    return needsQuotes ? `\"${escaped}\"` : escaped
  }
  const downloadCsv = async () => {
    try {
      const headers = [
        'Submitted On',
        'Customer',
        'Partner',
        'Transaction ID',
        'Service',
        'Status'
      ]
      const lines = []
      lines.push(headers.map(toCsvCell).join(','))
      sorted.forEach(r => {
        const submitted =
          r.createdOn && r.createdOn !== '-'
            ? new Date(r.createdOn).toLocaleString()
            : '-'
        lines.push(
          [
            submitted,
            r.customer,
            r.partner,
            r.transactionId,
            r.service,
            r.status
          ]
            .map(toCsvCell)
            .join(',')
        )
      })
      const csv = `\ufeff${lines.join('\n')}`
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'royal-concierge.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Failed to download concierge CSV'
      setError(msg)
    }
  }

  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='mb-4'>
        <h1 className='text-xl font-bold text-gray-900 mb-1'>Bookings</h1>
        <nav className='text-sm text-gray-500'>
          <span>Dashboard</span> /{' '}
          <span className='text-gray-900 font-medium'>Users</span>
        </nav>
      </div>

      <div className='bg-gray-200 p-5 rounded-xl flex-1 flex flex-col min-h-0'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0'>
          <div className='p-4 border-b border-gray-200 flex-shrink-0'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Booking List
              </h2>
              <div className='flex items-center space-x-4'>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500'
                  />
                  <svg
                    className='w-5 h-5 text-gray-600 absolute left-3 top-2.5'
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

                <button className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'>
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
                  <span className='text-gray-700 font-medium'>Filters</span>
                </button>

                <button
                  className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
                  onClick={downloadCsv}
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
                </button>
              </div>
            </div>

            <div className='flex space-x-2 overflow-x-auto pb-2'>
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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
        >
          <div className='space-y-4 text-sm text-[#2D3658]'>
            <div className='grid grid-cols-2 gap-3'>
              <div>Transaction ID</div>
              <div className='text-right font-semibold'>
                {selected?.transactionId || selected?._id || '-'}
              </div>
              <div>RC Booking Reference</div>
              <div className='text-right font-semibold'>
                {selected?.rcBookingReference || '-'}
              </div>
              <div>Status</div>
              <div className='text-right font-semibold'>
                {selected?.rcStatus || selected?.status || '-'}
              </div>
              <div>Customer</div>
              <div className='text-right font-semibold'>
                {`${selected?.customer?.first_name || ''} ${
                  selected?.customer?.last_name || ''
                }`.trim() || '-'}
              </div>
              <div>Email</div>
              <div className='text-right font-semibold'>
                {selected?.customer?.email || '-'}
              </div>
              <div>Phone</div>
              <div className='text-right font-semibold'>
                {selected?.customer?.phone || '-'}
              </div>
              <div>Nationality</div>
              <div className='text-right font-semibold'>
                {selected?.customer?.nationality || '-'}
              </div>
              <div>Tier</div>
              <div className='text-right font-semibold'>
                {selected?.serviceDetails?.tier || '-'}
              </div>
              <div>Flight Number</div>
              <div className='text-right font-semibold'>
                {selected?.serviceDetails?.flight_number || '-'}
              </div>
              <div>Travel Date</div>
              <div className='text-right font-semibold'>
                {(() => {
                  const d = selected?.serviceDetails?.travel_date
                  const dt = d && typeof d === 'string' ? new Date(d) : d
                  return dt ? new Date(dt).toLocaleString() : '-'
                })()}
              </div>
              <div>Passenger Count</div>
              <div className='text-right font-semibold'>
                {String(selected?.serviceDetails?.passenger_count ?? '-')}
              </div>
              <div>Currency</div>
              <div className='text-right font-semibold'>
                {selected?.financials?.currency || '-'}
              </div>
              <div>Line Item Value</div>
              <div className='text-right font-semibold'>
                {typeof selected?.financials?.rcs_line_item_value === 'number'
                  ? selected.financials.rcs_line_item_value.toLocaleString()
                  : '-'}
              </div>
              <div>Remittance Amount</div>
              <div className='text-right font-semibold'>
                {typeof selected?.financials?.remittance_amount === 'number'
                  ? selected.financials.remittance_amount.toLocaleString()
                  : '-'}
              </div>
              <div>Marketplace Fee</div>
              <div className='text-right font-semibold'>
                {typeof selected?.financials?.marketplace_fee === 'number'
                  ? selected.financials.marketplace_fee.toLocaleString()
                  : '-'}
              </div>
              <div>Created On</div>
              <div className='text-right font-semibold'>
                {selected?.createdAt
                  ? new Date(selected.createdAt).toLocaleString()
                  : '-'}
              </div>
              <div>Updated On</div>
              <div className='text-right font-semibold'>
                {selected?.updatedAt
                  ? new Date(selected.updatedAt).toLocaleString()
                  : '-'}
              </div>
            </div>
          </div>
          <div className='mt-6 flex justify-end gap-3'>
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
