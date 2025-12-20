'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import { downloadExcel } from '@/utils/excelExport'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Modal from '@/components/ui/Modal'
import { getAllRideBookings } from '@/services/rides/ride.service'

function ActionDropdown ({ onAction }) {
  const [isOpen, setIsOpen] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })

  const handleButtonClick = e => {
    e.stopPropagation() // Prevent row click if any
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const dropdownHeight = 100 // Approx height

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
        data-menu-button
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
            data-menu-content
            className='fixed w-48 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 py-2'
            style={{
              top: `${buttonPosition.top}px`,
              right: `${buttonPosition.right}px`
            }}
          >
            <button
              className='flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
              onClick={() => {
                onAction('view')
                setIsOpen(false)
              }}
            >
              <span className='mr-3 text-gray-500'>
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
              </span>
              <span className='text-gray-800'>View Detail</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: true },
  { id: 'event', label: 'Event', active: false },
  { id: 'activities', label: 'Places to Visit', active: false },
  { id: 'merchandise', label: 'Merchandise', active: false },
  { id: 'e-sim', label: 'Internet Connectivity', active: false },
  { id: 'accommodation', label: 'Accommodation', active: false },
  { id: 'med-plus', label: 'Med Plus', active: false },
  { id: 'royal-concierge', label: 'Royal Concierge', active: false },
  { id: 'rides', label: 'Rides', active: true },
  { id: 'leadway', label: 'Leadway', active: false }
  // { id: 'diy', label: 'DIY', active: false },
]

