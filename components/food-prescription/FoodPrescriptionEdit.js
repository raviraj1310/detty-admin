'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'
import FoodPrescriptionFormFields from './FoodPrescriptionFormFields'
import { getFoodById, updateFood } from '@/services/nutrition/nutrition.service'
import { getHostLists } from '@/services/v2/gym/gym.service'

const FORMAT_LABELS = {
  'digital-view': 'Digital content (view-based program)',
  'digital-download': 'Digital content (view-based and downloadable..',
  'pdf-only': 'Downloadable PDF only'
}

const toPlainText = html => {
  const raw = String(html || '')
  if (!raw.trim()) return ''
  try {
    const el = document.createElement('div')
    el.innerHTML = raw
    return String(el.innerText || el.textContent || '').trim()
  } catch (_) {
    return raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
  }
}

const ensureHtml = v => {
  const s = String(v || '').trim()
  if (!s) return ''
  if (/<[a-z][\s\S]*>/i.test(s)) return s
  const withBreaks = s.replace(/\r?\n/g, '<br/>')
  return `<p>${withBreaks}</p>`
}

const getUploadOrigin = () => {
  const sim = String(process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN || '').trim()
  if (sim) return sim.replace(/\/+$/, '')

  const api2 = String(process.env.NEXT_PUBLIC_API_BASE_URL2 || '').trim()
  if (api2) {
    return api2
      .replace(/\/+$/, '')
      .replace(/\/api\/v2\/?$/i, '')
      .replace(/\/+$/, '')
  }

  return 'https://accessdettyfusion.com'
}

