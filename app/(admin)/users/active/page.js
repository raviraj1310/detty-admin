'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  getActiveUsers,
  downloadActiveExcel
} from '@/services/users/user.service'
import Image from 'next/image'
import { ChevronUp, ChevronDown, Download, ChevronLeft } from 'lucide-react'
import { TbTrendingUp } from 'react-icons/tb'

function SortHeader ({ title, sortKey, activeKey, direction, onSort }) {
  const active = activeKey === sortKey
  return (
    <button
      type='button'
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-xs font-medium tracking-[0.04em] ${
        active ? 'text-[#2D3658]' : 'text-[#8A92AC]'
      } hover:text-[#2D3658]`}
    >
      {title}
      {active ? (
        direction === 'asc' ? (
          <ChevronUp size={14} className='text-[#2D3658] flex-shrink-0' />
        ) : (
          <ChevronDown size={14} className='text-[#2D3658] flex-shrink-0' />
        )
      ) : (
        <TbTrendingUp size={14} className='text-[#CBCFE2] flex-shrink-0' />
      )}
    </button>
  )
}

function PaginationControls ({
  pagination,
  setPagination,
  loading,
  className = ''
}) {
  return (
    <div className={`flex items-center justify-between px-2 ${className}`}>
      <div className='text-sm text-gray-500'>
        Page {pagination.page} of {pagination.totalPages}
      </div>
      <div className='flex gap-2'>
        <button
          onClick={() =>
            setPagination(prev => ({
              ...prev,
              page: Math.max(1, prev.page - 1)
            }))
          }
          disabled={pagination.page <= 1 || loading}
          className='px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 font-medium disabled:opacity-50 hover:bg-gray-50 bg-white transition-colors'
        >
          Previous
        </button>
        <button
          onClick={() =>
            setPagination(prev => ({
              ...prev,
              page: Math.min(pagination.totalPages, prev.page + 1)
            }))
          }
          disabled={pagination.page >= pagination.totalPages || loading}
          className='px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 font-medium disabled:opacity-50 hover:bg-gray-50 bg-white transition-colors'
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default function ActiveUsersPage () {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [counts, setCounts] = useState({
    totalUsers: 0,
    activeUsers: 0
  })
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getActiveUsers(pagination.page, pagination.limit)
        // res is the response body containing counts and data array
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []

        setCounts({
          totalUsers: Number(res?.totalUsers || 0),
          activeUsers: Number(res?.activeUsers || 0)
        })

        if (res?.pages) {
          setPagination(prev => ({
            ...prev,
            totalPages: res.pages
          }))
        }

        const mapped = list.map(it => {
          const u = it?.user || {}
          const sessions = Array.isArray(it?.sessions) ? it.sessions : []
          let latest = null
          for (const s of sessions) {
            if (!latest) latest = s
            else {
              const a = new Date(latest?.createdAt || latest?.sessionDate || 0)
              const b = new Date(s?.createdAt || s?.sessionDate || 0)
              if (b > a) latest = s
            }
          }
          const latestStr = latest?.sessionDate
            ? String(latest.sessionDate)
            : latest?.createdAt
            ? new Date(latest.createdAt).toLocaleString()
            : '-'
          const status =
            typeof u?.status === 'string'
              ? /^active$/i.test(String(u.status).trim())
                ? 'Active'
                : 'Inactive'
              : u?.status
              ? 'Active'
              : 'Inactive'
          return {
            id: u?._id || it?._id || Math.random().toString(36).slice(2),
            name: u?.name || '-',
            email: u?.email || '-',
            phone: u?.phoneNumber || '-',
            status,
            totalSessions: Number(it?.totalCount || sessions.length || 0),
            latestSession: latestStr,
            createdOn: u?.createdAt
              ? new Date(u.createdAt).toLocaleString()
              : '-'
          }
        })
        setRows(mapped)
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            'Failed to load active users'
        )
        setRows([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pagination.page, pagination.limit])

  const filtered = useMemo(() => {
    const t = String(search || '')
      .trim()
      .toLowerCase()
    let base = rows
    if (t) {
      base = base.filter(r => {
        const hay = `${String(r.name).toLowerCase()} ${String(
          r.email
        ).toLowerCase()} ${String(r.phone).toLowerCase()} ${String(
          r.status
        ).toLowerCase()}`
        return hay.includes(t)
      })
    }
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...base].sort((a, b) => {
      const ka = a[sort.key]
      const kb = b[sort.key]
      if (typeof ka === 'number' && typeof kb === 'number') {
        return (ka - kb) * dir
      }
      return String(ka).localeCompare(String(kb)) * dir
    })
  }, [rows, search, sort])

  const onSort = key => {
    setSort(prev => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const blob = await downloadActiveExcel()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `active_users_${new Date().toISOString().split('T')[0]}.xlsx`
      )
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (err) {
      console.error('Failed to export', err)
      alert('Failed to download Excel file')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 mb-1'>Active Users</h1>
          <nav className='text-sm text-gray-500'>
            <span>Dashboard</span> /{' '}
            <span className='text-gray-900 font-medium'>Users</span> /{' '}
            <span className='text-gray-900 font-medium'>Active</span>
          </nav>
        </div>
        <div className='flex items-center gap-3'>
          <button
            onClick={() => router.push('/users')}
            className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 flex items-center gap-1 hover:bg-gray-100'
          >
            <ChevronLeft size={14} className='text-gray-700' />
            Back
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className='h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {exporting ? (
              <span className='animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white'></span>
            ) : (
              <Download size={14} />
            )}
            Download Excel
          </button>
          <input
            type='text'
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search by name, email, phone'
            className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500 min-w-[260px]'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        <div className='bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF] p-4 rounded-lg shadow-md'>
          <div className='flex items-center'>
            <div className='bg-white bg-opacity-20 p-2 rounded-lg mr-3'>
              <Image
                src='/images/backend/icons/icons (1).svg'
                alt='Total Users Icon'
                width={24}
                height={24}
                className='w-6 h-6'
              />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                Total Registered Users
              </p>
              <p className='text-2xl text-black font-bold'>
                {counts.totalUsers}
              </p>
            </div>
          </div>
        </div>
        <div className='bg-gradient-to-r from-[#E8F8F0] to-[#B8EDD0] p-4 rounded-lg shadow-md'>
          <div className='flex items-center'>
            <div className='bg-white bg-opacity-20 p-2 rounded-lg mr-3'>
              <Image
                src='/images/backend/icons/icons (5).svg'
                alt='Active Users Icon'
                width={24}
                height={24}
                className='w-6 h-6'
              />
            </div>
            <div>
              <p className='text-xs text-black opacity-90'>
                Users With Sessions
              </p>
              <p className='text-2xl text-black font-bold'>
                {counts.activeUsers}
              </p>
            </div>
          </div>
        </div>
      </div>

      <PaginationControls
        pagination={pagination}
        setPagination={setPagination}
        loading={loading}
        className='mb-4'
      />

      <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead className='bg-[#F8FAF9]'>
              <tr>
                <th className='px-4 py-3 text-left'>
                  <SortHeader
                    title='Name'
                    sortKey='name'
                    activeKey={sort.key}
                    direction={sort.dir}
                    onSort={onSort}
                  />
                </th>
                <th className='px-4 py-3 text-left'>
                  <SortHeader
                    title='Email'
                    sortKey='email'
                    activeKey={sort.key}
                    direction={sort.dir}
                    onSort={onSort}
                  />
                </th>
                <th className='px-4 py-3 text-left'>
                  <SortHeader
                    title='Phone'
                    sortKey='phone'
                    activeKey={sort.key}
                    direction={sort.dir}
                    onSort={onSort}
                  />
                </th>
                <th className='px-4 py-3 text-left'>
                  <SortHeader
                    title='Status'
                    sortKey='status'
                    activeKey={sort.key}
                    direction={sort.dir}
                    onSort={onSort}
                  />
                </th>
                <th className='px-4 py-3 text-right'>
                  <SortHeader
                    title='Total Sessions'
                    sortKey='totalSessions'
                    activeKey={sort.key}
                    direction={sort.dir}
                    onSort={onSort}
                  />
                </th>
                <th className='px-4 py-3 text-left'>
                  <SortHeader
                    title='Latest Session'
                    sortKey='latestSession'
                    activeKey={sort.key}
                    direction={sort.dir}
                    onSort={onSort}
                  />
                </th>
                <th className='px-4 py-3 text-left'>
                  <SortHeader
                    title='Created On'
                    sortKey='createdOn'
                    activeKey={sort.key}
                    direction={sort.dir}
                    onSort={onSort}
                  />
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-100'>
              {loading && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-4 py-6 text-center text-sm text-[#5E6582]'
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {error && !loading && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-4 py-6 text-center text-sm text-red-600'
                  >
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className='px-4 py-6 text-center text-sm text-[#5E6582]'
                  >
                    No active users found
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                filtered.map(row => (
                  <tr key={row.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      {row.name}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      {row.email}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      {row.phone}
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-right text-sm text-gray-900'>
                      {row.totalSessions}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      {row.latestSession}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-700'>
                      {row.createdOn}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* <PaginationControls
        pagination={pagination}
        setPagination={setPagination}
        loading={loading}
        className='mt-4'
      /> */}
    </div>
  )
}
