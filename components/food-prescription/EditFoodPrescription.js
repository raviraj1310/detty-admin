'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import FoodPrescriptionFormFields from './FoodPrescriptionFormFields'

export default function EditFoodPrescription ({ id }) {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    format: '',
    image: null
  })
  const [description, setDescription] = useState('')
  const [disclaimer, setDisclaimer] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [documents, setDocuments] = useState([
    { id: 1, title: '', subText: '', file: null }
  ])
  const [loading, setLoading] = useState(!!id)
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  useEffect(() => {
    if (!id) return
    setLoading(true)
    // Mock fetch: when API exists, get food prescription by id and set state
    const timer = setTimeout(() => {
      setFormData({
        name: 'Balanced Daily Nutrition',
        duration: 'ongoing',
        format: 'digital-download',
        image: null
      })
      setDescription('<p>Balanced daily nutrition is the foundation of a healthy lifestyle.</p>')
      setDisclaimer('<p>Nutrition content is for general wellness and informational purposes only.</p>')
      setDocuments([
        { id: 1, title: 'Balanced Daily Nutrition', subText: 'A well-balanced meal includes a combination of carbohydrates for energy', file: null }
      ])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [id])

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setFormData(prev => ({ ...prev, image: file }))
    setImagePreview(URL.createObjectURL(file))
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
      { id: Date.now(), title: '', subText: '', file: null }
    ])
  }

  const removeDocumentRow = docId => {
    setDocuments(prev =>
      prev.length > 1 ? prev.filter(doc => doc.id !== docId) : prev
    )
  }

  const handleSubmit = () => {
    if (!formData.name) {
      showToast('Food Prescriptions Name is required', 'error')
      return
    }
    if (!description) {
      showToast('Food Prescriptions content is required', 'error')
      return
    }
    if (!formData.duration) {
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
    if (!disclaimer) {
      showToast('Non Medical Disclaimer is required', 'error')
      return
    }
    showToast('Food Prescription updated successfully (mock)', 'success')
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
              onClick={() => {
                if (id) {
                  router.push(`/food-prescription/food-access/${id}`)
                } else {
                  showToast('Edit Passes is available after saving', 'info')
                }
              }}
              className='rounded-lg border border-[#FF4400] px-6 py-2 text-sm font-medium text-[#FF4400] hover:bg-orange-50'
            >
              Edit Passes
            </button>
            <button
              type='button'
              onClick={handleSubmit}
              className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e]'
            >
              Update
            </button>
          </div>
        </div>

        <FoodPrescriptionFormFields
          formData={formData}
          handleInputChange={handleInputChange}
          description={description}
          setDescription={setDescription}
          disclaimer={disclaimer}
          setDisclaimer={setDisclaimer}
          imagePreview={imagePreview}
          handleImageChange={handleImageChange}
          documents={documents}
          handleDocumentChange={handleDocumentChange}
          handleDocumentFileChange={handleDocumentFileChange}
          addDocumentRow={addDocumentRow}
          removeDocumentRow={removeDocumentRow}
        />
      </div>
    </div>
  )
}
