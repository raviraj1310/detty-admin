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
  Loader2
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'

// Mock Data for Metrics
const INITIAL_METRICS = {
  totalRetreats: 1155,
  activeRetreats: 1137,
  inactiveRetreats: 299,
  totalBookings: 1155,
  revenue: '865(₦10,00,000)',
  cancelledBookings: '299(₦2,00,000)'
}

// Mock Data for Table
const MOCK_RETREATS = [
  {
    _id: '1',
    createdAt: '2025-06-12T10:00:00',
    name: 'Wellness & Fitness Retreat',
    image: '/images/dashboard/image-1.webp', // Placeholder
    location: 'Ikoyi, Lagos',
    bookingsCount: 100,
    isActive: true
  },
  {
    _id: '2',
    createdAt: '2025-06-12T10:00:00',
    name: 'Leadership & Wellness Camp',
    image: '/images/dashboard/image-1.webp', // Placeholder
    location: 'Ikoyi, Lagos',
    bookingsCount: 100,
    isActive: true
  },
  {
    _id: '3',
    createdAt: '2025-06-12T10:00:00',
    name: 'Corporate Fitness Offsite',
    image: '/images/dashboard/image-1.webp', // Placeholder
    location: 'Ikoyi, Lagos',
    bookingsCount: 100,
    isActive: false
  },
  {
    _id: '4',
    createdAt: '2025-06-12T10:00:00',
    name: 'Yoga Fitness Retreat',
    image: '/images/dashboard/image-1.webp', // Placeholder
    location: 'Ikoyi, Lagos',
    bookingsCount: 100,
    isActive: true
  }
]

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

export default function TeamBondingRetreatMaster () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)

  const [retreats, setRetreats] = useState([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(INITIAL_METRICS)

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

  const confirmDelete = () => {
    setDeleting(true)
    setTimeout(() => {
      setRetreats(retreats.filter(t => t._id !== deleteId))
      setConfirmOpen(false)
      setDeleteId(null)
      setDeleting(false)
      showToast('Retreat deleted successfully', 'success')
    }, 500)
  }

  const handleStatusChange = (id, status) => {
    setRetreats(
      retreats.map(t => (t._id === id ? { ...t, isActive: status } : t))
    )
    setActiveDropdown(null)
    showToast(`Retreat marked as ${status ? 'Active' : 'Inactive'}`, 'success')
  }

  useEffect(() => {
    // Simulate API fetch
    const fetchData = async () => {
      setLoading(true)
      try {
        // In a real app, we would fetch from API here
        setTimeout(() => {
          setRetreats(MOCK_RETREATS)
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Error fetching retreats:', error)
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

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ ...toast, show: false }), 3000)
  }

  const toggleDropdown = (e, id) => {
    e.stopPropagation()
    setActiveDropdown(activeDropdown === id ? null : id)
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
            Team Bonding Retreats Master
          </h1>
          <nav className='mt-1 text-sm text-[#64748B]'>
            <span>Dashboard</span>
            <span className='mx-2'>/</span>
            <span className='text-[#1E293B]'>Team Bonding Retreats Master</span>
          </nav>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => router.push('/team-bonding-retreat/bookings')}
            className='rounded-lg border border-[#FF4400] bg-white px-6 py-2.5 text-sm font-medium text-[#FF4400] hover:bg-orange-50'
          >
            View All Bookings
          </button>
          <button
            onClick={() => router.push('/team-bonding-retreat/add')}
            className='rounded-lg bg-[#FF4400] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#E63E00]'
          >
            Add New
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <MetricCard
          title='Total Team Bonding Retreats'
          value={metrics.totalRetreats}
          icon={Dumbbell}
          bgClass='bg-[#E6F0FF]'
          colorClass='text-[#0066FF]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Active Team Bonding Retreats'
          value={metrics.activeRetreats}
          icon={CheckCircle}
          bgClass='bg-[#E6FFFA]'
          colorClass='text-[#00A86B]'
          iconBgClass='bg-white'
        />
        <MetricCard
          title='Inactive Team Bonding Retreats'
          value={metrics.inactiveRetreats}
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
            Team Bonding Retreats List
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
                  <TableHeaderCell>Team Bonding Retreats Name</TableHeaderCell>
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
                      Loading retreats...
                    </div>
                  </td>
                </tr>
              ) : retreats.length === 0 ? (
                <tr>
                  <td colSpan='6' className='py-8 text-center text-[#64748B]'>
                    No retreats found
                  </td>
                </tr>
              ) : (
                retreats.map(retreat => (
                  <tr key={retreat._id} className='hover:bg-[#F8F9FC]'>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {new Date(retreat.createdAt).toLocaleString('en-GB', {
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
                            src={retreat.image || '/images/placeholder.png'}
                            alt={retreat.name}
                            fill
                            className='object-cover'
                          />
                        </div>
                        <span className='text-sm font-medium text-[#1E293B]'>
                          {retreat.name}
                        </span>
                      </div>
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {retreat.location}
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center gap-1 text-sm'>
                        <span className='font-semibold text-[#0066FF] underline cursor-pointer hover:text-[#0052CC]'>
                          {retreat.bookingsCount}
                        </span>
                        <span className='font-medium text-[#0066FF] cursor-pointer hover:text-[#0052CC]'>
                          (View List)
                        </span>
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          retreat.isActive
                            ? 'border-[#22C55E] text-[#22C55E]'
                            : 'border-[#EF4444] text-[#EF4444]'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            retreat.isActive ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        ></span>
                        {retreat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='py-4 px-6 text-right relative'>
                      <button
                        onClick={e => toggleDropdown(e, retreat._id)}
                        className='rounded-lg p-2 text-[#94A3B8] hover:bg-gray-100 hover:text-[#1E293B]'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>

                      {activeDropdown === retreat._id && (
                        <div
                          ref={dropdownRef}
                          className='absolute right-6 top-12 z-10 w-56 rounded-xl border border-[#E1E6F7] bg-white p-1.5 shadow-lg'
                        >
                          <button
                            onClick={() =>
                              router.push(
                                `/team-bonding-retreat/edit/${retreat._id}`
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
                                `/team-bonding-retreat/bookings/${retreat._id}`
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
                                `/team-bonding-retreat/team-bonding-retreat-session/${retreat._id}`
                              )
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            View/Edit Session
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() => handleDelete(retreat._id)}
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#EF4444] hover:bg-[#FFF0F0] hover:text-[#EF4444]'
                          >
                            Delete
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              handleStatusChange(retreat._id, true)
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            Active
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              handleStatusChange(retreat._id, false)
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
                  Delete this retreat?
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
