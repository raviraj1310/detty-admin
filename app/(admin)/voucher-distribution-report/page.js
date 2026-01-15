'use client'

import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { getVoucherReport } from '@/services/voucher-distribution-report/voucher.service'

const formatDate = date => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function VoucherDistributionReportPage () {
  const [selectedDate, setSelectedDate] = useState('')
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(0)

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {}
      params.page = page
      params.limit = limit
      if (selectedDate) params.date = selectedDate
      const res = await getVoucherReport(params)
      if (res?.success && res?.data) {
        setCount(typeof res.data.count === 'number' ? res.data.count : 0)
        setUsers(Array.isArray(res.data.users) ? res.data.users : [])
        setTotalPages(res.data.totalPages || 1)
      } else if (typeof res?.count === 'number') {
        setCount(res.count)
        setUsers(Array.isArray(res.users) ? res.users : [])
        setTotalPages(res.totalPages || 1)
      } else {
        setCount(0)
        setUsers([])
        setTotalPages(0)
      }
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Failed to fetch voucher report'
      )
      setCount(0)
      setUsers([])
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [selectedDate, page, limit])

  const handleDateChange = e => {
    const value = e.target.value
    setPage(1)
    setSelectedDate(value)
  }

  const startIndex = count === 0 ? 0 : (page - 1) * limit + 1
  const endIndex = count === 0 ? 0 : Math.min(page * limit, count)

  return (
    <div className='min-h-screen bg-white py-8 px-8'>
      <div className='mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Voucher Distribution Report
          </h1>
          <p className='text-sm text-gray-500 mt-1'>
            Admin / Voucher Distribution Report
          </p>
        </div>

        <div className='flex items-end gap-3'>
          <div className='flex flex-col'>
            <label className='text-[11px] text-gray-500 font-medium ml-1 mb-1'>
              Date
            </label>
            <div className='relative'>
              <input
                type='date'
                value={selectedDate}
                max={formatDate(new Date())}
                onChange={handleDateChange}
                className='h-10 w-44 pl-10 pr-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500 bg-white'
              />
              <CalendarDays className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
            </div>
          </div>
        </div>
      </div>

      <div className='bg-gray-50 p-6 rounded-xl space-y-6'>
        {error && (
          <div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700'>
            <span>{error}</span>
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='flex items-center gap-2 flex-1 rounded-md p-1.5 transition-all min-w-[140px] bg-[#E8EEFF] shadow-sm hover:shadow-md'>
            <div className='p-1.5 rounded-lg flex-shrink-0 bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]'>
              <img
                src='/images/dashboard/icons (6).svg'
                alt='Vouchers Assigned'
                className='w-5 h-5'
              />
            </div>
            <div className='flex flex-col'>
              <p className='text-[10px] font-medium text-gray-600 mb-0.5'>
                Vouchers Assigned
              </p>
              <p className='text-sm font-bold text-gray-900'>
                {loading ? '...' : count}
              </p>
              <p className='text-[9px] text-gray-500 mt-0.5 whitespace-nowrap'>
                Total users assigned vouchers
                {selectedDate ? ' on selected date' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className='mt-6 rounded-xl border border-[#E1E6F7] bg-white p-4 shadow-sm'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-sm font-semibold text-slate-900'>
              Voucher Assigned Users
            </h2>
            <p className='text-xs text-[#99A1BC]'>
              {users.length} user{users.length === 1 ? '' : 's'} loaded
            </p>
          </div>

          {loading && (
            <div className='py-6 text-center text-sm text-gray-500'>
              Loading users...
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className='py-6 text-center text-sm text-gray-500'>
              No users found
              {selectedDate ? ' for the selected date' : ''}.
            </div>
          )}

          {!loading && users.length > 0 && (
            <>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200 text-sm'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Name
                      </th>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Email
                      </th>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Phone
                      </th>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Voucher Code
                      </th>
                      <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Created At
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td className='px-4 py-2 whitespace-nowrap text-gray-900'>
                          {user.name || '-'}
                        </td>
                        <td className='px-4 py-2 whitespace-nowrap text-gray-700'>
                          {user.email || '-'}
                        </td>
                        <td className='px-4 py-2 whitespace-nowrap text-gray-700'>
                          {user.phoneNumber || '-'}
                        </td>
                        <td className='px-4 py-2 whitespace-nowrap font-mono text-gray-900'>
                          {user.voucherCode || '-'}
                        </td>
                        <td className='px-4 py-2 whitespace-nowrap text-gray-500 text-xs'>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className='mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6'>
                <div className='flex flex-1 justify-between sm:hidden'>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className='relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage(p => Math.min(totalPages || 1, p + 1))
                    }
                    disabled={page === totalPages || totalPages === 0}
                    className='relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
                  >
                    Next
                  </button>
                </div>
                <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
                  <div>
                    <p className='text-sm text-gray-700'>
                      Showing <span className='font-medium'>{startIndex}</span>{' '}
                      to <span className='font-medium'>{endIndex}</span> of{' '}
                      <span className='font-medium'>{count}</span> results
                    </p>
                  </div>
                  <div>
                    <nav
                      className='isolate inline-flex -space-x-px rounded-md shadow-sm'
                      aria-label='Pagination'
                    >
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className='relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
                      >
                        <span className='sr-only'>Previous</span>‹
                      </button>
                      {Array.from(
                        { length: Math.max(totalPages, 1) },
                        (_, i) => i + 1
                      )
                        .filter(
                          p =>
                            p === 1 ||
                            p === totalPages ||
                            (p >= page - 1 && p <= page + 1)
                        )
                        .map((p, i, arr) => (
                          <span key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && (
                              <span className='relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0'>
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setPage(p)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === p
                                  ? 'z-10 bg-[#FF5B2C] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5B2C]'
                                  : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                              }`}
                            >
                              {p}
                            </button>
                          </span>
                        ))}
                      <button
                        onClick={() =>
                          setPage(p => Math.min(totalPages || 1, p + 1))
                        }
                        disabled={page === totalPages || totalPages === 0}
                        className='relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
                      >
                        <span className='sr-only'>Next</span>›
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
