'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getOrderDetail } from '@/services/merchandise/order.service'
import { Loader2, Tag, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

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

const formatDate = dateValue => {
  if (!dateValue) return '-'
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return String(dateValue || '')
  }
}

const toImageSrc = u => {
  if (!u) return '/images/no-image.webp'
  const s = String(u || '').trim()
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
  const base = String(origin || '').replace(/\/+$/, '')
  const path = s.replace(/^\/+/, '')
  return base ? `${base}/${path}` : s
}

export default function OrderViewPage () {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID is required')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const res = await getOrderDetail(orderId)
        const orderData = res?.data || res || null
        if (!orderData) {
          setError('Order not found')
        } else {
          setOrder(orderData)
        }
      } catch (e) {
        console.error('Failed to fetch order:', e)
        setError('Failed to load order')
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 py-8 px-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='flex items-center justify-center gap-2 text-[#5E6582] py-12'>
            <Loader2 className='h-5 w-5 animate-spin' />
            <span>Loading order details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className='min-h-screen bg-gray-50 py-8 px-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='rounded-xl border border-[#E5E6EF] bg-white p-6'>
            <div className='text-sm text-red-600 mb-4'>
              {error || 'Order not found'}
            </div>
            <button
              onClick={() => router.back()}
              className='flex items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
            >
              <ArrowLeft className='h-4 w-4' />
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  const items = Array.isArray(order.items) ? order.items : []
  const userName = order.userName || '-'
  const email = order.email || '-'
  const phone = order.phoneNumber || '-'
  const orderIdDisplay = order.orderId || order._id || '-'
  const createdAt = formatDate(order.createdAt)
  const discount = Number(order.discount || 0)
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = Number(item.price || item.productId?.price || 0)
    const quantity = Number(item.quantity || 1)
    const itemTotal = itemPrice * quantity
    return sum + itemTotal
  }, 0)
  // Calculate final total: subtotal minus discount (discount is always positive, so we subtract it)
  const calculatedTotal = subtotal - discount
  // Use totalAmount from API if it's a valid positive number, otherwise use calculated total
  const totalAmount = Number(order.totalAmount || 0)
  const finalTotal =
    totalAmount > 0 ? totalAmount : Math.max(0, calculatedTotal)
  const status = order.status || 'Pending'

   const Info = ({ label, value }) => (
    <div className="flex justify-between">
      <span className="text-[#5E6582]">{label}</span>
      <span className="font-semibold text-[#1A1F3F] text-right">{value}</span>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className='mb-4 flex items-center gap-2 text-sm text-[#5E6582] hover:text-[#1A1F3F] transition-colors'
        >
          <ArrowLeft className='h-4 w-4' />
          Back to Orders
        </button>

        {/* Order Ticket */}
        <div className='bg-white rounded-2xl overflow-hidden shadow-lg border border-[#E1E6F7]'>
          {/* Header */}
          <div className='bg-black px-6 py-4 flex justify-between items-center'>
            <div className='flex items-center gap-3'>
              <div className='relative w-32 h-10'>
                <Image
                  src='/images/logo/fotter_logo.webp'
                  alt='Access Bank Detty Fusion'
                  fill
                  className='object-contain'
                  unoptimized
                />
              </div>
            </div>
            <div className='text-white text-right text-sm'>
              <div className='font-medium'>Order ID: {orderIdDisplay}</div>
              <div className='text-white/80'>Issued on: {createdAt}</div>
            </div>
          </div>

          {/* Content */}
          <div className='p-6'>
            {/* Product/Order Info Section */}
            <div className='flex items-start gap-4 mb-6'>
              <div className='flex-1'>
                <div className='text-xl font-bold text-slate-900 mb-1'>
                  Merchandise Order
                </div>
                <div className='text-sm text-[#5E6582] mb-1'>{userName}</div>
                <div className='text-xs text-[#8B93AF]'>
                  {email} • {phone}
                </div>
                <div className='mt-2'>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      status.toLowerCase() === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : status.toLowerCase() === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>
            </div>

            {/* Tickets/Items Summary */}
            <div className='rounded-xl border border-[#E5E6EF] bg-white mb-6'>
              <div className='p-4 border-b border-[#EEF1FA]'>
                <div className='text-sm font-semibold text-slate-900'>
                  Items
                </div>
              </div>
              <div className='p-4'>
                <div className='space-y-3'>
                  {items.map((item, index) => {
                    const productName = item.productId?.title || 'Product'
                    const quantity = Number(item.quantity || 1)
                    const price = Number(
                      item.price || item.productId?.price || 0
                    )
                    const itemTotal = quantity * price
                    return (
                      <div
                        key={item._id || index}
                        className='flex items-center justify-between text-sm'
                      >
                        <span className='text-[#5E6582]'>
                          {quantity} × {productName}
                        </span>
                        <span className='font-semibold text-slate-900'>
                          {toCurrency(price)}
                        </span>
                      </div>
                    )
                  })}
                </div>
                {items.length > 0 && (
                  <div className='mt-3 pt-3 border-t border-[#EEF1FA] flex items-center justify-between text-sm'>
                    <span className='text-[#5E6582]'>Subtotal</span>
                    <span className='font-semibold text-slate-900'>
                      {toCurrency(subtotal)}
                    </span>
                  </div>
                )}
                {discount > 0 && (
                  <div className='flex items-center justify-between text-sm text-red-600'>
                    <span>Discount</span>
                    <span>-{toCurrency(discount)}</span>
                  </div>
                )}
                <div className='mt-3 pt-3 border-t-2 border-[#EEF1FA] flex items-center justify-between'>
                  <span className='text-sm font-semibold text-slate-900'>
                    Total
                  </span>
                  <span className='flex items-center gap-2 text-lg font-bold text-slate-900'>
                    <Tag className='h-5 w-5 text-orange-500' />
                    {toCurrency(finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Individual Item Details */}
            <div className="space-y-6">
  {items.map((item, index) => {
    const productName = item.productId?.title || "Product";
    return (
      <div
        key={item._id || index}
        className="rounded-2xl border border-[#E5E6EF] bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-[#1A1F3F]">
            Item {index + 1}
          </h3>
          <span className="text-sm font-medium text-[#FF4C2F] bg-[#FFF4F2] px-3 py-1 rounded-full">
            {toCurrency(item.price || item.productId?.price || 0)}
          </span>
        </div>

        {/* Product + Info Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Image Section */}
          <div className="flex justify-center">
            {item?.productId?.image && (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#E5E6EF] bg-white">
                <Image
                  src={toImageSrc(item.productId.image)}
                  alt={productName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="space-y-2 text-sm">
            <Info label="Name" value={userName} />
            <Info label="Email Address" value={email} />
            <Info label="Phone Number" value={phone} />
            <Info label="Purchased on" value={createdAt} />
          </div>

          {/* Product Info */}
          <div className="space-y-2 text-sm">
            <Info label="Item Name" value={productName} />
            <Info label="Quantity" value={item.quantity || 1} />
            <Info
              label="Total Price"
              value={toCurrency(
                (item.price || item.productId?.price || 0) * (item.quantity || 1)
              )}
            />
          </div>
        </div>
      </div>
    );
  })}
</div>



          </div>

          {/* Footer Border */}
          <div className='h-1 bg-[#FF5B2C]'></div>
        </div>
      </div>
    </div>
  )
}
