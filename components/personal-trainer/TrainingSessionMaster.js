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
  ChevronLeft
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'

import {
  getTrainingSessions,
  createTrainingSession,
  updateTrainingSession,
  deleteTrainingSession,
  activeInactiveTrainingSession,
  getTrainingSessionById
} from '@/services/v2/personal-trainer/personal-trainer.service'

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

export default function TrainingSessionMaster () {
  const router = useRouter()
  const params = useParams()
  const { id } = params || {} // id is the personalTrainerId

  // Form State
  const [formData, setFormData] = useState({
    sessionName: '',
    sessionType: 'Personal', // Personal, Group, Virtual
    price: '',
    details: ''
  })

  const [editingId, setEditingId] = useState(null)

  // Table State
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)

  // Toast State
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  const showToast = (message, type) => {
    setToast({
      open: true,
      title:
        type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info',
      description: message,
      variant: type
    })
  }

  // Fetch Sessions
  const fetchSessions = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await getTrainingSessions(id)
      if (response?.success) {
        setSessions(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      showToast('Failed to load training sessions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [id])

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

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditorChange = content => {
    setFormData(prev => ({ ...prev, details: content }))
  }

  const handleTypeChange = type => {
    setFormData(prev => ({ ...prev, sessionType: type }))
  }

  const toggleDropdown = (e, id) => {
    e.stopPropagation()
    setActiveDropdown(activeDropdown === id ? null : id)
  }

  const resetForm = () => {
    setFormData({
      sessionName: '',
      sessionType: 'Personal',
      price: '',
      details: ''
    })
    setEditingId(null)
  }

  const handleEdit = async session => {
    // Optimistically populate form
    setFormData({
      sessionName: session.trainingSessionName || '',
      sessionType: session.sessionType || 'Personal',
      price: session.sessionPrice || '',
      details: session.details || ''
    })
    setEditingId(session._id)
    setActiveDropdown(null)

    // Scroll to top to see form
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Fetch latest details
    try {
      const response = await getTrainingSessionById(session._id)
      if (response?.success && response?.data) {
        const latestData = response.data
        setFormData({
          sessionName: latestData.trainingSessionName || '',
          sessionType: latestData.sessionType || 'Personal',
          price: latestData.sessionPrice || '',
          details: latestData.details || ''
        })
      }
    } catch (error) {
      console.error('Error fetching session details:', error)
      // Fallback to existing data is already handled by optimistic populate
    }
  }

  const handleDelete = async sessionId => {
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      const response = await deleteTrainingSession(sessionId)
      if (response?.success) {
        showToast('Session deleted successfully', 'success')
        fetchSessions()
      } else {
        showToast(response?.message || 'Failed to delete session', 'error')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      showToast('Failed to delete session', 'error')
    }
    setActiveDropdown(null)
  }

  const handleStatusChange = async (sessionId, status) => {
    try {
      const response = await activeInactiveTrainingSession(sessionId, status)
      if (response?.success) {
        showToast(
          `Session marked as ${status ? 'active' : 'inactive'}`,
          'success'
        )
        fetchSessions()
      } else {
        showToast(response?.message || 'Failed to update status', 'error')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('Failed to update status', 'error')
    }
    setActiveDropdown(null)
  }

  const handleFormSubmit = async () => {
    if (!formData.sessionName || !formData.price) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    const payload = {
      trainingSessionName: formData.sessionName,
      sessionType: formData.sessionType,
      sessionPrice: formData.price,
      details: formData.details,
      personalTrainerId: id
    }

    try {
      let response
      if (editingId) {
        response = await updateTrainingSession(editingId, payload)
      } else {
        response = await createTrainingSession(payload)
      }

      if (response?.success) {
        showToast(
          `Session ${editingId ? 'updated' : 'created'} successfully`,
          'success'
        )
        resetForm()
        fetchSessions()
      } else {
        showToast(
          response?.message ||
            `Failed to ${editingId ? 'update' : 'create'} session`,
          'error'
        )
      }
    } catch (error) {
      console.error('Error saving session:', error)
      showToast(`Failed to ${editingId ? 'update' : 'create'} session`, 'error')
    }
  }

  // Filter sessions
  const filteredSessions = sessions.filter(session =>
    session.trainingSessionName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <div className='min-h-screen bg-[#F8F9FC] p-6'>
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
      />

      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-[#1E293B]'>
              Edit Training Session
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
            {editingId ? 'Edit Training Session' : 'Add New Training Session'}
          </h2>
          <div className='flex gap-2'>
            {editingId && (
              <button
                onClick={resetForm}
                className='rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50'
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleFormSubmit}
              className='rounded-lg bg-[#FF4400] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#E63E00]'
            >
              {editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Session Name */}
          <div className='lg:col-span-1'>
            <label className='mb-2 block text-sm font-medium text-[#64748B]'>
              Training Session Name*
            </label>
            <input
              type='text'
              name='sessionName'
              value={formData.sessionName}
              onChange={handleInputChange}
              className='w-full rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm text-[#1E293B] focus:border-[#FF4400] focus:outline-none'
              placeholder='e.g. 1:1 Personal Training Session'
            />
          </div>

          {/* Session Type */}
          <div className='lg:col-span-1'>
            <label className='mb-2 block text-sm font-medium text-[#64748B]'>
              Session Type*
            </label>
            <div className='flex items-center gap-6 py-2.5'>
              {['Personal', 'Group', 'Virtual'].map(type => (
                <label
                  key={type}
                  className='flex items-center gap-2 cursor-pointer'
                >
                  <div className='relative flex items-center'>
                    <input
                      type='radio'
                      name='sessionType'
                      checked={formData.sessionType === type}
                      onChange={() => handleTypeChange(type)}
                      className='peer h-4 w-4 appearance-none rounded-full border border-[#CBD5E1] checked:border-[#FF4400]'
                    />
                    <div className='absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF4400] opacity-0 peer-checked:opacity-100 transition-opacity' />
                  </div>
                  <span className='text-sm text-[#1E293B]'>{type}</span>
                </label>
              ))}
            </div>
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
            Training Session List
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
                  <TableHeaderCell>Session Type</TableHeaderCell>
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
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan='6' className='py-8 text-center text-[#64748B]'>
                    No sessions found
                  </td>
                </tr>
              ) : (
                filteredSessions.map(session => (
                  <tr key={session._id} className='hover:bg-[#F8F9FC]'>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {session.createdAt
                        ? new Date(session.createdAt).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                          })
                        : '-'}
                    </td>
                    <td className='py-4 px-6 text-sm font-medium text-[#1E293B]'>
                      {session.trainingSessionName}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {session.sessionType}
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

                      {activeDropdown === session._id && (
                        <div
                          ref={dropdownRef}
                          className='absolute right-6 top-12 z-10 w-48 rounded-xl border border-[#E1E6F7] bg-white p-1.5 shadow-lg text-left'
                        >
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
                            onClick={() =>
                              handleStatusChange(session._id, true)
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            Active
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              handleStatusChange(session._id, false)
                            }
                            className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'
                          >
                            Inactive
                          </button>
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
    </div>
  )
}
