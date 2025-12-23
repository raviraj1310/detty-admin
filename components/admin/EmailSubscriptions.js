"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Download, Mail, PlusCircle, XCircle } from "lucide-react"
import { TbCaretUpDownFilled } from "react-icons/tb"
import { getEmailSubscriptions, downloadEmailSubscriptionsCSV } from "@/services/email-subscription/email-subscription.service"

const cardDefs = [
  { id: "total", title: "Total Subscriptions", bg: "bg-[#1F57D6]", Icon: Mail },
  { id: "new", title: "New Today", bg: "bg-[#15803D]", Icon: PlusCircle },
  { id: "unsub", title: "Unsubscribed", bg: "bg-[#B91C1C]", Icon: XCircle }
]

const TableHeaderCell = ({ children, onClick }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-1 text-xs font-medium capitalize tracking-wider text-gray-500 hover:text-gray-700">
    {children}
    <TbCaretUpDownFilled className="h-3.5 w-3.5 text-[#CBCFE2]" />
  </button>
)

export default function EmailSubscriptions() {
  const [searchTerm, setSearchTerm] = useState("")
  const [subscriptions, setSubscriptions] = useState([])
  const [metrics, setMetrics] = useState({ total: 0, new: 0, unsub: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortKey, setSortKey] = useState("date")
  const [sortDir, setSortDir] = useState("desc")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await getEmailSubscriptions()
        const list = Array.isArray(res?.subscribers)
          ? res.subscribers
          : (Array.isArray(res?.data?.subscribers) ? res.data.subscribers : [])
        const mapped = list.map(d => {
          const created = d?.createdAt || ''
          const createdTs = created ? new Date(created).getTime() : 0
          return {
            id: d?._id || d?.id,
            name: '',
            email: d?.email || '',
            createdOn: created,
            createdTs,
            status: 'Subscribed'
          }
        })
        setSubscriptions(mapped)
        const total = mapped.length
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)
        const newToday = mapped.filter(m => m.createdTs >= startOfToday.getTime()).length
        const unsub = mapped.filter(m => String(m.status).toLowerCase() === "unsubscribed").length
        setMetrics({ total, new: newToday, unsub })
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Failed to load subscriptions"
        setError(msg)
        setSubscriptions([])
        setMetrics({ total: 0, new: 0, unsub: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = String(searchTerm || "").trim().toLowerCase()
    if (!term) return subscriptions
    const termDigits = term.replace(/[^0-9]/g, "")
    return subscriptions.filter(s => {
      const email = String(s.email || "").toLowerCase()
      const status = String(s.status || "").toLowerCase()
      const createdStr = new Date(s.createdOn).toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toLowerCase()
      const createdDigits = createdStr.replace(/[^0-9]/g, "")
      const matchesText = email.includes(term) || status.includes(term) || createdStr.includes(term)
      const matchesDigits = termDigits && createdDigits.includes(termDigits)
      return matchesText || matchesDigits
    })
  }, [subscriptions, searchTerm])

  const toggleSort = key => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'asc')
    }
  }

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'date':
          return (a.createdTs - b.createdTs) * dir
        case 'email':
          return String(a.email || '').localeCompare(String(b.email || '')) * dir
        case 'status':
          return String(a.status || '').localeCompare(String(b.status || '')) * dir
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const downloadCsv = async () => {
    try {
      const blob = await downloadEmailSubscriptionsCSV()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'email-subscriptions.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to download CSV'
      setError(msg)
    }
  }

  return (
    <div className="space-y-4 py-6 px-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Email Subscriptions</h1>
          <p className="text-xs text-[#99A1BC]">Dashboard / Email Subscriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {cardDefs.map(card => (
          <div key={card.id} className={`${card.bg} rounded-xl p-3 text-white relative overflow-hidden`}>
            <div className="flex items-center justify-between">
              <div className="bg-white/10 p-2.5 rounded-xl flex-shrink-0">
                <card.Icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-white/90 text-xs font-medium mb-1">{card.title}</p>
                <p className="text-2xl font-bold text-white">{String(card.id === 'total' ? metrics.total : card.id === 'new' ? metrics.new : metrics.unsub)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Subscriptions List</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] pl-8 pr-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              />
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#A6AEC7]" />
            </div>
            <button className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]" onClick={downloadCsv}>
              <Download className="h-3.5 w-3.5 text-[#8B93AF]" />
            </button>
          </div>
        </div>

        <div className="overflow-visible rounded-lg border border-[#E5E8F5]">
          <div className="grid grid-cols-[1.5fr_2fr_1.2fr] gap-2 bg-[#F7F9FD] px-4 py-2.5">
            <div><TableHeaderCell onClick={() => toggleSort('date')}>Subscribed On</TableHeaderCell></div>
            <div><TableHeaderCell onClick={() => toggleSort('email')}>Email</TableHeaderCell></div>
            <div><TableHeaderCell onClick={() => toggleSort('status')}>Status</TableHeaderCell></div>
          </div>

          <div className="divide-y divide-[#EEF1FA] bg-white">
            {loading && <div className="px-4 py-2.5 text-xs text-[#5E6582]">Loading...</div>}
            {error && !loading && <div className="px-4 py-2.5 text-xs text-red-600">{error}</div>}
            {!loading && !error && sorted.map((s, idx) => (
              <div key={s.id || idx} className="grid grid-cols-[1.5fr_2fr_1.2fr] gap-2 px-4 py-2.5 hover:bg-[#F9FAFD]">
                <div className="self-center text-xs text-[#5E6582]">
                  {(() => {
                    const d = s.createdOn
                    if (!d || d === '-') return '-'
                    const date = new Date(d)
                    return date.toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  })()}
                </div>
                <div className="self-center text-xs text-[#5E6582] truncate">{s.email || '-'}</div>
                <div className="self-center">
                  <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${String(s.status).toLowerCase() === 'unsubscribed' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                    {s.status || 'Subscribed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
