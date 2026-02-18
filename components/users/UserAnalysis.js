'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import {
  getUserAnalysis,
  getRegisteredUser,
  downloadRegisteredExcel,
  getManuallyRegisteredUser,
  downloadManuallyRegisteredExcel,
  getDumpedUserProvided,
  downloadDumpedUserProvided,
  getEffectiveUsers,
  downloadEffectiveUsers,
  getSuccessfulDumped,
  downloadSuccessfulDumped,
  getIncompleteDumped,
  downloadIncompleteDumped,
  getSuccessPasswordReset,
  downloadSuccessPasswordReset,
  getIncompletePasswordReset,
  downloadIncompletePasswordReset,
  getDuplicateUsers,
  downloadDuplicateUsers
} from '@/services/users/user.service'

export default function UserAnalysis () {
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return {
      start: '2025-11-01',
      end: `${yyyy}-${mm}-${dd}`
    }
  })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [pageCount, setPageCount] = useState(1)
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({
    totalRegisteredUsers: 0,
    totalDumpedUsers: 0,
    totalManuallyRegisteredUsers: 0,
    resetPasswordTokenCount: 0,
    successfullyRegisteredUserWithResetPasswordToken: 0,
    tempDumpedUsersCount: 0,
    tempNotDumpedUsers: 0,
    duplicateUsersCount: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('analysis')
  const [registeredTotal, setRegisteredTotal] = useState(0)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!dateRange.start || !dateRange.end) {
        if (viewMode === 'analysis') {
          setUsers([])
        }
        setMeta(prev => ({
          ...prev,
          totalRegisteredUsers: 0,
          totalDumpedUsers: 0,
          totalManuallyRegisteredUsers: 0,
          resetPasswordTokenCount: 0,
          successfullyRegisteredUserWithResetPasswordToken: 0,
          tempDumpedUsersCount: 0,
          tempNotDumpedUsers: 0,
          duplicateUsersCount: 0
        }))
        setPageCount(1)
        setPage(1)
        return
      }

      setLoading(true)
      setError('')
      try {
        const params = {
          startDate: dateRange.start,
          endDate: dateRange.end,
          page,
          pageSize: limit,
          search: search ? search.trim() : undefined
        }

        const res = await getUserAnalysis(params)
        const payload = res?.data || res || {}
        const list = Array.isArray(payload.users) ? payload.users : []

        setMeta({
          totalRegisteredUsers: Number(payload.totalRegisteredUsers || 0),
          totalDumpedUsers: Number(payload.totalDumpedUsers || 0),
          totalManuallyRegisteredUsers: Number(
            payload.totalManuallyRegisteredUsers || 0
          ),
          resetPasswordTokenCount: Number(payload.resetPasswordTokenCount || 0),
          successfullyRegisteredUserWithResetPasswordToken: Number(
            payload.successfullyRegisteredUserWithResetPasswordToken || 0
          ),
          tempDumpedUsersCount: Number(payload.tempDumpedUsersCount || 0),
          tempNotDumpedUsers: Number(payload.tempNotDumpedUsers || 0),
          duplicateUsersCount: Number(payload.duplicateUsersCount || 0)
        })

        const srvPage = Number(payload.currentPage ?? page)
        const srvSize = Number(payload.pageSize ?? limit)
        const total = Number(payload.totalRegisteredUsers || 0)
        const totalPages =
          srvSize && Number.isFinite(srvSize)
            ? Math.max(1, Math.ceil(total / srvSize) || 1)
            : 1
        if (Number.isFinite(srvPage) && srvPage > 0 && srvPage !== page) {
          setPage(srvPage)
        }
        if (Number.isFinite(srvSize) && srvSize > 0 && srvSize !== limit) {
          setLimit(srvSize)
        }
        setPageCount(totalPages)

        if (viewMode === 'analysis') {
          setUsers(
            list.map(u => ({
              id: u._id,
              name: u.name || '-',
              email: u.email || '-',
              status: u.status || '-',
              registerStatus: u.registerStatus || '-',
              createdAt: u.createdAt || null,
              walletFunds:
                typeof u.walletFunds === 'number' ? u.walletFunds : null
            }))
          )
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Failed to fetch user analysis'
        )
      } finally {
        setLoading(false)
      }
    }

    if (viewMode === 'analysis') {
      fetchAnalysis()
    }
  }, [viewMode, dateRange, page, limit, search])

  useEffect(() => {
    setPage(1)
  }, [dateRange.start, dateRange.end])

  useEffect(() => {
    const fetchRegistered = async () => {
      if (
        viewMode !== 'registered' &&
        viewMode !== 'manual' &&
        viewMode !== 'dumpedProvided' &&
        viewMode !== 'effective' &&
        viewMode !== 'successfulDumped' &&
        viewMode !== 'incompleteDumped' &&
        viewMode !== 'successPasswordReset' &&
        viewMode !== 'incompletePasswordReset' &&
        viewMode !== 'duplicateUsers'
      )
        return

      if (!dateRange.start || !dateRange.end) {
        setUsers([])
        setRegisteredTotal(0)
        setPageCount(1)
        setPage(1)
        return
      }

      setLoading(true)
      setError('')
      try {
        const isManual = viewMode === 'manual'
        const isDumpedProvided = viewMode === 'dumpedProvided'
        const isEffective = viewMode === 'effective'
        const isSuccessfulDumped = viewMode === 'successfulDumped'
        const isIncompleteDumped = viewMode === 'incompleteDumped'
        const isSuccessPasswordReset = viewMode === 'successPasswordReset'
        const isIncompletePasswordReset = viewMode === 'incompletePasswordReset'
        const isDuplicateUsers = viewMode === 'duplicateUsers'
        const params = {
          startDate: dateRange.start,
          endDate: dateRange.end,
          page,
          pageSize: limit,
          search: search ? search.trim() : undefined
        }

        const res = await (isManual
          ? getManuallyRegisteredUser(params)
          : isDumpedProvided
          ? getDumpedUserProvided(params)
          : isEffective
          ? getEffectiveUsers(params)
          : isSuccessfulDumped
          ? getSuccessfulDumped(params)
          : isIncompleteDumped
          ? getIncompleteDumped(params)
          : isSuccessPasswordReset
          ? getSuccessPasswordReset(params)
          : isIncompletePasswordReset
          ? getIncompletePasswordReset(params)
          : isDuplicateUsers
          ? getDuplicateUsers(params)
          : getRegisteredUser(params))
        const payload = res?.data || res || {}
        const list = Array.isArray(payload.users) ? payload.users : []

        setRegisteredTotal(Number(payload.total || 0))

        const srvPage = Number(payload.currentPage ?? page)
        const srvSize = Number(payload.pageSize ?? limit)
        const totalPages =
          Number(payload.totalPages) ||
          (srvSize && Number.isFinite(srvSize)
            ? Math.max(1, Math.ceil(Number(payload.total || 0) / srvSize) || 1)
            : 1)

        if (Number.isFinite(srvPage) && srvPage > 0 && srvPage !== page) {
          setPage(srvPage)
        }
        if (Number.isFinite(srvSize) && srvSize > 0 && srvSize !== limit) {
          setLimit(srvSize)
        }
        setPageCount(totalPages)

        setUsers(
          list.map(u => ({
            id: u._id,
            name: u.name || '-',
            email: u.email || '-',
            status: u.status || '-',
            registerStatus: isManual
              ? 'Manually Registered'
              : isDumpedProvided
              ? 'Dumped Users Provided'
              : isEffective
              ? 'Effective User'
              : isSuccessfulDumped
              ? 'Successfully Dumped'
              : isIncompleteDumped
              ? 'Incomplete Dumped'
              : isSuccessPasswordReset
              ? 'Reset Password Done'
              : isIncompletePasswordReset
              ? 'Reset Password Not Done'
              : isDuplicateUsers
              ? 'Duplicate User'
              : 'Registered',
            createdAt: u.createdAt || null,
            walletFunds:
              typeof u.walletFunds === 'number' ? u.walletFunds : null
          }))
        )
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            (viewMode === 'manual'
              ? 'Failed to fetch manually registered users'
              : viewMode === 'dumpedProvided'
              ? 'Failed to fetch dumped users provided'
              : viewMode === 'effective'
              ? 'Failed to fetch effective users'
              : viewMode === 'successfulDumped'
              ? 'Failed to fetch successfully dumped users'
              : viewMode === 'incompleteDumped'
              ? 'Failed to fetch incomplete dumped users'
              : viewMode === 'successPasswordReset'
              ? 'Failed to fetch reset password done users'
              : viewMode === 'incompletePasswordReset'
              ? 'Failed to fetch reset password not done users'
              : viewMode === 'duplicateUsers'
              ? 'Failed to fetch duplicate users'
              : 'Failed to fetch registered users')
        )
      } finally {
        setLoading(false)
      }
    }

    fetchRegistered()
  }, [viewMode, dateRange, page, limit, search])

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter(user => {
      if (!term && !dateRange.start && !dateRange.end) return true

      if (term) {
        const haystack = `${user.id} ${user.name} ${user.email}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }

      if (dateRange.start || dateRange.end) {
        const last = user.createdAt ? new Date(user.createdAt) : null
        const lastTs = last ? last.getTime() : NaN
        if (Number.isNaN(lastTs)) return false

        if (dateRange.start) {
          const startTs = new Date(dateRange.start).setHours(0, 0, 0, 0)
          if (lastTs < startTs) return false
        }
        if (dateRange.end) {
          const endTs = new Date(dateRange.end).setHours(23, 59, 59, 999)
          if (lastTs > endTs) return false
        }
      }

      return true
    })
  }, [search, dateRange, users])

  const stats = useMemo(() => {
    const total =
      meta.totalRegisteredUsers ||
      meta.tempNotDumpedUsers ||
      filteredUsers.length
    const manuallyRegistered = meta.totalManuallyRegisteredUsers || 0
    return { total, manuallyRegistered }
  }, [filteredUsers, meta])

  const handleDownloadRegisteredExcel = async () => {
    if (
      viewMode !== 'registered' &&
      viewMode !== 'manual' &&
      viewMode !== 'dumpedProvided' &&
      viewMode !== 'effective' &&
      viewMode !== 'successfulDumped' &&
      viewMode !== 'incompleteDumped' &&
      viewMode !== 'successPasswordReset' &&
      viewMode !== 'incompletePasswordReset' &&
      viewMode !== 'duplicateUsers'
    )
      return

    if (!dateRange.start || !dateRange.end) {
      setError('Please select start and end date before downloading')
      return
    }
    try {
      setDownloading(true)
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        search: search ? search.trim() : undefined
      }
      const isManual = viewMode === 'manual'
      const isDumpedProvided = viewMode === 'dumpedProvided'
      const isEffective = viewMode === 'effective'
      const isSuccessfulDumped = viewMode === 'successfulDumped'
      const isIncompleteDumped = viewMode === 'incompleteDumped'
      const isSuccessPasswordReset = viewMode === 'successPasswordReset'
      const isIncompletePasswordReset = viewMode === 'incompletePasswordReset'
      const isDuplicateUsers = viewMode === 'duplicateUsers'
      const blob = await (isManual
        ? downloadManuallyRegisteredExcel(params)
        : isDumpedProvided
        ? downloadDumpedUserProvided(params)
        : isEffective
        ? downloadEffectiveUsers(params)
        : isSuccessfulDumped
        ? downloadSuccessfulDumped(params)
        : isIncompleteDumped
        ? downloadIncompleteDumped(params)
        : isSuccessPasswordReset
        ? downloadSuccessPasswordReset(params)
        : isIncompletePasswordReset
        ? downloadIncompletePasswordReset(params)
        : isDuplicateUsers
        ? downloadDuplicateUsers(params)
        : downloadRegisteredExcel(params))
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const start = dateRange.start
      const end = dateRange.end
      a.href = url
      a.download = isManual
        ? `manually-registered-users-${start}-to-${end}.xlsx`
        : isDumpedProvided
        ? `dumped-users-provided-${start}-to-${end}.xlsx`
        : isEffective
        ? `effective-users-${start}-to-${end}.xlsx`
        : isSuccessfulDumped
        ? `successful-dumped-users-${start}-to-${end}.xlsx`
        : isIncompleteDumped
        ? `incomplete-dumped-users-${start}-to-${end}.xlsx`
        : isSuccessPasswordReset
        ? `success-password-reset-${start}-to-${end}.xlsx`
        : isIncompletePasswordReset
        ? `incomplete-password-reset-${start}-to-${end}.xlsx`
        : isDuplicateUsers
        ? `duplicate-users-${start}-to-${end}.xlsx`
        : `registered-users-${start}-to-${end}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to download registered users Excel'
      )
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 mb-1'>
            User Analysis
          </h1>
          <nav className='text-sm text-gray-500'>
            <span>Dashboard</span> /{' '}
            <span className='text-gray-900 font-medium'>User Analysis</span>
          </nav>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-2'>
            <div className='flex flex-col'>
              <label className='text-[10px] text-gray-500 font-medium ml-1'>
                Start Date
              </label>
              <input
                type='date'
                value={dateRange.start}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, start: e.target.value }))
                }
                className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500'
              />
            </div>
            <span className='text-gray-400 mt-4'>-</span>
            <div className='flex flex-col'>
              <label className='text-[10px] text-gray-500 font-medium ml-1'>
                End Date
              </label>
              <input
                type='date'
                value={dateRange.end}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, end: e.target.value }))
                }
                className='h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500'
              />
            </div>
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className='mt-4 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
              title='Clear Date Filter'
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
        <button
          type='button'
          onClick={() => {
            setViewMode('registered')
            setPage(1)
          }}
          className='bg-gradient-to-r from-[#E8F8F0] to-[#B8EDD0] rounded-xl border border-gray-200 p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow'
        >
          <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
            Total Registered Users
          </span>
          <div className='text-2xl font-semibold text-gray-900'>
            {stats.total}
          </div>
          <p className='text-[11px] text-gray-500'>
            Total manually registered users + dumped users provided
          </p>
        </button>
        <button
          type='button'
          onClick={() => {
            setViewMode('manual')
            setPage(1)
          }}
          className='bg-gradient-to-r from-[#FFF4E8] to-[#FFE4C5] rounded-xl border border-gray-200 p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow'
        >
          <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
            Manually Registered Users
          </span>
          <div className='text-2xl font-semibold text-orange-600'>
            {stats.manuallyRegistered}
          </div>
          <p className='text-[11px] text-gray-500'>
            Users who completed manual registration.
          </p>
        </button>
        <button
          type='button'
          onClick={() => {
            setViewMode('dumpedProvided')
            setPage(1)
          }}
          className='bg-gradient-to-r from-[#FFE8E8] to-[#FFC5C5] rounded-xl border border-gray-200 p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow'
        >
          <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
            Dumped Users Provided
          </span>
          <div className='text-2xl font-semibold text-red-600'>
            {meta.totalDumpedUsers}
          </div>
          <p className='text-[11px] text-gray-500'>
            Users provided to be dumped in the database.
          </p>
        </button>

        <button
          type='button'
          onClick={() => {
            setViewMode('effective')
            setPage(1)
          }}
          className='bg-gradient-to-r from-[#E8FFF4] to-[#C5F5DD] rounded-xl border border-gray-200 p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow'
        >
          <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
            Total Effective Users
          </span>
          <div className='text-2xl font-semibold text-emerald-600'>
            {(stats.manuallyRegistered || 0) +
              (meta.successfullyRegisteredUserWithResetPasswordToken || 0)}
          </div>
          <p className='text-[11px] text-gray-500'>
            Manually registered and dumped users who reset their password in the
            selected period.
          </p>
        </button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6'>
        <button
          type='button'
          onClick={() => {
            setViewMode('successfulDumped')
            setPage(1)
          }}
          className='bg-gradient-to-r from-[#FFF4E8] to-[#FFE4C5] rounded-xl border border-gray-200 p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow'
        >
          <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
            Successfully Dumped Users
          </span>
          <div className='text-2xl font-semibold text-orange-600'>
            {meta.tempDumpedUsersCount}
          </div>
          <p className='text-[11px] text-gray-500'>
            Total successfully dumped users who had no duplication nor
            incomplete data in the selected period.
          </p>
        </button>
        <button
          type='button'
          onClick={() => {
            setViewMode('incompleteDumped')
            setPage(1)
          }}
          className='bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF] rounded-xl border border-gray-200 p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow'
        >
          <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
            Dumped Users - Incomplete data
          </span>
          <div className='text-2xl font-semibold text-indigo-600'>
            {meta.tempNotDumpedUsers}
          </div>
          <p className='text-[11px] text-gray-500'>
            Dumbed users that do not have an email address or have invalid
            email.
          </p>
        </button>
        <button
          type='button'
          onClick={() => {
            setViewMode('successPasswordReset')
            setPage(1)
          }}
          className='bg-gradient-to-r from-[#E8F2FF] to-[#C5DCFF] rounded-xl border border-gray-200 p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow'
        >
          <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
            Reset Password Done
          </span>
          <div className='text-2xl font-semibold text-blue-600'>
            {meta.successfullyRegisteredUserWithResetPasswordToken}
          </div>
          <p className='text-[11px] text-gray-500'>
            Total dumped users who reset their password in the selected period.
          </p>
        </button>
        <button
          type='button'
          onClick={() => {
            setViewMode('incompletePasswordReset')
            setPage(1)
          }}
          className='bg-gradient-to-r from-[#FFF4E8] to-[#FFE4C5] rounded-xl border border-gray-200 p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow'
        >
          <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
            Reset password is not done
          </span>
          <div className='text-2xl font-semibold text-orange-600'>
            {meta.tempDumpedUsersCount -
              meta.successfullyRegisteredUserWithResetPasswordToken}
          </div>
          <p className='text-[11px] text-gray-500'>
            Total dumped users who did not reset their password in the selected
            period.
          </p>
        </button>

        <button
          type='button'
          onClick={() => {
            setViewMode('duplicateUsers')
            setPage(1)
          }}
          className='bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF] rounded-xl border border-gray-200 p-4 flex flex-col gap-3 text-left hover:shadow-md transition-shadow'
        >
          <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
            Duplicate Users
          </span>
          <div className='text-2xl font-semibold text-indigo-600'>
            {meta.duplicateUsersCount}
          </div>
          <p className='text-[11px] text-gray-500'>
            Users with the same email address.
          </p>
        </button>
      </div>

      <div className='bg-gray-200 p-5 rounded-xl'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0'>
          <div className='px-4 py-3 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div>
              <h2 className='text-sm font-semibold text-gray-900'>
                {viewMode === 'registered'
                  ? 'Registered Users'
                  : viewMode === 'manual'
                  ? 'Manually Registered Users'
                  : viewMode === 'dumpedProvided'
                  ? 'Dumped Users Provided'
                  : viewMode === 'effective'
                  ? 'Effective Users'
                  : viewMode === 'successfulDumped'
                  ? 'Successfully Dumped Users'
                  : viewMode === 'incompleteDumped'
                  ? 'Incomplete Dumped Users'
                  : viewMode === 'successPasswordReset'
                  ? 'Reset Password Done Users'
                  : viewMode === 'incompletePasswordReset'
                  ? 'Reset Password Not Done Users'
                  : viewMode === 'duplicateUsers'
                  ? 'Duplicate Users'
                  : 'User Analysis Table'}
              </h2>
              <p className='text-xs text-gray-500'>
                {viewMode === 'registered'
                  ? `Showing ${filteredUsers.length} registered users on page ${page} of ${pageCount}. Total ${registeredTotal} registered users in range.`
                  : viewMode === 'manual'
                  ? `Showing ${filteredUsers.length} manually registered users on page ${page} of ${pageCount}. Total ${registeredTotal} manually registered users in range.`
                  : viewMode === 'dumpedProvided'
                  ? `Showing ${filteredUsers.length} dumped users provided on page ${page} of ${pageCount}. Total ${registeredTotal} dumped users provided in range.`
                  : viewMode === 'effective'
                  ? `Showing ${filteredUsers.length} effective users on page ${page} of ${pageCount}. Total ${registeredTotal} effective users in range.`
                  : viewMode === 'successfulDumped'
                  ? `Showing ${filteredUsers.length} successfully dumped users on page ${page} of ${pageCount}. Total ${registeredTotal} successfully dumped users in range.`
                  : viewMode === 'incompleteDumped'
                  ? `Showing ${filteredUsers.length} incomplete dumped users on page ${page} of ${pageCount}. Total ${registeredTotal} incomplete dumped users in range.`
                  : viewMode === 'successPasswordReset'
                  ? `Showing ${filteredUsers.length} reset password done users on page ${page} of ${pageCount}. Total ${registeredTotal} reset password done users in range.`
                  : viewMode === 'incompletePasswordReset'
                  ? `Showing ${filteredUsers.length} reset password not done users on page ${page} of ${pageCount}. Total ${registeredTotal} reset password not done users in range.`
                  : viewMode === 'duplicateUsers'
                  ? `Showing ${filteredUsers.length} duplicate users on page ${page} of ${pageCount}. Total ${registeredTotal} duplicate users in range.`
                  : `Showing ${filteredUsers.length} users on page ${page} of ${pageCount}. Total ${meta.totalRegisteredUsers} users in range.`}
              </p>
            </div>
            <div className='flex items-center gap-2 w-full md:w-auto'>
              {(viewMode === 'registered' ||
                viewMode === 'manual' ||
                viewMode === 'dumpedProvided' ||
                viewMode === 'effective' ||
                viewMode === 'successfulDumped' ||
                viewMode === 'incompleteDumped' ||
                viewMode === 'successPasswordReset' ||
                viewMode === 'incompletePasswordReset' ||
                viewMode === 'duplicateUsers') && (
                <button
                  type='button'
                  onClick={handleDownloadRegisteredExcel}
                  disabled={downloading}
                  className='h-9 px-4 rounded-lg bg-[#FF4400] text-xs font-medium text-white hover:bg-[#e63d00] disabled:opacity-60'
                >
                  {downloading ? 'Downloading…' : 'Download Excel'}
                </button>
              )}
              <div className='w-full md:w-64'>
                <div className='relative'>
                  <span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400'>
                    <Search className='w-4 h-4' />
                  </span>
                  <input
                    type='text'
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder='Search by name, email, ID'
                    className='block w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF4400]'
                  />
                </div>
              </div>
            </div>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 text-sm'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500'>
                    User ID
                  </th>
                  <th className='px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500'>
                    Name
                  </th>
                  <th className='px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500'>
                    Email
                  </th>
                  <th className='px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500'>
                    Register Status
                  </th>
                  <th className='px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500'>
                    Status
                  </th>
                  <th className='px-4 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-gray-500'>
                    Last Active
                  </th>
                  <th className='px-4 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-gray-500'>
                    Wallet Funds
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 bg-white'>
                {filteredUsers.map(user => (
                  <tr key={user.id} className='hover:bg-gray-50'>
                    <td className='px-4 py-2 whitespace-nowrap text-xs text-gray-500'>
                      {user.id}
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-900'>
                      {user.name}
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap text-xs text-gray-500'>
                      {user.email}
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap text-xs text-gray-500'>
                      {user.registerStatus}
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap text-xs'>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          user.status === 'Active'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap text-xs text-gray-500'>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleString()
                        : '-'}
                    </td>
                    <td className='px-4 py-2 whitespace-nowrap text-xs text-gray-900 text-right'>
                      {user.walletFunds !== null ? user.walletFunds : '-'}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className='px-4 py-6 text-center text-xs text-gray-500'
                    >
                      No users found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className='px-4 py-3 border-t border-gray-200 flex items-center justify-between'>
            <p className='text-xs text-gray-500'>
              Page {page} of {pageCount}
            </p>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className='h-8 px-3 border border-gray-300 rounded-lg bg-gray-100 text-xs text-gray-700 font-medium hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400'
              >
                Prev
              </button>
              <button
                type='button'
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount || loading}
                className='h-8 px-3 border border-gray-300 rounded-lg bg-gray-100 text-xs text-gray-700 font-medium hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400'
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
