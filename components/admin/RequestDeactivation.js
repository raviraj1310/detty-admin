'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Check } from 'lucide-react'
import {
  getRequests,
  deleteApproval
} from '@/services/account-deletion/account-delete.service'

const mapRow = d => {
  const u = d?.userId || {}
  return {
    id: d?._id || d?.id || Math.random().toString(36).slice(2),
    name: u?.name || '-',
    email: u?.email || '-',
    status: d?.status || 'Pending',
    createdAt: d?.createdAt || ''
  }
}

export default function RequestDeactivation () {
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [approvingId, setApprovingId] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getRequests()
        const d = res?.data || res || {}
        const list = Array.isArray(d?.requests)
          ? d.requests
          : Array.isArray(d?.data)
          ? d.data
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        setItems(list.map(mapRow))
      } catch (e) {
        setError('Failed to load requests')
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    if (!term) return items
    return items.filter(r => {
      const txt = `${r.name} ${r.email} ${r.status}`.toLowerCase()
      return txt.includes(term)
    })
  }, [items, searchTerm])

  const approve = async id => {
    try {
      setApprovingId(String(id))
      await deleteApproval(id)
      setItems(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'Approved' } : r))
      )
    } catch (e) {
    } finally {
      setApprovingId('')
    }
  }

  return (
    <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-lg font-semibold text-slate-900'>
          Request Deactivation
        </h2>
        <div className='relative flex items-center'>
          <input
            type='text'
            placeholder='Search'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='h-9 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
          />
          <Search className='absolute left-3 h-4 w-4 text-[#A6AEC7]' />
        </div>
      </div>

      <div className='overflow-visible rounded-xl border border-[#E5E8F5]'>
        <div className='grid grid-cols-[1.5fr_2fr_1.2fr_1fr] gap-2 bg-[#F7F9FD] px-4 py-2.5'>
          <div className='text-xs font-medium capitalize tracking-wider text-gray-500'>
            Name
          </div>
          <div className='text-xs font-medium capitalize tracking-wider text-gray-500'>
            Email
          </div>
          <div className='text-xs font-medium capitalize tracking-wider text-gray-500'>
            Status
          </div>
          <div className='text-right text-xs font-medium capitalize tracking-wider text-gray-500'>
            Action
          </div>
        </div>
        <div className='divide-y divide-[#EEF1FA] bg-white'>
          {loading && (
            <div className='px-4 py-3 text-sm text-[#5E6582]'>Loading...</div>
          )}
          {error && !loading && (
            <div className='px-4 py-3 text-sm text-red-600'>{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className='px-4 py-3 text-sm text-[#5E6582]'>
              No requests found
            </div>
          )}
          {!loading &&
            !error &&
            filtered.map(row => (
              <div
                key={row.id}
                className='grid grid-cols-[1.5fr_2fr_1.2fr_1fr] items-center gap-2 px-4 py-3'
              >
                <div className='text-sm font-medium text-slate-900'>
                  {row.name}
                </div>
                <div className='text-sm text-[#5E6582]'>{row.email}</div>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.status === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
                <div className='text-right'>
                  <button
                    onClick={() => approve(row.id)}
                    disabled={
                      row.status === 'Approved' ||
                      approvingId === String(row.id)
                    }
                    className='inline-flex items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-3 py-1.5 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD] disabled:opacity-50'
                  >
                    <Check className='h-4 w-4 text-[#8B93AF]' />
                    {approvingId === String(row.id)
                      ? 'Approving...'
                      : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
