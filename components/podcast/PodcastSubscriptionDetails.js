'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Search, Filter, Download, MoreVertical, Eye, Trash2, CheckCircle, XCircle, Edit2 } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'

export default function PodcastSubscriptionDetails() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('Monthly')
  const [actionOpen, setActionOpen] = useState(null)
  
  const [formData, setFormData] = useState({
    name: 'Basic Plan',
    price: '₦10,000',
    type: 'Monthly',
    details: '<ul><li>Ad-free listening</li><li>Early access to episodes</li><li>Weekly workout plans (PDF)</li><li>Nutrition tips & meal guides</li></ul>'
  })

  const [subscriptions, setSubscriptions] = useState([
    {
      id: 1,
      addedOn: '12 June 2025, 10:00 AM',
      name: 'Basic Plan',
      type: 'Monthly',
      subscribers: 100,
      status: 'Active'
    },
    {
      id: 2,
      addedOn: '12 June 2025, 10:00 AM',
      name: 'Elite Plan',
      type: 'Monthly',
      subscribers: 100,
      status: 'Active'
    },
    {
      id: 3,
      addedOn: '12 June 2025, 10:00 AM',
      name: 'Pro Plan',
      type: 'Monthly',
      subscribers: 100,
      status: 'Inactive'
    }
  ])

  const toggleAction = (id) => {
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
          <h2 className='text-lg font-bold text-gray-900'>Subscription Details</h2>
          <button className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#E63D00]'>
            Add
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.type === 'Monthly' ? 'border-[#FF4400]' : 'border-gray-300'}`}>
                    {formData.type === 'Monthly' && <div className='w-2.5 h-2.5 rounded-full bg-[#FF4400]' />}
                  </div>
                  <input 
                    type='radio' 
                    name='type' 
                    className='hidden'
                    checked={formData.type === 'Monthly'}
                    onChange={() => setFormData({ ...formData, type: 'Monthly' })}
                  />
                  <span className='text-sm text-gray-700'>Monthly</span>
                </label>
                
                <label className='flex items-center gap-2 cursor-pointer'>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.type === 'Yearly' ? 'border-[#FF4400]' : 'border-gray-300'}`}>
                    {formData.type === 'Yearly' && <div className='w-2.5 h-2.5 rounded-full bg-[#FF4400]' />}
                  </div>
                  <input 
                    type='radio' 
                    name='type' 
                    className='hidden'
                    checked={formData.type === 'Yearly'}
                    onChange={() => setFormData({ ...formData, type: 'Yearly' })}
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
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                onChange={(content) => setFormData({ ...formData, details: content })}
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
                  Subscribers <span className='ml-1 text-[10px]'>↕</span>
                </th>
                <th className='py-4 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status <span className='ml-1 text-[10px]'>↕</span>
                </th>
                <th className='py-4 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className='hover:bg-gray-50/50'>
                  <td className='py-4 px-4 text-sm text-gray-500'>
                    {sub.addedOn}
                  </td>
                  <td className='py-4 px-4 text-sm font-medium text-gray-900'>
                    {sub.name}
                  </td>
                  <td className='py-4 px-4 text-sm text-gray-500'>
                    {sub.type}
                  </td>
                  <td className='py-4 px-4 text-sm font-medium text-[#0066FF] cursor-pointer hover:underline'>
                    {sub.subscribers} (View List)
                  </td>
                  <td className='py-4 px-4'>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                      sub.status === 'Active' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        sub.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      {sub.status}
                    </span>
                  </td>
                  <td className='py-4 px-4 text-right relative'>
                    <button 
                      onClick={() => toggleAction(sub.id)}
                      className='text-gray-400 hover:text-gray-600'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </button>
                    
                    {actionOpen === sub.id && (
                      <div className='absolute right-4 top-10 z-10 w-40 rounded-lg border border-gray-100 bg-white shadow-lg py-1'>
                        <button className='flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                          Edit
                        </button>
                        <button className='flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                          Delete
                        </button>
                        <div className='my-1 h-px bg-gray-100' />
                        <button className='flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                          Active
                        </button>
                        <button className='flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'>
                          Inactive
                        </button>
                      </div>
                    )}
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
