'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  User,
  Wallet,
  XCircle,
  CheckCircle,
  MinusCircle,
  UtensilsCrossed,
  ChevronLeft
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'
import { getAllFoodPrescriptionBookings } from '@/services/nutrition/nutrition.service'

const formatDate = dateString => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
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
  const buyer = api?.buyerInfo || {}
  const user = api?.userId || {}
  const access = api?.foodPrescriptionsAccessId || {}
  const pricing = api?.pricing || {}

  const pay = String(api?.paymentStatus || '').toLowerCase()
  const bookingStatus = String(api?.status || '').toLowerCase()

  const accessName = access?.accessName || '—'
  const accessPrice =
    access?.price ??
    pricing?.total ??
    api?.finalPayableAmount ??
    api?.totalAmount

  const accessBooked =
    accessName && accessPrice != null
      ? `${accessName} (${formatCurrency(accessPrice)})`
      : accessName

  const paymentStatus =
    pay === 'success' || pay === 'completed'
      ? 'Success'
      : bookingStatus === 'cancelled' || bookingStatus === 'canceled'
      ? 'Cancelled'
      : 'Pending'

  return {
    _id: api?._id,
    createdAt: api?.createdAt || api?.bookingDate,
    userName: buyer?.name || user?.name || '—',
    email: buyer?.email || user?.email || '—',
    phone:
      buyer?.contactNo || buyer?.phone || api?.phoneNumber || api?.phone || '—',
    accessBooked,
    amount: formatCurrency(
      api?.finalPayableAmount ?? pricing?.total ?? api?.totalAmount ?? 0
    ),
    paymentStatus
  }
}

export default function FoodPrescriptionBookingsAll () {
  const router = useRouter()
  const [toastOpen, setToastOpen] = useState(false)
  const [toastProps, setToastProps] = useState({
    title: '',
    description: '',
    variant: 'success'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [bookings, setBookings] = useState([])
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    revenue: formatCurrency(0),
    cancelledBookings: 0
  })
  const [sortKey, setSortKey] = useState('bookedOn')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const params = {
          search: searchTerm?.trim() || undefined
        }
        const res = await getAllFoodPrescriptionBookings(1, 10, params)
        if (!res?.success) {
          setBookings([])
          setMetrics({
            totalBookings: 0,
            completedBookings: 0,
            pendingBookings: 0,
            revenue: formatCurrency(0),
            cancelledBookings: 0
          })
          setToastProps({
            title: 'Error',
            description: res?.message || 'Failed to fetch bookings',
            variant: 'error'
          })
          setToastOpen(true)
          return
        }

        const list = Array.isArray(res?.data) ? res.data : []
        const mapped = list.map(mapBookingFromApi)
        setBookings(mapped)

        const stats = res?.stats || {}
        const totalBookings = Number(stats?.totalBookings || mapped.length || 0)
        const completedBookings = Number(stats?.completedBookings || 0)
        const cancelBookings = Number(stats?.cancelBookings || 0)
        const pendingBookings = Math.max(
          0,
          totalBookings - completedBookings - cancelBookings
        )

        setMetrics({
          totalBookings,
          completedBookings,
          pendingBookings,
          revenue: formatCurrency(stats?.totalRevenue || 0),
          cancelledBookings: cancelBookings
        })
      } catch (err) {
        setBookings([])
        setToastProps({
          title: 'Error',
          description:
            err?.response?.data?.message ||
            err?.message ||
            'Failed to fetch bookings',
          variant: 'error'
        })
        setToastOpen(true)
      }
    }
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm])

  // toast state moved above

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

  const filteredBookings = searchTerm.trim()
    ? bookings.filter(
        b =>
          (b.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (b.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : bookings

  const sortedBookings = [...filteredBookings].sort((a, b) => {
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
      case 'amount':
        va = parseFloat((a.amount || '0').replace(/[^0-9.]/g, '')) || 0
        vb = parseFloat((b.amount || '0').replace(/[^0-9.]/g, '')) || 0
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

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title={toastProps.title}
        description={toastProps.description}
        variant={toastProps.variant}
        duration={3000}
        position='top-right'
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
          Food Prescription Bookings
        </h1>
        <p className='mt-1 text-sm text-[#64748B]'>Dashboard / Bookings</p>
      </div>

      <div className='mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <div className='flex items-center justify-between rounded-2xl bg-[#E8EEFF] p-4'>
          <div>
            <p className='text-xs font-medium text-indigo-600'>
              Total Bookings
            </p>
            <p className='text-xl font-bold text-indigo-600'>
              {metrics.totalBookings}
            </p>
          </div>
          <div className='rounded-full bg-white p-2.5'>
            <UtensilsCrossed className='h-5 w-5 text-indigo-600' />
          </div>
        </div>
        <div className='flex items-center justify-between rounded-2xl bg-[#E8F8F0] p-4'>
          <div>
            <p className='text-xs font-medium text-emerald-600'>
              Completed Bookings
            </p>
            <p className='text-xl font-bold text-emerald-600'>
              {metrics.completedBookings}
            </p>
          </div>
          <div className='rounded-full bg-white p-2.5'>
            <CheckCircle className='h-5 w-5 text-emerald-600' />
          </div>
        </div>
        <div className='flex items-center justify-between rounded-2xl bg-[#FFE8E8] p-4'>
          <div>
            <p className='text-xs font-medium text-red-600'>Pending Bookings</p>
            <p className='text-xl font-bold text-red-600'>
              {metrics.pendingBookings}
            </p>
          </div>
          <div className='rounded-full bg-white p-2.5'>
            <MinusCircle className='h-5 w-5 text-red-600' />
          </div>
        </div>
      </div>

      <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <div className='flex items-center justify-between rounded-2xl bg-[#F3E8FF] p-4'>
          <div>
            <p className='text-xs font-medium text-purple-600'>
              Total Bookings
            </p>
            <p className='text-xl font-bold text-purple-600'>
              {metrics.totalBookings}
            </p>
          </div>
          <div className='rounded-full bg-white p-2.5'>
            <User className='h-5 w-5 text-purple-600' />
          </div>
        </div>
        <div className='flex items-center justify-between rounded-2xl bg-[#E0F2F1] p-4'>
          <div>
            <p className='text-xs font-medium text-teal-700'>Revenue</p>
            <p className='text-xl font-bold text-teal-700'>{metrics.revenue}</p>
          </div>
          <div className='rounded-full bg-white p-2.5'>
            <Wallet className='h-5 w-5 text-teal-700' />
          </div>
        </div>
        <div className='flex items-center justify-between rounded-2xl bg-[#FCE4EC] p-4'>
          <div>
            <p className='text-xs font-medium text-pink-600'>
              Cancelled Bookings
            </p>
            <p className='text-xl font-bold text-pink-600'>
              {metrics.cancelledBookings}
            </p>
          </div>
          <div className='rounded-full bg-white p-2.5'>
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
                className='h-10 w-[260px] rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm placeholder:text-[#94A3B8] focus:border-[#FF4400] focus:outline-none'
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
              className='flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
            >
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
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
                  <TableHeaderCell>Email Id</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Phone Number</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Access Booked</TableHeaderCell>
                </th>
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
              {sortedBookings.length === 0 ? (
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
                      {item.accessBooked}
                    </td>
                    <td className='py-3 px-4 text-sm font-medium text-[#1E293B]'>
                      {item.amount}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          (item.paymentStatus || '').toLowerCase() ===
                          'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : (item.paymentStatus || '').toLowerCase() ===
                              'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : (item.paymentStatus || '').toLowerCase() ===
                              'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
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
                                `/food-prescription/bookings/view/${item._id}`
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
