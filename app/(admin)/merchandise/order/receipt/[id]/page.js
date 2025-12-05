"use client"

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAllOrders } from '@/services/merchandise/order.service'
import { Loader2, Tag } from 'lucide-react'

const toCurrency = n => {
  try { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(n) || 0) } catch { const x = Number(n)||0; return `₦${x.toLocaleString('en-NG')}` }
}

const formatDate = (iso) => {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '-'
  try { return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) } catch { return d.toISOString() }
}

export default function OrderReceiptPage () {
  const params = useParams()
  const router = useRouter()
  const idParam = params?.id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getAllOrders()
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.message) ? res.message : (Array.isArray(res) ? res : []))
        const found = list.find(o => String(o?._id || o?.orderId) === String(idParam)) || null
        setOrder(found)
      } catch {
        setError('Failed to load order')
        setOrder(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [idParam])

  const items = useMemo(() => Array.isArray(order?.items) ? order.items : [], [order])
  const buyerName = useMemo(() => order?.userName || '-', [order])
  const email = useMemo(() => order?.email || '-', [order])
  const phone = useMemo(() => order?.phoneNumber || '-', [order])
  const total = useMemo(() => Number(order?.totalAmount || 0), [order])
  const issuedOn = useMemo(() => formatDate(order?.createdAt || order?.updatedAt), [order])

  if (loading) return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className='flex items-center gap-2 text-[#5E6582]'><Loader2 className='h-4 w-4 animate-spin' /> Loading...</div>
      </div>
    </div>
  )

  if (error || !order) return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className='rounded-xl border border-[#E5E6EF] bg-white p-6'>
          <div className='text-sm text-red-600'>{error || 'Order not found'}</div>
          <div className='mt-4'><button onClick={() => router.back()} className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'>Back</button></div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="bg-black px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/images/logo/fotter_logo.webp" alt="Company Logo" className="w-[120px] h-[40px] object-contain" />
            </div>
            <div className="text-white text-right text-sm">
              <div>Order ID: {order?._id || order?.orderId || '-'}</div>
              <div>Issued on: {issuedOn}</div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="flex-1 flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-[#E5E6EF] bg-white flex items-center justify-center">
                  <img src={(items[0]?.productId?.image) || '/images/no-image.webp'} alt="Product" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">Merchandise Order</div>
                  <div className="text-sm text-[#5E6582]">{buyerName}</div>
                  <div className="text-xs text-[#8B93AF]">{email} • {phone}</div>
                </div>
              </div>
              
            </div>

            <div className="rounded-xl border border-[#E5E6EF] bg-white">
              <div className="p-4">
                <div className="text-sm font-semibold text-slate-900 mb-3">Items</div>
                <div className="divide-y divide-[#EEF1FA]">
                  {items.map((it, i) => (
                    <div key={i} className="py-3 flex items-center justify-between text-sm">
                      <span>{Number(it?.quantity || 0)} × {it?.productId?.title || '-'}</span>
                      <span>{toCurrency(it?.price ?? it?.productId?.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#EEF1FA] mt-3 pt-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">Total</span>
                  <span className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Tag className='h-4 w-4 text-orange-500' />
                    {toCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {items.map((it, i) => (
                <div key={`item-${i}`} className="rounded-xl bg-[#F8F9FC] p-4">
                  <div className="text-sm font-semibold text-slate-900 mb-3">Item {i + 1}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-[#5E6582]">Name</div>
                    <div className="text-right font-semibold text-slate-900">{buyerName}</div>
                    <div className="text-[#5E6582]">Email Address</div>
                    <div className="text-right font-semibold text-slate-900">{email}</div>
                    <div className="text-[#5E6582]">Phone Number</div>
                    <div className="text-right font-semibold text-slate-900">{phone}</div>
                    <div className="text-[#5E6582]">Purchased on</div>
                    <div className="text-right font-semibold text-slate-900">{issuedOn}</div>
                    <div className="text-[#5E6582]">Item Name</div>
                    <div className="text-right font-semibold text-slate-900">{it?.productId?.title || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button onClick={() => router.back()} className="rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]">Back</button>
        </div>
      </div>
    </div>
  )
}

