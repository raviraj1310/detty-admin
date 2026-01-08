'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getVisaApplicationById } from '@/services/visa/visa.service'

export default function ViewVisaApplication ({ applicationId }) {
  const router = useRouter()
  const [details, setDetails] = useState({
    firstName: '',
    surname: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    passportNumber: '',
    maritalStatus: '',
    passportExpiryDate: '',
    hasNigerianPassport: '',
    countryOfResidence: '',
    cityOfResidence: '',
    mobilityMethod: ''
  })
  const [documents, setDocuments] = useState([])
  const [errors, setErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
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
  const fmtDate = iso => {
    try {
      const d = new Date(iso)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    } catch {
      return ''
    }
  }
  const prettyDate = iso => {
    try {
      const v = iso && iso.$date ? iso.$date : iso
      const d = v ? new Date(v) : null
      return d
        ? d.toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })
        : ''
    } catch {
      return ''
    }
  }

  const validateStep1 = d => {
    const e = {}
    if (!String(d.firstName || '').trim()) e.firstName = 'Required'
    if (!String(d.surname || '').trim()) e.surname = 'Required'
    if (!String(d.dateOfBirth || '').trim()) e.dateOfBirth = 'Required'
    if (!String(d.gender || '').trim()) e.gender = 'Required'
    if (!String(d.passportNumber || '').trim()) e.passportNumber = 'Required'
    if (!String(d.maritalStatus || '').trim()) e.maritalStatus = 'Required'
    if (!String(d.passportExpiryDate || '').trim())
      e.passportExpiryDate = 'Required'
    if (!String(d.countryOfResidence || '').trim())
      e.countryOfResidence = 'Required'
    if (!String(d.cityOfResidence || '').trim()) e.cityOfResidence = 'Required'
    if (!String(d.mobilityMethod || '').trim()) e.mobilityMethod = 'Required'
    return e
  }

  useEffect(() => {
    const fetchDetail = async () => {
      if (!applicationId) return
      try {
        const res = await getVisaApplicationById(applicationId)
        const a = res?.data || {}
        setDetails({
          firstName: String(a.firstName || '').trim(),
          surname: String(a.lastName || '').trim(),
          middleName: String(a.middleName || '').trim(),
          dateOfBirth: fmtDate(a.dateOfBirth),
          gender: String(a.gender || '').trim(),
          passportNumber: String(a.passportNumber || '').trim(),
          maritalStatus: String(a.maritalStatus || '').trim(),
          passportExpiryDate: fmtDate(a.passportExpiryDate),
          hasNigerianPassport: '',
          countryOfResidence: String(a.countryOfResidence || '').trim(),
          cityOfResidence: String(a.cityOfResidence || '').trim(),
          mobilityMethod: String(a.preferredMobilityMethod || '').trim()
        })
        const docs = [
          {
            id: '1',
            title:
              'UpInvitation letter from family/friend in Nigeria accepting immigration responsibility (IR)',
            url: toImageSrc(a.invitationLetter)
          },
          {
            id: '2',
            title: 'Copy of Nigerian Passport of the Host or Residency',
            url: toImageSrc(a.hostPassportOrPermit)
          },
          {
            id: '3',
            title: 'Valid Passport (not less than 6 months validity)',
            url: toImageSrc(a.validPassport)
          },
          {
            id: '4',
            title: 'Passport size photo',
            url: toImageSrc(a.passportPhoto)
          },
          {
            id: '5',
            title: 'Evidence of return ticket',
            url: toImageSrc(a.returnTicket)
          },
          {
            id: '6',
            title:
              'Evidence of Hotel Reservations or host address in Nigeria (Verifiable Address).',
            url: toImageSrc(a.hotelOrHostAddressProof)
          },
          {
            id: '7',
            title:
              'Evidence of sufficient funds, 180 days Bank Statement must be provided.',
            url: toImageSrc(a.bankStatement180Days)
          }
        ].filter(d => d.url)
        setDocuments(docs)
      } catch {}
    }
    fetchDetail()
  }, [applicationId])

  return (
    <div className='space-y-7 py-6 px-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-start md:justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-2xl font-semibold text-slate-900'>
            View Visa Application
          </h1>
          <p className='text-sm text-[#99A1BC]'>
            Dashboard / Visa Applications / View
          </p>
        </div>
        <div className='flex items-center'>
          <button
            onClick={() => router.push('/visa/applications')}
            className='rounded-xl border border-[#E5E6EF] bg-white px-4 py-2 text-xs font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
          >
            <span className='flex items-center gap-1.5'>
              <ArrowLeft className='h-4 w-4' />
              Back to Visa Applications
            </span>
          </button>
        </div>
      </div>

      <div className='rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
        {/* <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-slate-900'>Application Details</h2>
          <div className='flex gap-3'>
            <button
              className='px-6 py-2.5 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg transition-colors hover:bg-gray-50'
              onClick={() => {
                const e = validateStep1(details)
                setErrors(e)
                if (Object.keys(e).length === 0) setCurrentStep(2)
              }}
            >
              Next
            </button>
            <button className='px-6 py-2.5 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg transition-colors hover:bg-gray-50'>
              Mark as Completed
            </button>
            <button className='px-6 py-2.5 bg-[#FF5B2C] hover:bg-[#F0481A] text-white font-medium rounded-lg transition-colors'>
              Send VISA on Mail
            </button>
          </div>
        </div> */}

        {currentStep === 1 && Object.keys(errors).length > 0 && (
          <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
            Please fill all required fields before proceeding.
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4'>
          <div>
            <div className='text-sm text-[#667085]'>First Name</div>
            <div className='text-sm font-semibold text-slate-900'>
              {details.firstName}
            </div>
            {errors.firstName && (
              <div className='text-xs text-red-600 mt-1'>
                {errors.firstName}
              </div>
            )}
          </div>
          <div>
            <div className='text-sm text-[#667085]'>Surname</div>
            <div className='text-sm font-semibold text-slate-900'>
              {details.surname}
            </div>
            {errors.surname && (
              <div className='text-xs text-red-600 mt-1'>{errors.surname}</div>
            )}
          </div>
          <div>
            <div className='text-sm text-[#667085]'>Middle Name</div>
            <div className='text-sm font-semibold text-slate-900'>
              {details.middleName}
            </div>
          </div>

          {/* <div>
            <div className='text-sm text-[#667085]'>Date of Birth</div>
            <div className='text-sm font-semibold text-slate-900'>{details.dateOfBirth}</div>
            {errors.dateOfBirth && <div className='text-xs text-red-600 mt-1'>{errors.dateOfBirth}</div>}
          </div> */}
          <div>
            <div className='text-sm text-[#667085]'>Gender</div>
            <div className='text-sm font-semibold text-slate-900'>
              {details.gender}
            </div>
            {errors.gender && (
              <div className='text-xs text-red-600 mt-1'>{errors.gender}</div>
            )}
          </div>
          <div>
            <div className='text-sm text-[#667085]'>Passport Number</div>
            <div className='text-sm font-semibold text-slate-900'>
              {details.passportNumber}
            </div>
            {errors.passportNumber && (
              <div className='text-xs text-red-600 mt-1'>
                {errors.passportNumber}
              </div>
            )}
          </div>

          <div>
            <div className='text-sm text-[#667085]'>Marital Status</div>
            <div className='text-sm font-semibold text-slate-900'>
              {details.maritalStatus}
            </div>
            {errors.maritalStatus && (
              <div className='text-xs text-red-600 mt-1'>
                {errors.maritalStatus}
              </div>
            )}
          </div>
          <div>
            <div className='text-sm text-[#667085]'>
              Passport Expiry Date (DD/MM/YY)
            </div>
            <div className='text-sm font-semibold text-slate-900'>
              {prettyDate(details.passportExpiryDate)}
            </div>
            {errors.passportExpiryDate && (
              <div className='text-xs text-red-600 mt-1'>
                {errors.passportExpiryDate}
              </div>
            )}
          </div>

          <div>
            <div className='text-sm text-[#667085]'>Country of Residence</div>
            <div className='text-sm font-semibold text-slate-900'>
              {details.countryOfResidence}
            </div>
            {errors.countryOfResidence && (
              <div className='text-xs text-red-600 mt-1'>
                {errors.countryOfResidence}
              </div>
            )}
          </div>
          <div>
            <div className='text-sm text-[#667085]'>City of Residence</div>
            <div className='text-sm font-semibold text-slate-900'>
              {details.cityOfResidence}
            </div>
            {errors.cityOfResidence && (
              <div className='text-xs text-red-600 mt-1'>
                {errors.cityOfResidence}
              </div>
            )}
          </div>
          <div>
            <div className='text-sm text-[#667085]'>
              Preferred Method of Mobility
            </div>
            <div className='text-sm font-semibold text-slate-900'>
              {details.mobilityMethod}
            </div>
            {errors.mobilityMethod && (
              <div className='text-xs text-red-600 mt-1'>
                {errors.mobilityMethod}
              </div>
            )}
          </div>
        </div>

        <div className='mt-6 border-t border-gray-200 pt-4'>
          <div className='inline-block rounded-md bg-black px-4 py-2 text-sm font-semibold text-white'>
            Uploaded Documents
          </div>
          <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4'>
            {documents.map(doc => (
              <div key={doc.id} className='space-y-2'>
                <div className='text-sm text-[#2D3658]'>{doc.title}</div>
                <a
                  href={doc.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm font-semibold text-[#0F4EF1] hover:underline'
                >
                  View Document
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
