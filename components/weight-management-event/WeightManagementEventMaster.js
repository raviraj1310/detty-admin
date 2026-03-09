'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Wallet,
  XCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'

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

const INITIAL_METRICS = [
  {
    id: 'total-events',
    title: 'Total Events',
    value: '0',
    icon: Calendar,
    bg: 'bg-[#E8EEFF]',
    textColor: 'text-indigo-600',
    iconBg: 'bg-white'
  },
  {
    id: 'done-events',
    title: 'Done Events',
    value: '0',
    icon: CheckCircle,
    bg: 'bg-[#E8F8F0]',
    textColor: 'text-emerald-600',
    iconBg: 'bg-white'
  },
  {
    id: 'ongoing-events',
    title: 'Ongoing Events',
    value: '0',
    icon: Clock,
    bg: 'bg-[#FFF4E6]',
    textColor: 'text-amber-600',
    iconBg: 'bg-white'
  },
  {
    id: 'upcoming-events',
    title: 'Upcoming Events',
    value: '0',
    icon: AlertCircle,
    bg: 'bg-[#FFE8E8]',
    textColor: 'text-red-600',
    iconBg: 'bg-white'
  },
  {
    id: 'total-bookings',
    title: 'Total Bookings',
    value: '0',
    icon: User,
    bg: 'bg-[#F3E8FF]',
    textColor: 'text-purple-600',
    iconBg: 'bg-white'
  },
  {
    id: 'revenue',
    title: 'Revenue',
    value: '₦0',
    icon: Wallet,
    bg: 'bg-[#E0F2F1]',
    textColor: 'text-teal-700',
    iconBg: 'bg-white'
  },
  {
    id: 'cancelled-bookings',
    title: 'Cancelled Bookings',
    value: '0',
    icon: XCircle,
    bg: 'bg-[#FCE4EC]',
    textColor: 'text-pink-600',
    iconBg: 'bg-white'
  }
]

const MOCK_LIST = [
  {
    _id: '1',
    createdAt: '2025-06-12T10:00:00.000Z',
    eventName: 'Everyday Nutrition Workshop',
    image: '/images/no-image.webp',
    hostedBy: 'Tunde Adeyemi',
    location: 'Ikoyi, Lagos',
    totalBookings: 100,
    status: 'done'
  },
  {
    _id: '2',
    createdAt: '2025-06-11T14:30:00.000Z',
    eventName: 'Mindful Eating Session',
    image: '/images/no-image.webp',
    hostedBy: 'Tunde Adeyemi',
    location: 'Ikoyi, Lagos',
    totalBookings: 100,
    status: 'upcoming'
  },
  {
    _id: '3',
    createdAt: '2025-06-10T09:00:00.000Z',
    eventName: 'Lifestyle Nutrition Talk',
    image: '/images/no-image.webp',
    hostedBy: 'Tunde Adeyemi',
    location: 'Ikoyi, Lagos',
    totalBookings: 100,
    status: 'done'
  }
]

