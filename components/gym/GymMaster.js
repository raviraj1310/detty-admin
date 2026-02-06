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
  ChevronDown
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'

const metricCards = [
  {
    id: 'total-gym',
    title: 'Total Gym',
    value: '1155',
    icon: Dumbbell,
    bg: 'bg-[#E8EEFF]',
    textColor: 'text-indigo-600',
    iconBg: 'bg-white'
  },
  {
    id: 'active-gym',
    title: 'Active Gym',
    value: '1137',
    icon: CheckCircle,
    bg: 'bg-[#E8F8F0]',
    textColor: 'text-emerald-600',
    iconBg: 'bg-white'
  },
  {
    id: 'inactive-gym',
    title: 'Inactive Gym',
    value: '299',
    icon: MinusCircle,
    bg: 'bg-[#FFE8E8]',
    textColor: 'text-red-600',
    iconBg: 'bg-white'
  },
  {
    id: 'total-bookings',
    title: 'Total Bookings',
    value: '1155',
    icon: User,
    bg: 'bg-[#F3E8FF]',
    textColor: 'text-purple-600',
    iconBg: 'bg-white'
  },
  {
    id: 'revenue',
    title: 'Revenue',
    value: '865(₦10,00,000)',
    icon: Wallet,
    bg: 'bg-[#E0F2F1]',
    textColor: 'text-teal-700',
    iconBg: 'bg-white'
  },
  {
    id: 'cancelled',
    title: 'Cancelled Bookings',
    value: '299(₦2,00,000)',
    icon: XCircle,
    bg: 'bg-[#FCE4EC]',
    textColor: 'text-pink-600',
    iconBg: 'bg-white'
  }
]

const MOCK_DATA = [
  {
    id: 1,
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    gymName: 'Elevate Fitness Club',
    image: '/images/gym-1.jpg',
    location: 'Ikoyi, Lagos',
    bookings: 100,
    status: 'Active'
  },
  {
    id: 2,
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    gymName: 'ProActive Gym',
    image: '/images/gym-2.jpg',
    location: 'Ikoyi, Lagos',
    bookings: 100,
    status: 'Active'
  },
  {
    id: 3,
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    gymName: 'Flex Fitness',
    image: '/images/gym-3.jpg',
    location: 'Ikoyi, Lagos',
    bookings: 100,
    status: 'Inactive'
  },
  {
    id: 4,
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    gymName: 'Prime Strength Gym',
    image: '/images/gym-4.jpg',
    location: 'Ikoyi, Lagos',
    bookings: 100,
    status: 'Active'
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
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [dropdownPos, setDropdownPos] = useState({})
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }

    const handleScroll = () => {
      setActiveDropdown(null)
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
    if (status === 'Active')
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    return 'bg-red-50 text-red-600 border border-red-200'
  }

  return (
    <div className='space-y-6 py-4 px-6'>
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
        {metricCards.map(card => {
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
            <button className='flex h-9 items-center gap-2 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-slate-700 hover:bg-gray-50'>
              Filters
              <IoFilterSharp className='h-3.5 w-3.5' />
            </button>
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
              {MOCK_DATA.map(gym => (
                <tr key={gym.id} className='group hover:bg-gray-50'>
                  <td className='py-3 px-4 text-xs text-gray-500'>
                    {gym.addedOn}
                  </td>
                  <td className='py-3 px-4'>
                    <div className='flex items-center gap-3'>
                      <div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100'>
                        {/* Use a placeholder div if image fails, or Next Image */}
                        <div className='flex h-full w-full items-center justify-center bg-slate-200 text-xs font-medium text-slate-500'>
                          IMG
                        </div>
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
                    <div className='flex items-center gap-1 text-xs'>
                      <span className='font-semibold text-indigo-600 underline'>
                        {gym.bookings}
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
                          gym.status === 'Active'
                            ? 'bg-emerald-500'
                            : 'bg-red-500'
                        }`}
                      />
                      {gym.status}
                    </span>
                  </td>
                  <td className='relative py-3 px-4 text-right'>
                    <button
                      onClick={e => handleDropdownClick(e, gym.id)}
                      className='rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </button>

                    {activeDropdown === gym.id && (
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
                        <button className='flex w-full items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'>
                          View/Edit Detail
                        </button>
                        <div className='my-1 h-px bg-gray-100' />
                        <button
                          onClick={() => router.push(`/gym/bookings/${gym.id}`)}
                          className='flex w-full items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                        >
                          View Bookings
                        </button>
                        <div className='my-1 h-px bg-gray-100' />

                        <button
                          onClick={() => handleEditGymAccess(gym.id)}
                          className='flex w-full items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'
                        >
                          View/Edit Gym Access
                        </button>

                        <div className='my-1 h-px bg-gray-100' />
                        <button className='flex w-full items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'>
                          Delete
                        </button>
                        <div className='my-1 h-px bg-gray-100' />
                        <button className='flex w-full items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'>
                          Active
                        </button>
                        <div className='my-1 h-px bg-gray-100' />
                        <button className='flex w-full items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50'>
                          Inactive
                        </button>
                      </div>
                    )}
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
