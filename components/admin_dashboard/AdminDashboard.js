
'use client'

import React from 'react'
import Link from 'next/link'

// --- 1. Data Structure ---

const dashboardData = [
  {
    title: 'Users',
    viewLink: '/users',
    stats: [
      { 
        id: 'tu', 
        title: 'Total Users', 
        value: '1540', 
        iconSrc: '/images/dashboard/icons (13).svg',
        bg: 'bg-[#E8EEFF]', 
        iconBg: 'bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]'
      },
      { 
        id: 'au', 
        title: 'Active Users', 
        value: '1240', 
        iconSrc: '/images/dashboard/icons (9).svg',
        bg: 'bg-[#E8F8F0]', 
        iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
      },
      { 
        id: 'iu', 
        title: 'Inactive Users', 
        value: '100', 
        iconSrc: '/images/dashboard/icons (11).svg',
        bg: 'bg-[#FFE8E8]', 
        iconBg: 'bg-gradient-to-r from-[#FFA8A8] to-[#E03E3E]'
      },
    ],
  },
  {
    title: 'Bookings',
    viewLink: '/users/transactions',
    stats: [
      { 
        id: 'tb', 
        title: 'Total Bookings', 
        value: '1540', 
        iconSrc: '/images/dashboard/icons (6).svg',
        bg: 'bg-[#F0E8FF]', 
        iconBg: 'bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]'
      },
      { 
        id: 'br', 
        title: 'Revenue', 
        value: '₦9,00,000', 
        iconSrc: '/images/dashboard/icons (1).svg',
        bg: 'bg-[#E8F8F0]', 
        iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
      },
    ],
  },
  {
    title: 'Events',
    viewLink: '/discover-events',
    stats: [
      { 
        id: 'te', 
        title: 'Total Events', 
        value: '1217', 
        iconSrc: '/images/dashboard/icons (15).svg',
        bg: 'bg-[#FFE8F5]', 
        iconBg: 'bg-gradient-to-r from-[#FFADD2] to-[#E91E8C]'
      },
      { 
        id: 'er', 
        title: 'Revenue', 
        value: '₦9,00,000', 
        iconSrc: '/images/dashboard/icons (1).svg',
        bg: 'bg-[#E8F8F0]', 
        iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
      },
    ],
  },
  {
    title: 'Places To Visit/ Activities',
    viewLink: '/places-to-visit',
    stats: [
      { 
        id: 'ta', 
        title: 'Total Activities', 
        value: '1217', 
        iconSrc: '/images/dashboard/icons (4).svg',
        bg: 'bg-[#FFF4E8]', 
        iconBg: 'bg-gradient-to-r from-[#FFD8A8] to-[#F76707]'
      },
      { 
        id: 'ar', 
        title: 'Revenue', 
        value: '₦9,00,000', 
        iconSrc: '/images/dashboard/icons (1).svg',
        bg: 'bg-[#E8F8F0]', 
        iconBg: 'bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]'
      },
    ],
  },
];

// --- 2. Stat Card Component ---

const StatCard = ({ stat }) => {
  return (
    <div className={`flex items-center gap-3 flex-1 rounded-md p-2 transition-all min-w-[164px] ${stat.bg} shadow-sm hover:shadow-md`}>
      <div className={`p-2 rounded-lg flex-shrink-0 ${stat.iconBg}`}>
        <img 
          src={stat.iconSrc} 
          alt={stat.title}
          className="w-7 h-7"
        />
      </div>
      <div className="flex flex-col">
        <p className="text-xs font-medium text-gray-600 mb-1">
          {stat.title}
        </p>
        <p className="text-lg font-bold text-gray-900">
          {stat.value}
        </p>
      </div>
    </div>
  );
};

// --- 3. Dashboard Section Component ---

const DashboardSection = ({ section }) => (
  <div className="bg-white rounded-2xl shadow-sm p-3 flex flex-col space-y-4 border border-gray-100 h-full">
    {/* Header */}
    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
      <Link 
        href={section.viewLink}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-100 rounded-lg transition-colors"
      >
        View List
      </Link>
    </div>

    {/* Content (Stat Cards) */}
    <div className="flex flex-wrap sm:flex-row gap-4 pt-2">
      {section.stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  </div>
);


// --- 4. Main Dashboard Component ---

export default function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {dashboardData.map((section, index) => (
        <DashboardSection key={index} section={section} />
      ))}
    </div>
  );
}
