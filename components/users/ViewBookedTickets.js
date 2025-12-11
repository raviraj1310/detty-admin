'use client'

import { useEffect, useState } from 'react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { getAllBookings } from '@/services/users/user.service'

const toDateString = d => {
  const v = d && typeof d === 'object' && d.$date ? d.$date : d
  try {
    return v ? new Date(v).toLocaleString() : '-'
  } catch {
    return '-'
  }
}

const formatCurrency = n => {
  const num = typeof n === 'number' ? n : Number(n || 0)
  if (Number.isNaN(num)) return '-'
  return `₦${num.toLocaleString()}`
}

const mapEventBookings = arr => {
  const list = Array.isArray(arr) ? arr : []
  return list.map(b => {
    const id = b?._id || b?.id || b?.bookingId
    const date = b?.createdAt || b?.eventId?.eventStartDate || b?.updatedAt
    const eventName = b?.eventId?.eventName || b?.eventName || '-'
    const type = b?.tickets?.[0]?.ticketType || '-'
    const amount = Array.isArray(b?.tickets)
      ? b.tickets.reduce((sum, t) => sum + (Number(t?.totalPrice || 0) || 0), 0)
      : Number(b?.totalAmount || b?.amount || b?.total || 0) || '-'
    const status = b?.status || b?.bookingStatus || '-'
    const paymentStatus = b?.paymentStatus || '-'
    let ticketsBooked = ''
    if (Array.isArray(b?.tickets) && b.tickets.length) {
      ticketsBooked = b.tickets
        .map(
          t =>
            `${t.quantity || 0} x ${t.ticketName || '-'} (${formatCurrency(
              t.perTicketPrice
            )})`
        )
        .join(' | ')
    } else {
      ticketsBooked = b?.ticketsBooked || '-'
    }
    return {
      id: String(id || Math.random()),
      eventDate: toDateString(date),
      eventName,
      type,
      ticketsBooked,
      additionalInfo: '',
      amount:
        typeof amount === 'number'
          ? formatCurrency(amount)
          : String(amount || '-'),
      status: String(status || '-'),
      paymentStatus: String(paymentStatus || '-')
    }
  })
}

const mapActivityBookings = arr => {
  const list = Array.isArray(arr) ? arr : []
  return list.map(b => {
    const id = b?._id || b?.id || b?.bookingId
    const date = b?.arrivalDate || b?.createdAt || b?.updatedAt
    const activityName = b?.activityId?.activityName || b?.activityName || '-'
    const type = b?.tickets?.[0]?.ticketType || '-'
    const amount = Array.isArray(b?.tickets)
      ? b.tickets.reduce((sum, t) => sum + (Number(t?.totalPrice || 0) || 0), 0)
      : Number(b?.totalAmount || b?.amount || b?.total || 0) || '-'
    const status = b?.status || b?.activityStatus || b?.bookingStatus || '-'
    const paymentStatus = b?.paymentStatus || '-'
    let ticketsBooked = ''
    if (Array.isArray(b?.tickets) && b.tickets.length) {
      ticketsBooked = b.tickets
        .map(
          t =>
            `${t.quantity || 0} x ${t.ticketName || '-'} (${formatCurrency(
              t.perTicketPrice
            )})`
        )
        .join(' | ')
    } else {
      ticketsBooked = b?.ticketsBooked || '-'
    }
    return {
      id: String(id || Math.random()),
      eventDate: toDateString(date),
      activityName,
      type,
      ticketsBooked,
      additionalInfo: '',
      amount:
        typeof amount === 'number'
          ? formatCurrency(amount)
          : String(amount || '-'),
      status: String(status || '-'),
      paymentStatus: String(paymentStatus || '-')
    }
  })
}

const mapMerchBookings = arr => {
  const list = Array.isArray(arr) ? arr : []
  return list.map(m => {
    const id = m?.orderId || m?._id || m?.id
    const date = m?.createdAt || m?.updatedAt
    const itemsText = Array.isArray(m?.items)
      ? m.items
          .map(
            it =>
              `${it.quantity || 0} x ${it.size || ''} (${formatCurrency(
                it.price
              )})`
          )
          .join(' | ')
      : '-'
    const amount = Number(m?.totalAmount || 0)
    const status = m?.status || '-'
    return {
      id: String(id || Math.random()),
      eventDate: toDateString(date),
      orderId: String(m?.orderId || '-'),
      itemsText,
      amount: formatCurrency(amount),
      status: String(status || '-')
    }
  })
}

