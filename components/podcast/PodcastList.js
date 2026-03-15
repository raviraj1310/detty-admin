'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  Download,
  MoreVertical,
  Filter,
  Plus,
  Headphones,
  CheckCircle,
  XCircle,
  Users,
  Wallet,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  CreditCard,
  Loader2
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getPodcasts,
  deletePodcast,
  updateStatus
} from '@/services/podcast/podcast.service'
import { downloadPodcastList } from '@/services/excel/excel.service'
import Toast from '@/components/ui/Toast'

const MetricCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  bgClass,
  iconBgClass,
  iconColorClass
}) => (
  <div className={`relative overflow-hidden rounded-2xl ${bgClass} p-4`}>
    <div className='flex items-center justify-between'>
      <div className={`rounded-full ${iconBgClass} p-3`}>
        <Icon className={`h-6 w-6 ${iconColorClass}`} />
      </div>
      <div className='text-right'>
        <p className='text-xs font-medium text-gray-500 mb-1'>{title}</p>
        <div className='flex items-end justify-end gap-1'>
          <p className='text-2xl font-bold text-gray-900'>{value}</p>
          {subValue && (
            <p className='text-sm font-medium text-gray-500 mb-1'>
              ({subValue})
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
)

const TableHeaderCell = ({
  children,
  onClick,
  active = false,
  direction = 'asc'
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap w-full justify-start ${
      active ? 'text-[#2D3658]' : 'text-[#8A92AC]'
    } hover:text-[#2D3658]`}
  >
    {children}
    {active ? (
      <span className='text-[#2D3658]'>
        {direction === 'asc' ? ' ↑' : ' ↓'}
      </span>
    ) : (
      <TbCaretUpDownFilled className='h-3 w-3 text-[#CBCFE2]' />
    )}
  </button>
)

const StatusBadge = ({ status }) => {
  const styles = {
    true: 'bg-green-50 text-green-700 border-green-200',
    false: 'bg-red-50 text-red-700 border-red-200'
  }

  const dots = {
    true: 'bg-green-500',
    false: 'bg-red-500'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
        styles[status] || styles.false
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.false}`}
      />
      {status ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function PodcastList () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [podcasts, setPodcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })
  const [bookingStats, setBookingStats] = useState({
    totalBookingCounts: 0,
    totalRevenue: 0,
    cancelledBookingCounts: 0
  })

  // Toast State
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  // Delete State
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [downloadingExcel, setDownloadingExcel] = useState(false)

  // Helper function for image URL
  const toImageSrc = u => {
    const s = String(u || '').trim()
    if (!s) return '/images/no-image.webp'
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
    const base = String(origin || '').replace(/\/+$/, '')
    const path = s.replace(/^\/+/, '')
    return base ? `${base}/${path}` : s
  }

  // Fetch Podcasts
  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const response = await getPodcasts()

        // Handle the nested data structure from the API response
        const apiData = response.data || {}
        const podcastsList = apiData.podcasts || []

        // Update pagination and counts
        if (apiData.pagination) {
          setPagination(apiData.pagination)
        }
        if (apiData.counts) {
          setCounts(apiData.counts)
        }
        setBookingStats({
          totalBookingCounts: Number(apiData.totalBookingCounts) || 0,
          totalRevenue: Number(apiData.totalRevenue) || 0,
          cancelledBookingCounts: Number(apiData.cancelledBookingCounts) || 0
        })

        // Map API data to component structure
        const formattedPodcasts = podcastsList.map(podcast => ({
          id: podcast._id,
          addedOn: new Date(podcast.createdAt).toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          }),
          name: podcast.title,
          image: toImageSrc(podcast.image),
          host: podcast.host || 'Admin',
          type: podcast.podcastType,
          duration: `${podcast.duration} mins`, // Added mins suffix
          status: podcast.status // Keep boolean status
        }))
        setPodcasts(formattedPodcasts)
      } catch (error) {
        console.error('Failed to fetch podcasts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPodcasts()
  }, [])

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({
      open: true,
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type
    })
  }

  const handleDownloadPodcastList = async () => {
    if (downloadingExcel) return
    setDownloadingExcel(true)
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm

      const blob = await downloadPodcastList(params)
      if (!blob) {
        showToast('Failed to download Excel', 'error')
        return
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `podcast-list-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showToast(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to download Excel',
        'error'
      )
    } finally {
      setDownloadingExcel(false)
    }
  }

  // Handle Status Update
  const handleStatusUpdate = async (id, currentStatus) => {
    // currentStatus is boolean true or false
    const newStatus = !currentStatus
    const newStatusText = newStatus ? 'Active' : 'Inactive'

    setUpdatingId(id)
    try {
      const response = await updateStatus(id, newStatus)
      if (response.success) {
        // Update local state
        setPodcasts(prev =>
          prev.map(p => (p.id === id ? { ...p, status: newStatus } : p))
        )
        // Update counts
        setCounts(prev => ({
          ...prev,
          active: newStatus ? prev.active + 1 : prev.active - 1,
          inactive: newStatus ? prev.inactive - 1 : prev.inactive + 1
        }))
        showToast(`Podcast status updated to ${newStatusText}`)
      } else {
        showToast(response.message || 'Failed to update status', 'error')
      }
    } catch (error) {
      console.error('Status update error:', error)
      showToast('An error occurred while updating status', 'error')
    } finally {
      setUpdatingId(null)
      setActiveDropdown(null)
    }
  }

  // Handle Delete
  const handleDeleteClick = id => {
    setDeleteId(id)
    setConfirmOpen(true)
    setActiveDropdown(null)
  }

  const confirmDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const response = await deletePodcast(deleteId)
      if (response.success) {
        // Remove from local state
        const deletedPodcast = podcasts.find(p => p.id === deleteId)
        setPodcasts(prev => prev.filter(p => p.id !== deleteId))

        // Update counts
        if (deletedPodcast) {
          setCounts(prev => ({
            ...prev,
            total: prev.total - 1,
            active:
              deletedPodcast.status === 'Active'
                ? prev.active - 1
                : prev.active,
            inactive:
              deletedPodcast.status === 'Inactive'
                ? prev.inactive - 1
                : prev.inactive
          }))
        }

        showToast('Podcast deleted successfully')
        setConfirmOpen(false)
        setDeleteId(null)
      } else {
        showToast(response.message || 'Failed to delete podcast', 'error')
      }
    } catch (error) {
      console.error('Delete error:', error)
      showToast('An error occurred while deleting', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Metrics using API data
  const metrics = {
    totalPodcasts: counts.total || 0,
    activePodcasts: counts.active || 0,
    inactivePodcasts: counts.inactive || 0,
    totalSubscribers: bookingStats.totalBookingCounts || 0,
    revenue: {
      count: bookingStats.totalBookingCounts || 0,
      amount: `₦${Number(bookingStats.totalRevenue || 0).toLocaleString()}`
    },
    expiring: { count: 0, amount: '₦0' } // Not in API yet
  }

  const podcastsList = podcasts
  // const podcasts = [
  //   {
  //     id: 1,
  //     addedOn: 'Sat, 12 June 2025, 10:00 AM',
  //     name: 'Mind Over Hustle',
  //     image:
  //       'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=100&h=100&fit=crop',
  //     host: 'Alex Morgan',
  //     type: 'Audio',
  //     duration: '2-4 hours',
  //     status: 'Done'
  //   },
  //   {
  //     id: 2,
  //     addedOn: 'Sat, 12 June 2025, 10:00 AM',
  //     name: 'The Wellness Room',
  //     image:
  //       'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop',
  //     host: 'Alex Morgan',
  //     type: 'Episode',
  //     duration: '2-4 hours',
  //     status: 'Ongoing'
  //   },
  //   {
  //     id: 3,
  //     addedOn: 'Sat, 12 June 2025, 10:00 AM',
  //     name: 'Tech Tomorrow',
  //     image:
  //       'https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=100&h=100&fit=crop',
  //     host: 'Alex Morgan',
  //     type: 'Episode',
  //     duration: '2-4 hours',
  //     status: 'Upcoming'
  //   }
  // ]

  // Click outside dropdown handler
  useEffect(() => {
    const handleClickOutside = event => {
      if (activeDropdown && !event.target.closest('.action-dropdown')) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown])

  const getSortValue = (podcast, key) => {
    switch (key) {
      case 'addedOn':
        return new Date(podcast.addedOn || podcast.createdAt || 0).getTime()
      case 'name':
        return (podcast.name || '').toLowerCase()
      case 'host':
        return (podcast.host || '').toLowerCase()
      case 'type':
        return (podcast.type || '').toLowerCase()
      case 'duration':
        return (podcast.duration || '').toLowerCase()
      case 'status':
        return podcast.status ? 1 : 0
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

  const sortedPodcasts = [...podcasts].sort((a, b) => {
    const va = getSortValue(a, sortKey)
    const vb = getSortValue(b, sortKey)
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    }
    return sortOrder === 'asc' ? va - vb : vb - va
  })

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <Toast
        open={toast.open}
        onOpenChange={open => setToast(prev => ({ ...prev, open }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
      />
      {/* Header */}
      <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Podcasts</h1>
          <nav className='mt-1 text-sm text-gray-500'>
            <span className='hover:text-gray-700'>Dashboard</span>
            <span className='mx-2'>/</span>
            <span className='text-gray-900'>Podcasts</span>
          </nav>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => router.push('/podcast/subscribers')}
            className='rounded-lg border border-[#FF4400] px-4 py-2 text-sm font-medium text-[#FF4400] hover:bg-orange-50'
          >
            View All Subscribers
          </button>
          <button
            onClick={() => router.push('/podcast/add')}
            className='rounded-lg bg-[#FF4400] px-4 py-2 text-sm font-medium text-white hover:bg-[#E63D00]'
          >
            Add New
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4'>
        <MetricCard
          title='Total Podcasts'
          value={metrics.totalPodcasts}
          icon={Headphones}
          bgClass='bg-[#E0F2FE]'
          iconBgClass='bg-white'
          iconColorClass='text-[#0284C7]'
        />
        <MetricCard
          title='Active Podcasts'
          value={metrics.activePodcasts}
          icon={CheckCircle}
          bgClass='bg-[#DCFCE7]'
          iconBgClass='bg-white'
          iconColorClass='text-[#16A34A]'
        />
        <MetricCard
          title='Inactive Podcasts'
          value={metrics.inactivePodcasts}
          icon={XCircle}
          bgClass='bg-[#FEE2E2]'
          iconBgClass='bg-white'
          iconColorClass='text-[#DC2626]'
        />
      </div>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8'>
        <MetricCard
          title='Total Subscribers'
          value={metrics.totalSubscribers}
          icon={Users}
          bgClass='bg-[#F3E8FF]'
          iconBgClass='bg-white'
          iconColorClass='text-[#9333EA]'
        />
        <MetricCard
          title='Revenue'
          value={metrics.revenue.count}
          subValue={metrics.revenue.amount}
          icon={Wallet}
          bgClass='bg-[#E0F2F1]'
          iconBgClass='bg-white'
          iconColorClass='text-[#00897B]'
        />
        <MetricCard
          title='Expiring Subscriptions (15 Days or Above)'
          value={metrics.expiring.count}
          subValue={metrics.expiring.amount}
          icon={AlertCircle}
          bgClass='bg-[#FCE7F3]'
          iconBgClass='bg-white'
          iconColorClass='text-[#DB2777]'
        />
      </div>

      {/* Podcast List */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex flex-col gap-4 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>Podcast List</h2>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-64 rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50'>
              Filters
              <IoFilterSharp className='h-4 w-4' />
            </button>
            <button
              type='button'
              onClick={handleDownloadPodcastList}
              disabled={downloadingExcel}
              className='flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50'
            >
              {downloadingExcel ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Download className='h-4 w-4' />
              )}
            </button>
          </div>
        </div>

        <div className='overflow-visible'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('addedOn')}
                    active={sortKey === 'addedOn'}
                    direction={sortOrder}
                  >
                    Added On
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('name')}
                    active={sortKey === 'name'}
                    direction={sortOrder}
                  >
                    Podcast Name
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('host')}
                    active={sortKey === 'host'}
                    direction={sortOrder}
                  >
                    Host
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('type')}
                    active={sortKey === 'type'}
                    direction={sortOrder}
                  >
                    Podcast
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('duration')}
                    active={sortKey === 'duration'}
                    direction={sortOrder}
                  >
                    Duration
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('status')}
                    active={sortKey === 'status'}
                    direction={sortOrder}
                  >
                    Status
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {loading ? (
                <tr>
                  <td colSpan='7' className='px-6 py-4 text-center'>
                    Loading...
                  </td>
                </tr>
              ) : sortedPodcasts.length === 0 ? (
                <tr>
                  <td colSpan='7' className='px-6 py-4 text-center'>
                    No podcasts found
                  </td>
                </tr>
              ) : (
                sortedPodcasts.map(podcast => (
                  <tr key={podcast.id} className='hover:bg-gray-50/50'>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {podcast.addedOn}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-3'>
                        <div className='relative h-10 w-10 overflow-hidden rounded-lg'>
                          {podcast.image && (
                            <Image
                              src={podcast.image}
                              alt={podcast.name}
                              fill
                              className='object-cover'
                              unoptimized={true}
                            />
                          )}
                        </div>
                        <span className='text-sm font-medium text-gray-900'>
                          {podcast.name}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {podcast.host}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {podcast.type}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {podcast.duration}
                    </td>
                    <td className='px-6 py-4'>
                      <StatusBadge status={podcast.status} />
                    </td>
                    <td className='px-6 py-4'>
                      <div className='relative action-dropdown'>
                        <button
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === podcast.id ? null : podcast.id
                            )
                          }
                          className='flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>

                        {activeDropdown === podcast.id && (
                          <div className='absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-gray-100 bg-white p-1 shadow-lg'>
                            <button
                              onClick={() =>
                                router.push(`/podcast/edit/${podcast.id}`)
                              }
                              className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                            >
                              <Eye className='h-4 w-4' /> View/Edit Detail
                            </button>
                            <button
                              onClick={() =>
                                router.push(`/podcast/bookings/${podcast.id}`)
                              }
                              className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                            >
                              <Users className='h-4 w-4' /> View Subscribers
                            </button>
                            <button
                              onClick={() =>
                                router.push(
                                  `/podcast/subscription/${podcast.id}`
                                )
                              }
                              className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                            >
                              <CreditCard className='h-4 w-4' /> View/Edit
                              Subscription
                            </button>
                            <button
                              className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50'
                              onClick={() => handleDeleteClick(podcast.id)}
                            >
                              <Trash2 className='h-4 w-4' /> Delete
                            </button>
                            <div className='my-1 border-t border-gray-100' />
                            {podcast.status === false && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(podcast.id, podcast.status)
                                }
                                disabled={updatingId === podcast.id}
                                className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                              >
                                {updatingId === podcast.id ? (
                                  <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                  <UserCheck className='h-4 w-4' />
                                )}
                                Active
                              </button>
                            )}
                            {podcast.status === true && (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(podcast.id, podcast.status)
                                }
                                disabled={updatingId === podcast.id}
                                className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                              >
                                {updatingId === podcast.id ? (
                                  <Loader2 className='h-4 w-4 animate-spin' />
                                ) : (
                                  <UserX className='h-4 w-4' />
                                )}
                                Inactive
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmOpen && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!deleting) {
                setConfirmOpen(false)
                setDeleteId(null)
              }
            }}
          />
          <div className='relative z-50 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-lg'>
            <div className='flex items-start gap-3'>
              <div className='rounded-full bg-red-100 p-2'>
                <AlertCircle className='h-5 w-5 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-sm font-semibold text-gray-900'>
                  Delete this podcast?
                </div>
                <div className='mt-1 text-xs text-gray-500'>
                  This action cannot be undone.
                </div>
              </div>
            </div>
            <div className='mt-4 flex justify-end gap-2'>
              <button
                onClick={() => {
                  if (!deleting) {
                    setConfirmOpen(false)
                    setDeleteId(null)
                  }
                }}
                className='rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50'
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className='rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {deleting ? (
                  <span className='flex items-center gap-1'>
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
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
