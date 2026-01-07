'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  getUsers,
  changeUserStatus,
  getUserWithProfile
} from '@/services/users/user.service'
import Toast from '@/components/ui/Toast'
import { ChevronUp, ChevronDown, X } from 'lucide-react'
import {
  TbCaretUpDownFilled,
  TbTrendingUp,
  TbTrendingDown
} from 'react-icons/tb'
import { FaUserPlus, FaChartColumn } from 'react-icons/fa6'
import { downloadExcel } from '@/utils/excelExport'

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
    bookingCounts: Number(d?.bookingCounts || 0),
    bookingTotalAmount: Number(d?.bookingValues?.totalAmount || 0)
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
  defaultStatus = '',
  visibleStats = null,
  fetchUsersFn = null
}) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [updatingId, setUpdatingId] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUserId, setDetailUserId] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(defaultStatus)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [allCachedUsers, setAllCachedUsers] = useState(null)
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
    isPctIncreasing: false
  })
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [exporting, setExporting] = useState(false)

  const fetchStats = async () => {
    try {
      // Fetch all users to calculate accurate stats since backend total ignores filters
      const limit = 5000
      const params = { limit }
      if (dateRange.start) params.startDate = dateRange.start
      if (dateRange.end) params.endDate = dateRange.end

      const res = await getUsers(params)
      const payload = res?.data || res || {}

      let allUsers = []
      if (Array.isArray(payload?.users)) {
        allUsers = payload.users
      } else if (Array.isArray(payload?.data)) {
        allUsers = payload.data
      } else if (Array.isArray(res)) {
        allUsers = res
      }

      // Handle pagination if backend caps the limit
      const total = Number(payload?.total ?? 0)
      const pages = Number(payload?.pages ?? 1)

      if (pages > 1 && allUsers.length < total) {
        const requests = []
        for (let p = 2; p <= pages; p++) {
          requests.push(getUsers({ ...params, page: p }))
        }
        const results = await Promise.all(requests)
        results.forEach(r => {
          const pl = r?.data || r || {}
          const u = Array.isArray(pl?.users)
            ? pl.users
            : Array.isArray(pl?.data)
            ? pl.data
            : Array.isArray(r)
            ? r
            : []
          allUsers = allUsers.concat(u)
        })
      }

      // Deduplicate for accurate stats
      const uniqueMap = new Map()
      allUsers.forEach(u => {
        const id = u?._id || u?.id
        if (id) uniqueMap.set(String(id), u)
      })
      const uniqueUsers = Array.from(uniqueMap.values())

      setAllCachedUsers(uniqueUsers.map(mapUser))

      const active = uniqueUsers.filter(u => u.status === 'Active').length
      const inactive = uniqueUsers.filter(u => u.status === 'Inactive').length

      // --- New Metrics ---
      const now = new Date()
      // 1. Total Bookings (Users) Yesterday
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayDateStr = yesterday.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })

      // Check if API provides the stats directly
      if (
        typeof payload?.activeUsers !== 'undefined' &&
        typeof payload?.newRegistrationYesterday !== 'undefined'
      ) {
        const apiAvgCount = Number(payload.avgDailyGrowthCount || 0)
        const apiAvgPctStr = String(payload.avgDailyGrowthPercent || '0')
        const apiAvgPct = parseFloat(apiAvgPctStr.replace('%', ''))

        setGlobalStats({
          total: Number(payload.total || 0),
          active: Number(payload.activeUsers || 0),
          inactive: Number(payload.inactiveUsers || 0),
          yesterdayCount: Number(payload.newRegistrationYesterday || 0),
          yesterdayDateStr,
          avgGrowthCount: apiAvgCount,
          isCountIncreasing: apiAvgCount >= 0,
          avgGrowthPercent: apiAvgPctStr,
          isPctIncreasing: apiAvgPct >= 0
        })
        return
      }

      yesterday.setHours(0, 0, 0, 0)
      const yesterdayEnd = new Date(yesterday)
      yesterdayEnd.setHours(23, 59, 59, 999)

      const yesterdayCount = uniqueUsers.filter(u => {
        const d = new Date(u.createdAt || u.created_on || u.created || 0)
        return d >= yesterday && d <= yesterdayEnd
      }).length

      // 2. Avg Daily Growth Logic
      // Group all users by date (timestamp of midnight)
      const countsByDate = {}
      uniqueUsers.forEach(u => {
        const d = new Date(u.createdAt || u.created_on || u.created || 0)
        d.setHours(0, 0, 0, 0)
        const t = d.getTime()
        if (t > 0) countsByDate[t] = (countsByDate[t] || 0) + 1
      })

      // Analyze last 30 days
      const last30Days = []
      for (let i = 0; i < 30; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        d.setHours(0, 0, 0, 0)
        last30Days.push(d.getTime())
      }
      last30Days.reverse() // Chronological

      // Calculate cumulative base before the window
      const firstWindowDay = last30Days[0]
      let cumulative = uniqueUsers.filter(u => {
        const d = new Date(u.createdAt || u.created_on || u.created || 0)
        return d.getTime() < firstWindowDay
      }).length

      const dailyCounts = []
      const dailyPcts = []

      last30Days.forEach(t => {
        const count = countsByDate[t] || 0
        dailyCounts.push(count)

        const pct = cumulative > 0 ? (count / cumulative) * 100 : 0
        dailyPcts.push(pct)

        cumulative += count
      })

      const avgGrowthCount =
        dailyCounts.reduce((a, b) => a + b, 0) / (dailyCounts.length || 1)
      const avgGrowthPercent =
        dailyPcts.reduce((a, b) => a + b, 0) / (dailyPcts.length || 1)

      // Trends (last 7 days vs previous 7 days)
      const recent7Counts = dailyCounts.slice(-7)
      const prev7Counts = dailyCounts.slice(-14, -7)
      const recent7Avg =
        recent7Counts.reduce((a, b) => a + b, 0) / (recent7Counts.length || 1)
      const prev7Avg =
        prev7Counts.reduce((a, b) => a + b, 0) / (prev7Counts.length || 1)
      const isCountIncreasing = recent7Avg >= prev7Avg

      const recent7Pcts = dailyPcts.slice(-7)
      const prev7Pcts = dailyPcts.slice(-14, -7)
      const recent7AvgPct =
        recent7Pcts.reduce((a, b) => a + b, 0) / (recent7Pcts.length || 1)
      const prev7AvgPct =
        prev7Pcts.reduce((a, b) => a + b, 0) / (prev7Pcts.length || 1)
      const isPctIncreasing = recent7AvgPct >= prev7AvgPct

      setGlobalStats({
        total: uniqueUsers.length || total,
        active,
        inactive,
        yesterdayCount,
        yesterdayDateStr,
        avgGrowthCount: avgGrowthCount.toFixed(1),
        isCountIncreasing,
        avgGrowthPercent: avgGrowthPercent.toFixed(2),
        isPctIncreasing
      })
    } catch (e) {
      console.error('Failed to fetch stats', e)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    const h = setTimeout(() => {
      setDebouncedSearch(String(searchTerm || '').trim())
    }, 300)
    return () => clearTimeout(h)
  }, [searchTerm])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    const load = async () => {
      // If we have cached users, use them for instant client-side search/filtering
      // BUT if date range is present, we must hit the API as caching doesn't account for it
      if (
        allCachedUsers &&
        allCachedUsers.length > 0 &&
        !dateRange.start &&
        !dateRange.end
      ) {
        setUsers(allCachedUsers)
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        if (debouncedSearch) {
          const fetchLimit = Math.max(100, limit)
          const baseParams = { page: 1, limit: fetchLimit }
          baseParams.search = debouncedSearch
          if (statusFilter) baseParams.status = statusFilter
          if (dateRange.start) baseParams.startDate = dateRange.start
          if (dateRange.end) baseParams.endDate = dateRange.end

          const firstRes = await getUsers(baseParams)
          const firstPayload = firstRes?.data || firstRes || {}

          // Update stats from API response if available
          if (
            typeof firstPayload?.activeUsers !== 'undefined' &&
            typeof firstPayload?.newRegistrationYesterday !== 'undefined'
          ) {
            const apiAvgCount = Number(firstPayload.avgDailyGrowthCount || 0)
            const apiAvgPctStr = String(
              firstPayload.avgDailyGrowthPercent || '0'
            )
            const apiAvgPct = parseFloat(apiAvgPctStr.replace('%', ''))

            const now = new Date()
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayDateStr = yesterday.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })

            setGlobalStats({
              total: Number(firstPayload.total || 0),
              active: Number(firstPayload.activeUsers || 0),
              inactive: Number(firstPayload.inactiveUsers || 0),
              yesterdayCount: Number(
                firstPayload.newRegistrationYesterday || 0
              ),
              yesterdayDateStr,
              avgGrowthCount: apiAvgCount,
              isCountIncreasing: apiAvgCount >= 0,
              avgGrowthPercent: apiAvgPctStr,
              isPctIncreasing: apiAvgPct >= 0
            })
          }

          const firstList = Array.isArray(firstPayload?.users)
            ? firstPayload.users
            : Array.isArray(firstRes?.data)
            ? firstRes.data
            : Array.isArray(firstRes)
            ? firstRes
            : []
          const pages = Number(firstPayload?.pages ?? 1)
          const requests = []
          for (let p = 2; p <= pages; p++) {
            const pParams = { ...baseParams, page: p }
            requests.push(getUsers(pParams))
          }
          const results = requests.length ? await Promise.all(requests) : []
          const rest = results.flatMap(r => {
            const pl = r?.data || r || {}
            const arr = Array.isArray(pl?.users)
              ? pl.users
              : Array.isArray(r?.data)
              ? r.data
              : Array.isArray(r)
              ? r
              : []
            return arr
          })
          const all = [...firstList, ...rest]
          const allMapped = all.map(mapUser)
          const uniqueMap = new Map()
          allMapped.forEach(u => uniqueMap.set(u.id, u))
          setUsers(Array.from(uniqueMap.values()))
          setTotalCount(uniqueMap.size)
          setPage(1)
          setPageCount(1)
          setLimit(fetchLimit)
        } else {
          const params = { page, limit }
          if (statusFilter) params.status = statusFilter
          if (dateRange.start) params.startDate = dateRange.start
          if (dateRange.end) params.endDate = dateRange.end

          const res = await getUsers(params)
          const payload = res?.data || res || {}

          // Update stats from API response if available
          if (
            typeof payload?.activeUsers !== 'undefined' &&
            typeof payload?.newRegistrationYesterday !== 'undefined'
          ) {
            const apiAvgCount = Number(payload.avgDailyGrowthCount || 0)
            const apiAvgPctStr = String(payload.avgDailyGrowthPercent || '0')
            const apiAvgPct = parseFloat(apiAvgPctStr.replace('%', ''))

            const now = new Date()
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayDateStr = yesterday.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })

            setGlobalStats({
              total: Number(payload.total || 0),
              active: Number(payload.activeUsers || 0),
              inactive: Number(payload.inactiveUsers || 0),
              yesterdayCount: Number(payload.newRegistrationYesterday || 0),
              yesterdayDateStr,
              avgGrowthCount: apiAvgCount,
              isCountIncreasing: apiAvgCount >= 0,
              avgGrowthPercent: apiAvgPctStr,
              isPctIncreasing: apiAvgPct >= 0
            })
          }

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
          if (Number.isFinite(srvPage)) setPage(Math.max(1, srvPage))
          if (Number.isFinite(srvLimit)) setLimit(Math.max(1, srvLimit))
        }
      } catch (e) {
        setError('Failed to load users')
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [
    page,
    limit,
    debouncedSearch,
    statusFilter,
    allCachedUsers,
    dateRange.start,
    dateRange.end
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
        const haystack = `${name} ${email} ${phoneLc} ${walletStr} ${created} ${statusStr} ${idStr} ${rawIdStr}`
        const matchesText = haystack.includes(term)
        const matchesDigits =
          (termDigits && phoneDigits.includes(termDigits)) ||
          (termDigits && walletDigits.includes(termDigits))
        return matchesText || matchesDigits
      })
    }
    if (statusFilter) {
      base = base.filter(u => u.status === statusFilter)
    }
    // Date range filtering is now handled by API
    return base
  }, [users, searchTerm, statusFilter])

  const sortedUsers = useMemo(() => {
    const arr = [...filteredUsers]
    if (!sort.key) return arr
    const dir = sort.dir === 'asc' ? 1 : -1
    const getVal = u => {
      switch (sort.key) {
        case 'createdTs':
          return u.createdTs || 0
        case 'name':
          return String(u.name || '').toLowerCase()
        case 'email':
          return String(u.email || '').toLowerCase()
        case 'phone':
          return String(u.phone || '').toLowerCase()
        case 'walletPointsNum':
          return Number(u.walletPointsNum || 0)
        case 'status':
          return u.status === 'Active' ? 'Active' : 'Inactive'
        default:
          return ''
      }
    }
    arr.sort((a, b) => {
      const va = getVal(a)
      const vb = getVal(b)
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
    return arr
  }, [filteredUsers, sort])

  // Update pagination info when using client-side data
  useEffect(() => {
    if (allCachedUsers && users === allCachedUsers) {
      const count = sortedUsers.length
      setTotalCount(count)
      setPageCount(Math.ceil(count / limit) || 1)
    }
  }, [allCachedUsers, users, sortedUsers.length, limit])

  const paginatedUsers = useMemo(() => {
    if (allCachedUsers && users === allCachedUsers) {
      const start = (page - 1) * limit
      return sortedUsers.slice(start, start + limit)
    }
    return sortedUsers
  }, [allCachedUsers, users, sortedUsers, page, limit])

  const toggleSort = key => {
    setSort(prev => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      }
      return { key, dir: 'asc' }
    })
  }

  const handleToggleFilters = () => {
    setFiltersOpen(v => !v)
  }

  const handleDownloadExcel = async () => {
    try {
      setExporting(true)
      const baseParams = { page: 1, limit: 5000 }
      if (debouncedSearch) baseParams.search = debouncedSearch
      if (statusFilter) baseParams.status = statusFilter
      const firstRes = await getUsers(baseParams)
      const firstPayload = firstRes?.data || firstRes || {}
      const firstList = Array.isArray(firstPayload?.users)
        ? firstPayload.users
        : Array.isArray(firstRes?.data)
        ? firstRes.data
        : Array.isArray(firstRes)
        ? firstRes
        : []
      const pages = Number(firstPayload?.pages ?? 1)
      const requests = []
      for (let p = 2; p <= pages; p++) {
        requests.push(getUsers({ ...baseParams, page: p }))
      }
      const results = requests.length ? await Promise.all(requests) : []
      const rest = results.flatMap(r => {
        const pl = r?.data || r || {}
        const arr = Array.isArray(pl?.users)
          ? pl.users
          : Array.isArray(r?.data)
          ? r.data
          : Array.isArray(r)
          ? r
          : []
        return arr
      })
      const rawAll = [...firstList, ...rest]
      const pairs = rawAll.map(d => ({ raw: d, derived: mapUser(d) }))
      const uniqueMap = new Map()
      pairs.forEach(p => uniqueMap.set(p.derived.id, p))
      const deduped = Array.from(uniqueMap.values())
      const dir = sort.dir === 'asc' ? 1 : -1
      const getVal = u => {
        switch (sort.key) {
          case 'createdTs':
            return u.derived.createdTs || 0
          case 'name':
            return String(u.derived.name || '').toLowerCase()
          case 'email':
            return String(u.derived.email || '').toLowerCase()
          case 'phone':
            return String(u.derived.phone || '').toLowerCase()
          case 'walletPointsNum':
            return Number(u.derived.walletPointsNum || 0)
          case 'status':
            return u.derived.status === 'Active' ? 'Active' : 'Inactive'
          default:
            return ''
        }
      }
      const sortedAll = sort.key
        ? [...deduped].sort((a, b) => {
            const va = getVal(a)
            const vb = getVal(b)
            if (va < vb) return -1 * dir
            if (va > vb) return 1 * dir
            return 0
          })
        : deduped
      const dataToExport = sortedAll.map(p => {
        const u = p.derived
        const r = p.raw || {}
        const profile = r.profile || {}
        return {
          'Created On': u.createdOn,
          'User Name': u.name,
          Email: u.email,
          'Phone Number': u.phone,
          'Wallet Points': u.walletPoints,
          Status: u.status,
          'User ID': u.rawId || u.id,
          Role: r.role,
          'Profile Image': r.profileImage,
          'Wallet Funds':
            typeof r.walletFunds !== 'undefined'
              ? r.walletFunds
              : r.walletPoints,
          'profile._id': profile._id,
          'profile.homeAddress': profile.homeAddress,
          'profile.postalCode': profile.postalCode,
          'profile.countryOfCitizenship': profile.countryOfCitizenship,
          'profile.countryOfResidence': profile.countryOfResidence,
          'profile.state': profile.state,
          'profile.createdAt': profile.createdAt,
          'profile.updatedAt': profile.updatedAt
        }
      })
      if (dataToExport.length) {
        downloadExcel(dataToExport, 'Users.xlsx')
      }
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
        duration={2500}
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

      {/* Stats Cards */}
      <div
        className={`grid grid-cols-1 gap-4 mb-6 ${
          visibleStats?.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'
        }`}
      >
        {(!visibleStats || visibleStats.includes('total')) && (
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
                <p className='text-xs text-black opacity-90'>Total Users</p>
                <p className='text-2xl text-black font-bold'>
                  {globalStats.total}
                </p>
              </div>
            </div>
          </div>
        )}

        {(!visibleStats || visibleStats.includes('active')) && (
          <div
            className='bg-gradient-to-r from-[#E8F8F0] to-[#B8EDD0] p-4 rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity'
            onClick={() => router.push('/users/active')}
          >
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
                  Active Users (Logged in the last 30 days)
                </p>
                <p className='text-2xl text-black font-bold'>
                  {globalStats.active}
                </p>
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
                  Inactive Users (Not logged in since 30 days)
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

                {/* Filters */}
                {filtersOpen && (
                  <div className='relative'>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className='h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    >
                      <option value=''>All Status</option>
                      <option value='Active'>Active</option>
                      <option value='Inactive'>Inactive</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={handleToggleFilters}
                  className='h-9 flex items-center px-4 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white'
                >
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
                  <span className='text-xs text-gray-700 font-medium'>
                    {filtersOpen ? 'Hide Filters' : 'Filters'}
                  </span>
                </button>

                {/* Download */}
                <button
                  onClick={handleDownloadExcel}
                  disabled={exporting}
                  className='h-9 flex items-center px-3 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white disabled:opacity-50'
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
                    Actions
                  </th>
                  <th className='w-[10%] px-3 py-2 text-left text-xs font-medium tracking-[0.04em]'>
                    <TableHeaderCell
                      onClick={() => toggleSort('status')}
                      active={sort.key === 'status'}
                      direction={sort.dir}
                    >
                      Status
                    </TableHeaderCell>
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
