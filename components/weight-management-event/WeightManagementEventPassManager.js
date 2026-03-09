'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Search,
  Download,
  MoreVertical,
  Trash2,
  Edit2,
  Loader2,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'

const mapPassFromApi = api => ({
  id: api._id || api.id,
  addedOn: api.createdAt,
  passName: api.eventPassName || api.passName,
  passType: api.passType === 'group' ? 'Group Entry' : 'Single Entry',
  participants: api.entryFor ?? (api.passType === 'group' ? api.participants : 1),
  price: api.passPrice ?? api.price,
  status: api.status === true || api.status === 'active' ? 'Active' : 'Inactive',
  details: api.details || ''
})

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
    className={`flex w-full items-center gap-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } ${active ? 'text-[#2D3658]' : 'text-[#8A92AC]'} hover:text-[#2D3658]`}
  >
    {children}
    {active ? (
      direction === 'asc' ? (
        <ChevronUp className='h-3 w-3 shrink-0 text-[#2D3658]' />
      ) : (
        <ChevronDown className='h-3 w-3 shrink-0 text-[#2D3658]' />
      )
    ) : (
      <TbCaretUpDownFilled className='h-3 w-3 shrink-0 text-[#CBCFE2]' />
    )}
  </button>
)

const MOCK_PASSES = [
  {
    id: '1',
    addedOn: '2025-06-12T10:00:00.000Z',
    passName: 'Entry Pass',
    passType: 'Single Entry',
    participants: 1,
    price: '10,000',
    status: 'Active',
    details: ''
  },
  {
    id: '2',
    addedOn: '2025-06-12T10:00:00.000Z',
    passName: 'Premium Pass',
    passType: 'Group Entry',
    participants: 4,
    price: '10,000',
    status: 'Active',
    details: ''
  },
  {
    id: '3',
    addedOn: '2025-06-12T10:00:00.000Z',
    passName: 'Deluxe Pass',
    passType: 'Single Entry',
    participants: 1,
    price: '10,000',
    status: 'Inactive',
    details: ''
  }
]

