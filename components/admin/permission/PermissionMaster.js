'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Search,
  MoreVertical,
  Loader2,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission
} from '@/services/permission/permission.service'
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

export default function PermissionMaster () {
  const formSectionRef = useRef(null)
  const nameInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    module: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.name || formData.name.trim().length < 2)
      errs.name = 'Enter a valid permission name'
    return errs
  }

  const fetchPermissions = async (page = 1, limit = 10) => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllPermissions(page, limit)
      const list = res?.data || (Array.isArray(res) ? res : [])
      setPermissions(list)
      setPagination(prev => ({
        ...prev,
        page: res?.page || page,
        limit: res?.limit || limit,
        total: res?.total || list.length,
        totalPages: res?.totalPages || 1
      }))
    } catch {
      setError('Failed to load permissions')
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions(pagination.page, pagination.limit)
  }, [pagination.page, pagination.limit])

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
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) return
    setSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        module: String(formData.module || '').trim()
      }
      if (editingId) {
        const res = await updatePermission(editingId, payload)
        if (res?.success || res) {
          setToast({
            open: true,
            title: 'Permission updated',
            description: formData.name,
            variant: 'success'
          })
          setEditingId(null)
        }
      } else {
        const res = await createPermission(payload)
        if (res?.success || res) {
          setToast({
            open: true,
            title: 'Permission added',
            description: formData.name,
            variant: 'success'
          })
        }
      }
      setFormData({
        name: '',
        module: ''
      })
      await fetchPermissions(pagination.page, pagination.limit)
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || 'Failed to save permission'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = item => {
    setFormData({
      name: item.name || '',
      module: item.module || ''
    })
    setEditingId(item._id)
    setMenuOpenId(null)
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      nameInputRef.current?.focus()
    }, 50)
  }

  const confirmDelete = async () => {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res = await deletePermission(confirmId)
      if (res?.success || res) {
        await fetchPermissions(pagination.page, pagination.limit)
        setToast({
          open: true,
          title: 'Permission deleted',
          description: 'Removed successfully',
          variant: 'success'
        })
      }
    } catch {
      setError('Failed to delete permission')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmId(null)
    }
  }

  const filteredPermissions = useMemo(() => {
    const base = Array.isArray(permissions) ? permissions : []
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()

    const formatAdded = d => {
      if (!d) return ''
      const date = new Date(typeof d === 'object' && d.$date ? d.$date : d)
      return date.toLocaleString(undefined, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return base.filter(a => {
      const name = String(a.name || '').toLowerCase()
      const addedStr = String(
        formatAdded(a.createdAt || a.updatedAt) || ''
      ).toLowerCase()

      return !term ? true : name.includes(term) || addedStr.includes(term)
    })
  }, [permissions, searchTerm])

  const getSortValue = (a, key) => {
    if (key === 'addedOn') {
      const d = a.createdAt || a.updatedAt
      return d
        ? new Date(typeof d === 'object' && d.$date ? d.$date : d).getTime()
        : 0
    }
    if (key === 'name') return String(a.name || '').toLowerCase()
    return 0
  }

  const sortedPermissions = useMemo(() => {
    const arr = [...filteredPermissions]
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [filteredPermissions, sortKey, sortOrder])

  const toggleSort = key => {
    if (sortKey === key) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleLimitChange = e => {
    setPagination(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))
  }

  return (
    <div className='space-y-5 py-6 px-6'>
      {/* Header */}
      <div className='flex flex-col gap-1 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>
            Permission Masters
          </h1>
          <p className='text-xs text-[#99A1BC]'>Dashboard / Masters</p>
        </div>
      </div>

      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl'>
            <h3 className='text-lg font-semibold text-slate-900'>
              Confirm Delete
            </h3>
            <p className='mt-2 text-sm text-slate-500'>
              Are you sure you want to delete this permission? This action
              cannot be undone.
            </p>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setConfirmOpen(false)
                  setConfirmId(null)
                }}
                disabled={deleting}
                className='rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100'
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className='flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60'
              >
                {deleting && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-sm font-semibold text-slate-900'>
            Permission Details
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>
                Permission Name
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                ref={nameInputRef}
                className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                placeholder='Enter permission name'
              />
              {errors.name && (
                <p className='text-xs text-red-600'>{errors.name}</p>
              )}
            </div>

            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>
                Module
              </label>
              <input
                type='text'
                value={formData.module}
                onChange={e => handleInputChange('module', e.target.value)}
                className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                placeholder='Enter module name'
              />
            </div>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-4'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold text-slate-900'>
            Permission List
          </h2>
          <div className='flex items-center gap-2'>
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
        </div>

        <div className='overflow-visible rounded-xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3'>
            <div className='col-span-2'>
              <TableHeaderCell
                onClick={() => toggleSort('addedOn')}
                active={sortKey === 'addedOn'}
                order={sortOrder}
              >
                Added On
              </TableHeaderCell>
            </div>
            <div className='col-span-4'>
              <TableHeaderCell
                onClick={() => toggleSort('name')}
                active={sortKey === 'name'}
                order={sortOrder}
              >
                Name
              </TableHeaderCell>
            </div>
            <div className='col-span-6'>
              <span className='text-xs font-medium uppercase tracking-wide text-[#8A92AC]'>
                Module
              </span>
            </div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {loading && (
              <div className='px-4 py-3 text-xs text-[#5E6582]'>Loading...</div>
            )}
            {error && !loading && (
              <div className='px-4 py-3 text-xs text-red-600'>{error}</div>
            )}
            {!loading &&
              !error &&
              sortedPermissions.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className='grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#F9FAFD]'
                >
                  <div className='col-span-2 self-center text-xs text-[#5E6582]'>
                    {item.createdAt || item.updatedAt
                      ? new Date(
                          item.createdAt || item.updatedAt
                        ).toLocaleString(undefined, {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </div>
                  <div className='col-span-4 self-center text-xs font-semibold text-slate-900'>
                    {item.name || '-'}
                  </div>
                  <div className='col-span-6 flex items-center justify-between gap-4'>
                    <div className='self-center text-xs text-slate-700'>
                      {item.module || '-'}
                    </div>
                    <div className='relative shrink-0'>
                      <button
                        data-menu-button
                        onClick={() =>
                          setMenuOpenId(
                            menuOpenId === (item._id || idx)
                              ? null
                              : item._id || idx
                          )
                        }
                        className='rounded-full border border-transparent p-1.5 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>
                      {menuOpenId === (item._id || idx) && (
                        <div
                          data-menu-content
                          className='absolute right-0 top-full mt-1 w-32 rounded-md border border-[#E5E8F6] bg-white shadow-lg z-20'
                        >
                          <button
                            onClick={() => startEdit(item)}
                            className='flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#2D3658] hover:bg-[#F6F7FD]'
                          >
                            <Pencil className='h-3.5 w-3.5' />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setConfirmId(item._id)
                              setConfirmOpen(true)
                              setMenuOpenId(null)
                            }}
                            className='flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-[#FFF5F5]'
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

            {!loading && !error && sortedPermissions.length === 0 && (
              <div className='px-4 py-8 text-center text-xs text-[#8A92AC]'>
                No permissions found.
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className='border-t border-gray-200 px-4 py-3 flex items-center justify-between mt-auto'>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-gray-500'>Rows per page:</span>
            <select
              value={pagination.limit}
              onChange={handleLimitChange}
              className='h-8 px-2 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500'
            >
              {[5, 10, 25, 50, 100].map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-gray-500'>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className='flex items-center gap-1'>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className='p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <ChevronLeft size={16} className='text-gray-600' />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className='p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <ChevronRight size={16} className='text-gray-600' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
