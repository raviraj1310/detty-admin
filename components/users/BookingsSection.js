'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const bookingData = []

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
  return base ? `${base}/${path}` : s
}

function ActionDropdown ({ bookingId }) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef(null)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })

  const actions = [
    { label: 'View Detail' },
    { label: 'View Tickets' },
    { label: 'Edit Booking' }
  ]

  const handleButtonClick = e => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const dropdownHeight = 180
      let top = rect.bottom + 8
      let right = window.innerWidth - rect.right
      if (top + dropdownHeight > windowHeight) {
        top = rect.top - dropdownHeight - 8
      }
      setButtonPosition({ top, right })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className='relative'>
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className='p-1 hover:bg-gray-100 rounded-full transition-colors'
      >
        <svg
          className='w-5 h-5 text-gray-600'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-[1000]'
            onClick={() => setIsOpen(false)}
          />
          <div
            className='fixed w-48 bg-white rounded-lg shadow-2xl border border-gray-200 z-[1001]'
            style={{
              top: `${buttonPosition.top}px`,
              right: `${buttonPosition.right}px`
            }}
          >
            {actions.map((action, index) => (
              <button
                key={index}
                className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                onClick={() => setIsOpen(false)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: true },
  { id: 'event', label: 'Event', active: true },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: false },
  { id: 'accommodation', label: 'Accommodation', active: false },
  { id: 'med-plus', label: 'Med Plus', active: false },
  { id: 'royal-concierge', label: 'Royal Concierge', active: false },
  { id: 'rides', label: 'Rides', active: false },
  { id: 'leadway', label: 'Leadway', active: false }
  // { id: 'diy', label: 'DIY', active: false },
]

export default function Bookings () {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('event')
  const router = useRouter()

  const handleTabClick = tabId => {
    switch (tabId) {
      case 'bundle-orders':
        router.push('/users/bookings')
        break
      case 'event':
        router.push('/users/transactions')
        break
      case 'activities':
        router.push('/users/activities')
        break
      case 'accommodation':
        router.push('/users/accommodation')
        break
      case 'diy':
        router.push('/users/diy')
        break
      case 'merchandise':
        router.push('/users/merchandise')
        break
      case 'e-sim':
        router.push('/users/e-sim')
        break
      case 'med-plus':
        router.push('/med-orders')
        break
      case 'royal-concierge':
        router.push('/royal-concierge')
        break
      case 'rides':
        router.push('/users/rides')
        break
      case 'leadway':
        router.push('/leadway')
        break
      default:
        setActiveTab(tabId)
    }
  }

  const filteredBookings = bookingData.filter(booking =>
    booking.bundleName.toLowerCase().includes(searchTerm.toLowerCase())
  )
}

return (
  <div className='p-4 h-full flex flex-col bg-white'>
    <div className='mb-4'>
      <h1 className='text-xl font-bold text-gray-900 mb-1'>Bookings</h1>
      <nav className='text-sm text-gray-500'>
        <span>Dashboard</span> / <span>Users</span>
      </nav>
    </div>

    <div className='bg-gray-200 p-5 rounded-xl'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='p-4 border-b border-gray-200'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Booking List
            </h2>
            <div className='flex items-center space-x-4'>
              <div className='relative'>
                <input
                  type='text'
                  placeholder='Search'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900'
                />
                <svg
                  className='w-5 h-5 text-gray-600 absolute left-3 top-2.5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className='flex flex-wrap gap-2'>
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
                  tab.id === activeTab
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  Added On
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  Bundle Name
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  Tickets Booked
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  Amount
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  Status
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                  Payment Status
                </th>
                <th className='px-8 py-3 text-right text-xs font-medium text-gray-500 uppercase w-20'></th>
              </tr>
            </thead>

            <tbody className='bg-white divide-y divide-gray-200'>
              {filteredBookings.length > 0 ? (
                filteredBookings.map(booking => (
                  <tr key={booking.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {booking.addedOn}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <img
                          src={
                            toImageSrc(
                              booking?.eventImage ||
                                (booking?.eventId && booking.eventId.image) ||
                                (booking?.event && booking.event.image) ||
                                ''
                            ) || '/images/no-image.webp'
                          }
                          alt='Event image'
                          className='h-12 w-12 rounded-lg object-cover bg-gray-200'
                          onError={e => {
                            e.currentTarget.src = '/images/no-image.webp'
                          }}
                        />
                        <div className='ml-4'>
                          <span className='text-sm font-medium text-gray-900'>
                            {booking.bundleName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className='px-4 py-4 text-sm text-gray-900'>
                      <div>{booking.ticketsBooked}</div>
                      <div className='text-xs text-gray-500'>
                        {booking.additionalInfo}
                      </div>
                    </td>

                    <td className='px-4 py-4 whitespace-nowrap'>
                      <span className='text-sm font-semibold text-gray-900'>
                        {booking.amount}
                      </span>
                    </td>

                    <td className='px-4 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'Done'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        • {booking.status}
                      </span>
                    </td>

                    <td className='px-4 py-4 whitespace-nowrap'>
                      <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                        {booking.paymentStatus}
                      </span>
                    </td>

                    <td className='px-8 py-4 whitespace-nowrap text-right relative'>
                      <ActionDropdown bookingId={booking.id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr key='no-booking'>
                  <td
                    colSpan='7'
                    className='px-4 py-4 text-center text-sm text-gray-500'
                  >
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
)
