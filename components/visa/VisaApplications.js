'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  CheckCircle,
  MinusCircle,
  Link
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { IoFilterSharp } from 'react-icons/io5'
import {
  getVisaApplications,
  downloadVisaApplicationsCSV
} from '@/services/visa/visa.service'

const cardDefs = [
  { id: 'total', title: 'Total Visa Applications', bg: 'bg-[#1F57D6]' },
  { id: 'completed', title: 'Completed Visa Applications', bg: 'bg-[#15803D]' },
  { id: 'pending', title: 'Pending Visa Applications', bg: 'bg-[#B91C1C]' }
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
  return s === 'completed' ? 'Completed' : 'Pending'
}

const statusClass = s => {
  const v = String(s || '').toLowerCase()
  if (v === 'completed')
    return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  if (v === 'pending') return 'bg-red-50 text-red-600 border border-red-200'
  return 'bg-gray-100 text-gray-600 border border-gray-200'
}

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getVisaApplications()
        const list = Array.isArray(res?.data) ? res.data : []
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
        const total = mapped.length
        const completed = mapped.filter(m => m.status === 'Completed').length
        const pending = total - completed
        setMetrics({ total, completed, pending })
      } catch (e) {
        setError('Failed to load applications')
        setApplications([])
        setMetrics({ total: 0, completed: 0, pending: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
  const markSelectedAsProcess = () => {
    // Implement API call or state update here
    // For now just log selected IDs
    try {
      console.log('Mark as process for IDs:', selectedIds)
    } catch {}
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
    <div className='space-y-7 py-12 px-12'>
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-semibold text-slate-900'>
            Visa Applications
          </h1>
          <p className='text-sm text-[#99A1BC]'>
            Dashboard / Visa Applications
          </p>
        </div>
        {/* <div className='flex flex-wrap items-center gap-3 md:justify-end'>
          <button className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'>
            View All Bookings
          </button>
          <button className='rounded-xl bg-[#FF5B2C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A]'>
            Add New Accommodation
          </button>
        </div> */}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {cardDefs.map(card => (
          <div
            key={card.id}
            className={`${card.bg} rounded-2xl p-6 text-white relative overflow-hidden`}
          >
            <div className='flex items-center justify-between'>
              <div className='bg-white/10 p-4 rounded-2xl flex-shrink-0'>
                {card.id === 'completed' ? (
                  <CheckCircle className='h-8 w-8 text-white' />
                ) : card.id === 'pending' ? (
                  <MinusCircle className='h-8 w-8 text-white' />
                ) : (
                  <svg
                    className='h-8 w-8 text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                    />
                  </svg>
                )}
              </div>
              <div className='text-right'>
                <p className='text-white/90 text-sm font-medium mb-2'>
                  {card.title}
                </p>
                <p className='text-4xl font-bold text-white'>
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

      <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <h2 className='text-lg font-semibold text-slate-900'>
            Visa Applications List
          </h2>
          <div className='flex flex-wrap items-center gap-3'>
            {selectedIds.length > 0 && (
              <button
                onClick={markSelectedAsProcess}
                className='flex h-10 items-center gap-2 rounded-xl bg-[#FF5B2C] px-4 text-sm font-semibold text-white transition hover:bg-[#F0481A]'
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
                className='h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
              <Search className='absolute left-3 h-4 w-4 text-[#A6AEC7]' />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <IoFilterSharp className='h-4 w-4 text-[#8B93AF]' />
              Filters
            </button>
            <button
              onClick={handleDownloadExcel}
              className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
            >
              <Download className='h-4 w-4 text-[#8B93AF]' />
              Export
            </button>
          </div>
        </div>

        <div className='overflow-visible rounded-2xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-[44px_1.5fr_2fr_2fr_1.5fr_1fr_1.2fr_60px] gap-3 bg-[#F7F9FD] px-6 py-4'>
            <div className='flex items-center'>
              <input
                type='checkbox'
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className='h-4 w-4 rounded border-[#D0D5DD] text-[#FF5B2C] focus:ring-[#FF5B2C]'
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
              <div className='px-6 py-5 text-sm text-[#5E6582]'>Loading...</div>
            )}
            {error && !loading && (
              <div className='px-6 py-5 text-sm text-red-600'>{error}</div>
            )}
            {!loading &&
              !error &&
              sorted.map((app, idx) => (
                <div
                  key={app.id || idx}
                  className='grid grid-cols-[44px_1.5fr_2fr_2fr_1.5fr_1fr_1.2fr_60px] gap-3 px-6 py-5 hover:bg-[#F9FAFD]'
                >
                  <div className='self-center'>
                    <input
                      type='checkbox'
                      checked={isSelected(app.id)}
                      onChange={() => toggleRowSelect(app.id)}
                      className='h-4 w-4 rounded border-[#D0D5DD] text-[#FF5B2C] focus:ring-[#FF5B2C]'
                    />
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {(() => {
                      const d = app.createdOn
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
                  <div className='flex items-center gap-3'>
                    <div className='relative h-10 w-10 overflow-hidden rounded-full border-2 border-red-500 flex-shrink-0'>
                      {app.avatar ? (
                        <img
                          src={app.avatar}
                          alt={app.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <span className='flex h-full w-full items-center justify-center bg-[#F0F2F8] text-sm font-semibold text-[#2D3658]'>
                          {app.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div className='min-w-0'>
                      <p className='text-sm font-medium text-slate-900 leading-tight'>
                        {app.name}
                      </p>
                    </div>
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {app.email}
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {app.phone}
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    <button
                      className='text-[11px] font-semibold text-[#0F4EF1] hover:underline'
                      onClick={() =>
                        router.push(`/visa/applications/${app.id}`)
                      }
                    >
                      View Application
                    </button>
                  </div>
                  <div className='flex items-center self-center'>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
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
                      className='rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </button>
                    {activeDropdown === (app.id || idx) && (
                      <div
                        ref={dropdownRef}
                        className='absolute right-0 mt-2 w-52 rounded-xl border border-[#E5E8F5] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-50'
                      >
                        <div className='py-2'>
                          <button
                            className='block w-full text-left px-4 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                            onClick={() =>
                              router.push(`/visa/applications/${app.id}`)
                            }
                          >
                            View Application
                          </button>
                          <button
                            className='block w-full text-left px-4 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                            onClick={() => markSelectedAsProcess()}
                          >
                            Mark as process
                          </button>
                          {/* <button className='block w-full text-left px-4 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'>Mark as Completed</button>
                        <button className='block w-full text-left px-4 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'>Send VISA</button> */}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