export default function ViewBookedTickets ({ userId }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('event')
  const [events, setEvents] = useState([])
  const [activities, setActivities] = useState([])
  const [merch, setMerch] = useState([])
  const [loadingTab, setLoadingTab] = useState('')
  const [errorTab, setErrorTab] = useState('')

  const loadEvents = async () => {
    setLoadingTab('event')
    setErrorTab('')
    try {
      const res = await getAllBookings(userId)
      const payload = res?.data || res || {}
      const list = Array.isArray(payload?.event) ? payload.event : []
      setEvents(mapEventBookings(list))
    } catch {
      setEvents([])
      setErrorTab('Failed to load event bookings')
    } finally {
      setLoadingTab('')
    }
  }

  const loadActivities = async () => {
    setLoadingTab('activities')
    setErrorTab('')
    try {
      const res = await getAllBookings(userId)
      const payload = res?.data || res || {}
      const list = Array.isArray(payload?.activity) ? payload.activity : []
      setActivities(mapActivityBookings(list))
    } catch {
      setActivities([])
      setErrorTab('Failed to load activity bookings')
    } finally {
      setLoadingTab('')
    }
  }

  const loadMerch = async () => {
    setLoadingTab('merch')
    setErrorTab('')
    try {
      const res = await getAllBookings(userId)
      const payload = res?.data || res || {}
      const list = Array.isArray(payload?.merchandise)
        ? payload.merchandise
        : []
      setMerch(mapMerchBookings(list))
    } catch {
      setMerch([])
      setErrorTab('Failed to load merchandise orders')
    } finally {
      setLoadingTab('')
    }
  }

  useEffect(() => {
    if (!userId) return
    if (activeTab === 'event') {
      if (events.length === 0) loadEvents()
    } else {
      if (activeTab === 'activities') {
        if (activities.length === 0) loadActivities()
      } else if (activeTab === 'merch') {
        if (merch.length === 0) loadMerch()
      }
    }
  }, [activeTab, userId, events.length, activities.length, merch.length])

  const filteredEvents = events.filter(event => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    const termDigits = term.replace(/[^0-9]/g, '')
    const name = String(event.eventName || '').toLowerCase()
    const type = String(event.type || '').toLowerCase()
    const dateStr = String(event.eventDate || '').toLowerCase()
    const dateDigits = String(event.eventDate || '').replace(/[^0-9]/g, '')
    const matchesText =
      name.includes(term) || type.includes(term) || dateStr.includes(term)
    const matchesDigits = termDigits && dateDigits.includes(termDigits)
    return matchesText || matchesDigits
  })

  const filteredActivities = activities.filter(activity => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    const termDigits = term.replace(/[^0-9]/g, '')
    const name = String(activity.activityName || '').toLowerCase()
    const type = String(activity.type || '').toLowerCase()
    const dateStr = String(activity.eventDate || '').toLowerCase()
    const dateDigits = String(activity.eventDate || '').replace(/[^0-9]/g, '')
    const matchesText =
      name.includes(term) || type.includes(term) || dateStr.includes(term)
    const matchesDigits = termDigits && dateDigits.includes(termDigits)
    return matchesText || matchesDigits
  })

  const filteredMerch = merch.filter(order => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    const termDigits = term.replace(/[^0-9]/g, '')
    const orderId = String(order.orderId || '').toLowerCase()
    const status = String(order.status || '').toLowerCase()
    const dateStr = String(order.eventDate || '').toLowerCase()
    const dateDigits = String(order.eventDate || '').replace(/[^0-9]/g, '')
    const matchesText =
      orderId.includes(term) ||
      status.includes(term) ||
      dateStr.includes(term) ||
      String(order.itemsText || '')
        .toLowerCase()
        .includes(term)
    const matchesDigits = termDigits && dateDigits.includes(termDigits)
    return matchesText || matchesDigits
  })

  return (
    <div className='bg-gray-200 p-5 rounded-xl'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='p-4 border-b border-gray-200'>
          <div className='flex justify-between items-center mb-3'>
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
                  className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500'
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
          <div className='flex space-x-2 mt-3'>
            <button
              onClick={() => {
                setActiveTab('event')
                if (userId) {
                  loadEvents()
                } else {
                  setErrorTab('User ID is missing')
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                activeTab === 'event'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Event
            </button>
            <button
              onClick={() => {
                setActiveTab('activities')
                if (userId) {
                  loadActivities()
                } else {
                  setErrorTab('User ID is missing')
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                activeTab === 'activities'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Places to Visit
            </button>
            <button
              onClick={() => {
                setActiveTab('merch')
                if (userId) {
                  loadMerch()
                } else {
                  setErrorTab('User ID is missing')
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                activeTab === 'merch'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Merchandise
            </button>
          </div>
        </div>

        {activeTab === 'event' ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Event Date</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Event Name</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Type</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Tickets Booked</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Amount</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Payment Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {errorTab && activeTab === 'event' && events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {errorTab}
                    </td>
                  </tr>
                ) : loadingTab === 'event' ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map(event => (
                    <tr
                      key={event.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {event.eventDate}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900 leading-tight'>
                          {event.eventName}
                        </div>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='text-sm font-medium text-gray-900'>
                          {event.type}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        <div>{event.ticketsBooked}</div>
                        {event.additionalInfo && (
                          <div className='text-xs text-gray-500'>
                            {event.additionalInfo}
                          </div>
                        )}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='text-sm font-semibold text-gray-900'>
                          {event.amount}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {event.status}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {event.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'activities' ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Added On</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Activity Name</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Type</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Tickets Booked</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Amount</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Payment Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {errorTab &&
                activeTab === 'activities' &&
                activities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {errorTab}
                    </td>
                  </tr>
                ) : loadingTab === 'activities' ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredActivities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map(activity => (
                    <tr
                      key={activity.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {activity.eventDate}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900 leading-tight'>
                          {activity.activityName}
                        </div>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='text-sm font-medium text-gray-900'>
                          {activity.type}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        <div>{activity.ticketsBooked}</div>
                        {activity.additionalInfo && (
                          <div className='text-xs text-gray-500'>
                            {activity.additionalInfo}
                          </div>
                        )}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='text-sm font-semibold text-gray-900'>
                          {activity.amount}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {activity.status}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {activity.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Added On</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Order ID</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Items</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Amount</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {errorTab && activeTab === 'merch' && merch.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {errorTab}
                    </td>
                  </tr>
                ) : loadingTab === 'merch' ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredMerch.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No merchandise orders found
                    </td>
                  </tr>
                ) : (
                  filteredMerch.map(order => (
                    <tr
                      key={order.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {order.eventDate}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900 leading-tight'>
                          {order.orderId}
                        </div>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        <div>{order.itemsText}</div>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='text-sm font-semibold text-gray-900'>
                          {order.amount}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
