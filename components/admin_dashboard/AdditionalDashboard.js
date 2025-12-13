'use client'

import { useState } from 'react'
import Link from 'next/link'

const MetricCard = ({ label, value, bgColor, iconBg, textColor = 'text-gray-900', iconSrc }) => (
  <div className={`${bgColor} rounded-xl p-4 flex items-center gap-3 w-full`}>
    <div className={`${iconBg} p-3 rounded-xl flex-shrink-0`}>
      <img src={iconSrc} alt={label} className="w-7 h-7" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColor} truncate`}>{value}</p>
    </div>
  </div>
)

const SectionCard = ({ title, viewLink, children, compact = false }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${compact ? '' : 'h-full'} flex flex-col`}>
    <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <Link 
        href={viewLink}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-100 rounded-lg transition-colors"
      >
        View List
      </Link>
    </div>
    <div className="p-4 pt-3">
      {children}
    </div>
  </div>
)

const EngagementCard = ({ label, value, bgColor, iconBg, iconSrc, viewLink }) => (
  <div className={`${bgColor} rounded-xl p-4 flex items-center justify-between w-full`}>
    <div className="flex items-center gap-3">
      <div className={`${iconBg} p-3 rounded-xl flex-shrink-0`}>
        <img src={iconSrc} alt={label} className="w-7 h-7" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
    <Link 
      href={viewLink}
      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1"
    >
      View List
      <img src="/images/dashboard/arrow.svg" alt="Arrow" className="w-3 h-3" />
    </Link>
  </div>
)

