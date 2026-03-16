'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  User,
  XCircle,
  ChevronLeft,
  FileText,
  Loader2
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'
import {
  getAllBookingWeightManagementEvent,
  getBookingWeightManagementEventById
} from '@/services/nutrition/nutrition.service'
import {
  downloadWeightManagementBookings,
  downloadWeightManagementBookingsById
} from '@/services/excel/excel.service'

const formatDate = dateString => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const formatCurrency = amount => {
  return `₦${Number(amount || 0).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

const TableHeaderCell = ({
  children,
  align = 'left',
  onClick,
  active = false,
  order = 'asc'
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } ${active ? 'text-[#2D3658]' : 'text-[#8A92AC]'} hover:text-[#2D3658]`}
  >
    {children}
    {active ? (
      <span className='text-[#2D3658]'>{order === 'asc' ? ' ↑' : ' ↓'}</span>
    ) : (
      <TbCaretUpDownFilled className='h-3 w-3 text-[#CBCFE2]' />
    )}
  </button>
)

const mapBookingFromApi = api => {
  const buyer = api?.buyer || {}
  const user = api?.userId || {}
  const event = api?.weightManagementEventId || {}
  const passes = Array.isArray(api?.passes) ? api.passes : []
  const firstPass = passes[0] || {}

  const pay = String(api?.paymentStatus || '').toLowerCase()
  const bookingStatus = String(api?.status || '').toLowerCase()

  const passName = firstPass?.passName || 'Pass'
  const perPassPrice = firstPass?.perPassPrice ?? firstPass?.totalPrice
  const passBooked =
    perPassPrice != null
      ? `${passName} (${formatCurrency(perPassPrice)})`
      : passName

  const amount = formatCurrency(
    api?.finalPayableAmount ?? api?.pricing?.total ?? api?.totalAmount ?? 0
  )

  const paymentStatus =
    pay === 'success' || pay === 'completed'
      ? 'Completed'
      : pay === 'pending'
      ? 'Pending'
      : bookingStatus === 'cancelled' || bookingStatus === 'canceled'
      ? 'Cancelled'
      : 'Pending'

  return {
    _id: api?._id,
    createdAt: api?.createdAt || api?.bookingDate,
    userName: buyer?.fullName || user?.name || '—',
    email: buyer?.email || user?.email || '—',
    phone: buyer?.phone || buyer?.contactNo || '—',
    passBooked,
    amount,
    paymentStatus,
    eventName: event?.eventName || ''
  }
}

