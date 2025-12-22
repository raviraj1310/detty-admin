'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Download, Mail, PlusCircle, AlertCircle } from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getInquiries,
  downloadInquiriesCSV
} from '@/services/inquiry/inquiry.service'

const cardDefs = [
  { id: 'total', title: 'Total Inquiries', bg: 'bg-[#1F57D6]', Icon: Mail },
  { id: 'new', title: 'New Today', bg: 'bg-[#15803D]', Icon: PlusCircle },
  { id: 'resolved', title: 'Resolved', bg: 'bg-[#B91C1C]', Icon: AlertCircle }
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

export default function InquiryList () {
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState([])
  const [metrics, setMetrics] = useState({ total: 0, new: 0, resolved: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getInquiries({ page, limit })
        const payload = res?.data || res || {}
        const list = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        const mapped = list.map(d => {
          const created = d?.createdAt || ''
          const createdTs = created ? new Date(created).getTime() : 0
          const name = String(d?.name || '').trim()
          const relatedName = String(
            d?.event?.eventName || d?.activity?.activityName || ''
          ).trim()
          return {
            id: d?._id || d?.id,
            name,
            email: d?.email || '',
            contactNumber: d?.contactNumber || '',
            inquiryType: d?.inquiryType || '',
            relatedName,
            message: d?.message || '',
            createdOn: created,
            createdTs
          }
        })
        setItems(mapped)
        const total = Number(payload?.total ?? mapped.length) || 0
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const newToday = mapped.filter(
          m => m.createdTs >= startOfToday.getTime()
        ).length
        const resolved = 0
        setMetrics({ total, new: newToday, resolved })
        const srvPages = Number(payload?.pages ?? 1)
        const srvPage = Number(payload?.page ?? page)
        const srvLimit = Number(payload?.limit ?? limit)
        if (Number.isFinite(total)) setTotalCount(total)
        if (Number.isFinite(srvPages)) setPageCount(Math.max(1, srvPages))
        if (Number.isFinite(srvPage)) setPage(Math.max(1, srvPage))
        if (Number.isFinite(srvLimit)) setLimit(Math.max(1, srvLimit))
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || 'Failed to load inquiries'
        setError(msg)
        setItems([])
        setMetrics({ total: 0, new: 0, resolved: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, limit])

  const filtered = useMemo(() => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return items
    const termDigits = term.replace(/[^0-9]/g, '')
    return items.filter(s => {
      const name = String(s.name || '').toLowerCase()
      const email = String(s.email || '').toLowerCase()
      const contactNumber = String(s.contactNumber || '').toLowerCase()
      const inquiryType = String(s.inquiryType || '').toLowerCase()
      const relatedName = String(s.relatedName || '').toLowerCase()
      const message = String(s.message || '').toLowerCase()
      const createdStr = new Date(s.createdOn)
        .toLocaleString(undefined, {
          weekday: 'short',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        .toLowerCase()
      const createdDigits = createdStr.replace(/[^0-9]/g, '')
      const matchesText =
        name.includes(term) ||
        email.includes(term) ||
        contactNumber.includes(term) ||
        inquiryType.includes(term) ||
        relatedName.includes(term) ||
        message.includes(term) ||
        createdStr.includes(term)
      const matchesDigits = termDigits && createdDigits.includes(termDigits)
      return matchesText || matchesDigits
    })
  }, [items, searchTerm])

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
        case 'contactNumber':
          return (
            String(a.contactNumber || '').localeCompare(
              String(b.contactNumber || '')
            ) * dir
          )
        case 'inquiryType':
          return (
            String(a.inquiryType || '').localeCompare(
              String(b.inquiryType || '')
            ) * dir
          )
        case 'relatedName':
          return (
            String(a.relatedName || '').localeCompare(
              String(b.relatedName || '')
            ) * dir
          )
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const downloadCsv = async () => {
    try {
      const blob = await downloadInquiriesCSV()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'inquiries.csv'
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
    <div className='space-y-7 py-2 px-2'>
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-semibold text-slate-900'>Inquiries</h1>
          <p className='text-sm text-[#99A1BC]'>Dashboard / Inquiries</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
        {cardDefs.map(card => (
          <div
            key={card.id}
            className={`${card.bg} rounded-xl p-3 text-white relative overflow-hidden`}
          >
            <div className='flex items-center justify-between'>
              <div className='bg-white/10 p-2.5 rounded-xl flex-shrink-0'>
                <card.Icon className='h-6 w-6 text-white' />
              </div>
              <div className='text-right'>
                <p className='text-white/90 text-xs font-medium mb-1'>
                  {card.title}
                </p>
                <p className='text-2xl font-bold text-white'>
                  {String(
                    card.id === 'total'
                      ? metrics.total
                      : card.id === 'new'
                      ? metrics.new
                      : metrics.resolved
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <h2 className='text-lg font-semibold text-slate-900'>Inquiry List</h2>
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
            <button
              className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
              onClick={downloadCsv}
            >
              <Download className='h-4 w-4 text-[#8B93AF]' />
            </button>
            <div className='flex items-center gap-3'>
              <label className='text-sm text-[#2D3658]'>
                Show
                <select
                  value={limit}
                  onChange={e => setLimit(Number(e.target.value) || 20)}
                  className='ml-2 px-2 py-1 border border-[#E5E6EF] rounded'
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
                  className='h-10 px-3 py-1.5 border border-[#E5E6EF] rounded bg-white disabled:opacity-50'
                >
                  Prev
                </button>
                <span className='text-sm text-[#2D3658]'>
                  Page {page} of {pageCount}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                  disabled={page >= pageCount || loading}
                  className='h-10 px-3 py-1.5 border border-[#E5E6EF] rounded bg-white disabled:opacity-50'
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className='overflow-visible rounded-2xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-[1.2fr_1.8fr_1.6fr_1.4fr_1.8fr_1.2fr_2fr] gap-2 bg-[#F7F9FD] px-4 py-3'>
            <div>
              <TableHeaderCell onClick={() => toggleSort('date')}>
                Submitted On
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('name')}>
                Name
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('email')}>
                Email
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('contactNumber')}>
                Contact Number
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('relatedName')}>
                Event/Activity
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('inquiryType')}>
                Inquiry Type
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell>Message</TableHeaderCell>
            </div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {loading && (
              <div className='px-4 py-3 text-sm text-[#5E6582]'>Loading...</div>
            )}
            {error && !loading && (
              <div className='px-4 py-3 text-sm text-red-600'>{error}</div>
            )}
            {!loading &&
              !error &&
              sorted.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className='grid grid-cols-[1.2fr_1.8fr_1.6fr_1.4fr_1.8fr_1.2fr_2fr] gap-2 px-4 py-3 hover:bg-[#F9FAFD]'
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
                    {s.name || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582] truncate'>
                    {s.email || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582] truncate'>
                    {s.contactNumber || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582] truncate'>
                    {s.relatedName || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582] truncate'>
                    {s.inquiryType || '-'}
                  </div>
                  <div
                    className='self-center text-sm text-[#5E6582] truncate cursor-pointer'
                    title={String(s.message || '')}
                  >
                    {s.message || '-'}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
