'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  Sparkles,
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
  Loader2,
  Users
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getAllOtherRecoveryServices,
  deleteOtherRecoveryService,
  activeInactiveOtherRecoveryService
} from '@/services/v2/other-recovery-services/otherRecoveryServices.service'
import { downloadOtherRecoveryList } from '@/services/excel/excel.service'
import { formatDate } from '@/utils/helper'
import Toast from '@/components/ui/Toast'

const getServiceImageUrl = imagePath => {
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

const formatCurrency = amount => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(Number(amount) || 0)
}

const INITIAL_METRICS = [
  {
    id: 'total-services',
    title: 'Total Services',
    value: '0',
    icon: Sparkles,
    bg: 'bg-[#E8EEFF]',
    textColor: 'text-indigo-600',
    iconBg: 'bg-white'
  },
  {
    id: 'active-services',
    title: 'Active Services',
    value: '0',
    icon: CheckCircle,
    bg: 'bg-[#E8F8F0]',
    textColor: 'text-emerald-600',
    iconBg: 'bg-white'
  },
  {
    id: 'inactive-services',
    title: 'Inactive Services',
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

export default function OtherRecoveryServicesMaster () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPos, setDropdownPos] = useState({})
  const dropdownRef = useRef(null)
  const filterRef = useRef(null)

  const [services, setServices] = useState([])
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
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')

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
  const [downloadingExcel, setDownloadingExcel] = useState(false)

  const showToast = (title, description, variant = 'success') => {
    setToastProps({ title, description, variant })
    setToastOpen(true)
  }

  const handleDownloadRecoveryList = async () => {
    if (downloadingExcel) return
    setDownloadingExcel(true)
    try {
      const params = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter) params.status = statusFilter

      const blob = await downloadOtherRecoveryList(params)
      if (!blob) {
        showToast('Error', 'Failed to download Excel', 'destructive')
        return
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recovery-services-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showToast(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to download Excel',
        'destructive'
      )
    } finally {
      setDownloadingExcel(false)
    }
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
    fetchServices()
  }, [pagination.page, debouncedSearch, statusFilter])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = {
        page: pagination.page,
        limit: pagination.limit
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (statusFilter) params.status = statusFilter

      const response = await getAllOtherRecoveryServices(
        pagination.page,
        pagination.limit,
        params
      )

      if (response.success) {
        setServices(response.data || [])
        setPagination({
          page: response.page ?? pagination.page,
          limit: response.limit ?? pagination.limit,
          totalDocs: response.total ?? response.totalRecords ?? 0,
          totalPages:
            response.totalPages ??
            Math.ceil((response.total ?? 1) / pagination.limit)
        })

        // Update metrics from API response
        const newMetrics = [...INITIAL_METRICS]
        newMetrics[0] = {
          ...newMetrics[0],
          value: response.total ?? 0
        }
        newMetrics[1] = {
          ...newMetrics[1],
          value: response.totalActive ?? 0
        }
        newMetrics[2] = {
          ...newMetrics[2],
          value: response.totalInactive ?? 0
        }
        newMetrics[3] = {
          ...newMetrics[3],
          value: Number(response.totalBookingCounts) || 0
        }
        const totalBookings = Number(response.totalBookingCounts) || 0
        const totalRevenue = Number(response.totalRevenue) || 0
        const cancelledBookings = Number(response.cancelledBookingCounts) || 0

        newMetrics[4] = {
          ...newMetrics[4],
          value: `${totalBookings} (${formatCurrency(totalRevenue)})`
        }
        newMetrics[5] = {
          ...newMetrics[5],
          value: `${cancelledBookings} (${formatCurrency(0)})`
        }
        setMetrics(newMetrics)
      }
    } catch (error) {
      console.error('Failed to fetch other recovery services:', error)
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

  const getStatusColor = status => {
    if (status)
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    return 'bg-red-50 text-red-600 border border-red-200'
  }

  const getSortValue = (service, key) => {
    switch (key) {
      case 'addedOn':
        return new Date(service.createdAt || 0).getTime()
      case 'serviceName':
        return (service.recoveryServiceName || '').toLowerCase()
      case 'category':
        return typeof service.serviceCategory === 'object' &&
          service.serviceCategory?.serviceCategoryName
          ? service.serviceCategory.serviceCategoryName.toLowerCase()
          : String(service.serviceCategory || '').toLowerCase()
      case 'location':
        return (service.location || '').toLowerCase()
      case 'status':
        return service.status ? 1 : 0
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

  const sortedServices = useMemo(() => {
    const arr = [...services]
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [services, sortKey, sortOrder])

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleDeleteService = id => {
    setDeleteId(id)
    setConfirmOpen(true)
    setActiveDropdown(null)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await deleteOtherRecoveryService(deleteId)
      if (res && res.success) {
        showToast(
          'Service deleted',
          'The recovery service has been successfully deleted'
        )
        fetchServices()
      } else {
        showToast(
          'Error',
          res?.message || 'Failed to delete service',
          'destructive'
        )
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete service'
      showToast('Error', errMsg, 'destructive')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setDeleteId(null)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      const res = await activeInactiveOtherRecoveryService(id, { status })
      if (res && res.success) {
        showToast(
          'Status updated',
          `Service is now ${status ? 'Active' : 'Inactive'}`
        )
        fetchServices()
      } else {
        showToast(
          'Error',
          res?.message || 'Failed to update status',
          'destructive'
        )
      }
    } catch (error) {
      console.error('Failed to update service status:', error)
      showToast('Error', 'Failed to update service status', 'destructive')
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
          <h1 className='text-xl font-semibold text-slate-900'>
            Recovery Services Master
          </h1>
          <p className='text-xs text-[#99A1BC]'>
            Dashboard / Recovery Services Master
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2 md:justify-end'>
          <button
            onClick={() => router.push('/other-recovery-services/bookings')}
            className='rounded-lg border border-[#FF5B2C] bg-white px-4 py-2 text-xs font-medium text-[#FF5B2C] shadow-sm transition hover:bg-[#FFF5F2]'
          >
            View All Bookings
          </button>
          <button
            onClick={() => router.push('/other-recovery-services/category')}
            className='flex items-center gap-2 rounded-lg border border-[#FF5B2C] bg-white px-4 py-2 text-xs font-medium text-[#FF5B2C] shadow-sm transition hover:bg-[#FFF5F2]'
          >
            <Users className='h-3.5 w-3.5' />
            Categories
          </button>
          <button
            onClick={() => router.push('/other-recovery-services/add')}
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
          <h2 className='text-base font-semibold text-slate-900'>
            Recovery Services List
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
                  {/* <button
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
                  </button> */}
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
            <button
              type='button'
              onClick={handleDownloadRecoveryList}
              disabled={downloadingExcel}
              className='flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E6EF] bg-white text-slate-700 hover:bg-gray-50 disabled:opacity-50'
            >
              {downloadingExcel ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Download className='h-4 w-4' />
              )}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[900px] border-collapse'>
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
                    onClick={() => handleSort('serviceName')}
                    active={sortKey === 'serviceName'}
                    direction={sortOrder}
                  >
                    Services Name
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('category')}
                    active={sortKey === 'category'}
                    direction={sortOrder}
                  >
                    Categories
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
                  <TableHeaderCell>Bookings</TableHeaderCell>
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
                <th className='py-3 px-4 text-right'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E5E6EF]'>
              {loading ? (
                <tr>
                  <td colSpan='7' className='py-8 text-center text-gray-500'>
                    Loading services...
                  </td>
                </tr>
              ) : sortedServices.length === 0 ? (
                <tr>
                  <td colSpan='7' className='py-8 text-center text-gray-500'>
                    No recovery services found
                  </td>
                </tr>
              ) : (
                sortedServices.map(service => (
                  <tr key={service._id} className='group hover:bg-gray-50'>
                    <td className='py-3 px-4 text-xs text-gray-500'>
                      {formatDate(service.createdAt)}
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex items-center gap-3'>
                        <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100'>
                          {service.image ? (
                            <img
                              src={getServiceImageUrl(service.image)}
                              alt={service.recoveryServiceName}
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
                          {service.recoveryServiceName}
                        </span>
                      </div>
                    </td>
                    <td className='py-3 px-4 text-xs text-gray-500 capitalize'>
                      {typeof service.serviceCategory === 'object' &&
                      service.serviceCategory?.serviceCategoryName
                        ? service.serviceCategory.serviceCategoryName
                        : typeof service.serviceCategory === 'string'
                        ? service.serviceCategory
                        : '—'}
                    </td>
                    <td className='py-3 px-4 text-xs text-gray-500'>
                      {service.location || '—'}
                    </td>
                    <td className='py-3 px-4'>
                      <div
                        className='flex items-center gap-1 text-xs cursor-pointer'
                        onClick={() =>
                          router.push(
                            `/other-recovery-services/bookings/${service._id}`
                          )
                        }
                      >
                        <span className='font-semibold text-indigo-600 underline'>
                          {service.totalBookings ?? 0}
                        </span>
                        <span className='font-medium text-indigo-600'>
                          (View List)
                        </span>
                      </div>
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(
                          service.status
                        )}`}
                      >
                        <span
                          className={`mr-1 h-1.5 w-1.5 rounded-full ${
                            service.status ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        {service.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='relative py-3 px-4 text-right'>
                      <button
                        onClick={e => handleDropdownClick(e, service._id)}
                        className='rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>

                      {activeDropdown === service._id && (
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
                            onClick={() =>
                              router.push(
                                `/other-recovery-services/edit/${service._id}`
                              )
                            }
                            className='flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50'
                          >
                            View/Edit Detail
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/other-recovery-services/bookings/${service._id}`
                              )
                            }
                            className='flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50'
                          >
                            View Bookings
                          </button>
                          <button
                            onClick={() =>
                              router.push(
                                `/other-recovery-services/sessions/${service._id}`
                              )
                            }
                            className='flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-50'
                          >
                            View/Edit Session
                          </button>
                          <button
                            onClick={() => handleDeleteService(service._id)}
                            className='flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50'
                          >
                            Delete
                          </button>
                          <div className='my-1 border-t border-gray-100' />
                          {service.status ? (
                            <button
                              onClick={() =>
                                handleStatusChange(service._id, false)
                              }
                              className='flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50'
                            >
                              Inactive
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleStatusChange(service._id, true)
                              }
                              className='flex w-full items-center gap-2 px-3 py-2 text-xs text-emerald-600 hover:bg-emerald-50'
                            >
                              Active
                            </button>
                          )}
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
        <div className='mt-4 flex items-center justify-between border-t border-[#E5E6EF] pt-4'>
          <p className='text-xs text-gray-500'>
            Showing {services.length} of {pagination.totalDocs} results
          </p>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className='rounded-lg border border-[#E5E6EF] p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50'
            >
              <ChevronLeft className='h-4 w-4' />
            </button>
            <span className='text-xs font-medium text-gray-700'>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className='rounded-lg border border-[#E5E6EF] p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50'
            >
              <ChevronRight className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-sm rounded-xl bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center gap-3 text-red-600'>
              <div className='rounded-full bg-red-50 p-2'>
                <AlertCircle className='h-6 w-6' />
              </div>
              <h3 className='text-lg font-semibold'>Delete Service?</h3>
            </div>
            <p className='mb-6 text-sm text-gray-500'>
              Are you sure you want to delete this recovery service? This action
              cannot be undone.
            </p>
            <div className='flex items-center justify-end gap-3'>
              <button
                onClick={() => setConfirmOpen(false)}
                className='rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className='flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
                disabled={deleting}
              >
                {deleting && <Loader2 className='h-4 w-4 animate-spin' />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
