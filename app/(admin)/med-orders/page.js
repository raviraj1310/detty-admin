'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import {
  TbCaretUpDownFilled,
  TbTicket,
  TbTrendingUp,
  TbTrendingDown
} from 'react-icons/tb'
import { FaChartColumn } from 'react-icons/fa6'
import { getMedOrderList } from '@/services/med/med.service'
import { downloadExcel } from '../../../utils/excelExport'

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: false },
  { id: 'event', label: 'Event', active: false },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: false },
  { id: 'accommodation', label: 'Accommodation', active: false },
  { id: 'med-plus', label: 'Med Plus', active: true },
  { id: 'royal-concierge', label: 'Royal Concierge', active: false },
  { id: 'rides', label: 'Rides', active: false },
  { id: 'leadway', label: 'Leadway', active: false }
  // { id: 'diy', label: 'DIY', active: false },
]

const toCurrency = n => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(Number(n) || 0)
  } catch {
    const x = Number(n) || 0
    return `₦${x.toLocaleString('en-NG')}`
  }
}

const formatDate = iso => {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '-'
  try {
    return d.toLocaleString(undefined, {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return d.toISOString()
  }
}

export default function MedOrdersPage () {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [rowsRaw, setRowsRaw] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState(null)
  const [stats, setStats] = useState({
    yesterdayCount: 0,
    yesterdayDateStr: '',
    avgGrowthCount: 0,
    isCountIncreasing: false,
    avgGrowthPercent: '0%',
    isPctIncreasing: false
  })
  const [limit, setLimit] = useState(50)
  const [pageCount, setPageCount] = useState(1)
  const [page, setPage] = useState(1)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getMedOrderList({
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined
        })

        const d = res
        const yesterdayCount = Number(d.totalPurchasingYesterday || 0)

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayDateStr = yesterday.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })

        const avgGrowthCount = Number(
          d.growthCount ?? d.avgDailyGrowthCount ?? 0
        )
        const gp = d.growthPercent ?? d.avgDailyGrowthPercent ?? '0%'
        const avgGrowthPercentStr =
          typeof gp === 'number' ? `${gp}%` : String(gp)
        const avgGrowthPercentVal = parseFloat(
          avgGrowthPercentStr.replace('%', '')
        )

        setStats({
          yesterdayCount,
          yesterdayDateStr,
          avgGrowthCount,
          isCountIncreasing: avgGrowthCount >= 0,
          avgGrowthPercent: avgGrowthPercentStr,
          isPctIncreasing: avgGrowthPercentVal >= 0
        })

        const payload = res?.data || res || {}
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : []
        setRowsRaw(list)
      } catch {
        setRowsRaw([])
      }
    })()
  }, [dateRange.start, dateRange.end])

  const rows = useMemo(() => {
    const list = Array.isArray(rowsRaw) ? rowsRaw : []
    return list.map(r => {
      const api = r?.api_response?.data || {}
      const amount =
        typeof api?.order_amount === 'number'
          ? api.order_amount
          : Array.isArray(r?.items)
          ? r.items.reduce(
              (sum, it) => sum + Number((it?.price || 0) * (it?.qty || 0)),
              0
            )
          : 0
      const paymentStatusRaw = String(api?.payment_status || '').toLowerCase()
      const paymentStatus =
        paymentStatusRaw === 'paid'
          ? 'Completed'
          : paymentStatusRaw
          ? paymentStatusRaw.charAt(0).toUpperCase() +
            paymentStatusRaw.slice(1).toLowerCase()
          : '-'
      const orderStatusRaw = String(api?.order_status || '').toLowerCase()
      const activityStatus =
        orderStatusRaw === 'confirmed'
          ? 'Done'
          : orderStatusRaw
          ? orderStatusRaw.charAt(0).toUpperCase() +
            orderStatusRaw.slice(1).toLowerCase()
          : 'Ongoing'
      return {
        id: String(r?._id || r?.id || Math.random()),
        orderId: String(r?._id || '-'),
        eventDate: formatDate(r?.createdAt || api?.created_at) || '-',
        amount: toCurrency(amount),
        amountNum: amount,
        activityStatus,
        paymentStatus,
        raw: r
      }
    })
  }, [rowsRaw])

  // Calculate stats client-side if not loaded from API or if filtered
  useEffect(() => {
    if (!rows || rows.length === 0) return

    // If a filter is active, we recalculate based on the filtered range.
    const isFiltered = dateRange.start || dateRange.end

    if (!isFiltered) return

    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayEnd = new Date(yesterday)
    yesterdayEnd.setHours(23, 59, 59, 999)

    const yesterdayDateStr = yesterday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })

    const yesterdayCount = rows.filter(o => {
      const d = new Date(
        o.raw?.createdAt || o.raw?.api_response?.data?.created_at
      )
      return d >= yesterday && d <= yesterdayEnd
    }).length

    // 2. Avg Daily Growth Logic (Filter Aware)
    let start, end, daysCount

    if (dateRange.start) {
      start = new Date(dateRange.start)
      start.setHours(0, 0, 0, 0)
    } else {
      end = new Date(dateRange.end)
      start = new Date(end)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
    }

    if (dateRange.end) {
      end = new Date(dateRange.end)
      end.setHours(23, 59, 59, 999)
    } else {
      end = new Date()
      end.setHours(23, 59, 59, 999)
    }

    if (start > end) {
      end = new Date()
      start = new Date()
      start.setDate(now.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }

    const diffTime = Math.abs(end - start)
    daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (daysCount < 1) daysCount = 1

    const bookingsByDate = {}
    rows.forEach(o => {
      const d = new Date(
        o.raw?.createdAt || o.raw?.api_response?.data?.created_at
      )
      if (isNaN(d.getTime())) return
      if (d >= start && d <= end) {
        const dateKey = d.toISOString().split('T')[0]
        bookingsByDate[dateKey] = (bookingsByDate[dateKey] || 0) + 1
      }
    })

    const dailyData = []
    for (let i = 0; i < daysCount; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateKey = d.toISOString().split('T')[0]
      dailyData.push({ date: dateKey, count: bookingsByDate[dateKey] || 0 })
    }

    const totalCount = dailyData.reduce((acc, curr) => acc + curr.count, 0)
    const avgGrowthCount = Math.round(totalCount / daysCount)

    let isCountIncreasing = false
    if (dailyData.length >= 2) {
      const mid = Math.floor(dailyData.length / 2)
      const firstHalf = dailyData.slice(0, mid)
      const secondHalf = dailyData.slice(mid)
      const avgFirst =
        firstHalf.reduce((a, c) => a + c.count, 0) / firstHalf.length
      const avgSecond =
        secondHalf.reduce((a, c) => a + c.count, 0) / secondHalf.length
      isCountIncreasing = avgSecond >= avgFirst
    }

    let totalPctChange = 0
    let validDays = 0
    const pctChanges = []

    for (let i = 1; i < dailyData.length; i++) {
      const prev = dailyData[i - 1].count
      const curr = dailyData[i].count
      let pct = 0
      if (prev === 0) {
        pct = curr > 0 ? 100 : 0
      } else {
        pct = ((curr - prev) / prev) * 100
      }
      pctChanges.push(pct)
      totalPctChange += pct
      validDays++
    }

    const avgGrowthPercentVal = validDays > 0 ? totalPctChange / validDays : 0
    const finalGrowthPercent = Math.min(avgGrowthPercentVal, 100)
    const avgGrowthPercent = `${finalGrowthPercent.toFixed(2)}%`

    let isPctIncreasing = false
    if (pctChanges.length >= 2) {
      const mid = Math.floor(pctChanges.length / 2)
      const firstHalf = pctChanges.slice(0, mid)
      const secondHalf = pctChanges.slice(mid)
      const avgFirst = firstHalf.reduce((a, c) => a + c, 0) / firstHalf.length
      const avgSecond =
        secondHalf.reduce((a, c) => a + c, 0) / secondHalf.length
      isPctIncreasing = avgSecond >= avgFirst
    }

    setStats({
      yesterdayCount,
      yesterdayDateStr,
      avgGrowthCount,
      isCountIncreasing,
      avgGrowthPercent,
      isPctIncreasing
    })
  }, [rows, dateRange])

  const filteredRows = rows.filter(row => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()

    // Date Range Filtering
    const bookingTime = new Date(
      row.raw?.createdAt || row.raw?.api_response?.data?.created_at
    ).getTime()
    const startTime = dateRange.start
      ? new Date(dateRange.start).setHours(0, 0, 0, 0)
      : null
    const endTime = dateRange.end
      ? new Date(dateRange.end).setHours(23, 59, 59, 999)
      : null

    const matchesDate =
      (!startTime || bookingTime >= startTime) &&
      (!endTime || bookingTime <= endTime)

    if (!term) return matchesDate

    const tDigits = term.replace(/[^0-9]/g, '')
    const orderId = String(row.orderId || '').toLowerCase()
    const dateStr = String(row.eventDate || '').toLowerCase()
    const amount = String(row.amount || '').toLowerCase()
    const activity = String(row.activityStatus || '').toLowerCase()
    const payment = String(row.paymentStatus || '').toLowerCase()
    const matchesText =
      orderId.includes(term) ||
      dateStr.includes(term) ||
      amount.includes(term) ||
      activity.includes(term) ||
      payment.includes(term)
    const dateDigits = String(row.eventDate || '').replace(/[^0-9]/g, '')
    const matchesDigits = tDigits && dateDigits.includes(tDigits)
    return matchesDate && (matchesText || matchesDigits)
  })

  const paginatedBookings = useMemo(() => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    return filteredRows.slice(startIndex, endIndex)
  }, [filteredRows, page, limit])

  useEffect(() => {
    const totalPages = Math.ceil(filteredRows.length / limit) || 1
    setPageCount(totalPages)

    if (page > totalPages) {
      setPage(1)
    }
  }, [filteredRows.length, limit])

  const handleDownloadExcel = () => {
    if (!filteredRows || filteredRows.length === 0) {
      return
    }
    const dataToExport = filteredRows.map(row => {
      const r = row.raw || {}
      const api = r.api_response?.data || {}
      const customer = r.customer || api.customer || {}
      const shippingAddress = api.shipping_address || {}

      // Format items
      const items =
        Array.isArray(r.items) && r.items.length > 0
          ? r.items
              .map(
                i =>
                  `[Product: ${i.productName}, Qty: ${i.qty}, Price: ${i.price}, Barcode: ${i.barcode}]`
              )
              .join('; ')
          : Array.isArray(api.items)
          ? api.items
              .map(
                i =>
                  `[Product: ${i.productName}, Qty: ${i.qty}, Price: ${i.price}]`
              )
              .join('; ')
          : ''

      return {
        _id: r._id,
        user_id: r.user_id,
        orderKey: r.orderKey,
        store_id: r.store_id,
        shipping_method: r.shipping_method,
        delivery_zone_id: r.delivery_zone_id,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        __v: r.__v,

        // Customer Details
        'customer.contact_person_name':
          customer.contact_person_name || customer.name,
        'customer.email': customer.email,
        'customer.phone': customer.phone,

        // API Response Details
        'api.id': api.id,
        'api.order_amount': api.order_amount,
        'api.order_status': api.order_status,
        'api.order_source': api.order_source,
        'api.payment_status': api.payment_status,
        'api.payment_method': api.payment_method,
        'api.shipping_cost': api.shipping_cost,
        'api.delivery_method': api.delivery_method,
        'api.created_at': api.created_at,
        'api.updated_at': api.updated_at,

        // Shipping Address
        'shipping.address': shippingAddress.address,
        'shipping.city': shippingAddress.city,
        'shipping.state': shippingAddress.state,
        'shipping.zip': shippingAddress.zip,
        'shipping.country': shippingAddress.country,

        // Reseller Info
        'reseller.business_name': api.reseller?.business_name,
        'reseller.merchant': api.reseller?.merchant,
        'reseller.discount_percent': api.reseller?.discount_percent,

        // Items
        items: items
      }
    })
    downloadExcel(dataToExport, 'MedPlus_Orders.xlsx')
  }

  const ActionDropdown = ({ row }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })
    const handleButtonClick = e => {
      if (!isOpen) {
        const rect = e.currentTarget.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const dropdownHeight = 90
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
              className='fixed inset-0 z-[99998]'
              onClick={() => setIsOpen(false)}
            />
            <div
              className='fixed w-44 bg-white rounded-lg shadow-2xl border border-gray-200 z-[99999] py-1'
              style={{
                top: `${buttonPosition.top}px`,
                right: `${buttonPosition.right}px`
              }}
            >
              <button
                className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                onClick={() => {
                  setDetailRow(row.raw)
                  setDetailOpen(true)
                  setIsOpen(false)
                }}
              >
                <span className='mr-3 text-gray-500'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                    />
                  </svg>
                </span>
                <span className='text-gray-800'>View Details</span>
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderDetailModal = () => {
    const r = detailRow
    if (!detailOpen || !r) return null
    const api = r?.api_response?.data || {}
    const custTop = r?.customer || {}
    const cust = api?.customer || custTop || {}
    const items =
      Array.isArray(r.items) && r.items.length > 0 ? r.items : api.items || []
    const shipping = api?.shipping_address || {}
    const reseller = api?.reseller || {}
    const amount =
      typeof api?.order_amount === 'number'
        ? api.order_amount
        : Array.isArray(r?.items)
        ? r.items.reduce(
            (sum, it) => sum + Number((it?.price || 0) * (it?.qty || 0)),
            0
          )
        : 0

    return (
      <div className='fixed inset-0 z-[10000] flex items-center justify-center'>
        <div
          className='absolute inset-0 bg-black/30'
          onClick={() => setDetailOpen(false)}
        />
        <div className='relative bg-white rounded-2xl shadow-xl w-[90%] max-w-3xl max-h-[90vh] overflow-y-auto'>
          <div className='p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10'>
            <h3 className='text-xl font-semibold text-gray-900'>
              MedPlus Order Details
            </h3>
            <button
              onClick={() => setDetailOpen(false)}
              className='p-2 rounded-full hover:bg-gray-100 transition-colors'
              aria-label='Close'
            >
              <svg
                className='w-5 h-5 text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
          <div className='p-6 space-y-8'>
            {/* General Order Info */}
            <section>
              <h4 className='text-sm font-bold text-gray-900 uppercase tracking-wider mb-3'>
                General Info
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='block text-gray-500'>Order ID</span>
                  <span className='font-medium text-gray-900'>
                    {String(r?._id || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Order Key</span>
                  <span className='font-medium text-gray-900'>
                    {String(r?.orderKey || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>MedPlus ID</span>
                  <span className='font-medium text-gray-900'>
                    {String(api?.id || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Status</span>
                  <span className='font-medium text-gray-900'>
                    {String(r?.status || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>API Order Status</span>
                  <span className='font-medium text-gray-900'>
                    {String(api?.order_status || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Order Source</span>
                  <span className='font-medium text-gray-900'>
                    {String(api?.order_source || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Store ID</span>
                  <span className='font-medium text-gray-900'>
                    {String(r?.store_id || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Created At</span>
                  <span className='font-medium text-gray-900'>
                    {formatDate(r?.createdAt || api?.created_at) || '-'}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Updated At</span>
                  <span className='font-medium text-gray-900'>
                    {formatDate(r?.updatedAt || api?.updated_at) || '-'}
                  </span>
                </div>
              </div>
            </section>

            {/* Payment & Financials */}
            <section className='border-t border-gray-100 pt-4'>
              <h4 className='text-sm font-bold text-gray-900 uppercase tracking-wider mb-3'>
                Payment & Financials
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='block text-gray-500'>Total Amount</span>
                  <span className='font-bold text-gray-900'>
                    {toCurrency(amount)}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Payment Status</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      String(api?.payment_status).toLowerCase() === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {String(api?.payment_status || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Payment Method</span>
                  <span className='font-medium text-gray-900'>
                    {String(api?.payment_method || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Shipping Cost</span>
                  <span className='font-medium text-gray-900'>
                    {toCurrency(api?.shipping_cost)}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Discount %</span>
                  <span className='font-medium text-gray-900'>
                    {String(reseller?.discount_percent || '0')}%
                  </span>
                </div>
              </div>
            </section>

            {/* Customer & User */}
            <section className='border-t border-gray-100 pt-4'>
              <h4 className='text-sm font-bold text-gray-900 uppercase tracking-wider mb-3'>
                Customer & User
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='block text-gray-500'>Contact Name</span>
                  <span className='font-medium text-gray-900'>
                    {String(cust?.name || custTop?.contact_person_name || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Email</span>
                  <span className='font-medium text-gray-900'>
                    {String(cust?.email || custTop?.email || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Phone</span>
                  <span className='font-medium text-gray-900'>
                    {String(cust?.phone || custTop?.phone || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>User ID</span>
                  <span className='font-medium text-gray-900'>
                    {String(r?.user_id || '-')}
                  </span>
                </div>
              </div>
            </section>

            {/* Shipping & Delivery */}
            <section className='border-t border-gray-100 pt-4'>
              <h4 className='text-sm font-bold text-gray-900 uppercase tracking-wider mb-3'>
                Shipping & Delivery
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='block text-gray-500'>Shipping Method</span>
                  <span className='font-medium text-gray-900'>
                    {String(r?.shipping_method || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Delivery Method</span>
                  <span className='font-medium text-gray-900'>
                    {String(api?.delivery_method || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Delivery Zone ID</span>
                  <span className='font-medium text-gray-900'>
                    {String(r?.delivery_zone_id || '-')}
                  </span>
                </div>
                <div className='col-span-2 md:col-span-3'>
                  <span className='block text-gray-500'>Shipping Address</span>
                  <span className='font-medium text-gray-900'>
                    {shipping?.address
                      ? `${shipping.address}, ${shipping.city || ''}, ${
                          shipping.state || ''
                        }, ${shipping.country || ''}`
                      : '-'}
                  </span>
                </div>
              </div>
            </section>

            {/* Reseller Info */}
            <section className='border-t border-gray-100 pt-4'>
              <h4 className='text-sm font-bold text-gray-900 uppercase tracking-wider mb-3'>
                Reseller Info
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
                <div>
                  <span className='block text-gray-500'>Business Name</span>
                  <span className='font-medium text-gray-900'>
                    {String(reseller?.business_name || '-')}
                  </span>
                </div>
                <div>
                  <span className='block text-gray-500'>Merchant</span>
                  <span className='font-medium text-gray-900'>
                    {String(reseller?.merchant || '-')}
                  </span>
                </div>
              </div>
            </section>

            {/* Items */}
            {items.length > 0 && (
              <section className='border-t border-gray-100 pt-4'>
                <h4 className='text-sm font-bold text-gray-900 uppercase tracking-wider mb-3'>
                  Order Items
                </h4>
                <div className='overflow-x-auto border border-gray-200 rounded-lg'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Product Name
                        </th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Barcode
                        </th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Qty
                        </th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Price
                        </th>
                        <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {item.productName}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-500'>
                            {item.barcode || '-'}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {item.qty}
                          </td>
                          <td className='px-4 py-2 text-sm text-gray-900'>
                            {toCurrency(item.price)}
                          </td>
                          <td className='px-4 py-2 text-sm font-medium text-gray-900'>
                            {toCurrency((item.price || 0) * (item.qty || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-4 min-h-screen bg-white'>
      {/* Title and Breadcrumb */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 mb-1'>
            Gross Transaction Value
          </h1>
          <nav className='text-sm text-gray-500'>
            <span>Dashboard</span> / <span>Gross Transaction Value</span>
          </nav>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2'>
            <div className='flex flex-col'>
              <label className='text-[10px] text-gray-500 font-medium ml-1'>
                Start Date
              </label>
              <input
                type='date'
                value={dateRange.start}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, start: e.target.value }))
                }
                className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500'
              />
            </div>
            <span className='text-gray-400 mt-4'>-</span>
            <div className='flex flex-col'>
              <label className='text-[10px] text-gray-500 font-medium ml-1'>
                End Date
              </label>
              <input
                type='date'
                max={new Date().toISOString().split('T')[0]}
                value={dateRange.end}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, end: e.target.value }))
                }
                className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500'
              />
            </div>
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className='mt-4 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
              title='Clear Date Filter'
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF] p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-2 rounded-lg'>
              <TbTicket className='w-6 h-6 text-indigo-600' />
            </div>
            <div className='text-right'>
              <p className='text-xs text-indigo-600 opacity-90'>
                Total purchasing Yesterday{' '}
                <span className='text-[10px] opacity-75'>
                  ({stats.yesterdayDateStr})
                </span>
              </p>
              <p className='text-2xl text-indigo-600 font-bold'>
                {stats.yesterdayCount}
              </p>
            </div>
          </div>
        </div>
        <div className='bg-gradient-to-r from-[#F3E8FF] to-[#DDD6FE] p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-2 rounded-lg'>
              <TbTrendingUp className='w-6 h-6 text-purple-600' />
            </div>
            <div className='text-right'>
              <p className='text-xs text-purple-600 opacity-90'>
                Avg Daily Growth (Count)
              </p>
              <div className='flex items-end justify-end gap-2'>
                <p className='text-2xl text-purple-600 font-bold'>
                  {stats.avgGrowthCount}
                </p>
                {stats.isCountIncreasing ? (
                  <span className='text-xs flex items-center mb-1 text-green-500'>
                    <TbTrendingUp className='w-3 h-3 mr-0.5' />
                    Increasing
                  </span>
                ) : (
                  <>
                    <p className='text-2xl text-red-600 font-bold'>
                      {stats.avgGrowthCount}
                    </p>
                    <span className='text-xs flex items-center mb-1 text-red-600'>
                      <TbTrendingDown className='w-3 h-3 mr-0.5' />
                      Decreasing
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className='bg-gradient-to-r from-[#CCFBF1] to-[#99F6E4] p-4 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-2 rounded-lg'>
              <FaChartColumn className='w-6 h-6 text-teal-600' />
            </div>
            <div className='text-right'>
              <p className='text-xs text-teal-600 opacity-90'>
                Avg Daily Growth (%)
              </p>
              <div className='flex items-end justify-end gap-2'>
                <p className='text-2xl text-teal-600 font-bold'>
                  {stats.avgGrowthPercent}
                </p>
                {stats.isPctIncreasing ? (
                  <span className='text-xs flex items-center mb-1 text-green-500'>
                    <TbTrendingUp className='w-3 h-3 mr-0.5' />
                    Increasing
                  </span>
                ) : (
                  <>
                    <p className='text-2xl text-red-600 font-bold'>
                      {stats.avgGrowthPercent}
                    </p>
                    <span className='text-xs flex items-center mb-1 text-red-600'>
                      <TbTrendingDown className='w-3 h-3 mr-0.5' />
                      Decreasing
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Cards (Filtered) */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        {/* Total MedPlus Bookings (Filtered) */}
        <div className='bg-blue-300 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTicket className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                Total MedPlus Bookings
              </p>
              <p className='text-2xl text-black font-bold'>
                {filteredRows.length}{' '}
                <span className='text-lg font-semibold opacity-90'>
                  (₦
                  {filteredRows
                    .reduce(
                      (acc, curr) => acc + (Number(curr.amountNum) || 0),
                      0
                    )
                    .toLocaleString()}
                  )
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* New Bookings Today (Filtered) */}
        <div className='bg-orange-300 text-white p-4 rounded-lg'>
          <div className='flex items-center'>
            <div className='bg-white p-2 rounded-lg mr-3'>
              <TbTicket className='w-6 h-6 text-orange-600' />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                New Bookings Today
              </p>
              <p className='text-2xl text-black font-bold'>
                {
                  filteredRows.filter(b => {
                    if (
                      !b.raw?.createdAt &&
                      !b.raw?.api_response?.data?.created_at
                    )
                      return false
                    const d = new Date(
                      b.raw.createdAt || b.raw.api_response.data.created_at
                    )
                    const today = new Date()
                    return (
                      d.getDate() === today.getDate() &&
                      d.getMonth() === today.getMonth() &&
                      d.getFullYear() === today.getFullYear()
                    )
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-gray-200 p-5 rounded-xl flex-1 flex flex-col min-h-0'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0'>
          <div className='p-4 border-b border-gray-200 flex-shrink-0'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Gross Transaction Value of Med-Plus
              </h2>
              <div className='flex items-center space-x-3'>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='h-9 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-gray-900 placeholder-gray-500'
                  />
                  <svg
                    className='w-4 h-4 text-gray-600 absolute left-3 top-2.5'
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

                <button className='h-9 flex items-center px-4 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'>
                  <svg
                    className='w-4 h-4 mr-2 text-gray-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z'
                    />
                  </svg>
                  <span className='text-xs text-gray-700 font-medium'>
                    Filters
                  </span>
                </button>

                <button
                  onClick={handleDownloadExcel}
                  className='h-9 flex items-center px-4 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
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
                  <span className='ml-2 text-xs text-gray-700 font-medium'>
                    Export
                  </span>
                </button>

                <div className='flex items-center gap-2'>
                  <label className='flex items-center gap-1.5 text-xs text-[#2D3658]'>
                    Show
                    <select
                      value={limit}
                      onChange={e => setLimit(Number(e.target.value) || 20)}
                      className='h-8 px-2 border border-[#E5E6EF] rounded-lg text-xs'
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className='h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]'
                    >
                      Prev
                    </button>
                    <span className='text-xs text-[#2D3658]'>
                      Page {page} of {pageCount}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                      disabled={page >= pageCount}
                      className='h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]'
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex flex-wrap gap-1.5'>
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    switch (tab.id) {
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
                        break
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    tab.active
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className='overflow-x-auto flex-1'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Order ID</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Date & Time</span>
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
                      <span>Activity Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Payment Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Action</span>
                      <span className='w-3 h-3 ml-1' />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='px-3 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No med orders found
                    </td>
                  </tr>
                ) : (
                  paginatedBookings?.map(row => (
                    <tr
                      key={row.id}
                      className='hover:bg-gray-50 border-b border-gray-100'
                    >
                      <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                        {row.orderId}
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900 leading-tight'>
                          {row.eventDate}
                        </div>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='text-sm font-semibold text-gray-900'>
                          {row.amount}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {row.activityStatus}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <span className='inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className='px-3 py-3 whitespace-nowrap'>
                        <ActionDropdown row={row} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {renderDetailModal()}
    </div>
  )
}
