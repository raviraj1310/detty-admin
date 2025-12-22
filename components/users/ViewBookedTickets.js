'use client'

import { useEffect, useState } from 'react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import * as XLSX from 'xlsx'
import {
  getAllBookings,
  getUserActivityTicketList,
  getMyOrders,
  getMyESimOrders,
  getMyStayBookings,
  getMyMedOrders,
  myRoyalBookings,
  getMyRideBookings,
  getMyLeadPlans
} from '@/services/users/user.service'
import { useParams, useSearchParams } from 'next/navigation'

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

const mapEsimBookings = arr => {
  const list = Array.isArray(arr) ? arr : []
  return list.map(b => ({
    id: b?._id || String(Math.random()),
    eventDate: toDateString(b?.createdAt),
    name: 'eSIM/Data Plan',
    amount: formatCurrency(b?.amount || 0),
    status: b?.paymentStatus === 'paid' ? 'Completed' : b?.paymentStatus || '-',
    paymentStatus: b?.paymentStatus || '-'
  }))
}

const mapAccommodationBookings = arr => {
  const list = Array.isArray(arr) ? arr : []
  return list.map(b => ({
    id: b?._id || String(Math.random()),
    eventDate: toDateString(b?.checkInDate),
    hotelName: b?.hotelName || '-',
    roomName: b?.roomName || '-',
    amount: formatCurrency(b?.amount || 0),
    status: b?.paymentStatus || '-',
    paymentStatus: b?.paymentStatus || '-'
  }))
}

const mapMedBookings = arr => {
  const list = Array.isArray(arr) ? arr : []
  return list.map(b => {
    const items = Array.isArray(b?.items) ? b.items : []
    const firstItem = items[0]?.productName || 'Med Plus Order'
    const name = items.length > 1 ? `${items.length} Items` : firstItem
    const amount = items.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 0),
      0
    )

    return {
      id: b?._id || b?.orderKey || String(Math.random()),
      eventDate: toDateString(b?.createdAt),
      name,
      amount: formatCurrency(amount),
      status: b?.status || '-',
      paymentStatus: b?.api_response?.data?.payment_status || '-'
    }
  })
}

const mapRoyalBookings = arr => {
  const list = Array.isArray(arr) ? arr : []
  return list.map(b => ({
    id: b?._id || b?.transactionId || String(Math.random()),
    eventDate: toDateString(b?.createdAt),
    tier: b?.serviceDetails?.tier || '-',
    flightNumber: b?.serviceDetails?.flight_number || '-',
    amount: formatCurrency(b?.financials?.rcs_line_item_value || 0),
    status: b?.rcStatus || b?.status || '-',
    paymentStatus: b?.status === 'created' ? 'Paid' : b?.status || '-'
  }))
}

const mapRideBookings = arr => {
  const list = Array.isArray(arr) ? arr : []
  return list.map(b => ({
    id: b?._id || String(Math.random()),
    eventDate: toDateString(b?.createdAt),
    name: b?.name || 'Ride',
    amount: formatCurrency(b?.price || 0),
    status: b?.status || '-',
    paymentStatus: b?.paymentStatus || '-'
  }))
}

const mapLeadwayBookings = arr => {
  const list = Array.isArray(arr) ? arr : []
  return list.map(b => ({
    id: b?._id || String(Math.random()),
    eventDate: toDateString(b?.createdAt),
    policyType: b?._scheme_id ? `Scheme ${b._scheme_id}` : '-',
    amount: formatCurrency(b?.purchaseAmount || b?.totalPayAmount || 0),
    status: b?.paymentStatus || '-',
    paymentStatus: b?.paymentStatus || '-'
  }))
}

