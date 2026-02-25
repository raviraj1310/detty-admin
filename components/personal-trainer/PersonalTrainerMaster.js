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
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getPersonalTrainers,
  deletePersonalTrainer,
  activeInactivePersonalTrainer
} from '@/services/v2/personal-trainer/personal-trainer.service'
import Toast from '@/components/ui/Toast'

// Mock Data for Metrics
const INITIAL_METRICS = {
  totalTrainers: 0,
  activeTrainers: 0,
  inactiveTrainers: 0,
  totalBookings: 0,
  revenue: '0',
  cancelledBookings: '0'
}

const TableHeaderCell = ({ children, align = 'left' }) => (
  <div
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[#8A92AC] whitespace-nowrap ${
      align === 'right' ? 'justify-end' : 'justify-start'
    }`}
  >
    {children}
    <TbCaretUpDownFilled className='h-3 w-3 text-[#CBCFE2]' />
  </div>
)

const MetricCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
  iconBgClass
}) => (
  <div className={`relative overflow-hidden rounded-2xl ${bgClass} p-4`}>
    <div className='flex items-start justify-between'>
      <div className={`rounded-full ${iconBgClass} p-2.5`}>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      <div className='text-right'>
        <p className={`text-xs font-medium ${colorClass} mb-1`}>{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>{value}</h3>
      </div>
    </div>
  </div>
)

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
  return base ? `${base}/upload/image/${path}` : `/upload/image/${path}`
}

export default function PersonalTrainerMaster () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const dropdownRef = useRef(null)
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(INITIAL_METRICS)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalDocs: 0
  })

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  // Delete Confirmation State
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = id => {
    setDeleteId(id)
    setConfirmOpen(true)
    setActiveDropdown(null)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const response = await deletePersonalTrainer(deleteId)
      if (response && response.success) {
        setTrainers(trainers.filter(t => t._id !== deleteId))
        showToast('Trainer deleted successfully', 'success')
        // Refresh metrics if needed, or simply let the next fetch handle it
        setMetrics(prev => ({
          ...prev,
          totalTrainers: Math.max(0, prev.totalTrainers - 1)
        }))
      } else {
        showToast(response?.message || 'Failed to delete trainer', 'error')
      }
    } catch (error) {
      console.error('Error deleting trainer:', error)
      showToast('Failed to delete trainer', 'error')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      const response = await activeInactivePersonalTrainer(id, status)
      if (response && response.success) {
        setTrainers(
          trainers.map(t => (t._id === id ? { ...t, isActive: status } : t))
        )
        // Update local metrics
        setMetrics(prev => {
          const isNowActive = status
          return {
            ...prev,
            activeTrainers: isNowActive
              ? prev.activeTrainers + 1
              : Math.max(0, prev.activeTrainers - 1),
            inactiveTrainers: isNowActive
              ? Math.max(0, prev.inactiveTrainers - 1)
              : prev.inactiveTrainers + 1
          }
        })
        showToast(
          `Trainer marked as ${status ? 'Active' : 'Inactive'}`,
          'success'
        )
      } else {
        showToast(response?.message || 'Failed to update status', 'error')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('Failed to update trainer status', 'error')
    } finally {
      setActiveDropdown(null)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          search: searchTerm
        }
        if (statusFilter) params.status = statusFilter
        const response = await getPersonalTrainers(params)
        if (response.success && response.data) {
          setTrainers(
            (response.data.personalTrainers || []).map(trainer => ({
              ...trainer,
              isActive: trainer.status ?? true
            }))
          )
          if (response.data.pagination) {
            setPagination(prev => ({
              ...prev,
              ...response.data.pagination
            }))
          }
          if (response.data.counts) {
            setMetrics(prev => ({
              ...prev,
              totalTrainers: response.data.counts.totalTrainers || 0,
              activeTrainers: response.data.counts.activeTrainers || 0,
              inactiveTrainers: response.data.counts.inactiveTrainers || 0
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching trainers:', error)
        showToast('Failed to fetch personal trainers', 'error')
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchData()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [pagination.page, pagination.limit, searchTerm, statusFilter])

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleSearch = e => {
    setSearchTerm(e.target.value)
  }

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [searchTerm, statusFilter])

  // Close dropdown when clicking outside or scrolling
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
      if (dropdownRef.current) {
        setActiveDropdown(null)
      }
      setFilterOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [])

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ ...toast, show: false }), 3000)
  }

  const toggleDropdown = (e, id) => {
    e.stopPropagation()
    if (activeDropdown === id) {
      setActiveDropdown(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom,
        left: rect.right - 224 // Align right edge of dropdown with right edge of button (w-56 = 224px)
      })
      setActiveDropdown(id)
    }
  }

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-[#1E293B]'>
            Personal Trainers Master
          </h1>
          <nav className='mt-1 text-sm text-[#64748B]'>
            <span>Dashboard</span>
            <span className='mx-2'>/</span>
            <span className='text-[#1E293B]'>Personal Trainers Master</span>
          </nav>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => router.push('/personal-trainer/bookings')} // Adjust route as needed
            className='rounded-lg border border-[#FF4400] bg-white px-6 py-2.5 text-sm font-medium text-[#FF4400] hover:bg-orange-50'
          >
            View All Bookings
          </button>
          <button
            onClick={() => router.push('/personal-trainer/add')}
            className='rounded-lg bg-[#FF4400] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#E63E00]'
          >
            Add New
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <MetricCard
          title='Total Trainers'
          value={metrics.totalTrainers}
          icon={Dumbbell}
          bgClass='bg-[#E6F0FF]'
          colorClass='text-[#0066FF]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Active Trainers'
          value={metrics.activeTrainers}
          icon={CheckCircle}
          bgClass='bg-[#E6FFFA]'
          colorClass='text-[#00A86B]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Inactive Trainers'
          value={metrics.inactiveTrainers}
          icon={MinusCircle}
          bgClass='bg-[#FFF0F0]'
          colorClass='text-[#E53E3E]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Total Bookings'
          value={metrics.totalBookings}
          icon={User}
          bgClass='bg-[#F3E8FF]'
          colorClass='text-[#9333EA]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Revenue'
          value={metrics.revenue}
          icon={Wallet}
          bgClass='bg-[#E0F2F1]'
          colorClass='text-[#00897B]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Cancelled Bookings'
          value={metrics.cancelledBookings}
          icon={XCircle}
          bgClass='bg-[#FCE4EC]'
          colorClass='text-[#D81B60]'
          iconBgClass='bg-white'
        />
      </div>

      {/* Table Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <h2 className='text-lg font-bold text-[#1E293B]'>
            Personal Trainers List
          </h2>
          <div className='flex gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={handleSearch}
                className='h-10 w-[300px] rounded-lg border border-[#E2E8F0] pl-10 pr-4 text-sm focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <div className='relative' ref={filterRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-gray-50 ${
                  filterOpen || statusFilter
                    ? 'border-[#FF4400] bg-[#FFF5F2] text-[#FF4400]'
                    : 'border-[#E2E8F0] text-[#64748B]'
                }`}
              >
                <IoFilterSharp className='h-4 w-4' />
                Filters
              </button>
              {filterOpen && (
                <div className='absolute right-0 top-12 z-50 w-48 rounded-lg border border-[#E1E6F7] bg-white p-1 shadow-lg'>
                  <div className='px-3 py-2 text-xs font-semibold text-gray-500'>
                    Filter by Status
                  </div>
                  <button
                    onClick={() => {
                      setStatusFilter('')
                      setFilterOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium hover:bg-gray-50 ${
                      statusFilter === ''
                        ? 'bg-[#FFF5F2] text-[#FF4400]'
                        : 'text-[#475569]'
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
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium hover:bg-gray-50 ${
                      statusFilter === 'true'
                        ? 'bg-[#FFF5F2] text-[#FF4400]'
                        : 'text-[#475569]'
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
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-medium hover:bg-gray-50 ${
                      statusFilter === 'false'
                        ? 'bg-[#FFF5F2] text-[#FF4400]'
                        : 'text-[#475569]'
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
            <button className='flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-[#E1E6F7] bg-[#F8F9FC]'>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Added On</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Trainers Name</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Location</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Bookings</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Status</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-right'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E1E6F7]'>
              {loading ? (
                <tr>
                  <td colSpan='6' className='py-8 text-center text-[#64748B]'>
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      Loading trainers...
                    </div>
                  </td>
                </tr>
              ) : trainers.length === 0 ? (
                <tr>
                  <td colSpan='6' className='py-8 text-center text-[#64748B]'>
                    No trainers found
                  </td>
                </tr>
              ) : (
                trainers.map(trainer => (
                  <tr key={trainer._id} className='hover:bg-[#F8F9FC]'>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {new Date(trainer.createdAt).toLocaleString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center gap-3'>
                        <div className='relative h-10 w-10 overflow-hidden rounded-lg bg-gray-100'>
                          <Image
                            src={
                              toImageSrc(trainer.image) ||
                              '/images/placeholder.png'
                            }
                            alt={trainer.trainerName}
                            fill
                            className='object-cover'
                            unoptimized={true}
                          />
                        </div>
                        <span className='text-sm font-medium text-[#1E293B]'>
                          {trainer.trainerName}
                        </span>
                      </div>
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {trainer.location}
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center gap-1 text-sm'>
                        <span className='font-semibold text-[#0066FF] underline cursor-pointer hover:text-[#0052CC]'>
                          {trainer.bookingsCount || 0}
                        </span>
                        <span className='font-medium text-[#0066FF] cursor-pointer hover:text-[#0052CC]'>
                          (View List)
                        </span>
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          trainer.isActive
                            ? 'border-[#22C55E] text-[#22C55E]'
                            : 'border-[#EF4444] text-[#EF4444]'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            trainer.isActive ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        ></span>
                        {trainer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='py-4 px-6 text-right relative'>
                      <button
                        onClick={e => toggleDropdown(e, trainer._id)}
                        className='rounded-lg p-2 text-[#94A3B8] hover:bg-gray-100 hover:text-[#1E293B]'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>

                      {activeDropdown === trainer._id && (
                        <div
                          ref={dropdownRef}
                          style={{
                            position: 'fixed',
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`,
                            zIndex: 9999
                          }}
                          className='w-56 rounded-xl border border-[#E1E6F7] bg-white p-1.5 shadow-lg'
                        >
                          <button
                            onClick={() =>
                              router.push(
                                `/personal-trainer/edit/${trainer._id}`
                              )
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            View/Edit Detail
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              router.push(
                                `/personal-trainer/bookings/${trainer._id}`
                              )
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            View Bookings
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              router.push(
                                `/personal-trainer/training-session/${trainer._id}`
                              )
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            View/Edit Session
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() => handleDelete(trainer._id)}
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#EF4444] hover:bg-[#FFF0F0] hover:text-[#EF4444]'
                          >
                            Delete
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              handleStatusChange(trainer._id, true)
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            Active
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              handleStatusChange(trainer._id, false)
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
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
        {pagination.totalDocs > 0 && (
          <div className='mt-4 flex items-center justify-between border-t border-[#E1E6F7] pt-4'>
            <div className='text-sm text-[#64748B]'>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(
                pagination.page * pagination.limit,
                pagination.totalDocs
              )}{' '}
              of {pagination.totalDocs} entries
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className='flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 disabled:opacity-50'
              >
                <ChevronLeft className='h-4 w-4' />
              </button>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  // Logic to show window of pages around current page
                  let startPage = Math.max(1, pagination.page - 2)
                  if (startPage + 4 > pagination.totalPages) {
                    startPage = Math.max(1, pagination.totalPages - 4)
                  }
                  return startPage + i
                }
              ).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium ${
                    pagination.page === page
                      ? 'border-[#FF4400] bg-[#FF4400] text-white'
                      : 'border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className='flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 disabled:opacity-50'
              >
                <ChevronRight className='h-4 w-4' />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {confirmOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!deleting) {
                setConfirmOpen(false)
              }
            }}
          />
          <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-2xl'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-3'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-lg font-semibold text-slate-900'>
                  Delete this trainer?
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
                className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
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
