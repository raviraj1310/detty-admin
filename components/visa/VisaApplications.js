'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download, MoreVertical, Link } from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { IoFilterSharp } from 'react-icons/io5'
import { HiOutlineClipboardList } from 'react-icons/hi'
import { FiCheckCircle } from 'react-icons/fi'
import { AiOutlineMinusCircle } from 'react-icons/ai'
import {
  getVisaApplications,
  downloadVisaApplicationsCSV,
  updateStatus
} from '@/services/visa/visa.service'

const cardDefs = [
  {
    id: 'total',
    title: 'Total Visa Applications',
    bg: 'bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF]',
    iconBg: 'bg-white',
    textColor: 'text-indigo-600',
    iconColor: 'text-indigo-600'
  },
  {
    id: 'completed',
    title: 'Processed Visa Applications',
    bg: 'bg-gradient-to-r from-[#E8F8F0] to-[#B8EDD0]',
    iconBg: 'bg-white',
    textColor: 'text-emerald-600',
    iconColor: 'text-emerald-600'
  },
  {
    id: 'pending',
    title: 'Pending Visa Applications',
    bg: 'bg-gradient-to-r from-[#FFE8E8] to-[#FFC5C5]',
    iconBg: 'bg-white',
    textColor: 'text-red-600',
    iconColor: 'text-red-600'
  }
]

const toName = a =>
  [a?.firstName, a?.middleName, a?.lastName]
    .map(s => String(s || '').trim())
    .filter(Boolean)
    .join(' ')
const toStatus = v => {
  const s = String(v || '')
    .trim()
    .toLowerCase()
  if (s === 'processed') return 'Processed'
  if (s === 'completed') return 'Completed'
  return 'Pending'
}

const statusClass = s => {
  const v = String(s || '').toLowerCase()
  if (v === 'processed')
    return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  if (v === 'pending') return 'bg-red-50 text-red-600 border border-red-200'
  return 'bg-gray-100 text-gray-600 border border-gray-200'
}

const TableHeaderCell = ({ children, onClick }) => (
  <button
    type='button'
    onClick={onClick}
    className='flex items-center gap-1 text-xs font-medium capitalize tracking-wider text-gray-500 hover:text-gray-700'
  >
    {children}
    <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
  </button>
)

