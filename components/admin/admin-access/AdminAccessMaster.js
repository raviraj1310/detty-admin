'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser
} from '@/services/admin-user/admin-user.service'
import { getRoles } from '@/services/roles/roles.service'
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
    {onClick && (
      <TbCaretUpDownFilled
        className={`h-3 w-3 ${active ? 'text-[#FF5B2C]' : 'text-[#CBCFE2]'} ${
          order === 'asc' ? 'rotate-180' : ''
        }`}
      />
    )}
  </button>
)

export default function AdminAccessMaster () {
  const formSectionRef = useRef(null)
  const nameInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!formData.name || formData.name.trim().length < 2)
      errs.name = 'Enter a valid name'
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'Enter a valid email'
    if (!editingId && (!formData.password || formData.password.length < 6))
      errs.password = 'Password must be at least 6 characters'
    if (!formData.roleId) errs.roleId = 'Select a role'
    return errs
  }

  const getRoleName = user => {
    if (user.role && user.role.name) return user.role.name
    if (user.roleName) return user.roleName
    if (user.roleId) {
      const r = roles.find(r => r._id === user.roleId)
      if (r) return r.name
    }
    if (typeof user.role === 'string') {
      const r = roles.find(r => r._id === user.role)
      if (r) return r.name
    }
    return '-'
  }

  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, rolesRes] = await Promise.all([
        getAllAdminUsers(page, limit, searchTerm),
        getRoles()
      ])

      const userList =
        usersRes?.data || (Array.isArray(usersRes) ? usersRes : [])
      setUsers(userList)
      setPagination(prev => ({
        ...prev,
        page: usersRes?.page || page,
        limit: usersRes?.limit || limit,
        total: usersRes?.total || userList.length,
        totalPages: usersRes?.totalPages || 1
      }))

      const rolesList =
        rolesRes?.data?.data ||
        (Array.isArray(rolesRes?.data) ? rolesRes.data : [])
      setRoles(rolesList)
    } catch (e) {
      console.error('Failed to load data', e)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(pagination.page, pagination.limit)
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
        email: formData.email.trim(),
        roleId: formData.roleId
      }
      if (formData.password) {
        payload.password = formData.password
      }

      if (editingId) {
        const res = await updateAdminUser(editingId, payload)
        if (res?.success || res) {
          setToast({
            open: true,
            title: 'User updated',
            description: formData.name,
            variant: 'success'
          })
          setEditingId(null)
          setFormData({ name: '', email: '', password: '', roleId: '' })
        }
      } else {
        const res = await createAdminUser(payload)
        if (res?.success || res) {
          setToast({
            open: true,
            title: 'User added',
            description: formData.name,
            variant: 'success'
          })
          setFormData({ name: '', email: '', password: '', roleId: '' })
        }
      }
      await fetchData(pagination.page, pagination.limit)
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Failed to save user')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = item => {
    setFormData({
      name: item.name || '',
      email: item.email || '',
      password: '', // Don't fill password
      roleId:
        item.roleId ||
        (typeof item.role === 'object' ? item.role?._id : item.role) ||
        ''
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
      const res = await deleteAdminUser(confirmId)
      if (res?.success || res) {
        await fetchData(pagination.page, pagination.limit)
        setToast({
          open: true,
          title: 'User deleted',
          description: 'Removed successfully',
          variant: 'success'
        })
      }
    } catch {
      setError('Failed to delete user')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmId(null)
    }
  }

  const filteredUsers = useMemo(() => {
    const base = Array.isArray(users) ? users : []
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
      const email = String(a.email || '').toLowerCase()
      const roleName = String(getRoleName(a)).toLowerCase()
      const addedStr = String(
        formatAdded(a.createdAt || a.updatedAt) || ''
      ).toLowerCase()

      return !term
        ? true
        : name.includes(term) ||
            email.includes(term) ||
            roleName.includes(term) ||
            addedStr.includes(term)
    })
  }, [users, searchTerm, roles])

  const getSortValue = (a, key) => {
    if (key === 'addedOn') {
      const d = a.createdAt || a.updatedAt
      return d
        ? new Date(typeof d === 'object' && d.$date ? d.$date : d).getTime()
        : 0
    }
    if (key === 'name') return String(a.name || '').toLowerCase()
    if (key === 'email') return String(a.email || '').toLowerCase()
    if (key === 'role') return String(getRoleName(a)).toLowerCase()
    return 0
  }

  const sortedUsers = useMemo(() => {
    const arr = [...filteredUsers]
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [filteredUsers, sortKey, sortOrder])

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
          <h1 className='text-xl font-semibold text-slate-900'>Admin Access</h1>
          <p className='text-xs text-[#99A1BC]'>Dashboard / Admin Access</p>
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
              Are you sure you want to delete this user? This action cannot be
              undone.
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
            {editingId ? 'Edit User' : 'Add New User'}
          </h2>
          <div className='flex items-center gap-3'>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null)
                  setFormData({ name: '', email: '', password: '', roleId: '' })
                }}
                className='text-xs text-slate-500 hover:text-slate-800'
              >
                Cancel Edit
              </button>
            )}
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
        </div>

        <form onSubmit={handleSubmit} ref={formSectionRef}>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>Name</label>
              <input
                type='text'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                ref={nameInputRef}
                className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                placeholder='Enter full name'
              />
              {errors.name && (
                <p className='text-xs text-red-600'>{errors.name}</p>
              )}
            </div>

            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>
                Email
              </label>
              <input
                type='email'
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                placeholder='Enter email address'
              />
              {errors.email && (
                <p className='text-xs text-red-600'>{errors.email}</p>
              )}
            </div>

            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>Role</label>
              <select
                value={formData.roleId}
                onChange={e => handleInputChange('roleId', e.target.value)}
                className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              >
                <option value=''>Select Role</option>
                {roles.map(role => (
                  <option key={role._id} value={role._id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <p className='text-xs text-red-600'>{errors.roleId}</p>
              )}
            </div>

            <div className='space-y-1'>
              <label className='text-xs font-medium text-slate-700'>
                Password {editingId && '(Optional)'}
              </label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4] pr-8'
                  placeholder={
                    editingId ? 'Leave blank to keep current' : 'Enter password'
                  }
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-2 top-1/2 -translate-y-1/2 text-[#A6AEC7] hover:text-[#2D3658]'
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && (
                <p className='text-xs text-red-600'>{errors.password}</p>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-4'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold text-slate-900'>Users List</h2>
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
            <div className='col-span-3'>
              <TableHeaderCell
                onClick={() => toggleSort('addedOn')}
                active={sortKey === 'addedOn'}
                order={sortOrder}
              >
                Added On
              </TableHeaderCell>
            </div>
            <div className='col-span-3'>
              <TableHeaderCell
                onClick={() => toggleSort('name')}
                active={sortKey === 'name'}
                order={sortOrder}
              >
                Name
              </TableHeaderCell>
            </div>
            <div className='col-span-3'>
              <TableHeaderCell
                onClick={() => toggleSort('email')}
                active={sortKey === 'email'}
                order={sortOrder}
              >
                Email
              </TableHeaderCell>
            </div>
            <div className='col-span-2'>
              <TableHeaderCell
                onClick={() => toggleSort('role')}
                active={sortKey === 'role'}
                order={sortOrder}
              >
                Role
              </TableHeaderCell>
            </div>
            <div className='col-span-1 text-right'>
              <span className='text-xs font-medium uppercase tracking-wide text-[#8A92AC]'>
                Action
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
              sortedUsers.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className='grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#F9FAFD]'
                >
                  <div className='col-span-3 self-center text-xs text-[#5E6582]'>
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
                  <div className='col-span-3 self-center text-xs font-semibold text-slate-900'>
                    {item.name || '-'}
                  </div>
                  <div className='col-span-3 self-center text-xs text-slate-700'>
                    {item.email || '-'}
                  </div>
                  <div className='col-span-2 self-center text-xs text-slate-700'>
                    <span className='inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10'>
                      {getRoleName(item)}
                    </span>
                  </div>
                  <div className='col-span-1 flex items-center justify-end gap-2'>
                    <button
                      onClick={() => startEdit(item)}
                      className='rounded-full border border-transparent p-1.5 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                      title='Edit'
                    >
                      <Pencil className='h-4 w-4' />
                    </button>
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
            {!loading && !error && sortedUsers.length === 0 && (
              <div className='px-4 py-8 text-center text-xs text-[#8A92AC]'>
                No users found.
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
