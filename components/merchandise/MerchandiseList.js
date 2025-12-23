'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Search,
  Download,
  Loader2,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'
import Link from 'next/link'
import {
  getAllProducts,
  deleteProducts,
  deleteHardProducts
} from '@/services/merchandise/merchandise.service'

const metricCards = [
  {
    id: 'total',
    title: 'Total Merchandise',
    value: '1540',
    iconSrc: '/images/backend/icons/icons (3).svg',
    bg: 'bg-[#2563EB]'
  },
  {
    id: 'active',
    title: 'Active Merchandise',
    value: '1240',
    iconSrc: '/images/backend/icons/icons (5).svg',
    bg: 'bg-[#16A34A]'
  },
  {
    id: 'inactive',
    title: 'Inactive Merchandise',
    value: '100',
    iconSrc: '/images/backend/icons/icons (4).svg',
    bg: 'bg-[#DC2626]'
  }
]

const TableHeaderCell = ({
  children,
  align = 'left',
  onClick,
  active = false,
  direction = 'asc'
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] ${
      active ? 'text-[#2D3658]' : 'text-[#8A92AC]'
    } ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } hover:text-[#2D3658]`}
  >
    {children}
    {active ? (
      direction === 'asc' ? (
        <ChevronUp className='h-3.5 w-3.5 text-[#2D3658]' />
      ) : (
        <ChevronDown className='h-3.5 w-3.5 text-[#2D3658]' />
      )
    ) : (
      <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
    )}
  </button>
)

