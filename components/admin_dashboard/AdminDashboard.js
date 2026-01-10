'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  dashboardUserActiveInactiveCounts,
  transactionCounts
} from '@/services/auth/login.service'

const formatCurrency = amount => {
  return (
    '₦' +
    (Number(amount) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  )
}

// --- 2. Stat Card Component ---

const StatCard = ({ stat }) => {
  return (
    <div
      className={`flex items-center gap-2 flex-1 rounded-md p-1.5 transition-all min-w-[140px] ${stat.bg} shadow-sm hover:shadow-md`}
    >
      <div className={`p-1.5 rounded-lg flex-shrink-0 ${stat.iconBg}`}>
        <img src={stat.iconSrc} alt={stat.title} className='w-5 h-5' />
      </div>
      <div className='flex flex-col'>
        <p className='text-[10px] font-medium text-gray-600 mb-0.5'>
          {stat.title}
        </p>
        <p className='text-sm font-bold text-gray-900'>{stat.value}</p>
        {stat.subText && (
          <p className='text-[9px] text-gray-500 mt-0.5 whitespace-nowrap'>
            {stat.subText}
          </p>
        )}
      </div>
    </div>
  )
}

// --- 3. Dashboard Section Component ---

const DashboardSection = ({ section }) => (
  <div className='bg-white rounded-xl shadow-sm p-2.5 flex flex-col space-y-2 border border-gray-100 h-full'>
    {/* Header */}
    <div className='flex justify-between items-center pb-2 border-b border-gray-100'>
      <h2 className='text-sm font-semibold text-gray-900'>{section.title}</h2>
      <Link
        href={section.viewLink}
        className='px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-100 rounded-lg transition-colors'
      >
        View List
      </Link>
    </div>

    {/* Content (Stat Cards) */}
    <div className='flex flex-wrap sm:flex-row gap-2 pt-1'>
      {section.stats.map(stat => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  </div>
)

// --- 4. Main Dashboard Component ---

export default function AdminDashboard ({ stats }) {
  const [userCounts, setUserCounts] = useState({
    totalUsers: 0,
    totalActiveUsers: 0,
    totalInactiveUsers: 0
  })
  const [txnCounts, setTxnCounts] = useState({
    event: 0,
    activity: 0,
    merchandise: 0,
    ride: 0,
    accommodation: 0,
    leadway: 0,
    royalConcierge: 0,
    esim: 0
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardUserActiveInactiveCounts()
        setUserCounts({
          totalUsers: Number(res?.data?.totalUserCount || 0),
          totalActiveUsers: Number(res?.data?.activeUserCount || 0),
          totalInactiveUsers: Number(res?.data?.inactiveUserCount || 0)
        })
      } catch (_) {
        setUserCounts({
          totalUsers: Number(stats?.totalUsers || 0),
          totalActiveUsers: Number(stats?.totalActiveUsers || 0),
          totalInactiveUsers: Number(stats?.totalInactiveUsers || 0)
        })
      }

      try {
        const txnRes = await transactionCounts()
        const counts = txnRes?.data?.counts || {}
        setTxnCounts({
          event: counts.event || 0,
          activity: counts.activity || 0,
          merchandise: counts.merchandise || 0,
          ride: counts.ride || 0,
          accommodation: counts.accommodation || 0,
          leadway: counts.leadway || 0,
          royalConcierge: counts.royalConcierge || 0,
          esim: counts.esim || 0
        })
      } catch (error) {
        console.error('Error loading transaction counts:', error)
      }
    }
    load()
  }, [])
  // Calculate total bookings and revenue if needed
  const totalBookings =
    (stats?.totalEvents || 0) +
    (stats?.totalActivity || 0) +
    (stats?.totalAccommodations || 0) +
    (stats?.totalEsims || 0) +
    (stats?.totalRide || 0) +
    (stats?.totalLeadWay || 0) +
    (stats?.totalMed || 0) +
    (stats?.totalRoyal || 0) +
    (stats?.totalVisaAppition || 0)

  const totalRevenue =
    (stats?.totalEventRevenue || 0) +
    (stats?.totalActivityRevenue || 0) +
    (stats?.totalProductsRevenue || 0) +
    (stats?.totalAccommodationRevenue || 0) +
    (stats?.totalEsimRevenue || 0) +
    (stats?.totalRideRevenue || 0) +
    (stats?.totalLeadWayRevenue || 0) +
    (stats?.totalMedRevenue || 0) +
    (stats?.totalRoyalRevenue || 0)

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
        title: title,
        value: data.newYesterday || 0,
        subText: `(${yesterdayStr})`,
        iconSrc: '/images/dashboard/trending_up.svg',
        bg: 'bg-[#E8EEFF]',
        iconBg: 'bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]'
      },
      {
        id: `growth-${key}-avg-count`,
        title: 'Avg Daily Growth (Count)',
        value: data.avgDailyGrowthCount || 0,
        trend: {
          isPositive: avgCount >= 0,
          text: avgCount >= 0 ? 'Increasing' : 'Decreasing'
        },
        iconSrc: '/images/dashboard/trending_up.svg',
        bg: 'bg-[#F0E8FF]',
        iconBg: 'bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]'
      },
      {
        id: `growth-${key}-avg-pct`,
        title: 'Avg Daily Growth (%)',
        value: data.avgDailyGrowthPercent || '0.00%',
        trend: {
          isPositive: avgPercent >= 0,
          text: avgPercent >= 0 ? 'Increasing' : 'Decreasing'
        },
        iconSrc: '/images/dashboard/trending_up.svg',
        bg: 'bg-[#E8F8F0]',
        iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
      }
    ]
  }

  const dashboardData = [
    {
      title: 'Users',
      viewLink: '/users',
      stats: [
        {
          id: 'tu',
          title: 'Total Users',
          value: userCounts.totalUsers || 0,
          iconSrc: '/images/dashboard/icons (13).svg',
          bg: 'bg-[#E8EEFF]',
          iconBg: 'bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]'
        },
        {
          id: 'au',
          title: 'Active Users (Logged in the last 10 days)',
          value: userCounts.totalActiveUsers || 0,
          iconSrc: '/images/dashboard/icons (9).svg',
          bg: 'bg-[#E8F8F0]',
          iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
        },
        {
          id: 'iu',
          title: 'Inactive Users (Not logged in the last 10 days)',
          value: userCounts.totalInactiveUsers || 0,
          iconSrc: '/images/dashboard/icons (11).svg',
          bg: 'bg-[#FFE8E8]',
          iconBg: 'bg-gradient-to-r from-[#FFA8A8] to-[#E03E3E]'
        },
        ...getGrowthCards('users', 'New Registrations Yesterday')
      ]
    },
    {
      title: 'Bookings',
      viewLink: '/users/transactions',
      stats: [
        {
          id: 'tb',
          title: 'Total Bookings',
          value: totalBookings,
          iconSrc: '/images/dashboard/icons (6).svg',
          bg: 'bg-[#F0E8FF]',
          iconBg: 'bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]'
        },
        {
          id: 'br',
          title: 'Revenue',
          value: formatCurrency(totalRevenue),
          iconSrc: '/images/dashboard/icons (1).svg',
          bg: 'bg-[#E8F8F0]',
          iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
        },
        ...getGrowthCards('bookings')
      ]
    },
    {
      title: 'Transaction History Counts (Last 10 days)',
      viewLink: '/users/transactions',
      stats: [
        {
          id: 'th-ev',
          title: 'Event',
          value: txnCounts.event,
          iconSrc: '/images/dashboard/icons (15).svg',
          bg: 'bg-[#FFE8F5]',
          iconBg: 'bg-gradient-to-r from-[#FFADD2] to-[#E91E8C]'
        },
        {
          id: 'th-ac',
          title: 'Activity',
          value: txnCounts.activity,
          iconSrc: '/images/dashboard/icons (4).svg',
          bg: 'bg-[#FFF4E8]',
          iconBg: 'bg-gradient-to-r from-[#FFD8A8] to-[#F76707]'
        },
        {
          id: 'th-me',
          title: 'Merchandise',
          value: txnCounts.merchandise,
          iconSrc: '/images/dashboard/icons (6).svg',
          bg: 'bg-[#F0E8FF]',
          iconBg: 'bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]'
        },
        {
          id: 'th-ri',
          title: 'Ride',
          value: txnCounts.ride,
          iconSrc: '/images/dashboard/icons (13).svg',
          bg: 'bg-[#E8EEFF]',
          iconBg: 'bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]'
        },
        {
          id: 'th-acc',
          title: 'Accommodation',
          value: txnCounts.accommodation,
          iconSrc: '/images/dashboard/icons (11).svg',
          bg: 'bg-[#FFE8E8]',
          iconBg: 'bg-gradient-to-r from-[#FFA8A8] to-[#E03E3E]'
        },
        {
          id: 'th-lw',
          title: 'Leadway',
          value: txnCounts.leadway,
          iconSrc: '/images/dashboard/icons (9).svg',
          bg: 'bg-[#E8F8F0]',
          iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
        },
        {
          id: 'th-rc',
          title: 'Royal Concierge',
          value: txnCounts.royalConcierge,
          iconSrc: '/images/dashboard/icons (15).svg',
          bg: 'bg-[#FFE8F5]',
          iconBg: 'bg-gradient-to-r from-[#FFADD2] to-[#E91E8C]'
        },
        {
          id: 'th-es',
          title: 'Esim',
          value: txnCounts.esim,
          iconSrc: '/images/dashboard/icons (4).svg',
          bg: 'bg-[#FFF4E8]',
          iconBg: 'bg-gradient-to-r from-[#FFD8A8] to-[#F76707]'
        }
      ]
    },
    {
      title: 'Events',
      viewLink: '/discover-events',
      stats: [
        {
          id: 'te',
          title: 'Total Events',
          value: stats?.totalEvents || 0,
          iconSrc: '/images/dashboard/icons (15).svg',
          bg: 'bg-[#FFE8F5]',
          iconBg: 'bg-gradient-to-r from-[#FFADD2] to-[#E91E8C]'
        },
        {
          id: 'er',
          title: 'Revenue',
          value: formatCurrency(stats?.totalEventRevenue),
          iconSrc: '/images/dashboard/icons (1).svg',
          bg: 'bg-[#E8F8F0]',
          iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
        },
        ...getGrowthCards('events')
      ]
    },
    {
      title: 'Places To Visit/ Activities',
      viewLink: '/places-to-visit',
      stats: [
        {
          id: 'ta',
          title: 'Total Activities',
          value: stats?.totalActivity || 0,
          iconSrc: '/images/dashboard/icons (4).svg',
          bg: 'bg-[#FFF4E8]',
          iconBg: 'bg-gradient-to-r from-[#FFD8A8] to-[#F76707]'
        },
        {
          id: 'ar',
          title: 'Revenue',
          value: formatCurrency(stats?.totalActivityRevenue),
          iconSrc: '/images/dashboard/icons (1).svg',
          bg: 'bg-[#E8F8F0]',
          iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
        },
        ...getGrowthCards('activities')
      ]
    }
  ]

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
      {dashboardData.map((section, index) => (
        <DashboardSection key={index} section={section} />
      ))}
    </div>
  )
}