export default function AdditionalDashboard() {
  const [stats] = useState({
    accommodations: 1217,
    accommodationRevenue: '₦9,00,000',
    esims: 1217,
    esimRevenue: '₦9,00,000',
    rides: 1217,
    rideRevenue: '₦9,00,000',
    leadway: 1217,
    leadwayRevenue: '₦9,00,000',
    drugStore: 1217,
    drugStoreRevenue: '₦9,00,000',
    consultation: 1217,
    consultationRevenue: '₦9,00,000',
    visaApplications: 1540,
    visaSettled: 1240,
    walletAmount: '₦9,00,000',
    emailSubscribers: 1540,
    contactEnquiries: 1130,
    eventEnquiries: 1240
  })

  return (
    <div className="space-y-2">
      {/* Row 1: Accommodations & eSims */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <SectionCard title="Accommodations" viewLink="/accommodation">
          <div className="flex gap-2 mx-auto">
            <MetricCard
              label="Total Accommodations"
              value={stats.accommodations}
              bgColor="bg-[#E0F2FE]"
              iconBg="bg-gradient-to-r from-[#7DD3FC] to-[#0EA5E9]"
              iconSrc="/images/dashboard/icons (14).svg"
            />
            <MetricCard
              label="Revenue"
              value={stats.accommodationRevenue}
              bgColor="bg-[#E8F8F0]"
              iconBg="bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]"
              iconSrc="/images/dashboard/icons (1).svg"
            />
          </div>
        </SectionCard>

        <SectionCard title="eSims" viewLink="/esim-data-plan">
          <div className="flex gap-4">
            <MetricCard
              label="Total eSims"
              value={stats.esims}
              bgColor="bg-[#FFF4E8]"
              iconBg="bg-gradient-to-r from-[#FFD8A8] to-[#F76707]"
              iconSrc="/images/dashboard/icons (19).svg"
            />
            <MetricCard
              label="Revenue"
              value={stats.esimRevenue}
              bgColor="bg-[#E8F8F0]"
              iconBg="bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]"
              iconSrc="/images/dashboard/icons (1).svg"
            />
          </div>
        </SectionCard>
      </div>

      {/* Row 2: Rides & Leadway */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <SectionCard title="Rides" viewLink="/rides">
          <div className="flex gap-4">
            <MetricCard
              label="Total Rides"
              value={stats.rides}
              bgColor="bg-[#FFE8F5]"
              iconBg="bg-gradient-to-r from-[#FFADD2] to-[#E91E8C]"
              iconSrc="/images/dashboard/icons (10).svg"
            />
            <MetricCard
              label="Revenue"
              value={stats.rideRevenue}
              bgColor="bg-[#E8F8F0]"
              iconBg="bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]"
              iconSrc="/images/dashboard/icons (1).svg"
            />
          </div>
        </SectionCard>

        <SectionCard title="Leadway" viewLink="/leadway">
          <div className="flex gap-4">
            <MetricCard
              label="Total Leadway"
              value={stats.leadway}
              bgColor="bg-[#F0E8FF]"
              iconBg="bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]"
              iconSrc="/images/dashboard/icons (8).svg"
            />
            <MetricCard
              label="Revenue"
              value={stats.leadwayRevenue}
              bgColor="bg-[#E8F8F0]"
              iconBg="bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]"
              iconSrc="/images/dashboard/icons (1).svg"
            />
          </div>
        </SectionCard>
      </div>

      {/* Row 3: Med Plus - Drug Store & Consultation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <SectionCard title="Med Plus - Drug Store" viewLink="/med-plus/drug-store">
          <div className="flex gap-4">
            <MetricCard
              label="Total Drug Store"
              value={stats.drugStore}
              bgColor="bg-[#E0F2FE]"
              iconBg="bg-gradient-to-r from-[#7DD3FC] to-[#0EA5E9]"
              iconSrc="/images/dashboard/icons (17).svg"
            />
            <MetricCard
              label="Revenue"
              value={stats.drugStoreRevenue}
              bgColor="bg-[#E8F8F0]"
              iconBg="bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]"
              iconSrc="/images/dashboard/icons (1).svg"
            />
          </div>
        </SectionCard>

        <SectionCard title="Med Plus - Consultation Application" viewLink="/med-plus/consultation">
          <div className="flex gap-4">
            <MetricCard
              label="Total Consultation Application"
              value={stats.consultation}
              bgColor="bg-[#FFF4E8]"
              iconBg="bg-gradient-to-r from-[#FFD8A8] to-[#F76707]"
              iconSrc="/images/dashboard/icons (18).svg"
            />
            <MetricCard
              label="Revenue"
              value={stats.consultationRevenue}
              bgColor="bg-[#E8F8F0]"
              iconBg="bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]"
              iconSrc="/images/dashboard/icons (1).svg"
            />
          </div>
        </SectionCard>

      </div>

      {/* Row 4: Visa, Wallet & Engagement - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left Column: Visa & Wallet */}
        <div className="space-y-2">
          <SectionCard title="Visa Applications" viewLink="/visa" compact>
            <div className="flex gap-4">
              <MetricCard
                label="Total Applications Received"
                value={stats.visaApplications}
                bgColor="bg-[#E8EEFF]"
                iconBg="bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]"
                iconSrc="/images/dashboard/icons (4).svg"
              />
              <MetricCard
                label="Total Settled"
                value={stats.visaSettled}
                bgColor="bg-[#E8F8F0]"
                iconBg="bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]"
                iconSrc="/images/dashboard/icons (9).svg"
              />
            </div>
          </SectionCard>

          <SectionCard title="Wallet" viewLink="/users/wallet" compact>
            <MetricCard
              label="Total Amount"
              value={stats.walletAmount}
              bgColor="bg-[#E8F8F0]"
              iconBg="bg-gradient-to-r from-[#8EEDC7] to-[#3FA574]"
              iconSrc="/images/dashboard/icons (1).svg"
            />
          </SectionCard>
        </div>

        {/* Right Column: Engagement & Enquiries */}
        <SectionCard title="Engagement & Enquiries" viewLink="/engagement">
          <div className="space-y-3">
            <EngagementCard
              label="Email Subscribers"
              value={stats.emailSubscribers}
              bgColor="bg-[#E8EEFF]"
              iconBg="bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1]"
              iconSrc="/images/dashboard/icons (17).svg"
              viewLink="/email-subscription"
            />
            <EngagementCard
              label="Contact Enquiries"
              value={stats.contactEnquiries}
              bgColor="bg-[#F0E8FF]"
              iconBg="bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED]"
              iconSrc="/images/dashboard/icons (12).svg"
              viewLink="/contact"
            />
            <EngagementCard
              label="Event/ Activities Enquiries"
              value={stats.eventEnquiries}
              bgColor="bg-[#FFF4E8]"
              iconBg="bg-gradient-to-r from-[#FFD8A8] to-[#F76707]"
              iconSrc="/images/dashboard/icons (14).svg"
              viewLink="/inquiries"
            />
          </div>
        </SectionCard>

      </div>
    </div>
  )
}
