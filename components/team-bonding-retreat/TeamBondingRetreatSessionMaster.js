'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Download,
  MoreVertical,
  Plus,
  Loader2,
  ChevronLeft,
  AlertCircle
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'
import {
  getTeamBondingRetreatSessionList,
  createTeamBondingRetreatSession,
  updateSessionById,
  deleteSessionById,
  activeInactiveSessionById
} from '@/services/v2/team/team-bonding-retreat.service'

// Mock Data for Tabl

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

export default function TeamBondingRetreatSessionMaster () {
  const router = useRouter()
  const params = useParams()
  const { id } = params || {}
  const [isEditing, setIsEditing] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState(null)

  // Form State
  const [formData, setFormData] = useState({
    sessionName: '',
    participants: '',
    price: '',
    details: ''
  })

  // Table State
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 })

  // Delete Modal State
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Toast State
  const [toastOpen, setToastOpen] = useState(false)
  const [toastProps, setToastProps] = useState({
    title: '',
    description: '',
    variant: 'success'
  })

  const showToast = (title, description, variant = 'success') => {
    setToastProps({ title, description, variant })
    setToastOpen(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSessions = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getTeamBondingRetreatSessionList(id)
      const list = res?.data?.data || res?.data || res || []
      setSessions(Array.isArray(list) ? list : [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
      showToast('Error', 'Failed to fetch sessions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [id])

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditorChange = content => {
    setFormData(prev => ({ ...prev, details: content }))
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

  const handleFormSubmit = async () => {
    if (!formData.sessionName || !formData.price || !formData.participants) {
      showToast('Error', 'Please fill in all required fields', 'error')
      return
    }

    try {
      const priceNum = parseFloat(
        String(formData.price).replace(/[^0-9.]/g, '')
      )
      const payload = {
        teamBondingId: id,
        sessionName: formData.sessionName,
        sessionPrice: priceNum,
        details: formData.details,
        participants: formData.participants, // Assuming API accepts string, if strictly array, might need splitting or wrapping
        status: true
      }

      if (isEditing && currentSessionId) {
        await updateSessionById(currentSessionId, payload)
        showToast('Success', 'Session updated successfully', 'success')
      } else {
        await createTeamBondingRetreatSession(payload)
        showToast('Success', 'Session created successfully', 'success')
      }

      // Reset Form
      setFormData({
        sessionName: '',
        participants: '',
        price: '',
        details: ''
      })
      setIsEditing(false)
      setCurrentSessionId(null)
      fetchSessions()
    } catch (error) {
      console.error('Submit error:', error)
      showToast('Error', 'Failed to save session', 'error')
    }
  }

  const handleEdit = session => {
    setFormData({
      sessionName: session.name || session.sessionName || '',
      participants: session.participants || '',
      price: session.price || session.sessionPrice || '',
      details: session.details || ''
    })
    setIsEditing(true)
    setCurrentSessionId(session._id)
    setActiveDropdown(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await deleteSessionById(deleteId)
      showToast('Success', 'Session deleted successfully', 'success')
      fetchSessions()
      setConfirmOpen(false)
    } catch (error) {
      console.error('Delete error:', error)
      showToast('Error', 'Failed to delete session', 'error')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleDelete = sessionId => {
    setDeleteId(sessionId)
    setConfirmOpen(true)
    setActiveDropdown(null)
  }

  const handleStatusChange = async (sessionId, status) => {
    try {
      await activeInactiveSessionById(sessionId, { status })
      showToast(
        'Success',
        `Session marked as ${status ? 'Active' : 'Inactive'}`,
        'success'
      )
      fetchSessions()
    } catch (error) {
      console.error('Status change error:', error)
      showToast('Error', 'Failed to update status', 'error')
    } finally {
      setActiveDropdown(null)
    }
  }

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title={toastProps.title}
        description={toastProps.description}
        variant={toastProps.variant}
      />

      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-[#1E293B]'>
              Edit Team Bonding Retreat Session
            </h1>
            <nav className='mt-1 text-sm text-[#64748B]'>
              <span className='cursor-pointer hover:text-[#1E293B]'>
                Dashboard
              </span>
              <span className='mx-2'>/</span>
              <span className='text-[#1E293B]'>Edit Training Session</span>
            </nav>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className='mb-8 rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-lg font-bold text-[#1E293B]'>
            Team Bonding Retreat Session Details
          </h2>
          <button
            onClick={handleFormSubmit}
            className='rounded-lg bg-[#FF4400] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#E63E00]'
          >
            {isEditing ? 'Update' : 'Add'}
          </button>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Session Name */}
          <div className='lg:col-span-1'>
            <label className='mb-2 block text-sm font-medium text-[#64748B]'>
              Session Name*
            </label>
            <input
              type='text'
              name='sessionName'
              value={formData.sessionName}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#1E293B] focus:border-[#FF4400] focus:outline-none'
              placeholder='e.g. Small Team Package'
            />
          </div>

          {/* Participants */}
          <div className='lg:col-span-1'>
            <label className='mb-2 block text-sm font-medium text-[#64748B]'>
              Participants*
            </label>
            <input
              type='text'
              name='participants'
              value={formData.participants}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#1E293B] focus:border-[#FF4400] focus:outline-none'
              placeholder='e.g. 10'
            />
          </div>

          {/* Price */}
          <div className='lg:col-span-1'>
            <label className='mb-2 block text-sm font-medium text-[#64748B]'>
              Session Price*
            </label>
            <input
              type='text'
              name='price'
              value={formData.price}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#1E293B] focus:border-[#FF4400] focus:outline-none'
              placeholder='e.g. ₦10,000'
            />
          </div>

          {/* Details Editor */}
          <div className='lg:col-span-3'>
            <label className='mb-2 block text-sm font-medium text-[#64748B]'>
              Details*
            </label>
            <div className='rounded-lg border border-[#E2E8F0] overflow-hidden'>
              <TiptapEditor
                content={formData.details}
                onChange={handleEditorChange}
                placeholder='Enter session details...'
              />
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className='rounded-2xl border border-[#E1E6F7] bg-white p-6 shadow-sm'>
        <div className='mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center'>
          <h2 className='text-lg font-bold text-[#1E293B]'>
            Team Bonding Retreat Session Session List
          </h2>
          <div className='flex gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-[300px] rounded-lg border border-[#E2E8F0] pl-10 pr-4 text-sm focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 text-sm font-medium text-[#64748B] hover:bg-gray-50'>
              <IoFilterSharp className='h-4 w-4' />
              Filters
            </button>
            <button className='flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'>
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
                  <TableHeaderCell>Session Name</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Participants</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Price</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-left'>
                  <TableHeaderCell>Status</TableHeaderCell>
                </th>
                <th className='py-4 px-6 text-right'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[#E1E6F7]'>
              {loading ? (
                <tr>
                  <td colSpan='6' className='py-8 text-center text-[#64748B]'>
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      Loading sessions...
                    </div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan='6' className='py-8 text-center text-[#64748B]'>
                    No sessions found
                  </td>
                </tr>
              ) : (
                sessions.map(session => (
                  <tr key={session._id} className='hover:bg-[#F8F9FC]'>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {new Date(session.createdAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </td>
                    <td className='py-4 px-6 text-sm font-medium text-[#1E293B]'>
                      {session.sessionName}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {session.participants || '-'}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {session.sessionPrice}
                    </td>
                    <td className='py-4 px-6'>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          session.status
                            ? 'border-[#22C55E] text-[#22C55E]'
                            : 'border-[#EF4444] text-[#EF4444]'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            session.status ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        ></span>
                        {session.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='py-4 px-6 text-right relative'>
                      <button
                        onClick={e => toggleDropdown(e, session._id)}
                        className='rounded-lg p-2 text-[#94A3B8] hover:bg-gray-100 hover:text-[#1E293B]'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!deleting) {
                setConfirmOpen(false)
              }
            }}
          />
          <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-2xl'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-3'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div className='flex-1'>
                <div className='text-lg font-semibold text-slate-900'>
                  Delete this session?
                </div>
                <div className='mt-1 text-sm text-[#5E6582]'>
                  This action cannot be undone.
                </div>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  if (!deleting) {
                    setConfirmOpen(false)
                  }
                }}
                className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
                disabled={deleting}
              >
                Cancel
              </button>
              <button
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
      {/* Fixed Dropdown Menu */}
      {activeDropdown && (
        <div
          ref={dropdownRef}
          className='fixed z-50 w-48 rounded-xl border border-[#E1E6F7] bg-white p-1.5 shadow-lg text-left'
          style={{ top: dropdownPos.top, right: dropdownPos.right }}
        >
          {(() => {
            const session = sessions.find(s => s._id === activeDropdown)
            if (!session) return null
            return (
              <>
                <button
                  onClick={() => handleEdit(session)}
                  className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                >
                  Edit
                </button>
                <div className='my-1 h-px bg-gray-100' />
                <button
                  onClick={() => handleDelete(session._id)}
                  className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#EF4444] hover:bg-[#FFF0F0] hover:text-[#EF4444]'
                >
                  Delete
                </button>
                <div className='my-1 h-px bg-gray-100' />
                <button
                  onClick={() => handleStatusChange(session._id, true)}
                  className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                >
                  Active
                </button>
                <div className='my-1 h-px bg-gray-100' />
                <button
                  onClick={() => handleStatusChange(session._id, false)}
                  className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                >
                  Inactive
                </button>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
