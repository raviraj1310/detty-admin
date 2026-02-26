'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft,
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Edit2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import {
  getAllPodcastSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  activeInactiveSubscription
} from '@/services/podcast/podcast.service'
import Toast from '@/components/ui/Toast'

export default function PodcastSubscriptionDetails () {
  const router = useRouter()
  const params = useParams()
  const podcastId = params?.podId

  const [activeTab, setActiveTab] = useState('Monthly')
  const [actionOpen, setActionOpen] = useState(null)

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null)

  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'default'
  })

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    type: 'Monthly',
    details: ''
  })

  const [subscriptions, setSubscriptions] = useState([])

  useEffect(() => {
    if (podcastId) {
      fetchSubscriptions()
    }
  }, [podcastId])

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const response = await getAllPodcastSubscription(podcastId)
      console.log('API Response:', response)
      if (Array.isArray(response)) {
        setSubscriptions(response)
      } else if (Array.isArray(response?.data?.subscriptions)) {
        setSubscriptions(response.data.subscriptions)
      } else if (Array.isArray(response?.data)) {
        setSubscriptions(response.data)
      } else if (Array.isArray(response?.subscriptions)) {
        setSubscriptions(response.subscriptions)
      } else {
        setSubscriptions([])
        console.warn('Unexpected response format:', response)
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to fetch subscriptions',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.details) {
      setToast({
        open: true,
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'error'
      })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        podcastId: podcastId,
        subscriptionName: formData.name,
        subscriptionType: formData.type,
        subscriptionPrice: parseFloat(formData.price.replace(/[^0-9.]/g, '')),
        subscriptionDetails: formData.details
      }

      if (editingId) {
        await updateSubscription(editingId, payload)
        setToast({
          open: true,
          title: 'Success',
          description: 'Subscription updated successfully',
          variant: 'success'
        })
      } else {
        await createSubscription(payload)
        setToast({
          open: true,
          title: 'Success',
          description: 'Subscription created successfully',
          variant: 'success'
        })
      }

      // Reset form and fetch updated list
      setFormData({
        name: '',
        price: '',
        type: 'Monthly',
        details: ''
      })
      setEditingId(null)
      fetchSubscriptions()
    } catch (error) {
      console.error('Error saving subscription:', error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to save subscription',
        variant: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = sub => {
    setEditingId(sub._id)
    setFormData({
      name: sub.subscriptionName,
      price: sub.subscriptionPrice.toString(),
      type: sub.subscriptionType,
      details: sub.subscriptionDetails
    })
    setActionOpen(null)
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteClick = sub => {
    setSubscriptionToDelete(sub)
    setDeleteModalOpen(true)
    setActionOpen(null)
  }

  const confirmDelete = async () => {
    if (!subscriptionToDelete) return

    try {
      await deleteSubscription(subscriptionToDelete._id)
      setToast({
        open: true,
        title: 'Success',
        description: 'Subscription deleted successfully',
        variant: 'success'
      })
      fetchSubscriptions()
    } catch (error) {
      console.error('Error deleting subscription:', error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to delete subscription',
        variant: 'error'
      })
    } finally {
      setDeleteModalOpen(false)
      setSubscriptionToDelete(null)
    }
  }

  const handleStatusChange = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus
      await activeInactiveSubscription(id, { status: newStatus })

      setToast({
        open: true,
        title: 'Success',
        description: `Subscription marked as ${
          newStatus ? 'Active' : 'Inactive'
        }`,
        variant: 'success'
      })
      fetchSubscriptions()
    } catch (error) {
      console.error('Error updating status:', error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to update status',
        variant: 'error'
      })
    }
    setActionOpen(null)
  }

  const toggleAction = id => {
    if (actionOpen === id) {
      setActionOpen(null)
    } else {
      setActionOpen(id)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-2xl font-bold text-gray-900'>Edit Subscription</h1>
        <div className='text-sm text-gray-500 mt-1'>
          Dashboard / Edit Subscription
        </div>
      </div>

      {/* Subscription Details Form */}
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-8'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-lg font-bold text-gray-900'>
            {editingId ? 'Edit Subscription' : 'Subscription Details'}
          </h2>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className='flex items-center gap-2 rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#E63D00] disabled:opacity-50'
          >
            {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
            {editingId ? 'Update' : 'Add'}
          </button>
        </div>

        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Subscription Name*
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Enter subscription name'
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Subscription Type*
              </label>
              <div className='flex items-center gap-6 pt-3'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      formData.type === 'Monthly'
                        ? 'border-[#FF4400]'
                        : 'border-gray-300'
                    }`}
                  >
                    {formData.type === 'Monthly' && (
                      <div className='w-2.5 h-2.5 rounded-full bg-[#FF4400]' />
                    )}
                  </div>
                  <input
                    type='radio'
                    name='type'
                    className='hidden'
                    checked={formData.type === 'Monthly'}
                    onChange={() =>
                      setFormData({ ...formData, type: 'Monthly' })
                    }
                  />
                  <span className='text-sm text-gray-700'>Monthly</span>
                </label>

                <label className='flex items-center gap-2 cursor-pointer'>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      formData.type === 'Yearly'
                        ? 'border-[#FF4400]'
                        : 'border-gray-300'
                    }`}
                  >
                    {formData.type === 'Yearly' && (
                      <div className='w-2.5 h-2.5 rounded-full bg-[#FF4400]' />
                    )}
                  </div>
                  <input
                    type='radio'
                    name='type'
                    className='hidden'
                    checked={formData.type === 'Yearly'}
                    onChange={() =>
                      setFormData({ ...formData, type: 'Yearly' })
                    }
                  />
                  <span className='text-sm text-gray-700'>Yearly</span>
                </label>
              </div>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Subscription Price*
              </label>
              <input
                type='text'
                value={formData.price}
                onChange={e =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='Enter price'
              />
            </div>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Subscription Details*
            </label>
            <div className='rounded-lg border border-gray-200 text-gray-900'>
              <TiptapEditor
                content={formData.details}
                onChange={content =>
                  setFormData({ ...formData, details: content })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription List Table */}
      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
          <h2 className='text-lg font-bold text-gray-900'>Subscription List</h2>

          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='Search'
                className='h-10 w-[240px] rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:border-[#FF4400] focus:outline-none'
              />
            </div>

            <button className='flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50'>
              <Filter className='h-4 w-4' />
              Filters
            </button>

            <button className='flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50'>
              <Download className='h-4 w-4' />
            </button>
          </div>
        </div>

        <div className='overflow-visible'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Added On <span className='ml-1 text-[10px]'>↕</span>
                </th>
                <th className='py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Subscription Name <span className='ml-1 text-[10px]'>↕</span>
                </th>
                <th className='py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Subscription Type <span className='ml-1 text-[10px]'>↕</span>
                </th>
                <th className='py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Price <span className='ml-1 text-[10px]'>↕</span>
                </th>
                <th className='py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status <span className='ml-1 text-[10px]'>↕</span>
                </th>
                <th className='py-4 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'></th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {loading ? (
                <tr>
                  <td colSpan='6' className='py-8 text-center'>
                    <div className='flex justify-center items-center'>
                      <Loader2 className='h-6 w-6 animate-spin text-[#FF4400]' />
                    </div>
                  </td>
                </tr>
              ) : !Array.isArray(subscriptions) ||
                subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan='6'
                    className='py-8 text-center text-sm text-gray-500'
                  >
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map(sub => (
                  <tr key={sub._id || sub.id} className='hover:bg-gray-50/50'>
                    <td className='py-4 px-4 text-sm text-gray-500'>
                      {sub.createdAt
                        ? new Date(sub.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className='py-4 px-4 text-sm font-medium text-gray-900'>
                      {sub.subscriptionName}
                    </td>
                    <td className='py-4 px-4 text-sm text-gray-500'>
                      {sub.subscriptionType}
                    </td>
                    <td className='py-4 px-4 text-sm text-gray-500'>
                      ₦{sub.subscriptionPrice}
                    </td>
                    <td className='py-4 px-4'>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                          sub.status === true
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            sub.status === true ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        {sub.status === true ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='py-4 px-4 text-right relative'>
                      <button
                        onClick={() => toggleAction(sub._id || sub.id)}
                        className='text-gray-400 hover:text-gray-600'
                      >
                        <MoreVertical className='h-4 w-4' />
                      </button>

                      {actionOpen === (sub._id || sub.id) && (
                        <div className='absolute right-4 top-10 z-10 w-40 rounded-lg border border-gray-100 bg-white shadow-lg py-1'>
                          <button
                            onClick={() => handleEdit(sub)}
                            className='flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                          >
                            <Edit2 className='h-4 w-4' /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(sub)}
                            className='flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50'
                          >
                            <Trash2 className='h-4 w-4' /> Delete
                          </button>
                          <div className='my-1 h-px bg-gray-100' />
                          <button
                            onClick={() =>
                              handleStatusChange(sub._id || sub.id, sub.status)
                            }
                            className='flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                          >
                            {sub.status === true ? (
                              <XCircle className='h-4 w-4' />
                            ) : (
                              <CheckCircle className='h-4 w-4' />
                            )}
                            {sub.status === true
                              ? 'Mark Inactive'
                              : 'Mark Active'}
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

      <Toast
        open={toast.open}
        onOpenChange={open => setToast({ ...toast, open })}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-2'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div>
                <h3 className='text-lg font-medium text-gray-900'>
                  Delete Subscription?
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Are you sure you want to delete this subscription? This action
                  cannot be undone.
                </p>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setSubscriptionToDelete(null)
                }}
                className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className='flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