export default function RidesForm () {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('rides')
  const router = useRouter()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Modal states
  const [selectedRide, setSelectedRide] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const cleanString = str =>
    String(str || '')
      .replace(/[`]/g, '')
      .trim()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getAllRideBookings()
        // API structure: { success: true, data: { data: [...] } }
        const rawList = res?.data?.data || []

        const list = rawList.map(item => {
          const images = (item.images || []).map(cleanString)
          const amenities = (item.amenities || []).map(a => ({
            ...a,
            image: cleanString(a.image)
          }))

          return {
            ...item,
            cleanImages: images,
            mainImage: images[0] || '',
            cleanAmenities: amenities,
            priceFormatted: item.currency
              ? `${item.currency.symbol}${Number(item.price).toLocaleString()}`
              : `₦${Number(item.price).toLocaleString()}`
          }
        })

        setRides(list)
      } catch (e) {
        console.error(e)
        setError('Failed to load rides')
        setRides([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredRides = rides
    .filter(ride => {
      const term = searchTerm.toLowerCase().trim()
      if (!term) return true

      return (
        ride.name?.toLowerCase().includes(term) ||
        String(ride.price).includes(term) ||
        String(ride.seats).includes(term)
      )
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1

      switch (sortKey) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'price':
          return dir * (Number(a.price) - Number(b.price))
        case 'seats':
          return dir * (Number(a.seats) - Number(b.seats))
        case 'quantity':
          return dir * (Number(a.quantity) - Number(b.quantity))
        default:
          return 0
      }
    })

  const toggleSort = key => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleViewDetail = ride => {
    setSelectedRide(ride)
    setDetailOpen(true)
  }

  const handleDownloadExcel = () => {
    if (!filteredRides || filteredRides.length === 0) {
      return
    }
    const dataToExport = filteredRides.map(ride => ({
      ID: ride.id,
      Name: ride.name,
      Description: ride.description || '-',
      Price: ride.price,
      Seats: ride.seats,
      Quantity: ride.quantity,
      Margin: ride.margin,
      'Currency Name': ride.currency?.name,
      'Currency Short': ride.currency?.shortName,
      'Currency Symbol': ride.currency?.symbol,
      'Selected For Website': ride.selected_for_website ? 'Yes' : 'No',
      'Is Security Vehicle': ride.is_security_vehicle ? 'Yes' : 'No',
      'Personnel Station Cost': ride.personnel_station_unit_cost,
      'Personnel Off Station Cost': ride.personnel_off_station_unit_cost,
      'Vehicle Off Station Cost': ride.vehicle_off_station_unit_cost,
      'City ID': ride.city_id || '-',
      Amenities: ride.cleanAmenities?.map(a => a.name).join(', ') || '-',
      Images: ride.cleanImages?.join(', ') || '-',
      'Created At': ride.created_at,
      'Updated At': ride.updated_at
    }))
    downloadExcel(dataToExport, 'Rides_Bookings.xlsx')
  }

  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='bg-gray-200 p-5 rounded-xl'>
        {/* Main Content */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0'>
          {/* Header with Search and Filters */}
          <div className='p-4 border-b border-gray-200 flex-shrink-0'>
            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Rides List
              </h2>
              <div className='flex items-center space-x-4'>
                {/* Search */}
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search rides...'
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

                {/* Filters Button (Visual only for now as per previous form) */}
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
                  <Download className='h-4 w-4 text-gray-600 mr-2' />
                  <span className='text-gray-700 font-medium'>Export</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className='flex space-x-2 overflow-x-auto pb-2'>
              {filterTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    switch (tab.id) {
                      case 'bundle-orders':
                        router.push('/users/bookings')
                        break
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
                      case 'med-plus':
                        router.push('/med-orders')
                        break
                      case 'royal-concierge':
                        router.push('/royal-concierge')
                        break
                      case 'rides':
                        router.push('/users/rides')
                        break
                      case 'leadway':
                        router.push('/leadway')
                        break
                      default:
                        setActiveTab(tab.id)
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap ${
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
          <div className='flex-1 overflow-auto'>
            {loading ? (
              <div className='flex justify-center items-center h-40'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
              </div>
            ) : error ? (
              <div className='flex justify-center items-center h-40 text-red-500'>
                {error}
              </div>
            ) : (
              <table className='w-full'>
                <thead className='bg-gray-50 sticky top-0 z-10'>
                  <tr>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Image
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      <button
                        type='button'
                        onClick={() => toggleSort('name')}
                        className='flex items-center'
                      >
                        <span>Name</span>
                        <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                      </button>
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      <button
                        type='button'
                        onClick={() => toggleSort('price')}
                        className='flex items-center'
                      >
                        <span>Price</span>
                        <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                      </button>
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      <button
                        type='button'
                        onClick={() => toggleSort('seats')}
                        className='flex items-center'
                      >
                        <span>Seats</span>
                        <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                      </button>
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      <button
                        type='button'
                        onClick={() => toggleSort('quantity')}
                        className='flex items-center'
                      >
                        <span>Quantity</span>
                        <TbCaretUpDownFilled className='w-3 h-3 text-gray-400 ml-1' />
                      </button>
                    </th>
                    <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredRides.length > 0 ? (
                    filteredRides.map(ride => (
                      <tr key={ride.id} className='hover:bg-gray-50'>
                        <td className='px-4 py-4 whitespace-nowrap'>
                          <div className='w-16 h-12 relative rounded overflow-hidden bg-gray-100'>
                            {ride.mainImage ? (
                              <img
                                src={ride.mainImage}
                                alt={ride.name}
                                className='w-full h-full object-cover'
                              />
                            ) : (
                              <div className='flex items-center justify-center h-full text-xs text-gray-400'>
                                No Img
                              </div>
                            )}
                          </div>
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          {ride.name}
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {ride.priceFormatted}
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {ride.seats}
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {ride.quantity}
                        </td>
                        <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                          <ActionDropdown
                            onAction={action => {
                              if (action === 'view') handleViewDetail(ride)
                            }}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan='6'
                        className='px-4 py-12 text-center text-gray-500'
                      >
                        No rides found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title='Ride Details'
        maxWidth='max-w-6xl'
        className='!p-5'
      >
        {selectedRide && (
          <div className='max-h-[70vh] overflow-y-auto pr-2'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-4'>
                {/* General Info */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    General Information
                  </h3>
                  <div className='grid grid-cols-2 gap-y-2 gap-x-4 text-sm'>
                    <div className='text-slate-600'>Name</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selectedRide.name || '-'}
                    </div>

                    <div className='text-slate-600'>Price</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selectedRide.priceFormatted || '-'}
                    </div>

                    <div className='text-slate-600'>Seats</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selectedRide.seats || '-'}
                    </div>

                    <div className='text-slate-600'>Quantity</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selectedRide.quantity || '-'}
                    </div>

                    <div className='text-slate-600'>Margin</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selectedRide.margin || '0'}%
                    </div>

                    <div className='text-slate-600'>Currency</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selectedRide.currency?.shortName ||
                        selectedRide.currency?.name ||
                        'NGN'}
                    </div>
                  </div>
                </div>

                {/* Status & Dates */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    Status & Dates
                  </h3>
                  <div className='grid grid-cols-2 gap-y-2 gap-x-4 text-sm'>
                    <div className='text-slate-600'>Created At</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selectedRide.created_at
                        ? new Date(selectedRide.created_at).toLocaleString()
                        : '-'}
                    </div>

                    <div className='text-slate-600'>Updated At</div>
                    <div className='font-medium text-right text-slate-900'>
                      {selectedRide.updated_at
                        ? new Date(selectedRide.updated_at).toLocaleString()
                        : '-'}
                    </div>

                    <div className='text-slate-600'>Selected For Website</div>
                    <div className='font-medium text-right'>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedRide.selected_for_website
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {selectedRide.selected_for_website ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className='text-slate-600'>Security Vehicle</div>
                    <div className='font-medium text-right'>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          selectedRide.is_security_vehicle
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {selectedRide.is_security_vehicle ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Costing */}
                <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                  <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                    Costing
                  </h3>
                  <div className='grid grid-cols-2 gap-y-2 gap-x-4 text-sm'>
                    <div className='text-slate-600'>Personnel Station Cost</div>
                    <div className='font-medium text-right text-slate-900'>
                      {Number(
                        selectedRide.personnel_station_unit_cost
                      ).toLocaleString()}
                    </div>

                    <div className='text-slate-600'>
                      Personnel Off Station Cost
                    </div>
                    <div className='font-medium text-right text-slate-900'>
                      {Number(
                        selectedRide.personnel_off_station_unit_cost
                      ).toLocaleString()}
                    </div>

                    <div className='text-slate-600'>
                      Vehicle Off Station Cost
                    </div>
                    <div className='font-medium text-right text-slate-900'>
                      {Number(
                        selectedRide.vehicle_off_station_unit_cost
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                {/* Description */}
                {selectedRide.description && (
                  <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                    <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                      Description
                    </h3>
                    <p className='text-sm text-slate-600 leading-relaxed whitespace-pre-wrap'>
                      {selectedRide.description}
                    </p>
                  </div>
                )}

                {/* Amenities */}
                {selectedRide.cleanAmenities &&
                  selectedRide.cleanAmenities.length > 0 && (
                    <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                      <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                        Amenities
                      </h3>
                      <div className='grid grid-cols-2 gap-3'>
                        {selectedRide.cleanAmenities.map((amenity, idx) => (
                          <div
                            key={idx}
                            className='flex items-center p-2 rounded-lg bg-white border border-slate-100'
                          >
                            {amenity.image && (
                              <img
                                src={amenity.image}
                                alt={amenity.name}
                                className='w-8 h-8 object-contain mr-3'
                              />
                            )}
                            <div>
                              <p className='text-sm font-medium text-slate-900'>
                                {amenity.name}
                              </p>
                              {amenity.short_name &&
                                amenity.short_name !== amenity.name && (
                                  <p className='text-xs text-slate-500'>
                                    {amenity.short_name}
                                  </p>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Images */}
                {selectedRide.cleanImages &&
                  selectedRide.cleanImages.length > 0 && (
                    <div className='bg-slate-50 p-3 rounded-lg border border-slate-200'>
                      <h3 className='font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-2'>
                        Images
                      </h3>
                      <div className='grid grid-cols-2 gap-2'>
                        {selectedRide.cleanImages.map((img, idx) => (
                          <div
                            key={idx}
                            className='relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200'
                          >
                            <img
                              src={img}
                              alt={`${selectedRide.name} ${idx + 1}`}
                              className='w-full h-full object-cover'
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
