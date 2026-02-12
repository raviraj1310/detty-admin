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
  createOtherCustomNotification,
  getNotifications,
  getSendedEmailList
} from '@/services/notification/notification.service'
import Toast from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'

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
    discountCode: '',
    sendEmailCounts: 0,
    notificationType: 'all_users'
  })
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 5
  })
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailModalLoading, setEmailModalLoading] = useState(false)
  const [emailList, setEmailList] = useState([])
  const [emailPagination, setEmailPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    limit: 10
  })
  const [selectedNotificationId, setSelectedNotificationId] = useState('')

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

  const fetchEmailList = async (notificationId, page = 1) => {
    setEmailModalLoading(true)
    try {
      const result = await getSendedEmailList(
        notificationId,
        page,
        emailPagination.limit
      )
      const data = Array.isArray(result?.data?.data)
        ? result.data.data
        : Array.isArray(result?.data)
        ? result.data
        : []
      setEmailList(data)
      const p = result?.data?.pagination || result?.pagination || {}
      setEmailPagination(prev => ({
        ...prev,
        currentPage: p.currentPage || page,
        totalPages: p.totalPages || 0,
        totalRecords: p.totalRecords || 0,
        limit: p.limit || prev.limit
      }))
    } catch (e) {
      setEmailList([])
      setEmailPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalPages: 0,
        totalRecords: 0
      }))
    } finally {
      setEmailModalLoading(false)
    }
  }

  const openEmailModal = notificationId => {
    const id = String(notificationId || '').trim()
    if (!id) return
    setSelectedNotificationId(id)
    setEmailModalOpen(true)
    fetchEmailList(id, 1)
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
      if (formData.notificationType === 'all_users') {
        console.log('call user list ')
        await createCustomNotification(formData)
      } else {
        console.log('call other ')
        await createOtherCustomNotification(formData)
      }

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
        discountCode: '',
        sendEmailCounts: 0,
        notificationType: 'all_users'
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

              {/* Notification Type */}
              <div>
                <label className='block text-xs font-medium text-gray-700 mb-2'>
                  Target Audience <span className='text-red-500'>*</span>
                </label>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                  {[
                    { label: 'All Users', value: 'all_users' },
                    {
                      label: 'Failed Transactions',
                      value: 'failed_transactions'
                    },
                    { label: 'Event Buyers', value: 'event_buyers' },
                    {
                      label: 'Merchandise Buyers',
                      value: 'merchandise_buyers'
                    },
                    { label: 'Voucher Holders', value: 'voucher_holders' },
                    { label: 'Unregistered Users', value: 'unregistered_users' }
                  ].map(option => (
                    <label
                      key={option.value}
                      className={`
                        relative flex items-center justify-between px-4 py-3 border rounded-lg cursor-pointer transition-all
                        ${
                          formData.notificationType === option.value
                            ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                            : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={`
                            w-4 h-4 rounded-full border flex items-center justify-center
                            ${
                              formData.notificationType === option.value
                                ? 'border-orange-600 bg-orange-600'
                                : 'border-gray-300 bg-white'
                            }
                          `}
                        >
                          {formData.notificationType === option.value && (
                            <div className='w-1.5 h-1.5 rounded-full bg-white' />
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            formData.notificationType === option.value
                              ? 'text-orange-900'
                              : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </span>
                      </div>
                      <input
                        type='radio'
                        name='notificationType'
                        value={option.value}
                        checked={formData.notificationType === option.value}
                        onChange={e =>
                          handleChange('notificationType', e.target.value)
                        }
                        className='sr-only'
                      />
                    </label>
                  ))}
                </div>
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
                  <th className='px-4 py-3 font-medium'>Total Email Counts </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {loadingNotifications ? (
                  <tr>
                    <td colSpan='7' className='px-4 py-8 text-center'>
                      <div className='flex justify-center items-center gap-2 text-gray-500'>
                        <div className='w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin' />
                        Loading history...
                      </div>
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td
                      colSpan='7'
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
                      <td className='px-4 py-3'>
                        {notification.sendEmailCounts ? (
                          <button
                            onClick={() => openEmailModal(notification._id)}
                            className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200 transition'
                          >
                            <Tag className='w-3 h-3 mr-1' />
                            {notification.sendEmailCounts}
                          </button>
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
      <Modal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        title='Sent Email List'
        maxWidth='max-w-2xl'
      >
        <div className='space-y-3'>
          {emailModalLoading ? (
            <div className='px-4 py-6 text-center text-gray-500'>
              <div className='w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin inline-block mr-2 align-middle' />
              Loading...
            </div>
          ) : emailList.length === 0 ? (
            <div className='px-4 py-6 text-center text-gray-500'>
              No emails found
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-left'>
                <thead className='text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200'>
                  <tr>
                    <th className='px-4 py-2'>Email</th>
                    <th className='px-4 py-2'>Sent At</th>
                    <th className='px-4 py-2'>Status</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200'>
                  {emailList.map((item, idx) => {
                    const email =
                      item?.email ||
                      item?.user?.email ||
                      item?.userId?.email ||
                      ''
                    const sentAt = item?.createdAt || item?.sentAt || ''
                    const status = item?.status || item?.deliveryStatus || ''
                    return (
                      <tr key={item?._id || item?.id || idx}>
                        <td className='px-4 py-2 text-gray-900'>
                          {email || '-'}
                        </td>
                        <td className='px-4 py-2 text-gray-600'>
                          {sentAt
                            ? new Date(sentAt).toLocaleDateString() +
                              ' ' +
                              new Date(sentAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : '-'}
                        </td>
                        <td className='px-4 py-2'>
                          {status ? (
                            <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200'>
                              {String(status)}
                            </span>
                          ) : (
                            <span className='text-gray-400'>-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className='flex items-center justify-between px-2 py-3'>
                <div className='text-xs text-gray-700'>
                  Page{' '}
                  <span className='font-medium'>
                    {emailPagination.currentPage}
                  </span>{' '}
                  of{' '}
                  <span className='font-medium'>
                    {emailPagination.totalPages}
                  </span>{' '}
                  (
                  <span className='font-medium'>
                    {emailPagination.totalRecords}
                  </span>{' '}
                  results)
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() =>
                      fetchEmailList(
                        selectedNotificationId,
                        emailPagination.currentPage - 1
                      )
                    }
                    disabled={emailPagination.currentPage <= 1}
                    className={`px-3 py-1.5 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 ${
                      emailPagination.currentPage <= 1
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      fetchEmailList(
                        selectedNotificationId,
                        emailPagination.currentPage + 1
                      )
                    }
                    disabled={
                      emailPagination.totalPages === 0 ||
                      emailPagination.currentPage >= emailPagination.totalPages
                    }
                    className={`px-3 py-1.5 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 ${
                      emailPagination.totalPages === 0 ||
                      emailPagination.currentPage >= emailPagination.totalPages
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
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
