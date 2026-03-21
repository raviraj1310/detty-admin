'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  getUsers,
  changeUserStatus,
  getUserWithProfile,
  downloadUserdata
} from '@/services/users/user.service'
import { dashboardUserActiveInactiveCounts } from '@/services/auth/login.service'
import Toast from '@/components/ui/Toast'
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import {
  TbCaretUpDownFilled,
  TbTrendingUp,
  TbTrendingDown
} from 'react-icons/tb'
import { FaUserPlus, FaChartColumn } from 'react-icons/fa6'

const mapUser = d => {
  const created = d?.createdAt || d?.created_on || d?.created || ''
  const createdOn = created
    ? new Date(created).toLocaleString(undefined, {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-'
  const createdTs = created ? new Date(created).getTime() : 0
  const rawStatus = d?.status
  const status =
    typeof rawStatus === 'string'
      ? /^active$/i.test(String(rawStatus).trim())
        ? 'Active'
        : 'Inactive'
      : rawStatus
      ? 'Active'
      : 'Inactive'
  // Check walletFunds first (from API), then fall back to walletPoints
  const walletValue =
    typeof d?.walletFunds !== 'undefined'
      ? d.walletFunds
      : typeof d?.walletPoints !== 'undefined'
      ? d.walletPoints
      : 0
  const walletPointsNum =
    typeof walletValue === 'number'
      ? walletValue
      : parseFloat(String(walletValue).replace(/[^0-9.-]/g, '')) || 0
  // Format as currency string
  const wpStr =
    typeof walletValue === 'number'
      ? `₦${walletPointsNum.toFixed(2)}`
      : typeof walletValue === 'string'
      ? walletValue
      : '₦0.00'
  return {
    id: d?._id || d?.id || Math.random().toString(36).slice(2),
    rawId: d?._id || d?.id || '',
    name: d?.name || d?.fullName || '-',
    email: d?.email || '-',
    phone: d?.phone || d?.phoneNumber || '-',
    walletPoints: wpStr,
    walletPointsNum,
    createdOn,
    createdTs,
    status,
    avatar: d?.avatar || '/images/backend/side_menu/side_menu (1).svg',
    bookingCounts: Number(
      d?.totalBookingCount ??
        d?.bookingCounts ??
        d?.bookingValues?.totalBookings ??
        0
    ),
    bookingTotalAmount: Number(
      d?.totalSpent ??
        d?.bookingTotalAmount ??
        d?.bookingValues?.totalAmount ??
        0
    )
  }
}

const truncateText = (str, max = 40) => {
  const s = String(str || '')
  if (s.length <= max) return s
  const idx = s.lastIndexOf(' ', max)
  const cut = idx > 0 ? s.slice(0, idx) : s.slice(0, max)
  return `${cut}...`
}

const toText = v => {
  if (v === null || typeof v === 'undefined') return '-'
  if (Array.isArray(v)) {
    return (
      v
        .map(it =>
          typeof it === 'object'
            ? it?.name || it?.title || it?.label || String(it?._id || '')
            : String(it)
        )
        .filter(Boolean)
        .join(', ') || '-'
    )
  }
  if (typeof v === 'object') {
    const cand = v?.name || v?.title || v?.label || v?.code || v?.value
    if (cand) return String(cand)
    if (v?._id) return String(v._id)
    try {
      const s = JSON.stringify(v)
      return s || '-'
    } catch {
      return '-'
    }
  }
  const s = String(v)
  return s.length ? s : '-'
}

const TableHeaderCell = ({
  children,
  align = 'left',
  onClick,
  active = false,
  direction = 'asc'
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium tracking-[0.04em] whitespace-nowrap ${
      active ? 'text-[#2D3658]' : 'text-[#8A92AC]'
    } ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } hover:text-[#2D3658]`}
  >
    {children}
    {active ? (
      direction === 'asc' ? (
        <ChevronUp size={14} className='text-[#2D3658] flex-shrink-0' />
      ) : (
        <ChevronDown size={14} className='text-[#2D3658] flex-shrink-0' />
      )
    ) : (
      <TbCaretUpDownFilled size={14} className='text-[#CBCFE2] flex-shrink-0' />
    )}
  </button>
)

function ActionDropdown ({
  userId,
  onChangeStatus,
  onViewDetail,
  onViewTicketsBooked,
  onViewWalletHistory,
  disabled,
  currentStatus
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 })
  const buttonRef = useRef(null)

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
    // {
    //     label: 'View Itinerary',
    //     icon: (
    //         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    //         </svg>
    //     )
    // },
    {
      label: 'View Tickets Booked',
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
            d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
          />
        </svg>
      )
    },
    {
      label: 'View Wallet history',
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
            d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z'
          />
        </svg>
      )
    },

    {
      label: 'Active',
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
            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      )
    },
    {
      label: 'Inactive',
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
            d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      )
    }
  ]

  const handleButtonClick = e => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const dropdownHeight = 250

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
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={Boolean(disabled)}
        className='p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
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
            {actions
              .filter(action => {
                if (
                  action.label === 'Active' &&
                  String(currentStatus) === 'Active'
                )
                  return false
                if (
                  action.label === 'Inactive' &&
                  String(currentStatus) === 'Inactive'
                )
                  return false
                return true
              })
              .map((action, index) => (
                <button
                  key={index}
                  className='flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
                  onClick={() => {
                    if (
                      action.label === 'Active' &&
                      typeof onChangeStatus === 'function'
                    ) {
                      onChangeStatus(userId, 'Active')
                    } else if (
                      action.label === 'Inactive' &&
                      typeof onChangeStatus === 'function'
                    ) {
                      onChangeStatus(userId, 'Inactive')
                    } else if (
                      action.label === 'View Detail' &&
                      typeof onViewDetail === 'function'
                    ) {
                      onViewDetail(userId)
                    } else if (
                      action.label === 'View Tickets Booked' &&
                      typeof onViewTicketsBooked === 'function'
                    ) {
                      onViewTicketsBooked(userId)
                    } else if (
                      action.label === 'View Wallet history' &&
                      typeof onViewWalletHistory === 'function'
                    ) {
                      onViewWalletHistory(userId)
                    } else {
                      console.log(`${action.label} for user ${userId}`)
                    }
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

function UserDetailModal ({ open, userId, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const fetchDetail = async () => {
      if (!open || !userId) return
      setLoading(true)
      setError('')
      try {
        const res = await getUserWithProfile(userId)
        const d = res?.data || res
        const payload = d?.data || d || {}
        const userObj = payload?.user || payload
        setData(userObj)
        setProfile(payload?.profile || userObj?.profile || null)
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Failed to load user details'
        setError(msg)
        setData(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [open, userId])

  const name = String(data?.name || data?.fullName || '-')
  const email = String(data?.email || '-')
  const phone = String(data?.phone || data?.phoneNumber || '-')
  const status =
    typeof data?.status === 'string'
      ? /^active$/i.test(String(data?.status).trim())
        ? 'Active'
        : 'Inactive'
      : data?.status
      ? 'Active'
      : 'Inactive'
  const created = data?.createdAt || data?.created_on || data?.created || ''
  const createdOn = created
    ? new Date(created).toLocaleString(undefined, {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-'
  const avatar =
    data?.profileImage ||
    data?.avatar ||
    '/images/backend/side_menu/side_menu (1).svg'
  const wallet =
    typeof data?.walletFunds !== 'undefined'
      ? data.walletFunds
      : typeof data?.walletPoints !== 'undefined'
      ? data.walletPoints
      : '₦0.00'

  const profileCreated = profile?.createdAt || ''
  const profileUpdated = profile?.updatedAt || ''
  const profileCreatedOn = profileCreated
    ? new Date(profileCreated).toLocaleString()
    : '-'
  const profileUpdatedOn = profileUpdated
    ? new Date(profileUpdated).toLocaleString()
    : '-'

  if (!open) return null

  return (
    <div className='fixed inset-0 z-[9998]'>
      <div className='absolute inset-0 bg-black/40' onClick={onClose} />
      <div className='absolute inset-0 flex items-center justify-center p-4'>
        <div className='w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-200'>
          <div className='flex items-center justify-between px-5 py-4 border-b border-gray-200'>
            <div className='text-lg font-semibold text-gray-900'>
              User Details
            </div>
            <button
              onClick={onClose}
              className='rounded-full bg-[#F8FAF9] p-2 text-[#2D3658] hover:bg-[#EEF2F7]'
            >
              <svg className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </div>
          <div className='px-5 py-4'>
            {loading && (
              <div className='text-sm text-[#5E6582]'>Loading...</div>
            )}
            {error && !loading && (
              <div className='text-sm text-red-600'>{error}</div>
            )}
            {!loading && !error && (
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-12 h-12 rounded-full overflow-hidden bg-gray-200'>
                    <Image
                      src={avatar}
                      alt='Profile'
                      width={48}
                      height={48}
                      className='w-12 h-12 object-cover'
                    />
                  </div>
                  <div>
                    <div className='text-base font-semibold text-gray-900'>
                      {name}
                    </div>
                    <div className='text-xs text-gray-600'>{email}</div>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <div className='text-xs text-gray-500'>Phone</div>
                    <div className='text-sm text-gray-900'>{phone}</div>
                  </div>
                  <div className='space-y-1'>
                    <div className='text-xs text-gray-500'>Created On</div>
                    <div className='text-sm text-gray-900'>{createdOn}</div>
                  </div>
                  <div className='space-y-1'>
                    <div className='text-xs text-gray-500'>Status</div>
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {status}
                    </div>
                  </div>
                  <div className='space-y-1'>
                    <div className='text-xs text-gray-500'>Wallet</div>
                    <div className='text-sm text-gray-900'>
                      {String(wallet)}
                    </div>
                  </div>
                </div>
                {profile && (
                  <div className='border-t border-gray-200 pt-4 space-y-3'>
                    <div className='text-sm font-semibold text-gray-900'>
                      Profile
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>
                          Home Address
                        </div>
                        <div className='text-sm text-gray-900'>
                          {toText(profile?.homeAddress)}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>Postal Code</div>
                        <div className='text-sm text-gray-900'>
                          {toText(profile?.postalCode)}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>City</div>
                        <div className='text-sm text-gray-900'>
                          {toText(profile?.countryOfCitizenship)}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>
                          Country of Residence
                        </div>
                        <div className='text-sm text-gray-900'>
                          {toText(profile?.countryOfResidence)}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>State</div>
                        <div className='text-sm text-gray-900'>
                          {toText(profile?.state)}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>
                          Email Notification
                        </div>
                        <div className='text-sm text-gray-900'>
                          {profile?.emailNotification ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>
                          Push Notification
                        </div>
                        <div className='text-sm text-gray-900'>
                          {profile?.pushNotification ? 'Yes' : 'No'}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>
                          Two-Factor Auth
                        </div>
                        <div className='text-sm text-gray-900'>
                          {profile?.twoFactorAuth ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>
                          Account Recovery
                        </div>
                        <div className='text-sm text-gray-900'>
                          {profile?.accountRecovery ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>
                          Profile Created
                        </div>
                        <div className='text-sm text-gray-900'>
                          {profileCreatedOn}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-xs text-gray-500'>
                          Profile Updated
                        </div>
                        <div className='text-sm text-gray-900'>
                          {profileUpdatedOn}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className='px-5 py-3 border-t border-gray-200 flex justify-end'>
            <button
              onClick={onClose}
              className='px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UsersForm ({
  visibleStats = null,
  fetchUsersFn = null
}) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sort, setSort] = useState({ key: 'createdTs', dir: 'desc' })
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [updatingId, setUpdatingId] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUserId, setDetailUserId] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    yesterdayCount: 0,
    yesterdayDateStr: '',
    avgGrowthCount: 0,
    isCountIncreasing: false,
    avgGrowthPercent: 0,
    isPctIncreasing: false,
    registered: 0,
    unregistered: 0
  })
  const [dateRange, setDateRange] = useState({
    start: '2025-11-01',
    end: new Date().toISOString().split('T')[0]
  })
  const [exporting, setExporting] = useState(false)
  const [activeUsersDays, setActiveUsersDays] = useState(10)

  const fetchStats = async () => {
    try {
      const params = {}
      if (dateRange.start) params.startDate = dateRange.start
      if (dateRange.end) params.endDate = dateRange.end
      params.dayCount = activeUsersDays

      const dashboardRes = await dashboardUserActiveInactiveCounts(params)
      const dash = dashboardRes?.data?.data || dashboardRes?.data || {}

      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayDateStr = yesterday.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })

      const apiAvgCount = Number(dash.avgDailyGrowthCount || 0)
      const rawPct = String(dash.avgDailyGrowthPercent ?? '0')
      const pctStr = rawPct.includes('%') ? rawPct : `${rawPct}%`
      const pctNum = parseFloat(String(rawPct).replace('%', ''))

      setGlobalStats({
        total: Number(dash.totalUserCount || 0),
        active: Number(dash.activeUsers || dash.activeUserCount || 0),
        inactive: Number(dash.inactiveUsers || dash.inactiveUserCount || 0),
        yesterdayCount: Number(dash.newRegistrationYesterday || 0),
        yesterdayDateStr,
        avgGrowthCount: apiAvgCount,
        isCountIncreasing: apiAvgCount >= 0,
        avgGrowthPercent: pctStr,
        isPctIncreasing: !Number.isNaN(pctNum) ? pctNum >= 0 : false,
        registered: Number(dash.registeredUser || 0),
        unregistered: Number(
          dash.unregisteredUsers || dash.unregisteredUser || 0
        )
      })
    } catch (e) {
      console.error('Failed to fetch stats', e)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [dateRange.start, dateRange.end, activeUsersDays])

  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(String(searchTerm || '').trim())
    }, 300)
    return () => clearTimeout(h)
  }, [searchTerm])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, dateRange.start, dateRange.end])

  useEffect(() => {
    setPage(1)
  }, [sort.key, sort.dir])

  useEffect(() => {
    const abortController = new AbortController()
    const signal = abortController.signal

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const sortByMap = {
          createdTs: 'createdAt',
          name: 'name',
          email: 'email',
          phone: 'phoneNumber',
          walletPointsNum: 'walletPoints',
          bookingCounts: 'totalBookingCount',
          bookingTotalAmount: 'totalSpent'
        }
        const allowedSortFields = new Set([
          'name',
          'email',
          'phoneNumber',
          'walletPoints',
          'totalBookingCount',
          'totalSpent',
          'createdAt'
        ])

        const params = { page, limit }
        if (debouncedSearch) params.search = debouncedSearch
        if (dateRange.start) params.startDate = dateRange.start
        if (dateRange.end) params.endDate = dateRange.end
        params.dayCount = activeUsersDays
        const sortBy = sortByMap[sort.key]
        if (sortBy && allowedSortFields.has(sortBy)) {
          params.sortBy = sortBy
          params.sortOrder = sort.dir === 'asc' ? 'asc' : 'desc'
        }

        const res = await getUsers(params, signal)
        const payload = res?.data || res || {}

        const list = Array.isArray(payload?.users)
          ? payload.users
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        const listMapped = list.map(mapUser)
        const uniqueListMap = new Map()
        listMapped.forEach(u => uniqueListMap.set(u.id, u))
        setUsers(Array.from(uniqueListMap.values()))

        const srvTotal = Number(payload?.total ?? 0)
        const srvPages = Number(payload?.pages ?? 1)
        const srvPage = Number(payload?.page ?? page)
        const srvLimit = Number(payload?.limit ?? limit)

        if (Number.isFinite(srvTotal)) setTotalCount(srvTotal)
        if (Number.isFinite(srvPages)) setPageCount(Math.max(1, srvPages))
        // Only update page/limit if they differ from current state to avoid loops
        if (Number.isFinite(srvPage) && srvPage !== page)
          setPage(Math.max(1, srvPage))
        if (Number.isFinite(srvLimit) && srvLimit !== limit)
          setLimit(Math.max(1, srvLimit))
      } catch (e) {
        if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
          setError('Failed to load users')
          setUsers([])
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }
    load()

    return () => abortController.abort()
  }, [
    page,
    limit,
    debouncedSearch,
    dateRange.start,
    dateRange.end,
    sort.key,
    sort.dir,
    activeUsersDays
  ])

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setUpdatingId(String(userId || ''))
      await changeUserStatus(userId, newStatus)
      setUsers(prev =>
        prev.map(u => (u.rawId === userId ? { ...u, status: newStatus } : u))
      )
      setToast({
        open: true,
        title: 'Status updated',
        description: `User marked as ${newStatus}`,
        variant: 'success'
      })
      fetchStats()
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || 'Failed to update status'
      setToast({
        open: true,
        title: 'Error',
        description: msg,
        variant: 'error'
      })
    } finally {
      setUpdatingId('')
    }
  }

  const filteredUsers = useMemo(() => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
    const termClean = term.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
    const termDigits = term.replace(/[^0-9]/g, '')
    let base = users
    if (term) {
      base = users.filter(u => {
        const name = String(u.name || '').toLowerCase()
        const email = String(u.email || '').toLowerCase()
        const phone = String(u.phone || '')
        const phoneLc = phone.toLowerCase()
        const phoneDigits = phone.replace(/[^0-9]/g, '')
        const walletStr = String(u.walletPoints || '').toLowerCase()
        const walletDigits = String(u.walletPointsNum ?? '').replace(
          /[^0-9]/g,
          ''
        )
        const created = String(u.createdOn || '').toLowerCase()
        const statusStr = String(u.status || '').toLowerCase()
        const idStr = String(u.id || '').toLowerCase()
        const rawIdStr = String(u.rawId || '').toLowerCase()

        // Original haystack with spaces normalized
        const haystack =
          `${name} ${email} ${phoneLc} ${walletStr} ${created} ${statusStr} ${idStr} ${rawIdStr}`.replace(
            /\s+/g,
            ' '
          )

        // Cleaned haystack (punctuation removed) for fuzzy match
        // This helps with dates like "Mon, January 12" matching "Mon January 12"
        // and handles invisible characters
        const haystackClean = haystack.replace(/[^a-z0-9\s]/g, '')

        const matchesText = haystack.includes(term)
        const matchesClean = termClean && haystackClean.includes(termClean)
        const matchesDigits =
          (termDigits && phoneDigits.includes(termDigits)) ||
          (termDigits && walletDigits.includes(termDigits))
        return matchesText || matchesClean || matchesDigits
      })
    }
    // Date range filtering (client-side)
    if (dateRange.start) {
      const startTs = new Date(dateRange.start).setHours(0, 0, 0, 0)
      base = base.filter(u => u.createdTs >= startTs)
    }
    if (dateRange.end) {
      const endTs = new Date(dateRange.end).setHours(23, 59, 59, 999)
      base = base.filter(u => u.createdTs <= endTs)
    }

    return base
  }, [users, searchTerm, dateRange])

  const sortedUsers = useMemo(() => {
    return filteredUsers
  }, [filteredUsers])

  const paginatedUsers = useMemo(() => {
    return sortedUsers
  }, [sortedUsers])

  const toggleSort = key => {
    setSort(prev => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  const handleDownloadExcel = async () => {
    if (exporting) return
    try {
      setToast({
        open: true,
        title: 'Exporting users',
        description: 'This may take a moment',
        variant: 'info'
      })

      setExporting(true)
      const CHUNK_SIZE = 50000
      const sortByMap = {
        createdTs: 'createdAt',
        name: 'name',
        email: 'email',
        phone: 'phoneNumber',
        walletPointsNum: 'walletPoints',
        bookingCounts: 'totalBookingCount',
        bookingTotalAmount: 'totalSpent'
      }
      const params = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (dateRange.start) params.startDate = dateRange.start
      if (dateRange.end) params.endDate = dateRange.end
      params.dayCount = activeUsersDays
      if (sort.key && sortByMap[sort.key]) {
        params.sortBy = sortByMap[sort.key]
        params.sortOrder = sort.dir === 'asc' ? 'asc' : 'desc'
      }

      const total = Number(totalCount || 0)
      const totalChunks = Math.max(1, Math.ceil(total / CHUNK_SIZE) || 1)

      for (let chunk = 1; chunk <= totalChunks; chunk++) {
        setToast({
          open: true,
          title: 'Exporting users',
          description: `Downloading file ${chunk} of ${totalChunks}`,
          variant: 'info'
        })

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000) // 10 min
        const blob = await downloadUserdata(
          { ...params, chunk, chunkSize: CHUNK_SIZE },
          controller.signal
        )
        clearTimeout(timeoutId)

        const safeBlob = blob instanceof Blob ? blob : new Blob([blob])
        const url = window.URL.createObjectURL(safeBlob)
        const a = document.createElement('a')
        a.href = url
        const dateStr = new Date().toISOString().slice(0, 10)
        a.download =
          totalChunks > 1
            ? `Users_${dateStr}_file${chunk}_of_${totalChunks}.xlsx`
            : `Users_${dateStr}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }

      setToast({
        open: true,
        title: 'Export complete',
        description: 'Excel downloaded successfully',
        variant: 'success'
      })
    } catch (e) {
      const msg =
        e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED'
          ? 'Export timed out, please try with narrower filters'
          : e?.response?.data?.message || e?.message || 'Export failed'
      setToast({
        open: true,
        title: 'Export failed',
        description: msg,
        variant: 'error'
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className='p-4 h-full flex flex-col bg-white'>
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={toast.variant === 'info' ? 0 : 2500}
        position='top-right'
      />
      <UserDetailModal
        open={detailOpen}
        userId={detailUserId}
        onClose={() => setDetailOpen(false)}
      />

      {/* Header with Date Range */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-xl font-bold text-gray-900 mb-1'>Users</h1>
          <nav className='text-sm text-gray-500'>
            <span>Dashboard</span> /{' '}
            <span className='text-gray-900 font-medium'>Users</span>
          </nav>
        </div>
        <div className='flex items-end gap-2'>
          <button
            onClick={() => router.push('/users/user-analysis')}
            className='h-9 px-4 rounded-lg bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700 whitespace-nowrap'
          >
            Detailed User Analysis
          </button>
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
              type='button'
              onClick={() => setDateRange({ start: '', end: '' })}
              className='mt-4 h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs text-gray-700 hover:bg-gray-50'
              title='Clear Date Filter'
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid grid-cols-1 gap-4 mb-6 ${
          visibleStats?.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
        }`}
      >
        {(!visibleStats || visibleStats.includes('total')) && (
          <div className='bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF] p-4 rounded-lg shadow-md flex justify-between items-center'>
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
                <p className='text-xs text-black opacity-90'>Total Users</p>
                <p className='text-2xl text-black font-bold'>
                  {globalStats.total}
                </p>
              </div>
            </div>
            <div className='flex flex-col gap-1 text-right'>
              <div className='bg-red-100/80 px-2 py-0.5 rounded text-[10px] text-red-600 border border-red-200'>
                Total Unactivated counts: {globalStats.unregistered}
              </div>
              <div className='bg-blue-100/80 px-2 py-0.5 rounded text-[10px] text-blue-600 border border-blue-200'>
                Total Activated counts: {globalStats.registered}
              </div>
            </div>
          </div>
        )}

        {(!visibleStats || visibleStats.includes('active')) && (
          <div
            className='bg-gradient-to-r from-[#E8F8F0] to-[#B8EDD0] p-4 rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity'
            onClick={() =>
              router.push(`/users/active?dayCount=${activeUsersDays}`)
            }
          >
            <div className='flex items-center gap-3'>
              <div className='bg-white bg-opacity-20 p-2 rounded-lg mr-3'>
                <Image
                  src='/images/backend/icons/icons (5).svg'
                  alt='Active Users Icon'
                  width={24}
                  height={24}
                  className='w-6 h-6'
                />
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-black opacity-90'>
                  Active Users (Logged in the last {activeUsersDays} days)
                </p>
                <p className='text-2xl text-black font-bold'>
                  {globalStats.active}
                </p>
              </div>
              <div className='ml-auto'>
                <select
                  value={activeUsersDays}
                  onChange={e =>
                    setActiveUsersDays(Number(e.target.value) || 10)
                  }
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  className='h-8 rounded-md border border-black/10 bg-white/70 px-2 text-xs text-black focus:outline-none'
                >
                  {Array.from({ length: 5 }, (_, i) => (i + 2) * 5).map(d => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {(!visibleStats || visibleStats.includes('inactive')) && (
          <div
            className='bg-gradient-to-r from-[#FFE8E8] to-[#FFC5C5] p-4 rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity'
            onClick={() => router.push('/users/inactive')}
          >
            <div className='flex items-center'>
              <div className='bg-white bg-opacity-20 p-2 rounded-lg mr-3'>
                <Image
                  src='/images/backend/icons/icons (6).svg'
                  alt='Inactive Users Icon'
                  width={24}
                  height={24}
                  className='w-6 h-6'
                />
              </div>
              <div>
                <p className='text-xs text-black opacity-90'>
                  Inactive Users (Not logged in since {activeUsersDays} days)
                </p>
                <p className='text-2xl text-black font-bold'>
                  {globalStats.inactive}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Total Bookings Yesterday */}
        {(!visibleStats || visibleStats.includes('new_registrations')) && (
          <div className='bg-gradient-to-r from-[#FFF4E8] to-[#FFE4C5] p-4 rounded-lg shadow-md'>
            <div className='flex items-center'>
              <div className='bg-white p-2 rounded-lg mr-3'>
                <FaUserPlus className='w-6 h-6 text-orange-600' />
              </div>
              <div>
                <p className='text-xs text-black opacity-90'>
                  New Registrations Yesterday{' '}
                  <span className='text-[10px] text-black opacity-75'>
                    ({globalStats.yesterdayDateStr})
                  </span>
                </p>
                <p className='text-2xl text-black font-bold'>
                  {globalStats.yesterdayCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Avg Daily Growth (Count) */}
        {(!visibleStats || visibleStats.includes('growth_count')) && (
          <div className='bg-gradient-to-r from-[#F3E8FF] to-[#E0C5FF] p-4 rounded-lg shadow-md'>
            <div className='flex items-center'>
              <div className='bg-white p-2 rounded-lg mr-3'>
                <TbTrendingUp className='w-6 h-6 text-purple-600' />
              </div>
              <div>
                <p className='text-xs text-black opacity-90'>
                  Avg Daily Growth (Count)
                </p>
                <div className='flex items-end gap-2'>
                  {globalStats.isCountIncreasing ? (
                    <>
                      <p className='text-2xl text-green-600 font-bold'>
                        {globalStats.avgGrowthCount}
                      </p>
                      <span className='text-xs flex items-center mb-1 text-green-600'>
                        <TbTrendingUp className='w-3 h-3 mr-0.5' />
                        Increasing
                      </span>
                    </>
                  ) : (
                    <>
                      <p className='text-2xl text-red-600 font-bold'>
                        {globalStats.avgGrowthCount}
                      </p>
                      <span className='text-xs flex items-center mb-1 text-red-600'>
                        <TbTrendingDown className='w-3 h-3 mr-0.5' />
                        Decreasing
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Avg Daily Growth (%) */}
        {(!visibleStats || visibleStats.includes('growth_percent')) && (
          <div className='bg-gradient-to-r from-[#E0FFF7] to-[#A8F0DC] p-4 rounded-lg shadow-md'>
            <div className='flex items-center'>
              <div className='bg-white p-2 rounded-lg mr-3'>
                <FaChartColumn className='w-6 h-6 text-teal-600' />
              </div>
              <div>
                <p className='text-xs text-black opacity-90'>
                  Avg Daily Growth (%)
                </p>
                <div className='flex items-end gap-2'>
                  {globalStats.isPctIncreasing ? (
                    <>
                      <p className='text-2xl text-green-600 font-bold'>
                        {globalStats.avgGrowthPercent}
                      </p>
                      <span className='text-xs flex items-center mb-1 text-green-600'>
                        <TbTrendingUp className='w-3 h-3 mr-0.5' />
                        Increasing
                      </span>
                    </>
                  ) : (
                    <>
                      <p className='text-2xl text-red-600 font-bold'>
                        {globalStats.avgGrowthPercent}
                      </p>
                      <span className='text-xs flex items-center mb-1 text-red-600'>
                        <TbTrendingDown className='w-3 h-3 mr-0.5' />
                        Decreasing
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className='bg-gray-200 p-5 rounded-xl'>
        {/* User List Section */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0'>
          {/* Header */}
          <div className='p-4 border-b border-gray-200 flex-shrink-0'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-semibold text-gray-900'>User List</h2>
              <div className='flex items-center space-x-3'>
                {/* Search */}
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='h-9 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-gray-900 placeholder-gray-500'
                  />
                  <svg
                    className='w-4 h-4 text-gray-600 absolute left-3 top-2.5'
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

                {/* Download */}
                <button
                  onClick={handleDownloadExcel}
                  disabled={exporting}
                  className='h-9 flex items-center px-3 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white disabled:opacity-50'
                >
                  {exporting ? (
                    <Loader2 className='w-4 h-4 text-gray-600 animate-spin' />
                  ) : (
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
                  )}
                </button>
                <div className='flex items-center gap-2'>
                  <label className='text-xs text-gray-700'>
                    Show
                    <select
                      value={limit}
                      onChange={e => setLimit(Number(e.target.value) || 20)}
                      className='ml-1.5 h-9 px-2 border border-gray-300 rounded-lg text-xs'
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                  <div className='flex items-center gap-1.5'>
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                      className='h-9 px-3 border border-gray-300 rounded-lg bg-gray-100 text-xs text-gray-700 font-medium hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400'
                    >
                      Prev
                    </button>
                    <span className='text-xs text-gray-700'>
                      Page {page} of {pageCount}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                      disabled={page >= pageCount || loading}
                      className='h-9 px-3 border border-gray-300 rounded-lg bg-gray-100 text-xs text-gray-700 font-medium hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400'
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className='flex-1 overflow-auto'>
            <table className='w-full table-fixed'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='w-[12%] px-3 py-2 text-left text-xs font-medium tracking-[0.04em]'>
                    <TableHeaderCell
                      onClick={() => toggleSort('createdTs')}
                      active={sort.key === 'createdTs'}
                      direction={sort.dir}
                    >
                      Created on
                    </TableHeaderCell>
                  </th>
                  <th className='w-[14%] px-3 py-2 text-left text-xs font-medium tracking-[0.04em]'>
                    <TableHeaderCell
                      onClick={() => toggleSort('name')}
                      active={sort.key === 'name'}
                      direction={sort.dir}
                    >
                      User name
                    </TableHeaderCell>
                  </th>
                  <th className='w-[22%] px-3 py-2 text-left text-xs font-medium tracking-[0.04em]'>
                    <TableHeaderCell
                      onClick={() => toggleSort('email')}
                      active={sort.key === 'email'}
                      direction={sort.dir}
                    >
                      Email
                    </TableHeaderCell>
                  </th>
                  <th className='w-[10%] px-3 py-2 text-left text-xs font-medium tracking-[0.04em]'>
                    <TableHeaderCell
                      onClick={() => toggleSort('phone')}
                      active={sort.key === 'phone'}
                      direction={sort.dir}
                    >
                      Phone number
                    </TableHeaderCell>
                  </th>
                  <th className='w-[10%] px-3 py-2 text-left text-xs font-medium tracking-[0.04em]'>
                    <TableHeaderCell
                      onClick={() => toggleSort('walletPointsNum')}
                      active={sort.key === 'walletPointsNum'}
                      direction={sort.dir}
                    >
                      Wallet points
                    </TableHeaderCell>
                  </th>
                  <th className='w-[12%] px-3 py-2 text-left text-xs font-medium text-gray-500 tracking-[0.04em]'>
                    <TableHeaderCell
                      onClick={() => toggleSort('bookingCounts')}
                      active={sort.key === 'bookingCounts'}
                      direction={sort.dir}
                    >
                      Actions
                    </TableHeaderCell>
                  </th>
                  <th className='w-[10%] px-3 py-2 text-left text-xs font-medium tracking-[0.04em]'>
                    <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC] whitespace-nowrap overflow-hidden'>
                      <span className='truncate max-w-full'>Status</span>
                    </div>
                  </th>
                  <th className='w-[10%] px-3 py-2 text-right text-xs font-medium text-gray-500 tracking-[0.04em]'></th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {loading && (
                  <tr>
                    <td
                      className='px-3 py-4 text-sm text-[#5E6582]'
                      colSpan={8}
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {error && !loading && (
                  <tr>
                    <td className='px-3 py-4 text-sm text-red-600' colSpan={8}>
                      {error}
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  paginatedUsers.map(user => (
                    <tr key={user.id} className='hover:bg-gray-50'>
                      <td className='px-3 py-4 text-xs text-gray-500 line-clamp-2'>
                        {user.createdOn}
                      </td>
                      <td className='px-3 py-4'>
                        <div className='flex items-center'>
                          <div className='flex-shrink-0 h-7 w-7'>
                            <div className='h-7 w-7 rounded-full bg-gray-300 flex items-center justify-center'>
                              <svg
                                className='w-3.5 h-3.5 text-gray-600'
                                fill='currentColor'
                                viewBox='0 0 20 20'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                                  clipRule='evenodd'
                                />
                              </svg>
                            </div>
                          </div>
                          <div className='ml-2 min-w-0'>
                            <div
                              className='text-xs font-medium text-gray-900 leading-tight line-clamp-2'
                              title={user.name}
                            >
                              {truncateText(user.name)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-3 py-4 text-xs text-gray-500 truncate'>
                        {user.email}
                      </td>
                      <td className='px-3 py-4 text-xs text-gray-500'>
                        {user.phone}
                      </td>
                      <td className='px-3 py-4'>
                        <span className='text-xs font-medium text-blue-600'>
                          {user.walletPoints}
                        </span>
                      </td>
                      <td className='px-3 py-4 text-xs text-gray-500'>
                        <button
                          onClick={() => {
                            const id = encodeURIComponent(
                              String(user.rawId || user.id)
                            )
                            const qs = new URLSearchParams({
                              userName: String(user.name || '')
                            }).toString()
                            router.push(
                              `/users/view-booked-tickets/${id}?${qs}`
                            )
                          }}
                          className='text-blue-800 font-bold underline hover:text-blue-800 transition-colors text-xs'
                          title='total bookings and total amount spent'
                        >
                          {typeof user.bookingCounts === 'number'
                            ? `${user.bookingCounts} (₦${Number(
                                user.bookingTotalAmount || 0
                              ).toLocaleString()})`
                            : 'View Bookings'}
                        </button>
                      </td>
                      <td className='px-3 py-4'>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className='px-3 py-4 text-right relative'>
                        <ActionDropdown
                          userId={user.rawId}
                          onChangeStatus={handleStatusChange}
                          onViewDetail={uid => {
                            setDetailUserId(String(uid))
                            setDetailOpen(true)
                          }}
                          onViewTicketsBooked={uid => {
                            const id = encodeURIComponent(String(uid))
                            const qs = new URLSearchParams({
                              userName: String(user.name || '')
                            }).toString()
                            router.push(
                              `/users/view-booked-tickets/${id}?${qs}`
                            )
                          }}
                          onViewWalletHistory={uid => {
                            const id = encodeURIComponent(String(uid))
                            const qs = new URLSearchParams({
                              userName: String(user.name || '')
                            }).toString()
                            router.push(`/users/view-wallet-history/${id}`)
                          }}
                          disabled={updatingId === String(user.rawId)}
                          currentStatus={user.status}
                        />
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
