'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  User,
  Wallet,
  XCircle,
  ChevronLeft
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'
import {
  getAllOtherRecoveryServiceBookings,
  getOtherRecoveryServiceBookings
} from '@/services/v2/other-recovery-services/otherRecoveryServices.service'

const TableHeaderCell = ({ children }) => (
  <div className='flex items-center gap-1 text-xs font-medium capitalize tracking-wider text-gray-500'>
    {children}
    <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
  </div>
)

const formatAmount = val => {
  if (val == null || val === '') return '—'
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''))
  if (Number.isNaN(n)) return String(val)
  return `₦${Number(n).toLocaleString()}`
}

const formatDate = d => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/** Map API booking fields to display values (response shape: buyer, userId, recoverySessionId, recoverySlotId, etc.) */
const getBookingDisplay = b => {
  const userName = b.buyer?.fullName ?? b.userId?.name ?? b.userName ?? b.user?.name ?? '—'
  const email = b.buyer?.email ?? b.userId?.email ?? b.email ?? b.user?.email ?? '—'
  const phone = b.buyer?.phone ?? b.phoneNumber ?? b.user?.phone ?? b.phone ?? '—'
  const sessionName = b.recoverySessionId?.recoveryServiceSessionName ?? b.accessBooked ?? b.sessionName ?? b.serviceName ?? '—'
  const qty = b.quantity ?? 1
  const slot = b.recoverySlotId
    ? ` (${b.recoverySlotId.slotName ?? ''} ${b.recoverySlotId.slotTime ?? ''})`.trim()
    : ''
  const accessBooked = qty > 1 ? `${qty} x ${sessionName}${slot}` : `${sessionName}${slot}`
  const amount = b.totalAmount ?? b.pricing?.total ?? b.finalPayableAmount ?? b.amount
  const payStatus = String(b.paymentStatus ?? b.status ?? '').toLowerCase()
  const paymentLabel = payStatus === 'success' || payStatus === 'completed' || payStatus === 'paid'
    ? 'Completed'
    : payStatus === 'pending' || payStatus === 'pending payment'
      ? 'Pending'
      : b.paymentStatus ?? b.status ?? '—'
  const isPaymentSuccess = payStatus === 'success' || payStatus === 'completed' || payStatus === 'paid'
  const isPaymentPending = payStatus === 'pending' || payStatus === 'pending payment'
  return {
    userName,
    email,
    phone,
    accessBooked,
    amount,
    paymentLabel,
    isPaymentSuccess,
    isPaymentPending,
    bookedOn: b.createdAt ?? b.bookedOn ?? b.bookingDate
  }
}

