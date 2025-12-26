'use client'

import React from 'react'
import Link from 'next/link'

const formatCurrency = amount => {
  return (
    '₦' +
    (Number(amount) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  )
}

const MerchandiseStats = ({ stats: apiStats }) => {
  const stats = {
    skuCount: apiStats?.totalProducts || 0,
    totalQuantity: 0, // Not provided in API
    totalValue: formatCurrency(apiStats?.totalProductsRevenue),
    unsoldProducts: 0, // Not provided in API
    unsoldValue: '₦0', // Not provided in API
    productsSold: 0, // Not provided in API
    soldValue: '₦0' // Not provided in API
  }

  const growthData = apiStats?.growth?.products || {}

  return (
    <div className='bg-white rounded-xl shadow-sm p-3 border border-gray-100 h-full flex flex-col'>
      <div className='flex justify-between items-center mb-3 pb-2 border-b border-gray-100'>
        <h2 className='text-sm font-semibold text-gray-900'>Merchandise</h2>
        <Link
          href='/merchandise'
          className='px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-100 rounded-lg transition-colors'
        >
          View List
        </Link>
      </div>

      {/* Stats Cards */}
      <div className='space-y-2 mb-2'>
        <div className='bg-blue-50 rounded-lg p-2.5 flex items-center gap-2'>
          <div className='bg-gradient-to-r from-[#AECBFF] to-[#5A7CC1] p-2 rounded-lg'>
            <img
              src='/images/dashboard/icons (5).svg'
              alt='SKU'
              className='w-5 h-5'
            />
          </div>
          <div>
            <p className='text-[10px] font-medium text-gray-600 mb-0.5'>
              Products SKU Count
            </p>
            <p className='text-lg font-bold text-gray-900'>{stats.skuCount}</p>
          </div>
        </div>

        <div className='bg-[#F0E8FF] rounded-lg p-2.5 flex items-center gap-2'>
          <div className='bg-gradient-to-r from-[#C4B5FD] to-[#7C3AED] p-2 rounded-lg'>
            <img
              src='/images/dashboard/icons (7).svg'
              alt='Quantity'
              className='w-5 h-5'
            />
          </div>
          <div>
            <p className='text-[10px] font-medium text-gray-600 mb-0.5'>
              Total Products Quantity
            </p>
            <p className='text-lg font-bold text-gray-900'>
              {stats.totalQuantity}({stats.totalValue})
            </p>
          </div>
        </div>

        <div className='bg-[#F0F9FF] rounded-lg p-2.5 flex items-center gap-2'>
          <div className='bg-gradient-to-r from-[#BAE6FD] to-[#0EA5E9] p-2 rounded-lg'>
            <img
              src='/images/dashboard/trending_up.svg'
              alt='Growth'
              className='w-5 h-5'
            />
          </div>
          <div>
            <p className='text-[10px] font-medium text-gray-600 mb-0.5'>Growth</p>
            <p className='text-lg font-bold text-gray-900'>
              {growthData.newYesterday || 0}
            </p>
            <p className='text-[9px] text-gray-500 whitespace-nowrap'>
              Avg: {growthData.avgDailyGrowthCount || 0} (
              {growthData.avgDailyGrowthPercent || '0.00%'})
            </p>
          </div>
        </div>
      </div>

      {/* Donut Chart */}
      <div className='bg-gray-50 p-3 rounded-lg'>
        <div className='bg-white rounded-lg'>
          <div className='relative flex items-center justify-center py-2'>
            <svg className='w-32 h-32' viewBox='0 0 200 200'>
              {/* Background circle */}
              <circle
                cx='100'
                cy='100'
                r='80'
                fill='none'
                stroke='#E5E7EB'
                strokeWidth='20'
              />
              {/* Products Sold - Green arc (58% = 140/242) */}
              <circle
                cx='100'
                cy='100'
                r='80'
                fill='none'
                stroke='#10B981'
                strokeWidth='20'
                strokeDasharray='290 502'
                strokeDashoffset='0'
                transform='rotate(-90 100 100)'
                strokeLinecap='round'
              />
              {/* Center text */}
              <text
                x='100'
                y='95'
                textAnchor='middle'
                className='text-xs fill-gray-500'
                fontSize='11'
              >
                Total
              </text>
              <text
                x='100'
                y='115'
                textAnchor='middle'
                className='text-xl font-bold fill-gray-900'
                fontSize='20'
              >
                {stats.skuCount}
              </text>
            </svg>

            {/* Left side - Unsold */}
            <div className='absolute left-1 top-1/2 -translate-y-1/2 text-center'>
              <p className='text-[9px] text-gray-500 mb-0.5'>
                Unsold Products
              </p>
              <p className='text-sm font-bold text-gray-900'>
                {stats.unsoldProducts}
              </p>
              <p className='text-[9px] text-gray-600'>({stats.unsoldValue})</p>
            </div>

            {/* Right side - Sold */}
            <div className='absolute right-1 top-1/2 -translate-y-1/2 text-center'>
              <p className='text-[9px] text-gray-500 mb-0.5'>Products Sold</p>
              <p className='text-sm font-bold text-gray-900'>
                {stats.productsSold}
              </p>
              <p className='text-[9px] text-gray-600'>({stats.soldValue})</p>
            </div>
          </div>

          {/* Legend */}
          <div className='flex items-center justify-center gap-4 mt-2 border-t border-gray-200 mx-3 pt-2 pb-2'>
            <div className='flex items-center gap-1.5'>
              <div className='w-2.5 h-2.5 bg-green-500 rounded-sm'></div>
              <span className='text-[10px] text-gray-600'>Products Sold</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <div className='w-2.5 h-2.5 bg-gray-300 rounded-sm'></div>
              <span className='text-[10px] text-gray-600'>Unsold Products</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({ product, type }) => {
  const iconSrc =
    type === 'best'
      ? '/images/dashboard/trending_up.svg'
      : '/images/dashboard/trending_down.svg'

  return (
    <div className='flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm'>
      <div className='w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0'>
        <img
          src={product.image || '/images/no-image.webp'}
          alt={product.name}
          className='w-full h-full object-cover'
        />
      </div>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-1 mb-0.5'>
          <img
            src={iconSrc}
            alt={type === 'best' ? 'Trending up' : 'Trending down'}
            className='w-3 h-3'
          />
          <p className='text-[10px] text-gray-600 truncate'>{product.name}</p>
        </div>
        <p className='text-xs font-semibold text-gray-900 truncate'>
          Units Sold: {product.unitsSold}({product.value})
        </p>
      </div>
    </div>
  )
}

const BestSellers = () => {
  const products = [
    {
      id: 1,
      name: 'DettyFusion T-Shirt',
      unitsSold: '100(N3',
      value: '40,000)',
      image: '/images/dashboard/image.webp'
    },
    {
      id: 2,
      name: 'DettyFusion Hat',
      unitsSold: '90(N3',
      value: '40,000)',
      image: '/images/dashboard/image-1.webp'
    },
    {
      id: 3,
      name: 'DettyFusion Bottle',
      unitsSold: '80(N3',
      value: '40,000)',
      image: '/images/dashboard/image-2.webp'
    },
    {
      id: 4,
      name: 'DettyFusion Shirt',
      unitsSold: '70(N3',
      value: '40,000)',
      image: '/images/dashboard/image-3.webp'
    },
    {
      id: 5,
      name: 'DettyFusion T-Shirt',
      unitsSold: '60(N3',
      value: '40,000)',
      image: '/images/dashboard/image.webp'
    }
  ]

  return (
    <div className='rounded-xl h-full flex flex-col'>
      <h2 className='text-sm font-semibold text-gray-900 mb-2'>Best Sellers</h2>
      <div className='bg-[#F2F5F8] p-2.5 rounded-xl flex flex-col'>
        <div className='space-y-1.5'>
          {products.map(product => (
            <ProductCard key={product.id} product={product} type='best' />
          ))}
        </div>
        <Link
          href='/merchandise/best-sellers'
          className='flex items-center justify-center gap-1.5 mt-2 py-1.5 border-t border-gray-200 text-xs font-medium text-gray-900 hover:text-gray-900 transition-colors'
        >
          View List
          <img
            src='/images/dashboard/arrow.svg'
            alt='Arrow'
            className='w-3 h-3'
          />
        </Link>
      </div>
    </div>
  )
}

const LeastMovingProducts = () => {
  const products = [
    {
      id: 1,
      name: 'DettyFusion T-Shirt',
      unitsSold: '10(N3',
      value: '0,000)',
      image: '/images/dashboard/image-3.webp'
    },
    {
      id: 2,
      name: 'DettyFusion Bottle',
      unitsSold: '10(N3',
      value: '0,000)',
      image: '/images/dashboard/image-2.webp'
    },
    {
      id: 3,
      name: 'DettyFusion T-Shirt',
      unitsSold: '10(N3',
      value: '0,000)',
      image: '/images/dashboard/image.webp'
    },
    {
      id: 4,
      name: 'DettyFusion Hat',
      unitsSold: '10(N3',
      value: '0,000)',
      image: '/images/dashboard/image-1.webp'
    },
    {
      id: 5,
      name: 'DettyFusion T-Shirt',
      unitsSold: '10(N3',
      value: '0,000)',
      image: '/images/dashboard/image.webp'
    }
  ]

  return (
    <div className='rounded-xl h-full flex flex-col'>
      <h2 className='text-sm font-semibold text-gray-900 mb-2'>
        Least Moving Products
      </h2>
      <div className='bg-[#F2F5F8] p-2.5 rounded-xl flex flex-col'>
        <div className='space-y-1.5'>
          {products.map(product => (
            <ProductCard key={product.id} product={product} type='least' />
          ))}
        </div>
        <Link
          href='/merchandise/least-moving'
          className='flex items-center justify-center gap-1.5 mt-2 py-1.5 text-xs font-medium text-gray-900 border-t border-gray-200 hover:text-gray-900 transition-colors'
        >
          View List
          <img
            src='/images/dashboard/arrow.svg'
            alt='Arrow'
            className='w-3 h-3'
          />
        </Link>
      </div>
    </div>
  )
}

export default function MerchandiseDashboard ({ stats }) {
  return (
    <div className='flex flex-col lg:flex-row w-full gap-3 items-stretch overflow-hidden'>
      <div className='w-full lg:w-[380px] flex-shrink-0'>
        <MerchandiseStats stats={stats} />
      </div>
      <div className='flex flex-col sm:flex-row flex-1 bg-white p-3 rounded-xl gap-3 min-w-0 overflow-hidden'>
        <div className='flex-1 min-w-0 overflow-hidden'>
          <BestSellers />
        </div>
        <div className='flex-1 min-w-0 overflow-hidden'>
          <LeastMovingProducts />
        </div>
      </div>
    </div>
  )
}
