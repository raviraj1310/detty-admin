'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  accommodationCount,
  esimCount,
  leadwayCount,
  rideCount
} from '@/services/auth/login.service'

const MetricCard = ({
  label,
  value,
  subText,
  bgColor,
  iconBg,
  textColor = 'text-gray-900',
  iconSrc,
  trend,
  className = ''
}) => (
  <div className={`${bgColor} rounded-lg p-2.5 flex items-center gap-2 w-full`}>
    <div className={`${iconBg} p-2 rounded-lg flex-shrink-0`}>
      <img src={iconSrc} alt={label} className='w-5 h-5' />
    </div>
    <div className='flex-1 min-w-0'>
      <p className='text-[10px] font-medium text-gray-600 mb-0.5'>{label}</p>
      <p className={`text-lg font-bold ${textColor} truncate`}>{value}</p>
      {subText && (
        <p className='text-[9px] text-gray-500 whitespace-nowrap'>{subText}</p>
      )}
      {trend && (
        <div
          className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend.isPositive ? (
            <TrendingUp size={12} />
          ) : (
            <TrendingDown size={12} />
          )}
          <span>{trend.text}</span>
        </div>
      )}
    </div>
  </div>
)

const SectionCard = ({ title, viewLink, children, compact = false }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
      compact ? '' : 'h-full'
    } flex flex-col`}
  >
    <div className='flex items-center justify-between p-2.5 pb-2 border-b border-gray-100'>
      <h2 className='text-sm font-semibold text-gray-900'>{title}</h2>
      <Link
        href={viewLink}
        className='px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-100 rounded-lg transition-colors'
      >
        View List
      </Link>
    </div>
    <div className='p-2.5 pt-2'>{children}</div>
  </div>
)

const EngagementCard = ({
  label,
  value,
  bgColor,
  iconBg,
  iconSrc,
  viewLink
}) => (
  <div
    className={`${bgColor} rounded-lg p-2.5 flex items-center justify-between w-full`}
  >
    <div className='flex items-center gap-2'>
      <div className={`${iconBg} p-2 rounded-lg flex-shrink-0`}>
        <img src={iconSrc} alt={label} className='w-5 h-5' />
      </div>
      <div>
        <p className='text-[10px] font-medium text-gray-600 mb-0.5'>{label}</p>
        <p className='text-lg font-bold text-gray-900'>{value}</p>
      </div>
    </div>
    <Link
      href={viewLink}
      className='px-2 py-1 text-[10px] font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1'
    >
      View List
      <img
        src='/images/dashboard/arrow.svg'
        alt='Arrow'
        className='w-2.5 h-2.5'
      />
    </Link>
  </div>
)

const formatCurrency = amount => {
  return (
    '₦' +
    (Number(amount) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  )
}

export default function AdditionalDashboard ({ stats }) {
  const [staySummary, setStaySummary] = useState(null)
  const [esimSummary, setEsimSummary] = useState(null)
  const [rideSummary, setRideSummary] = useState(null)
  const [leadwaySummary, setLeadwaySummary] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await accommodationCount({})
        if (res?.success && res?.data) {
          setStaySummary({
            totalBookingCount: Number(res.data.totalBookingCount || 0),
            totalRevenue: Number(res.data.totalRevenue || 0)
          })
        } else {
          setStaySummary(null)
        }
      } catch (error) {
        console.error('Error loading stay dashboard data:', error)
        setStaySummary(null)
      }

      try {
        const resEsim = await esimCount({})
        if (resEsim?.success && resEsim?.data) {
          setEsimSummary({
            totalBookingCount: Number(resEsim.data.totalBookingCount || 0),
            totalRevenue: Number(resEsim.data.totalRevenue || 0)
          })
        } else {
          setEsimSummary(null)
        }
      } catch (error) {
        console.error('Error loading esim dashboard data:', error)
        setEsimSummary(null)
      }

      try {
        const resRide = await rideCount({})
        if (resRide?.success && resRide?.data) {
          setRideSummary({
            totalBookingCount: Number(resRide.data.totalBookingCount || 0),
            totalRevenue: Number(resRide.data.totalRevenue || 0)
          })
        } else {
          setRideSummary(null)
        }
      } catch (error) {
        console.error('Error loading ride dashboard data:', error)
        setRideSummary(null)
      }

      try {
        const resLeadway = await leadwayCount({})
        if (resLeadway?.success && resLeadway?.data) {
          setLeadwaySummary({
            totalBookingCount: Number(resLeadway.data.totalBookingCount || 0),
            totalRevenue: Number(resLeadway.data.totalRevenue || 0)
          })
        } else {
          setLeadwaySummary(null)
        }
      } catch (error) {
        console.error('Error loading leadway dashboard data:', error)
        setLeadwaySummary(null)
      }
    }
    load()
  }, [])

  const accommodations =
    (staySummary && staySummary.totalBookingCount) ||
    stats?.totalAccommodations ||
    0
  const accommodationRevenue = formatCurrency(
    (staySummary && staySummary.totalRevenue) ||
      stats?.totalAccommodationRevenue
  )
  const esims =
    (esimSummary && esimSummary.totalBookingCount) || stats?.totalEsims || 0
  const esimRevenue = formatCurrency(
    (esimSummary && esimSummary.totalRevenue) || stats?.totalEsimRevenue
  )
  const rides =
    (rideSummary && rideSummary.totalBookingCount) || stats?.totalRide || 0
  const rideRevenue = formatCurrency(
    (rideSummary && rideSummary.totalRevenue) || stats?.totalRideRevenue
  )
  const leadway =
    (leadwaySummary && leadwaySummary.totalBookingCount) ||
    stats?.totalLeadWay ||
    0
  const leadwayRevenue = formatCurrency(
    (leadwaySummary && leadwaySummary.totalRevenue) ||
      stats?.totalLeadWayRevenue
  )
  const drugStore = stats?.totalMed || 0
  const drugStoreRevenue = formatCurrency(stats?.totalMedRevenue)
  const royalConcierge = stats?.totalRoyal || 0
  const royalConciergeRevenue = formatCurrency(stats?.totalRoyalRevenue)
  const visaApplications = stats?.totalVisaAppition || 0
  const visaSettled = stats?.totalVisaSettled || 0
  const walletAmount = '₦0' // Not provided in API
  const emailSubscribers = stats?.totalEmailSubscribers || 0
  const contactEnquiries = stats?.totalContacts || 0
  const eventEnquiries = stats?.totalInquiries || 0

  const getGrowthCards = (key, title = 'New Yesterday') => {
    const data = stats?.growth?.[key] || {}
    const avgCount = Number(data.avgDailyGrowthCount) || 0
    const avgPercent = parseFloat(data.avgDailyGrowthPercent) || 0
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })

    return [
      {
        id: `growth-${key}-new`,
        label: title,
        value: data.newYesterday || 0,
        subText: `(${yesterdayStr})`,
        iconSrc: '/images/dashboard/trending_up.svg',
        bgColor: 'bg-[#E8EEFF]',
        iconBg: 'bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]'
      },
      {
        id: `growth-${key}-avg-count`,
        label: 'Avg Daily Growth (Count)',
        value: data.avgDailyGrowthCount || 0,
        trend: {
          isPositive: avgCount >= 0,
          text: avgCount >= 0 ? 'Increasing' : 'Decreasing'
        },
        iconSrc: '/images/dashboard/trending_up.svg',
        bgColor: 'bg-[#F0E8FF]',
        iconBg: 'bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]'
      },
      {
        id: `growth-${key}-avg-pct`,
        label: 'Avg Daily Growth (%)',
        value: data.avgDailyGrowthPercent || '0.00%',
        trend: {
          isPositive: avgPercent >= 0,
          text: avgPercent >= 0 ? 'Increasing' : 'Decreasing'
        },
        iconSrc: '/images/dashboard/icons (1).svg',
        bgColor: 'bg-[#E8F8F0]',
        iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
      }
    ]
  }

  return (
    <div className='space-y-2'>
      {/* Row 1: Accommodations & eSims */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
        <SectionCard title='Accommodations' viewLink='/users/accommodation'>
          <div className='grid grid-cols-2 gap-2'>
            <MetricCard
              label='Total Accommodations'
              value={accommodations}
              bgColor='bg-[#E0F2FE]'
              iconBg='bg-gradient-to-r from-[#7DD3FC] to-[#0EA5E9]'
              iconSrc='/images/dashboard/icons (14).svg'
            />
            {getGrowthCards('accommodations').map(card => (
              <MetricCard key={card.id} {...card} />
            ))}
            <MetricCard
              label='Revenue'
              value={accommodationRevenue}
              bgColor='bg-[#E8F8F0]'
              iconBg='bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
              iconSrc='/images/dashboard/icons (1).svg'
              className='col-span-2'
            />
          </div>
        </SectionCard>

        <SectionCard title='eSims' viewLink='/users/e-sim'>
          <div className='flex flex-wrap gap-2'>
            <MetricCard
              label='Total eSims'
              value={esims}
              bgColor='bg-[#FFF4E8]'
              iconBg='bg-gradient-to-r from-[#FFD8A8] to-[#F76707]'
              iconSrc='/images/dashboard/icons (19).svg'
            />
            {getGrowthCards('internetConnectivity').map(card => (
              <MetricCard key={card.id} {...card} />
            ))}
            <MetricCard
              label='Revenue'
              value={esimRevenue}
              bgColor='bg-[#E8F8F0]'
              iconBg='bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
              iconSrc='/images/dashboard/icons (1).svg'
              className='col-span-2'
            />
          </div>
        </SectionCard>
      </div>

      {/* Row 2: Rides & Leadway */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
        <SectionCard title='Rides' viewLink='/users/rides'>
          <div className='flex flex-wrap gap-2'>
            <MetricCard
              label='Total Rides'
              value={rides}
              bgColor='bg-[#FFE8F5]'
              iconBg='bg-gradient-to-r from-[#FFADD2] to-[#E91E8C]'
              iconSrc='/images/dashboard/icons (10).svg'
            />
            {getGrowthCards('rides').map(card => (
              <MetricCard key={card.id} {...card} />
            ))}
            <MetricCard
              label='Revenue'
              value={rideRevenue}
              bgColor='bg-[#E8F8F0]'
              iconBg='bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
              iconSrc='/images/dashboard/icons (1).svg'
              className='col-span-2'
            />
          </div>
        </SectionCard>

        <SectionCard title='Leadway' viewLink='/leadway'>
          <div className='flex flex-wrap gap-2'>
            <MetricCard
              label='Total Leadway'
              value={leadway}
              bgColor='bg-[#F0E8FF]'
              iconBg='bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]'
              iconSrc='/images/dashboard/icons (8).svg'
            />
            {getGrowthCards('leadway').map(card => (
              <MetricCard key={card.id} {...card} />
            ))}
            <MetricCard
              label='Revenue'
              value={leadwayRevenue}
              bgColor='bg-[#E8F8F0]'
              iconBg='bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
              iconSrc='/images/dashboard/icons (1).svg'
              className='col-span-2'
            />
          </div>
        </SectionCard>
      </div>

      {/* Row 3: Med Plus - Drug Store & Consultation */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
        <SectionCard title='Med Plus - Drug Store' viewLink='/med-orders'>
          <div className='flex flex-wrap gap-2'>
            <MetricCard
              label='Total Drug Store'
              value={drugStore}
              bgColor='bg-[#E0F2FE]'
              iconBg='bg-gradient-to-r from-[#7DD3FC] to-[#0EA5E9]'
              iconSrc='/images/dashboard/icons (17).svg'
            />
            {getGrowthCards('medPlus').map(card => (
              <MetricCard key={card.id} {...card} />
            ))}
            <MetricCard
              label='Revenue'
              value={drugStoreRevenue}
              bgColor='bg-[#E8F8F0]'
              iconBg='bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
              iconSrc='/images/dashboard/icons (1).svg'
              className='col-span-2'
            />
          </div>
        </SectionCard>

        <SectionCard title='Royal Concierge' viewLink='/royal-concierge'>
          <div className='flex flex-wrap gap-2'>
            <MetricCard
              label='Total Royal Concierge'
              value={royalConcierge}
              bgColor='bg-[#FFF4E8]'
              iconBg='bg-gradient-to-r from-[#FFD8A8] to-[#F76707]'
              iconSrc='/images/dashboard/icons (18).svg'
            />
            {getGrowthCards('royalConcierge').map(card => (
              <MetricCard key={card.id} {...card} />
            ))}
            <MetricCard
              label='Revenue'
              value={royalConciergeRevenue}
              bgColor='bg-[#E8F8F0]'
              iconBg='bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
              iconSrc='/images/dashboard/icons (1).svg'
              className='col-span-2'
            />
          </div>
        </SectionCard>
      </div>

      {/* Row 4: Visa, Wallet & Engagement - 2 Column Layout */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
        {/* Left Column: Visa & Wallet */}
        <div className='space-y-2'>
          <SectionCard title='Visa Applications' viewLink='/visa' compact>
            <div className='flex flex-wrap gap-2'>
              <MetricCard
                label='Total Applications Received'
                value={visaApplications}
                bgColor='bg-[#E8EEFF]'
                iconBg='bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]'
                iconSrc='/images/dashboard/icons (4).svg'
              />
              <MetricCard
                label='Total Settled'
                value={visaSettled}
                bgColor='bg-[#E8F8F0]'
                iconBg='bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
                iconSrc='/images/dashboard/icons (9).svg'
              />
              {getGrowthCards('visaApplications').map(card => (
                <MetricCard key={card.id} {...card} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title='Wallet' viewLink='/users/wallet' compact>
            <MetricCard
              label='Total Amount'
              value={walletAmount}
              bgColor='bg-[#E8F8F0]'
              iconBg='bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
              iconSrc='/images/dashboard/icons (1).svg'
            />
          </SectionCard>
        </div>

        {/* Right Column: Engagement & Enquiries */}
        <SectionCard title='Engagement & Enquiries' viewLink='/inquiries'>
          <div className='space-y-2'>
            <EngagementCard
              label='Email Subscribers'
              value={emailSubscribers}
              bgColor='bg-[#E8EEFF]'
              iconBg='bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]'
              iconSrc='/images/dashboard/icons (17).svg'
              viewLink='/email-subscription'
            />
            <EngagementCard
              label='Contact Enquiries'
              value={contactEnquiries}
              bgColor='bg-[#F0E8FF]'
              iconBg='bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]'
              iconSrc='/images/dashboard/icons (12).svg'
              viewLink='/contact'
            />
            <EngagementCard
              label='Event/ Activities Enquiries'
              value={eventEnquiries}
              bgColor='bg-[#FFF4E8]'
              iconBg='bg-gradient-to-r from-[#FFD8A8] to-[#F76707]'
              iconSrc='/images/dashboard/icons (14).svg'
              viewLink='/inquiries'
            />
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
