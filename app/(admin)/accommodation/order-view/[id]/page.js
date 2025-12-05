'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, Tag } from 'lucide-react'

const toCurrency = n => {
  try { return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(n) || 0) } catch { const x = Number(n)||0; return `₦${x.toLocaleString('en-NG')}` }
}

const formatDate = iso => {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return '-'
  try {
    const opts = { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }
    return d.toLocaleString('en-NG', opts)
  } catch { return d.toISOString() }
}

export default function AccommodationOrderViewPage () {
  const params = useParams()
  const router = useRouter()
  const id = params?.id

  const data = useMemo(() => ({
    orderId: String(id || 'ACCOM-0001'),
    userName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+234 800 000 0000',
    propertyName: 'Detty Suites, Victoria Island',
    roomType: 'Deluxe Room',
    checkIn: formatDate('2025-12-15T14:00:00Z'),
    checkOut: formatDate('2025-12-18T10:00:00Z'),
    guests: 2,
    amount: toCurrency(185000),
    status: 'Pending'
  }), [id])

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      <div className='max-w-4xl mx-auto'>
        <button onClick={() => router.back()} className='mb-4 flex items-center gap-2 text-sm text-[#5E6582] hover:text-[#1A1F3F] transition-colors'>
          <ArrowLeft className='h-4 w-4' />
          Back to Orders
        </button>

        <div className='bg-white rounded-2xl overflow-hidden shadow-lg border border-[#E1E6F7]'>
          <div className='bg-black px-6 py-4 flex justify-between items-center'>
            <div className='relative w-32 h-10'>
              <Image src='/images/logo/fotter_logo.webp' alt='Access Bank Detty Fusion' fill className='object-contain' unoptimized />
            </div>
            <div className='text-white text-right text-sm'>
              <div className='font-medium'>Order ID: {data.orderId}</div>
              <div className='text-white/80'>Issued on: {formatDate(new Date())}</div>
            </div>
          </div>

          <div className='p-6'>
            <div className='flex items-start gap-4 mb-6'>
              <div className='relative w-24 h-24 rounded-xl overflow-hidden border border-[#E5E6EF] bg-white'>
                <Image src='/images/accomodation/accomodation  (1).webp' alt={data.propertyName} fill className='object-cover' unoptimized />
              </div>
              <div className='flex-1'>
                <div className='text-xl font-bold text-slate-900 mb-1'>Accommodation Booking</div>
                <div className='text-sm text-[#5E6582] mb-1'>{data.userName}</div>
                <div className='text-xs text-[#8B93AF]'>{data.email} • {data.phone}</div>
                <div className='mt-2'>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${/completed/i.test(data.status) ? 'bg-green-100 text-green-800' : /pending/i.test(data.status) ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{data.status}</span>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6'>
              <div className='rounded-xl border border-[#E5E6EF] bg-white p-4'>
                <div className='text-[#5E6582]'>Property</div>
                <div className='text-right font-semibold text-slate-900'>{data.propertyName}</div>
              </div>
              <div className='rounded-xl border border-[#E5E6EF] bg-white p-4'>
                <div className='text-[#5E6582]'>Room Type</div>
                <div className='text-right font-semibold text-slate-900'>{data.roomType}</div>
              </div>
              <div className='rounded-xl border border-[#E5E6EF] bg-white p-4'>
                <div className='text-[#5E6582]'>Check-in</div>
                <div className='text-right font-semibold text-slate-900'>{data.checkIn}</div>
              </div>
              <div className='rounded-xl border border-[#E5E6EF] bg-white p-4'>
                <div className='text-[#5E6582]'>Check-out</div>
                <div className='text-right font-semibold text-slate-900'>{data.checkOut}</div>
              </div>
              <div className='rounded-xl border border-[#E5E6EF] bg-white p-4'>
                <div className='text-[#5E6582]'>Guests</div>
                <div className='text-right font-semibold text-slate-900'>{data.guests}</div>
              </div>
              <div className='rounded-xl border border-[#E5E6EF] bg-white p-4'>
                <div className='text-[#5E6582]'>Total</div>
                <div className='flex items-center justify-end gap-2 text-lg font-bold text-slate-900'><Tag className='h-5 w-5 text-orange-500' />{data.amount}</div>
              </div>
            </div>

            <div className='rounded-xl border border-[#E5E6EF] bg-white'>
              <div className='p-4 border-b border-[#EEF1FA]'>
                <div className='text-sm font-semibold text-slate-900'>Guest Details</div>
              </div>
              <div className='p-4 text-sm'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='text-[#5E6582]'>Name</div>
                  <div className='text-right font-semibold text-slate-900'>{data.userName}</div>
                  <div className='text-[#5E6582]'>Email</div>
                  <div className='text-right font-semibold text-slate-900'>{data.email}</div>
                  <div className='text-[#5E6582]'>Phone</div>
                  <div className='text-right font-semibold text-slate-900'>{data.phone}</div>
                </div>
              </div>
            </div>
          </div>

          <div className='h-1 bg-[#FF5B2C]'></div>
        </div>
      </div>
    </div>
  )
}

