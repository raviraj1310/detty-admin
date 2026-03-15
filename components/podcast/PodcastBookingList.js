import { Search, Filter, Download, MoreVertical, Loader2 } from 'lucide-react'
import { useState } from 'react'

export default function PodcastBookingList ({
  bookings,
  onDownload,
  downloadingExcel
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBookings = bookings.filter(
    booking =>
      booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
      <div className='flex flex-col gap-4 border-b border-gray-100 px-6 py-4 md:flex-row md:items-center md:justify-between'>
        <h2 className='text-lg font-semibold text-gray-900'>
          Subscription List
        </h2>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              placeholder='Search'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='h-10 w-64 rounded-lg border border-gray-200 pl-10 pr-4 text-sm focus:border-[#FF4400] focus:outline-none'
            />
          </div>
          <button className='flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50'>
            <Filter className='h-4 w-4' />
            Filters
          </button>
          <button
            type='button'
            onClick={onDownload}
            disabled={!onDownload || downloadingExcel}
            className='flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50'
          >
            {downloadingExcel ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Download className='h-4 w-4' />
            )}
          </button>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <table className='w-full text-left text-sm text-gray-500'>
          <thead className='bg-gray-50 text-xs uppercase text-gray-700'>
            <tr>
              <th className='px-6 py-3 font-medium'>Booked On</th>
              <th className='px-6 py-3 font-medium'>User Name</th>
              <th className='px-6 py-3 font-medium'>Email Id</th>
              <th className='px-6 py-3 font-medium'>Phone Number</th>
              <th className='px-6 py-3 font-medium'>Access Booked</th>
              <th className='px-6 py-3 font-medium'>Amount</th>
              <th className='px-6 py-3 font-medium'>Payment Status</th>
              <th className='px-6 py-3 font-medium'></th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white'>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan='8' className='px-6 py-8 text-center text-gray-500'>
                  No subscriptions found
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking, index) => (
                <tr key={index} className='hover:bg-gray-50'>
                  <td className='whitespace-nowrap px-6 py-4'>
                    {booking.bookedOn}
                  </td>
                  <td className='whitespace-nowrap px-6 py-4 font-medium text-gray-900'>
                    {booking.userName}
                  </td>
                  <td className='whitespace-nowrap px-6 py-4'>
                    {booking.email}
                  </td>
                  <td className='whitespace-nowrap px-6 py-4'>
                    {booking.phone}
                  </td>
                  <td className='whitespace-nowrap px-6 py-4'>
                    {booking.accessBooked}
                    <span className='text-gray-400 text-xs block'>
                      (₦{booking.accessPrice})
                    </span>
                  </td>
                  <td className='whitespace-nowrap px-6 py-4 font-medium text-gray-900'>
                    ₦{booking.amount}
                  </td>
                  <td className='whitespace-nowrap px-6 py-4'>
                    {(() => {
                      const statusText = String(booking.status || '').toLowerCase()
                      const isSuccess = statusText === 'success'
                      const label =
                        statusText.charAt(0).toUpperCase() + statusText.slice(1)
                      return (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isSuccess
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {label || 'Unknown'}
                        </span>
                      )
                    })()}
                  </td>
                  <td className='whitespace-nowrap px-6 py-4 text-right'>
                    <button className='text-gray-400 hover:text-gray-600'>
                      <MoreVertical className='h-4 w-4' />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
