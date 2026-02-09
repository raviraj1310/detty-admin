'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Search,
  Download,
  MoreVertical,
  Dumbbell,
  CheckCircle,
  MinusCircle,
  User,
  Wallet,
  XCircle,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getAllGyms,
  deleteGym,
  activeInactiveGym
} from '@/services/v2/gym/gym.service'
import { formatDate } from '@/utils/helper'
import Toast from '@/components/ui/Toast'

const getGymImageUrl = imagePath => {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL2 ||
    process.env.NEXT_PUBLIC_API_BASE_URL
  if (!baseUrl) return `/upload/image/${imagePath}`

  try {
    const { origin } = new URL(baseUrl)
    return `${origin}/upload/image/${imagePath}`
  } catch {
    return `/upload/image/${imagePath}`
  }
}

const INITIAL_METRICS = [
  {
    id: 'total-gym',
    title: 'Total Gym',
    value: '0',
    icon: Dumbbell,
    bg: 'bg-[#E8EEFF]',
    textColor: 'text-indigo-600',
    iconBg: 'bg-white'
  },
  {
    id: 'active-gym',
    title: 'Active Gym',
    value: '0',
    icon: CheckCircle,
    bg: 'bg-[#E8F8F0]',
    textColor: 'text-emerald-600',
    iconBg: 'bg-white'
  },
  {
    id: 'inactive-gym',
    title: 'Inactive Gym',
    value: '0',
    icon: MinusCircle,
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
    value: '0(₦0)',
    icon: Wallet,
    bg: 'bg-[#E0F2F1]',
    textColor: 'text-teal-700',
    iconBg: 'bg-white'
  },
  {
    id: 'cancelled',
    title: 'Cancelled Bookings',
    value: '0(₦0)',
    icon: XCircle,
    bg: 'bg-[#FCE4EC]',
    textColor: 'text-pink-600',
    iconBg: 'bg-white'
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
    } hover:text-gray-700`}
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

export default function GymAccessMaster () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPos, setDropdownPos] = useState({})
  const dropdownRef = useRef(null)
  const filterRef = useRef(null)

  const [gyms, setGyms] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalDocs: 0,
    totalPages: 1
  })
  const [statusFilter, setStatusFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [metrics, setMetrics] = useState(INITIAL_METRICS)

  // Toast & Alert State
  const [toastOpen, setToastOpen] = useState(false)
  const [toastProps, setToastProps] = useState({
    title: '',
    description: '',
    variant: 'success'
  })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const showToast = (title, description, variant = 'success') => {
    setToastProps({ title, description, variant })
    setToastOpen(true)
  }

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset page when filter or search changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    fetchGyms()
  }, [pagination.page, debouncedSearch, statusFilter])

  const fetchGyms = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter) params.status = statusFilter

      const response = await getAllGyms(
        pagination.page,
        pagination.limit,
        params
      )

      if (response.success) {
        setGyms(response.data.gyms)
        setPagination(response.data.pagination)

        // Update metrics
        const newMetrics = [...metrics]
        newMetrics[0].value = response.data.totalGyms || 0
        newMetrics[1].value = response.data.activeGyms || 0
        newMetrics[2].value = response.data.inactiveGyms || 0
        // Keeping others as 0 or placeholders since API doesn't provide them yet
        setMetrics(newMetrics)
      }
    } catch (error) {
      console.error('Failed to fetch gyms:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleEditGymAccess = id => {
    router.push(`/gym/gym-access/${id}`)
  }

  const getStatusColor = status => {
    if (status)
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    return 'bg-red-50 text-red-600 border border-red-200'
  }

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleDeleteGym = id => {
    setDeleteId(id)
    setConfirmOpen(true)
    setActiveDropdown(null)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await deleteGym(deleteId)
      if (res && res.success) {
        showToast('Gym deleted', 'The gym has been successfully deleted')
        fetchGyms()
      } else {
        showToast(
          'Error',
          res?.message || 'Failed to delete gym',
          'destructive'
        )
      }
    } catch (error) {
      console.error('Failed to delete gym:', error)
      showToast('Error', 'Failed to delete gym', 'destructive')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      const res = await activeInactiveGym(id, { status })
      if (res && res.success) {
        showToast(
          'Status updated',
          `Gym is now ${status ? 'Active' : 'Inactive'}`
        )
        fetchGyms()
      } else {
        showToast(
          'Error',
          res?.message || 'Failed to update status',
          'destructive'
        )
      }
    } catch (error) {
      console.error('Failed to update gym status:', error)
      showToast('Error', 'Failed to update gym status', 'destructive')
    }
    setActiveDropdown(null)
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
      {/* Header Section */}
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>Gym Master</h1>
          <p className='text-xs text-[#99A1BC]'>Dashboard / Gym Master</p>
        </div>
        <div className='flex flex-wrap items-center gap-2 md:justify-end'>
          <button
            onClick={() => {
              router.push('/gym/bookings')
            }}
            className='rounded-lg border border-[#FF5B2C] bg-white px-4 py-2 text-xs font-medium text-[#FF5B2C] shadow-sm transition hover:bg-[#FFF5F2]'
          >
            View All Bookings
          </button>
          <button
            onClick={() => router.push('/gym/add')}
            className='rounded-lg bg-[#FF5B2C] px-4 py-2 text-xs font-semibold cursor-pointer text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A]'
          >
            Add New
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {metrics.map(card => {
          const Icon = card.icon
          return (
            <div
              key={card.id}
              className={`relative overflow-hidden rounded-xl p-4 ${card.bg}`}
            >
              <div className='flex items-center justify-between'>
                <div className={`rounded-full p-2 ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
                <div className='text-right'>
                  <p className={`text-xs font-medium ${card.textColor}`}>
                    {card.title}
                  </p>
                  <h3 className={`mt-1 text-xl font-bold ${card.textColor}`}>
                    {card.value}
                  </h3>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Table Section */}
      <div className='rounded-xl border border-[#E5E6EF] bg-white p-4 shadow-sm'>
        {/* Table Toolbar */}
        <div className='mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-base font-semibold text-slate-900'>Gym List</h2>
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
                      setStatusFilter('')
                      setFilterOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-md ${
                      statusFilter === ''
                        ? 'text-[#FF5B2C] bg-[#FFF5F2]'
                        : 'text-slate-700'
                    }`}
                  >
                    All Status
                    {statusFilter === '' && (
                      <CheckCircle className='h-3.5 w-3.5' />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('true')
                      setFilterOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-md ${
                      statusFilter === 'true'
                        ? 'text-[#FF5B2C] bg-[#FFF5F2]'
                        : 'text-slate-700'
                    }`}
                  >
                    Active
                    {statusFilter === 'true' && (
                      <CheckCircle className='h-3.5 w-3.5' />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('false')
                      setFilterOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-xs font-medium hover:bg-gray-50 rounded-md ${
                      statusFilter === 'false'
                        ? 'text-[#FF5B2C] bg-[#FFF5F2]'
                        : 'text-slate-700'
                    }`}
                  >
                    Inactive
                    {statusFilter === 'false' && (
                      <CheckCircle className='h-3.5 w-3.5' />
                    )}
                  </button>
                </div>
              )}
            </div>
            <button className='flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E6EF] bg-white text-slate-700 hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[800px] border-collapse'>
            <thead>
              <tr className='border-b border-[#E5E6EF] bg-gray-50/50'>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Added On</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Gym Name</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Location</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Bookings</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell>Status</TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-right'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E5E6EF]'>
              {loading ? (
                <tr>
                  <td colSpan='6' className='py-8 text-center text-gray-500'>
                    Loading gyms...
                  </td>
                </tr>
              ) : gyms.length === 0 ? (
                <tr>
                  <td colSpan='6' className='py-8 text-center text-gray-500'>
                    No gyms found
                  </td>
                </tr>
              ) : (
                gyms.map(gym => (
                  <tr key={gym._id} className='group hover:bg-gray-50'>
                    <td className='py-3 px-4 text-xs text-gray-500'>
                      {formatDate(gym.createdAt)}
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-3'>
                        <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100'>
                          {/* Use a placeholder div if image fails, or Next Image */}
                          {gym.image ? (
                            <img
                              src={getGymImageUrl(gym.image)}
                              alt={gym.gymName}
                              className='h-full w-full object-cover'
                              onError={e => {
                                e.target.onerror = null
                                e.target.src =
                                  'https://placehold.co/40x40?text=IMG'
                              }}
                            />
                          ) : (
                            <div className='flex h-full w-full items-center justify-center bg-slate-200 text-xs font-medium text-slate-500'>
                              IMG
                            </div>
                          )}
                        </div>
                        <span className='text-xs font-medium text-slate-900'>
                          {gym.gymName}
                        </span>
                      </div>
                    </td>
                    <td className='py-3 px-4 text-xs text-gray-500'>
                      {gym.location}
                    </td>
                    <td className='py-3 px-4'>
                      <div
                        className='flex items-center gap-1 text-xs cursor-pointer'
                        onClick={() => router.push(`/gym/bookings/${gym._id}`)}
                      >
                        <span className='font-semibold text-indigo-600 underline'>
                          0
                        </span>
                        <span className='font-medium text-indigo-600'>
                          (View List)
                        </span>
                      </div>
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(
                          gym.status
                        )}`}
                      >
                        <span
                          className={`mr-1 h-1.5 w-1.5 rounded-full ${
                            gym.status ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        {gym.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='relative py-3 px-4 text-right'>
                      <button
                        onClick={e => handleDropdownClick(e, gym._id)}
                        className='rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>

                      {activeDropdown === gym._id && (
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
                            onClick={() => router.push(`/gym/edit/${gym._id}`)}
                            className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                          >
                            View/Edit Detail
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              router.push(`/gym/bookings/${gym._id}`)
                            }
                            className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                          >
                            View Bookings
                          </button>
                          <div className='my-1 h-px bg-gray-100' />

                          <button
                            onClick={() => handleEditGymAccess(gym._id)}
                            className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                          >
                            View/Edit Gym Access
                          </button>

                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() => handleDeleteGym(gym._id)}
                            className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-red-600 hover:bg-gray-50'
                          >
                            Delete
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() => handleStatusChange(gym._id, true)}
                            className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                          >
                            Active
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() => handleStatusChange(gym._id, false)}
                            className='flex w-full items-center cursor-pointer px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                          >
                            Inactive
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

        {/* Pagination */}
        <div className='flex items-center justify-between border-t border-[#E5E6EF] pt-4 mt-4'>
          <div className='text-xs text-gray-500'>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalDocs)}{' '}
            of {pagination.totalDocs} entries
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className='rounded-lg border border-[#E5E6EF] p-1.5 text-slate-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
            <span className='text-xs font-medium text-slate-700'>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className='rounded-lg border border-[#E5E6EF] p-1.5 text-slate-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!deleting) {
                setConfirmOpen(false)
              }
            }}
          />
          <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-3'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-lg font-semibold text-slate-900'>
                  Delete this gym?
                </div>
                <div className='mt-1 text-sm text-[#5E6582]'>
                  This action cannot be undone.
                </div>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  if (!deleting) {
                    setConfirmOpen(false)
                  }
                }}
                className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
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
