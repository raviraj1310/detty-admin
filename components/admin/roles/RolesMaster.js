'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Filter,
  Check
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleById
} from '@/services/roles/roles.service'
import { getLoginUser } from '@/services/auth/login.service'
import { getAllPermissions } from '@/services/permission/permission.service'
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
        className={`h-3 w-3 ${active ? 'text-[#4F46E5]' : 'text-[#CBCFE2]'} ${
          order === 'asc' ? 'rotate-180' : ''
        }`}
      />
    )}
  </button>
)

const Checkbox = ({ checked, onChange, disabled }) => (
  <div
    onClick={() => !disabled && onChange(!checked)}
    className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded border transition-colors ${
      checked
        ? 'border-[#FF5B2C] bg-[#FF5B2C]'
        : 'border-gray-300 bg-white hover:border-[#FF5B2C]'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {checked && <Check className='h-3.5 w-3.5 text-white' strokeWidth={3} />}
  </div>
)

export default function RolesMaster () {
  const formSectionRef = useRef(null)
  const nameInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    permissions: []
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [roles, setRoles] = useState([])
  const [allPermissions, setAllPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePermissionChange = permissionId => {
    setFormData(prev => {
      const current = prev.permissions || []
      if (current.includes(permissionId)) {
        return {
          ...prev,
          permissions: current.filter(id => id !== permissionId)
        }
      } else {
        return { ...prev, permissions: [...current, permissionId] }
      }
    })
  }

  const validate = () => {
    const errs = {}
    if (!formData.name || formData.name.trim().length < 2)
      errs.name = 'Enter a valid role name'
    return errs
  }

  const fetchRoles = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getRoles()
      const list = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
      setRoles(list)
    } catch {
      setError('Failed to load roles')
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAllPermissions = async () => {
    try {
      const res = await getAllPermissions(1, 1000)
      const list = res?.data || (Array.isArray(res) ? res : [])
      setAllPermissions(list)
    } catch (e) {
      console.error('Failed to load permissions list', e)
    }
  }

  useEffect(() => {
    fetchRoles()
    fetchAllPermissions()
  }, [])

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
        permissions: formData.permissions
      }
      if (editingId) {
        const res = await updateRole(editingId, payload)
        if (res?.success || res?.status === 200 || res?.data?.success) {
          // Attempt to refresh current user profile if their role was updated
          try {
            const userStr = localStorage.getItem('user')
            if (userStr) {
              const u = JSON.parse(userStr)
              const roleId =
                u.role?._id ||
                u.roleId ||
                (typeof u.role === 'string' ? u.role : null)

              if (roleId === editingId) {
                try {
                  const fresh = await getLoginUser(u._id)
                  const freshUser = fresh?.data || fresh

                  const roleRes = await getRoleById(roleId)
                  const freshRole = roleRes?.data?.data || roleRes?.data

                  if (freshUser && freshRole) {
                    // Ensure permissions are populated objects for Sidebar
                    if (
                      Array.isArray(freshRole.permissions) &&
                      freshRole.permissions.length > 0
                    ) {
                      if (typeof freshRole.permissions[0] === 'string') {
                        freshRole.permissions = freshRole.permissions.map(
                          pId =>
                            allPermissions.find(ap => ap._id === pId) || pId
                        )
                      }
                    }

                    freshUser.role = freshRole
                    localStorage.setItem('user', JSON.stringify(freshUser))
                    window.dispatchEvent(new CustomEvent('user:updated'))
                  }
                } catch (innerErr) {
                  console.error('Failed to refresh user details', innerErr)
                }
              }
            }
          } catch (err) {
            console.error('Auto-refresh profile failed', err)
          }

          setToast({
            open: true,
            title: 'Role updated',
            description: formData.name,
            variant: 'success'
          })
          setEditingId(null)
          setFormData({ name: '', permissions: [] })
        }
      } else {
        const res = await createRole(payload)
        if (res?.success || res?.status === 200 || res?.data?.success) {
          setToast({
            open: true,
            title: 'Role added',
            description: formData.name,
            variant: 'success'
          })
          setFormData({ name: '', permissions: [] })
        }
      }
      await fetchRoles()
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Failed to save role')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = item => {
    setFormData({
      name: item.name || '',
      permissions: Array.isArray(item.permissions)
        ? item.permissions.map(p => (typeof p === 'object' ? p._id : p))
        : []
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
      const res = await deleteRole(confirmId)
      if (res?.success || res?.status === 200 || res?.data?.success) {
        await fetchRoles()
        setToast({
          open: true,
          title: 'Role deleted',
          description: 'Removed successfully',
          variant: 'success'
        })
      }
    } catch {
      setError('Failed to delete role')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmId(null)
    }
  }

  // Permission Logic
  const getPermissionType = name => {
    const n = String(name || '').toLowerCase()
    if (n.includes('delete') || n.includes('remove') || n.includes('destroy'))
      return 'delete'
    if (
      n.includes('edit') ||
      n.includes('update') ||
      n.includes('modify') ||
      n.includes('put')
    )
      return 'edit'
    if (
      n.includes('add') ||
      n.includes('create') ||
      n.includes('store') ||
      n.includes('post')
    )
      return 'add'
    if (
      n.includes('view') ||
      n.includes('read') ||
      n.includes('get') ||
      n.includes('list') ||
      n.includes('show')
    )
      return 'view'
    return 'other'
  }

  const permissionGroups = useMemo(() => {
    const groups = {}
    allPermissions.forEach(p => {
      const module = p.module || 'Other'
      if (!groups[module])
        groups[module] = {
          view: null,
          add: null,
          edit: null,
          delete: null,
          other: []
        }
      const type = getPermissionType(p.name)
      if (type === 'other') groups[module].other.push(p)
      else groups[module][type] = p
    })

    // Sort modules alphabetically, but keep 'Other' last
    return Object.keys(groups)
      .sort((a, b) => {
        if (a === 'Other') return 1
        if (b === 'Other') return -1
        return a.localeCompare(b)
      })
      .reduce((obj, key) => {
        obj[key] = groups[key]
        return obj
      }, {})
  }, [allPermissions])

  const filteredPermissionModules = useMemo(() => {
    if (!permissionSearchTerm) return Object.keys(permissionGroups)
    const term = permissionSearchTerm.toLowerCase()
    return Object.keys(permissionGroups).filter(module =>
      module.toLowerCase().includes(term)
    )
  }, [permissionGroups, permissionSearchTerm])

  const toggleModulePermissions = module => {
    const group = permissionGroups[module]
    const ids = []
    if (group.view) ids.push(group.view._id)
    if (group.add) ids.push(group.add._id)
    if (group.edit) ids.push(group.edit._id)
    if (group.delete) ids.push(group.delete._id)
    group.other.forEach(p => ids.push(p._id))

    const allSelected = ids.every(id => formData.permissions.includes(id))

    setFormData(prev => {
      let newPerms = [...prev.permissions]
      if (allSelected) {
        // Deselect all
        newPerms = newPerms.filter(id => !ids.includes(id))
      } else {
        // Select all
        ids.forEach(id => {
          if (!newPerms.includes(id)) newPerms.push(id)
        })
      }
      return { ...prev, permissions: newPerms }
    })
  }

  // Role List Sorting
  const filteredRoles = useMemo(() => {
    const base = Array.isArray(roles) ? roles : []
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()

    const formatAdded = d => {
      if (!d) return ''
      const date = new Date(d)
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
  }, [roles, searchTerm])

  const sortedRoles = useMemo(() => {
    const arr = [...filteredRoles]
    arr.sort((a, b) => {
      let va, vb
      if (sortKey === 'addedOn') {
        va = new Date(a.createdAt || a.updatedAt).getTime() || 0
        vb = new Date(b.createdAt || b.updatedAt).getTime() || 0
      } else if (sortKey === 'name') {
        va = String(a.name || '').toLowerCase()
        vb = String(b.name || '').toLowerCase()
      } else {
        return 0
      }

      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [filteredRoles, sortKey, sortOrder])

  const toggleSort = key => {
    if (sortKey === key) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  return (
    <div className='space-y-5 py-6 px-6'>
      {/* Header */}
      <div className='flex flex-col gap-1 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>Roles Master</h1>
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
              Are you sure you want to delete this role? This action cannot be
              undone.
            </p>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setConfirmOpen(false)
                  setConfirmId(null)
                }}
                className='rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100'
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className='rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50'
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-6'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-sm font-semibold text-slate-900'>
            {editingId ? 'Edit Role' : 'Add New Role'}
          </h2>
          <div className='flex items-center gap-3'>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null)
                  setFormData({ name: '', permissions: [] })
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
          <div className='mb-6'>
            <label className='mb-1.5 block text-xs font-medium text-slate-700'>
              Role Name
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              ref={nameInputRef}
              className='w-full max-w-md h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              placeholder='Enter role name'
            />
            {errors.name && (
              <p className='mt-1 text-xs text-red-600'>{errors.name}</p>
            )}
          </div>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-base font-semibold text-slate-900'>
                Access List
              </h3>
              <div className='flex items-center gap-2'>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search'
                    value={permissionSearchTerm}
                    onChange={e => setPermissionSearchTerm(e.target.value)}
                    className='h-9 w-64 rounded-lg border border-[#E5E6EF] bg-white pl-9 pr-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  />
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6AEC7]' />
                </div>
                <button
                  type='button'
                  className='flex h-9 items-center gap-2 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50'
                >
                  <Filter className='h-3.5 w-3.5' />
                  Filters
                </button>
              </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-[#E5E8F5]'>
              <div className='grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3'>
                <div className='col-span-4'>
                  <TableHeaderCell>Access</TableHeaderCell>
                </div>
                <div className='col-span-2 flex justify-center'>
                  <TableHeaderCell align='center'>View</TableHeaderCell>
                </div>
                <div className='col-span-2 flex justify-center'>
                  <TableHeaderCell align='center'>Add</TableHeaderCell>
                </div>
                <div className='col-span-2 flex justify-center'>
                  <TableHeaderCell align='center'>Edit</TableHeaderCell>
                </div>
                <div className='col-span-2 flex justify-center'>
                  <TableHeaderCell align='center'>Delete</TableHeaderCell>
                </div>
              </div>

              <div className='max-h-[400px] overflow-y-auto divide-y divide-[#EEF1FA] bg-white'>
                {filteredPermissionModules.length === 0 && (
                  <div className='p-8 text-center text-xs text-slate-500'>
                    No modules found
                  </div>
                )}
                {filteredPermissionModules.map(module => {
                  const group = permissionGroups[module]
                  return (
                    <div
                      key={module}
                      className='grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#F9FAFD]'
                    >
                      <div className='col-span-4 flex items-center'>
                        <span
                          onClick={() => toggleModulePermissions(module)}
                          className='text-xs font-medium text-slate-700 cursor-pointer hover:text-[#FF5B2C]'
                        >
                          {module}
                        </span>
                      </div>
                      <div className='col-span-2 flex justify-center items-center'>
                        {group.view && (
                          <Checkbox
                            checked={formData.permissions.includes(
                              group.view._id
                            )}
                            onChange={() =>
                              handlePermissionChange(group.view._id)
                            }
                          />
                        )}
                      </div>
                      <div className='col-span-2 flex justify-center items-center'>
                        {group.add && (
                          <Checkbox
                            checked={formData.permissions.includes(
                              group.add._id
                            )}
                            onChange={() =>
                              handlePermissionChange(group.add._id)
                            }
                          />
                        )}
                      </div>
                      <div className='col-span-2 flex justify-center items-center'>
                        {group.edit && (
                          <Checkbox
                            checked={formData.permissions.includes(
                              group.edit._id
                            )}
                            onChange={() =>
                              handlePermissionChange(group.edit._id)
                            }
                          />
                        )}
                      </div>
                      <div className='col-span-2 flex justify-center items-center'>
                        {group.delete && (
                          <Checkbox
                            checked={formData.permissions.includes(
                              group.delete._id
                            )}
                            onChange={() =>
                              handlePermissionChange(group.delete._id)
                            }
                          />
                        )}
                      </div>
                      {/* Handle 'other' permissions if needed, perhaps in a row details or tooltip */}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-4'>
        <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold text-slate-900'>Role List</h2>
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

        <div className='overflow-visible rounded-xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3'>
            <div className='col-span-3'>
              <TableHeaderCell
                onClick={() => toggleSort('addedOn')}
                active={sortKey === 'addedOn'}
                order={sortOrder}
              >
                Created On
              </TableHeaderCell>
            </div>
            <div className='col-span-3'>
              <TableHeaderCell
                onClick={() => toggleSort('name')}
                active={sortKey === 'name'}
                order={sortOrder}
              >
                Role Name
              </TableHeaderCell>
            </div>
            <div className='col-span-4'>
              <span className='text-xs font-medium uppercase tracking-wide text-[#8A92AC]'>
                Permissions Count
              </span>
            </div>
            <div className='col-span-2 text-right'>
              <span className='text-xs font-medium uppercase tracking-wide text-[#8A92AC]'>
                Action
              </span>
            </div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {loading && (
              <div className='px-4 py-3 text-xs text-[#5E6582]'>Loading...</div>
            )}
            {!loading &&
              !error &&
              sortedRoles.map((item, idx) => (
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
                  <div className='col-span-4 self-center text-xs text-slate-700'>
                    {Array.isArray(item.permissions)
                      ? item.permissions.length
                      : 0}{' '}
                    Permissions
                  </div>
                  <div className='col-span-2 flex items-center justify-end gap-4'>
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
                            <Pencil className='h-3.5 w-3.5' /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setConfirmId(item._id)
                              setConfirmOpen(true)
                              setMenuOpenId(null)
                            }}
                            className='flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-[#FFF5F5]'
                          >
                            <Trash2 className='h-3.5 w-3.5' /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {!loading && !error && sortedRoles.length === 0 && (
              <div className='px-4 py-8 text-center text-xs text-[#8A92AC]'>
                No roles found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
