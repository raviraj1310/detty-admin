'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { downloadExcel } from '@/utils/excelExport'

const diyBundleData = [
  {
    id: 1,
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    bundleName: 'Solo Hangout Bundle',
    bundleImage: '/images/diy/solo-hangout.jpg',
    bundleInfo: [
      '3 Rooms x Cozy Lakis 2BR with Balcony (₦2,000)',
      '6 Tickets x Walk the canopy bridge at Lekki (₦2,000)'
    ],
    bundleAmount: '₦16,000',
    status: 'Done',
    paymentStatus: 'Completed'
  },
  {
    id: 2,
    addedOn: 'Sat, 15 June 2025, 10:00 AM',
    bundleName: 'Family Getaway Bundle',
    bundleImage: '/images/diy/family-getaway.jpg',
    bundleInfo: [
      '3 Rooms x Cozy Lakis 2BR with Balcony (₦2,000)',
      '6 Tickets x Walk the canopy bridge at Lekki (₦2,000)'
    ],
    bundleAmount: '₦16,000',
    status: 'Upcoming',
    paymentStatus: 'Completed'
  },
  {
    id: 3,
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    bundleName: 'Solo Hangout Bundle',
    bundleImage: '/images/diy/solo-hangout2.jpg',
    bundleInfo: [
      '3 Rooms x Cozy Lakis 2BR with Balcony (₦2,000)',
      '6 Tickets x Walk the canopy bridge at Lekki (₦2,000)'
    ],
    bundleAmount: '₦16,000',
    status: 'Done',
    paymentStatus: 'Completed'
  },
  {
    id: 4,
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    bundleName: 'Family Getaway Bundle',
    bundleImage: '/images/diy/family-getaway2.jpg',
    bundleInfo: [
      '3 Rooms x Cozy Lakis 2BR with Balcony (₦2,000)',
      '6 Tickets x Walk the canopy bridge at Lekki (₦2,000)'
    ],
    bundleAmount: '₦16,000',
    status: 'Upcoming',
    paymentStatus: 'Completed'
  }
]

function ActionDropdown ({ bundleId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })

  const actions = [
    {
      label: 'View Detail',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
          />
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
          />
        </svg>
      )
    },
    {
      label: 'View Bundle',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
          />
        </svg>
      )
    },
    {
      label: 'Edit Bundle',
      icon: (
        <svg
          className='w-4 h-4'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
          />
        </svg>
      )
    }
  ]

  const handleButtonClick = e => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const dropdownHeight = 150

      let top = rect.bottom + 8
      let right = window.innerWidth - rect.right

      if (top + dropdownHeight > windowHeight) {
        top = rect.top - dropdownHeight - 8
      }

      setButtonPosition({ top, right })
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className='relative'>
      <button
        onClick={handleButtonClick}
        className='p-1 hover:bg-gray-100 rounded-full transition-colors'
      >
        <svg
          className='w-5 h-5 text-gray-600'
          fill='currentColor'
          viewBox='0 0 20 20'
        >
          <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsOpen(false)}
          />
          <div
            className='fixed w-52 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 py-2'
            style={{
              top: `${buttonPosition.top}px`,
              right: `${buttonPosition.right}px`
            }}
          >
            {actions.map((action, index) => (
              <button
                key={index}
                className='flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                onClick={() => {
                  console.log(`${action.label} for bundle ${bundleId}`)
                  setIsOpen(false)
                }}
              >
                <span className='mr-3 text-gray-500'>{action.icon}</span>
                <span className='text-gray-800'>{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: false },
  { id: 'event', label: 'Event', active: false },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: false },
  { id: 'accommodation', label: 'Accommodation', active: false }
  // { id: 'diy', label: 'DIY', active: true },
]