export default function RecoveryServiceBookingsList ({
  serviceId = null,
  serviceName = null
}) {
  const [bookings, setBookings] = useState([])
  const [apiTotals, setApiTotals] = useState({ totalBookings: null, totalCancelledBookings: null })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const router = useRouter()

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  useEffect(() => {
    const handleClickOutside = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = serviceId
        ? await getOtherRecoveryServiceBookings(serviceId, {})
        : await getAllOtherRecoveryServiceBookings({})
      const list = res?.data ?? res?.bookings ?? (Array.isArray(res) ? res : [])
      setBookings(Array.isArray(list) ? list : [])
      setApiTotals({
        totalBookings: res?.totalBookings ?? res?.total ?? null,
        totalCancelledBookings: res?.totalCancelledBookings ?? null
      })
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
      showToast(
        err?.response?.data?.message || err?.message || 'Failed to fetch bookings',
        'error'
      )
      setBookings([])
      setApiTotals({ totalBookings: null, totalCancelledBookings: null })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [serviceId])

  const filteredBookings = bookings.filter(b => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    const d = getBookingDisplay(b)
    return d.userName.toLowerCase().includes(term) || d.email.toLowerCase().includes(term)
  })

  const totalBookingsCount =
    apiTotals.totalBookings != null && !searchTerm
      ? apiTotals.totalBookings
      : filteredBookings.length
  const revenue = filteredBookings.reduce((sum, b) => {
    const amt = b.totalAmount ?? b.pricing?.total ?? b.amount ?? 0
    return sum + (typeof amt === 'number' ? amt : parseFloat(String(amt).replace(/[^0-9.]/g, '')) || 0)
  }, 0)
  const cancelledCount =
    apiTotals.totalCancelledBookings != null && !searchTerm
      ? apiTotals.totalCancelledBookings
      : filteredBookings.filter(
          b =>
            String(b.paymentStatus ?? b.status ?? '').toLowerCase() === 'cancelled' ||
            String(b.bookingStatus ?? '').toLowerCase() === 'cancelled'
        ).length
  const cancelledRevenue = filteredBookings
    .filter(
      b =>
        String(b.paymentStatus ?? b.status ?? '').toLowerCase() === 'cancelled' ||
        String(b.bookingStatus ?? '').toLowerCase() === 'cancelled'
    )
    .reduce((sum, b) => {
      const amt = b.totalAmount ?? b.pricing?.total ?? b.amount ?? 0
      return sum + (typeof amt === 'number' ? amt : parseFloat(String(amt).replace(/[^0-9.]/g, '')) || 0)
    }, 0)

  const toggleDropdown = (e, id) => {
    e.stopPropagation()
    if (activeDropdown === id) {
      setActiveDropdown(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom, right: window.innerWidth - rect.right })
      setActiveDropdown(id)
    }
  }

  const handleExport = () => {
    if (filteredBookings.length === 0) {
      showToast('No data to export', 'error')
      return
    }
    const headers = [
      'Booked On',
      'User Name',
      'Email Id',
      'Phone Number',
      'Access Booked',
      'Amount',
      'Payment Status'
    ]
    const rows = filteredBookings.map(b => {
      const d = getBookingDisplay(b)
      return [
        formatDate(d.bookedOn),
        d.userName,
        d.email,
        d.phone,
        d.accessBooked,
        formatAmount(d.amount),
        d.paymentLabel
      ]
    })
    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `recovery-bookings-${serviceId || 'all'}-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    showToast('Export started', 'success')
  }

  const subtitle = serviceName || (serviceId ? 'Recovery Service' : 'All Services')

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <Toast
        open={toast.show}
        onOpenChange={val => setToast(prev => ({ ...prev, show: val }))}
        title={toast.type === 'error' ? 'Error' : 'Success'}
        description={toast.message}
        variant={toast.type}
      />

      {/* Header */}
      <div className='mb-6'>
        <button
          type='button'
          onClick={() => router.back()}
          className='mb-2 flex items-center gap-1 text-xs font-medium text-[#8A92AC] hover:text-[#2D3658] transition-colors'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <h1 className='text-2xl font-bold text-[#1E293B]'>
          Recovery Service Bookings
          {subtitle && (
            <span className='ml-1 text-[#FF5B2C]'>({subtitle})</span>
          )}
        </h1>
        <nav className='mt-1 text-sm text-[#64748B]'>
          <Link href='/dashboard' className='hover:text-[#1E293B]'>
            Dashboard
          </Link>
          <span className='mx-2'>/</span>
          <span className='text-[#1E293B]'>Bookings</span>
        </nav>
      </div>

      {/* Overview cards */}
      <div className='mb-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='rounded-2xl border border-[#E1E6F7] bg-[#F3E8FF] p-5 shadow-sm'>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl bg-white p-3'>
              <User className='h-6 w-6 text-purple-600' />
            </div>
            <div>
              <p className='text-xs font-medium text-[#64748B]'>Total Bookings</p>
              <p className='text-xl font-bold text-[#1E293B]'>{totalBookingsCount}</p>
            </div>
          </div>
        </div>
        <div className='rounded-2xl border border-[#E1E6F7] bg-[#E0F2F1] p-5 shadow-sm'>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl bg-white p-3'>
              <Wallet className='h-6 w-6 text-teal-600' />
            </div>
            <div>
              <p className='text-xs font-medium text-[#64748B]'>Revenue</p>
              <p className='text-xl font-bold text-[#1E293B]'>
                {formatAmount(revenue)}
              </p>
            </div>
          </div>
        </div>
        <div className='rounded-2xl border border-[#E1E6F7] bg-[#FCE4EC] p-5 shadow-sm'>
          <div className='flex items-center gap-3'>
            <div className='rounded-xl bg-white p-3'>
              <XCircle className='h-6 w-6 text-pink-600' />
            </div>
            <div>
              <p className='text-xs font-medium text-[#64748B]'>
                Cancelled Bookings
              </p>
              <p className='text-xl font-bold text-[#1E293B]'>
                {cancelledCount}
                {cancelledRevenue > 0 && (
                  <span className='font-normal text-[#64748B]'>
                    ({formatAmount(cancelledRevenue)})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking List */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <h2 className='text-lg font-bold text-[#1E293B]'>Booking List</h2>
          <div className='flex gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-[280px] rounded-lg border border-[#E2E8F0] pl-10 pr-4 text-sm focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C]'
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
              onClick={handleExport}
              className='flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
            >
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-[#E1E6F7] bg-[#F8F9FC]'>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Booked On</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>User Name</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Email Id</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Phone Number</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Access Booked</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Amount</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Payment Status</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-right' />
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E1E6F7]'>
              {loading ? (
                <tr>
                  <td colSpan='8' className='py-8 text-center text-[#64748B]'>
                    Loading bookings...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan='8' className='py-8 text-center text-[#64748B]'>
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map(b => {
                  const d = getBookingDisplay(b)
                  return (
                    <tr key={b._id || b.id} className='hover:bg-[#F8F9FC]'>
                      <td className='py-3 px-4 text-sm text-[#64748B]'>
                        {formatDate(d.bookedOn)}
                      </td>
                      <td className='py-3 px-4 text-sm font-medium text-[#1E293B]'>
                        {d.userName}
                      </td>
                      <td className='py-3 px-4 text-sm text-[#64748B]'>
                        {d.email}
                      </td>
                      <td className='py-3 px-4 text-sm text-[#64748B]'>
                        {d.phone}
                      </td>
                      <td className='py-3 px-4 text-sm text-[#64748B]'>
                        {d.accessBooked}
                      </td>
                      <td className='py-3 px-4 text-sm text-[#1E293B]'>
                        {formatAmount(d.amount)}
                      </td>
                      <td className='py-3 px-4'>
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${
                            d.isPaymentSuccess
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                              : d.isPaymentPending
                                ? 'border-amber-200 bg-amber-50 text-amber-600'
                                : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        >
                          {d.paymentLabel}
                        </span>
                      </td>
                      <td className='py-3 px-4 text-right'>
                        <button
                          type='button'
                          onClick={e => toggleDropdown(e, b._id || b.id)}
                          className='rounded-lg p-2 text-[#94A3B8] hover:bg-gray-100 hover:text-[#1E293B]'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row dropdown - placeholder for View Details / future actions */}
      {activeDropdown && (
        <div
          ref={dropdownRef}
          className='fixed z-50 w-44 rounded-xl border border-[#E1E6F7] bg-white p-1.5 shadow-lg text-left'
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          <Link
            href={
              serviceId
                ? `/other-recovery-services/bookings/${serviceId}/${activeDropdown}`
                : `/other-recovery-services/bookings/details/${activeDropdown}`
            }
            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
          >
            View Details
          </Link>
        </div>
      )}
    </div>
  )
}
