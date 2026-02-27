'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import {
  getPodcastBookings,
  getPodcastSubscription
} from '@/services/podcast/podcast.service'
import PodcastBookingMetrics from './PodcastBookingMetrics'
import PodcastBookingList from './PodcastBookingList'
import Toast from '@/components/ui/Toast'

export default function PodcastBookings () {
  const params = useParams()
  const router = useRouter()
  const podcastId = params?.id

  const [loading, setLoading] = useState(true)
  const [podcast, setPodcast] = useState(null)
  const [bookings, setBookings] = useState([])
  const [metrics, setMetrics] = useState({
    totalSubscribers: 0,
    revenue: { count: 0, amount: '₦0' },
    expiring: { count: 0, amount: '₦0' }
  })
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'default'
  })

  useEffect(() => {
    fetchData()
  }, [podcastId])

  const fetchData = async () => {
    setLoading(true)
    try {
      let bookingsRes
      if (podcastId) {
        bookingsRes = await getPodcastSubscription(podcastId)
      } else {
        bookingsRes = await getPodcastBookings(podcastId)
      }

      // Handle Podcast Title
      const title =
        bookingsRes?.data?.bookings?.[0]?.subscriptionId?.podcastId?.title ||
        bookingsRes?.data?.subscriptions?.[0]?.podcastId?.title

      if (podcastId && title && !podcast?.title) {
        setPodcast({ title })
      }

      // Handle Bookings
      const bookingData = Array.isArray(bookingsRes?.data?.bookings)
        ? bookingsRes.data.bookings
        : Array.isArray(bookingsRes?.data?.subscriptions)
        ? bookingsRes.data.subscriptions
        : Array.isArray(bookingsRes?.data)
        ? bookingsRes.data
        : []

      const mappedBookings = bookingData.map(b => ({
        id: b._id || b.id,
        bookedOn: b.createdAt
          ? new Date(b.createdAt).toLocaleString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
            })
          : '-',
        userName:
          b.buyer?.fullName ||
          (b.user?.firstName
            ? `${b.user.firstName} ${b.user.lastName}`
            : b.user?.name || b.userName || 'Unknown User'),
        email: b.buyer?.email || b.user?.email || b.email || '-',
        phone: b.buyer?.phone || b.user?.phone || b.phoneNumber || '-',
        accessBooked:
          b.subscription?.subscriptionName ||
          b.subscriptionId?.subscriptionName ||
          b.planName ||
          'Standard Access',
        accessPrice:
          b.subscription?.subscriptionPrice ||
          b.subscriptionId?.subscriptionPrice ||
          b.amount ||
          0,
        amount: b.totalAmount || b.amount || 0,
        status: b.status || 'Pending',
        expiryDate: b.expiryDate
      }))

      setBookings(mappedBookings)
      calculateMetrics(mappedBookings, bookingsRes?.data?.stats)
    } catch (error) {
      console.error('Error fetching podcast data:', error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to load podcast data',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (data, apiStats) => {
    const totalSubscribers = data.length

    // Revenue Calculation
    const totalRevenue =
      apiStats?.totalRevenue ||
      data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

    // Expiring Calculation (15 days or above)
    const now = new Date()
    const fifteenDaysFromNow = new Date()
    fifteenDaysFromNow.setDate(now.getDate() + 15)

    const expiringItems = data.filter(item => {
      if (!item.expiryDate) return false
      const expiry = new Date(item.expiryDate)
      return expiry > now && expiry <= fifteenDaysFromNow
    })

    const expiringRevenue = expiringItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    )

    setMetrics({
      totalSubscribers,
      revenue: {
        count: data.length,
        amount: `₦${Number(totalRevenue).toLocaleString()}`
      },
      expiring: {
        count: apiStats?.expiringSubscriptionCount || expiringItems.length,
        amount: `₦${Number(expiringRevenue).toLocaleString()}`
      }
    })
  }

  if (loading) {
    return (
      <div className='p-8 flex justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <Toast
        open={toast.open}
        onOpenChange={open => setToast(prev => ({ ...prev, open }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
      />

      {/* Header */}
      <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Podcast{' '}
            {podcastId && (
              <span className='text-[#FF4400]'>
                ({podcast?.title || 'Loading...'})
              </span>
            )}
          </h1>
          <nav className='mt-1 text-sm text-gray-500'>
            <span
              className='hover:text-gray-700 cursor-pointer'
              onClick={() => router.push('/podcast')}
            >
              Dashboard
            </span>
            <span className='mx-2'>/</span>
            <span className='text-gray-900'>Subscriptions</span>
          </nav>
        </div>
        <button
          onClick={() => router.back()}
          className='rounded-xl border border-[#E5E6EF] bg-white px-4 py-2 text-xs font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
        >
          <span className='flex items-center gap-1.5'>
            <ArrowLeft className='h-4 w-4' />
            Back
          </span>
        </button>
      </div>

      <PodcastBookingMetrics metrics={metrics} />

      <PodcastBookingList bookings={bookings} />
    </div>
  )
}
