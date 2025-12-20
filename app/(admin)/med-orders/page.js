'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { getMedOrderList } from '@/services/med/med.service'
import { downloadExcel } from '@/utils/excelExport'

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
  const [rowsRaw, setRowsRaw] = useState([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRow, setDetailRow] = useState(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getMedOrderList()
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
  }, [])

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
        activityStatus,
        paymentStatus,
        raw: r
      }
    })
  }, [rowsRaw])

  const filteredRows = rows.filter(row => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
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
    return matchesText || matchesDigits
  })

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
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='mb-4'>
        <h1 className='text-xl font-bold text-gray-900 mb-1'>Bookings</h1>
        <nav className='text-sm text-gray-500'>
          <span>Dashboard</span> /{' '}
          <span className='text-gray-900 font-medium'>Users</span>
        </nav>
      </div>

      <div className='bg-gray-200 p-5 rounded-xl flex-1 flex flex-col min-h-0'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0'>
          <div className='p-4 border-b border-gray-200 flex-shrink-0'>
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

                <button className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'>
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
                  <span className='text-gray-700 font-medium'>Filters</span>
                </button>

                <button
                  onClick={handleDownloadExcel}
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

            <div className='flex space-x-2 overflow-x-auto pb-2'>
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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
                  filteredRows.map(row => (
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