export default function DIYPage () {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('diy')
  const router = useRouter()

  const handleTabClick = tabId => {
    switch (tabId) {
      case 'event':
        router.push('/users/transactions')
        break
      case 'activities':
        router.push('/users/activities')
        break
      case 'accommodation':
        router.push('/users/accommodation')
        break
      case 'diy':
        router.push('/users/diy')
        break
      case 'merchandise':
        router.push('/users/merchandise')
        break
      case 'e-sim':
        router.push('/users/e-sim')
        break
      default:
        setActiveTab(tabId)
    }
  }

  const filteredBundles = diyBundleData.filter(bundle => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return true
    const termDigits = term.replace(/[^0-9]/g, '')
    const name = String(bundle.bundleName || '').toLowerCase()
    const infoText = String((bundle.bundleInfo || []).join(' | ')).toLowerCase()
    const addedStr = String(bundle.addedOn || '').toLowerCase()
    const addedDigits = String(bundle.addedOn || '').replace(/[^0-9]/g, '')
    const matchesText =
      name.includes(term) || infoText.includes(term) || addedStr.includes(term)
    const matchesDigits = termDigits && addedDigits.includes(termDigits)
    return matchesText || matchesDigits
  })

  const handleDownloadExcel = () => {
    if (!filteredBundles || filteredBundles.length === 0) {
      return
    }
    const dataToExport = filteredBundles.map(bundle => ({
      'Added On': bundle.addedOn,
      'Bundle Name': bundle.bundleName,
      'Bundle Info': Array.isArray(bundle.bundleInfo)
        ? bundle.bundleInfo.join(', ')
        : bundle.bundleInfo,
      'Bundle Amount': bundle.bundleAmount,
      Status: bundle.status,
      'Payment Status': bundle.paymentStatus
    }))
    downloadExcel(dataToExport, 'DIY_Bundles.xlsx')
  }

  const getStatusColor = status => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-800'
      case 'Ongoing':
        return 'bg-blue-100 text-blue-800'
      case 'Upcoming':
        return 'bg-red-100 text-red-800'
      case 'TBL':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = status => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'Incomplete':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className='p-4 h-screen bg-white overflow-hidden'>
      {/* Title and Breadcrumb */}
      <div className='mb-4'>
        <h1 className='text-xl font-bold text-gray-900 mb-1'>Bookings</h1>

        <nav className='text-sm text-gray-500'>
          <span>Dashboard</span> / <span>Users</span>
        </nav>
      </div>
      <div className='bg-gray-200 p-5 rounded-xl'>
        {/* Main Content */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          {/* Header with Search and Filters */}
          <div className='p-4 border-b border-gray-200'>
            <div className='flex justify-between items-center mb-3'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Booking List
              </h2>
              <div className='flex items-center space-x-4'>
                {/* Search */}
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500'
                  />
                  <svg
                    className='w-5 h-5 text-gray-600 absolute left-3 top-2.5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </div>

                {/* Filters */}
                <button className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'>
                  <svg
                    className='w-4 h-4 mr-2 text-gray-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z'
                    />
                  </svg>
                  <span className='text-gray-700 font-medium'>Filters</span>
                </button>

                {/* Download */}
                <button
                  onClick={handleDownloadExcel}
                  className='flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
                >
                  <svg
                    className='w-4 h-4 text-gray-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3'
                    />
                  </svg>
                  <span className='ml-2 text-gray-700 font-medium'>Export</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className='flex space-x-2 mt-3'>
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    tab.id === activeTab
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 sticky top-0'>
                <tr>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Added On</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>DIY Bundle Name</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Bundle Info</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Bundle Amount</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    <div className='flex items-center'>
                      <span>Payment Status</span>
                      <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                    </div>
                  </th>
                  <th className='px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20'></th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {filteredBundles.map(bundle => (
                  <tr
                    key={bundle.id}
                    className='hover:bg-gray-50 border-b border-gray-100'
                  >
                    <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-500'>
                      {bundle.addedOn}
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='flex-shrink-0 h-10 w-10'>
                          <img
                            className='h-10 w-10 rounded-lg object-cover'
                            src={bundle.bundleImage}
                            alt={bundle.bundleName}
                            onError={e => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <div
                            className='h-10 w-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center'
                            style={{ display: 'none' }}
                          >
                            <svg
                              className='w-5 h-5 text-white'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
                            </svg>
                          </div>
                        </div>
                        <div className='ml-3'>
                          <div className='text-sm font-medium text-gray-900 leading-tight'>
                            {bundle.bundleName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap text-sm text-gray-900'>
                      <div className='space-y-1'>
                        {bundle.bundleInfo.map((info, index) => (
                          <div key={index} className='text-xs text-gray-600'>
                            {info}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      <span className='text-sm font-semibold text-gray-900'>
                        {bundle.bundleAmount}
                      </span>
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          bundle.status
                        )}`}
                      >
                        • {bundle.status}
                      </span>
                    </td>
                    <td className='px-3 py-3 whitespace-nowrap'>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          bundle.paymentStatus
                        )}`}
                      >
                        {bundle.paymentStatus}
                      </span>
                    </td>
                    <td className='px-6 py-3 whitespace-nowrap text-right relative'>
                      <ActionDropdown bundleId={bundle.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
