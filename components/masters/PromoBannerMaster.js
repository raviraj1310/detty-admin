'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import { Search, MoreVertical, Loader2, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import { createPromoBanner, getAllPromoBanners, getPromoById, updatePromoBanner, deletePromoBanner } from '@/services/promo-banner/promo-banner.service'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'

const toImageSrc = u => {
  const s = String(u || '')
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  let origin = originEnv
  if (!origin) { try { origin = new URL(apiBase).origin } catch { origin = '' } }
  if (!origin) origin = originEnv
  return `${origin.replace(/\/$/, '')}/${s.replace(/^\/+/, '')}`
}

const normalizePromo = d => ({
  _id: d?._id || d?.id || '',
  image: toImageSrc(d?.image || d?.imageUrl || d?.promoBanner || ''),
  link: d?.link || d?.url || '',
  status: typeof d?.status === 'boolean' ? d.status : String(d?.status || '').toLowerCase() === 'active',
  createdAt: d?.createdAt || d?.addedOn || ''
})

const TableHeaderCell = ({ children, align = 'left', onClick, active = false, order = 'desc' }) => (
  <button type='button' onClick={onClick} className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap ${align === 'right' ? 'justify-end' : 'justify-start'} ${active ? 'text-[#2D3658]' : 'text-[#8A92AC]'}`}>
    {children}
    <TbCaretUpDownFilled className={`h-3 w-3 ${active ? 'text-[#4F46E5]' : 'text-[#CBCFE2]'} ${order === 'asc' ? 'rotate-180' : ''}`} />
  </button>
)

export default function PromoBannerMaster() {
  const [formData, setFormData] = useState({ link: '', uploadImage: '', status: 'Active' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' })
  const [promoBanners, setPromoBanners] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [rowActionLoading, setRowActionLoading] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [imageFile, setImageFile] = useState(null)
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0, sizeBytes: 0, originalSizeBytes: 0, format: '' })
  const [imageUrl, setImageUrl] = useState('')
  const fileInputRef = useRef(null)
  const [failedImages, setFailedImages] = useState({})
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState(null)
  const formSectionRef = useRef(null)
  const linkInputRef = useRef(null)

  const openCropWithExisting = async () => {
    try {
      if (imageFile instanceof File) { setCropFile(imageFile); setCropOpen(true); return }
      const src = imageUrl || (formData.uploadImage ? toImageSrc(formData.uploadImage) : '')
      if (!src) return
      const r = await fetch(src)
      const b = await r.blob()
      const f = new File([b], (formData.uploadImage || 'promo-image').replace(/[^a-zA-Z0-9_.-]/g, '_'), { type: b.type || 'image/jpeg' })
      setCropFile(f)
      setCropOpen(true)
    } catch {}
  }

  const handleInputChange = (field, value) => { setFormData(prev => ({ ...prev, [field]: value })) }

  const validate = () => {
    const errs = {}
    if (!formData.link || String(formData.link).trim().length < 3) errs.link = 'Enter a valid link'
    if (!editingId && !imageFile) errs.uploadImage = 'Upload an image'
    if (editingId && !imageFile && !String(formData.uploadImage || '').trim()) errs.uploadImage = 'Upload an image'
    if (!formData.status) errs.status = 'Select status'
    return errs
  }

  const resetForm = () => {
    setFormData({ link: '', uploadImage: '', status: 'Active' })
    setImageFile(null)
    setImageMeta({ width: 0, height: 0, sizeBytes: 0, originalSizeBytes: 0, format: '' })
  }

  const fetchPromoBanners = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllPromoBanners()
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      setPromoBanners(list.map(normalizePromo))
    } catch { setError('Failed to load promo banners'); setPromoBanners([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPromoBanners() }, [])

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuOpenId !== null) {
        const target = event.target
        const isMenuButton = target.closest('button[data-menu-button]')
        const isMenuContent = target.closest('[data-menu-content]')
        if (!isMenuButton && !isMenuContent) setMenuOpenId(null)
      }
    }
    if (menuOpenId !== null) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    try {
      setSubmitting(true)
      const statusBool = String(formData.status).toLowerCase() === 'active'
      if (editingId) {
        if (imageFile) {
          const fd = new FormData()
          fd.append('link', String(formData.link).trim())
          fd.append('status', String(statusBool))
          fd.append('image', imageFile)
          await updatePromoBanner(editingId, fd)
        } else {
          await updatePromoBanner(editingId, { link: String(formData.link).trim(), imageUrl: String(formData.uploadImage).trim(), status: statusBool })
        }
      } else {
        const fd = new FormData()
        fd.append('link', String(formData.link).trim())
        fd.append('status', String(statusBool))
        if (imageFile) fd.append('image', imageFile)
        await createPromoBanner(fd)
      }
      await fetchPromoBanners()
      resetForm()
      setErrors({})
      setEditingId(null)
      setToast({ open: true, title: editingId ? 'Promo updated' : 'Promo created', description: editingId ? 'Changes have been saved' : 'Your promo banner has been added', variant: 'success' })
    } catch { setError(editingId ? 'Failed to update promo banner' : 'Failed to create promo banner') }
    finally { setSubmitting(false) }
  }

  const startEdit = async id => {
    setRowActionLoading(id)
    try {
      const res = await getPromoById(id)
      const d = res?.data || {}
      setFormData({
        link: String(d.link || d.url || ''),
        uploadImage: String(d.image || d.imageUrl || d.promoBanner || ''),
        status: (typeof d.status === 'boolean' ? d.status : String(d.status || '').toLowerCase() === 'active') ? 'Active' : 'Inactive'
      })
      setEditingId(d._id || id)
      setMenuOpenId(null)
      setImageFile(null)
      setImageMeta({ width: 0, height: 0, sizeBytes: 0, originalSizeBytes: 0, format: '' })
      try {
        const base = toImageSrc(d?.image || d?.imageUrl || d?.promoBanner || '')
        setImageUrl(base ? `${base}${base.includes('?') ? '&' : '?'}t=${Date.now()}` : '')
      } catch { setImageUrl('') }
      setErrors(prev => ({ ...prev, uploadImage: '' }))
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => { linkInputRef.current?.focus() }, 100)
    } catch { setError('Failed to load promo banner') }
    finally { setRowActionLoading(null) }
  }

  useEffect(() => { return () => { if (imageUrl) { try { URL.revokeObjectURL(imageUrl) } catch {} } } }, [imageUrl])

  const confirmDelete = async () => {
    if (!confirmId) return
    setDeleting(true)
    try {
      await deletePromoBanner(confirmId)
      await fetchPromoBanners()
      setToast({ open: true, title: 'Promo banner deleted', description: 'The promo banner has been removed', variant: 'success' })
    } catch { setError('Failed to delete promo banner') }
    finally { setDeleting(false); setConfirmOpen(false); setConfirmId(null) }
  }

  const filteredPromoBanners = useMemo(() => {
    const base = Array.isArray(promoBanners) ? promoBanners : []
    const term = String(searchTerm || '').trim().toLowerCase()
    const termDigits = term.replace(/[^0-9]/g, '')
    const fmtAdded = d => {
      if (!d) return ''
      const date = new Date(typeof d === 'object' && d.$date ? d.$date : d)
      return date.toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
    return base.filter(banner => {
      const linkStr = String(banner.link || '').toLowerCase()
      const addedStr = String(fmtAdded(banner.createdAt) || '').toLowerCase()
      const addedDigits = addedStr.replace(/[^0-9]/g, '')
      const matchesText = !term ? true : linkStr.includes(term) || addedStr.includes(term)
      const matchesDigits = termDigits && addedDigits.includes(termDigits)
      return matchesText || matchesDigits
    })
  }, [promoBanners, searchTerm])

  const getSortValue = (b, key) => {
    if (key === 'addedOn') { const d = b.createdAt; return d ? new Date(typeof d === 'object' && d.$date ? d.$date : d).getTime() : 0 }
    if (key === 'banner') return String(b.image || '').toLowerCase()
    if (key === 'link') return String(b.link || '').toLowerCase()
    if (key === 'status') return b.status ? 1 : 0
    return 0
  }

  const sortedPromoBanners = useMemo(() => {
    const arr = Array.isArray(filteredPromoBanners) ? [...filteredPromoBanners] : []
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [filteredPromoBanners, sortKey, sortOrder])

  const toggleSort = key => {
    if (sortKey === key) setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortOrder('desc') }
  }

  return (
    <div className='space-y-5 py-3 px-3'>
      <div className='flex flex-col gap-1 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-xl font-semibold text-slate-900'>Promo Banner Master</h1>
          <p className='text-xs text-[#99A1BC]'>Dashboard / Masters</p>
        </div>
      </div>

      <Toast open={toast.open} onOpenChange={v => setToast(prev => ({ ...prev, open: v }))} title={toast.title} description={toast.description} variant={toast.variant} duration={2500} position='top-right' />

      <div className='bg-gray-100 p-2 rounded-xl'>
        <div ref={formSectionRef} className='rounded-xl border border-[#E1E6F7] bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-sm font-semibold text-slate-900'>Promo Banner Details</h2>
            <button onClick={handleSubmit} disabled={submitting} className='rounded-xl bg-[#FF5B2C] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'>
              {submitting ? (<span className='flex items-center gap-2'><Loader2 className='h-3.5 w-3.5 animate-spin' />{editingId ? 'Updating...' : 'Adding...'}</span>) : editingId ? 'Update' : 'Add'}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='space-y-1'>
                <label className='text-xs font-medium text-slate-700'>Link</label>
                <input type='text' value={formData.link} onChange={e => handleInputChange('link', e.target.value)} ref={linkInputRef} className='w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]' placeholder='Enter link URL' />
                {errors.link && <p className='text-xs text-red-600'>{errors.link}</p>}
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-medium text-slate-700'>Upload Image*</label>
                <div className='flex h-9 items-stretch overflow-hidden rounded-lg border border-[#E5E6EF]' onClick={() => fileInputRef.current?.click()}>
                  <div className='flex-1 bg-[#F8F9FC] px-3 text-xs text-slate-700 flex items-center cursor-pointer'>
                    <span className='truncate' title={formData.uploadImage || ''}>{formData.uploadImage || 'image.jpg'}</span>
                  </div>
                  <button type='button' onClick={() => fileInputRef.current?.click()} className='px-3 text-xs font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'>Browse</button>
                  <button type='button' onClick={openCropWithExisting} className='px-3 text-xs font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD] border-l border-[#E5E6EF]'>Crop</button>
                </div>
                <input ref={fileInputRef} type='file' accept='.jpg,.jpeg,.png,.webp,.avif' className='hidden' onChange={e => { const file = e.target.files && e.target.files[0]; if (file) { setCropFile(file); setCropOpen(true) } else { setImageFile(null); setImageMeta({ width: 0, height: 0, sizeBytes: 0, originalSizeBytes: 0, format: '' }); setImageUrl('') } }} />
                {(imageUrl || formData.uploadImage) && (
                  <div className='mt-1 relative inline-block'>
                    <img src={imageUrl || toImageSrc(formData.uploadImage)} alt='Promo image preview' className='w-24 h-14 object-cover rounded border border-[#E5E6EF] cursor-pointer' onClick={openCropWithExisting} />
                    <button type='button' onClick={openCropWithExisting} className='absolute top-0.5 right-0.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-[#2D3658] border border-[#E5E6EF] shadow-sm hover:bg-white'>Crop</button>
                  </div>
                )}
                {imageFile && (
                  <div className='text-[10px] text-[#5E6582] mt-1'>
                    <span>{imageMeta.width} × {imageMeta.height}</span>
                    <span className='ml-2'>{(imageMeta.sizeBytes / 1024).toFixed(1)} KB</span>
                    <span className='ml-2'>{imageMeta.format}</span>
                  </div>
                )}
                {errors.uploadImage && <p className='text-xs text-red-600'>{errors.uploadImage}</p>}
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-medium text-slate-700'>Status</label>
                <div className='relative'>
                  <select value={formData.status} onChange={e => handleInputChange('status', e.target.value)} className='w-full h-9 appearance-none rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 pr-8 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'>
                    <option value='Active'>Active</option>
                    <option value='Inactive'>Inactive</option>
                  </select>
                  <div className='absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
                    <svg className='w-3.5 h-3.5 text-[#99A1BC]' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' /></svg>
                  </div>
                </div>
                {errors.status && <p className='text-xs text-red-600'>{errors.status}</p>}
              </div>
            </div>
          </form>
        </div>
      </div>

      <ImageCropper open={cropOpen} file={cropFile} onClose={() => { setCropOpen(false); setCropFile(null) }} onCropped={({ file, meta }) => { setImageFile(file); setImageMeta({ width: meta?.width || 0, height: meta?.height || 0, sizeBytes: meta?.sizeBytes || 0, originalSizeBytes: meta?.originalSizeBytes || 0, format: meta?.format || 'webp' }); setFormData(prev => ({ ...prev, uploadImage: file.name })); setErrors(prev => ({ ...prev, uploadImage: '' })); try { setImageUrl(URL.createObjectURL(file)) } catch {} }} />

      <div className='bg-gray-100 p-2 rounded-xl'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-4'>
          <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
            <h2 className='text-sm font-semibold text-slate-900'>Promo Banner List</h2>
            <div className='relative flex items-center'>
              <input type='text' placeholder='Search' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='h-8 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] pl-8 pr-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]' />
              <Search className='absolute left-2.5 h-3.5 w-3.5 text-[#A6AEC7]' />
            </div>
          </div>

          <div className='overflow-visible rounded-xl border border-[#E5E8F5]'>
            <div className='grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3'>
              <div className='col-span-3'><TableHeaderCell onClick={() => toggleSort('addedOn')} active={sortKey === 'addedOn'} order={sortOrder}>Added On</TableHeaderCell></div>
              <div className='col-span-3'><TableHeaderCell onClick={() => toggleSort('banner')} active={sortKey === 'banner'} order={sortOrder}>Promo Banner</TableHeaderCell></div>
              <div className='col-span-2'><TableHeaderCell onClick={() => toggleSort('link')} active={sortKey === 'link'} order={sortOrder}>Link</TableHeaderCell></div>
              <div className='col-span-3'><TableHeaderCell onClick={() => toggleSort('status')} active={sortKey === 'status'} order={sortOrder}>Status</TableHeaderCell></div>
              <div className='col-span-1'><TableHeaderCell align='right'>Action</TableHeaderCell></div>
            </div>

            <div className='divide-y divide-[#EEF1FA] bg-white'>
              {loading && <div className='px-4 py-3 text-xs text-[#5E6582]'>Loading...</div>}
              {error && !loading && <div className='px-4 py-3 text-xs text-red-600'>{error}</div>}
              {!loading && !error && sortedPromoBanners.map(banner => (
                <div key={banner._id} className='grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#F9FAFD]'>
                  <div className='col-span-3 self-center text-xs text-[#5E6582]'>
                    {banner.createdAt ? new Date(banner.createdAt).toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </div>
                  <div className='col-span-3 flex items-center self-center'>
                    <div className='w-24 h-14 rounded-lg overflow-hidden border border-[#E5E6EF] bg-gray-100'>
                      {banner.image && !failedImages[banner._id] ? (
                        <Image src={banner.image} alt='Promo banner' width={96} height={56} className='w-full h-full object-cover' unoptimized onError={() => setFailedImages(prev => ({ ...prev, [banner._id]: true }))} />
                      ) : (
                        <div className='w-full h-full bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white text-[10px] font-medium'>Banner</div>
                      )}
                    </div>
                  </div>
                  <div className='col-span-2 self-center text-xs text-[#5E6582] break-all whitespace-normal leading-4 pr-2'>{banner.link}</div>
                  <div className='col-span-3 flex items-center'>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${banner.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      {banner.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className='col-span-1 flex items-center justify-end'>
                    <div className='relative'>
                      <button data-menu-button onClick={() => setMenuOpenId(menuOpenId === banner._id ? null : banner._id)} className='rounded-full border border-transparent p-1.5 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'>
                        <MoreVertical className='h-4 w-4' />
                      </button>
                      {menuOpenId === banner._id && (
                        <div data-menu-content className='absolute right-0 top-full mt-1 w-32 rounded-md border border-[#E5E8F6] bg-white shadow-lg z-50'>
                          <button onClick={() => startEdit(banner._id)} className='flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#2D3658] hover:bg-[#F6F7FD]' disabled={rowActionLoading === banner._id}>
                            {rowActionLoading === banner._id ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Pencil className='h-3.5 w-3.5' />}Edit
                          </button>
                          <button onClick={() => { setConfirmId(banner._id); setConfirmOpen(true); setMenuOpenId(null) }} className='flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50'>
                            <Trash2 className='h-3.5 w-3.5' />Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && !error && filteredPromoBanners.length === 0 && <div className='px-4 py-4 text-center text-xs text-[#5E6582]'>No promo banners found</div>}
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className='fixed inset-0 z-40 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black/40' onClick={() => { if (!deleting) { setConfirmOpen(false); setConfirmId(null) } }} />
          <div className='relative z-50 w-full max-w-sm rounded-xl border border-[#E5E8F6] bg-white p-5 shadow-lg'>
            <div className='flex items-start gap-3'>
              <div className='rounded-full bg-red-100 p-2'><AlertCircle className='h-5 w-5 text-red-600' /></div>
              <div className='flex-1'>
                <div className='text-sm font-semibold text-slate-900'>Delete this promo banner?</div>
                <div className='mt-1 text-xs text-[#5E6582]'>This action cannot be undone.</div>
              </div>
            </div>
            <div className='mt-4 flex justify-end gap-2'>
              <button onClick={() => { if (!deleting) { setConfirmOpen(false); setConfirmId(null) } }} className='rounded-lg border border-[#E5E6EF] bg-white px-4 py-1.5 text-xs font-medium text-[#1A1F3F] transition hover:bg-[#F9FAFD]' disabled={deleting}>Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className='rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'>
                {deleting ? <span className='flex items-center gap-1'><Loader2 className='h-3.5 w-3.5 animate-spin' />Deleting...</span> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
