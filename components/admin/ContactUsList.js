'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Download, Mail, PlusCircle, AlertCircle } from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getContacts,
  downloadContactsCSV
} from '@/services/contact-us/contact.service'

const cardDefs = [
  { id: 'total', title: 'Total Messages', bg: 'bg-[#1F57D6]', Icon: Mail },
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

export default function ContactUsList () {
  const [searchTerm, setSearchTerm] = useState('')
  const [contacts, setContacts] = useState([])
  const [metrics, setMetrics] = useState({ total: 0, new: 0, resolved: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getContacts()
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        const mapped = list.map(d => {
          const created = d?.createdAt || ''
          const createdTs = created ? new Date(created).getTime() : 0
          const firstName = String(d?.firstName || '').trim()
          const lastName = String(d?.lastName || '').trim()
          return {
            id: d?._id || d?.id,
            firstName,
            lastName,
            email: d?.email || '',
            subject: d?.subject || '',
            message: d?.message || '',
            createdOn: created,
            createdTs
          }
        })
        setContacts(mapped)
        const total = mapped.length
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const newToday = mapped.filter(
          m => m.createdTs >= startOfToday.getTime()
        ).length
        const resolved = mapped.filter(
          m => String(m.status).toLowerCase() === 'resolved'
        ).length
        setMetrics({ total, new: newToday, resolved })
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || 'Failed to load contacts'
        setError(msg)
        setContacts([])
        setMetrics({ total: 0, new: 0, resolved: 0 })
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
    if (!term) return contacts
    const termDigits = term.replace(/[^0-9]/g, '')
    return contacts.filter(s => {
      const firstName = String(s.firstName || '').toLowerCase()
      const lastName = String(s.lastName || '').toLowerCase()
      const email = String(s.email || '').toLowerCase()
      const subject = String(s.subject || '').toLowerCase()
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
        firstName.includes(term) ||
        lastName.includes(term) ||
        email.includes(term) ||
        subject.includes(term) ||
        message.includes(term) ||
        createdStr.includes(term)
      const matchesDigits = termDigits && createdDigits.includes(termDigits)
      return matchesText || matchesDigits
    })
  }, [contacts, searchTerm])

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
        case 'firstName':
          return (
            String(a.firstName || '').localeCompare(String(b.firstName || '')) *
            dir
          )
        case 'lastName':
          return (
            String(a.lastName || '').localeCompare(String(b.lastName || '')) *
            dir
          )
        case 'email':
          return (
            String(a.email || '').localeCompare(String(b.email || '')) * dir
          )
        case 'subject':
          return (
            String(a.subject || '').localeCompare(String(b.subject || '')) * dir
          )

        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const downloadCsv = async () => {
    try {
      const blob = await downloadContactsCSV()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'contact-us.csv'
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
    <div className='space-y-4 py-6 px-6'>
      <div className='flex flex-col gap-1 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold text-slate-900'>Contact Us</h1>
          <p className='text-sm text-[#99A1BC]'>Dashboard / Contact Us</p>
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

      <div className='rounded-xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold text-slate-900'>
            Contact us Enquiries
          </h2>
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
              className='flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
              onClick={downloadCsv}
            >
              <Download className='h-3.5 w-3.5 text-[#8B93AF]' />
            </button>
          </div>
        </div>

        <div className='overflow-visible rounded-lg border border-[#E5E8F5]'>
          <div className='grid grid-cols-[1.2fr_1fr_1fr_1.8fr_1.6fr_2fr] gap-2 bg-[#F7F9FD] px-4 py-2.5'>
            <div>
              <TableHeaderCell onClick={() => toggleSort('date')}>
                Submitted On
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('firstName')}>
                First Name
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('lastName')}>
                Last Name
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('email')}>
                Email
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('subject')}>
                Subject
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
                  className='grid grid-cols-[1.2fr_1fr_1fr_1.8fr_1.6fr_2fr] gap-2 px-4 py-3 hover:bg-[#F9FAFD]'
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
                    {s.firstName || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582] truncate'>
                    {s.lastName || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582] truncate'>
                    {s.email || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582] truncate'>
                    {s.subject || '-'}
                  </div>
                  <div className='self-center text-sm text-[#5E6582] truncate'>
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