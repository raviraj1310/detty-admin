'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { Search, Download, Ticket, User, Loader2, MoreVertical } from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { getAllOrders, downloadOrderReceipt } from '@/services/merchandise/order.service'
import Modal from '@/components/ui/Modal'
const toCurrency = n => {
  try { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(n) || 0) } catch { const x = Number(n)||0; return `₦${x.toLocaleString('en-NG')}` }
}

export default function MerchOrdersList () {
  const [toastOpen, setToastOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const menuRef = useRef(null)
  const [ordersRaw, setOrdersRaw] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpenId(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const formatDate = (iso) => {
    const d = new Date(iso)
    if (!Number.isFinite(d.getTime())) return ''
    try {
      const opts = { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }
      const s = d.toLocaleString('en-NG', opts)
      return s
    } catch {
      return d.toISOString()
    }
  }

  const orders = useMemo(() => (
    Array.isArray(ordersRaw) ? ordersRaw.map(o => {
      const details = Array.isArray(o?.items) ? o.items.map(i => {
        const title = i?.productId?.title || '-'
        const qty = Number(i?.quantity || 0)
        const price = i?.price ?? i?.productId?.price
        return `${qty} x ${title} (${toCurrency(price)})`
      }).join(', ') : ''
      return {
        id: o?._id || o?.orderId || '',
        date: formatDate(o?.createdAt),
        userName: o?.userName || '-',
        email: o?.email || '-',
        phone: o?.phoneNumber || '-',
        details,
        amount: Number(o?.totalAmount || 0),
        status: o?.status || 'Pending'
      }
    }) : []
  ), [ordersRaw])

  const filtered = useMemo(() => {
    const term = String(searchTerm || '').trim().toLowerCase()
    return orders.filter(o => {
      const statusOk = statusFilter ? String(o.status || '').toLowerCase() === String(statusFilter).toLowerCase() : true
      if (!term) return statusOk
      const t = term
      const text = `${o.userName} ${o.email} ${o.phone} ${o.details} ${o.date} ${o.amount} ${toCurrency(o.amount)}`.toLowerCase()
      return text.includes(t) && statusOk
    })
  }, [orders, searchTerm, statusFilter])

  const metrics = useMemo(() => {
    const totalAmt = filtered.reduce((s, o) => s + (o.amount || 0), 0)
    const completed = filtered.filter(o => String(o.status).toLowerCase() === 'completed')
    const pending = filtered.filter(o => String(o.status).toLowerCase() === 'pending')
    return {
      totalCount: filtered.length,
      totalAmount: totalAmt,
      completedCount: completed.length,
      completedAmount: completed.reduce((s, o) => s + (o.amount || 0), 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, o) => s + (o.amount || 0), 0)
    }
  }, [filtered])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await getAllOrders()
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.message) ? res.message : (Array.isArray(res) ? res : []))
        setOrdersRaw(list)
        setToastOpen(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toIdString = v => {
    if (!v) return ''
    if (typeof v === 'string') return v
    if (typeof v === 'object') {
      if (v.$oid) return String(v.$oid)
      if (v.$id) return String(v.$id)
      if (v.oid) return String(v.oid)
      if (v._id) return toIdString(v._id)
    }
    return String(v)
  }

  const openOrder = order => {
    const o = order || {}
    setSelectedOrder(o)
    setOrderOpen(true)
    setMenuOpenId(null)
  }

  const openCustomer = order => {
    const o = order || {}
    setSelectedOrder(o)
    setCustomerOpen(true)
    setMenuOpenId(null)
  }

  const downloadReceipt = async (order) => {
    const o = order || {}
    const raw = ordersRaw.find(r => String(r?._id || r?.orderId) === String(o.id)) || {}
    const id = toIdString(raw?._id || raw?.orderId || o.id)
    if (!id) return
    try {
      if (String(downloadingId || '') === String(id)) return
      setDownloadingId(id)
      const blob = await downloadOrderReceipt(id)
      const a = document.createElement('a')
      const objectUrl = URL.createObjectURL(blob)
      a.href = objectUrl
      a.download = `order-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch (e) {
    } finally {
      setDownloadingId(null)
      setMenuOpenId(null)
    }
  }

  return (
    <div className='space-y-7 py-12 px-12'>
      <Toast open={toastOpen} onOpenChange={setToastOpen} title='Orders loaded' description='The orders list has been updated' variant='success' duration={2500} position='top-right' />

      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-semibold text-slate-900'>Orders</h1>
        <p className='text-sm text-[#99A1BC]'>Dashboard / Orders</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-2'>
        <div className='bg-[#2563EB] rounded-2xl p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-4 rounded-2xl'>
              <img src='/images/backend/icons/icons (3).svg' alt='Total Orders' className='w-8 h-8' />
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium text-white/90'>Total Orders</p>
              <p className='text-4xl font-bold'>{metrics.totalCount} ({toCurrency(metrics.totalAmount)})</p>
            </div>
          </div>
        </div>
        <div className='bg-[#16A34A] rounded-2xl p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-4 rounded-2xl'>
              <img src='/images/backend/icons/icons (5).svg' alt='Completed Orders' className='w-8 h-8' />
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium text-white/90'>Completed Orders</p>
              <p className='text-4xl font-bold'>{metrics.completedCount} ({toCurrency(metrics.completedAmount)})</p>
            </div>
          </div>
        </div>
        <div className='bg-[#DC2626] rounded-2xl p-6 text-white'>
          <div className='flex items-center justify-between'>
            <div className='bg-white p-4 rounded-2xl'>
              <img src='/images/backend/icons/icons (4).svg' alt='Pending Orders' className='w-8 h-8' />
            </div>
            <div className='text-right'>
              <p className='text-sm font-medium text-white/90'>Pending Orders</p>
              <p className='text-4xl font-bold'>{metrics.pendingCount} ({toCurrency(metrics.pendingAmount)})</p>
            </div>
          </div>
        </div>
      </div>

      <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <h2 className='text-lg font-semibold text-slate-900'>Order List</h2>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative flex items-center'>
              <input type='text' placeholder='Search' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]' />
              <Search className='absolute left-3 h-4 w-4 text-[#A6AEC7]' />
            </div>
            {filtersOpen && (
              <div className='relative'>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className='h-10 rounded-xl border border-[#E5E6EF] bg-white px-3 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none'>
                  <option value=''>All Status</option>
                  <option value='Completed'>Completed</option>
                  <option value='Pending'>Pending</option>
                </select>
              </div>
            )}
            <button onClick={() => setFiltersOpen(prev => !prev)} className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <IoFilterSharp className='h-4 w-4 text-[#8B93AF]' />
              {filtersOpen ? 'Hide Filters' : 'Filters'}
            </button>
            <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <Download className='h-4 w-4 text-[#8B93AF]' />
            </button>
          </div>
        </div>

        <div className='overflow-hidden rounded-2xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-[1.5fr_1.5fr_2fr_1.5fr_2fr_1fr_1fr] gap-3 bg-[#F7F9FD] px-6 py-4'>
            <div><div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>Ordered On</div></div>
            <div><div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>User Name</div></div>
            <div><div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>Email id</div></div>
            <div><div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>Phone Number</div></div>
            <div><div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>Order Details</div></div>
            <div><div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>Amount</div></div>
            <div className='flex justify-end'><div className='text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC]'>Order Status</div></div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {loading && (
              <div className='px-6 py-5 text-sm text-[#5E6582]'>Loading orders...</div>
            )}
            {!loading && filtered.map(o => (
              <div key={o.id} className='grid grid-cols-[1.5fr_1.5fr_2fr_1.5fr_2fr_1fr_1fr] gap-3 px-6 py-5 hover:bg-[#F9FAFD]'>
                <div className='self-center text-sm text-[#5E6582]'>{o.date}</div>
                <div className='self-center text-sm text-[#1A1F3F]'>{o.userName}</div>
                <div className='self-center text-sm text-[#5E6582]'>{o.email}</div>
                <div className='self-center text-sm text-[#5E6582]'>{o.phone}</div>
                <div className='self-center text-sm text-[#5E6582]'>{o.details}</div>
                <div className='self-center text-sm font-semibold text-slate-900 text-right'>{toCurrency(o.amount)}</div>
                <div className='self-center flex items-center justify-end gap-2'>
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${String(o.status).toLowerCase()==='completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>{o.status}</span>
                  <div className='relative'>
                    <button onClick={() => setMenuOpenId(menuOpenId===o.id?null:o.id)} className='rounded-full border border-transparent p-2 text-[#8C93AF] hover:border-[#E5E8F6] hover:bg-[#F5F7FD]'>
                      <MoreVertical className='h-4 w-4' />
                    </button>
                    {menuOpenId===o.id && (
                      <div ref={menuRef} className='absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white z-50'>
                        <div className='py-1'>
                          <a href={`/merchandise/order/receipt/${o.id}`} className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                            <span className='mr-3 text-gray-500'>
                              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                            </span>
                            <span className='text-gray-800'>View Detail</span>
                          </a>
                        
                          <button onClick={() => openCustomer(o)} className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                            <span className='mr-3 text-gray-500'>
                              <User className='h-4 w-4' />
                            </span>
                            <span className='text-gray-800'>Customer Detail</span>
                          </button>
                          {(() => {
                            const isDownloading = String(downloadingId || '') === String(o.id)
                            return (
                              <button onClick={() => downloadReceipt(o)} disabled={isDownloading} className={`flex items-center w-full px-4 py-2 text-sm ${isDownloading ? 'text-[#8C93AF] cursor-not-allowed opacity-70' : 'text-gray-700 hover:bg-gray-100'}`}>
                                <span className='mr-3 text-gray-500'>
                                  {isDownloading ? (<Loader2 className='h-4 w-4 animate-spin' />) : (<Download className='h-4 w-4' />)}
                                </span>
                                <span className='text-gray-800'>{isDownloading ? 'Processing…' : 'Download Receipt'}</span>
                              </button>
                            )
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!loading && filtered.length===0 && (
              <div className='px-6 py-5 text-sm text-[#5E6582]'>No orders found</div>
            )}
          </div>
        </div>
      </div>
      {orderOpen && selectedOrder && (
        <Modal open={orderOpen} onOpenChange={v => { if (!v) { setOrderOpen(false); setSelectedOrder(null) } }} title={'Order Details'}>
          {(() => {
            const raw = ordersRaw.find(r => String(r?._id || r?.orderId) === String(selectedOrder.id)) || {}
            const buyerName = raw?.userName || '-'
            const email = raw?.email || '-'
            const phone = raw?.phoneNumber || '-'
            const created = raw?.createdAt
            const items = Array.isArray(raw?.items) ? raw.items : []
            const total = Number(raw?.totalAmount || 0)
            return (
              <div className='space-y-6'>
                <div className='rounded-xl bg-[#F8F9FC] p-4'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='text-[#5E6582]'>Order ID</div>
                    <div className='text-right font-semibold text-slate-900'>{raw?._id || raw?.orderId || '-'}</div>
                    <div className='text-[#5E6582]'>Ordered On</div>
                    <div className='text-right font-semibold text-slate-900'>{formatDate(created) || '-'}</div>
                    <div className='text-[#5E6582]'>Customer</div>
                    <div className='text-right font-semibold text-slate-900'>{buyerName}</div>
                  </div>
                </div>
                <div className='rounded-xl border border-[#E5E8F6] bg-white p-4'>
                  <div className='text-sm font-semibold text-slate-900 mb-3'>Items</div>
                  <div className='space-y-2'>
                    {items.length > 0 ? items.map((it, i) => (
                      <div key={i} className='flex items-center justify-between text-sm'>
                        <span>{Number(it?.quantity || 0)} x {it?.productId?.title || '-'}</span>
                        <span>{toCurrency(it?.price ?? it?.productId?.price)}</span>
                      </div>
                    )) : (<div className='text-sm text-[#5E6582]'>No items</div>)}
                  </div>
                  <div className='py-3 flex items-center justify-between'>
                    <span className='text-sm font-semibold text-slate-900'>Total</span>
                    <span className='text-base font-bold text-slate-900'>{toCurrency(total)}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}

      {customerOpen && selectedOrder && (
        <Modal open={customerOpen} onOpenChange={v => { if (!v) { setCustomerOpen(false); setSelectedOrder(null) } }} title={'Customer Details'}>
          {(() => {
            const raw = ordersRaw.find(r => String(r?._id || r?.orderId) === String(selectedOrder.id)) || {}
            const buyerName = raw?.userName || '-'
            const email = raw?.email || '-'
            const phone = raw?.phoneNumber || '-'
            const created = raw?.createdAt
            const items = Array.isArray(raw?.items) ? raw.items : []
            const total = Number(raw?.totalAmount || 0)
            return (
              <div className='space-y-6'>
                <div className='rounded-xl bg-[#F8F9FC] p-4'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='text-[#5E6582]'>Full Name</div>
                    <div className='text-right font-semibold text-slate-900'>{buyerName}</div>
                    <div className='text-[#5E6582]'>Email Address</div>
                    <div className='text-right font-semibold text-slate-900'>{email}</div>
                    <div className='text-[#5E6582]'>Phone</div>
                    <div className='text-right font-semibold text-slate-900'>{phone}</div>
                  </div>
                </div>
                <div className='rounded-xl bg-[#F8F9FC] p-4'>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='text-[#5E6582]'>Order ID</div>
                    <div className='text-right font-semibold text-slate-900'>{raw?._id || raw?.orderId || '-'}</div>
                    <div className='text-[#5E6582]'>Ordered On</div>
                    <div className='text-right font-semibold text-slate-900'>{formatDate(created) || '-'}</div>
                  </div>
                </div>
                <div className='rounded-xl border border-[#E5E8F6] bg-white p-4'>
                  <div className='text-sm font-semibold text-slate-900 mb-3'>Items</div>
                  <div className='space-y-2'>
                    {items.length > 0 ? items.map((it, i) => (
                      <div key={i} className='flex items-center justify-between text-sm'>
                        <span>{Number(it?.quantity || 0)} x {it?.productId?.title || '-'}</span>
                        <span>{toCurrency(it?.price ?? it?.productId?.price)}</span>
                      </div>
                    )) : (<div className='text-sm text-[#5E6582]'>No items</div>)}
                  </div>
                  <div className='py-3 flex items-center justify-between'>
                    <span className='text-sm font-semibold text-slate-900'>Total</span>
                    <span className='text-base font-bold text-slate-900'>{toCurrency(total)}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}
    </div>
  )
}

