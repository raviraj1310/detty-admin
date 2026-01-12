'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Download } from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { HiOutlineMail } from 'react-icons/hi'
import { AiOutlinePlusCircle, AiOutlineExclamationCircle } from 'react-icons/ai'
import {
  getInquiries,
  downloadInquiriesCSV
} from '@/services/inquiry/inquiry.service'
import { downloadExcel } from '@/utils/excelExport'

const cardDefs = [
  {
    id: 'total',
    title: 'Total Inquiries',
    bg: 'bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF]',
    iconBg: 'bg-white',
    textColor: 'text-indigo-600',
    Icon: HiOutlineMail
  },
  {
    id: 'new',
    title: 'New Today',
    bg: 'bg-gradient-to-r from-[#E8F8F0] to-[#B8EDD0]',
    iconBg: 'bg-white',
    textColor: 'text-emerald-600',
    Icon: AiOutlinePlusCircle
  },
  {
    id: 'resolved',
    title: 'Resolved',
    bg: 'bg-gradient-to-r from-[#FFE8E8] to-[#FFC5C5]',
    iconBg: 'bg-white',
    textColor: 'text-red-600',
    Icon: AiOutlineExclamationCircle
  }
]

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

export default function InquiryList () {
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState([])
  const [metrics, setMetrics] = useState({ total: 0, new: 0, resolved: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [rowData, setRawData] = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getInquiries({ page, limit })
        const payload = res?.data || res || {}
        setRawData(payload?.items || [])
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

  // const downloadCsv = async () => {
  //   try {
  //     const blob = await downloadInquiriesCSV();
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = "inquiries.csv";
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     URL.revokeObjectURL(url);
  //   } catch (e) {
  //     const msg =
  //       e?.response?.data?.message || e?.message || "Failed to download CSV";
  //     setError(msg);
  //   }
  // };

  const downloadCsv = () => {
    try {
      setExporting(true)

      if (!items?.length) return

      const dataToExport = rowData.map(d => ({
        // 🔹 Inquiry Info
        'Inquiry ID': d?._id,
        Name: d?.name,
        Email: d?.email,
        'Contact Number': d?.contactNumber,
        'Inquiry Type': d?.inquiryType,
        Message: d?.message,

        // 🔹 Event Info
        'Event Name': d?.event?.eventName,
        'Event Slug': d?.event?.slug,
        Location: d?.event?.location,
        'Opening Hours': d?.event?.openingHours,

        // 🔹 Dates
        'Inquiry Created At': d?.createdAt,
        'Event Start Date': d?.event?.eventStartDate,
        'Event End Date': d?.event?.eventEndDate
      }))

      downloadExcel(dataToExport, 'Inquiries.xlsx')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className='space-y-7 py-2 px-2'>
      <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>Inquiries</h1>
          <p className='text-xs text-[#99A1BC]'>Dashboard / Inquiries</p>
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
                <card.Icon className={`h-6 w-6 ${card.textColor}`} />
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

      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
          <h2 className='text-sm font-semibold text-slate-900'>Inquiry List</h2>
          <div className='flex flex-wrap items-center gap-2'>
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
            <button
              disabled={exporting}
              className='flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
              onClick={downloadCsv}
            >
              <Download className='h-3.5 w-3.5 text-[#8B93AF]' />
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

        <div className='overflow-x-auto rounded-lg border border-gray-200'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  <TableHeaderCell onClick={() => toggleSort('date')}>
                    Submitted On
                  </TableHeaderCell>
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  <TableHeaderCell onClick={() => toggleSort('name')}>
                    Name
                  </TableHeaderCell>
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  <TableHeaderCell onClick={() => toggleSort('email')}>
                    Email
                  </TableHeaderCell>
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  <TableHeaderCell onClick={() => toggleSort('contactNumber')}>
                    Contact Number
                  </TableHeaderCell>
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  <TableHeaderCell onClick={() => toggleSort('relatedName')}>
                    Event/Activity
                  </TableHeaderCell>
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  <TableHeaderCell onClick={() => toggleSort('inquiryType')}>
                    Inquiry Type
                  </TableHeaderCell>
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  <TableHeaderCell>Message</TableHeaderCell>
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-4 py-4 text-sm text-gray-500 text-center'
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-4 py-4 text-sm text-red-600 text-center'
                  >
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-4 py-4 text-sm text-gray-500 text-center'
                  >
                    No inquiries found.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                sorted.map((s, idx) => (
                  <tr key={s.id || idx} className='hover:bg-gray-50'>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
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
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {s.name || '-'}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {s.email || '-'}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {s.contactNumber || '-'}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {s.relatedName || '-'}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {s.inquiryType || '-'}
                    </td>
                    <td
                      className='px-4 py-4 text-sm text-gray-500 max-w-xs truncate cursor-pointer'
                      title={String(s.message || '')}
                    >
                      {s.message || '-'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