export default function ViewBookedTickets ({ userId, userName }) {
  const searchParams = useSearchParams()
  const params = useParams() || {}
  const routeId = params?.id || ''
  const uid = String(userId || routeId || '').trim()
  const paramName = searchParams?.get('userName') || ''
  const displayName = String(userName || paramName || '').replace(/\+/g, ' ')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('event')
  const [events, setEvents] = useState([])
  const [activities, setActivities] = useState([])
  const [merch, setMerch] = useState([])
  const [esim, setEsim] = useState([])
  const [accommodation, setAccommodation] = useState([])
  const [med, setMed] = useState([])
  const [royal, setRoyal] = useState([])
  const [rides, setRides] = useState([])
  const [leadway, setLeadway] = useState([])
  const [loadingTab, setLoadingTab] = useState('')
  const [errorTab, setErrorTab] = useState('')

  const loadEvents = async () => {
    setLoadingTab('event')
    setErrorTab('')
    try {
      const res = await getAllBookings(uid)
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
      const res = await getUserActivityTicketList(uid)
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : []
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
      const res = await getMyOrders(uid)
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : []
      setMerch(mapMerchBookings(list))
    } catch {
      setMerch([])
      setErrorTab('Failed to load merchandise orders')
    } finally {
      setLoadingTab('')
    }
  }

  const loadEsim = async () => {
    setLoadingTab('esim')
    setErrorTab('')
    try {
      const res = await getMyESimOrders(uid)
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : []
      setEsim(mapEsimBookings(list))
    } catch {
      setEsim([])
      setErrorTab('Failed to load eSIM bookings')
    } finally {
      setLoadingTab('')
    }
  }

  const loadAccommodation = async () => {
    setLoadingTab('accommodation')
    setErrorTab('')
    try {
      const res = await getMyStayBookings(uid)
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : []
      setAccommodation(mapAccommodationBookings(list))
    } catch {
      setAccommodation([])
      setErrorTab('Failed to load accommodation bookings')
    } finally {
      setLoadingTab('')
    }
  }

  const loadMed = async () => {
    setLoadingTab('med')
    setErrorTab('')
    try {
      const res = await getMyMedOrders(uid)
      const list = Array.isArray(res) ? res : []
      setMed(mapMedBookings(list))
    } catch {
      setMed([])
      setErrorTab('Failed to load Med Plus orders')
    } finally {
      setLoadingTab('')
    }
  }

  const loadRoyal = async () => {
    setLoadingTab('royal')
    setErrorTab('')
    try {
      const res = await myRoyalBookings(uid)
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : []
      setRoyal(mapRoyalBookings(list))
    } catch {
      setRoyal([])
      setErrorTab('Failed to load Royal Concierge bookings')
    } finally {
      setLoadingTab('')
    }
  }

  const loadRides = async () => {
    setLoadingTab('rides')
    setErrorTab('')
    try {
      const res = await getMyRideBookings(uid)
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : []
      setRides(mapRideBookings(list))
    } catch {
      setRides([])
      setErrorTab('Failed to load ride bookings')
    } finally {
      setLoadingTab('')
    }
  }

  const loadLeadway = async () => {
    setLoadingTab('leadway')
    setErrorTab('')
    try {
      const res = await getMyLeadPlans(uid)
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : []
      setLeadway(mapLeadwayBookings(list))
    } catch {
      setLeadway([])
      setErrorTab('Failed to load Leadway plans')
    } finally {
      setLoadingTab('')
    }
  }

  useEffect(() => {
    if (!uid) return
    if (activeTab === 'event') {
      if (events.length === 0) loadEvents()
    } else if (activeTab === 'activities') {
      if (activities.length === 0) loadActivities()
    } else if (activeTab === 'merch') {
      if (merch.length === 0) loadMerch()
    } else if (activeTab === 'esim') {
      if (esim.length === 0) loadEsim()
    } else if (activeTab === 'accommodation') {
      if (accommodation.length === 0) loadAccommodation()
    } else if (activeTab === 'med') {
      if (med.length === 0) loadMed()
    } else if (activeTab === 'royal') {
      if (royal.length === 0) loadRoyal()
    } else if (activeTab === 'rides') {
      if (rides.length === 0) loadRides()
    } else if (activeTab === 'leadway') {
      if (leadway.length === 0) loadLeadway()
    }
  }, [
    activeTab,
    uid,
    events.length,
    activities.length,
    merch.length,
    esim.length,
    accommodation.length,
    med.length,
    royal.length,
    rides.length,
    leadway.length
  ])

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

  const filteredEsim = esim.filter(item => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    return (
      String(item.name || '')
        .toLowerCase()
        .includes(term) ||
      String(item.status || '')
        .toLowerCase()
        .includes(term) ||
      String(item.paymentStatus || '')
        .toLowerCase()
        .includes(term) ||
      String(item.eventDate || '')
        .toLowerCase()
        .includes(term)
    )
  })

  const filteredAccommodation = accommodation.filter(item => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    return (
      String(item.hotelName || '')
        .toLowerCase()
        .includes(term) ||
      String(item.roomName || '')
        .toLowerCase()
        .includes(term) ||
      String(item.status || '')
        .toLowerCase()
        .includes(term) ||
      String(item.eventDate || '')
        .toLowerCase()
        .includes(term)
    )
  })

  const filteredMed = med.filter(item => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    return (
      String(item.name || '')
        .toLowerCase()
        .includes(term) ||
      String(item.status || '')
        .toLowerCase()
        .includes(term) ||
      String(item.eventDate || '')
        .toLowerCase()
        .includes(term)
    )
  })

  const filteredRoyal = royal.filter(item => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    return (
      String(item.tier || '')
        .toLowerCase()
        .includes(term) ||
      String(item.flightNumber || '')
        .toLowerCase()
        .includes(term) ||
      String(item.status || '')
        .toLowerCase()
        .includes(term) ||
      String(item.eventDate || '')
        .toLowerCase()
        .includes(term)
    )
  })

  const filteredRides = rides.filter(item => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    return (
      String(item.name || '')
        .toLowerCase()
        .includes(term) ||
      String(item.status || '')
        .toLowerCase()
        .includes(term) ||
      String(item.eventDate || '')
        .toLowerCase()
        .includes(term)
    )
  })

  const filteredLeadway = leadway.filter(item => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    return (
      String(item.policyType || '')
        .toLowerCase()
        .includes(term) ||
      String(item.status || '')
        .toLowerCase()
        .includes(term) ||
      String(item.eventDate || '')
        .toLowerCase()
        .includes(term)
    )
  })

  const tabs = [
    { id: 'event', label: 'Events' },
    { id: 'activities', label: 'Places to Visit' },
    { id: 'merch', label: 'Merchandise' },
    { id: 'esim', label: 'Internet Connectivity' },
    { id: 'accommodation', label: 'Accommodation' },
    { id: 'med', label: 'Med Plus' },
    { id: 'royal', label: 'Royal Concierge' },
    { id: 'rides', label: 'Rides' },
    { id: 'leadway', label: 'Leadway' }
  ]

  const handleExportAll = async () => {
    if (!uid) return
    const wb = XLSX.utils.book_new()
    try {
      const resEvents = await getAllBookings(uid)
      const eventsList = Array.isArray(resEvents?.data?.event)
        ? resEvents.data.event
        : Array.isArray(resEvents?.event)
        ? resEvents.event
        : []
      const eventsRows = (eventsList || []).map(b => {
        const ticketsText = Array.isArray(b?.tickets)
          ? b.tickets
              .map(
                t =>
                  `${t.quantity || 0} x ${
                    t.ticketName || '-'
                  } (${formatCurrency(t.perTicketPrice)})`
              )
              .join(' | ')
          : '-'
        return {
          'Event Date': toDateString(b?.createdAt || b?.arrivalDate),
          'Event Name': b?.eventId?.eventName || b?.eventName || '-',
          Type:
            Array.isArray(b?.tickets) && b.tickets[0]?.ticketType
              ? b.tickets[0].ticketType
              : '-',
          Quantity: b?.quantity ?? '-',
          'Tickets Booked': ticketsText,
          'Order ID': b?.orderId || '-',
          'Transaction Ref': b?.transactionRef || '-',
          'Payment Status': b?.paymentStatus || '-',
          'Service Fee':
            typeof b?.pricing?.serviceFee === 'number'
              ? formatCurrency(b.pricing.serviceFee)
              : '-',
          'Total Amount':
            typeof b?.totalAmount === 'number'
              ? formatCurrency(b.totalAmount)
              : '-',
          'Final Payable':
            typeof b?.finalPayableAmount === 'number'
              ? formatCurrency(b.finalPayableAmount)
              : '-'
        }
      })
      if (eventsRows.length) {
        const ws = XLSX.utils.json_to_sheet(eventsRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Event Booking Details')
      }
    } catch {}
    try {
      const resActivities = await getUserActivityTicketList(uid)
      const activitiesList = Array.isArray(resActivities)
        ? resActivities
        : Array.isArray(resActivities?.data)
        ? resActivities.data
        : []
      const activitiesRows = (activitiesList || []).map(b => {
        const ticketsText = Array.isArray(b?.tickets)
          ? b.tickets
              .map(
                t =>
                  `${t.quantity || 0} x ${
                    t.ticketName || '-'
                  } (${formatCurrency(t.perTicketPrice)})`
              )
              .join(' | ')
          : '-'
        const totalTicketsAmount = Array.isArray(b?.tickets)
          ? b.tickets.reduce(
              (sum, t) => sum + (Number(t?.totalPrice || 0) || 0),
              0
            )
          : null
        return {
          'Added On': toDateString(b?.createdAt || b?.arrivalDate),
          'Activity Name':
            b?.activityId?.activityName || b?.activityName || '-',
          Location: b?.activityId?.location || '-',
          Type:
            Array.isArray(b?.tickets) && b.tickets[0]?.ticketType
              ? b.tickets[0].ticketType
              : '-',
          Quantity: b?.quantity ?? '-',
          'Tickets Booked': ticketsText,
          'Order ID': b?.orderId || '-',
          'Transaction Ref': b?.transactionRef || '-',
          'Payment Status': b?.paymentStatus || '-',
          'Service Fee':
            typeof b?.pricing?.serviceFee === 'number'
              ? formatCurrency(b.pricing.serviceFee)
              : '-',
          'Total Amount':
            typeof totalTicketsAmount === 'number'
              ? formatCurrency(totalTicketsAmount)
              : '-',
          'Final Payable':
            typeof b?.finalPayableAmount === 'number'
              ? formatCurrency(b.finalPayableAmount)
              : '-',
          Website: b?.activityId?.websiteLink || '-'
        }
      })
      if (activitiesRows.length) {
        const ws = XLSX.utils.json_to_sheet(activitiesRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Activity Booking Details')
      }
    } catch {}
    try {
      const resMerch = await getMyOrders(uid)
      const merchList = Array.isArray(resMerch)
        ? resMerch
        : Array.isArray(resMerch?.data)
        ? resMerch.data
        : []
      const merchRows = (merchList || []).map(m => {
        const itemsText = Array.isArray(m?.items)
          ? m.items
              .map(it => {
                const title =
                  it?.productId?.title || it?.title || it?.name || '-'
                const category =
                  it?.productId?.categoryId?.title || it?.category?.title || ''
                const qty = Number(it?.quantity || it?.qty || 0)
                const price =
                  typeof it?.price === 'number' ? formatCurrency(it.price) : '-'
                const size = it?.size ? `, Size: ${it.size}` : ''
                const cat = category ? ` [${category}]` : ''
                return `${qty} x ${title}${cat} (${price}${size})`
              })
              .join(' | ')
          : '-'
        return {
          'Added On': toDateString(m?.createdAt),
          'Order ID': m?.orderId || '-',
          Items: itemsText,
          'Shipping Address': m?.shippingAddress || '-',
          'Billing Address': m?.billingAddress || '-',
          'Service Fee':
            typeof m?.serviceFee === 'number'
              ? formatCurrency(m.serviceFee)
              : '-',
          'Shipping Charge':
            typeof m?.shippingCharge === 'number'
              ? formatCurrency(m.shippingCharge)
              : '-',
          Discount:
            typeof m?.discount === 'number' ? formatCurrency(m.discount) : '-',
          'Total Amount':
            typeof m?.totalAmount === 'number'
              ? formatCurrency(m.totalAmount)
              : '-',
          Status: m?.status || '-',
          'Transaction Ref': m?.transactionRef || m?.transacionId || '-'
        }
      })
      if (merchRows.length) {
        const ws = XLSX.utils.json_to_sheet(merchRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Merchandise Orders')
      }
    } catch {}
    try {
      const resEsim = await getMyESimOrders(uid)
      const esimList = Array.isArray(resEsim)
        ? resEsim
        : Array.isArray(resEsim?.data)
        ? resEsim.data
        : []
      const esimRows = (esimList || []).map(b => ({
        Date: toDateString(b?.createdAt),
        Reference: b?.reference || '-',
        Amount: typeof b?.amount === 'number' ? formatCurrency(b.amount) : '-',
        'Final Payable':
          typeof b?.finalPayableAmount === 'number'
            ? formatCurrency(b.finalPayableAmount)
            : '-',
        'Payment Status': b?.paymentStatus || '-',
        'Wallet Funds':
          typeof b?.userId?.walletFunds === 'number'
            ? formatCurrency(b.userId.walletFunds)
            : '-'
      }))
      if (esimRows.length) {
        const ws = XLSX.utils.json_to_sheet(esimRows)
        XLSX.utils.book_append_sheet(wb, ws, 'eSIM/Data Plans')
      }
    } catch {}
    try {
      const resAcc = await getMyStayBookings(uid)
      const accList = Array.isArray(resAcc)
        ? resAcc
        : Array.isArray(resAcc?.data)
        ? resAcc.data
        : []
      const accRows = (accList || []).map(b => ({
        'Check-in': toDateString(b?.checkInDate),
        'Check-out': toDateString(b?.checkOutDate),
        Hotel: b?.hotelName || '-',
        Room: b?.roomName || '-',
        'No. of Rooms': b?.noOfRooms ?? '-',
        Guests: b?.guests ?? '-',
        Amount: typeof b?.amount === 'number' ? formatCurrency(b.amount) : '-',
        'Final Payable':
          typeof b?.finalPayableAmount === 'number'
            ? formatCurrency(b.finalPayableAmount)
            : '-',
        'Transaction Ref': b?.transactionRef || b?.transactionId || '-',
        'Payment Status': b?.paymentStatus || '-'
      }))
      if (accRows.length) {
        const ws = XLSX.utils.json_to_sheet(accRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Accommodation Bookings')
      }
    } catch {}
    try {
      const resMed = await getMyMedOrders(uid)
      const medList = Array.isArray(resMed) ? resMed : []
      const medRows = (medList || []).map(b => {
        const itemsText = Array.isArray(b?.items)
          ? b.items
              .map(it => {
                const qty = Number(it?.qty || 0)
                const name = it?.productName || '-'
                const price =
                  typeof it?.price === 'number' ? formatCurrency(it.price) : '-'
                const barcode = it?.barcode ? ` [${it.barcode}]` : ''
                return `${qty} x ${name}${barcode} (${price})`
              })
              .join(' | ')
          : '-'
        const shipAddr = b?.api_response?.data?.shipping_address
        const shippingAddress = shipAddr
          ? [shipAddr.address, shipAddr.city, shipAddr.state, shipAddr.country]
              .filter(Boolean)
              .join(', ')
          : '-'
        return {
          Date: toDateString(b?.createdAt || b?.api_response?.data?.created_at),
          'Order Key': b?.orderKey || '-',
          Items: itemsText,
          'Shipping Method':
            b?.shipping_method || b?.api_response?.data?.delivery_method || '-',
          'Shipping Address': shippingAddress,
          'Store ID': b?.store_id ?? '-',
          Status: b?.status || '-',
          'Order Amount':
            typeof b?.api_response?.data?.order_amount === 'number'
              ? formatCurrency(b.api_response.data.order_amount)
              : '-',
          'Payment Status': b?.api_response?.data?.payment_status || '-',
          'Payment Method': b?.api_response?.data?.payment_method || '-',
          'Shipping Cost':
            typeof b?.api_response?.data?.shipping_cost === 'number'
              ? formatCurrency(b.api_response.data.shipping_cost)
              : '-',
          'Delivery Method': b?.api_response?.data?.delivery_method || '-'
        }
      })
      if (medRows.length) {
        const ws = XLSX.utils.json_to_sheet(medRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Med Plus Orders')
      }
    } catch {}
    try {
      const resRoyal = await myRoyalBookings(uid)
      const royalList = Array.isArray(resRoyal)
        ? resRoyal
        : Array.isArray(resRoyal?.data)
        ? resRoyal.data
        : []
      const royalRows = (royalList || []).map(b => ({
        Date: toDateString(b?.createdAt || b?.serviceDetails?.travel_date),
        Tier: b?.serviceDetails?.tier || '-',
        Flight: b?.serviceDetails?.flight_number || '-',
        'Passenger Count': b?.serviceDetails?.passenger_count ?? '-',
        Currency: b?.financials?.currency || '-',
        Amount:
          typeof b?.financials?.rcs_line_item_value === 'number'
            ? formatCurrency(b.financials.rcs_line_item_value)
            : '-',
        'Remittance Amount':
          typeof b?.financials?.remittance_amount === 'number'
            ? formatCurrency(b.financials.remittance_amount)
            : '-',
        'Marketplace Fee':
          typeof b?.financials?.marketplace_fee === 'number'
            ? formatCurrency(b.financials.marketplace_fee)
            : '-',
        'Final Payable':
          typeof b?.finalPayableAmount === 'number'
            ? formatCurrency(b.finalPayableAmount)
            : '-',
        'RC Booking Ref': b?.rcBookingReference || '-',
        'RC Status': b?.rcStatus || '-',
        'Transaction ID': b?.transactionId || '-',
        Source: b?.source || '-'
      }))
      if (royalRows.length) {
        const ws = XLSX.utils.json_to_sheet(royalRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Royal Concierge')
      }
    } catch {}
    try {
      const resRides = await getMyRideBookings(uid)
      const ridesList = Array.isArray(resRides)
        ? resRides
        : Array.isArray(resRides?.data)
        ? resRides.data
        : []
      const ridesRows = (ridesList || []).map(b => {
        const pg = b?.pickupGeometry || {}
        const dg = b?.dropoffGeometry || {}
        const vehicleOrdersText = Array.isArray(b?.vehicleOrders)
          ? b.vehicleOrders
              .map(vo => {
                const q = vo?.quantity ?? '-'
                const vid = vo?.charter_vehicle_id ?? '-'
                const pa = vo?.pickup_address || '-'
                const da = vo?.dropoff_address || '-'
                return `${q} x Vehicle ${vid} | ${pa} → ${da}`
              })
              .join(' | ')
          : '-'
        return {
          Date: toDateString(b?.createdAt || b?.pickupDate),
          Reference: b?.reference || '-',
          'Pickup Address': b?.pickupAddress || '-',
          'Dropoff Address': b?.dropoffAddress || '-',
          'Pickup Geo':
            pg?.lat != null && pg?.lng != null ? `${pg.lat},${pg.lng}` : '-',
          'Dropoff Geo':
            dg?.lat != null && dg?.lng != null ? `${dg.lat},${dg.lng}` : '-',
          'Pickup Date': toDateString(b?.pickupDate),
          'Pickup Time': b?.pickupTime || '-',
          'Final Payable':
            typeof b?.finalPayableAmount === 'number'
              ? formatCurrency(b.finalPayableAmount)
              : '-',
          'Payment Status': b?.paymentStatus || '-',
          Status: b?.status || '-',
          Tag: b?.tag || '-',
          'Vehicle Orders': vehicleOrdersText
        }
      })
      if (ridesRows.length) {
        const ws = XLSX.utils.json_to_sheet(ridesRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Rides')
      }
    } catch {}
    try {
      const resLead = await getMyLeadPlans(uid)
      const leadList = Array.isArray(resLead)
        ? resLead
        : Array.isArray(resLead?.data)
        ? resLead.data
        : []
      const leadRows = (leadList || []).map(b => ({
        Date: toDateString(b?.createdAt),
        'First Name': b?.firstName || '-',
        Surname: b?.surname || '-',
        'Other Name': b?.otherName || '-',
        DOB: b?.dob_MM_dd_yyyy || '-',
        Gender: b?.gender || '-',
        'Marital Status': b?.maritalStatus || '-',
        Address: b?.address || '-',
        State: b?.state || '-',
        'Scheme ID': b?._scheme_id ?? '-',
        'Enrollee No': b?.enrolleeNo ?? '-',
        'Debit Note No': b?.debiteNoteNo ?? '-',
        'Purchase Amount':
          typeof b?.purchaseAmount === 'number'
            ? formatCurrency(b.purchaseAmount)
            : '-',
        'Total Pay Amount':
          typeof b?.totalPayAmount === 'number'
            ? formatCurrency(b.totalPayAmount)
            : '-',
        'Payment Status': b?.paymentStatus || '-'
      }))
      if (leadRows.length) {
        const ws = XLSX.utils.json_to_sheet(leadRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Leadway')
      }
    } catch {}
    const fn =
      'Bookings_' +
      (displayName ? displayName.replace(/\s+/g, '_') : uid || 'user') +
      '.xlsx'
    XLSX.writeFile(wb, fn)
  }

  return (
    <div className='bg-gray-200 p-5 rounded-xl'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='p-4 border-b border-gray-200'>
          <div className='flex justify-between items-center mb-3'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Booking List - {displayName}
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
              <button
                onClick={handleExportAll}
                className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
              >
                <svg
                  className='w-4 h-4 text-gray-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3'
                  />
                </svg>
                <span className='ml-2 text-gray-700 font-medium'>Export</span>
              </button>
            </div>
          </div>
          <div className='flex space-x-2 mt-3 overflow-x-auto pb-2'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (uid) {
                    if (tab.id === 'event') loadEvents()
                    else if (tab.id === 'activities') loadActivities()
                    else if (tab.id === 'merch') loadMerch()
                    else if (tab.id === 'esim') loadEsim()
                    else if (tab.id === 'accommodation') loadAccommodation()
                    else if (tab.id === 'med') loadMed()
                    else if (tab.id === 'royal') loadRoyal()
                    else if (tab.id === 'rides') loadRides()
                    else if (tab.id === 'leadway') loadLeadway()
                  } else {
                    setErrorTab('User ID is missing')
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
        ) : activeTab === 'merch' ? (
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
        ) : activeTab === 'esim' ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Name
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {errorTab && activeTab === 'esim' && esim.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {errorTab}
                    </td>
                  </tr>
                ) : loadingTab === 'esim' ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredEsim.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredEsim.map(item => (
                    <tr
                      key={item.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {item.eventDate}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {item.name}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900'>
                        {item.amount}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.status}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'accommodation' ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Check-in
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Hotel
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Room
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {errorTab &&
                activeTab === 'accommodation' &&
                accommodation.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {errorTab}
                    </td>
                  </tr>
                ) : loadingTab === 'accommodation' ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredAccommodation.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredAccommodation.map(item => (
                    <tr
                      key={item.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {item.eventDate}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {item.hotelName}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {item.roomName}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900'>
                        {item.amount}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.status}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'med' ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Order
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {errorTab && activeTab === 'med' && med.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {errorTab}
                    </td>
                  </tr>
                ) : loadingTab === 'med' ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredMed.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredMed.map(item => (
                    <tr
                      key={item.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {item.eventDate}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {item.name}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900'>
                        {item.amount}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.status}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'royal' ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Tier
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Flight
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {errorTab && activeTab === 'royal' && royal.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {errorTab}
                    </td>
                  </tr>
                ) : loadingTab === 'royal' ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredRoyal.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredRoyal.map(item => (
                    <tr
                      key={item.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {item.eventDate}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {item.tier}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {item.flightNumber}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900'>
                        {item.amount}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.status}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'rides' ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Name
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {errorTab && activeTab === 'rides' && rides.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {errorTab}
                    </td>
                  </tr>
                ) : loadingTab === 'rides' ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredRides.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  filteredRides.map(item => (
                    <tr
                      key={item.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {item.eventDate}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {item.name}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900'>
                        {item.amount}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.status}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'leadway' ? (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Policy
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {errorTab && activeTab === 'leadway' && leadway.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-red-600'
                    >
                      {errorTab}
                    </td>
                  </tr>
                ) : loadingTab === 'leadway' ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filteredLeadway.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No plans found
                    </td>
                  </tr>
                ) : (
                  filteredLeadway.map(item => (
                    <tr
                      key={item.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {item.eventDate}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                        {item.policyType}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap text-sm font-semibold text-gray-900'>
                        {item.amount}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.status}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