const toUploadUrl = (value, folder) => {
  const s = String(value || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s

  // If API already returns a path like "upload/image/xxx.webp"
  const path = s.startsWith('/') ? s : `/${s}`
  if (path.includes('/upload/')) return `${getUploadOrigin()}${path}`

  // Otherwise treat it as a filename
  const safeFolder = String(folder || '').replace(/^\/+|\/+$/g, '')
  return `${getUploadOrigin()}/upload/${safeFolder}/${encodeURIComponent(s)}`
}

const guessFormatValue = fmt => {
  const s = String(fmt || '').trim()
  if (!s) return ''
  if (FORMAT_LABELS[s]) return s
  const lower = s.toLowerCase()
  if (lower.includes('download')) return 'digital-download'
  if (lower.includes('view')) return 'digital-view'
  if (lower.includes('pdf')) return 'pdf-only'
  return ''
}

export default function FoodPrescriptionEdit () {
  const router = useRouter()
  const params = useParams()
  const id = params?.id
  const imageInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    format: '',
    image: null,
    hostedBy: ''
  })
  const [description, setDescription] = useState('')
  const [disclaimer, setDisclaimer] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [hosts, setHosts] = useState([])
  const [documents, setDocuments] = useState([
    { id: 1, backendId: null, title: '', subText: '', file: null }
  ])
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState(null)
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const res = await getHostLists('Food-prescription')
        if (res?.success) {
          setHosts(res.data || [])
        } else if (Array.isArray(res)) {
          setHosts(res)
        } else if (Array.isArray(res?.data)) {
          setHosts(res.data)
        }
      } catch (error) {
        console.error('Error fetching hosts:', error)
      }
    }
    fetchHosts()
  }, [])

  useEffect(() => {
    if (!id) return
    let alive = true
    const run = async () => {
      setLoading(true)
      try {
        const res = await getFoodById(id)
        const food = res?.data ?? res?.data?.data ?? res?.food ?? res
        const docsFromRes = Array.isArray(res?.documents)
          ? res.documents
          : Array.isArray(res?.data?.documents)
          ? res.data.documents
          : []
        if (!alive) return

        setFormData(prev => ({
          ...prev,
          name: String(food?.name || ''),
          duration: String(food?.duration || ''),
          format: guessFormatValue(food?.format) || String(food?.format || ''),
          image: null,
          hostedBy: String(food?.hostedBy?._id || food?.hostedBy || '')
        }))

        setDescription(ensureHtml(food?.detail))
        setDisclaimer(ensureHtml(food?.nonDisclaimer))

        if (docsFromRes.length) {
          setDocuments(
            docsFromRes.map((d, idx) => ({
              id: d?._id || d?.id || `${Date.now()}_${idx}`,
              backendId: d?._id || d?.id || null,
              title: String(d?.title || ''),
              subText: String(d?.subTitle || d?.subText || ''),
              uploadDocument: String(d?.uploadDocument || ''),
              file: null
            }))
          )
        } else {
          setDocuments([
            { id: 1, backendId: null, title: '', subText: '', file: null }
          ])
        }

        const img = toUploadUrl(food?.image, 'image')
        setImagePreview(img)
      } catch (err) {
        showToast('Failed to load food prescription', 'error')
      } finally {
        if (alive) setLoading(false)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [id])

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFile(file)
    setCropOpen(true)
    e.target.value = ''
  }

  const openImagePicker = () => {
    try {
      imageInputRef.current?.click?.()
    } catch (_) {}
  }

  const handleCropped = ({ file }) => {
    setFormData(prev => ({ ...prev, image: file }))
    setImagePreview(URL.createObjectURL(file))
    setCropOpen(false)
    setCropFile(null)
  }

  const handleDocumentChange = (docId, field, value) => {
    setDocuments(prev =>
      prev.map(doc => (doc.id === docId ? { ...doc, [field]: value } : doc))
    )
  }

  const handleDocumentFileChange = (docId, file) => {
    if (!file) return
    setDocuments(prev =>
      prev.map(doc => (doc.id === docId ? { ...doc, file } : doc))
    )
  }

  const addDocumentRow = () => {
    setDocuments(prev => [
      ...prev,
      { id: Date.now(), backendId: null, title: '', subText: '', file: null }
    ])
  }

  const removeDocumentRow = docId => {
    setDocuments(prev =>
      prev.length > 1 ? prev.filter(doc => doc.id !== docId) : prev
    )
  }

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      showToast('Food Prescriptions Name is required', 'error')
      return
    }
    if (!formData.hostedBy) {
      showToast('Hosted By is required', 'error')
      return
    }
    if (!String(description || '').trim()) {
      showToast('Food Prescriptions content is required', 'error')
      return
    }
    if (!formData.duration?.trim()) {
      showToast('Duration is required', 'error')
      return
    }
    if (!formData.format) {
      showToast('Format is required', 'error')
      return
    }
    if (!formData.image && !imagePreview) {
      showToast('Upload Image is required', 'error')
      return
    }
    if (!String(disclaimer || '').trim()) {
      showToast('Non Medical Disclaimer is required', 'error')
      return
    }
    if (!id) {
      showToast('Missing ID', 'error')
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', formData.name.trim())
      fd.append('hostedBy', formData.hostedBy)
      fd.append('detail', toPlainText(description))
      fd.append('duration', formData.duration.trim())
      fd.append('format', FORMAT_LABELS[formData.format] ?? formData.format)
      fd.append('nonDisclaimer', toPlainText(disclaimer))
      if (formData.image) fd.append('image', formData.image)

      const documentsPayload = documents
        .filter(d => d.title?.trim() && d.subText?.trim())
        .map(d => ({
          ...(d.backendId ? { _id: d.backendId } : {}),
          title: d.title.trim(),
          subTitle: d.subText.trim()
        }))

      if (documentsPayload.length) {
        fd.append('documents', JSON.stringify(documentsPayload))
      }

      documents.filter(d => d.file).forEach(d => fd.append('documents', d.file))

      await updateFood(id, fd)
      showToast('Food Prescription updated successfully', 'success')
      router.push('/food-prescription')
    } catch (err) {
      const data = err?.response?.data
      const msg = String(
        data?.message ||
          (data ? JSON.stringify(data) : '') ||
          err?.message ||
          'Failed to update'
      )
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <p className='text-sm text-gray-500'>Loading...</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <Toast
        open={toast.show}
        onOpenChange={val => setToast(prev => ({ ...prev, show: val }))}
        title={toast.type === 'error' ? 'Error' : 'Success'}
        description={toast.message}
        variant={toast.type}
      />

      <div className='mb-8'>
        <button
          onClick={() => router.back()}
          className='mb-2 flex w-fit items-center gap-1 text-xs font-medium text-[#8A92AC] transition-colors hover:text-[#2D3658]'
          type='button'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Edit Food Prescriptions
          </h1>
          <nav className='mt-1 text-sm text-gray-500'>
            <Link href='/dashboard' className='hover:text-gray-700'>
              Dashboard
            </Link>
            <span className='mx-2'>/</span>
            <span className='text-gray-900'>Edit Food Prescriptions</span>
          </nav>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Food Prescriptions Details
          </h2>
          <div className='flex gap-3'>
            <button
              type='button'
              onClick={handleSubmit}
              disabled={saving}
              className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {saving ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </div>

        <FoodPrescriptionFormFields
          formData={formData}
          handleInputChange={handleInputChange}
          hosts={hosts}
          description={description}
          setDescription={setDescription}
          disclaimer={disclaimer}
          setDisclaimer={setDisclaimer}
          imagePreview={imagePreview}
          handleImageChange={handleImageChange}
          imageInputRef={imageInputRef}
          onBrowseImage={openImagePicker}
          onCropImage={
            formData.image
              ? () => {
                  setCropFile(formData.image)
                  setCropOpen(true)
                }
              : null
          }
          documents={documents}
          handleDocumentChange={handleDocumentChange}
          handleDocumentFileChange={handleDocumentFileChange}
          addDocumentRow={addDocumentRow}
          removeDocumentRow={removeDocumentRow}
        />
      </div>

      {cropOpen && (
        <ImageCropper
          open={cropOpen}
          file={cropFile}
          onClose={() => {
            setCropOpen(false)
            setCropFile(null)
          }}
          onCropped={handleCropped}
        />
      )}
    </div>
  )
}
