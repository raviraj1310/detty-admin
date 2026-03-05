'use client'

import { Trash2 } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'

export default function FoodPrescriptionFormFields ({
  formData,
  handleInputChange,
  description,
  setDescription,
  disclaimer,
  setDisclaimer,
  imagePreview,
  handleImageChange,
  documents,
  handleDocumentChange,
  handleDocumentFileChange,
  addDocumentRow,
  removeDocumentRow
}) {
  return (
    <div className='space-y-8 p-6'>
      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700'>
          Food Prescriptions Name*
        </label>
        <input
          type='text'
          name='name'
          value={formData.name}
          onChange={handleInputChange}
          className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
          placeholder='Balanced Daily Nutrition'
        />
      </div>

      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700'>
          Food Prescriptions*
        </label>
        <div className='overflow-hidden rounded-lg border border-gray-200'>
          <TiptapEditor
            content={description}
            onChange={setDescription}
            placeholder='Write the full food prescription details...'
          />
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Duration*
          </label>
          <select
            name='duration'
            value={formData.duration}
            onChange={handleInputChange}
            className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#FF4400] focus:outline-none'
          >
            <option value=''>Select Duration</option>
            <option value='ongoing'>
              Ongoing access (Self-paced, view-based program)
            </option>
            <option value='4-weeks'>4 Weeks Program</option>
            <option value='8-weeks'>8 Weeks Program</option>
          </select>
        </div>
        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Format*
          </label>
          <select
            name='format'
            value={formData.format}
            onChange={handleInputChange}
            className='w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#FF4400] focus:outline-none'
          >
            <option value=''>Select Format</option>
            <option value='digital-view'>
              Digital content (view-based program)
            </option>
            <option value='digital-download'>
              Digital content (view-based and downloadable)
            </option>
            <option value='pdf-only'>Downloadable PDF only</option>
          </select>
        </div>
        <div>
          <label className='mb-2 block text-sm font-medium text-gray-700'>
            Upload Image*
          </label>
          <div className='flex rounded-lg border border-gray-200 bg-white'>
            <div className='flex-1 truncate px-4 py-2.5 text-sm text-gray-500'>
              {formData.image ? formData.image.name : 'Image.jpg'}
            </div>
            <label className='cursor-pointer bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-r-lg'>
              Browse
              <input
                type='file'
                className='hidden'
                accept='image/*'
                onChange={handleImageChange}
              />
            </label>
          </div>
          {imagePreview && (
            <div className='mt-3 relative h-32 w-full overflow-hidden rounded-lg border border-gray-200'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt='Preview'
                className='h-full w-full object-cover'
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700'>
          Non Medical Disclaimer*
        </label>
        <div className='overflow-hidden rounded-lg border border-gray-200'>
          <TiptapEditor
            content={disclaimer}
            onChange={setDisclaimer}
            placeholder='Add non-medical disclaimer content...'
          />
        </div>
      </div>

      <div>
        <div className='mb-4'>
          <span className='inline-block rounded-md bg-black px-3 py-1 text-sm font-medium text-white'>
            Documents
          </span>
        </div>

        <div className='space-y-6'>
          {documents.map(doc => (
            <div
              key={doc.id}
              className='rounded-xl border border-gray-200 p-4 md:p-5'
            >
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-xs font-medium text-gray-600'>
                    Title*
                  </label>
                  <input
                    type='text'
                    value={doc.title}
                    onChange={e =>
                      handleDocumentChange(doc.id, 'title', e.target.value)
                    }
                    className='w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                    placeholder='Balanced Daily Nutrition'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-gray-600'>
                    Sub Text*
                  </label>
                  <input
                    type='text'
                    value={doc.subText}
                    onChange={e =>
                      handleDocumentChange(doc.id, 'subText', e.target.value)
                    }
                    className='w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                    placeholder='Short supporting description'
                  />
                </div>
              </div>

              <div className='mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3'>
                <div>
                  <label className='mb-1 block text-xs font-medium text-gray-600'>
                    Upload Document*
                  </label>
                  <div className='flex rounded-lg border border-gray-200 bg-white'>
                    <div className='flex-1 truncate px-4 py-2.5 text-sm text-gray-500'>
                      {doc.file ? doc.file.name : 'Document.pdf'}
                    </div>
                    <label className='cursor-pointer bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-r-lg'>
                      Browse
                      <input
                        type='file'
                        className='hidden'
                        accept='.pdf,.doc,.docx'
                        onChange={e =>
                          handleDocumentFileChange(
                            doc.id,
                            e.target.files?.[0] || null
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => removeDocumentRow(doc.id)}
                  className='mt-6 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-500'
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            </div>
          ))}

          <button
            type='button'
            onClick={addDocumentRow}
            className='flex w-full items-center justify-center rounded-lg border border-dashed border-[#FF4400] px-4 py-2.5 text-sm font-medium text-[#FF4400] hover:bg-orange-50'
          >
            Add More
          </button>
        </div>
      </div>
    </div>
  )
}
