'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Download,
  MoreVertical,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { IoFilterSharp } from 'react-icons/io5'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import Toast from '@/components/ui/Toast'
import {
  getAllEventDiscount,
  getEventWiseDiscountByEventId,
  createDiscount,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  // Activity Coupon
  createActivityCoupon,
  getAllDiscount,
  getActivityCouponById,
  getActivityWiseDiscount,
  updateActivityCoupon,
  deleteActivityCoupon
} from '@/services/discount/discount.service'
import { getAllEvents } from '@/services/discover-events/event.service'
import {
  getAllActivities,
  getActivityById
} from '@/services/places-to-visit/placesToVisit.service'

const TableHeaderCell = ({ children, align = 'left' }) => (
  <div
    className={`flex items-center gap-1 text-xs font-medium capitalize tracking-wide text-[#8A92AC] whitespace-nowrap ${
      align === 'right' ? 'justify-end' : 'justify-start'
    }`}
  >
    {children}
    <TbCaretUpDownFilled className='h-3.5 w-3.5 text-[#CBCFE2]' />
  </div>
)

export default function DiscountMaster () {
  const router = useRouter()
  const formSectionRef = useRef(null)
  const couponInputRef = useRef(null)
  const formEventContainerRef = useRef(null)
  const formActivityContainerRef = useRef(null)
  const [formData, setFormData] = useState({
    eventId: '',
    activityId: '',
    couponCode: '',
    discountType: 'percentage',
    discountValue: '',
    validUpTo: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [discounts, setDiscounts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [rowActionLoading, setRowActionLoading] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [listEventId, setListEventId] = useState('')
  const [listActivityId, setListActivityId] = useState('')
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventsError, setEventsError] = useState('')
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState('')
  const [activeTab, setActiveTab] = useState('activity')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [formEventOpen, setFormEventOpen] = useState(false)
  const [formActivityOpen, setFormActivityOpen] = useState(false)
  const [formSelectedEventIds, setFormSelectedEventIds] = useState([])
  const [formSelectedActivityIds, setFormSelectedActivityIds] = useState([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModalLoading, setEditModalLoading] = useState(false)
  const [editModalError, setEditModalError] = useState('')
  const [editModalFetching, setEditModalFetching] = useState(false)
  const [editModalData, setEditModalData] = useState({
    id: '',
    eventId: '',
    activityId: '',
    couponCode: '',
    discountType: 'percentage',
    discountValue: '',
    validUpTo: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    const errs = {}
    if (activeTab === 'event') {
      if (!formData.eventId || String(formData.eventId).trim().length < 8)
        errs.eventId = 'Enter a valid event ID'
    } else {
      if (!formData.activityId || String(formData.activityId).trim().length < 8)
        errs.activityId = 'Enter a valid activity ID'
    }
    if (!formData.couponCode || String(formData.couponCode).trim().length < 2)
      errs.couponCode = 'Enter a valid coupon code'
    if (!formData.discountType) errs.discountType = 'Select discount type'
    const dv = Number(formData.discountValue)
    if (!dv || dv <= 0) errs.discountValue = 'Enter a valid discount value'
    if (!formData.validUpTo) errs.validUpTo = 'Select a valid date'
    return errs
  }

  const loadAllEventDiscounts = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllEventDiscount()
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : []
      setDiscounts(list)
    } catch (e) {
      setError('Failed to load discounts')
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  const loadAllActivityCoupons = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllDiscount()
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : []
      setDiscounts(list)
    } catch (e) {
      setError('Failed to load discounts')
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEventWise = async id => {
    setLoading(true)
    setError('')
    try {
      const evId = id || listEventId || formData.eventId
      const ok = evId && String(evId).trim().length >= 8
      if (!ok) {
        setDiscounts([])
      } else {
        const res = await getEventWiseDiscountByEventId(String(evId).trim())
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        setDiscounts(list)
      }
    } catch (e) {
      setError('Failed to load discounts')
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchActivityWise = async aid => {
    setLoading(true)
    setError('')
    try {
      const id = aid || listActivityId || formData.activityId
      const ok = id && String(id).trim().length >= 8
      if (!ok) {
        setDiscounts([])
      } else {
        let list = []
        try {
          const r = await getActivityWiseDiscount(String(id).trim())
          list = Array.isArray(r?.data) ? r.data : Array.isArray(r) ? r : []
        } catch {
          try {
            const aRes = await getActivityById(String(id).trim())
            const a = aRes?.data || aRes
            const evId = a?.eventId || a?.event?._id || a?.eventId?.id || ''
            if (evId && String(evId).trim().length >= 8) {
              const eRes = await getEventWiseDiscountByEventId(
                String(evId).trim()
              )
              const eList = Array.isArray(eRes?.data)
                ? eRes.data
                : Array.isArray(eRes)
                ? eRes
                : []
              list = eList.filter(
                d => String(d.activityId || '') === String(id)
              )
            } else {
              list = []
            }
          } catch {
            list = []
          }
        }
        setDiscounts(list)
      }
    } catch (e) {
      setError('Failed to load discounts')
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    setActivitiesLoading(true)
    setActivitiesError('')
    try {
      const res = await getAllActivities({})
      const data = Array.isArray(res?.data) ? res.data : []
      const mapped = data.map(a => ({
        id: a._id || a.id,
        name: a.activityName || '-',
        location: a.location || '-'
      }))
      setActivities(mapped)
    } catch (e) {
      setActivities([])
      setActivitiesError('Failed to load activities')
    } finally {
      setActivitiesLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'event') {
      loadAllEventDiscounts()
    } else {
      loadAllActivityCoupons()
    }
    const fetchEvents = async () => {
      setEventsLoading(true)
      setEventsError('')
      try {
        const res = await getAllEvents({})
        const data = Array.isArray(res?.data) ? res.data : []
        const mapped = data.map(e => ({
          id: e._id,
          name: e.eventName || '-',
          location: e.location || '-'
        }))
        setEvents(mapped)
      } catch (e) {
        setEvents([])
        setEventsError('Failed to load events')
      } finally {
        setEventsLoading(false)
      }
    }
    fetchEvents()
    fetchActivities()
  }, [])

  useEffect(() => {
    const handleClickOutside = e => {
      if (
        formEventOpen &&
        formEventContainerRef.current &&
        !formEventContainerRef.current.contains(e.target)
      ) {
        setFormEventOpen(false)
      }
      if (
        formActivityOpen &&
        formActivityContainerRef.current &&
        !formActivityContainerRef.current.contains(e.target)
      ) {
        setFormActivityOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [formEventOpen, formActivityOpen])

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuOpenId !== null) {
        const target = event.target
        const isMenuButton = target.closest('button[data-menu-button]')
        const isMenuContent = target.closest('[data-menu-content]')

        if (!isMenuButton && !isMenuContent) {
          setMenuOpenId(null)
        }
      }
    }

    if (menuOpenId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpenId])

  useEffect(() => {
    if (activeTab === 'event') {
      loadAllEventDiscounts()
    } else {
      loadAllActivityCoupons()
    }
  }, [activeTab])

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    try {
      setSubmitting(true)
      if (activeTab === 'event') {
        const isEditing = !!editingId
        const base = {
          couponCode: String(formData.couponCode).trim(),
          discountType: String(formData.discountType).trim(),
          discountValue: Number(formData.discountValue),
          validUpTo: String(formData.validUpTo).trim(),
          discountFor: 'event'
        }
        if (isEditing) {
          await updateDiscount(editingId, {
            ...base,
            eventId: String(formData.eventId).trim()
          })
          if (formData.eventId && String(formData.eventId).trim().length >= 8) {
            const id = String(formData.eventId).trim()
            setListEventId(id)
            await fetchEventWise(id)
            setListEventId('')
          } else {
            await loadAllEventDiscounts()
            setListEventId('')
          }
        } else {
          const ids =
            Array.isArray(formSelectedEventIds) &&
            formSelectedEventIds.length > 0
              ? formSelectedEventIds
              : formData.eventId
              ? [String(formData.eventId).trim()]
              : []
          const payloadArray = ids.map(id => ({
            ...base,
            eventId: String(id).trim()
          }))
          await createDiscount(payloadArray)
          if (ids.length > 1) {
            await loadAllEventDiscounts()
            setListEventId('')
          } else if (ids[0] && String(ids[0]).trim().length >= 8) {
            const id = String(ids[0]).trim()
            setListEventId(id)
            await fetchEventWise(id)
            setListEventId('')
          } else {
            await loadAllEventDiscounts()
            setListEventId('')
          }
        }
      } else {
        const dtVal = String(formData.discountType || '')
          .trim()
          .toLowerCase()
        const discountType = dtVal === 'fixed' ? 'fixed' : 'percentage'
        const activityPayload = {
          activityId: String(formData.activityId).trim(),
          couponCode: String(formData.couponCode).trim(),
          discountType,
          discountValue: Number(formData.discountValue),
          validUpTo: String(formData.validUpTo).trim()
        }
        const res = editingId
          ? await updateActivityCoupon(editingId, activityPayload)
          : await createActivityCoupon(activityPayload)
        if (!editingId) {
          const created = res?.data || res || null
          const optimistic = {
            _id: (created && (created._id || created.id)) || undefined,
            activityId: String(formData.activityId).trim(),
            couponCode: String(formData.couponCode).trim(),
            discountType,
            discountValue: Number(formData.discountValue),
            validUpTo: String(formData.validUpTo).trim(),
            createdAt: new Date().toISOString(),
            status: true
          }
          setDiscounts(prev => {
            const base = Array.isArray(prev) ? prev : []
            return [optimistic, ...base]
          })
        }
        if (
          formData.activityId &&
          String(formData.activityId).trim().length >= 8
        ) {
          const id = String(formData.activityId).trim()
          setListActivityId(id)
          setTimeout(async () => {
            await fetchActivityWise(id)
            setListActivityId('')
          }, 600)
        } else {
          setTimeout(async () => {
            await loadAllActivityCoupons()
            setListActivityId('')
          }, 600)
        }
        // Refresh activities list after creating activity coupon
        if (!editingId) {
          await fetchActivities()
        }
      }
      setFormData({
        eventId: '',
        activityId: '',
        couponCode: '',
        discountType: 'percentage',
        discountValue: '',
        validUpTo: ''
      })
      setFormSelectedEventIds([])
      setFormSelectedActivityIds([])
      setFormEventOpen(false)
      setFormActivityOpen(false)
      setErrors({})
      setEditingId(null)
      setToast({
        open: true,
        title: editingId ? 'Discount updated' : 'Discount created',
        description: editingId
          ? 'Changes have been saved'
          : 'Your discount has been added',
        variant: 'success'
      })
    } catch (e) {
      setError(
        editingId ? 'Failed to update discount' : 'Failed to create discount'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = id => {
    if (!id) return
    const idStr = String(id).trim()
    if (!idStr) return

    setMenuOpenId(null)
    setEditingId(idStr)
    setEditModalError('')
    setEditModalData({
      id: '',
      eventId: '',
      activityId: '',
      couponCode: '',
      discountType: 'percentage',
      discountValue: '',
      validUpTo: ''
    })
    setEditModalOpen(true)
    setRowActionLoading(null)
  }

  // Convert ISO date string to YYYY-MM-DD format for HTML date inputs
  const formatDateForInput = dateValue => {
    if (!dateValue) return ''
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return ''
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      // If it's already in YYYY-MM-DD format, return as is
      const str = String(dateValue || '').trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
      return ''
    }
  }

  useEffect(() => {
    const run = async () => {
      if (!editModalOpen || !editingId) {
        return
      }
      setEditModalFetching(true)
      setEditModalError('')
      try {
        const res =
          activeTab === 'event'
            ? await getDiscountById(editingId)
            : await getActivityCouponById(editingId)
        const d = res?.data || res || {}
        const dt = String(d.discountType || 'percentage').toLowerCase()
        const normalizedType =
          dt === 'flat' || dt === 'fixed' ? 'fixed' : 'percentage'
        setEditModalData({
          id: d._id || d.id || editingId,
          eventId: String(d.eventId || d.event?._id || d.event?.id || ''),
          activityId: String(
            d.activityId || d.activity?._id || d.activity?.id || ''
          ),
          couponCode: String(d.couponCode || ''),
          discountType: normalizedType,
          discountValue: String(d.discountValue ?? ''),
          validUpTo: formatDateForInput(d.validUpTo || d.validUpToDate)
        })
      } catch (e) {
        console.error('Failed to load discount for edit:', e)
        setEditModalError('Failed to load discount. Please try again.')
      } finally {
        setEditModalFetching(false)
      }
    }
    run()
  }, [editModalOpen, editingId, activeTab])

  const saveEdit = async () => {
    const d = editModalData
    const errs = {}
    if (activeTab === 'event') {
      if (!d.eventId || String(d.eventId).trim().length < 8)
        errs.eventId = 'Enter a valid event ID'
    } else {
      if (!d.activityId || String(d.activityId).trim().length < 8)
        errs.activityId = 'Enter a valid activity ID'
    }
    if (!d.couponCode || String(d.couponCode).trim().length < 2)
      errs.couponCode = 'Enter a valid coupon code'
    if (!d.discountType) errs.discountType = 'Select discount type'
    const dv = Number(d.discountValue)
    if (!dv || dv <= 0) errs.discountValue = 'Enter a valid discount value'
    if (!d.validUpTo) errs.validUpTo = 'Select a valid date'
    if (Object.keys(errs).length > 0) {
      setEditModalError('Please fix the highlighted fields')
      return
    }
    try {
      setEditModalLoading(true)
      setEditModalError('')
      if (activeTab === 'event') {
        const base = {
          couponCode: String(d.couponCode).trim(),
          discountType: String(d.discountType).trim(),
          discountValue: Number(d.discountValue),
          validUpTo: String(d.validUpTo).trim(),
          discountFor: 'event'
        }
        await updateDiscount(editingId, {
          ...base,
          eventId: String(d.eventId).trim()
        })
        if (d.eventId && String(d.eventId).trim().length >= 8) {
          await fetchEventWise(d.eventId)
        } else {
          await loadAllEventDiscounts()
        }
      } else {
        const dtVal = String(d.discountType || '')
          .trim()
          .toLowerCase()
        const discountType = dtVal === 'fixed' ? 'fixed' : 'percentage'
        const activityPayload = {
          activityId: String(d.activityId).trim(),
          couponCode: String(d.couponCode).trim(),
          discountType,
          discountValue: Number(d.discountValue),
          validUpTo: String(d.validUpTo).trim()
        }
        await updateActivityCoupon(editingId, activityPayload)
        if (d.activityId && String(d.activityId).trim().length >= 8) {
          await fetchActivityWise(d.activityId)
        } else {
          await loadAllActivityCoupons()
        }
      }
      setToast({
        open: true,
        title: 'Discount updated',
        description: 'Changes have been saved',
        variant: 'success'
      })
      setEditModalOpen(false)
      setEditingId(null)
      setEditModalError('')
      setEditModalData({
        id: '',
        eventId: '',
        activityId: '',
        couponCode: '',
        discountType: 'percentage',
        discountValue: '',
        validUpTo: ''
      })
    } catch (e) {
      setEditModalError('Failed to update discount')
    } finally {
      setEditModalLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!confirmId) return
    setDeleting(true)
    try {
      const res =
        activeTab === 'event'
          ? await deleteDiscount(confirmId)
          : await deleteActivityCoupon(confirmId)
      if (activeTab === 'event') {
        if (listEventId || formData.eventId) {
          await fetchEventWise(listEventId || formData.eventId)
        } else {
          await loadAllEventDiscounts()
        }
      } else {
        if (listActivityId || formData.activityId) {
          await fetchActivityWise(listActivityId || formData.activityId)
        } else {
          await loadAllActivityCoupons()
        }
      }
      setToast({
        open: true,
        title: 'Discount deleted',
        description: 'The discount has been removed',
        variant: 'success'
      })
    } catch (e) {
      setError('Failed to delete discount')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmId(null)
    }
  }

  const filteredDiscounts = useMemo(() => {
    const base = Array.isArray(discounts) ? discounts : []
    const bySearch = base.filter(d =>
      String(d.couponCode || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    const byActivity = listActivityId
      ? bySearch.filter(
          d => String(d.activityId || '') === String(listActivityId)
        )
      : bySearch
    return byActivity
  }, [discounts, searchTerm, listActivityId])

  const sortedDiscounts = useMemo(() => {
    const arr = Array.isArray(filteredDiscounts) ? [...filteredDiscounts] : []
    arr.sort((a, b) => {
      const ad = a?.createdAt
      const bd = b?.createdAt
      const av = (() => {
        const v = ad && ad.$date ? ad.$date : ad
        try {
          return v ? new Date(v).getTime() : 0
        } catch {
          return 0
        }
      })()
      const bv = (() => {
        const v = bd && bd.$date ? bd.$date : bd
        try {
          return v ? new Date(v).getTime() : 0
        } catch {
          return 0
        }
      })()
      return bv - av
    })
    return arr
  }, [filteredDiscounts])

  const eventNameOf = d => {
    const id = String(
      d?.eventId || (d?.event && (d.event._id || d.event.id)) || ''
    )
    const f = events.find(ev => String(ev.id) === id)
    const n =
      f?.name ||
      String(d?.eventName || '').trim() ||
      (d?.event && String(d.event.eventName || '').trim())
    return n || '-'
  }

  const activityNameOf = d => {
    const id = String(
      d?.activityId || (d?.activity && (d.activity._id || d.activity.id)) || ''
    )
    const f = activities.find(ac => String(ac.id) === id)
    const n =
      f?.name ||
      String(d?.activityName || '').trim() ||
      (d?.activity && String(d.activity.activityName || '').trim())
    return n || '-'
  }

  const formatShortDate = val => {
    const v = val && val.$date ? val.$date : val
    try {
      return v
        ? new Date(v).toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '-'
    } catch {
      return '-'
    }
  }

  return (
    <div className='space-y-7'>
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />
      <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>
            Discount Masters
          </h1>
          <p className='text-xs text-[#99A1BC]'>Dashboard / Masters</p>
        </div>
      </div>

      <div className='bg-gray-100 p-3 rounded-xl'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
          <div className='flex items-center justify-between mb-4 border-b pb-2 border-gray-200'>
            <h2 className='text-base font-semibold text-slate-900'>
              Discount Details
            </h2>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className='rounded-lg bg-[#FF5B2C] px-4 py-1.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {submitting ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  {editingId ? 'Updating...' : 'Adding...'}
                </span>
              ) : editingId ? (
                'Update'
              ) : (
                'Add'
              )}
            </button>
          </div>

          <div className='mb-4 flex gap-2'>
            <button
              onClick={() => setActiveTab('event')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
                activeTab === 'event'
                  ? 'bg-[#1A1F3F] text-white border-[#1A1F3F]'
                  : 'bg-white text-[#2D3658] border-[#E5E6EF]'
              }`}
            >
              Event
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
                activeTab === 'activity'
                  ? 'bg-[#1A1F3F] text-white border-[#1A1F3F]'
                  : 'bg-white text-[#2D3658] border-[#E5E6EF]'
              }`}
            >
              Activity
            </button>
          </div>

          <form onSubmit={handleSubmit} ref={formSectionRef}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {activeTab === 'event' ? (
                <div className='space-y-1'>
                  <label className='text-xs font-medium text-slate-700'>
                    Event
                  </label>
                  <div className='relative' ref={formEventContainerRef}>
                    <button
                      type='button'
                      onClick={() => setFormEventOpen(v => !v)}
                      className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-sm text-slate-700 flex items-center justify-between'
                    >
                      <span>
                        {(() => {
                          const total = events.length
                          const count = formSelectedEventIds.length
                          if (total > 0 && count === total)
                            return 'All events selected'
                          if (count > 0) return `Selected: ${count}`
                          return 'Select event'
                        })()}
                      </span>
                      <svg
                        className='w-4 h-4 text-[#99A1BC]'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                    </button>
                    {formEventOpen && (
                      <div className='absolute z-50 mt-1 w-full rounded-lg border border-[#E5E6F7] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] p-2'>
                        {!editingId && (
                          <label className='flex items-center gap-2 text-sm text-[#2D3658] mb-2'>
                            <input
                              type='checkbox'
                              checked={
                                events.length > 0 &&
                                formSelectedEventIds.length === events.length
                              }
                              onChange={e => {
                                if (e.target.checked) {
                                  const all = events.map(ev => String(ev.id))
                                  setFormSelectedEventIds(all)
                                  handleInputChange('eventId', all[0] || '')
                                  setListEventId(all[0] || '')
                                } else {
                                  setFormSelectedEventIds([])
                                  handleInputChange('eventId', '')
                                  setListEventId('')
                                }
                              }}
                            />
                            <span>Select All</span>
                          </label>
                        )}
                        <div className='max-h-48 overflow-auto space-y-1'>
                          {events.map(ev => {
                            const id = String(ev.id)
                            const checked = formSelectedEventIds.includes(id)
                            return (
                              <label
                                key={ev.id}
                                className='flex items-center gap-2 text-sm text-[#2D3658]'
                              >
                                <input
                                  type={editingId ? 'radio' : 'checkbox'}
                                  checked={checked}
                                  onChange={() => {
                                    if (editingId) {
                                      setFormSelectedEventIds([id])
                                      handleInputChange('eventId', id)
                                      setListEventId(id)
                                    } else {
                                      setFormSelectedEventIds(prev => {
                                        const has = prev.includes(id)
                                        const next = has
                                          ? prev.filter(x => x !== id)
                                          : [...prev, id]
                                        handleInputChange(
                                          'eventId',
                                          next[0] || ''
                                        )
                                        setListEventId(next[0] || '')
                                        return next
                                      })
                                    }
                                  }}
                                />
                                <span>
                                  {ev.name} — {ev.location}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {eventsLoading && (
                      <p className='text-xs text-[#5E6582] mt-2'>
                        Loading events...
                      </p>
                    )}
                    {eventsError && (
                      <p className='text-xs text-red-600 mt-2'>{eventsError}</p>
                    )}
                    {errors.eventId && (
                      <p className='text-xs text-red-600 mt-2'>
                        {errors.eventId}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className='space-y-1'>
                  <label className='text-xs font-medium text-slate-700'>
                    Activity
                  </label>
                  <div className='relative' ref={formActivityContainerRef}>
                    <button
                      type='button'
                      onClick={() => setFormActivityOpen(v => !v)}
                      className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between'
                    >
                      <span>
                        {(() => {
                          const total = activities.length
                          const count = formSelectedActivityIds.length
                          if (total > 0 && count === total)
                            return 'All activities selected'
                          if (count > 0) return `Selected: ${count}`
                          return 'Select activity'
                        })()}
                      </span>
                      <svg
                        className='w-4 h-4 text-[#99A1BC]'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                    </button>
                    {formActivityOpen && (
                      <div className='absolute z-50 mt-2 w-full rounded-xl border border-[#E5E6EF] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] p-3'>
                        {!editingId && (
                          <label className='flex items-center gap-2 text-sm text-[#2D3658] mb-2'>
                            <input
                              type='checkbox'
                              checked={
                                activities.length > 0 &&
                                formSelectedActivityIds.length ===
                                  activities.length
                              }
                              onChange={e => {
                                if (e.target.checked) {
                                  const all = activities.map(ac =>
                                    String(ac.id)
                                  )
                                  setFormSelectedActivityIds(all)
                                  handleInputChange('activityId', all[0] || '')
                                } else {
                                  setFormSelectedActivityIds([])
                                  handleInputChange('activityId', '')
                                }
                              }}
                            />
                            <span>Select All</span>
                          </label>
                        )}
                        <div className='max-h-48 overflow-auto space-y-1'>
                          {activities.map(ac => {
                            const id = String(ac.id)
                            const checked = formSelectedActivityIds.includes(id)
                            return (
                              <label
                                key={ac.id}
                                className='flex items-center gap-2 text-sm text-[#2D3658]'
                              >
                                <input
                                  type={editingId ? 'radio' : 'checkbox'}
                                  checked={checked}
                                  onChange={() => {
                                    if (editingId) {
                                      setFormSelectedActivityIds([id])
                                      handleInputChange('activityId', id)
                                    } else {
                                      setFormSelectedActivityIds(prev => {
                                        const has = prev.includes(id)
                                        const next = has
                                          ? prev.filter(x => x !== id)
                                          : [...prev, id]
                                        handleInputChange(
                                          'activityId',
                                          next[0] || ''
                                        )
                                        return next
                                      })
                                    }
                                  }}
                                />
                                <span>
                                  {ac.name} — {ac.location}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {activitiesLoading && (
                      <p className='text-xs text-[#5E6582] mt-2'>
                        Loading activities...
                      </p>
                    )}
                    {activitiesError && (
                      <p className='text-xs text-red-600 mt-2'>
                        {activitiesError}
                      </p>
                    )}
                    {errors.activityId && (
                      <p className='text-xs text-red-600 mt-2'>
                        {errors.activityId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className='space-y-1'>
                <label className='text-xs font-medium text-slate-700'>
                  Coupon Code
                </label>
                <input
                  type='text'
                  ref={couponInputRef}
                  value={formData.couponCode}
                  onChange={e =>
                    handleInputChange('couponCode', e.target.value)
                  }
                  className='w-full h-9 rounded-lg border text-transform: uppercase border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter coupon code'
                />
                {errors.couponCode && (
                  <p className='text-xs text-red-600'>{errors.couponCode}</p>
                )}
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-medium text-slate-700'>
                  Discount Type
                </label>
                <div className='relative'>
                  <select
                    value={formData.discountType}
                    onChange={e =>
                      handleInputChange('discountType', e.target.value)
                    }
                    className='w-full h-12 appearance-none rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 pr-10 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  >
                    <option value='percentage'>Percentage</option>
                    <option value='fixed'>Fixed</option>
                  </select>
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                    <svg
                      className='w-4 h-4 text-[#99A1BC]'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </div>
                  {errors.discountType && (
                    <p className='text-xs text-red-600'>
                      {errors.discountType}
                    </p>
                  )}
                </div>
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-medium text-slate-700'>
                  Discount Value
                </label>
                <input
                  type='number'
                  value={formData.discountValue}
                  onChange={e =>
                    handleInputChange('discountValue', e.target.value)
                  }
                  className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter discount value'
                />
                {errors.discountValue && (
                  <p className='text-xs text-red-600'>{errors.discountValue}</p>
                )}
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-medium text-slate-700'>
                  Valid Up To
                </label>
                <input
                  type='date'
                  value={formData.validUpTo}
                  onChange={e => handleInputChange('validUpTo', e.target.value)}
                  className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                />
                {errors.validUpTo && (
                  <p className='text-xs text-red-600'>{errors.validUpTo}</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className='bg-gray-200 p-3 rounded-xl p-4'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-8'>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Discount List
            </h2>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='relative flex items-center w-64'>
                <input
                  type='text'
                  placeholder='Search'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='h-10 w-full rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                />
                <Search className='absolute left-3 h-4 w-4 text-[#A6AEC7]' />
              </div>
              <button
                className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'
                onClick={() => setFiltersOpen(v => !v)}
              >
                <IoFilterSharp className='h-4 w-4 text-[#8B93AF]' />
                Filters
              </button>
              <button className='flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]'>
                <Download className='h-4 w-4 text-[#8B93AF]' />
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div className='mb-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
              {activeTab === 'event' ? (
                <div className='relative'>
                  <select
                    value={listEventId}
                    onChange={e => {
                      setListEventId(e.target.value)
                      fetchEventWise(e.target.value)
                    }}
                    className='h-10 w-full rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-3 pr-10 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  >
                    <option value=''>Filter by event</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name} — {ev.location}
                      </option>
                    ))}
                  </select>
                  <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                    <svg
                      className='w-4 h-4 text-[#99A1BC]'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      {/* <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' /> */}
                    </svg>
                  </div>
                  {eventsLoading && (
                    <span className='ml-3 text-xs text-[#5E6582]'>
                      Loading events...
                    </span>
                  )}
                  {eventsError && (
                    <span className='ml-3 text-xs text-red-600'>
                      {eventsError}
                    </span>
                  )}
                </div>
              ) : (
                <div className='relative'>
                  <select
                    value={listActivityId}
                    onChange={e => {
                      setListActivityId(e.target.value)
                      fetchActivityWise(e.target.value)
                    }}
                    className='h-10 w-full rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-3 pr-10 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  >
                    <option value=''>Filter by activity</option>
                    {activities.map(ac => (
                      <option key={ac.id} value={ac.id}>
                        {ac.name} — {ac.location}
                      </option>
                    ))}
                  </select>
                  <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2'>
                    <svg
                      className='w-4 h-4 text-[#99A1BC]'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      {/* <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' /> */}
                    </svg>
                  </div>
                  {activitiesLoading && (
                    <span className='ml-3 text-xs text-[#5E6582]'>
                      Loading activities...
                    </span>
                  )}
                  {activitiesError && (
                    <span className='ml-3 text-xs text-red-600'>
                      {activitiesError}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className='overflow-visible rounded-2xl border border-[#E5E8F5]'>
            <div className='grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3'>
              <div className='col-span-2'>
                <TableHeaderCell>Added On</TableHeaderCell>
              </div>
              {activeTab === 'event' ? (
                <div className='col-span-2'>
                  <TableHeaderCell>Event Name</TableHeaderCell>
                </div>
              ) : (
                <div className='col-span-2'>
                  <TableHeaderCell>Activity Name</TableHeaderCell>
                </div>
              )}
              <div className='col-span-2'>
                <TableHeaderCell>Coupon Code</TableHeaderCell>
              </div>
              <div className='col-span-2'>
                <TableHeaderCell>Valid Until</TableHeaderCell>
              </div>
              <div className='col-span-1'>
                <TableHeaderCell>Type</TableHeaderCell>
              </div>
              <div className='col-span-1'>
                <TableHeaderCell>Value</TableHeaderCell>
              </div>
              <div className='col-span-1'>
                <TableHeaderCell align='right'>Status</TableHeaderCell>
              </div>
              <div className='col-span-1'>
                <TableHeaderCell align='right'>Action</TableHeaderCell>
              </div>
            </div>

            <div className='divide-y divide-[#EEF1FA] bg-white'>
              {loading && (
                <div className='px-6 py-5 text-sm text-[#5E6582]'>
                  Loading...
                </div>
              )}
              {error && !loading && (
                <div className='px-6 py-5 text-sm text-red-600'>{error}</div>
              )}
              {!loading &&
                !error &&
                sortedDiscounts.map((d, idx) => (
                  <div
                    key={d._id || idx}
                    className='grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#F9FAFD]'
                  >
                    <div className='col-span-2 self-center text-xs text-[#5E6582]'>
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleString(undefined, {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </div>
                    {activeTab === 'event' ? (
                      <div className='col-span-2 self-center text-xs text-[#5E6582]'>
                        {eventNameOf(d)}
                      </div>
                    ) : (
                      <div className='col-span-2 self-center text-xs text-[#5E6582]'>
                        {activityNameOf(d)}
                      </div>
                    )}
                    <div className='col-span-2 self-center text-xs font-semibold text-slate-900'>
                      {d.couponCode || '-'}
                    </div>
                    <div className='col-span-2 self-center text-xs text-[#5E6582]'>
                      {formatShortDate(d.validUpTo)}
                    </div>
                    <div className='col-span-1 self-center text-xs text-[#5E6582]'>
                      {String(d.discountType || 'percentage').toLowerCase() ===
                      'percentage'
                        ? 'Percentage'
                        : 'Fixed'}
                    </div>
                    <div className='col-span-1 self-center text-xs text-[#5E6582]'>
                      {String(d.discountType || 'percentage').toLowerCase() ===
                      'percentage'
                        ? `${d.discountValue ?? '-'}%`
                        : `${d.discountValue ?? '-'}`}
                    </div>
                    <div className='col-span-1 flex items-center justify-end'>
                      {(() => {
                        const statusText = d.status ? 'Active' : 'Inactive'
                        const statusClass = d.status
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                        return (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {statusText}
                          </span>
                        )
                      })()}
                    </div>
                    <div className='col-span-1 flex items-center justify-end'>
                      <div className='relative items-center justify-center'>
                        <button
                          data-menu-button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === (d._id || idx)
                                ? null
                                : d._id || idx
                            )
                          }
                          className='rounded-full items-center justify-center border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                        {menuOpenId === (d._id || idx) && (
                          <div
                            data-menu-content
                            className='absolute right-0 mt-2 w-40 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-20'
                          >
                            <button
                              onClick={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                const id = d._id || d.id || idx
                                if (id) {
                                  startEdit(String(id))
                                }
                              }}
                              className='flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                              disabled={rowActionLoading === d._id}
                            >
                              {rowActionLoading === d._id ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Pencil className='h-4 w-4' />
                              )}
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmId(d._id)
                                setConfirmOpen(true)
                                setMenuOpenId(null)
                              }}
                              className='flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50'
                            >
                              <Trash2 className='h-4 w-4' />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        {confirmOpen && (
          <div className='fixed inset-0 z-40 flex items-center justify-center'>
            <div
              className='absolute inset-0 bg-black/40'
              onClick={() => {
                if (!deleting) {
                  setConfirmOpen(false)
                  setConfirmId(null)
                }
              }}
            />
            <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
              <div className='flex items-start gap-4'>
                <div className='rounded-full bg-red-100 p-3'>
                  <AlertCircle className='h-6 w-6 text-red-600' />
                </div>
                <div className='flex-1'>
                  <div className='text-lg font-semibold text-slate-900'>
                    Delete this discount?
                  </div>
                  <div className='mt-1 text-sm text-[#5E6582]'>
                    This action cannot be undone.
                  </div>
                </div>
              </div>
              <div className='mt-6 flex justify-end gap-3'>
                <button
                  onClick={() => {
                    if (!deleting) {
                      setConfirmOpen(false)
                      setConfirmId(null)
                    }
                  }}
                  className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {deleting ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Deleting...
                    </span>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {editModalOpen && (
          <div className='fixed inset-0 z-[100] flex items-center justify-center'>
            <div
              className='absolute inset-0 bg-black/40'
              onClick={() => {
                if (!editModalLoading && !editModalFetching) {
                  setEditModalOpen(false)
                  setEditingId(null)
                  setEditModalError('')
                  setEditModalData({
                    id: '',
                    eventId: '',
                    activityId: '',
                    couponCode: '',
                    discountType: 'percentage',
                    discountValue: '',
                    validUpTo: ''
                  })
                }
              }}
            />
            <div className='relative z-[101] w-full max-w-lg rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
              <div className='text-lg font-semibold text-slate-900 mb-4'>
                Edit Discount
              </div>
              {editModalError && (
                <div className='mb-3 text-sm text-red-600'>
                  {editModalError}
                </div>
              )}
              {editModalFetching && (
                <div className='mb-3 text-sm text-[#5E6582] flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Loading...
                </div>
              )}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {activeTab === 'event' ? (
                  <div className='space-y-1 md:col-span-2'>
                    <label className='text-xs font-medium text-slate-700'>
                      Event ID
                    </label>
                    <input
                      type='text'
                      value={editModalData.eventId}
                      disabled
                      className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700'
                    />
                  </div>
                ) : (
                  <div className='space-y-1 md:col-span-2'>
                    <label className='text-xs font-medium text-slate-700'>
                      Activity ID
                    </label>
                    <input
                      type='text'
                      value={editModalData.activityId}
                      disabled
                      className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700'
                    />
                  </div>
                )}
                <div className='space-y-1'>
                  <label className='text-xs font-medium text-slate-700'>
                    Coupon Code
                  </label>
                  <input
                    type='text'
                    value={editModalData.couponCode}
                    onChange={e =>
                      setEditModalData(prev => ({
                        ...prev,
                        couponCode: e.target.value
                      }))
                    }
                    disabled={editModalFetching}
                    className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700'
                  />
                </div>
                <div className='space-y-1'>
                  <label className='text-xs font-medium text-slate-700'>
                    Discount Type
                  </label>
                  <select
                    value={editModalData.discountType}
                    onChange={e =>
                      setEditModalData(prev => ({
                        ...prev,
                        discountType: e.target.value
                      }))
                    }
                    disabled={editModalFetching}
                    className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700'
                  >
                    <option value='percentage'>Percentage</option>
                    <option value='fixed'>Fixed</option>
                  </select>
                </div>
                <div className='space-y-1'>
                  <label className='text-xs font-medium text-slate-700'>
                    Discount Value
                  </label>
                  <input
                    type='number'
                    value={editModalData.discountValue}
                    onChange={e =>
                      setEditModalData(prev => ({
                        ...prev,
                        discountValue: e.target.value
                      }))
                    }
                    disabled={editModalFetching}
                    className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700'
                  />
                </div>
                <div className='space-y-1'>
                  <label className='text-xs font-medium text-slate-700'>
                    Valid Up To
                  </label>
                  <input
                    type='date'
                    value={editModalData.validUpTo}
                    onChange={e =>
                      setEditModalData(prev => ({
                        ...prev,
                        validUpTo: e.target.value
                      }))
                    }
                    disabled={editModalFetching}
                    className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700'
                  />
                </div>
              </div>
              <div className='mt-6 flex justify-end gap-3'>
                <button
                  onClick={() => {
                    if (!editModalLoading && !editModalFetching) {
                      setEditModalOpen(false)
                      setEditingId(null)
                      setEditModalError('')
                      setEditModalData({
                        id: '',
                        eventId: '',
                        activityId: '',
                        couponCode: '',
                        discountType: 'percentage',
                        discountValue: '',
                        validUpTo: ''
                      })
                    }
                  }}
                  className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
                  disabled={editModalLoading || editModalFetching}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editModalLoading || editModalFetching}
                  className='rounded-xl bg-[#FF5B2C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {editModalLoading ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
