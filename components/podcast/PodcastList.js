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
  CreditCard
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'

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

const TableHeaderCell = ({ children }) => (
  <div className='flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[#8A92AC] whitespace-nowrap'>
    {children}
    <TbCaretUpDownFilled className='h-3 w-3 text-[#CBCFE2]' />
  </div>
)

const StatusBadge = ({ status }) => {
  const styles = {
    Done: 'bg-green-50 text-green-700 border-green-200',
    Ongoing: 'bg-orange-50 text-orange-700 border-orange-200',
    Upcoming: 'bg-red-50 text-red-700 border-red-200'
  }

  const dots = {
    Done: 'bg-green-500',
    Ongoing: 'bg-orange-500',
    Upcoming: 'bg-red-500'
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
        styles[status] || styles.Upcoming
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.Upcoming}`}
      />
      {status}
    </span>
  )
}

export default function PodcastList () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)

  // Mock Data
  const metrics = {
    totalPodcasts: 1155,
    activePodcasts: 1137,
    inactivePodcasts: 299,
    totalSubscribers: 1155,
    revenue: { count: 865, amount: '₦10,00,000' },
    expiring: { count: 299, amount: '₦2,00,000' }
  }

  const podcasts = [
    {
      id: 1,
      addedOn: 'Sat, 12 June 2025, 10:00 AM',
      name: 'Mind Over Hustle',
      image:
        'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=100&h=100&fit=crop',
      host: 'Alex Morgan',
      type: 'Audio',
      duration: '2-4 hours',
      status: 'Done'
    },
    {
      id: 2,
      addedOn: 'Sat, 12 June 2025, 10:00 AM',
      name: 'The Wellness Room',
      image:
        'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop',
      host: 'Alex Morgan',
      type: 'Episode',
      duration: '2-4 hours',
      status: 'Ongoing'
    },
    {
      id: 3,
      addedOn: 'Sat, 12 June 2025, 10:00 AM',
      name: 'Tech Tomorrow',
      image:
        'https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=100&h=100&fit=crop',
      host: 'Alex Morgan',
      type: 'Episode',
      duration: '2-4 hours',
      status: 'Upcoming'
    }
  ]

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

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
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
            <button className='flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-visible'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Added On</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Podcast Name</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Host</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Podcast</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Duration</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Status</TableHeaderCell>
                </th>
                <th className='px-6 py-4'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {podcasts.map(podcast => (
                <tr key={podcast.id} className='hover:bg-gray-50/50'>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {podcast.addedOn}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3'>
                      <div className='relative h-10 w-10 overflow-hidden rounded-lg'>
                        <Image
                          src={podcast.image}
                          alt={podcast.name}
                          fill
                          className='object-cover'
                          unoptimized={true}
                        />
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
                          <button className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                            <Eye className='h-4 w-4' /> View/Edit Detail
                          </button>
                          <button className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                            <Users className='h-4 w-4' /> View Subscribers
                          </button>
                          <button className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                            <CreditCard className='h-4 w-4' /> View/Edit
                            Subscription
                          </button>
                          <button className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50'>
                            <Trash2 className='h-4 w-4' /> Delete
                          </button>
                          <div className='my-1 border-t border-gray-100' />
                          <button className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                            <UserCheck className='h-4 w-4' /> Active
                          </button>
                          <button className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                            <UserX className='h-4 w-4' /> Inactive
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
