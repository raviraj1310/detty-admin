'use client'

import React, { useState, useEffect } from 'react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import {
  Bell,
  Send,
  Link as LinkIcon,
  Type,
  Image as ImageIcon,
  Tag,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import {
  createCustomNotification,
  getNotifications
} from '@/services/notification/notification.service'
import Toast from '@/components/ui/Toast'

const CustomNotificationsPage = () => {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    imageUrl: '',
    link: '',
    discountCode: ''
  })
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 5
  })

  const fetchNotifications = async (page = 1) => {
    setLoadingNotifications(true)
    try {
      const result = await getNotifications(page, pagination.limit)
      const data = result?.data || []
      const sortedData = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : []
      setNotifications(sortedData)
      if (result?.pagination) {
        setPagination(prev => ({
          ...prev,
          currentPage: result.pagination.currentPage || 1,
          totalPages: result.pagination.totalPages || 1,
          totalRecords: result.pagination.totalRecords || 0
        }))
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    fetchNotifications(1)
  }, [])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setToast({
        open: true,
        title: 'Error',
        description: 'Please enter a title',
        variant: 'error'
      })
      return
    }
    if (!formData.body.trim() || formData.body === '<p></p>') {
      setToast({
        open: true,
        title: 'Error',
        description: 'Please enter a body',
        variant: 'error'
      })
      return
    }

    setLoading(true)
    try {
      await createCustomNotification(formData)

      setToast({
        open: true,
        title: 'Success!',
        description: 'Notification sent successfully',
        variant: 'success'
      })

      setFormData({
        title: '',
        body: '',
        imageUrl: '',
        link: '',
        discountCode: ''
      })
      fetchNotifications(1)
    } catch (error) {
      console.error(error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-3 sm:p-4 lg:p-6 pt-16 lg:pt-6 bg-white min-h-screen'>
      {/* Header */}
      <div className='mb-3'>
        <h1 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
          <Bell className='w-6 h-6 text-gray-700' />
          Custom or Promotional Notifications
        </h1>
        <p className='text-xs text-gray-500 mt-0.5 ml-8'>
          Dashboard / Custom Notifications
        </p>
      </div>

      <div className='bg-gray-100 p-3 rounded-xl'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-3'>
            {/* Card Header with Button */}
            <div className='flex justify-between items-center mb-4 border-b pb-3 border-gray-200'>
              <h2 className='text-base font-semibold text-gray-900'>
                Compose Notification
              </h2>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`
                  flex items-center gap-2 px-4 py-1.5 text-sm bg-orange-600 text-white font-medium rounded-lg 
                  transition-colors hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1
                  ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                `}
              >
                {loading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className='w-4 h-4' />
                    Send Notification
                  </>
                )}
              </button>
            </div>

            <div className='space-y-4'>
              {/* Title Field */}
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1'>
                  <Type className='w-3 h-3 text-gray-500' />
                  Title <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder='Enter notification title'
                  className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all'
                />
              </div>

              {/* Image URL Field */}
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1'>
                  <ImageIcon className='w-3 h-3 text-gray-500' />
                  Image URL{' '}
                  <span className='text-gray-400 text-[10px] font-normal'>
                    (Optional)
                  </span>
                </label>
                <input
                  type='url'
                  value={formData.imageUrl}
                  onChange={e => handleChange('imageUrl', e.target.value)}
                  placeholder='https://example.com/image.jpg'
                  className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all'
                />
              </div>

              {/* Link Field */}
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1'>
                  <LinkIcon className='w-3 h-3 text-gray-500' />
                  Target Link{' '}
                  <span className='text-gray-400 text-[10px] font-normal'>
                    (Optional)
                  </span>
                </label>
                <input
                  type='url'
                  value={formData.link}
                  onChange={e => handleChange('link', e.target.value)}
                  placeholder='https://example.com/page'
                  className='w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all'
                />
              </div>
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1'>
                  <Tag className='w-3 h-3 text-gray-500' />
                  Discount Code{' '}
                  <span className='text-gray-400 text-[10px] font-normal'>
                    (Optional)
                  </span>
                </label>
                <input
                  type='text'
                  value={formData.discountCode}
                  onChange={e => handleChange('discountCode', e.target.value)}
                  placeholder='Enter discount code'
                  className='w-full px-3 py-1.5 text-sm text-gray-900 uppercase italic border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all'
                />
              </div>

              {/* Body Editor */}
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-1'>
                  Body <span className='text-red-500'>*</span>
                </label>
                <div className='bg-white rounded-lg'>
                  <TiptapEditor
                    content={formData.body}
                    onChange={html => handleChange('body', html)}
                    placeholder='Enter notification content...'
                    minHeight='200px'
                  />
                </div>
                <p className='text-[10px] text-gray-500 mt-1'>
                  Write a compelling message for your users.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='mt-6 bg-gray-100 p-3 rounded-xl'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-4 border-b border-gray-200'>
            <h2 className='text-base font-semibold text-gray-900'>
              Notification History
            </h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Sent At</th>
                  <th className='px-4 py-3 font-medium'>Title</th>
                  <th className='px-4 py-3 font-medium'>Body</th>
                  <th className='px-4 py-3 font-medium'>Image</th>
                  <th className='px-4 py-3 font-medium'>Link</th>
                  <th className='px-4 py-3 font-medium'>Discount Code</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {loadingNotifications ? (
                  <tr>
                    <td colSpan='6' className='px-4 py-8 text-center'>
                      <div className='flex justify-center items-center gap-2 text-gray-500'>
                        <div className='w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin' />
                        Loading history...
                      </div>
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td
                      colSpan='6'
                      className='px-4 py-8 text-center text-gray-500'
                    >
                      No notifications sent yet
                    </td>
                  </tr>
                ) : (
                  notifications.map((notification, index) => (
                    <tr
                      key={notification._id || index}
                      className='hover:bg-gray-50'
                    >
                      <td className='px-4 py-3 text-gray-500 whitespace-nowrap'>
                        <div className='flex items-center gap-1.5'>
                          <Calendar className='w-3.5 h-3.5' />
                          {notification.createdAt
                            ? new Date(
                                notification.createdAt
                              ).toLocaleDateString() +
                              ' ' +
                              new Date(
                                notification.createdAt
                              ).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </div>
                      </td>

                      <td className='px-4 py-3 font-medium text-gray-900'>
                        {notification.title}
                      </td>
                      <td className='px-4 py-3 text-gray-600 max-w-xs truncate'>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: notification.body
                          }}
                          className='truncate'
                        />
                      </td>
                      <td className='px-4 py-3'>
                        {notification.imageUrl ? (
                          <a
                            href={notification.imageUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-1 text-orange-600 hover:text-orange-700'
                          >
                            <ImageIcon className='w-4 h-4' />
                            <span className='text-xs underline'>View</span>
                          </a>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        {notification.link ? (
                          <a
                            href={notification.link}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-1 text-orange-600 hover:text-orange-700'
                          >
                            <ExternalLink className='w-4 h-4' />
                            <span className='text-xs underline'>Open</span>
                          </a>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        {notification.discountCode ? (
                          <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800'>
                            <Tag className='w-3 h-3 mr-1' />
                            {notification.discountCode}
                          </span>
                        ) : (
                          <span className='text-gray-400'>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className='flex items-center justify-between px-4 py-3 border-t border-gray-200 sm:px-6'>
            <div className='flex justify-between flex-1 sm:hidden'>
              <button
                onClick={() => fetchNotifications(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${
                  pagination.currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => fetchNotifications(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${
                  pagination.currentPage === pagination.totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                Next
              </button>
            </div>
            <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
              <div>
                <p className='text-sm text-gray-700'>
                  Showing page{' '}
                  <span className='font-medium'>{pagination.currentPage}</span>{' '}
                  of{' '}
                  <span className='font-medium'>{pagination.totalPages}</span> (
                  <span className='font-medium'>{pagination.totalRecords}</span>{' '}
                  results)
                </p>
              </div>
              <div>
                <nav
                  className='isolate inline-flex -space-x-px rounded-md shadow-sm'
                  aria-label='Pagination'
                >
                  <button
                    onClick={() =>
                      fetchNotifications(pagination.currentPage - 1)
                    }
                    disabled={pagination.currentPage === 1}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      pagination.currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <span className='sr-only'>Previous</span>
                    <ChevronLeft className='h-5 w-5' aria-hidden='true' />
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => fetchNotifications(i + 1)}
                      aria-current={
                        pagination.currentPage === i + 1 ? 'page' : undefined
                      }
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pagination.currentPage === i + 1
                          ? 'bg-orange-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      fetchNotifications(pagination.currentPage + 1)
                    }
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                      pagination.currentPage === pagination.totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <span className='sr-only'>Next</span>
                    <ChevronRight className='h-5 w-5' aria-hidden='true' />
                  </button>
                </nav>
              </div>
            </div>
          </div>
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
    </div>
  )
}

export default CustomNotificationsPage
