'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  Loader2,
  ChevronLeft
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import {
  createFoodAccess,
  getAllPrescriptionsAccess,
  getPrescriptionsAccessById,
  updatePrescriptionsAccess,
  deletePrescriptionsAccess,
  updatePrescriptionsAccessStatus
} from '@/services/nutrition/nutrition.service'

const DURATION_UNITS = [
  { value: 'Day', label: 'Day' },
  { value: 'Days', label: 'Days' },
  { value: 'Week', label: 'Week' },
  { value: 'Weeks', label: 'Weeks' },
  { value: 'Month', label: 'Month' },
  { value: 'Months', label: 'Months' }
]

const TableHeaderCell = ({
  children,
  align = 'left',
  onClick,
  active = false,
  order = 'asc'
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } ${active ? 'text-[#2D3658]' : 'text-[#8A92AC]'} hover:text-[#2D3658]`}
  >
    {children}
    {active ? (
      <span className='text-[#2D3658]'>{order === 'asc' ? ' ↑' : ' ↓'}</span>
    ) : (
      <TbCaretUpDownFilled className='h-3 w-3 text-[#CBCFE2]' />
    )}
  </button>
)

const toPlainText = html => {
  const raw = String(html || '')
  if (!raw.trim()) return ''
  try {
    const el = document.createElement('div')
    el.innerHTML = raw
    return String(el.innerText || el.textContent || '').trim()
  } catch (_) {
    return raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
  }
}

const formatNaira = v => {
  const n = Number(String(v ?? '').replace(/[^\d.]/g, ''))
  if (!Number.isFinite(n)) return '—'
  try {
    return `₦${n.toLocaleString('en-NG')}`
  } catch {
    return `₦${n}`
  }
}

export default function FoodPrescriptionAccessMaster () {
  const router = useRouter()
  const params = useParams()
  const foodPrescriptionId = params?.id

  const [formData, setFormData] = useState({
    name: '',
    durationValue: '1',
    durationUnit: 'Day',
    price: '',
    details: ''
  })
  const [accessList, setAccessList] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [durationError, setDurationError] = useState('')
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastProps, setToastProps] = useState({
    title: '',
    description: '',
    variant: 'success'
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const showToast = (title, description, variant = 'success') => {
    setToastProps({ title, description, variant })
    setToastOpen(true)
  }

  const fetchAccessList = useCallback(async () => {
    if (!foodPrescriptionId) return
    setListLoading(true)
    try {
      const res = await getAllPrescriptionsAccess(
        foodPrescriptionId,
        1,
        100,
        { foodPrescriptionId }
      )
      setAccessList(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setAccessList([])
      showToast(
        'Error',
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load access list',
        'error'
      )
    } finally {
      setListLoading(false)
    }
  }, [foodPrescriptionId])

  useEffect(() => {
    fetchAccessList()
  }, [fetchAccessList])

  const getSortValue = (item, key) => {
    switch (key) {
      case 'addedOn':
        return new Date(item.createdAt || 0).getTime()
      case 'accessName':
        return (item.accessName || '').toLowerCase()
      case 'duration':
        return (item.duration || '').toLowerCase()
      case 'price':
        return Number(item.price || 0)
      case 'status':
        return item.status === true ? 1 : 0
      default:
        return ''
    }
  }

  const handleSort = key => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    let list = accessList
    if (term) {
      list = list.filter(
        item =>
          (item.accessName || '').toLowerCase().includes(term) ||
          (item.duration || '').toLowerCase().includes(term)
      )
    }
    return list
  }, [accessList, searchTerm])

  const sortedList = useMemo(() => {
    const arr = [...filteredList]
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc'
          ? va.localeCompare(vb)
          : vb.localeCompare(va)
      }
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [filteredList, sortKey, sortOrder])

  useEffect(() => {
    const handleClickOutside = e => {
      if (menuOpenId !== null && !e.target.closest('.action-menu')) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  const handleInputChange = (field, value) => {
    if (field === 'durationValue') {
      const digitsOnly = value.replace(/\D/g, '')
      setFormData(prev => ({ ...prev, [field]: digitsOnly }))
      setDurationError('')
      return
    }
    if (field === 'price') {
      const digitsOnly = String(value || '').replace(/\D/g, '')
      setFormData(prev => ({ ...prev, [field]: digitsOnly }))
      return
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      durationValue: '1',
      durationUnit: 'Day',
      price: '',
      details: ''
    })
    setEditId(null)
    setDurationError('')
  }

  const validateDuration = () => {
    const raw = String(formData.durationValue).trim()
    if (!raw) {
      setDurationError('Access duration is required')
      return false
    }
    const num = parseInt(raw, 10)
    if (Number.isNaN(num) || num < 1) {
      setDurationError('Duration must be a positive whole number (e.g. 1, 7, 30)')
      return false
    }
    if (num > 9999) {
      setDurationError('Duration cannot exceed 9999')
      return false
    }
    setDurationError('')
    return true
  }

  const handleSubmit = async () => {
    if (!foodPrescriptionId) {
      showToast('Error', 'Missing food prescription id', 'error')
      return
    }
    if (!formData.name || !formData.durationValue || !formData.price) {
      showToast('Error', 'Please fill all required fields', 'error')
      return
    }
    if (!validateDuration()) {
      showToast('Error', 'Please fix the access duration', 'error')
      return
    }

    setSubmitting(true)
    try {
      const accessDuration = `${String(formData.durationValue).trim()} ${formData.durationUnit}`
      const payload = {
        foodPrescriptionsId: String(foodPrescriptionId),
        accessName: String(formData.name || '').trim(),
        accessDuration,
        price: String(formData.price || '').trim(),
        detail: toPlainText(formData.details)
      }

      if (editId) {
        await updatePrescriptionsAccess(editId, payload)
        showToast('Success', 'Food prescription access updated successfully', 'success')
      } else {
        await createFoodAccess(payload)
        showToast('Success', 'Food prescription access created successfully', 'success')
      }

      resetForm()
      await fetchAccessList()
    } catch (err) {
      showToast(
        'Error',
        err?.response?.data?.message ||
          err?.message ||
          'Failed to save access',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async item => {
    setMenuOpenId(null)
    const rowId = item?._id
    if (!rowId) return
    try {
      const res = await getPrescriptionsAccessById(rowId)
      const access = res?.data ?? res?.access ?? res
      const durationStr = String(access?.duration || access?.accessDuration || '').trim()
      const parts = durationStr.split(' ')
      const value = parts[0] || '1'
      const unit = parts.slice(1).join(' ') || 'Day'
      setFormData({
        name: String(access?.accessName || '').trim(),
        durationValue: value.replace(/\D/g, '') || '1',
        durationUnit: DURATION_UNITS.some(d => d.value === unit) ? unit : 'Day',
        price: String(access?.price ?? '').replace(/\D/g, ''),
        details: String(access?.detail || '')
      })
      setEditId(rowId)
    } catch (err) {
      showToast(
        'Error',
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load access record',
        'error'
      )
    }
  }

  const handleDelete = rowId => {
    setMenuOpenId(null)
    setDeleteId(rowId)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deletePrescriptionsAccess(deleteId)
      showToast('Success', 'Access has been deleted.', 'success')
      setDeleteModalOpen(false)
      setDeleteId(null)
      await fetchAccessList()
    } catch (err) {
      showToast(
        'Error',
        err?.response?.data?.message ||
          err?.message ||
          'Failed to delete access',
        'error'
      )
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (item, status) => {
    setMenuOpenId(null)
    const rowId = item?._id
    if (!rowId) return
    setStatusUpdatingId(rowId)
    try {
      await updatePrescriptionsAccessStatus(rowId, { status })
      setAccessList(prev =>
        prev.map(i => (i._id === rowId ? { ...i, status } : i))
      )
      showToast(
        'Success',
        `Status updated to ${status ? 'Active' : 'Inactive'}`,
        'success'
      )
    } catch (err) {
      showToast(
        'Error',
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update status',
        'error'
      )
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <div className='mb-6'>
        <button
          type='button'
          onClick={() => router.back()}
          className='mb-2 flex w-fit items-center gap-1 text-xs font-medium text-[#8A92AC] transition-colors hover:text-[#2D3658]'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <h1 className='text-2xl font-bold text-[#1E293B]'>
          Edit Food Prescriptions Access
        </h1>
        <p className='mt-1 text-sm text-[#64748B]'>
          Dashboard / Edit Food Prescriptions Access
        </p>
      </div>

      {/* Form Section */}
      <div className='mb-8 rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-[#1E293B]'>
            Food Prescriptions Access Details
          </h2>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={submitting}
            className='flex items-center gap-2 rounded-lg bg-[#FF4400] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#E63E00] disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
            {editId ? 'Update' : 'Add'}
          </button>
        </div>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Food Prescriptions Access Name*
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Starter Access'
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Access Duration*
              </label>
              <div
                className={`flex rounded-lg border bg-white ${
                  durationError
                    ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-200'
                    : 'border-gray-200 focus-within:border-[#FF4400] focus-within:ring-1 focus-within:ring-[#FF4400]'
                }`}
              >
                <input
                  type='text'
                  inputMode='numeric'
                  value={formData.durationValue}
                  onChange={e =>
                    handleInputChange('durationValue', e.target.value)
                  }
                  placeholder='1'
                  className='w-20 rounded-l-lg border-0 bg-transparent px-4 py-2.5 text-sm text-slate-700 focus:outline-none'
                />
                <div className='h-8 w-px bg-gray-200' />
                <select
                  value={formData.durationUnit}
                  onChange={e =>
                    handleInputChange('durationUnit', e.target.value)
                  }
                  className='flex-1 rounded-r-lg border-0 bg-transparent py-2.5 pr-4 pl-2 text-sm text-slate-700 focus:outline-none'
                >
                  {DURATION_UNITS.map(u => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              {durationError && (
                <p className='mt-1 text-xs text-red-600'>{durationError}</p>
              )}
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Gym Access Price*
              </label>
              <input
                type='text'
                value={formData.price}
                onChange={e => handleInputChange('price', e.target.value)}
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-slate-700 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='₦10,000'
              />
            </div>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Details*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={formData.details}
                onChange={html => handleInputChange('details', html)}
                placeholder='Introductory nutrition guidance covering daily balance, meal planning basics.'
                minHeight='120px'
              />
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-lg font-semibold text-[#1E293B]'>
            Food Prescriptions Access List
          </h2>
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-[260px] rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#94A3B8] focus:border-[#FF4400] focus:outline-none'
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
              className='flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
            >
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto rounded-xl border border-[#E5E8F5]'>
          <table className='w-full min-w-[700px] border-collapse'>
            <thead>
              <tr className='border-b border-[#E1E6F7] bg-[#F8F9FC]'>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('addedOn')}
                    active={sortKey === 'addedOn'}
                    order={sortOrder}
                  >
                    Added On
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('accessName')}
                    active={sortKey === 'accessName'}
                    order={sortOrder}
                  >
                    Access Name
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('duration')}
                    active={sortKey === 'duration'}
                    order={sortOrder}
                  >
                    Access Duration
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('price')}
                    active={sortKey === 'price'}
                    order={sortOrder}
                  >
                    Price
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('status')}
                    active={sortKey === 'status'}
                    order={sortOrder}
                  >
                    Status
                  </TableHeaderCell>
                </th>
                <th className='py-3 px-4 text-right' />
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E1E6F7]'>
              {listLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className='py-8 text-center text-sm text-[#64748B]'
                  >
                    Loading...
                  </td>
                </tr>
              ) : sortedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='py-8 text-center text-sm text-[#64748B]'
                  >
                    No access records found
                  </td>
                </tr>
              ) : (
                sortedList.map(item => (
                  <tr
                    key={item._id}
                    className='hover:bg-[#F8F9FC]'
                  >
                    <td className='py-3 px-4 text-sm text-[#64748B]'>
                      {new Date(item.createdAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </td>
                    <td className='py-3 px-4 text-sm font-medium text-[#1E293B]'>
                      {item.accessName}
                    </td>
                    <td className='py-3 px-4 text-sm text-[#64748B]'>
                      {item.duration}
                    </td>
                    <td className='py-3 px-4 text-sm text-[#64748B]'>
                      {formatNaira(item.price)}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          item.status
                            ? 'border-[#22C55E] text-[#22C55E]'
                            : 'border-[#EF4444] text-[#EF4444]'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.status ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        />
                        {item.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='relative py-3 px-4 text-right action-menu'>
                      <button
                        type='button'
                        onClick={() =>
                          setMenuOpenId(menuOpenId === item._id ? null : item._id)
                        }
                        className='rounded-lg p-2 text-[#94A3B8] hover:bg-gray-100 hover:text-[#1E293B]'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>
                      {menuOpenId === item._id && (
                        <div className='absolute right-4 top-12 z-10 w-36 rounded-lg border border-[#E1E6F7] bg-white py-1 shadow-lg'>
                          <button
                            type='button'
                            onClick={() => handleEdit(item)}
                            className='block w-full px-4 py-2 text-left text-sm text-[#475569] hover:bg-[#F8F9FC]'
                          >
                            Edit
                          </button>
                          <button
                            type='button'
                            onClick={() => handleDelete(item._id)}
                            className='block w-full px-4 py-2 text-left text-sm text-[#475569] hover:bg-[#F8F9FC]'
                          >
                            Delete
                          </button>
                          <div className='my-1 border-t border-[#F1F3F9]' />
                          {item.status ? (
                            <button
                              type='button'
                              onClick={() => handleStatusChange(item, false)}
                              disabled={statusUpdatingId === item._id}
                              className='block w-full px-4 py-2 text-left text-sm text-[#475569] hover:bg-[#F8F9FC] disabled:opacity-60 disabled:cursor-not-allowed'
                            >
                              Inactive
                            </button>
                          ) : (
                            <button
                              type='button'
                              onClick={() => handleStatusChange(item, true)}
                              disabled={statusUpdatingId === item._id}
                              className='block w-full px-4 py-2 text-left text-sm text-[#475569] hover:bg-[#F8F9FC] disabled:opacity-60 disabled:cursor-not-allowed'
                            >
                              Active
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title={toastProps.title}
        description={toastProps.description}
        variant={toastProps.variant}
      />

      <Modal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        title='Confirm Deletion'
      >
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-slate-600'>
            Are you sure you want to delete this food prescription access? This
            action cannot be undone.
          </p>
          <div className='flex justify-end gap-2'>
            <button
              type='button'
              onClick={() => setDeleteModalOpen(false)}
              className='rounded-lg border border-[#E5E8F6] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={confirmDelete}
              disabled={deleting}
              className='flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
            >
              {deleting && <Loader2 className='h-4 w-4 animate-spin' />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
