'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2 } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'
import FoodPrescriptionFormFields from './FoodPrescriptionFormFields'
import { createFood } from '@/services/nutrition/nutrition.service'
import { getHostLists } from '@/services/v2/gym/gym.service'

const FORMAT_LABELS = {
  'digital-view': 'Digital content (view-based program)',
  'digital-download': 'Digital content (view-based and downloadable..',
  'pdf-only': 'Downloadable PDF only'
}

const IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/pjpeg'
]
// const IMAGE_MAX_SIZE = 2 * 1024 * 1024

export default function FoodPrescriptionAdd () {
  const router = useRouter()
  const imageInputRef = useRef(null)

  const toPlainText = html => {
    const raw = String(html || '')
    if (!raw.trim()) return ''
    try {
      const el = document.createElement('div')
      el.innerHTML = raw
      // innerText preserves line breaks better than textContent for rich text
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
    { id: 1, title: '', subText: '', file: null }
  ])
  const [cropOpen, setCropOpen] = useState(false)
  const [cropFile, setCropFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })

  const imagePreviewRef = useRef(imagePreview)
  imagePreviewRef.current = imagePreview

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        try {
          URL.revokeObjectURL(imagePreviewRef.current)
        } catch (_) {}
      }
    }
  }, [])

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

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateImage = file => {
    if (!file) return 'Please select an image file'
    if (!IMAGE_TYPES.includes(file.type))
      return 'Only JPG, JPEG, PNG, WEBP, and AVIF are allowed'
    // if (file.size > IMAGE_MAX_SIZE) return 'Image must be less than 2MB'
    return ''
  }

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImage(file)
    if (err) {
      showToast(err, 'error')
      return
    }
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
    if (imagePreview) {
      try {
        URL.revokeObjectURL(imagePreview)
      } catch (_) {}
    }
    setFormData(prev => ({ ...prev, image: file }))
    setImagePreview(URL.createObjectURL(file))
    setCropOpen(false)
    setCropFile(null)
  }

  const handleDocumentChange = (id, field, value) => {
    setDocuments(prev =>
      prev.map(doc => (doc.id === id ? { ...doc, [field]: value } : doc))
    )
  }

  const handleDocumentFileChange = (id, file) => {
    if (!file) return
    setDocuments(prev =>
      prev.map(doc => (doc.id === id ? { ...doc, file } : doc))
    )
  }

  const addDocumentRow = () => {
    setDocuments(prev => [
      ...prev,
      { id: Date.now(), title: '', subText: '', file: null }
    ])
  }

  const removeDocumentRow = id => {
    setDocuments(prev =>
      prev.length > 1 ? prev.filter(doc => doc.id !== id) : prev
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
    if (!description?.trim()) {
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
    if (!formData.image) {
      showToast('Upload Image is required', 'error')
      return
    }
    if (!disclaimer?.trim()) {
      showToast('Non Medical Disclaimer is required', 'error')
      return
    }
    const docsWithFiles = documents.filter(
      d => d.title?.trim() && d.subText?.trim() && d.file
    )
    if (
      documents.some(d => d.title?.trim() || d.subText?.trim() || d.file) &&
      !docsWithFiles.length
    ) {
      showToast('Each document must have Title, Sub Title and a file', 'error')
      return
    }

    setSaving(true)
    try {
      const detailText = toPlainText(description)
      const disclaimerText = toPlainText(disclaimer)

      const fd = new FormData()
      fd.append('name', formData.name.trim())
      fd.append('hostedBy', formData.hostedBy)
      fd.append('detail', detailText)
      fd.append('duration', formData.duration.trim())
      fd.append('format', FORMAT_LABELS[formData.format] ?? formData.format)
      fd.append('nonDisclaimer', disclaimerText)
      fd.append('image', formData.image)

      const documentsPayload = documents
        .filter(d => d.title?.trim() && d.subText?.trim() && d.file)
        .map(d => ({ title: d.title.trim(), subTitle: d.subText?.trim() }))
      if (documentsPayload.length) {
        fd.append('documents', JSON.stringify(documentsPayload))
      }

      documents
        .filter(d => d.title?.trim() && d.subText?.trim() && d.file)
        .forEach(doc => {
          // Backend expects repeated "documents" file fields (see payload screenshot)
          fd.append('documents', doc.file)
        })

      try {
        // eslint-disable-next-line no-console
        console.log('[FoodPrescriptionAdd] createFood FormData entries:')
        // eslint-disable-next-line no-console
        console.table(
          Array.from(fd.entries()).map(([k, v]) =>
            v instanceof File
              ? {
                  key: k,
                  type: 'file',
                  name: v.name,
                  mime: v.type,
                  size: v.size
                }
              : { key: k, type: 'text', value: String(v) }
          )
        )
      } catch {}

      await createFood(fd)
      showToast('Food Prescription added successfully', 'success')
      router.push('/food-prescription')
    } catch (err) {
      if (!err?.response) {
        showToast(
          'Network/CORS error. Request payload will not appear because the POST was blocked before sending. Check browser console.',
          'error'
        )
        return
      }
      const data = err?.response?.data
      const msg = String(
        data?.message ||
          (data ? JSON.stringify(data) : '') ||
          err?.message ||
          'Failed to add food prescription'
      )
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
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
            Add New Food Prescriptions
          </h1>
          <nav className='mt-1 text-sm text-gray-500'>
            <Link href='/dashboard' className='hover:text-gray-700'>
              Dashboard
            </Link>
            <span className='mx-2'>/</span>
            <span className='text-gray-900'>Add New Food Prescriptions</span>
          </nav>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white shadow-sm'>
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Food Prescriptions Details
          </h2>
          <button
            type='button'
            onClick={handleSubmit}
            disabled={saving}
            className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2'
          >
            {saving ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Add'
            )}
          </button>
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
