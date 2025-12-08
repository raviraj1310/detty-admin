'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import {
  Loader2,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { TbCaretUpDownFilled } from 'react-icons/tb'
import {
  createStayPromoBanner,
  getAllStayPromoBanners,
  deleteStayPromoBanner,
  updateStayPromoBanner,
  getSingleStayBanner
} from '@/services/stay-promo-banner/stay-promo-banner.service'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'

const toImageSrc = u => {
  const s = String(u || '')
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  let origin = originEnv
  if (!origin) {
    try {
      origin = new URL(apiBase).origin
    } catch {
      origin = ''
    }
  }
  if (!origin) origin = originEnv
  return `${origin.replace(/\/$/, '')}/${s.replace(/^\/+/, '')}`
}

const normalizePromo = d => ({
  _id: d?._id || d?.id || '',
  image: toImageSrc(d?.image || d?.imageUrl || d?.promoBanner || ''),
  title: d?.title || '',
  link: d?.link || d?.url || d?.title || '',
  createdAt: d?.createdAt || d?.addedOn || ''
})

export default function AccommodationPromoBannerMaster () {
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    uploadImage: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    link: '',
    variant: 'success'
  })
  const [promoBanners, setPromoBanners] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const formSectionRef = useRef(null)
  const titleInputRef = useRef(null)
  const linkInputRef = useRef(null)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [rowActionLoading, setRowActionLoading] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState('addedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [imageFile, setImageFile] = useState(null)
  const [imageMeta, setImageMeta] = useState({
    width: 0,
    height: 0,
    sizeBytes: 0,
    originalSizeBytes: 0,
    format: ''
  })
  const [imageUrl, setImageUrl] = useState('')
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState(null)
  const fileInputRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.title || String(formData.title).trim().length < 3)
      errs.title = 'Enter a valid title'
    if (formData.link && !/^https?:\/\//i.test(String(formData.link).trim()))
      errs.link = 'Enter a valid URL (starts with http)'
    if (!editingId && !imageFile) errs.uploadImage = 'Upload an image'
    if (editingId && !imageFile && !String(formData.uploadImage || '').trim())
      errs.uploadImage = 'Upload an image'
    return errs
  }

  const resetForm = () => {
    setFormData({ title: '', link: '', uploadImage: '' })
    setImageFile(null)
    setImageMeta({
      width: 0,
      height: 0,
      sizeBytes: 0,
      originalSizeBytes: 0,
      format: ''
    })
    setImageUrl('')
  }

  const fetchPromoBanners = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAllStayPromoBanners()
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : []
      const normalized = list.map(normalizePromo)
      setPromoBanners(normalized)
    } catch (e) {
      setError('Failed to load promo banners')
      setPromoBanners([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromoBanners()
  }, [])

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuOpenId !== null) {
        const target = event.target
        const isMenuButton = target.closest('button[data-menu-button]')
        const isMenuContent = target.closest('[data-menu-content]')
        if (!isMenuButton && !isMenuContent) setMenuOpenId(null)
      }
    }
    if (menuOpenId !== null)
      document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  const openCropWithExisting = async () => {
    try {
      if (imageFile instanceof File) {
        setCropFile(imageFile)
        setCropOpen(true)
        return
      }
      const src =
        imageUrl ||
        (formData.uploadImage ? toImageSrc(formData.uploadImage) : '')
      if (!src) return
      const r = await fetch(src)
      const b = await r.blob()
      const f = new File(
        [b],
        (formData.uploadImage || 'promo-image').replace(
          /[^a-zA-Z0-9_.-]/g,
          '_'
        ),
        { type: b.type || 'image/jpeg' }
      )
      setCropFile(f)
      setCropOpen(true)
    } catch {}
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    try {
      setSubmitting(true)
      const title = String(formData.title).trim()
      if (editingId) {
        const fd = new FormData()
        fd.append('title', title)
        if (formData.link) fd.append('link', String(formData.link).trim())
        if (imageFile) fd.append('image', imageFile)
        await updateStayPromoBanner(editingId, fd)
      } else {
        const fd = new FormData()
        fd.append('title', title)
        if (formData.link) fd.append('link', String(formData.link).trim())
        if (imageFile) fd.append('image', imageFile)
        await createStayPromoBanner(fd)
      }
      await fetchPromoBanners()
      resetForm()
      setErrors({})
      setEditingId(null)
      setToast({
        open: true,
        title: 'Accommodation promo created',
        description: 'Your promo banner has been added',
        variant: 'success'
      })
    } catch (e) {
      setError('Failed to create promo banner')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = async id => {
    setRowActionLoading(id)
    try {
      const res = await getSingleStayBanner(id)
      const d = res?.data || {}
      setFormData({
        title: String(d.title || ''),
        link: String(d.link || d.url || ''),
        uploadImage: String(d.image || d.imageUrl || '')
      })
      setEditingId(d._id || id)
      setMenuOpenId(null)
      setImageFile(null)
      setImageMeta({
        width: 0,
        height: 0,
        sizeBytes: 0,
        originalSizeBytes: 0,
        format: ''
      })
      try {
        const base = toImageSrc(d?.image || d?.imageUrl || '')
        const t = Date.now()
        setImageUrl(
          base ? `${base}${base.includes('?') ? '&' : '?'}t=${t}` : ''
        )
      } catch {
        setImageUrl('')
      }
      setErrors(prev => ({ ...prev, uploadImage: '' }))
      if (formSectionRef.current) {
        try {
          formSectionRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        } catch {}
      }
      setTimeout(() => {
        try {
          titleInputRef.current?.focus()
        } catch {}
      }, 100)
    } catch (e) {
      setError('Failed to load promo banner')
    } finally {
      setRowActionLoading(null)
    }
  }

  useEffect(() => {
    return () => {
      if (imageUrl) {
        try {
          URL.revokeObjectURL(imageUrl)
        } catch {}
      }
    }
  }, [imageUrl])

  const confirmDelete = async () => {
    if (!confirmId) return
    setDeleting(true)
    try {
      await deleteStayPromoBanner(confirmId)
      await fetchPromoBanners()
      setToast({
        open: true,
        title: 'Accommodation promo banner deleted',
        description: 'The promo banner has been removed',
        variant: 'success'
      })
    } catch (e) {
      setError('Failed to delete promo banner')
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
      setConfirmId(null)
    }
  }

  const filteredPromoBanners = useMemo(() => {
    const base = Array.isArray(promoBanners) ? promoBanners : []
    const term = String(searchTerm || '')
      .trim()
      .toLowerCase()
    const termDigits = term.replace(/[^0-9]/g, '')
    const fmtAdded = d => {
      if (!d) return ''
      const date = new Date(typeof d === 'object' && d.$date ? d.$date : d)
      return date.toLocaleString(undefined, {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    return base.filter(banner => {
      const linkStr = String(banner.link || '').toLowerCase()
      const titleStr = String(banner.title || '').toLowerCase()
      const addedStr = String(fmtAdded(banner.createdAt) || '').toLowerCase()
      const addedDigits = addedStr.replace(/[^0-9]/g, '')
      const matchesText = !term
        ? true
        : linkStr.includes(term) ||
          titleStr.includes(term) ||
          addedStr.includes(term)
      const matchesDigits = termDigits && addedDigits.includes(termDigits)
      return matchesText || matchesDigits
    })
  }, [promoBanners, searchTerm])

  const getSortValue = (b, key) => {
    if (key === 'addedOn') {
      const d = b.createdAt
      return d
        ? new Date(typeof d === 'object' && d.$date ? d.$date : d).getTime()
        : 0
    }
    if (key === 'banner') {
      const img = String(b.image || '')
      return img.toLowerCase()
    }
    if (key === 'title') {
      return String(b.title || '').toLowerCase()
    }
    if (key === 'link') {
      return String(b.link || '').toLowerCase()
    }

    return 0
  }

  const sortedPromoBanners = useMemo(() => {
    const arr = Array.isArray(filteredPromoBanners)
      ? [...filteredPromoBanners]
      : []
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [filteredPromoBanners, sortKey, sortOrder])

  const toggleSort = key => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  return (
    <div className='space-y-7'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-2xl font-semibold text-slate-900'>
          Accommodation Promo Banner Master
        </h1>
        <p className='text-sm text-[#99A1BC]'>Dashboard / Masters</p>
      </div>

      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />

      <div className='bg-gray-200 p-3 rounded-xl p-4'>
        <div
          ref={formSectionRef}
          className='rounded-xl border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'
        >
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Accommodation Promo Banner Details
            </h2>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className='rounded-xl bg-[#FF5B2C] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'
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

          <form onSubmit={handleSubmit}>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Title
                </label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  ref={titleInputRef}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter title'
                />
                {errors.title && (
                  <p className='text-xs text-red-600'>{errors.title}</p>
                )}

                <div className='space-y-2 mt-4'>
                  <label className='text-sm font-medium text-slate-700'>
                    Link
                  </label>
                  <input
                    type='text'
                    value={formData.link}
                    onChange={e => handleInputChange('link', e.target.value)}
                    ref={linkInputRef}
                    className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                    placeholder='https://example.com/page'
                  />
                  {errors.link && (
                    <p className='text-xs text-red-600'>{errors.link}</p>
                  )}
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Upload Image*
                </label>
                <div
                  className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                    <span
                      className='truncate'
                      title={formData.uploadImage || ''}
                    >
                      {formData.uploadImage || 'image.jpg'}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                  >
                    Browse
                  </button>
                  <button
                    type='button'
                    onClick={openCropWithExisting}
                    className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD] border-l border-[#E5E6EF]'
                  >
                    Crop
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.jpg,.jpeg,.png,.webp,.avif'
                  className='hidden'
                  onChange={e => {
                    const file = e.target.files && e.target.files[0]
                    if (file) {
                      setCropFile(file)
                      setCropOpen(true)
                    } else {
                      setImageFile(null)
                      setImageMeta({
                        width: 0,
                        height: 0,
                        sizeBytes: 0,
                        originalSizeBytes: 0,
                        format: ''
                      })
                      setImageUrl('')
                    }
                  }}
                />
                {(imageUrl || formData.uploadImage) && (
                  <div className='mt-2 relative inline-block'>
                    <img
                      src={imageUrl || toImageSrc(formData.uploadImage)}
                      alt='Promo image preview'
                      className='w-32 h-20 object-cover rounded border border-[#E5E6EF] cursor-pointer'
                      onClick={openCropWithExisting}
                    />
                    <button
                      type='button'
                      onClick={openCropWithExisting}
                      className='absolute top-1 right-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-[#2D3658] border border-[#E5E6EF] shadow-sm hover:bg-white'
                    >
                      Crop
                    </button>
                  </div>
                )}
                {imageFile && (
                  <div className='text-xs text-[#5E6582] mt-2'>
                    <span>
                      Dimensions: {imageMeta.width} × {imageMeta.height}
                    </span>
                    <span className='ml-3'>
                      Size: {(imageMeta.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                    <span className='ml-3'>
                      Original:{' '}
                      {(imageMeta.originalSizeBytes / 1024).toFixed(1)} KB
                    </span>
                    <span className='ml-3'>Format: {imageMeta.format}</span>
                  </div>
                )}
                {errors.uploadImage && (
                  <p className='text-xs text-red-600'>{errors.uploadImage}</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <ImageCropper
        open={cropOpen}
        file={cropFile}
        onClose={() => {
          setCropOpen(false)
          setCropFile(null)
        }}
        onCropped={({ file, meta }) => {
          setImageFile(file)
          setImageMeta({
            width: meta?.width || 0,
            height: meta?.height || 0,
            sizeBytes: meta?.sizeBytes || 0,
            originalSizeBytes: meta?.originalSizeBytes || 0,
            format: meta?.format || 'webp'
          })
          setFormData(prev => ({ ...prev, uploadImage: file.name }))
          setErrors(prev => ({ ...prev, uploadImage: '' }))
          try {
            const u = URL.createObjectURL(file)
            setImageUrl(u)
          } catch {}
        }}
      />

      <div className='bg-gray-200 p-3 rounded-xl p-4'>
        <div className='rounded-xl border border-[#E1E6F7] bg-white p-8'>
          <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Accommodation Promo Banner List
            </h2>
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
          </div>

          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-[#E5E6EF]'>
              <thead className='bg-[#F8F9FC]'>
                <tr>
                  <th className='px-4 py-3 text-left'>
                    <TableHeaderCell
                      onClick={() => toggleSort('addedOn')}
                      active={sortKey === 'addedOn'}
                      order={sortOrder}
                    >
                      Added On
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <TableHeaderCell
                      onClick={() => toggleSort('banner')}
                      active={sortKey === 'banner'}
                      order={sortOrder}
                    >
                      Banner
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <TableHeaderCell
                      onClick={() => toggleSort('title')}
                      active={sortKey === 'title'}
                      order={sortOrder}
                    >
                      Title
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-left'>
                    <TableHeaderCell
                      onClick={() => toggleSort('link')}
                      active={sortKey === 'link'}
                      order={sortOrder}
                    >
                      Link
                    </TableHeaderCell>
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-medium text-[#8A92AC] uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-[#E5E6EF]'>
                {sortedPromoBanners.map(b => (
                  <tr key={String(b._id)}>
                    <td className='px-4 py-3 text-sm text-[#5E6582]'>
                      {b.createdAt
                        ? new Date(
                            typeof b.createdAt === 'object' && b.createdAt.$date
                              ? b.createdAt.$date
                              : b.createdAt
                          ).toLocaleString(undefined, {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </td>
                    <td className='px-4 py-3'>
                      <img
                        src={b.image}
                        alt='banner'
                        className='w-28 h-16 object-cover rounded border border-[#E5E6EF]'
                      />
                    </td>
                    <td className='px-4 py-3 text-sm text-[#2D3658]'>
                      {b.title}
                    </td>
                    <td className='px-4 py-3 text-sm text-[#2D3658] break-all whitespace-normal leading-5 pr-2'>
                      {b.link}
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <div className='relative inline-flex items-center justify-end'>
                        <button
                          data-menu-button
                          onClick={() =>
                            setMenuOpenId(menuOpenId === b._id ? null : b._id)
                          }
                          className='rounded-full items-center justify-center border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]'
                        >
                          <MoreVertical className='h-4 w-4' />
                        </button>
                        {menuOpenId === b._id && (
                          <div
                            data-menu-content
                            className='absolute right-0 mt-2 w-40 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-50'
                          >
                            <button
                              onClick={() => startEdit(b._id)}
                              className='flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]'
                              disabled={rowActionLoading === b._id}
                            >
                              {rowActionLoading === b._id ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                <Pencil className='h-4 w-4' />
                              )}
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmId(b._id)
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
                    </td>
                  </tr>
                ))}
                {sortedPromoBanners.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className='px-4 py-6 text-center text-sm text-[#5E6582]'
                    >
                      No banners found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                  Delete this promo banner?
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
    </div>
  )
}
const TableHeaderCell = ({
  children,
  align = 'left',
  onClick,
  active = false,
  order = 'desc'
}) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] ${
      align === 'right' ? 'justify-end' : 'justify-start'
    } ${active ? 'text-[#2D3658]' : 'text-[#8A92AC]'}`}
  >
    {children}
    <TbCaretUpDownFilled
      className={`h-3.5 w-3.5 ${active ? 'text-[#4F46E5]' : 'text-[#CBCFE2]'} ${
        order === 'asc' ? 'rotate-180' : ''
      }`}
    />
  </button>
)
