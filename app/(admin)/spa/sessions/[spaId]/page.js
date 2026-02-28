'use client'

import SpaSession from '@/components/spa/SpaSession'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

const SpaSessionPage = () => {
  const router = useRouter()
  const { spaId } = useParams()

  return (
    <div className='p-6'>
      <button
        onClick={() => router.back()}
        className='mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900'
      >
        <ChevronLeft className='h-4 w-4' />
        Back
      </button>

      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>
          Add/Edit Spa Session
        </h1>
        <div className='text-sm text-gray-500'>
          Dashboard / Add/Edit Spa Session
        </div>
      </div>
      <SpaSession spaId={spaId} />
    </div>
  )
}

export default SpaSessionPage