export default function WeightManagementEventPassManager () {
  const router = useRouter()
  const params = useParams()
  const weightId = params?.weightId

  const [passes, setPasses] = useState([])
  const [formData, setFormData] = useState({
    passName: '',
    passType: 'Single Entry',
    participants: '',
    price: ''
  })
  const [details, setDetails] = useState('')
  const [isEditing, setIsEditing] = useState(null)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [toast, setToast] = useState({ show: false, message: '', type: '' })
  const [loading, setLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePassTypeChange = type => {
    setFormData(prev => ({
      ...prev,
      passType: type,
      participants: type === 'Single Entry' ? '1' : prev.participants
    }))
  }

  const fetchPasses = async () => {
    if (!weightId) return
    setLoading(true)
    try {
      await new Promise(r => setTimeout(r, 300))
      setPasses(MOCK_PASSES.map(p => ({ ...p })))
    } catch (err) {
      showToast(err?.message || 'Failed to fetch passes', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPasses()
  }, [weightId])

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    const t = setTimeout(
      () => setToast(prev => ({ ...prev, show: false })),
      3000
    )
    return () => clearTimeout(t)
  }

  const handleAddOrUpdate = async () => {
    if (!formData.passName) return showToast('Pass Name is required', 'error')
    if (!formData.price) return showToast('Price is required', 'error')
    if (formData.passType === 'Group Entry' && !formData.participants)
      return showToast('Participants is required for Group Entry', 'error')

    setEditLoading(true)
    try {
      await new Promise(r => setTimeout(r, 400))
      if (isEditing) {
        setPasses(prev =>
          prev.map(p =>
            p.id === isEditing
              ? {
                  ...p,
                  passName: formData.passName,
                  passType: formData.passType,
                  participants: formData.passType === 'Group Entry' ? Number(formData.participants) || 0 : 1,
                  price: formData.price,
                  details
                }
              : p
          )
        )
        showToast('Pass updated successfully', 'success')
        setIsEditing(null)
      } else {
        setPasses(prev => [
          ...prev,
          {
            id: String(Date.now()),
            addedOn: new Date().toISOString(),
            passName: formData.passName,
            passType: formData.passType,
            participants: formData.passType === 'Group Entry' ? Number(formData.participants) || 0 : 1,
            price: formData.price,
            status: 'Active',
            details
          }
        ])
        showToast('Pass added successfully', 'success')
        setFormData({ passName: '', passType: 'Single Entry', participants: '', price: '' })
        setDetails('')
      }
    } catch (err) {
      showToast(err?.message || 'Failed to save pass', 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleEditClick = async pass => {
    setIsEditing(pass.id)
    setActiveDropdown(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setEditLoading(true)
    try {
      await new Promise(r => setTimeout(r, 200))
      setFormData({
        passName: pass.passName,
        passType: pass.passType,
        participants: pass.passType === 'Group Entry' ? String(pass.participants || '') : '',
        price: pass.price
      })
      setDetails(pass.details || '')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async id => {
    try {
      setPasses(prev => prev.filter(p => p.id !== id))
      showToast('Pass deleted', 'success')
    } catch (err) {
      showToast(err?.message || 'Delete failed', 'error')
    }
    setActiveDropdown(null)
  }

  const handleStatusChange = async (passId, active) => {
    try {
      setPasses(prev =>
        prev.map(p =>
          p.id === passId ? { ...p, status: active ? 'Active' : 'Inactive' } : p
        )
      )
      showToast(active ? 'Pass set to Active' : 'Pass set to Inactive', 'success')
    } catch (err) {
      showToast(err?.message || 'Status update failed', 'error')
    }
    setActiveDropdown(null)
  }

  const getSortValue = (pass, key) => {
    switch (key) {
      case 'addedOn':
        return new Date(pass.addedOn || 0).getTime()
      case 'passName':
        return (pass.passName || '').toLowerCase()
      case 'passType':
        return (pass.passType || '').toLowerCase()
      case 'participants':
        return Number(pass.participants) || 0
      case 'price':
        return Number(String(pass.price).replace(/[^0-9.]/g, '')) || 0
      case 'status':
        return pass.status === 'Active' ? 1 : 0
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

  const filteredPasses = useMemo(() => {
    const term = (searchTerm || '').toLowerCase()
    if (!term) return passes
    return passes.filter(
      p =>
        (p.passName || '').toLowerCase().includes(term) ||
        (p.passType || '').toLowerCase().includes(term)
    )
  }, [passes, searchTerm])

  const sortedPasses = useMemo(() => {
    const arr = [...filteredPasses]
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
  }, [filteredPasses, sortKey, sortOrder])

  useEffect(() => {
    const handleClickOutside = event => {
      if (activeDropdown && !event.target.closest('.action-dropdown')) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [activeDropdown])

  return (
    <div className='min-h-screen bg-gray-50 p-8' style={{ colorScheme: 'light' }}>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      {/* Header */}
      <div className='mb-8'>
        <button
          type='button'
          onClick={() => router.back()}
          className='mb-2 flex w-fit items-center gap-1 text-xs font-medium text-[#8A92AC] transition-colors hover:text-[#2D3658]'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              Edit Fitness Event Pass
            </h1>
            <nav className='mt-1 text-sm text-gray-500'>
              <Link href='/dashboard' className='hover:text-gray-700'>
                Dashboard
              </Link>
              <span className='mx-2'>/</span>
              <span className='text-gray-900'>Edit Fitness Event Pass</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Form Card - Pass Details */}
      <div className='mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Fitness Events Pass Details
          </h2>
          <button
            type='button'
            onClick={handleAddOrUpdate}
            disabled={editLoading}
            className='flex items-center gap-2 rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e] disabled:cursor-not-allowed disabled:opacity-50'
          >
            {editLoading && <Loader2 className='h-4 w-4 animate-spin' />}
            {isEditing ? (editLoading ? 'Loading...' : 'Update') : 'Add'}
          </button>
        </div>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Fitness Events Pass Name*
              </label>
              <input
                type='text'
                name='passName'
                value={formData.passName}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Entry Pass'
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Pass Type*
              </label>
              <div className='flex items-center gap-6 py-2.5'>
                <label className='flex cursor-pointer items-center gap-2'>
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      formData.passType === 'Single Entry'
                        ? 'border-[#FF4400]'
                        : 'border-gray-300'
                    }`}
                  >
                    {formData.passType === 'Single Entry' && (
                      <div className='h-2 w-2 rounded-full bg-[#FF4400]' />
                    )}
                  </div>
                  <input
                    type='radio'
                    name='passType'
                    value='Single Entry'
                    checked={formData.passType === 'Single Entry'}
                    onChange={() => handlePassTypeChange('Single Entry')}
                    className='hidden'
                  />
                  <span className='text-sm text-gray-900'>Single Entry</span>
                </label>
                <label className='flex cursor-pointer items-center gap-2'>
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      formData.passType === 'Group Entry'
                        ? 'border-[#FF4400]'
                        : 'border-gray-300'
                    }`}
                  >
                    {formData.passType === 'Group Entry' && (
                      <div className='h-2 w-2 rounded-full bg-[#FF4400]' />
                    )}
                  </div>
                  <input
                    type='radio'
                    name='passType'
                    value='Group Entry'
                    checked={formData.passType === 'Group Entry'}
                    onChange={() => handlePassTypeChange('Group Entry')}
                    className='hidden'
                  />
                  <span className='text-sm text-gray-900'>Group Entry</span>
                </label>
              </div>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Pass Price*
              </label>
              <input
                type='text'
                name='price'
                value={formData.price}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='₦10,000'
              />
            </div>
          </div>

          {formData.passType === 'Group Entry' && (
            <div className='w-full md:w-1/3'>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Number of Participants*
              </label>
              <input
                type='number'
                name='participants'
                value={formData.participants}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='4'
              />
            </div>
          )}

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Details*
            </label>
            <div className='overflow-hidden rounded-lg border border-gray-200'>
              <TiptapEditor
                content={details}
                onChange={setDetails}
                placeholder='Ideal for individuals. Includes access to the full Everyday Nutrition Workshop, expert-led session, learning materials, and live Q&A.'
              />
            </div>
          </div>
        </div>
      </div>

      {/* List Card - Pass List */}
      <div className='overflow-visible rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex flex-col gap-4 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Fitness Events Pass List
          </h2>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-64 rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <button
              type='button'
              className='flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              <IoFilterSharp className='h-4 w-4' />
              Filters
            </button>
            <button
              type='button'
              className='flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50'
            >
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-[800px]'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('addedOn')}
                    active={sortKey === 'addedOn'}
                    direction={sortOrder}
                  >
                    Added On
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('passName')}
                    active={sortKey === 'passName'}
                    direction={sortOrder}
                  >
                    Pass Name
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('passType')}
                    active={sortKey === 'passType'}
                    direction={sortOrder}
                  >
                    Pass Type
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('participants')}
                    active={sortKey === 'participants'}
                    direction={sortOrder}
                  >
                    Entry For
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('price')}
                    active={sortKey === 'price'}
                    direction={sortOrder}
                  >
                    Price
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell
                    onClick={() => handleSort('status')}
                    active={sortKey === 'status'}
                    direction={sortOrder}
                  >
                    Status
                  </TableHeaderCell>
                </th>
                <th className='px-6 py-4' />
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {loading ? (
                <tr>
                  <td colSpan={8} className='px-6 py-8 text-center text-sm text-gray-500'>
                    Loading...
                  </td>
                </tr>
              ) : sortedPasses.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-6 py-8 text-center text-sm text-gray-500'>
                    No passes found
                  </td>
                </tr>
              ) : (
                sortedPasses.map(pass => (
                  <tr key={pass.id} className='hover:bg-gray-50/50'>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {new Date(pass.addedOn).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      {pass.passName}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {pass.passType}
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-600'>
                      {pass.participants} Participant
                    </td>
                    <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                      ₦{pass.price}
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                          pass.status === 'Active'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            pass.status === 'Active'
                              ? 'bg-green-600'
                              : 'bg-red-600'
                          }`}
                        />
                        {pass.status}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='relative action-dropdown'>
                        <button
                          type='button'
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === pass.id ? null : pass.id
                            )
                          }
                          className='flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                        {activeDropdown === pass.id && (
                          <div
                            className='absolute right-0 top-6 z-50 w-48 rounded-lg border border-gray-100 bg-white p-1 shadow-xl'
                            onMouseDown={e => e.stopPropagation()}
                          >
                            <button
                              type='button'
                              onClick={() => handleEditClick(pass)}
                              className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                            >
                              <Edit2 className='h-4 w-4' /> Edit
                            </button>
                            <button
                              type='button'
                              onClick={() => handleDelete(pass.id)}
                              className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50'
                            >
                              <Trash2 className='h-4 w-4' /> Delete
                            </button>
                            <div className='my-1 h-px bg-gray-100' />
                            {pass.status === 'Active' ? (
                              <button
                                type='button'
                                onClick={() =>
                                  handleStatusChange(pass.id, false)
                                }
                                className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                              >
                                Inactive
                              </button>
                            ) : (
                              <button
                                type='button'
                                onClick={() =>
                                  handleStatusChange(pass.id, true)
                                }
                                className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                              >
                                Active
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