export default function VisaApplications () {
  const router = useRouter()
  const dropdownRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [applications, setApplications] = useState([])
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [metrics, setMetrics] = useState({ total: 0, completed: 0, pending: 0 })
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedIds, setSelectedIds] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalApplications, setTotalApplications] = useState(0)

  const loadApplications = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getVisaApplications(page, limit)
      const list = Array.isArray(res?.data?.applications)
        ? res.data.applications
        : []
      setTotalPages(res?.data?.totalPages || 0)
      setTotalApplications(res?.data?.totalApplications || 0)

      const mapped = list.map(a => ({
        id: a._id,
        createdOn: a.createdAt || a.updatedAt,
        createdTs: (() => {
          const d = a.createdAt || a.updatedAt
          const v = d && d.$date ? d.$date : d
          const dt = v ? new Date(v) : null
          return dt ? dt.getTime() : 0
        })(),
        name: toName(a) || '-',
        email: a?.email || '-',
        phone: a?.mobile || '-',
        status: toStatus(a.status),
        avatar: null
      }))
      setApplications(mapped)
      // Metrics should ideally come from a separate stats API or be part of the response
      // For now, we only have the current page's data, so we can't calculate full stats accurately on client side
      // Assuming metrics are not provided in this specific response based on user input
    } catch (e) {
      setError('Failed to load applications')
      setApplications([])
      setMetrics({ total: 0, completed: 0, pending: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [page, limit])

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return applications
    const termDigits = term.replace(/[^0-9]/g, '')
    const fmtCreated = d => {
      if (!d) return '-'
      const v = typeof d === 'object' && d.$date ? d.$date : d
      const date = v ? new Date(v) : null
      return date
        ? date.toLocaleString(undefined, {
            weekday: 'short',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '-'
    }
    return applications.filter(a => {
      const name = String(a.name || '').toLowerCase()
      const email = String(a.email || '').toLowerCase()
      const phone = String(a.phone || a.mobile || '').toLowerCase()
      const status = String(a.status || '').toLowerCase()
      const createdStr = String(fmtCreated(a.createdOn)).toLowerCase()
      const createdDigits = String(createdStr).replace(/[^0-9]/g, '')
      const matchesText =
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        status.includes(term) ||
        createdStr.includes(term)
      const matchesDigits = termDigits && createdDigits.includes(termDigits)
      return matchesText || matchesDigits
    })
  }, [applications, searchTerm])

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
        case 'name':
          return String(a.name || '').localeCompare(String(b.name || '')) * dir
        case 'email':
          return (
            String(a.email || '').localeCompare(String(b.email || '')) * dir
          )
        case 'phone':
          return (
            String(a.phone || '').localeCompare(String(b.phone || '')) * dir
          )
        case 'status':
          return (
            String(a.status || '').localeCompare(String(b.status || '')) * dir
          )
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const isSelected = id => selectedIds.includes(String(id || ''))
  const toggleRowSelect = id => {
    const key = String(id || '')
    setSelectedIds(prev =>
      prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
    )
  }
  const allRowIds = useMemo(() => sorted.map(a => String(a.id || '')), [sorted])
  const isAllSelected =
    allRowIds.length > 0 && allRowIds.every(id => selectedIds.includes(id))
  const toggleSelectAll = () => {
    setSelectedIds(prev => (isAllSelected ? [] : [...allRowIds]))
  }
  const markSelectedAsProcess = async (ids = null) => {
    const targetIds = Array.isArray(ids) ? ids : selectedIds
    if (!targetIds || targetIds.length === 0) return

    try {
      setLoading(true)
      await updateStatus({ ids: targetIds })
      await loadApplications()
      setSelectedIds([])
      setActiveDropdown(null)
    } catch (e) {
      console.error('Failed to update status', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = () => {
    if (!filtered || filtered.length === 0) {
      return
    }
    const dataToExport = filtered.map(a => ({
      'Created On':
        a.createdOn && a.createdOn !== '-'
          ? new Date(a.createdOn).toLocaleString()
          : '-',
      'User Name': a.name,
      Email: a.email,
      'Phone Number': a.phone,
      Status: a.status
    }))
    downloadExcel(dataToExport, 'Visa_Applications.xlsx')
  }

  const downloadCsv = async () => {
    try {
      const blob = await downloadVisaApplicationsCSV()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'visa-applications.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || 'Failed to download CSV'
      setError(msg)
    }
  }

  return (
    <div className='space-y-4 py-4 px-4'>
      <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>
            Visa Applications
          </h1>
          <p className='text-xs text-[#99A1BC]'>
            Dashboard / Visa Applications
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
        {cardDefs.map(card => (
          <div
            key={card.id}
            className={`${card.bg} rounded-xl p-3 relative overflow-hidden border border-gray-100 shadow-md`}
          >
            <div className='flex items-center justify-between'>
              <div className={`${card.iconBg} p-2.5 rounded-xl flex-shrink-0`}>
                {card.id === 'completed' ? (
                  <FiCheckCircle className={`h-6 w-6 ${card.iconColor}`} />
                ) : card.id === 'pending' ? (
                  <AiOutlineMinusCircle
                    className={`h-6 w-6 ${card.iconColor}`}
                  />
                ) : (
                  <HiOutlineClipboardList
                    className={`h-6 w-6 ${card.iconColor}`}
                  />
                )}
              </div>
              <div className='text-right'>
                <p
                  className={`${card.textColor} opacity-80 text-xs font-medium mb-1`}
                >
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {String(
                    card.id === 'total'
                      ? metrics.total
                      : card.id === 'completed'
                      ? metrics.completed
                      : metrics.pending
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold text-slate-900'>
            Visa Applications List
          </h2>
          <div className='flex flex-wrap items-center gap-2'>
            {selectedIds.length > 0 && (
              <button
                onClick={markSelectedAsProcess}
                className='flex h-8 items-center gap-1.5 rounded-lg bg-[#FF5B2C] px-3 text-xs font-semibold text-white transition hover:bg-[#F0481A]'
              >
                Mark as process
              </button>
            )}
            <div className='relative flex items-center'>
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-8 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] pl-8 pr-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
              <Search className='absolute left-2.5 h-3.5 w-3.5 text-[#A6AEC7]' />
            </div>
            <button className='flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <IoFilterSharp className='h-3.5 w-3.5 text-[#8B93AF]' />
              Filters
            </button>
            <button
              onClick={handleDownloadExcel}
              className='flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
            >
              <Download className='h-3.5 w-3.5 text-[#8B93AF]' />
              Export
            </button>
          </div>
        </div>

        <div className='overflow-visible rounded-xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-[4%_14%_18%_22%_14%_10%_10%_8%] bg-[#F7F9FD] px-3 py-2.5'>
            <div className='flex items-center'>
              <input
                type='checkbox'
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className='h-3.5 w-3.5 rounded border-[#D0D5DD] text-[#FF5B2C] focus:ring-[#FF5B2C]'
              />
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('date')}>
                Created On
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('name')}>
                User Name
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('email')}>
                Email
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('phone')}>
                Phone Number
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Action</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('status')}>
                Status
              </TableHeaderCell>
            </div>
            <div></div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {loading && (
              <div className='px-3 py-3 text-xs text-[#5E6582]'>Loading...</div>
            )}
            {error && !loading && (
              <div className='px-3 py-3 text-xs text-red-600'>{error}</div>
            )}
            {!loading &&
              !error &&
              sorted.map((app, idx) => (
                <div
                  key={app.id || idx}
                  className='grid grid-cols-[4%_14%_18%_22%_14%_10%_10%_8%] px-3 py-2.5 hover:bg-[#F9FAFD]'
                >
                  <div className='self-center'>
                    <input
                      type='checkbox'
                      checked={isSelected(app.id)}
                      onChange={() => toggleRowSelect(app.id)}
                      className='h-3.5 w-3.5 rounded border-[#D0D5DD] text-[#FF5B2C] focus:ring-[#FF5B2C]'
                    />
                  </div>
                  <div className='self-center text-xs text-[#5E6582] line-clamp-2'>
                    {(() => {
                      const d = app.createdOn
                      if (!d || d === '-') return '-'
                      const date = new Date(d)
                      return date.toLocaleString(undefined, {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })
                    })()}
                  </div>
                  <div className='flex items-center gap-2 min-w-0'>
                    <div className='relative h-8 w-8 overflow-hidden rounded-full border-2 border-red-500 flex-shrink-0'>
                      {app.avatar ? (
                        <img
                          src={app.avatar}
                          alt={app.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <span className='flex h-full w-full items-center justify-center bg-[#F0F2F8] text-xs font-semibold text-[#2D3658]'>
                          {app.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-medium text-slate-900 leading-tight line-clamp-2'>
                        {app.name}
                      </p>
                    </div>
                  </div>
                  <div className='self-center text-xs text-[#5E6582] truncate'>
                    {app.email}
                  </div>
                  <div className='self-center text-xs text-[#5E6582]'>
                    {app.phone}
                  </div>
                  <div className='self-center text-xs text-[#5E6582]'>
                    <button
                      className='text-[10px] font-semibold text-[#0F4EF1] hover:underline'
                      onClick={() =>
                        router.push(`/visa/applications/${app.id}`)
                      }
                    >
                      View
                    </button>
                  </div>
                  <div className='flex items-center self-center'>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <div className='flex items-center justify-center self-center relative'>
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === (app.id || idx)
                            ? null
                            : app.id || idx
                        )
                      }
                      className='rounded-full border border-transparent p-1.5 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                    >
                      <MoreVertical className='h-3.5 w-3.5' />
                    </button>
                    {activeDropdown === (app.id || idx) && (
                      <div
                        ref={dropdownRef}
                        className='absolute right-0 mt-2 w-44 rounded-lg border border-[#E5E8F5] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-50'
                      >
                        <div className='py-1'>
                          <button
                            className='block w-full text-left px-3 py-1.5 text-xs text-[#2D3658] hover:bg-[#F6F7FD]'
                            onClick={() =>
                              router.push(`/visa/applications/${app.id}`)
                            }
                          >
                            View Application
                          </button>
                          <button
                            className='block w-full text-left px-3 py-1.5 text-xs text-[#2D3658] hover:bg-[#F6F7FD]'
                            onClick={() => markSelectedAsProcess([app.id])}
                          >
                            Mark as process
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
      {/* Pagination Controls */}
      <div className='flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm'>
        <div className='flex flex-1 justify-between sm:hidden'>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className='relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className='relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          >
            Next
          </button>
        </div>
        <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm text-gray-700'>
              Showing{' '}
              <span className='font-medium'>{(page - 1) * limit + 1}</span> to{' '}
              <span className='font-medium'>
                {Math.min(page * limit, totalApplications)}
              </span>{' '}
              of <span className='font-medium'>{totalApplications}</span>{' '}
              results
            </p>
          </div>
          <div>
            <nav
              className='isolate inline-flex -space-x-px rounded-md shadow-sm'
              aria-label='Pagination'
            >
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className='relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
              >
                <span className='sr-only'>Previous</span>
                <svg
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path
                    fillRule='evenodd'
                    d='M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  p =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1)
                )
                .map((p, i, arr) => {
                  if (i > 0 && arr[i - 1] !== p - 1) {
                    return (
                      <span
                        key={`ellipsis-${p}`}
                        className='relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0'
                      >
                        ...
                      </span>
                    )
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      aria-current={page === p ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        page === p
                          ? 'bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
              >
                <span className='sr-only'>Next</span>
                <svg
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path
                    fillRule='evenodd'
                    d='M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
