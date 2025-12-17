'use client'

import { useEffect, useMemo, useState } from 'react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { getMedOrderList } from '@/services/med/med.service'

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
        <div className='relative bg-white rounded-2xl shadow-xl w-[90%] max-w-2xl'>
          <div className='p-6 border-b border-gray-200 flex items-center justify-between'>
            <h3 className='text-xl font-semibold text-gray-900'>
              Medical Order
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
          <div className='p-6 space-y-6'>
            <div className='grid grid-cols-2 gap-x-6 gap-y-3'>
              <div className='text-sm text-gray-500'>Order ID</div>
              <div className='text-sm text-gray-900'>
                {String(r?._id || '')}
              </div>
              <div className='text-sm text-gray-500'>Payment Status</div>
              <div className='text-sm text-gray-900'>
                {String(api?.payment_status || '-')}
              </div>
              <div className='text-sm text-gray-500'>Amount</div>
              <div className='text-sm font-semibold text-gray-900'>
                {toCurrency(amount)}
              </div>
              <div className='text-sm text-gray-500'>Customer Name</div>
              <div className='text-sm text-gray-900'>
                {String(cust?.name || custTop?.contact_person_name || '-')}
              </div>
              <div className='text-sm text-gray-500'>Email</div>
              <div className='text-sm text-gray-900'>
                {String(cust?.email || custTop?.email || '-')}
              </div>
              <div className='text-sm text-gray-500'>Created At</div>
              <div className='text-sm text-gray-900'>
                {formatDate(r?.createdAt || api?.created_at) || '-'}
              </div>
              <div className='text-sm text-gray-500'>Updated At</div>
              <div className='text-sm text-gray-900'>
                {formatDate(r?.updatedAt || api?.updated_at) || '-'}
              </div>
            </div>
            <div className='border-t border-gray-200 pt-4'>
              <div className='text-sm font-semibold text-gray-900 mb-2'>
                User
              </div>
              <div className='grid grid-cols-2 gap-x-6 gap-y-3'>
                <div className='text-sm text-gray-500'>User ID</div>
                <div className='text-sm text-gray-900'>
                  {String(r?.user_id || '')}
                </div>
                <div className='text-sm text-gray-500'>Name</div>
                <div className='text-sm text-gray-900'>
                  {String(cust?.name || custTop?.contact_person_name || '-')}
                </div>
                <div className='text-sm text-gray-500'>Email</div>
                <div className='text-sm text-gray-900'>
                  {String(cust?.email || custTop?.email || '-')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='mb-4'>
        <h1 className='text-xl font-bold text-gray-900 mb-1'>Medical Orders</h1>
        <nav className='text-sm text-gray-500'>
          <span>Dashboard</span> /{' '}
          <span className='text-gray-900 font-medium'>Healthcare</span>
        </nav>
      </div>

      <div className='bg-gray-200 p-5 rounded-xl'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-4 border-b border-gray-200'>
            <div className='flex justify-between items-center mb-3'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Orders List
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
          </div>

          <div className='overflow-x-auto'>
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
                      No medical orders found
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
