'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Download } from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  eventReferralReport,
  activityReferralReport
} from '@/services/booking/booking.service'

const toImageSrc = u => {
  const s = String(u || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  let origin = originEnv
  if (!origin) {
    try {
      origin = new URL(apiBase).origin
    } catch {
      origin = ''
    }
  }
  if (!origin) origin = originEnv
  const base = origin.replace(/\/+$/, '')
  const path = s.replace(/^\/+/, '')
  return base ? `${base}/${path}` : s
}

const currency = n => {
  const num = typeof n === 'number' ? n : Number(n || 0)
  if (Number.isNaN(num)) return '-'
  return `₦${num.toLocaleString()}`
}

const fmtDateTime = (dateInput, timeInput) => {
  const raw =
    dateInput && typeof dateInput === 'object' && dateInput.$date
      ? dateInput.$date
      : dateInput
  const dt = raw ? new Date(raw) : null
  if (!dt || isNaN(dt.getTime())) return '-'
  const day = dt.toLocaleDateString(undefined, { weekday: 'short' })
  const month = dt.toLocaleDateString(undefined, { month: 'long' })
  const dayNum = dt.toLocaleDateString(undefined, { day: '2-digit' })
  const year = dt.toLocaleDateString(undefined, { year: 'numeric' })
  let timeStr = ''
  if (typeof timeInput === 'string' && timeInput.trim()) {
    timeStr = timeInput.trim()
  } else {
    timeStr = dt.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  return `${day}, ${month} ${dayNum}, ${year} at ${timeStr}`
}

export default function ReferralReportsPage () {
  const [activeTab, setActiveTab] = useState('event')
  const [searchTerm, setSearchTerm] = useState('')
  const [eventRows, setEventRows] = useState([])
  const [activityRows, setActivityRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const [eventRes, activityRes] = await Promise.all([
          eventReferralReport(),
          activityReferralReport()
        ])
        const rawEvents = Array.isArray(eventRes?.data)
          ? eventRes.data
          : Array.isArray(eventRes)
          ? eventRes
          : []
        const rawActivities = Array.isArray(activityRes?.data)
          ? activityRes.data
          : Array.isArray(activityRes)
          ? activityRes
          : []

        const ticketsTextSimple = arr => {
          const list = Array.isArray(arr) ? arr : []
          return list
            .map(t => `${t.quantity || 0} x ${t.ticketName || '-'}`)
            .join(' | ')
        }
        const ticketsTotalSimple = arr => {
          const list = Array.isArray(arr) ? arr : []
          return list.reduce(
            (sum, t) =>
              sum +
              (Number(
                t.totalPrice ||
                  Number(t.perTicketPrice || 0) * Number(t.quantity || 0)
              ) || 0),
            0
          )
        }

        const mappedEvents = rawEvents.map((b, idx) => {
          const e = b?.eventId || b?.event || {}
          const qty = typeof b?.quantity === 'number' ? b.quantity : 0
          const firstTicket = Array.isArray(b?.tickets) ? b.tickets[0] : null
          const baseType =
            firstTicket?.ticketType || e?.eventType || b?.type || '-'
          const evName =
            e?.eventName || e?.title || b?.eventName || b?.title || '-'
          const evType =
            (e?.eventType && e?.eventType.name) || e?.eventType || baseType
          const evImg = toImageSrc(
            e?.image || b?.eventImage || e?.uploadImage || ''
          )
          return {
            id: b?._id || b?.bookingId || `booking-${idx}`,
            eventDate: fmtDateTime(
              b?.arrivalDate || e?.eventStartDate,
              e?.eventStartTime
            ),
            eventName: evName,
            eventImage: evImg,
            referralCode: b?.referralCode || '-',
            type: evType,
            ticketsBooked: qty
              ? `${qty} x ${firstTicket?.ticketName || '-'}`
              : ticketsTextSimple(b?.tickets),
            amount: ticketsTotalSimple(b?.tickets),
            eventStatus: String(b?.status || 'Pending'),
            paymentStatus: String(b?.paymentStatus || 'Pending')
          }
        })

        const mappedActivities = rawActivities.map((b, idx) => {
          const a = b?.activityId || b?.activity || {}
          const aName = a?.activityName || b?.activityName || '-'
          const aImg = toImageSrc(
            a?.image || b?.activityImage || a?.uploadImage || ''
          )
          const type =
            a?.activityType?.activityTypeName ||
            b?.activity?.activityType?.activityTypeName ||
            a?.type ||
            b?.type ||
            '-'
          return {
            id: b?._id || b?.id || b?.bookingId || `booking-${idx}`,
            eventDate: fmtDateTime(b?.arrivalDate),
            activityName: aName,
            activityImage: aImg,
            referralCode: b?.referralCode || b?.referral || '-',
            type,
            ticketsBooked: ticketsTextSimple(b?.tickets),
            amount: ticketsTotalSimple(b?.tickets),
            activityStatus: String(
              b?.status || b?.activityStatus || b?.bookingStatus || 'Pending'
            ),
            paymentStatus: String(b?.paymentStatus || '-')
          }
        })

        setEventRows(mappedEvents)
        setActivityRows(mappedActivities)
      } catch (e) {
        setError('Failed to load referral reports')
        setEventRows([])
        setActivityRows([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredEvent = useMemo(() => {
    const t = String(searchTerm || '')
      .trim()
      .toLowerCase()
    const base = Array.isArray(eventRows) ? eventRows : []
    if (!t) return base
    return base.filter(r => {
      const s =
        `${r.eventDate} ${r.eventName} ${r.referralCode} ${r.type} ${r.ticketsBooked} ${r.eventStatus} ${r.paymentStatus}`.toLowerCase()
      return s.includes(t)
    })
  }, [searchTerm, eventRows])

  const filteredActivity = useMemo(() => {
    const t = String(searchTerm || '')
      .trim()
      .toLowerCase()
    const base = Array.isArray(activityRows) ? activityRows : []
    if (!t) return base
    return base.filter(r => {
      const s =
        `${r.eventDate} ${r.activityName} ${r.referralCode} ${r.type} ${r.ticketsBooked} ${r.activityStatus} ${r.paymentStatus}`.toLowerCase()
      return s.includes(t)
    })
  }, [searchTerm, activityRows])

  const toCsvCell = v => {
    const s = String(v ?? '')
    const needsQuotes = /[",\n]/.test(s)
    const escaped = s.replace(/"/g, '""')
    return needsQuotes ? `"${escaped}"` : escaped
  }

  const handleDownload = () => {
    const rows = activeTab === 'event' ? filteredEvent : filteredActivity
    const headers =
      activeTab === 'event'
        ? [
            'Event Date',
            'Event Name',
            'Referral Code',
            'Type',
            'Tickets Booked',
            'Amount',
            'Event Status',
            'Payment Status'
          ]
        : [
            'Added On',
            'Activity Name',
            'Referral Code',
            'Type',
            'Tickets Booked',
            'Amount',
            'Status',
            'Payment Status'
          ]
    const lines = []
    lines.push(headers.map(toCsvCell).join(','))
    rows.forEach(r => {
      if (activeTab === 'event') {
        lines.push(
          [
            r.eventDate,
            r.eventName,
            r.referralCode,
            r.type,
            r.ticketsBooked,
            r.amount,
            r.eventStatus,
            r.paymentStatus
          ]
            .map(toCsvCell)
            .join(',')
        )
      } else {
        lines.push(
          [
            r.eventDate,
            r.activityName,
            r.referralCode,
            r.type,
            r.ticketsBooked,
            r.amount,
            r.activityStatus,
            r.paymentStatus
          ]
            .map(toCsvCell)
            .join(',')
        )
      }
    })
    const csv = `\ufeff${lines.join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download =
      activeTab === 'event'
        ? 'event-referral-report.csv'
        : 'activity-referral-report.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className='min-h-full bg-[#F4F6FB]'>
      <div className='rounded-[30px] border border-white/80 bg-white'>
        <div className='p-6 sm:p-8 lg:p-10'>
          <div className='mb-4'>
            <h1 className='text-2xl font-semibold text-slate-900'>
              Referral Reports
            </h1>
            <p className='text-sm text-[#99A1BC]'>Dashboard / Reports</p>
          </div>

          <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-4'>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => setActiveTab('event')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    activeTab === 'event'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  Event
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    activeTab === 'activity'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  Activity
                </button>
              </div>
              <div className='flex items-center gap-3'>
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
                <button
                  onClick={handleDownload}
                  className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
                >
                  <Download className='w-4 h-4 text-gray-600' />
                </button>
              </div>
            </div>

            {activeTab === 'event' ? (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 text-[#2D3658]'>
                    <tr>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        <div className='flex items-center'>
                          <span>Event Date</span>
                          <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                        </div>
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        <div className='flex items-center'>
                          <span>Event Name</span>
                          <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                        </div>
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Referral Code
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Type
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Tickets Booked
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Amount
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Event Status
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {loading && filteredEvent.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className='px-3 py-6 text-center text-sm text-[#5E6582]'
                        >
                          Loading…
                        </td>
                      </tr>
                    ) : filteredEvent.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className='px-3 py-6 text-center text-sm text-[#5E6582]'
                        >
                          {error ? error : 'No records found'}
                        </td>
                      </tr>
                    ) : (
                      filteredEvent.map(row => (
                        <tr key={row.id} className='hover:bg-gray-50'>
                          <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                            {row.eventDate}
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap'>
                            <div className='flex items-center gap-2'>
                              <img
                                src={row.eventImage || '/images/no-image.webp'}
                                alt='Event image'
                                className='h-8 w-8 rounded object-cover bg-gray-200'
                                onError={e => {
                                  e.currentTarget.src = '/images/no-image.webp'
                                }}
                              />
                              <div className='text-sm font-medium text-gray-900 leading-tight'>
                                {row.eventName}
                              </div>
                            </div>
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                            {row.referralCode}
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                            {row.type}
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                            {row.ticketsBooked}
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap'>
                            <span className='text-sm font-semibold text-gray-900'>
                              {currency(row.amount)}
                            </span>
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap'>
                            <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F5F6FA] text-[#5E6582]'>
                              {row.eventStatus}
                            </span>
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap'>
                            <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F5F6FA] text-[#5E6582]'>
                              {row.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 text-[#2D3658]'>
                    <tr>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        <div className='flex items-center'>
                          <span>Added On</span>
                          <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                        </div>
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        <div className='flex items-center'>
                          <span>Activity Name</span>
                          <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                        </div>
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Referral Code
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Type
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Tickets Booked
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Amount
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Status
                      </th>
                      <th className='px-3 py-2 text-left text-xs font-medium uppercase tracking-[0.12em]'>
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {loading && filteredActivity.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className='px-3 py-6 text-center text-sm text-[#5E6582]'
                        >
                          Loading…
                        </td>
                      </tr>
                    ) : filteredActivity.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className='px-3 py-6 text-center text-sm text-[#5E6582]'
                        >
                          {error ? error : 'No records found'}
                        </td>
                      </tr>
                    ) : (
                      filteredActivity.map(row => (
                        <tr key={row.id} className='hover:bg-gray-50'>
                          <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                            {row.eventDate}
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap'>
                            <div className='flex items-center gap-2'>
                              <img
                                src={
                                  row.activityImage || '/images/no-image.webp'
                                }
                                alt='Activity image'
                                className='h-8 w-8 rounded object-cover bg-gray-200'
                                onError={e => {
                                  e.currentTarget.src = '/images/no-image.webp'
                                }}
                              />
                              <div className='text-sm font-medium text-gray-900 leading-tight'>
                                {row.activityName}
                              </div>
                            </div>
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                            {row.referralCode}
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                            {row.type}
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                            {row.ticketsBooked}
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap'>
                            <span className='text-sm font-semibold text-gray-900'>
                              {currency(row.amount)}
                            </span>
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap'>
                            <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F5F6FA] text-[#5E6582]'>
                              {row.activityStatus}
                            </span>
                          </td>
                          <td className='px-3 py-3 whitespace-nowrap'>
                            <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#F5F6FA] text-[#5E6582]'>
                              {row.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
