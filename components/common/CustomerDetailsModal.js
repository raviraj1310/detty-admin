'use client'

import Modal from '@/components/ui/Modal'

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

export default function CustomerDetailsModal({ open, onOpenChange, order, selected }) {
  const raw = order || {}
  const sel = selected || {}
  const orderId = String(
    raw?.orderId || raw?._id || sel?.orderId || sel?.id || ''
  )
  const items = Array.isArray(raw?.items) ? raw.items : []
  const lines = items.map(it => {
    const qty = Number(it?.quantity || 0)
    const unit = Number(it?.price ?? it?.productId?.price ?? 0)
    const name = it?.productId?.title || '-'
    return `${toCurrency(unit)} × ${qty} ${name}`
  })
  const subtotalNum = items.reduce((sum, it) => {
    const qty = Number(it?.quantity || 0)
    const unit = Number(it?.price ?? it?.productId?.price ?? 0)
    return sum + qty * unit
  }, 0)
  const discountNum = Number(raw?.discount || 0)
  const serviceFeeNum = Number(raw?.serviceFee || 0)
  const totalNum = Number(raw?.totalAmount || subtotalNum - discountNum + serviceFeeNum)
  const buyerName = raw?.userName || sel?.userName || '-'
  const email = raw?.email || sel?.email || '-'
  const created = raw?.createdAt

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={'Customer Details'}>
      <div className='space-y-6'>
        <div className='mb-2'>
          <div className='text-base font-semibold text-gray-900 mb-3'>
            Order ID {orderId || '-'}
          </div>
          <div className='flex justify-between items-center bg-gray-50 p-3 rounded-lg'>
            <span className='text-sm text-gray-700'>
              {lines.length > 0 ? lines.join(', ') : sel?.quantity || '-'}
            </span>
            <span className='font-semibold text-gray-900'>
              {toCurrency(totalNum)}
            </span>
          </div>
        </div>

        <div className='mb-2'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div className='text-[#5E6582]'>Ordered On</div>
            <div className='text-right font-semibold text-slate-900'>
              {formatDate(created) || '-'}
            </div>
          </div>
        </div>

        <div className='mb-5'>
          <div className='text-base font-semibold text-gray-900 mb-4'>
            Billing Details
          </div>
          <div className='space-y-3'>
            <div className='flex justify-between items-center py-1'>
              <span className='text-sm text-gray-600'>Customer Name</span>
              <span className='text-sm font-medium text-gray-900'>{buyerName}</span>
            </div>
            <div className='flex justify-between items-center py-1'>
              <span className='text-sm text-gray-600'>Buyer\'s Email Address</span>
              <span className='text-sm font-medium text-gray-900'>{email}</span>
            </div>
            <div className='flex justify-between items-center py-1'>
              <span className='text-sm text-gray-600'>Service Fee - 8.5% (VAT + processing)</span>
              <span className='text-sm font-medium text-gray-900'>{toCurrency(serviceFeeNum)}</span>
            </div>
            <div className='flex justify-between items-center py-1'>
              <span className='text-sm text-gray-600'>Discount Applied</span>
              <span className='text-sm font-medium text-gray-900'>{toCurrency(discountNum)}</span>
            </div>
            <div className='flex justify-between items-center py-1'>
              <span className='text-sm text-gray-600'>Subtotal</span>
              <span className='text-sm font-medium text-gray-900'>{toCurrency(subtotalNum)}</span>
            </div>
          </div>
        </div>

        <div className='border-t border-gray-200 pt-4'>
          <div className='flex justify-between items-center'>
            <span className='text-lg font-semibold text-gray-900'>Total</span>
            <span className='text-xl font-bold text-orange-500'>{toCurrency(totalNum)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

