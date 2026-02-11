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

// Mock Data for Table
const MOCK_SESSIONS = [
  {
    _id: '1',
    createdAt: '2025-06-12T10:00:00',
    name: 'Small Team Package',
    participants: '10',
    price: '₦10,000',
    isActive: true
  },
  {
    _id: '2',
    createdAt: '2025-06-12T10:00:00',
    name: 'Medium Team Package',
    participants: '10-20',
    price: '₦10,000',
    isActive: true
  },
  {
    _id: '3',
    createdAt: '2025-06-12T10:00:00',
    name: 'Large Team Package',
    participants: '20-40',
    price: '₦10,000',
    isActive: false
  }
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

export default function TeamBondingRetreatSessionMaster () {
  const router = useRouter()
  const params = useParams()
  const { id } = params || {}

  // Form State
  const [formData, setFormData] = useState({
    sessionName: 'Small Team Package',
    participants: '10',
    price: '₦10,000',
    details:
      '<p>Ideal for teams of up to 10 participants. Includes guided challenges, equipment, & facilitator support.</p>'
  })

  // Table State
  const [sessions, setSessions] = useState(MOCK_SESSIONS)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)

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

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditorChange = content => {
    setFormData(prev => ({ ...prev, details: content }))
  }

  const toggleDropdown = (e, id) => {
    e.stopPropagation()
    setActiveDropdown(activeDropdown === id ? null : id)
  }

  const handleFormSubmit = () => {
    // Mock submit logic
    if (!formData.sessionName || !formData.price || !formData.participants) {
      showToast('Error', 'Please fill in all required fields', 'error')
      return
    }
    showToast('Success', 'Session saved successfully', 'success')
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
            Add
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
                      {session.name}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {session.participants}
                    </td>
                    <td className='py-4 px-6 text-sm text-[#64748B]'>
                      {session.price}
                    </td>
                    <td className='py-4 px-6'>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          session.isActive
                            ? 'border-[#22C55E] text-[#22C55E]'
                            : 'border-[#EF4444] text-[#EF4444]'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            session.isActive ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                          }`}
                        ></span>
                        {session.isActive ? 'Active' : 'Inactive'}
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
                          <button className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'>
                            Edit
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#EF4444] hover:bg-[#FFF0F0] hover:text-[#EF4444]'>
                            Delete
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'>
                            Active
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#475569] hover:bg-[#F8F9FC] hover:text-[#1E293B]'>
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
