import { useState, useEffect } from 'react'
import {
  createSpaAccess,
  getSpaAccess,
  updateSpaAccess,
  deleteSpaAccess,
  activeInactiveSpaAccess
} from '@/services/v2/spa/spa.service'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'
import {
  Search,
  Filter,
  Download,
  MoreVertical,
  Loader2,
  Trash2,
  Edit,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const SpaSession = ({ spaId }) => {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState(null)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    price: ''
  })
  const [details, setDetails] = useState('')

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState('')

  const showToast = (message, type = 'success') => {
    setToast({
      open: true,
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type
    })
  }

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const response = await getSpaAccess(spaId)
      if (response?.success) {
        // Handle potential different response structures
        if (response.data?.data && Array.isArray(response.data.data)) {
          setSessions(response.data.data)
        } else if (Array.isArray(response.data)) {
          setSessions(response.data)
        } else if (
          response.data?.sessions &&
          Array.isArray(response.data.sessions)
        ) {
          setSessions(response.data.sessions)
        } else {
          setSessions([])
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
      showToast('Failed to fetch sessions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (spaId) {
      fetchSessions()
    }
  }, [spaId])

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({ name: '', duration: '', price: '' })
    setDetails('')
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.duration || !formData.price || !details) {
      showToast('Please fill all required fields', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        spaId,
        sessionName: formData.name,
        duration: Number(formData.duration),
        price: Number(formData.price),
        details
      }

      let response
      if (editingId) {
        response = await updateSpaAccess(editingId, payload)
      } else {
        response = await createSpaAccess(payload)
      }

      if (response?.success) {
        showToast(
          `Session ${editingId ? 'updated' : 'added'} successfully`,
          'success'
        )
        resetForm()
        fetchSessions()
      }
    } catch (error) {
      console.error('Error saving session:', error)
      showToast('Failed to save session', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = session => {
    setEditingId(session._id)
    setFormData({
      name: session.spaSessionName || session.sessionName,
      duration: parseInt(session.duration) || session.duration,
      price: session.sessionPrice || session.price
    })
    setDetails(session.detail || session.details)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = session => {
    setSessionToDelete(session)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!sessionToDelete) return

    setDeleting(true)
    try {
      const response = await deleteSpaAccess(sessionToDelete._id)
      if (response?.success) {
        showToast('Session deleted successfully', 'success')
        fetchSessions()
        setDeleteConfirmOpen(false)
        setSessionToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      showToast('Failed to delete session', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus
      const response = await activeInactiveSpaAccess(id, { status: newStatus })
      if (response?.success) {
        showToast(
          `Session ${newStatus ? 'activated' : 'deactivated'} successfully`,
          'success'
        )
        fetchSessions()
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('Failed to update status', 'error')
    }
  }

  const filteredSessions = Array.isArray(sessions)
    ? sessions.filter(session =>
        (session.spaSessionName || session.sessionName || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    : []

  return (
    <div className='space-y-6'>
      <Toast
        open={toast.open}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        onOpenChange={open => setToast(prev => ({ ...prev, open }))}
      />
      {/* Form Section */}
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>
              Spa Session Details
            </h2>
            <p className='text-sm text-gray-500'>
              {editingId ? 'Edit existing session' : 'Add new session'}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='flex items-center gap-2 rounded-lg bg-[#FF4400] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#E63E00] disabled:opacity-50'
          >
            {isSubmitting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : editingId ? (
              'Update'
            ) : (
              'Add'
            )}
          </button>
        </div>

        <div className='grid gap-6 md:grid-cols-3'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Spa Session Name*
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              placeholder='Relaxation Package'
              className='h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-[#FF4400]'
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Duration*
            </label>
            <div className='relative'>
              <input
                type='number'
                name='duration'
                value={formData.duration}
                onChange={handleInputChange}
                placeholder='30'
                className='h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-[#FF4400]'
              />
              <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500'>
                | Min
              </span>
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              Session Price*
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>
                ₦
              </span>
              <input
                type='number'
                name='price'
                value={formData.price}
                onChange={handleInputChange}
                placeholder='10,000'
                className='h-10 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-4 text-sm text-gray-900 placeholder:text-gray-500 outline-none focus:border-[#FF4400]'
              />
            </div>
          </div>
        </div>

        <div className='mt-6 space-y-2'>
          <label className='text-sm font-medium text-gray-700'>Details*</label>
          <div className='rounded-lg border border-gray-200 bg-white overflow-hidden'>
            <TiptapEditor content={details} onChange={setDetails} />
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex flex-col gap-4 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Spa Session List
          </h2>
          <div className='flex items-center gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 w-64 rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
              />
            </div>
            <button className='flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50'>
              <Filter className='h-4 w-4' />
              Filters
            </button>
            <button className='flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-left text-sm text-gray-500'>
            <thead className='bg-gray-50 text-xs uppercase text-gray-700'>
              <tr>
                <th className='px-6 py-3 font-medium'>Added On</th>
                <th className='px-6 py-3 font-medium'>Spa Session Name</th>
                <th className='px-6 py-3 font-medium'>Duration</th>
                <th className='px-6 py-3 font-medium'>Price</th>
                <th className='px-6 py-3 font-medium'>Status</th>
                <th className='px-6 py-3 font-medium'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {loading ? (
                <tr>
                  <td colSpan='6' className='px-6 py-8 text-center'>
                    <Loader2 className='mx-auto h-6 w-6 animate-spin text-gray-400' />
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td
                    colSpan='6'
                    className='px-6 py-8 text-center text-gray-500'
                  >
                    No sessions found
                  </td>
                </tr>
              ) : (
                filteredSessions.map(session => (
                  <tr key={session._id} className='hover:bg-gray-50'>
                    <td className='whitespace-nowrap px-6 py-4'>
                      {new Date(session.createdAt).toLocaleDateString()}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 font-medium text-gray-900'>
                      {session.spaSessionName || session.sessionName}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      {session.duration}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      ₦
                      {(
                        session.sessionPrice || session.price
                      )?.toLocaleString()}
                    </td>
                    <td className='whitespace-nowrap px-6 py-4'>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          session.status
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {session.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='whitespace-nowrap px-6 py-4 text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className='text-gray-400 hover:text-gray-600'>
                            <MoreVertical className='h-4 w-4' />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleEdit(session)}>
                            <Edit className='mr-2 h-4 w-4' />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(session._id, session.status)
                            }
                          >
                            <span
                              className={
                                session.status
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }
                            >
                              {session.status ? 'Deactivate' : 'Activate'}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(session)}
                            className='text-red-600'
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => {
              if (!deleting) {
                setDeleteConfirmOpen(false)
                setSessionToDelete(null)
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
                    setDeleteConfirmOpen(false)
                    setSessionToDelete(null)
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
    </div>
  )
}

export default SpaSession
