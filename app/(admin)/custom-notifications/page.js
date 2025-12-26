'use client'

import React, { useState } from 'react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import {
  Bell,
  Send,
  Link as LinkIcon,
  Type,
  Image as ImageIcon
} from 'lucide-react'
import { createCustomNotification } from '@/services/notification/notification.service'
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
    link: ''
  })

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
        link: ''
      })
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
