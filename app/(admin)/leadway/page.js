'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { getLeadwayList } from '@/services/leadway/leadway.service'
import Modal from '@/components/ui/Modal'

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: false },
  { id: 'event', label: 'Event', active: false },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: false },
  { id: 'accommodation', label: 'Accommodation', active: false },
  { id: 'med-plus', label: 'Medical Plus', active: false },
  { id: 'royal-concierge', label: 'Royal Concierge', active: false },
  { id: 'rides', label: 'Rides', active: false },
  { id: 'leadway', label: 'Leadway', active: true }
  // { id: 'diy', label: 'DIY', active: false },
]

export default function LeadwayPage () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [requests, setRequests] = useState([])
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
      } catch (e) {
        console.error(e)
        setRequests([])
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

  const downloadCSV = () => {
    if (!sorted.length) return
    const headers = [
      'Submitted On',
      'Customer',
      'Policy Type',
      'Amount',
      'Status'
    ]
    const rows = sorted.map(s => [
      s.createdOn ? new Date(s.createdOn).toLocaleString() : '-',
      s.customer,
      s.policyType,
      s.amount,
      s.status
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'leadway_requests.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
          {/* Header */}
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
                  <Search className='w-5 h-5 text-gray-600 absolute left-3 top-2.5' />
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
                      d='M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z'
                    />
                  </svg>
                  <span className='text-gray-700 font-medium'>Filters</span>
                </button>

                <button
                  onClick={downloadCSV}
                  className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
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
                  sorted.map((s, idx) => (
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
