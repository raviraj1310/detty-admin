'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Toast from '@/components/ui/Toast'
import { Search, Download, X, Loader2 } from 'lucide-react'
import CustomerDetailsModal from '@/components/common/CustomerDetailsModal'
import { IoFilterSharp } from 'react-icons/io5'
import {
  getOrderByProductId,
  downloadOrderReceipt,
  getOrderDetail
} from '@/services/merchandise/order.service'
import { getProductById } from '@/services/merchandise/merchandise.service'

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

export default function ProductOrders () {
  const params = useParams()
  const productId = params?.id
  const [title, setTitle] = useState('')
  const [toastOpen, setToastOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const menuRef = useRef(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDetailLoading, setOrderDetailLoading] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState(null)

  useEffect(() => {
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpenId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Format date for display
  const formatDate = dateValue => {
    if (!dateValue) return ''
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return ''
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return String(dateValue || '')
    }
  }

  // Format order data from API
  const formatOrder = order => {
    const orderId = order._id || order.id || ''
    const orderDate = order.createdAt || order.orderDate || order.date || ''
    const user = order.user || order.userId || {}
    const userName = user.name || user.userName || user.fullName || 'N/A'
    const email = user.email || 'N/A'
    const phone = user.phoneNumber || 'N/A'

    // Get order items (all items are for this product since API filters by productId)
    const items = order.items || order.orderItems || []

    const details =
      items.length > 0
        ? items
            .map(item => {
              const qty = item.quantity || item.qty || 1
              const price = item.price || item.productPrice || 0
              const productName =
                item.productName ||
                item.product?.name ||
                item.product?.title ||
                title ||
                'Product'
              return `${qty} x ${productName} (${toCurrency(price)})`
            })
            .join(', ')
        : 'No items'

    const amount = order.totalAmount || order.amount || order.total || 0
    const status = order.status || 'Pending'

    return {
      id: orderId,
      date: formatDate(orderDate),
      userName,
      email,
      phone,
      details,
      amount,
      status
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) {
        setError('Product ID is required')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        // Fetch product details
        try {
          const productRes = await getProductById(productId)
          const p = productRes?.data || productRes?.message || productRes || {}
          setTitle(String(p?.title || p?.name || p?.productName || ''))
        } catch (e) {
          console.error('Failed to fetch product:', e)
        }

        // Fetch orders by product ID
        const ordersRes = await getOrderByProductId(productId)

        // Handle different response structures
        let ordersData = []
        if (Array.isArray(ordersRes?.data)) {
          ordersData = ordersRes.data
        } else if (Array.isArray(ordersRes)) {
          ordersData = ordersRes
        } else if (ordersRes?.data && !Array.isArray(ordersRes.data)) {
          // If single order object, wrap in array
          ordersData = [ordersRes.data]
        } else if (ordersRes && !Array.isArray(ordersRes)) {
          // If single order object at root level
          ordersData = [ordersRes]
        }

        // Format orders
        const formattedOrders = ordersData
          .map(formatOrder)
          .filter(order => order.id) // Filter out invalid orders

        setOrders(formattedOrders)
        setToastOpen(true)
      } catch (e) {
        console.error('Failed to fetch orders:', e)
        setError('Failed to load orders')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [productId])

  const filtered = useMemo(() => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    return orders.filter(o => {
      const statusOk = statusFilter
        ? String(o.status || '').toLowerCase() ===
          String(statusFilter).toLowerCase()
        : true
      if (!term) return statusOk
      const t = term
      const text =
        `${o.userName} ${o.email} ${o.phone} ${o.details} ${o.date}`.toLowerCase()
      return text.includes(t) && statusOk
    })
  }, [orders, searchTerm, statusFilter])

  const metrics = useMemo(() => {
    const totalAmt = filtered.reduce((s, o) => s + (o.amount || 0), 0)
    const completed = filtered.filter(
      o => String(o.status).toLowerCase() === 'paid'
    )
    const pending = filtered.filter(
      o => String(o.status).toLowerCase() === 'pending'
    )
    return {
      totalCount: filtered.length,
      totalAmount: totalAmt,
      completedCount: completed.length,
      completedAmount: completed.reduce((s, o) => s + (o.amount || 0), 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, o) => s + (o.amount || 0), 0)
    }
  }, [filtered])

  const handleDownloadReceipt = async orderId => {
    if (!orderId) return
    try {
      setDownloadingId(orderId)
      const blob = await downloadOrderReceipt(orderId)
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `order-receipt-${orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setToastOpen(true)
      setError('')
    } catch (e) {
      console.error('Failed to download receipt:', e)
      setError('Failed to download receipt')
      setToastOpen(true)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleViewCustomerDetail = async orderId => {
    if (!orderId) return
    try {
      setOrderDetailLoading(true)
      const summary =
        (orders || []).find(o => String(o.id) === String(orderId)) || null
      setSelectedSummary(summary)
      const res = await getOrderDetail(orderId)
      const orderData = res?.data || res || null
      setSelectedOrder(orderData)
      setCustomerModalOpen(true)
    } catch (e) {
      console.error('Failed to fetch order details:', e)
      setError('Failed to load customer details')
      setToastOpen(true)
    } finally {
      setOrderDetailLoading(false)
    }
  }

  return (
    <div className='space-y-7 py-12 px-12'>
      <Toast
        open={toastOpen && !loading}
        onOpenChange={setToastOpen}
        title={error ? 'Error' : 'Orders loaded'}
        description={error || 'The orders list has been updated'}
        variant={error ? 'error' : 'success'}
        duration={error ? 3000 : 2500}
        position='top-right'
      />

      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-semibold text-slate-900'>
          Orders{title ? ` - ${title}` : ''}
        </h1>
        <p className='text-sm text-[#99A1BC]'>Dashboard / Orders</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-2'>
        <div className='bg-[#2563EB] rounded-2xl p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-4 rounded-2xl'>
              <img
                src='/images/backend/icons/icons (3).svg'
                alt='Total Orders'
                className='w-8 h-8'
              />
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium text-white/90'>Total Orders</p>
              <p className='text-4xl font-bold'>
                {metrics.totalCount} ({toCurrency(metrics.totalAmount)})
              </p>
            </div>
          </div>
        </div>
        <div className='bg-[#16A34A] rounded-2xl p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-4 rounded-2xl'>
              <img
                src='/images/backend/icons/icons (5).svg'
                alt='Completed Orders'
                className='w-8 h-8'
              />
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium text-white/90'>
                Completed Orders
              </p>
              <p className='text-4xl font-bold'>
                {metrics.completedCount} ({toCurrency(metrics.completedAmount)})
              </p>
            </div>
          </div>
        </div>
        <div className='bg-[#DC2626] rounded-2xl p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-4 rounded-2xl'>
              <img
                src='/images/backend/icons/icons (4).svg'
                alt='Pending Orders'
                className='w-8 h-8'
              />
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium text-white/90'>
                Pending Orders
              </p>
              <p className='text-4xl font-bold'>
                {metrics.pendingCount} ({toCurrency(metrics.pendingAmount)})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <h2 className='text-lg font-semibold text-slate-900'>Order List</h2>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative flex items-center'>
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
              <Search className='absolute left-3 h-4 w-4 text-[#A6AEC7]' />
            </div>
            {filtersOpen && (
              <div className='relative'>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className='h-10 rounded-xl border border-[#E5E6EF] bg-white px-3 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none'
                >
                  <option value=''>All Status</option>
                  <option value='Completed'>Completed</option>
                  <option value='Pending'>Pending</option>
                </select>
              </div>
            )}
            <button
              onClick={() => setFiltersOpen(prev => !prev)}
              className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
            >
              <IoFilterSharp className='h-4 w-4 text-[#8B93AF]' />
              {filtersOpen ? 'Hide Filters' : 'Filters'}
            </button>
            <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6F7] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <Download className='h-4 w-4 text-[#8B93AF]' />
            </button>
          </div>
        </div>

        <div className='rounded-2xl border border-[#E5E8F5] overflow-visible'>
          <div className='grid grid-cols-12 gap-4 bg-[#F7F9FD] px-6 py-4'>
            <div className='col-span-2'>
              <div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>
                Ordered On
              </div>
            </div>
            <div className='col-span-2'>
              <div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>
                User Name
              </div>
            </div>
            <div className='col-span-2'>
              <div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>
                Email id
              </div>
            </div>
            <div className='col-span-2'>
              <div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>
                Phone Number
              </div>
            </div>
            <div className='col-span-1'>
              <div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>
                Order Details
              </div>
            </div>
            <div className='col-span-1 flex justify-end'>
              <div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>
                Amount
              </div>
            </div>
            <div className='col-span-1 flex justify-end'>
              <div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>
                Order Status
              </div>
            </div>
            <div className='col-span-1 flex justify-end'>
              <div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>
                Action
              </div>
            </div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {filtered.map(o => (
              <div
                key={o.id}
                className='grid grid-cols-12 gap-4 px-6 py-5 hover:bg-[#F9FAFD] relative'
              >
                <div className='col-span-2 self-center text-sm text-[#5E6582] truncate'>
                  {o.date}
                </div>
                <div className='col-span-2 self-center text-sm text-[#1A1F3F] truncate'>
                  {o.userName}
                </div>
                <div className='col-span-2 self-center text-sm text-[#5E6582] truncate'>
                  {o.email}
                </div>
                <div className='col-span-2 self-center text-sm text-[#5E6582] truncate'>
                  {o.phone}
                </div>
                <div
                  className='col-span-1 self-center text-sm text-[#5E6582] truncate'
                  title={o.details}
                >
                  {o.details}
                </div>
                <div className='col-span-1 self-center text-sm font-semibold text-slate-900 text-right whitespace-nowrap'>
                  {toCurrency(o.amount)}
                </div>
                <div className='col-span-1 flex items-center justify-end'>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                      String(o.status).toLowerCase() === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <div className='col-span-1 flex items-center justify-end'>
                  <div className='relative z-10'>
                    <button
                      onClick={() =>
                        setMenuOpenId(menuOpenId === o.id ? null : o.id)
                      }
                      className='rounded-full border border-transparent p-2 text-[#8C93AF] hover:border-[#E5E8F6] hover:bg-[#F5F7FD]'
                    >
                      <svg
                        className='h-5 w-5 text-gray-600'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                      </svg>
                    </button>
                    {menuOpenId === o.id && (
                      <div
                        ref={menuRef}
                        className='absolute right-0 mt-2 w-56 rounded-xl border border-[#E5E6EF] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-[100] overflow-hidden'
                      >
                        <div className='py-2'>
                          <a
                            href={`/merchandise/order-view/${o.id}`}
                            className='flex items-center w-full px-4 py-2.5 text-sm text-[#2D3658] hover:bg-[#F8F9FC] transition-colors'
                          >
                            <span className='mr-3 text-[#8B93AF] flex-shrink-0'>
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
                            <span className='text-[#1A1F3F] font-medium'>
                              View Detail
                            </span>
                          </a>
                          <button
                            onClick={() => {
                              handleViewCustomerDetail(o.id)
                              setMenuOpenId(null)
                            }}
                            className='flex items-center w-full px-4 py-2.5 text-sm text-[#2D3658] hover:bg-[#F8F9FC] transition-colors'
                          >
                            <span className='mr-3 text-[#8B93AF] flex-shrink-0'>
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
                                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                />
                              </svg>
                            </span>
                            <span className='text-[#1A1F3F] font-medium'>
                              View Customer Detail
                            </span>
                          </button>
                          <button
                            onClick={() => handleDownloadReceipt(o.id)}
                            disabled={downloadingId === o.id}
                            className='flex items-center w-full px-4 py-2.5 text-sm text-[#2D3658] hover:bg-[#F8F9FC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            <span className='mr-3 text-[#8B93AF] flex-shrink-0'>
                              {downloadingId === o.id ? (
                                <svg
                                  className='w-4 h-4 animate-spin'
                                  fill='none'
                                  viewBox='0 0 24 24'
                                >
                                  <circle
                                    className='opacity-25'
                                    cx='12'
                                    cy='12'
                                    r='10'
                                    stroke='currentColor'
                                    strokeWidth='4'
                                  ></circle>
                                  <path
                                    className='opacity-75'
                                    fill='currentColor'
                                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                  ></path>
                                </svg>
                              ) : (
                                <Download className='w-4 h-4' />
                              )}
                            </span>
                            <span className='text-[#1A1F3F] font-medium'>
                              {downloadingId === o.id
                                ? 'Downloading...'
                                : 'Download Receipt'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className='px-6 py-5 text-sm text-[#5E6582] text-center'>
                Loading orders...
              </div>
            )}
            {!loading && error && (
              <div className='px-6 py-5 text-sm text-red-600 text-center'>
                {error}
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className='px-6 py-5 text-sm text-[#5E6582] text-center'>
                No orders found
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerDetailsModal
        open={Boolean(customerModalOpen)}
        onOpenChange={v => {
          if (!v) {
            setCustomerModalOpen(false)
            setSelectedOrder(null)
            setSelectedSummary(null)
          }
        }}
        order={selectedOrder}
        selected={selectedSummary}
      />
    </div>
  )
}