export default function WeightManagementEventBookingsList () {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id

  const [eventName, setEventName] = useState('')
  const [bookings, setBookings] = useState([])
  const [metrics, setMetrics] = useState({
    totalBookings: '0',
    revenue: '0',
    cancelledBookings: '0'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [sortKey, setSortKey] = useState('bookedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [downloadingExcel, setDownloadingExcel] = useState(false)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastProps, setToastProps] = useState({
    title: '',
    description: '',
    variant: 'success'
  })

  const showToast = (title, description, variant = 'success') => {
    setToastProps({ title, description, variant })
    setToastOpen(true)
  }

  const handleDownloadBookings = async () => {
    if (downloadingExcel) return
    setDownloadingExcel(true)
    try {
      const blob = eventId
        ? await downloadWeightManagementBookingsById(eventId, {
            search: searchTerm?.trim() || undefined
          })
        : await downloadWeightManagementBookings({
            search: searchTerm?.trim() || undefined
          })
      if (!blob) {
        showToast('Error', 'Failed to download Excel', 'error')
        return
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weight-management-bookings-${eventId || 'all'}-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showToast(
        'Error',
        err?.response?.data?.message ||
          err?.message ||
          'Failed to download Excel',
        'error'
      )
    } finally {
      setDownloadingExcel(false)
    }
  }

  const serverSearchEnabled = !eventId

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = eventId
          ? await getBookingWeightManagementEventById(eventId)
          : await getAllBookingWeightManagementEvent(1, 10, {
              search: searchTerm?.trim() || undefined
            })
        if (!res?.success) {
          showToast('Error', res?.message || 'Failed to load bookings', 'error')
          setBookings([])
          setEventName('')
          setMetrics({
            totalBookings: '0',
            revenue: formatCurrency(0),
            cancelledBookings: '0'
          })
          return
        }

        const list = Array.isArray(res?.data) ? res.data : []
        const mapped = list.map(mapBookingFromApi)
        setBookings(mapped)

        const first = list[0]
        const evName = first?.weightManagementEventId?.eventName || ''
        setEventName(eventId ? evName : '')

        const totalBookings = Number(res?.total ?? mapped.length ?? 0)
        const revenue = list.reduce((sum, b) => {
          const pay = String(b?.paymentStatus || '').toLowerCase()
          const isPaid = pay === 'success' || pay === 'completed'
          const amt =
            Number(
              b?.finalPayableAmount ?? b?.pricing?.total ?? b?.totalAmount ?? 0
            ) || 0
          return sum + (isPaid ? amt : 0)
        }, 0)
        const cancelledBookings = list.filter(b => {
          const st = String(b?.status || '').toLowerCase()
          return st === 'cancelled' || st === 'canceled'
        }).length

        setMetrics({
          totalBookings: String(totalBookings),
          revenue: formatCurrency(revenue),
          cancelledBookings: String(cancelledBookings)
        })
      } catch (err) {
        showToast(
          'Error',
          err?.response?.data?.message ||
            err?.message ||
            'Failed to load bookings',
          'error'
        )
        setBookings([])
        setEventName('')
        setMetrics({
          totalBookings: '0',
          revenue: formatCurrency(0),
          cancelledBookings: '0'
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [eventId, serverSearchEnabled ? searchTerm : null])

  useEffect(() => {
    const handleClickOutside = e => {
      if (menuOpenId !== null && !e.target.closest('.action-menu')) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  const handleSort = key => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return bookings
    return bookings.filter(
      b =>
        (b.userName || '').toLowerCase().includes(term) ||
        (b.email || '').toLowerCase().includes(term) ||
        (b.phone || '').toLowerCase().includes(term)
    )
  }, [bookings, searchTerm])

  const sortedBookings = useMemo(() => {
    const arr = [...filteredBookings]
    arr.sort((a, b) => {
      let va, vb
      switch (sortKey) {
        case 'bookedOn':
          va = new Date(a.createdAt || 0).getTime()
          vb = new Date(b.createdAt || 0).getTime()
          break
        case 'userName':
          va = (a.userName || '').toLowerCase()
          vb = (b.userName || '').toLowerCase()
          break
        case 'email':
          va = (a.email || '').toLowerCase()
          vb = (b.email || '').toLowerCase()
          break
        case 'amount':
          va = parseFloat(String(a.amount || '0').replace(/[^0-9.]/g, '')) || 0
          vb = parseFloat(String(b.amount || '0').replace(/[^0-9.]/g, '')) || 0
          break
        case 'paymentStatus':
          va = (a.paymentStatus || '').toLowerCase()
          vb = (b.paymentStatus || '').toLowerCase()
          break
        default:
          va = a[sortKey]
          vb = b[sortKey]
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [filteredBookings, sortKey, sortOrder])

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title={toastProps.title}
        description={toastProps.description}
        variant={toastProps.variant}
      />

      <div className='mb-6'>
        <button
          type='button'
          onClick={() => router.back()}
          className='mb-2 flex w-fit items-center gap-1 text-xs font-medium text-[#8A92AC] transition-colors hover:text-[#2D3658]'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <h1 className='text-2xl font-bold text-[#1E293B]'>
          Weight Management Event Bookings
          {eventId && eventName && (
            <span className='text-[#FF4400]'> ({eventName})</span>
          )}
        </h1>
        <p className='mt-1 text-sm text-[#64748B]'>Dashboard / Bookings</p>
      </div>

      <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='flex items-center justify-between rounded-2xl border border-white/60 bg-[#F3E8FF] p-4 shadow-sm'>
          <div className='text-right min-w-0 flex-1'>
            <p className='text-xs font-medium text-purple-600'>
              Total Bookings
            </p>
            <p className='text-xl font-bold text-purple-600'>
              {metrics.totalBookings}
            </p>
          </div>
          <div className='rounded-xl bg-white p-2.5 shadow-sm'>
            <User className='h-5 w-5 text-purple-600' />
          </div>
        </div>
        <div className='flex items-center justify-between rounded-2xl border border-white/60 bg-[#E0F2F1] p-4 shadow-sm'>
          <div className='text-right min-w-0 flex-1'>
            <p className='text-xs font-medium text-teal-700'>Revenue</p>
            <p className='text-lg font-bold text-teal-700 truncate'>
              {metrics.revenue}
            </p>
          </div>
          <div className='rounded-xl bg-white p-2.5 shadow-sm'>
            <FileText className='h-5 w-5 text-teal-700' />
          </div>
        </div>
        <div className='flex items-center justify-between rounded-2xl border border-white/60 bg-[#FCE4EC] p-4 shadow-sm'>
          <div className='text-right min-w-0 flex-1'>
            <p className='text-xs font-medium text-pink-600'>
              Cancelled Bookings
            </p>
            <p className='text-lg font-bold text-pink-600 truncate'>
              {metrics.cancelledBookings}
            </p>
          </div>
          <div className='rounded-xl bg-white p-2.5 shadow-sm'>
            <XCircle className='h-5 w-5 text-pink-600' />
          </div>
        </div>
      </div>

      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-lg font-semibold text-[#1E293B]'>Booking List</h2>
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-[260px] rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#94A3B8] focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <button
              type='button'
              className='flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 text-sm font-medium text-[#64748B] hover:bg-gray-50'
            >
              <IoFilterSharp className='h-4 w-4' />
              Filters
            </button>
            <button
              type='button'
              onClick={handleDownloadBookings}
              disabled={downloadingExcel}
              className='flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 disabled:opacity-50'
            >
              {downloadingExcel ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Download className='h-4 w-4' />
              )}
            </button>
          </div>
        </div>

        <div className='overflow-x-auto rounded-xl border border-[#E5E8F5]'>
          <table className='w-full min-w-[900px] border-collapse'>
            <thead>
              <tr className='border-b border-[#E1E6F7] bg-[#F8F9FC]'>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('bookedOn')}
                    active={sortKey === 'bookedOn'}
                    order={sortOrder}
                  >
                    Booked On
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('userName')}
                    active={sortKey === 'userName'}
                    order={sortOrder}
                  >
                    User Name
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('email')}
                    active={sortKey === 'email'}
                    order={sortOrder}
                  >
                    Email Id
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>Phone Number</th>
                <th className='py-3 px-4 text-left'>Pass Booked</th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('amount')}
                    active={sortKey === 'amount'}
                    order={sortOrder}
                  >
                    Amount
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('paymentStatus')}
                    active={sortKey === 'paymentStatus'}
                    order={sortOrder}
                  >
                    Payment Status
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-right' />
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E1E6F7]'>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className='py-8 text-center text-sm text-[#64748B]'
                  >
                    Loading...
                  </td>
                </tr>
              ) : sortedBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className='py-8 text-center text-sm text-[#64748B]'
                  >
                    No bookings found
                  </td>
                </tr>
              ) : (
                sortedBookings.map(item => (
                  <tr key={item._id} className='hover:bg-[#F8F9FC]'>
                    <td className='py-3 px-4 text-sm text-[#64748B]'>
                      {formatDate(item.createdAt)}
                    </td>
                    <td className='py-3 px-4 text-sm font-medium text-[#1E293B]'>
                      {item.userName}
                    </td>
                    <td className='py-3 px-4 text-sm text-[#64748B]'>
                      {item.email}
                    </td>
                    <td className='py-3 px-4 text-sm text-[#64748B]'>
                      {item.phone}
                    </td>
                    <td className='py-3 px-4 text-sm text-[#64748B]'>
                      {item.passBooked}
                    </td>
                    <td className='py-3 px-4 text-sm font-medium text-[#1E293B]'>
                      {item.amount}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                          (item.paymentStatus || '').toLowerCase() ===
                          'completed'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                            : (item.paymentStatus || '').toLowerCase() ===
                              'pending'
                            ? 'border-amber-200 bg-amber-50 text-amber-600'
                            : 'border-red-200 bg-red-50 text-red-600'
                        }`}
                      >
                        {item.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className='relative py-3 px-4 text-right action-menu'>
                      <button
                        type='button'
                        onClick={() =>
                          setMenuOpenId(
                            menuOpenId === item._id ? null : item._id
                          )
                        }
                        className='rounded-lg p-2 text-[#94A3B8] hover:bg-gray-100 hover:text-[#1E293B]'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>
                      {menuOpenId === item._id && (
                        <div className='absolute right-4 top-12 z-10 w-44 rounded-lg border border-[#E1E6F7] bg-white py-1 shadow-lg'>
                          <button
                            type='button'
                            onClick={() => {
                              router.push(
                                `/weight-management-event/bookings/view/${item._id}`
                              )
                              setMenuOpenId(null)
                            }}
                            className='block w-full px-4 py-2 text-left text-sm text-[#475569] hover:bg-[#F8F9FC]'
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
