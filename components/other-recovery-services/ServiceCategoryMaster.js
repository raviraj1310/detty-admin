'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Download,
  MoreVertical,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  updateCategoryStatus
} from '@/services/v2/other-recovery-services/otherRecoveryServices.service'

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' }
]

const TableHeaderCell = ({ children, align = 'left' }) => (
  <div
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-[#8A92AC] whitespace-nowrap ${
      align === 'right' ? 'justify-end' : 'justify-start'
    }`}
  >
    {children}
    <TbCaretUpDownFilled className='h-3 w-3 text-[#CBCFE2]' />
  </div>
)

export default function ServiceCategoryMaster () {
  const [isEditing, setIsEditing] = useState(false)
  const [currentCategoryId, setCurrentCategoryId] = useState(null)

  const [formData, setFormData] = useState({
    serviceCategoryName: '',
    status: 'Active'
  })

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await getCategories()
      const list = res?.data ?? res?.categories ?? res
      setCategories(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      showToast(
        err?.response?.data?.message || err?.message || 'Failed to fetch categories',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({ serviceCategoryName: '', status: 'Active' })
    setIsEditing(false)
    setCurrentCategoryId(null)
  }

  const handleFormSubmit = async () => {
    if (!formData.serviceCategoryName?.trim()) {
      showToast('Service Name is required', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        serviceCategoryName: formData.serviceCategoryName.trim(),
        status: formData.status || 'Active'
      }

      if (isEditing && currentCategoryId) {
        await updateCategory(currentCategoryId, payload)
        showToast('Category updated successfully', 'success')
      } else {
        await createCategory(payload)
        showToast('Category added successfully', 'success')
      }
      resetForm()
      fetchCategories()
    } catch (err) {
      console.error('Submit error:', err)
      showToast(
        err?.response?.data?.message || err?.message || 'Failed to save category',
        'error'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async category => {
    try {
      const res = await getCategoryById(category._id)
      const c = res?.category ?? res?.data ?? res ?? category
      setFormData({
        serviceCategoryName: c.serviceCategoryName ?? c.serviceName ?? '',
        status: c.status === true || String(c.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive'
      })
    } catch {
      setFormData({
        serviceCategoryName: category.serviceCategoryName ?? category.serviceName ?? '',
        status: category.status === true || String(category.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive'
      })
    }
    setIsEditing(true)
    setCurrentCategoryId(category._id)
    setActiveDropdown(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteCategory(deleteId)
      showToast('Category deleted successfully', 'success')
      fetchCategories()
      setConfirmOpen(false)
      setDeleteId(null)
      if (currentCategoryId === deleteId) resetForm()
    } catch (err) {
      console.error('Delete error:', err)
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete category', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleDelete = id => {
    setDeleteId(id)
    setConfirmOpen(true)
    setActiveDropdown(null)
  }

  const handleStatusChange = async (categoryId, active) => {
    const status = active ? 'Active' : 'Inactive'
    try {
      await updateCategoryStatus(categoryId, { status })
      showToast(`Category marked as ${status}`, 'success')
      fetchCategories()
    } catch (err) {
      console.error('Status change error:', err)
      showToast(err?.response?.data?.message || err?.message || 'Failed to update status', 'error')
    }
    setActiveDropdown(null)
  }

  const toggleDropdown = (e, id) => {
    e.stopPropagation()
    if (activeDropdown === id) {
      setActiveDropdown(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom,
        right: window.innerWidth - rect.right
      })
      setActiveDropdown(id)
    }
  }

  const handleExport = () => {
    if (categories.length === 0) {
      showToast('No data to export', 'error')
      return
    }
    const headers = ['Added On', 'Service Name', 'Status']
    const rows = filteredCategories.map(c => [
      c.createdAt
        ? new Date(c.createdAt).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          })
        : '',
      c.serviceCategoryName ?? c.serviceName ?? '',
      c.status === true || String(c.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive'
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `service-categories-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    showToast('Export started', 'success')
  }

  const filteredCategories = categories.filter(c => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    const name = (c.serviceCategoryName ?? c.serviceName ?? '').toLowerCase()
    return name.includes(term)
  })

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <Toast
        open={toast.show}
        onOpenChange={val => setToast(prev => ({ ...prev, show: val }))}
        title={toast.type === 'error' ? 'Error' : 'Success'}
        description={toast.message}
        variant={toast.type}
      />

      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-[#1E293B]'>
          Service Category Master
        </h1>
        <nav className='mt-1 text-sm text-[#64748B]'>
          <Link href='/dashboard' className='hover:text-[#1E293B]'>
            Dashboard
          </Link>
          <span className='mx-2'>/</span>
          <span className='text-[#1E293B]'>Service Category Master</span>
        </nav>
      </div>

      {/* Service Category Details */}
      <div className='mb-8 rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-lg font-bold text-[#1E293B]'>
            Service Category Details
          </h2>
          <button
            type='button'
            onClick={handleFormSubmit}
            disabled={isSubmitting}
            className='rounded-lg bg-[#FF5B2C] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#F0481A] disabled:opacity-50 transition'
          >
            {isSubmitting ? (
              <span className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                {isEditing ? 'Updating...' : 'Adding...'}
              </span>
            ) : isEditing ? (
              'Update'
            ) : (
              'Add'
            )}
          </button>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div>
            <label className='mb-2 block text-sm font-medium text-[#64748B]'>
              Service Name*
            </label>
            <input
              type='text'
              name='serviceCategoryName'
              value={formData.serviceCategoryName}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#1E293B] focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C]'
              placeholder='e.g. Sauna Therapy'
            />
          </div>
          <div>
            <label className='mb-2 block text-sm font-medium text-[#64748B]'>
              Status*
            </label>
            <select
              name='status'
              value={formData.status}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#1E293B] focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C]'
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Service Category List */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <h2 className='text-lg font-bold text-[#1E293B]'>
            Service Category List
          </h2>
          <div className='flex gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-[300px] rounded-lg border border-[#E2E8F0] pl-10 pr-4 text-sm focus:border-[#FF5B2C] focus:outline-none focus:ring-1 focus:ring-[#FF5B2C]'
              />
            </div>
            <button
              type='button'
              className='flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 text-sm font-medium text-[#64748B] hover:bg-gray-50'
            >
              <IoFilterSharp className='h-4 w-4' />
              Filters
            </button>
            <button
              type='button'
              onClick={handleExport}
              className='flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
            >
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-[#E1E6F7] bg-[#F8F9FC]'>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Added On</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Service Name</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Status</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-right' />
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E1E6F7]'>
              {loading ? (
                <tr>
                  <td colSpan='4' className='py-8 text-center text-[#64748B]'>
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      Loading categories...
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan='4' className='py-8 text-center text-[#64748B]'>
                    No categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map(cat => {
                  const isActive =
                    cat.status === true ||
                    String(cat.status || '').toLowerCase() === 'active'
                  return (
                    <tr key={cat._id} className='hover:bg-[#F8F9FC]'>
                      <td className='py-4 px-6 text-sm text-[#64748B]'>
                        {cat.createdAt
                          ? new Date(cat.createdAt).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric',
                              hour12: true
                            })
                          : '—'}
                      </td>
                      <td className='py-4 px-6 text-sm font-medium text-[#1E293B]'>
                        {cat.serviceCategoryName ?? cat.serviceName ?? '—'}
                      </td>
                      <td className='py-4 px-6'>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            isActive
                              ? 'border-[#22C55E] text-[#22C55E]'
                              : 'border-[#EF4444] text-[#EF4444]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                            }`}
                          />
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='py-4 px-6 text-right'>
                        <button
                          type='button'
                          onClick={e => toggleDropdown(e, cat._id)}
                          className='rounded-lg p-2 text-[#94A3B8] hover:bg-gray-100 hover:text-[#1E293B]'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => !deleting && setConfirmOpen(false)}
            onKeyDown={e => e.key === 'Escape' && !deleting && setConfirmOpen(false)}
            role='button'
            tabIndex={0}
            aria-label='Close'
          />
          <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-2xl'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-3'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-lg font-semibold text-slate-900'>
                  Delete this category?
                </div>
                <div className='mt-1 text-sm text-[#5E6582]'>
                  This action cannot be undone.
                </div>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => !deleting && setConfirmOpen(false)}
                disabled={deleting}
                className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD] disabled:opacity-60'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={confirmDelete}
                disabled={deleting}
                className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {deleting ? (
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

      {/* Row actions dropdown */}
      {activeDropdown &&
        (() => {
          const cat = categories.find(c => c._id === activeDropdown)
          const isActive = cat
            ? cat.status === true ||
              String(cat.status || '').toLowerCase() === 'active'
            : false
          return (
            <div
              ref={dropdownRef}
              className='fixed z-50 w-48 rounded-xl border border-[#E1E6F7] bg-white p-1.5 shadow-lg text-left'
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
            >
              <button
                type='button'
                onClick={() => cat && handleEdit(cat)}
                className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
              >
                Edit
              </button>
              <div className='my-1 h-px bg-gray-100' />
              <button
                type='button'
                onClick={() => handleDelete(activeDropdown)}
                className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#EF4444] hover:bg-[#FFF0F0]'
              >
                Delete
              </button>
              <div className='my-1 h-px bg-gray-100' />
              <button
                type='button'
                onClick={() => handleStatusChange(activeDropdown, true)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-[#E8F8F0] text-[#22C55E] font-medium'
                    : 'text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                }`}
              >
                Active
                {isActive && (
                  <span className='ml-auto text-[#22C55E]' aria-hidden='true'>✓</span>
                )}
              </button>
              <div className='my-1 h-px bg-gray-100' />
              <button
                type='button'
                onClick={() => handleStatusChange(activeDropdown, false)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  !isActive
                    ? 'bg-[#FFF0F0] text-[#EF4444] font-medium'
                    : 'text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                }`}
              >
                Inactive
                {!isActive && (
                  <span className='ml-auto text-[#EF4444]' aria-hidden='true'>✓</span>
                )}
              </button>
            </div>
          )
        })()}
    </div>
  )
}