const TableHeaderCell = ({
  children,
  align = 'left',
  onClick,
  active = false,
  direction = 'asc'
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium capitalize tracking-wider ${
      active ? 'text-gray-700' : 'text-gray-500'
    } ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } hover:text-gray-700 w-full`}
  >
    {children}
    {active ? (
      direction === 'asc' ? (
        <ChevronUp className='h-3.5 w-3.5 text-[#2D3658]' />
      ) : (
        <ChevronDown className='h-3.5 w-3.5 text-[#2D3658]' />
      )
    ) : (
      <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
    )}
  </button>
)

export default function WeightManagementEventMaster () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPos, setDropdownPos] = useState({})
  const dropdownRef = useRef(null)
  const filterRef = useRef(null)

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [metrics, setMetrics] = useState(INITIAL_METRICS)
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setList(MOCK_LIST)
      const newMetrics = [...INITIAL_METRICS]
      newMetrics[0].value = '1155'
      newMetrics[1].value = '1137'
      newMetrics[2].value = '1137'
      newMetrics[3].value = '299'
      newMetrics[4].value = '1155'
      newMetrics[5].value = '865(₦10,00,000)'
      newMetrics[6].value = '299(₦2,00,000)'
      setMetrics(newMetrics)
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false)
      }
    }
    const handleScroll = () => {
      setActiveDropdown(null)
      setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const handleDropdownClick = (e, id) => {
    e.stopPropagation()
    if (activeDropdown === id) {
      setActiveDropdown(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
      setActiveDropdown(id)
    }
  }

  const getStatusDisplay = status => {
    const s = String(status || '').toLowerCase()
    if (s === 'done') {
      return {
        label: 'Done',
        className: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
      }
    }
    if (s === 'upcoming') {
      return {
        label: 'Upcoming',
        className: 'bg-amber-50 text-amber-600 border border-amber-200'
      }
    }
    if (s === 'ongoing') {
      return {
        label: 'Ongoing',
        className: 'bg-sky-50 text-sky-600 border border-sky-200'
      }
    }
    return {
      label: status || '—',
      className: 'bg-gray-50 text-gray-600 border border-gray-200'
    }
  }

  const getSortValue = (item, key) => {
    switch (key) {
      case 'addedOn':
        return new Date(item.createdAt || 0).getTime()
      case 'eventName':
        return (item.eventName || '').toLowerCase()
      case 'hostedBy':
        return (item.hostedBy || '').toLowerCase()
      case 'location':
        return (item.location || '').toLowerCase()
      case 'bookings':
        return item.totalBookings ?? 0
      case 'status':
        return (item.status || '').toLowerCase()
      default:
        return ''
    }
  }

  const handleSort = key => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return list
    return list.filter(
      item =>
        (item.eventName || '').toLowerCase().includes(term) ||
        (item.hostedBy || '').toLowerCase().includes(term) ||
        (item.location || '').toLowerCase().includes(term)
    )
  }, [list, searchTerm])

  const statusFilteredList = useMemo(() => {
    if (!statusFilter) return filteredList
    return filteredList.filter(item => String(item.status || '').toLowerCase() === statusFilter)
  }, [filteredList, statusFilter])

  const sortedList = useMemo(() => {
    const arr = [...statusFilteredList]
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc'
          ? va.localeCompare(vb)
          : vb.localeCompare(va)
      }
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [statusFilteredList, sortKey, sortOrder])

  const handleDelete = id => {
    setDeleteId(id)
    setConfirmOpen(true)
    setActiveDropdown(null)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      setList(prev => prev.filter(item => item._id !== deleteId))
      showToast('Deleted', 'Weight management event has been deleted')
    } catch (err) {
      showToast('Error', 'Failed to delete', 'destructive')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  return (
    <div className='space-y-6 py-4 px-6'>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title={toastProps.title}
        description={toastProps.description}
        variant={toastProps.variant}
        duration={3000}
        position='top-right'
      />

      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>
            Weight Management Events Master
          </h1>
          <p className='text-xs text-[#99A1BC]'>
            Dashboard / Weight Management Events Master
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2 md:justify-end'>
          <button
            onClick={() => router.push('/weight-management-event/bookings')}
            className='rounded-lg border border-[#FF5B2C] bg-white px-4 py-2 text-xs font-medium text-[#FF5B2C] shadow-sm transition hover:bg-[#FFF5F2]'
          >
            View All Bookings
          </button>
          <button
            onClick={() => router.push('/weight-management-event/add')}
            className='rounded-lg bg-[#FF5B2C] px-4 py-2 text-xs font-semibold cursor-pointer text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A]'
          >
            Add New
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {metrics.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.id}
              className={`relative overflow-hidden rounded-2xl border border-white/60 p-4 shadow-sm ${card.bg}`}
            >
              <div className='flex items-center justify-between gap-3'>
                <div className={`rounded-xl p-2.5 ${card.iconBg} shadow-sm`}>
                  <Icon className={`h-5 w-5 ${card.textColor}`} strokeWidth={2.2} />
                </div>
                <div className='text-right min-w-0'>
                  <p className={`text-xs font-medium ${card.textColor} truncate`}>
                    {card.title}
                  </p>
                  <h3 className={`mt-1 text-lg font-bold ${card.textColor} truncate`}>
                    {card.value}
                  </h3>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className='rounded-xl border border-[#E5E6EF] bg-white p-4 shadow-sm'>
        <div className='mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-base font-semibold text-slate-900'>
            Weight Management Events List
          </h2>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-9 w-full rounded-lg border border-[#E5E6EF] bg-white pl-9 pr-4 text-xs text-slate-900 placeholder:text-gray-400 focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C] md:w-64'
              />
            </div>
            <div className='relative' ref={filterRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium hover:bg-gray-50 ${
                  filterOpen || statusFilter
                    ? 'border-[#FF5B2C] text-[#FF5B2C] bg-[#FFF5F2]'
                    : 'border-[#E5E6EF] bg-white text-slate-700'
                }`}
              >
                Filters
                <IoFilterSharp className='h-3.5 w-3.5' />
              </button>
              {filterOpen && (
                <div className='absolute right-0 top-10 z-50 w-48 rounded-lg border border-[#E5E6EF] bg-white p-1 shadow-lg'>
                  <div className='px-3 py-2 text-xs font-semibold text-gray-500'>
                    Filter by Status
                  </div>
                  <button
                    onClick={() => {
                      setStatusFilter('done')
                      setFilterOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-md ${
                      statusFilter === 'done' ? 'text-[#FF5B2C] bg-[#FFF5F2]' : 'text-slate-700'
                    }`}
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('ongoing')
                      setFilterOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-md ${
                      statusFilter === 'ongoing' ? 'text-[#FF5B2C] bg-[#FFF5F2]' : 'text-slate-700'
                    }`}
                  >
                    Ongoing
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('upcoming')
                      setFilterOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-md ${
                      statusFilter === 'upcoming' ? 'text-[#FF5B2C] bg-[#FFF5F2]' : 'text-slate-700'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('')
                      setFilterOpen(false)
                    }}
                    className='flex w-full items-center px-3 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50 rounded-md'
                  >
                    All
                  </button>
                </div>
              )}
            </div>
            <button
              type='button'
              className='flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E6EF] bg-white text-slate-700 hover:bg-gray-50'
            >
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-[800px] border-collapse'>
            <thead>
              <tr className='border-b border-[#E5E6EF] bg-gray-50/50'>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('addedOn')}
                    active={sortKey === 'addedOn'}
                    direction={sortOrder}
                  >
                    Added On
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('eventName')}
                    active={sortKey === 'eventName'}
                    direction={sortOrder}
                  >
                    Events Name
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('hostedBy')}
                    active={sortKey === 'hostedBy'}
                    direction={sortOrder}
                  >
                    Hosted By
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('location')}
                    active={sortKey === 'location'}
                    direction={sortOrder}
                  >
                    Location
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('bookings')}
                    active={sortKey === 'bookings'}
                    direction={sortOrder}
                  >
                    Bookings
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('status')}
                    active={sortKey === 'status'}
                    direction={sortOrder}
                  >
                    Status
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-right' />
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E5E6EF]'>
              {loading ? (
                <tr>
                  <td colSpan='7' className='py-8 text-center text-gray-500'>
                    Loading...
                  </td>
                </tr>
              ) : sortedList.length === 0 ? (
                <tr>
                  <td colSpan='7' className='py-8 text-center text-gray-500'>
                    No weight management events found
                  </td>
                </tr>
              ) : (
                sortedList.map(item => {
                  const statusDisplay = getStatusDisplay(item.status)
                  return (
                    <tr key={item._id} className='group hover:bg-gray-50'>
                      <td className='py-3 px-4 text-xs text-gray-500'>
                        {formatDate(item.createdAt)}
                      </td>
                      <td className='py-3 px-4'>
                        <div className='flex items-center gap-3'>
                          <div className='h-10 w-10 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200 shrink-0'>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image || '/images/no-image.webp'}
                              alt={item.eventName || 'Event'}
                              className='h-full w-full object-cover'
                              onError={e => {
                                e.currentTarget.src = '/images/no-image.webp'
                              }}
                            />
                          </div>
                          <div className='min-w-0'>
                            <div className='truncate text-xs font-semibold text-slate-900'>
                              {item.eventName || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='py-3 px-4 text-xs text-gray-600'>
                        {item.hostedBy || '—'}
                      </td>
                      <td className='py-3 px-4 text-xs text-gray-500'>
                        {item.location || '—'}
                      </td>
                      <td className='py-3 px-4'>
                        <button
                          type='button'
                          onClick={() =>
                            router.push(`/weight-management-event/bookings/${item._id}`)
                          }
                          className='flex items-center gap-1 text-xs cursor-pointer font-semibold text-indigo-600 underline'
                        >
                          {item.totalBookings ?? 0} (View List)
                        </button>
                      </td>
                      <td className='py-3 px-4'>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusDisplay.className}`}
                        >
                          <span
                            className={`mr-1 h-1.5 w-1.5 rounded-full ${
                              item.status === 'done'
                                ? 'bg-emerald-500'
                                : item.status === 'upcoming'
                                  ? 'bg-amber-500'
                                  : 'bg-sky-500'
                            }`}
                          />
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className='relative py-3 px-4 text-right'>
                        <button
                          onClick={e => handleDropdownClick(e, item._id)}
                          className='rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                        {activeDropdown === item._id && (
                          <div
                            ref={dropdownRef}
                            style={{
                              position: 'fixed',
                              top: `${dropdownPos.top}px`,
                              right: `${dropdownPos.right}px`,
                              zIndex: 50
                            }}
                            className='w-48 rounded-lg border border-[#E5E6EF] bg-white py-1 shadow-lg'
                          >
                            <button
                              onClick={() => {
                                router.push(`/weight-management-event/edit/${item._id}`)
                                setActiveDropdown(null)
                              }}
                              className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                            >
                              View/Edit Detail
                            </button>
                            <div className='my-1 h-px bg-gray-100' />
                            <button
                              onClick={() => {
                                router.push(`/weight-management-event/bookings/${item._id}`)
                                setActiveDropdown(null)
                              }}
                              className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                            >
                              View Bookings
                            </button>
                            <div className='my-1 h-px bg-gray-100' />
                            <button
                              onClick={() => {
                                router.push(`/weight-management-event/event-pass/${item._id}`)
                                setActiveDropdown(null)
                              }}
                              className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                            >
                              View/Edit Session
                            </button>
                            <div className='my-1 h-px bg-gray-100' />
                            <button
                              onClick={() => handleDelete(item._id)}
                              className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-red-600 hover:bg-gray-50'
                            >
                              Delete
                            </button>
                            <div className='my-1 h-px bg-gray-100' />
                            <button
                              onClick={() => {
                                setList(prev =>
                                  prev.map(i =>
                                    i._id === item._id ? { ...i, isActive: true } : i
                                  )
                                )
                                setActiveDropdown(null)
                              }}
                              className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                            >
                              Active
                            </button>
                            <button
                              onClick={() => {
                                setList(prev =>
                                  prev.map(i =>
                                    i._id === item._id ? { ...i, isActive: false } : i
                                  )
                                )
                                setActiveDropdown(null)
                              }}
                              className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                            >
                              Inactive
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmOpen && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!deleting) setConfirmOpen(false)
            }}
          />
          <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-3'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-lg font-semibold text-slate-900'>
                  Delete this weight management event?
                </div>
                <div className='mt-1 text-sm text-[#5E6582]'>
                  This action cannot be undone.
                </div>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  if (!deleting) setConfirmOpen(false)
                }}
                disabled={deleting}
                className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {deleting ? (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
