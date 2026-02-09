'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Search,
  Download,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'

// Mock Data for Passes
const MOCK_PASSES = [
  {
    id: 1,
    addedOn: '2025-06-12T10:00:00',
    passName: 'Entry Pass',
    passType: 'Single Entry',
    participants: 1,
    price: '10,000',
    status: 'Active'
  },
  {
    id: 2,
    addedOn: '2025-06-12T10:00:00',
    passName: 'Premium Pass',
    passType: 'Group Entry',
    participants: 4,
    price: '10,000',
    status: 'Active'
  },
  {
    id: 3,
    addedOn: '2025-06-12T10:00:00',
    passName: 'Fitness Pass',
    passType: 'Single Entry',
    participants: 1,
    price: '10,000',
    status: 'Inactive'
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

export default function FitnessEventPassManager ({ eventId }) {
  const router = useRouter()

  // State
  const [passes, setPasses] = useState(MOCK_PASSES)
  const [formData, setFormData] = useState({
    passName: 'Entry Pass',
    passType: 'Single Entry', // 'Single Entry' | 'Group Entry'
    participants: '1',
    price: '10,000'
  })
  const [details, setDetails] = useState(
    '<p>Ideal for teams of up to 2 participants. Includes guided challenges, equipment, & facilitator support.</p>'
  )
  const [isEditing, setIsEditing] = useState(null) // null or pass ID
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  // Handlers
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

  const handleAddOrUpdate = () => {
    // Validation
    if (!formData.passName) return showToast('Pass Name is required', 'error')
    if (!formData.price) return showToast('Price is required', 'error')

    if (isEditing) {
      // Update existing
      setPasses(
        passes.map(p =>
          p.id === isEditing
            ? {
                ...p,
                passName: formData.passName,
                passType: formData.passType,
                participants: parseInt(formData.participants),
                price: formData.price
              }
            : p
        )
      )
      showToast('Pass updated successfully', 'success')
      setIsEditing(null)
    } else {
      // Add new
      const newPass = {
        id: Date.now(),
        addedOn: new Date().toISOString(),
        passName: formData.passName,
        passType: formData.passType,
        participants: parseInt(formData.participants),
        price: formData.price,
        status: 'Active'
      }
      setPasses([newPass, ...passes])
      showToast('Pass added successfully', 'success')
    }

    // Reset form (keep some defaults or clear? Screenshot shows filled form)
    // I'll keep the form filled as per screenshot "Entry Pass"
  }

  const handleEditClick = pass => {
    setIsEditing(pass.id)
    setFormData({
      passName: pass.passName,
      passType: pass.passType,
      participants: pass.participants.toString(),
      price: pass.price
    })
    // In a real app, we'd load the details too
    setActiveDropdown(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = id => {
    setPasses(passes.filter(p => p.id !== id))
    showToast('Pass deleted', 'success')
    setActiveDropdown(null)
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ ...toast, show: false }), 3000)
  }

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = event => {
      if (activeDropdown && !event.target.closest('.action-dropdown')) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown])

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />

      {/* Header */}
      <div className='mb-8'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-1 text-xs font-medium text-[#8A92AC] hover:text-[#2D3658] transition-colors w-fit mb-2'
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

      {/* Form Card */}
      <div className='mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='mb-6 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Fitness Events Pass Details
          </h2>
          <button
            onClick={handleAddOrUpdate}
            className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e]'
          >
            {isEditing ? 'Update' : 'Add'}
          </button>
        </div>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            {/* Name */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Fitness Events Pass Name*
              </label>
              <input
                type='text'
                name='passName'
                value={formData.passName}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Entry Pass'
              />
            </div>

            {/* Pass Type */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Pass Type*
              </label>
              <div className='flex items-center gap-6 py-2.5'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      formData.passType === 'Single Entry'
                        ? 'border-[#FF4400]'
                        : 'border-gray-300'
                    }`}
                  >
                    {formData.passType === 'Single Entry' && (
                      <div className='w-2 h-2 rounded-full bg-[#FF4400]' />
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
                  <span className='text-sm text-gray-600'>Single Entry</span>
                </label>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      formData.passType === 'Group Entry'
                        ? 'border-[#FF4400]'
                        : 'border-gray-300'
                    }`}
                  >
                    {formData.passType === 'Group Entry' && (
                      <div className='w-2 h-2 rounded-full bg-[#FF4400]' />
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
                  <span className='text-sm text-gray-600'>Group Entry</span>
                </label>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Pass Price*
              </label>
              <input
                type='text'
                name='price'
                value={formData.price}
                onChange={handleInputChange}
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='₦10,000'
              />
            </div>
          </div>

          {/* Group Entry - Number of Participants (Conditional or always show if Group) */}
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
                className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='4'
              />
            </div>
          )}

          {/* Details */}
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Details*
            </label>
            <div className='rounded-lg border border-gray-200 overflow-hidden'>
              <TiptapEditor
                content={details}
                onChange={setDetails}
                placeholder='Enter pass details...'
              />
            </div>
          </div>
        </div>
      </div>

      {/* List Card */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
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
                className='h-10 w-64 rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50'>
              Filters
              <IoFilterSharp className='h-4 w-4' />
            </button>
            <button className='flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Added On</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Pass Name</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Pass Type</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Entry For</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Price</TableHeaderCell>
                </th>
                <th className='px-6 py-4 text-left'>
                  <TableHeaderCell>Status</TableHeaderCell>
                </th>
                <th className='px-6 py-4'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {passes.map(pass => (
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
                    {pass.participants > 1 ? 's' : ''}
                  </td>
                  <td className='px-6 py-4 text-sm font-medium text-gray-900'>
                    ₦{pass.price}
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        pass.status === 'Active'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
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
                        <div className='absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-100 bg-white p-1 shadow-lg'>
                          <button
                            onClick={() => handleEditClick(pass)}
                            className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                          >
                            <Edit2 className='h-4 w-4' /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(pass.id)}
                            className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50'
                          >
                            <Trash2 className='h-4 w-4' /> Delete
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                            Active
                          </button>
                          <button className='flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                            Inactive
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
