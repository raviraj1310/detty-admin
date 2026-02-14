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
  Clock
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'
import {
  getAllFitnessEvent,
  deleteFitnessEvent,
  activeInactiveFitnessEvent
} from '@/services/fitness-event/fitness-event.service'

// Mock Data for Metrics
const INITIAL_METRICS = {
  totalEvents: 0,
  doneEvents: 0,
  ongoingEvents: 0,
  upcomingEvents: 0,
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

const getImageUrl = path => {
  if (!path) return null
  if (path.startsWith('http')) return path

  const baseUrl =
    process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN ||
    process.env.NEXT_PUBLIC_API_BASE_URL

  if (!baseUrl) return path

  try {
    const { origin } = new URL(baseUrl)
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${origin}/${cleanPath}`
  } catch {
    return path
  }
}

export default function FitnessEventsMaster () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(INITIAL_METRICS)
  const [deleting, setDeleting] = useState(false)

  // Toast State
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  // Delete Confirmation State
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const handleDelete = id => {
    setDeleteId(id)
    setConfirmOpen(true)
    setActiveDropdown(null)
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      const response = await deleteFitnessEvent(deleteId)
      if (response?.success || response?.data?.success) {
        setEvents(events.filter(e => e._id !== deleteId))
        showToast('Event deleted successfully', 'success')
        setConfirmOpen(false)
        setDeleteId(null)
      } else {
        showToast(response?.message || 'Failed to delete event', 'error')
      }
    } catch (error) {
      console.error('Delete error:', error)
      showToast('An error occurred while deleting', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    setActiveDropdown(null)
    try {
      const status = newStatus === 'Active'
      const response = await activeInactiveFitnessEvent(id, { status })
      if (response?.success || response?.data?.success) {
        showToast(`Event status updated to ${newStatus}`, 'success')
        setEvents(prevEvents =>
          prevEvents.map(event =>
            event._id === id ? { ...event, status: status } : event
          )
        )
      } else {
        showToast(response?.message || 'Failed to update status', 'error')
      }
    } catch (error) {
      console.error('Status update error:', error)
      showToast('An error occurred while updating status', 'error')
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await getAllFitnessEvent()
        if (response?.success || response?.data?.success) {
          const data = response?.data?.data || response?.data || {}
          const eventList = data.events || []
          const stats = data.stats || {}

          const formattedEvents = eventList.map(event => {
            // Calculate status based on dates
            const now = new Date()
            const start = new Date(event.startDate)
            const end = new Date(event.endDate)
            let timeStatus = 'Upcoming'
            if (now > end) timeStatus = 'Done'
            else if (now >= start && now <= end) timeStatus = 'Ongoing'

            return {
              ...event,
              eventName: event.fitnessEventName,
              status: event.status, // Use API boolean status
              timeStatus: timeStatus,
              bookingsCount: 0, // Not provided in API
              image: getImageUrl(event.image) || null
            }
          })

          setEvents(formattedEvents)
          setMetrics({
            totalEvents: stats.totalEvents || 0,
            doneEvents: stats.completedEvents || 0,
            ongoingEvents: stats.ongoingEvents || 0,
            upcomingEvents: stats.upcomingEvents || 0,
            totalBookings: 0,
            revenue: '0',
            cancelledBookings: '0'
          })
        }
      } catch (error) {
        console.error('Error fetching events:', error)
        showToast('Failed to fetch events', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({
      open: true,
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type
    })
  }

  const toggleDropdown = (e, id) => {
    e.stopPropagation()
    setActiveDropdown(activeDropdown === id ? null : id)
  }

  const getStatusColor = status => {
    switch (status) {
      case true:
        return 'border-[#22C55E] text-[#22C55E]'
      case false:
        return 'border-[#EF4444] text-[#EF4444]'
      default:
        return 'border-gray-300 text-gray-500'
    }
  }

  const getStatusDotColor = status => {
    switch (status) {
      case true:
        return 'bg-[#22C55E]'
      case false:
        return 'bg-[#EF4444]'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <Toast
        open={toast.open}
        onOpenChange={open => setToast(prev => ({ ...prev, open }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
      />

      {/* Header */}
      <div className='mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-[#1E293B]'>
            Fitness Events Master
          </h1>
          <nav className='mt-1 text-sm text-[#64748B]'>
            <span>Dashboard</span>
            <span className='mx-2'>/</span>
            <span className='text-[#1E293B]'>Fitness Events Master</span>
          </nav>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => router.push('/fitness-events/bookings')}
            className='rounded-lg border border-[#FF4400] bg-white px-6 py-2.5 text-sm font-medium text-[#FF4400] hover:bg-orange-50'
          >
            View All Bookings
          </button>
          <button
            onClick={() => router.push('/fitness-events/add')}
            className='rounded-lg bg-[#FF4400] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#E63E00]'
          >
            Add New
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'>
        {/* Row 1 */}
        <MetricCard
          title='Total Events'
          value={metrics.totalEvents}
          icon={Dumbbell}
          bgClass='bg-[#E6F0FF]'
          colorClass='text-[#0066FF]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Done Events'
          value={metrics.doneEvents}
          icon={CheckCircle}
          bgClass='bg-[#E6FFFA]'
          colorClass='text-[#00A86B]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Ongoing Events'
          value={metrics.ongoingEvents}
          icon={Clock}
          bgClass='bg-[#FFF8E1]'
          colorClass='text-[#F59E0B]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Upcoming Events'
          value={metrics.upcomingEvents}
          icon={MinusCircle}
          bgClass='bg-[#FFF0F0]'
          colorClass='text-[#E53E3E]'
          iconBgClass='bg-white'
        />
      </div>
      <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {/* Row 2 */}
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
            Fitness Events List
          </h2>
          <div className='flex gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-[300px] rounded-lg border border-[#E2E8F0] pl-10 pr-4 text-sm focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 text-sm font-medium text-[#64748B] hover:bg-gray-50'>
              <IoFilterSharp className='h-4 w-4' />
              Filters
            </button>
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
                  <TableHeaderCell>Fitness Events Name</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Hosted By</TableHeaderCell>
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
                  <td colSpan='7' className='py-8 text-center text-[#64748B]'>
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      Loading events...
                    </div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan='7' className='py-8 text-center text-[#64748B]'>
                    No events found
                  </td>
                </tr>
              ) : (
                events.map(event => (
                  <tr key={event._id} className='hover:bg-[#F8F9FC]'>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {new Date(event.createdAt).toLocaleString('en-GB', {
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
                            src={event.image || '/images/placeholder.png'}
                            alt={event.eventName}
                            fill
                            className='object-cover'
                            unoptimized={true}
                          />
                        </div>
                        <span className='text-sm font-medium text-[#1E293B]'>
                          {event.eventName}
                        </span>
                      </div>
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {typeof event.hostedBy === 'object'
                        ? event.hostedBy?.name
                        : event.hostedBy}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {event.location}
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center gap-1 text-sm'>
                        <span className='font-semibold text-[#0066FF] underline cursor-pointer hover:text-[#0052CC]'>
                          {event.bookingsCount}
                        </span>
                        <span className='font-medium text-[#0066FF] cursor-pointer hover:text-[#0052CC]'>
                          (View List)
                        </span>
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          event.status
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDotColor(
                            event.status
                          )}`}
                        ></span>
                        {event.status === true ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='py-4 px-6 text-right relative'>
                      <button
                        onClick={e => toggleDropdown(e, event._id)}
                        className='rounded-lg p-2 text-[#94A3B8] hover:bg-gray-100 hover:text-[#1E293B]'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>

                      {activeDropdown === event._id && (
                        <div
                          ref={dropdownRef}
                          className='absolute right-6 top-12 z-10 w-56 rounded-xl border border-[#E1E6F7] bg-white p-1.5 shadow-lg'
                        >
                          <button
                            onClick={() =>
                              router.push(`/fitness-events/edit/${event._id}`)
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            View/Edit Detail
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              router.push(`/fitness-events/bookings`)
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            View Bookings
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              router.push(
                                `/fitness-events/fitness-event-pass/${event._id}`
                              )
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            View/Edit Fitness Event Pass
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() => handleDelete(event._id)}
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#EF4444] hover:bg-[#FFF0F0] hover:text-[#EF4444]'
                          >
                            Delete
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              handleStatusChange(event._id, 'Active')
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            Active
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              handleStatusChange(event._id, 'Inactive')
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
          <div className='relative z-50 w-full max-w-sm rounded-xl border border-[#E5E8F6] bg-white p-5 shadow-lg'>
            <div className='flex items-start gap-3'>
              <div className='rounded-full bg-red-100 p-2'>
                <AlertCircle className='h-5 w-5 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-sm font-semibold text-slate-900'>
                  Delete this event?
                </div>
                <div className='mt-1 text-xs text-[#5E6582]'>
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
                className='rounded-lg border border-[#E5E6EF] bg-white px-4 py-1.5 text-xs font-medium text-[#1A1F3F] transition hover:bg-[#F9FAFD]'
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
