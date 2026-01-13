'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Search,
  MoreVertical,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getAllCountries,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry
} from '@/services/country/country.service'
import Toast from '@/components/ui/Toast'

const TableHeaderCell = ({
  children,
  align = 'left',
  onClick,
  active = false,
  order = 'desc'
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } ${active ? 'text-[#2D3658]' : 'text-[#8A92AC]'}`}
  >
    {children}
    <TbCaretUpDownFilled
      className={`h-3 w-3 ${active ? 'text-[#4F46E5]' : 'text-[#CBCFE2]'} ${
        order === 'asc' ? 'rotate-180' : ''
      }`}
    />
  </button>
)

export default function CountryMaster () {
  const formSectionRef = useRef(null)
  const nameInputRef = useRef(null)
  const [formData, setFormData] = useState({ name: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [rowActionLoading, setRowActionLoading] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  const normalizeCountry = d => ({
    _id: d?._id || d?.id || '',
    name: d?.name || '',
    createdAt: d?.createdAt || d?.updatedAt || ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.name || formData.name.trim().length < 2)
      errs.name = 'Enter a valid country name'
    return errs
  }

  const fetchCountries = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllCountries({ page, limit, search: searchTerm })
      let list = []
      if (res?.docs) {
        list = res.docs
        setTotalPages(res.totalPages || 1)
        setTotal(res.totalDocs || 0)
      } else if (res?.data?.docs) {
        list = res.data.docs
        setTotalPages(res.data.totalPages || 1)
        setTotal(res.data.totalDocs || 0)
      } else {
        list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        setTotalPages(1)
        setTotal(list.length)
      }
      setCountries(list.map(normalizeCountry))
    } catch (e) {
      setError('Failed to load countries')
      setCountries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCountries()
  }, [page, limit, searchTerm])

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuOpenId !== null) {
        const target = event.target
        const isMenuButton = target.closest('button[data-menu-button]')
        const isMenuContent = target.closest('[data-menu-content]')
        if (!isMenuButton && !isMenuContent) setMenuOpenId(null)
      }
    }
    if (menuOpenId !== null)
      document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    try {
      setSubmitting(true)
      const payload = { name: formData.name.trim() }
      if (editingId) await updateCountry(editingId, payload)
      else await createCountry(payload)
      await fetchCountries()
      setFormData({ name: '' })
      setErrors({})
      setEditingId(null)
      setToast({
        open: true,
        title: editingId ? 'Country updated' : 'Country created',
        description: editingId
          ? 'Changes have been saved'
          : 'Your country has been added',
        variant: 'success'
      })
    } catch (e) {
      setError(
        editingId ? 'Failed to update country' : 'Failed to create country'
      )
      setToast({
        open: true,
        title: 'Error',
        description:
          e?.response?.data?.message ||
          e?.message ||
          (editingId ? 'Failed to update country' : 'Failed to create country'),
        variant: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = async id => {
    setRowActionLoading(id)
    try {
      const res = await getCountryById(id)
      const country = res?.data || res || {}
      setFormData({ name: String(country.name || '') })
      setEditingId(id)
      setMenuOpenId(null)
      setErrors({})
      setTimeout(() => {
        formSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
        nameInputRef.current?.focus()
      }, 50)
    } catch (e) {
      setError('Failed to load country')
    } finally {
      setRowActionLoading(null)
    }
  }

  const confirmDelete = async () => {
    if (!confirmId) return
    setDeleting(true)
    try {
      await deleteCountry(confirmId)
      await fetchCountries()
      setToast({
        open: true,
        title: 'Country deleted',
        description: 'The country has been removed',
        variant: 'success'
      })
    } catch (e) {
      setError('Failed to delete country')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmId(null)
    }
  }

  const filteredCountries = useMemo(() => {
    return Array.isArray(countries) ? countries : []
  }, [countries])

  const getSortValue = (country, key) => {
    if (key === 'addedOn') {
      const d = country.createdAt
      return d
        ? new Date(typeof d === 'object' && d.$date ? d.$date : d).getTime()
        : 0
    }
    if (key === 'name') return String(country.name || '').toLowerCase()
    return 0
  }

  const sortedCountries = useMemo(() => {
    const arr = Array.isArray(filteredCountries) ? [...filteredCountries] : []
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string')
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [filteredCountries, sortKey, sortOrder])

  const toggleSort = key => {
    if (sortKey === key) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  return (
    <div className='space-y-5 py-2 px-3'>
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />

      <div className='flex flex-col gap-1 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>
            Country Master
          </h1>
          <p className='text-xs text-[#99A1BC]'>Dashboard / Masters</p>
        </div>
      </div>

      <div className='bg-gray-100 rounded-xl p-2'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-sm font-semibold text-slate-900'>
              Country Details
            </h2>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className='rounded-xl bg-[#FF5B2C] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {submitting ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  {editingId ? 'Updating...' : 'Adding...'}
                </span>
              ) : editingId ? (
                'Update'
              ) : (
                'Add'
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} ref={formSectionRef}>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>
                Country Name
              </label>
              <input
                type='text'
                ref={nameInputRef}
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                placeholder='Enter country name'
              />
              {errors.name && (
                <p className='text-xs text-red-600'>{errors.name}</p>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className='bg-gray-100 rounded-xl p-2'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-4'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
            <h2 className='text-sm font-semibold text-slate-900'>
              Country List
            </h2>
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
          </div>

          <div className='overflow-hidden rounded-xl border border-[#E5E8F5]'>
            <div className='grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3'>
              <div className='col-span-5'>
                <TableHeaderCell
                  onClick={() => toggleSort('addedOn')}
                  active={sortKey === 'addedOn'}
                  order={sortOrder}
                >
                  Added On
                </TableHeaderCell>
              </div>
              <div className='col-span-5'>
                <TableHeaderCell
                  onClick={() => toggleSort('name')}
                  active={sortKey === 'name'}
                  order={sortOrder}
                >
                  Country Name
                </TableHeaderCell>
              </div>
              <div className='col-span-2'>
                <TableHeaderCell align='right'>Action</TableHeaderCell>
              </div>
            </div>

            <div className='divide-y divide-[#EEF1FA] bg-white'>
              {loading && (
                <div className='px-4 py-3 text-xs text-[#5E6582]'>
                  Loading...
                </div>
              )}
              {error && !loading && (
                <div className='px-4 py-3 text-xs text-red-600'>{error}</div>
              )}
              {!loading && !error && sortedCountries.length === 0 && (
                <div className='px-4 py-3 text-center text-xs text-[#5E6582]'>
                  No countries found
                </div>
              )}
              {!loading &&
                !error &&
                sortedCountries.map((country, idx) => (
                  <div
                    key={country._id || idx}
                    className='grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#F9FAFD]'
                  >
                    <div className='col-span-5 self-center text-xs text-[#5E6582] whitespace-nowrap'>
                      {country.createdAt
                        ? new Date(country.createdAt).toLocaleString(
                            undefined,
                            {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }
                          )
                        : '-'}
                    </div>
                    <div className='col-span-5 self-center text-xs font-semibold text-slate-900'>
                      {country.name || '-'}
                    </div>
                    <div className='col-span-2 flex items-center justify-end'>
                      <div className='relative'>
                        <button
                          data-menu-button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === (country._id || idx)
                                ? null
                                : country._id || idx
                            )
                          }
                          className='rounded-full border border-transparent p-1.5 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                        {menuOpenId === (country._id || idx) && (
                          <div
                            data-menu-content
                            className='absolute right-0 mt-1 w-32 rounded-md border border-[#E5E8F6] bg-white shadow-lg z-20'
                          >
                            <button
                              onClick={() => startEdit(country._id)}
                              className='flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#2D3658] hover:bg-[#F6F7FD]'
                              disabled={rowActionLoading === country._id}
                            >
                              {rowActionLoading === country._id ? (
                                <Loader2 className='h-3.5 w-3.5 animate-spin' />
                              ) : (
                                <Pencil className='h-3.5 w-3.5' />
                              )}
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmId(country._id)
                                setConfirmOpen(true)
                                setMenuOpenId(null)
                              }}
                              className='flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination Controls */}
            <div className='flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6'>
              <div className='flex flex-1 justify-between sm:hidden'>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className='relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className='relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                >
                  Next
                </button>
              </div>
              <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm text-gray-700'>
                    Showing{' '}
                    <span className='font-medium'>
                      {(page - 1) * limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className='font-medium'>
                      {Math.min(page * limit, total)}
                    </span>{' '}
                    of <span className='font-medium'>{total}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className='isolate inline-flex -space-x-px rounded-md shadow-sm'
                    aria-label='Pagination'
                  >
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className='relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
                    >
                      <span className='sr-only'>Previous</span>
                      <ChevronLeft className='h-5 w-5' aria-hidden='true' />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        p =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 1 && p <= page + 1)
                      )
                      .map((p, i, arr) => (
                        <span key={p}>
                          {i > 0 && arr[i - 1] !== p - 1 && (
                            <span className='relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0'>
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => setPage(p)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              page === p
                                ? 'z-10 bg-[#FF5B2C] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B2C]'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                            }`}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className='relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
                    >
                      <span className='sr-only'>Next</span>
                      <ChevronRight className='h-5 w-5' aria-hidden='true' />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        {confirmOpen && (
          <div className='fixed inset-0 z-40 flex items-center justify-center'>
            <div
              className='absolute inset-0 bg-black/40'
              onClick={() => {
                if (!deleting) {
                  setConfirmOpen(false)
                  setConfirmId(null)
                }
              }}
            />
            <div className='relative z-50 w-full max-w-sm rounded-xl border border-[#E5E8F6] bg-white p-5 shadow-lg'>
              <div className='flex items-start gap-3'>
                <div className='rounded-full bg-red-100 p-2'>
                  <AlertCircle className='h-5 w-5 text-red-600' />
                </div>
                <div className='flex-1'>
                  <div className='text-sm font-semibold text-slate-900'>
                    Delete this country?
                  </div>
                  <div className='mt-1 text-xs text-[#5E6582]'>
                    This action cannot be undone.
                  </div>
                </div>
              </div>
              <div className='mt-4 flex justify-end gap-2'>
                <button
                  onClick={() => {
                    if (!deleting) {
                      setConfirmOpen(false)
                      setConfirmId(null)
                    }
                  }}
                  className='rounded-lg border border-[#E5E6EF] bg-white px-4 py-1.5 text-xs font-medium text-[#1A1F3F] transition hover:bg-[#F9FAFD]'
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className='rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {deleting ? (
                    <span className='flex items-center gap-1'>
                      <Loader2 className='h-3.5 w-3.5 animate-spin' />
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
    </div>
  )
}