export default function MerchandiseList () {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastTitle, setToastTitle] = useState('Merchandise loaded')
  const [toastDesc, setToastDesc] = useState(
    'The merchandise list has been updated'
  )
  const [toastVariant, setToastVariant] = useState('success')
  const [updatingId, setUpdatingId] = useState(null)
  const [viewAllLoading, setViewAllLoading] = useState(false)
  const [addNewLoading, setAddNewLoading] = useState(false)
  const [sortBy, setSortBy] = useState('addedOn')
  const [sortDir, setSortDir] = useState('desc')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [hardDeleting, setHardDeleting] = useState(false)

  const toImageSrc = u => {
    let s = String(u || '').trim()
    s = s
      .replace(/`/g, '')
      .replace(/^['"]/g, '')
      .replace(/['"]$/g, '')
      .replace(/^\(+/, '')
      .replace(/\)+$/, '')
    if (!s) return ''
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

  const normalizeProduct = p => {
    const id = p?._id || p?.id
    const created = p?.createdAt || p?.addedOn
    const addedOn = (() => {
      try {
        if (created) {
          const d = new Date(
            typeof created === 'object' && created.$date
              ? created.$date
              : created
          )
          return d.toLocaleString(undefined, {
            weekday: 'short',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      } catch {}
      return String(p?.addedOn || '')
    })()
    const statusStr =
      typeof p?.status === 'boolean'
        ? p.status
          ? 'Active'
          : 'Inactive'
        : p?.status || 'Active'
    const categoryStr =
      p?.categoryId?.title ||
      p?.category?.title ||
      p?.categoryName ||
      p?.category ||
      p?.merchandise?.title ||
      ''
    const imageStr =
      p?.imageUrl || p?.image || (Array.isArray(p?.images) ? p.images[0] : '')
    const priceNum =
      typeof p?.price === 'number'
        ? p.price
        : typeof p?.amount === 'number'
        ? p.amount
        : typeof p?.productPrice === 'number'
        ? p.productPrice
        : 0
    const stockCountNum =
      typeof p?.stockCount === 'number'
        ? p.stockCount
        : typeof p?.stock === 'number'
        ? p.stock
        : 0
    const stockLeftNum =
      typeof p?.stockLeft === 'number'
        ? p.stockLeft
        : typeof p?.available === 'number'
        ? p.available
        : stockCountNum
    const totalOrdersNum =
      typeof p?.totalOrders === 'number'
        ? p.totalOrders
        : typeof p?.ordersCount === 'number'
        ? p.ordersCount
        : typeof p?.orders === 'number'
        ? p.orders
        : 0
    return {
      id,
      addedOn,
      name: p?.productName || p?.title || p?.name || '-',
      category: categoryStr || '-',
      price: priceNum,
      stockCount: stockCountNum,
      stockLeft: stockLeftNum,
      ordersCount: totalOrdersNum,
      status: statusStr,
      image: toImageSrc(imageStr) || '/images/no-image.webp',
      totalOrders: totalOrdersNum
    }
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getAllProducts()
        const list = Array.isArray(res?.message)
          ? res.message
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        const mapped = list.map(normalizeProduct)
        setItems(mapped)
        setToastTitle('Merchandise loaded')
        setToastDesc('The merchandise list has been updated')
        setToastVariant('success')
        setToastOpen(true)
      } catch (e) {
        setItems([])
        setError('Failed to load merchandise')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const itemRows = items.map((e, idx) => {
    const gradients = [
      'bg-gradient-to-br from-orange-400 to-red-500',
      'bg-gradient-to-br from-blue-400 to-purple-500',
      'bg-gradient-to-br from-green-400 to-teal-500',
      'bg-gradient-to-br from-yellow-400 to-orange-500'
    ]
    const statusClass =
      String(e.status || '').toLowerCase() === 'active'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    return {
      id: e.id,
      rowKey: e.id || `merch-${idx}`,
      addedOn: e.addedOn,
      name: e.name || '-',
      category: e.category || '-',
      priceNum: typeof e.price === 'number' ? e.price : 0,
      priceText: `₦${Number(e.price || 0).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`,
      stockCount: typeof e.stockCount === 'number' ? e.stockCount : 0,
      stockLeftNum: typeof e.stockLeft === 'number' ? e.stockLeft : 0,
      stockLeftText:
        typeof e.stockLeft === 'number'
          ? e.stockLeft === 0
            ? 'Sold Out'
            : e.stockLeft
          : '-',
      ordersCount:
        typeof e.totalOrders === 'number'
          ? e.totalOrders
          : typeof e.ordersCount === 'number'
          ? e.ordersCount
          : 0,
      status: e.status || '-',
      statusClass,
      imageBg: gradients[idx % gradients.length],
      image: e.image || '/images/no-image.webp'
    }
  })

  const sortedRows = [...itemRows].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortBy) {
      case 'addedOn':
        return (
          dir * String(a.addedOn || '').localeCompare(String(b.addedOn || ''))
        )
      case 'name':
        return dir * a.name.localeCompare(b.name)
      case 'category':
        return dir * a.category.localeCompare(b.category)
      case 'price':
        return dir * (a.priceNum - b.priceNum)
      case 'stockCount':
        return dir * (a.stockCount - b.stockCount)
      case 'stockLeft':
        return dir * (a.stockLeftNum - b.stockLeftNum)
      case 'orders':
        return dir * (a.ordersCount - b.ordersCount)
      case 'status':
        return dir * String(a.status).localeCompare(String(b.status))
      default:
        return 0
    }
  })

  const filteredRows = [...sortedRows].filter(r => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    const categoryOk = categoryFilter
      ? String(r.category || '')
          .toLowerCase()
          .includes(String(categoryFilter).toLowerCase())
      : true
    const statusOk = statusFilter
      ? String(r.status || '').toLowerCase() ===
        String(statusFilter).toLowerCase()
      : true
    if (!term) return categoryOk && statusOk
    const name = String(r.name || '').toLowerCase()
    const cat = String(r.category || '').toLowerCase()
    const dateStr = String(r.addedOn || '').toLowerCase()
    const matchesText =
      name.includes(term) || cat.includes(term) || dateStr.includes(term)
    return matchesText && categoryOk && statusOk
  })

  const categoryOptions = Array.from(
    new Set(itemRows.map(r => String(r.category || '').trim()).filter(Boolean))
  )

  const handleSort = key => {
    if (sortBy === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('desc')
    }
  }

  const handleSetStatus = async (id, isActive) => {
    if (!id) return
    try {
      setUpdatingId(id)
      await deleteProducts(id, isActive ? true : false)
      setItems(prev =>
        prev.map(p => {
          const pid = p?._id || p?.id
          if (pid === id) {
            return { ...p, status: isActive ? 'Active' : 'Inactive' }
          }
          return p
        })
      )
      setToastTitle(
        isActive ? 'Merchandise activated' : 'Merchandise inactivated'
      )
      setToastDesc(`Status updated to ${isActive ? 'Active' : 'Inactive'}`)
      setToastVariant('success')
      setToastOpen(true)
      setActiveDropdown(null)
    } catch (e) {
      setError('Failed to update status')
      setToastTitle('Update failed')
      setToastDesc('Failed to update status')
      setToastVariant('error')
      setToastOpen(true)
    } finally {
      setUpdatingId(null)
    }
  }

  const openHardDelete = id => {
    setConfirmId(id)
    setConfirmOpen(true)
  }

  const confirmHardDelete = async () => {
    if (!confirmId) return
    try {
      setHardDeleting(true)
      await deleteHardProducts(confirmId)
      setItems(prev =>
        prev.filter(p => {
          const pid = p?._id || p?.id
          return pid !== confirmId
        })
      )
      setToastTitle('Merchandise permanently deleted')
      setToastDesc('The merchandise has been removed')
      setToastVariant('success')
      setToastOpen(true)
    } catch (e) {
      setError('Failed to permanently delete merchandise')
      setToastTitle('Delete failed')
      setToastDesc('Failed to permanently delete merchandise')
      setToastVariant('error')
      setToastOpen(true)
    } finally {
      setHardDeleting(false)
      setConfirmOpen(false)
      setConfirmId(null)
      setActiveDropdown(null)
    }
  }

  const counts = {
    total: filteredRows.length,
    active: filteredRows.filter(
      r => String(r.status).toLowerCase() === 'active'
    ).length,
    inactive: filteredRows.filter(
      r => String(r.status).toLowerCase() === 'inactive'
    ).length
  }

  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className='space-y-4 py-4 px-4'>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title={toastTitle}
        description={toastDesc}
        variant={toastVariant}
        duration={2500}
        position='top-right'
      />
      <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>Merchandise</h1>
          <p className='text-xs text-[#99A1BC]'>Dashboard / Merchandise</p>
        </div>
        <div className='flex flex-wrap items-center gap-2 md:justify-end'>
          <button
            onClick={() => {
              setViewAllLoading(true)
              router.push('/merchandise/order')
            }}
            disabled={viewAllLoading}
            className='rounded-lg border border-[#E5E6EF] bg-white px-3 py-1.5 text-xs font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD] disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {viewAllLoading ? (
              <span className='flex items-center gap-1.5'>
                <Loader2 className='h-3 w-3 animate-spin' />
                Loading...
              </span>
            ) : (
              'View All Orders'
            )}
          </button>
          <button
            onClick={() => {
              setAddNewLoading(true)
              router.push('/merchandise/add')
            }}
            disabled={addNewLoading}
            className='rounded-lg bg-[#FF5B2C] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'
          >
            {addNewLoading ? (
              <span className='flex items-center gap-1.5'>
                <Loader2 className='h-3 w-3 animate-spin' />
                Navigating...
              </span>
            ) : (
              'Add New Merchandise'
            )}
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 mb-4'>
        {metricCards.map(card => {
          const cardValue =
            card.id === 'total'
              ? counts.total
              : card.id === 'active'
              ? counts.active
              : card.id === 'inactive'
              ? counts.inactive
              : card.value
          return (
            <div
              key={card.id}
              className={`${card.bg} rounded-xl p-3 text-white relative overflow-hidden`}
            >
              <div className='flex items-center justify-between'>
                <div className='bg-white p-2.5 rounded-xl flex-shrink-0'>
                  <img
                    src={card.iconSrc}
                    alt={card.title}
                    className='w-6 h-6'
                  />
                </div>
                <div className='text-right'>
                  <p className='text-white/90 text-xs font-medium mb-1'>
                    {card.title}
                  </p>
                  <p className='text-2xl font-bold text-white'>
                    {String(cardValue)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold text-slate-900'>
            Merchandise List
          </h2>
          <div className='flex flex-wrap items-center gap-2'>
            <div className='relative flex items-center'>
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-8 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] pl-8 pr-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
              <Search className='absolute left-2.5 h-3.5 w-3.5 text-[#A6AEC7]' />
            </div>
            {filtersOpen && (
              <>
                <div className='relative'>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className='h-8 rounded-lg border border-[#E5E6EF] bg-white px-2 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none'
                  >
                    <option value=''>All Categories</option>
                    {categoryOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='relative'>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className='h-8 rounded-lg border border-[#E5E6EF] bg-white px-2 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none'
                  >
                    <option value=''>All Status</option>
                    <option value='Active'>Active</option>
                    <option value='Inactive'>Inactive</option>
                  </select>
                </div>
              </>
            )}
            <button
              onClick={() => setFiltersOpen(prev => !prev)}
              aria-expanded={filtersOpen}
              className='flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
            >
              <IoFilterSharp className='h-3.5 w-3.5 text-[#8B93AF]' />
              {filtersOpen ? 'Hide Filters' : 'Filters'}
            </button>
            <button className='flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <Download className='h-3.5 w-3.5 text-[#8B93AF]' />
            </button>
          </div>
        </div>

        <div className='rounded-xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-[14%_20%_10%_9%_9%_9%_9%_10%_10%] gap-1 bg-[#F7F9FD] px-3 py-2.5'>
            <div>
              <TableHeaderCell
                onClick={() => handleSort('addedOn')}
                active={sortBy === 'addedOn'}
                direction={sortDir}
              >
                Added On
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell
                onClick={() => handleSort('name')}
                active={sortBy === 'name'}
                direction={sortDir}
              >
                Merchandise Name
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell
                onClick={() => handleSort('category')}
                active={sortBy === 'category'}
                direction={sortDir}
              >
                Category
              </TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell
                onClick={() => handleSort('price')}
                active={sortBy === 'price'}
                direction={sortDir}
              >
                Price
              </TableHeaderCell>
            </div>
            <div className='flex justify-end'>
              <TableHeaderCell
                align='right'
                onClick={() => handleSort('stockCount')}
                active={sortBy === 'stockCount'}
                direction={sortDir}
              >
                Stock
              </TableHeaderCell>
            </div>
            <div className='flex justify-end'>
              <TableHeaderCell
                align='right'
                onClick={() => handleSort('stockLeft')}
                active={sortBy === 'stockLeft'}
                direction={sortDir}
              >
                Left
              </TableHeaderCell>
            </div>
            <div className='flex justify-end'>
              <TableHeaderCell
                align='right'
                onClick={() => handleSort('orders')}
                active={sortBy === 'orders'}
                direction={sortDir}
              >
                Orders
              </TableHeaderCell>
            </div>
            <div className='flex justify-end'>
              <TableHeaderCell
                align='right'
                onClick={() => handleSort('status')}
                active={sortBy === 'status'}
                direction={sortDir}
              >
                Status
              </TableHeaderCell>
            </div>
            <div className='flex justify-center'>
              <TableHeaderCell align='right'>Action</TableHeaderCell>
            </div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {filteredRows.map(item => (
              <div
                key={item.rowKey}
                className='grid grid-cols-[14%_20%_10%_9%_9%_9%_9%_10%_10%] gap-1 px-3 py-2.5 hover:bg-[#F9FAFD] relative'
              >
                <div className='self-center text-xs text-[#5E6582] line-clamp-2'>
                  {item.addedOn}
                </div>
                <div className='flex items-center gap-2 min-w-0'>
                  <div className='relative h-10 w-10 overflow-hidden rounded-lg bg-[#F0F2F8] flex items-center justify-center flex-shrink-0'>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='40px'
                        className='object-cover'
                        unoptimized={true}
                      />
                    ) : (
                      <span
                        className={`text-sm font-semibold text-white ${item.imageBg} h-full w-full flex items-center justify-center`}
                      >
                        {item.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className='min-w-0'>
                    <p
                      className='text-xs font-semibold text-slate-900 line-clamp-2'
                      dangerouslySetInnerHTML={{ __html: item.name }}
                    />
                  </div>
                </div>
                <div className='self-center text-xs text-[#5E6582] line-clamp-2'>
                  {item.category}
                </div>
                <div className='self-center text-xs font-semibold text-slate-900'>
                  {item.priceText}
                </div>
                <div className='self-center text-xs font-semibold text-slate-900 text-right'>
                  {item.stockCount}
                </div>
                <div className='self-center text-xs font-semibold text-slate-900 text-right'>
                  {item.stockLeftText}
                </div>
                <div className='flex items-center underline gap-1 self-center text-xs font-semibold whitespace-nowrap justify-end'>
                  <Link
                    href={item.id ? `/merchandise/order/${item.id}` : '#'}
                    className='text-xs text-[#0069C5] hover:text-[#0F4EF1] transition-colors font-semibold'
                  >
                    <span className='text-xs text-[#0069C5] hover:text-[#0F4EF1] transition-colors'>
                      {item.ordersCount}{' '}
                    </span>
                    View
                  </Link>
                </div>
                <div className='flex items-center justify-end gap-1'>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.statusClass}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className='relative flex items-center justify-center gap-1 z-10'>
                  <span className='relative z-10'>
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === item.rowKey ? null : item.rowKey
                        )
                      }
                      className='rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                    >
                      <svg
                        className='h-5 w-5 text-gray-600'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                      </svg>
                    </button>
                    {activeDropdown === item.rowKey && (
                      <div
                        ref={dropdownRef}
                        className='absolute right-full top-0 mr-2 w-48 rounded-md shadow-lg bg-white z-[100]'
                      >
                        <div className='py-1'>
                          <Link
                            href={
                              item.id ? `/merchandise/detail/${item.id}` : '#'
                            }
                            className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
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
                            <span className='text-gray-800'>
                              View/Edit Detail
                            </span>
                          </Link>
                          <Link
                            href={
                              item.id ? `/merchandise/order/${item.id}` : '#'
                            }
                            className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
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
                                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                />
                              </svg>
                            </span>
                            <span className='text-gray-800'>View Orders</span>
                          </Link>
                          {String(item.status).toLowerCase() === 'active' ? (
                            <button
                              onClick={() => handleSetStatus(item.id, false)}
                              className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
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
                                    d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                                  />
                                </svg>
                              </span>
                              <span className='text-gray-800'>
                                {updatingId === item.id
                                  ? 'Updating...'
                                  : 'Inactive'}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetStatus(item.id, true)}
                              className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
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
                                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                  />
                                </svg>
                              </span>
                              <span className='text-gray-800'>
                                {updatingId === item.id
                                  ? 'Updating...'
                                  : 'Active'}
                              </span>
                            </button>
                          )}
                          <button
                            onClick={() => openHardDelete(item.id)}
                            className='flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50'
                          >
                            <span className='mr-3 text-red-500'>
                              <svg
                                className='w-4 h-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth='2'
                                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3'
                                />
                              </svg>
                            </span>
                            <span className='text-red-700'>
                              Permanent Delete
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </span>
                </div>
              </div>
            ))}
            {filteredRows.length === 0 && (
              <div className='px-3 py-3 text-xs text-[#5E6582]'>
                No merchandise found
              </div>
            )}
          </div>
        </div>
      </div>
      {confirmOpen && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!hardDeleting) {
                setConfirmOpen(false)
                setConfirmId(null)
              }
            }}
          />
          <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-3'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-lg font-semibold text-slate-900'>
                  Delete this merchandise permanently?
                </div>
                <div className='mt-1 text-sm text-[#5E6582]'>
                  This action cannot be undone.
                </div>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  if (!hardDeleting) {
                    setConfirmOpen(false)
                    setConfirmId(null)
                  }
                }}
                className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
                disabled={hardDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmHardDelete}
                disabled={hardDeleting}
                className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {hardDeleting ? (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
