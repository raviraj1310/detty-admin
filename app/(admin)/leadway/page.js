'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Download,
  Shield,
  PlusCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { getLeadwayList } from '@/services/leadway/leadway.service'
import Modal from '@/components/ui/Modal'

const cardDefs = [
  { id: 'total', title: 'Total Requests', bg: 'bg-[#1F57D6]', Icon: Shield },
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

export default function LeadwayPage () {
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
        const res = await getLeadwayList()
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
        // Suppress error for UI demo if endpoint fails
        console.error(e)
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
      const matchesText =
        customer.includes(term) ||
        type.includes(term) ||
        status.includes(term) ||
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

  return (
    <div className='space-y-7 py-12 px-12'>
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-semibold text-slate-900'>Leadway</h1>
          <p className='text-sm text-[#99A1BC]'>Dashboard / Leadway</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {cardDefs.map(card => (
          <div
            key={card.id}
            className={`${card.bg} rounded-2xl p-6 text-white relative overflow-hidden`}
          >
            <div className='flex items-center justify-between'>
              <div className='bg-white/10 p-4 rounded-2xl flex-shrink-0'>
                <card.Icon className='h-8 w-8 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-white/90 text-sm font-medium mb-2'>
                  {card.title}
                </p>
                <p className='text-4xl font-bold text-white'>
                  {String(
                    card.id === 'total'
                      ? metrics.total
                      : card.id === 'new'
                      ? metrics.new
                      : metrics.completed
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <h2 className='text-lg font-semibold text-slate-900'>
            Requests List
          </h2>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative flex items-center'>
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
              <Search className='absolute left-3 h-4 w-4 text-[#A6AEC7]' />
            </div>
          </div>
        </div>

        <div className='overflow-visible rounded-2xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-[1.2fr_1.5fr_1.2fr_1fr_1fr_0.8fr] gap-3 bg-[#F7F9FD] px-6 py-4'>
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
              <TableHeaderCell onClick={() => toggleSort('policy')}>
                Policy Type
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('amount')}>
                Amount
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('status')}>
                Status
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Action</TableHeaderCell>
            </div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {loading && (
              <div className='px-6 py-5 text-sm text-[#5E6582]'>Loading...</div>
            )}
            {error && !loading && (
              <div className='px-6 py-5 text-sm text-red-600'>{error}</div>
            )}
            {!loading && !error && sorted.length === 0 && (
              <div className='px-6 py-5 text-center text-sm text-[#5E6582]'>
                No requests found
              </div>
            )}
            {!loading &&
              !error &&
              sorted.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className='grid grid-cols-[1.2fr_1.5fr_1.2fr_1fr_1fr_0.8fr] gap-3 px-6 py-5 hover:bg-[#F9FAFD]'
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
                    {s.policyType || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582] font-medium'>
                    {toCurrency(s.amount)}
                  </div>
                  <div className='self-center text-sm'>
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
                  </div>
                  <div className='self-center'>
                    <ActionDropdown
                      row={s.raw || s}
                      onDetail={r => {
                        setSelected(r)
                        setDetailOpen(true)
                      }}
                    />
                  </div>
                </div>
              ))}
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
        >
          <div className='space-y-4 text-sm text-[#2D3658]'>
            <div className='grid grid-cols-2 gap-3'>
              <div>Request ID</div>
              <div className='text-right font-semibold'>
                {selected?._id || '-'}
              </div>
              <div>Status</div>
              <div className='text-right font-semibold'>
                {selected?.paymentStatus || '-'}
              </div>
              <div>Customer</div>
              <div className='text-right font-semibold'>
                {`${selected?.firstName || ''} ${selected?.otherName || ''} ${
                  selected?.surname || ''
                }`.trim() || '-'}
              </div>
              <div>Email</div>
              <div className='text-right font-semibold'>
                {selected?.emailAddress || '-'}
              </div>
              <div>Phone</div>
              <div className='text-right font-semibold'>
                {selected?.mobileNo || '-'}
              </div>
              <div>DOB</div>
              <div className='text-right font-semibold'>
                {selected?.dob_MM_dd_yyyy || '-'}
              </div>
              <div>Gender</div>
              <div className='text-right font-semibold'>
                {selected?.gender || '-'}
              </div>
              <div>Marital Status</div>
              <div className='text-right font-semibold'>
                {selected?.maritalStatus || '-'}
              </div>
              <div>Address</div>
              <div className='text-right font-semibold whitespace-pre-line'>
                {selected?.address || '-'}
              </div>
              <div>State</div>
              <div className='text-right font-semibold'>
                {selected?.state || '-'}
              </div>
              <div>Scheme ID</div>
              <div className='text-right font-semibold'>
                {selected?._scheme_id || '-'}
              </div>
              <div>Enrollee No</div>
              <div className='text-right font-semibold'>
                {selected?.enrolleeNo || '-'}
              </div>
              <div>Debit Note No</div>
              <div className='text-right font-semibold'>
                {selected?.debiteNoteNo || '-'}
              </div>
              <div>Purchase Amount</div>
              <div className='text-right font-semibold'>
                {toCurrency(selected?.purchaseAmount || 0)}
              </div>
              <div>Total Pay Amount</div>
              <div className='text-right font-semibold'>
                {toCurrency(selected?.totalPayAmount || 0)}
              </div>
              <div>Created On</div>
              <div className='text-right font-semibold'>
                {selected?.createdAt || selected?.created_at
                  ? new Date(
                      selected?.createdAt || selected?.created_at
                    ).toLocaleString()
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
