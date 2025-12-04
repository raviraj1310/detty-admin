'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Download, MoreVertical } from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { getAllActivities } from '@/services/places-to-visit/placesToVisit.service'

const metricCards = [
  {
    id: 'total',
    title: 'Total Activities',
    value: '0',
    iconSrc: '/images/backend/icons/icons (3).svg',
    bg: 'bg-[#4F46E5]'
  },
  {
    id: 'done',
    title: 'Done Activities',
    value: '0',
    iconSrc: '/images/backend/icons/icons (5).svg',
    bg: 'bg-[#059669]'
  },
  {
    id: 'ongoing',
    title: 'Ongoing Activities',
    value: '0',
    iconSrc: '/images/backend/icons/icons (2).svg',
    bg: 'bg-[#EA580C]'
  },
  {
    id: 'upcoming',
    title: 'Upcoming Activities',
    value: '0',
    iconSrc: '/images/backend/icons/icons (4).svg',
    bg: 'bg-[#DC2626]'
  }
]

const activityRows = []

const TableHeaderCell = ({ children, align = 'left', onClick }) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC] ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } hover:text-[#2D3658]`}
  >
    {children}
    <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
  </button>
)

export default function PlacesToVisit () {
  const router = useRouter()

  const [activeDropdown, setActiveDropdown] = useState(null)
  const dropdownRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortDir, setSortDir] = useState('desc')
  const [counts, setCounts] = useState({
    total: 0,
    done: 0,
    ongoing: 0,
    upcoming: 0
  })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const parseTime = t => {
    if (!t || typeof t !== 'string') return null
    const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!m) return null
    let hh = Number(m[1])
    const mm = Number(m[2])
    const mer = m[3].toUpperCase()
    if (mer === 'PM' && hh !== 12) hh += 12
    if (mer === 'AM' && hh === 12) hh = 0
    return hh * 60 + mm
  }

  const deriveStatus = a => {
    const days = Array.isArray(a.activityDays)
      ? a.activityDays.map(d => String(d).toLowerCase())
      : []
    const now = new Date()
    const wk = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()]
    const inToday = days.includes(wk)
    const hrs = String(a.openingHours || '')
      .split('-')
      .map(s => s.trim())
    const startMin = parseTime(hrs[0])
    const endMin = parseTime(hrs[1])
    const nowMin = now.getHours() * 60 + now.getMinutes()
    if (inToday && startMin != null && endMin != null) {
      if (nowMin < startMin) return 'Upcoming'
      if (nowMin >= startMin && nowMin <= endMin) return 'Ongoing'
      return 'Done'
    }
    if (inToday && (startMin == null || endMin == null)) {
      return 'Upcoming'
    }
    return 'Upcoming'
  }

  const statusClass = s => {
    const v = String(s || '').toLowerCase()
    if (v === 'done')
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    if (v === 'ongoing')
      return 'bg-orange-50 text-orange-600 border border-orange-200'
    return 'bg-red-50 text-red-600 border border-red-200'
  }

  const fetchActivities = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllActivities()
      const raw = Array.isArray(res?.data) ? res.data : []
      const IMAGE_BASE_ORIGIN =
        process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN 
      const sanitizeImageUrl = input => {
        if (typeof input !== 'string') return null
        let s = input.trim().replace(/`/g, '')
        s = s.replace(/^['"]/g, '').replace(/['"]$/g, '')
        s = s.replace(/^\(+/, '').replace(/\)+$/, '')
        if (!s) return null
        const looksAbsolute = /^https?:\/\//i.test(s)
        const looksRootRelative = s.startsWith('/')
        const origin = IMAGE_BASE_ORIGIN.replace(/\/+$/, '')
        if (looksAbsolute) return s
        if (looksRootRelative) return origin + s
        return origin + '/' + s.replace(/^\/+/, '')
      }
      const appendCacheBuster = (url, token) => {
        if (!url) return url
        const sep = url.includes('?') ? '&' : '?'
        return url + sep + 't=' + token
      }
      const gradients = [
        'bg-gradient-to-br from-orange-400 to-red-500',
        'bg-gradient-to-br from-blue-400 to-purple-500',
        'bg-gradient-to-br from-green-400 to-teal-500',
        'bg-gradient-to-br from-yellow-400 to-orange-500'
      ]
      const mapped = raw.map((a, idx) => {
        const st = deriveStatus(a)
        const rawImageUrl = sanitizeImageUrl(a.image) || '/images/no-image.webp'
        const added = a.createdAt || a.updatedAt || '-'
        const ts = added && added !== '-' ? new Date(typeof added === 'object' && added.$date ? added.$date : added).getTime() : 0
        return {
          id: a._id || idx,
          addedOn: added,
          addedTs: ts,
          activityName: a.activityName || '-',
          type: (a.activityType && a.activityType.activityTypeName) || '-',
          location: a.location || '-',
          bookedCount: a.bookedCount || '0',
          status: st,
          statusClass: statusClass(st),
          image: appendCacheBuster(rawImageUrl, ts || Date.now()),
          imageBg: gradients[idx % gradients.length]
        }
      })
      setActivities(mapped)
      const c = { total: mapped.length, done: 0, ongoing: 0, upcoming: 0 }
      mapped.forEach(m => {
        const v = String(m.status || '').toLowerCase()
        if (v === 'done') c.done += 1
        else if (v === 'ongoing') c.ongoing += 1
        else c.upcoming += 1
      })
      setCounts(c)
    } catch (e) {
      setError('Failed to load activities')
      setActivities([])
      setCounts({ total: 0, done: 0, ongoing: 0, upcoming: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  const handleAddNewActivity = () => {
    router.push('/places-to-visit/add')
  }

  const typeOptions = useMemo(() => {
    const base = Array.isArray(activities) ? activities : []
    return Array.from(new Set(base.map(a => String(a.type || '').trim()).filter(Boolean)))
  }, [activities])

  const filteredActivities = useMemo(() => {
    const base = Array.isArray(activities) ? activities : []
    let term = String(searchTerm || '').trim().toLowerCase()
    term = term.replace(/\sat\s/gi, ', ')
    const termDigits = term.replace(/[^0-9]/g, '')
    const formatAdded = d => {
      if (!d || d === '-') return '-'
      const date = new Date(typeof d === 'object' && d.$date ? d.$date : d)
      return date.toLocaleString(undefined, {
        weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    }
    return base.filter(a => {
      const name = String(a.activityName || '').toLowerCase()
      const loc = String(a.location || '').toLowerCase()
      const typeStr = String(a.type || '').toLowerCase()
      const addedStr = String(formatAdded(a.addedOn) || '').toLowerCase()
      const addedDigits = String(addedStr || '').replace(/[^0-9]/g, '')
      const matchesText = !term ? true : (name.includes(term) || loc.includes(term) || typeStr.includes(term) || addedStr.includes(term))
      const matchesDigits = termDigits && addedDigits.includes(termDigits)
      const typeOk = typeFilter ? typeStr.includes(String(typeFilter).toLowerCase()) : true
      const locationOk = locationFilter ? loc.includes(String(locationFilter).toLowerCase()) : true
      return (matchesText || matchesDigits) && typeOk && locationOk
    })
  }, [activities, searchTerm, typeFilter, locationFilter])

  const toggleSort = key => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortedActivities = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filteredActivities].sort((a, b) => {
      switch (sortKey) {
        case 'addedOn':
          return (a.addedTs - b.addedTs) * dir
        case 'name':
          return String(a.activityName || '').localeCompare(String(b.activityName || '')) * dir
        case 'type':
          return String(a.type || '').localeCompare(String(b.type || '')) * dir
        case 'location':
          return String(a.location || '').localeCompare(String(b.location || '')) * dir
        case 'booked':
          return (Number(a.bookedCount || 0) - Number(b.bookedCount || 0)) * dir
        case 'status':
          return String(a.status || '').localeCompare(String(b.status || '')) * dir
        default:
          return 0
      }
    })
  }, [filteredActivities, sortKey, sortDir])

  const filteredCounts = useMemo(() => {
    const c = { total: filteredActivities.length, done: 0, ongoing: 0, upcoming: 0 }
    filteredActivities.forEach(m => {
      const v = String(m.status || '').toLowerCase()
      if (v === 'done') c.done += 1
      else if (v === 'ongoing') c.ongoing += 1
      else c.upcoming += 1
    })
    return c
  }, [filteredActivities])

  return (
    <div className='space-y-7 py-12 px-12'>
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-semibold text-slate-900'>
            Places to Visit
          </h1>
          <p className='text-sm text-[#99A1BC]'>Dashboard / Places to Visit</p>
        </div>
        <div className='flex flex-wrap items-center gap-3 md:justify-end'>
          <button
            onClick={() => router.push('/places-to-visit/bookings')}
            className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
          >
            View All Bookings
          </button>
          <button
            onClick={handleAddNewActivity}
            className='rounded-xl bg-[#FF5B2C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A]'
          >
            Add New Activities
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        {metricCards.map(card => {
          const value =
            card.id === 'total'
              ? filteredCounts.total
              : card.id === 'done'
              ? filteredCounts.done
              : card.id === 'ongoing'
              ? filteredCounts.ongoing
              : filteredCounts.upcoming
          return (
            <div
              key={card.id}
              className={`${card.bg} rounded-2xl p-6 text-white relative overflow-hidden`}
            >
              <div className='flex items-center justify-between'>
                <div className='bg-white p-4 rounded-2xl flex-shrink-0'>
                  <img
                    src={card.iconSrc}
                    alt={card.title}
                    className='w-8 h-8'
                  />
                </div>
                <div className='text-right'>
                  <p className='text-white/90 text-sm font-medium mb-2'>
                    {card.title}
                  </p>
                  <p className='text-4xl font-bold text-white'>
                    {String(value)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <h2 className='text-lg font-semibold text-slate-900'>
            Activities List
          </h2>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='relative flex items-center'>
              <input
                type='text'
                placeholder='Search'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
              />
              <Search className='absolute left-3 h-4 w-4 text-[#A6AEC7]' />
            </div>
            {filtersOpen && (
              <>
                <div className='relative'>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className='h-10 rounded-xl border border-[#E5E6EF] bg-white px-3 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none'
                  >
                    <option value=''>All Types</option>
                    {typeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className='relative flex items-center'>
                  <input
                    type='text'
                    placeholder='Location'
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    className='h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none'
                  />
                </div>
              </>
            )}
            <button
              onClick={() => setFiltersOpen(prev => !prev)}
              aria-expanded={filtersOpen}
              className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
            >
              <IoFilterSharp className='h-4 w-4 text-[#8B93AF]' />
              {filtersOpen ? 'Hide Filters' : 'Filters'}
            </button>
            <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
              <Download className='h-4 w-4 text-[#8B93AF]' />
            </button>
          </div>
        </div>

        <div className='overflow-visible rounded-2xl border border-[#E5E8F5]'>
          <div className='grid grid-cols-[1.5fr_2.5fr_1fr_1.5fr_1.2fr_1fr_60px] gap-3 bg-[#F7F9FD] px-6 py-4'>
            <div>
              <TableHeaderCell onClick={() => toggleSort('addedOn')}>Added On</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('name')}>Activity Name</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('type')}>Type</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('location')}>Location</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('booked')}>Tickets Booked</TableHeaderCell>
            </div>
            <div>
              <TableHeaderCell onClick={() => toggleSort('status')}>Status</TableHeaderCell>
            </div>
            <div></div>
          </div>

          <div className='divide-y divide-[#EEF1FA] bg-white'>
            {loading && (
              <div className='px-6 py-5 text-sm text-[#5E6582]'>Loading...</div>
            )}
            {error && !loading && (
              <div className='px-6 py-5 text-sm text-red-600'>{error}</div>
            )}
            {!loading &&
              !error &&
              sortedActivities.map((activity, idx) => (
                <div
                  key={activity.id || idx}
                  className='grid grid-cols-[1.5fr_2.5fr_1fr_1.5fr_1.2fr_1fr_60px] gap-3 px-6 py-5 hover:bg-[#F9FAFD]'
                >
                  <div className='self-center text-sm text-[#5E6582]'>
                    {(() => {
                      const d = activity.addedOn
                      if (!d || d === '-') return '-'
                      const date = new Date(
                        typeof d === 'object' && d.$date ? d.$date : d
                      )
                      return date.toLocaleString(undefined, {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    })()}
                  </div>
                  <div className='flex items-center gap-3'>
                  <div className='relative h-14 w-14 overflow-hidden rounded-xl bg-[#F0F2F8] flex-shrink-0 flex items-center justify-center'>
                    <span
                      className={`absolute inset-0 text-lg font-semibold text-white ${activity.imageBg} flex items-center justify-center`}
                    >
                      {activity.activityName.charAt(0)}
                    </span>
                    {activity.image && (
                      <img
                        src={activity.image}
                        alt={activity.activityName}
                        className='absolute inset-0 h-full w-full object-cover cursor-zoom-in'
                        onClick={() => { setPreviewSrc(activity.image); setPreviewTitle(activity.activityName); setPreviewOpen(true) }}
                        onError={e => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                  </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-semibold text-slate-900 leading-tight'>
                        {activity.activityName}
                      </p>
                    </div>
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {activity.type}
                  </div>
                  <div className='self-center text-sm text-[#5E6582]'>
                    {activity.location}
                  </div>
                  <div className='flex items-center gap-1 underline self-center'>
                    <Link
                      href={
                        activity.id
                          ? `/places-to-visit/bookings/${activity.id}`
                          : '#'
                      }
                      className='text-xs text-[#0069C5] hover:text-[#0F4EF1] transition-colors font-semibold'
                    >
                      <span className='text-xs text-[#0069C5]  hover:text-[#0F4EF1] transition-colors'>
                        {typeof activity.bookedCount === 'number'
                          ? activity.bookedCount
                          : 0}{' '}
                      </span>
                      View List
                    </Link>
                  </div>
                  <div className='flex items-center self-center'>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${activity.statusClass}`}
                    >
                      {activity.status}
                    </span>
                  </div>
                  <div className='flex items-center justify-center self-center relative'>
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === (activity.id || idx)
                            ? null
                            : activity.id || idx
                        )
                      }
                      className='rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                    >
                      <MoreVertical className='h-4 w-4' />
                    </button>
                    {activeDropdown === (activity.id || idx) && (
                      <div
                        ref={dropdownRef}
                        className='absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-[#E5E8F5] z-50'
                      >
                        <div className='py-1'>
                          <Link
                            href={`/places-to-visit/edit/${activity.id}`}
                            className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                          >
                            View/Edit Detail
                          </Link>

                          <Link
                            className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                            href={`/places-to-visit/bookings/${activity.id}`}
                          >
                            View Tickets Booked
                          </Link>
                          <Link
                            className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                            href={`/places-to-visit/edit-tickets/${activity.id}`}
                          >
                            View/Edit Tickets
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            {!loading && !error && filteredActivities.length === 0 && (
              <div className='px-6 py-5 text-sm text-[#5E6582]'>
                No activities found
              </div>
            )}
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black/40' onClick={() => setPreviewOpen(false)} />
          <div className='relative z-50 w-full max-w-2xl rounded-2xl border border-[#E5E8F6] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
            <div className='flex items-center justify-between mb-3'>
              <p className='text-sm font-semibold text-slate-900 truncate'>{previewTitle}</p>
              <button onClick={() => setPreviewOpen(false)} className='rounded-md border border-[#E5E6EF] bg-white px-3 py-1 text-xs font-medium text-[#1A1F3F] hover:bg-[#F9FAFD]'>Close</button>
            </div>
            <div className='rounded-lg overflow-hidden border border-[#E5E6EF] bg-[#F8F9FC]'>
              <img src={previewSrc} alt={previewTitle} className='w-full h-auto object-contain max-h-[70vh]' onError={e => { e.currentTarget.style.display = 'none' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
