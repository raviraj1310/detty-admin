'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Toast from '@/components/ui/Toast'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createProducts } from '@/services/merchandise/merchandise.service'
import { getMerchandiseCategories } from '@/services/merchandise/category.service'

export default function AddMerchandise () {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    stockCount: '',
    imageUrl: '',
    sizes: []
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [uploadImageName, setUploadImageName] = useState('')
  const fileInputRef = useRef(null)
  const sizesDropdownRef = useRef(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [categories, setCategories] = useState([])

  const toNumber = s => {
    const n = Number(String(s || '').replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) ? n : 0
  }

  const formatNaira = n => {
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(Number(n) || 0)
    } catch {
      const num = Number(n) || 0
      return `₦${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    }
  }

  const formatPriceInput = value => {
    const s = String(value || '')
    const cleaned = s.replace(/[^0-9.]/g, '')
    const parts = cleaned.split('.')
    const intPart = parts[0] || ''
    const decimalPart =
      parts.length > 1
        ? parts
            .slice(1)
            .join('')
            .replace(/[^0-9]/g, '')
        : undefined
    if (intPart === '') {
      return decimalPart !== undefined ? `.${decimalPart}` : ''
    }
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return decimalPart !== undefined
      ? `${formattedInt}.${decimalPart}`
      : formattedInt
  }

  const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  const [sizesOpen, setSizesOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = e => {
      if (
        sizesOpen &&
        sizesDropdownRef.current &&
        !sizesDropdownRef.current.contains(e.target)
      ) {
        setSizesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sizesOpen])

  const handleChange = (field, value) => {
    const v = field === 'price' ? formatPriceInput(value) : value
    setFormData(prev => ({ ...prev, [field]: v }))
  }

  const validate = () => {
    const errs = {}
    if (!formData.name || formData.name.trim().length < 3)
      errs.name = 'Enter a valid merchandise name'
    if (!formData.categoryId) errs.categoryId = 'Select category'
    const priceNum = toNumber(formData.price)
    if (!(priceNum > 0)) errs.price = 'Enter valid price'
    const stockNum = Number(formData.stockCount)
    if (!(stockNum >= 0)) errs.stockCount = 'Enter valid stock count'
    return errs
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    try {
      setSubmitting(true)
      const fd = new FormData()
      fd.append('title', String(formData.name || '').trim())
      fd.append('categoryId', String(formData.categoryId || '').trim())
      fd.append('price', String(toNumber(formData.price)))
      fd.append('stock', String(Number(formData.stockCount || 0)))
      if (imageFile) fd.append('image', imageFile)
      {
        const sizesArr = Array.isArray(formData.sizes) ? formData.sizes : []
        if (sizesArr.length > 0) {
          sizesArr.forEach(s => fd.append('sizes', String(s)))
        } else {
          fd.append('sizes', '')
        }
      }
      fd.append('status', 'true')
      await createProducts(fd)
      setToastOpen(true)
      router.push('/merchandise')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getMerchandiseCategories()
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.message)
          ? res.message
          : Array.isArray(res)
          ? res
          : []
        const mapped = list
          .map(c => ({
            id: c?._id || c?.id,
            title: c?.title || c?.name || '-'
          }))
          .filter(c => c.id)
        setCategories(mapped)
      } catch {
        setCategories([])
      }
    })()
  }, [])

  const handleBack = () => {
    router.push('/merchandise')
  }

  return (
    <div className='space-y-7 py-12 px-12'>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title='Merchandise added'
        description='Your merchandise has been created'
        variant='success'
        duration={3000}
        position='top-right'
      />
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='flex items-center gap-4'>
          <button
            onClick={handleBack}
            className='flex items-center justify-center w-10 h-10 rounded-xl border border-[#E5E6EF] bg-white hover:bg-gray-50 transition-colors'
          >
            <ArrowLeft className='w-5 h-5 text-gray-600' />
          </button>
          <div className='flex flex-col gap-2'>
            <h1 className='text-2xl font-semibold text-slate-900'>
              Add Merchandise
            </h1>
            <p className='text-sm text-[#99A1BC]'>
              Dashboard / Merchandise / Add
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
          <div className='mb-6 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-slate-900'>
              Merchandise Details
            </h2>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className='rounded-xl bg-[#FF5B2C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {submitting ? (
                <span className='flex items-center gap-2'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Adding...
                </span>
              ) : (
                'Add'
              )}
            </button>
          </div>
          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Merchandise Name*
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter merchandise name'
                />
                {errors.name && (
                  <p className='text-xs text-red-600'>{errors.name}</p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Category*
                </label>
                <div className='relative'>
                  <select
                    value={formData.categoryId}
                    onChange={e => handleChange('categoryId', e.target.value)}
                    className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none'
                  >
                    <option value=''>Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.categoryId && (
                  <p className='text-xs text-red-600'>{errors.categoryId}</p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Price*
                </label>
                <input
                  type='text'
                  value={formData.price}
                  onChange={e => handleChange('price', e.target.value)}
                  onFocus={() =>
                    handleChange(
                      'price',
                      String(toNumber(formData.price) || '')
                    )
                  }
                  onBlur={() =>
                    handleChange('price', formatNaira(toNumber(formData.price)))
                  }
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='₦0.00'
                />
                {errors.price && (
                  <p className='text-xs text-red-600'>{errors.price}</p>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Stock Count*
                </label>
                <input
                  type='number'
                  min='0'
                  step='1'
                  value={formData.stockCount}
                  onChange={e => handleChange('stockCount', e.target.value)}
                  className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]'
                  placeholder='Enter stock count'
                />
                {errors.stockCount && (
                  <p className='text-xs text-red-600'>{errors.stockCount}</p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Upload Image*
                </label>
                <div
                  className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF] max-w-md'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                    <span className='truncate' title={uploadImageName}>
                      {uploadImageName || 'Image.jpg'}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                  >
                    Browse
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={e => {
                    const f = e.target.files && e.target.files[0]
                    if (!f) return
                    setUploadImageName(f.name)
                    setImageFile(f)
                    const url = URL.createObjectURL(f)
                    setImagePreviewUrl(url)
                    handleChange('imageUrl', url)
                  }}
                />
                {imagePreviewUrl && (
                  <div className='mt-3'>
                    <img
                      src={imagePreviewUrl}
                      alt='Preview'
                      className='w-24 h-24 object-cover rounded border border-[#E5E6EF]'
                    />
                  </div>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-slate-700'>
                  Sizes
                </label>
                <div className='relative' ref={sizesDropdownRef}>
                  <button
                    type='button'
                    onClick={() => setSizesOpen(v => !v)}
                    className='w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between'
                  >
                    <span>
                      {Array.isArray(formData.sizes) &&
                      formData.sizes.length > 0
                        ? formData.sizes.join(', ')
                        : 'Select sizes'}
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
                  {sizesOpen && (
                    <div className='absolute z-50 mt-2 w-full rounded-xl border border-[#E5E6F7] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] p-3'>
                      <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mb-3'>
                        {SIZE_OPTIONS.map(s => {
                          const checked = formData.sizes.includes(s)
                          return (
                            <label
                              key={s}
                              className='flex items-center gap-2 text-sm text-[#2D3658]'
                            >
                              <input
                                type='checkbox'
                                checked={checked}
                                onChange={() => {
                                  const has = formData.sizes.includes(s)
                                  const next = has
                                    ? formData.sizes.filter(x => x !== s)
                                    : [...formData.sizes, s]
                                  handleChange('sizes', next)
                                }}
                              />
                              <span>{s}</span>
                            </label>
                          )
                        })}
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <button
                            type='button'
                            onClick={() =>
                              handleChange('sizes', [...SIZE_OPTIONS])
                            }
                            className='px-3 py-1.5 text-xs rounded-xl border border-[#E5E6EF] bg-white hover:bg-[#F6F7FD] text-[#2D3658]'
                          >
                            Select All
                          </button>
                          <button
                            type='button'
                            onClick={() => handleChange('sizes', [])}
                            className='px-3 py-1.5 text-xs rounded-xl border border-[#E5E6EF] bg-white hover:bg-[#F6F7FD] text-[#2D3658]'
                          >
                            Clear
                          </button>
                        </div>
                        <button
                          type='button'
                          onClick={() => setSizesOpen(false)}
                          className='px-3 py-1.5 text-xs rounded-xl bg-[#FF5B2C] text-white hover:bg-[#F0481A]'
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
