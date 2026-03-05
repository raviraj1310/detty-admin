'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import Toast from '@/components/ui/Toast'
import FoodPrescriptionFormFields from './FoodPrescriptionFormFields'

export default function FoodPrescriptionAdd () {
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
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

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
    if (!formData.image) {
      showToast('Upload Image is required', 'error')
      return
    }
    if (!disclaimer) {
      showToast('Non Medical Disclaimer is required', 'error')
      return
    }
    showToast('Food Prescription added successfully (mock)', 'success')
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
            className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#ff551e]'
          >
            Add
          </button>
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
