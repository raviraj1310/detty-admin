'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const bundleData = {
  title: 'Solo Hangout Bundle',
  subtitle: 'Tour Lagos with my family this December',
  totalPrice: '₦400,000.00',
  items: [
    {
      id: 1,
      title: 'Cozy Lekki 2BR with Balcony',
      date: 'Aug 15-18, 2025',
      duration: '1 Night',
      price: '90.00',
      image: '/images/diy/home.jpg'
    },
    {
      id: 2,
      title: 'Walk the canopy bridge at Lekki',
      date: 'Aug 15-18, 2025',
      duration: '6 Tickets',
      price: '90.00',
      image: '/images/diy/travel.jpg'
    },
    {
      id: 3,
      title: 'Cozy Lekki 2BR with Balcony',
      date: 'Aug 15-18, 2025',
      duration: '2 Nights',
      price: '90.00',
      image: '/images/diy/home.jpg'
    }
  ]
};

export default function DIYDetail() {
  const router = useRouter();

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#1A1D29] mb-2">DIY - Solo Hangout (Oluwatoba Hassan)</h1>
          <p className="text-sm text-[#6B7280]">
            Dashboard / DIY
          </p>
        </div>

        {/* Bundle Details Card */}
        <div className='bg-gray-200 rounded-xl p-7'>
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-8">
          {/* Bundle Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#1A1D29] mb-2">{bundleData.title}</h2>
            <p className="text-[#6B7280]">{bundleData.subtitle}</p>
          </div>

          {/* Bundle Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl">
            {bundleData.items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm max-w-xs">
                {/* Item Image */}
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-slate-600 text-sm font-medium" style={{ display: 'none' }}>
                    {item.title}
                  </div>
                </div>

                {/* Item Details */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-[#1A1D29] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#6B7280] mb-1">{item.date}</p>
                  <p className="text-xs text-[#6B7280] mb-4">{item.duration}</p>
                  

                  <div className="flex items-center justify-between border-t border-b border-dashed border-[#E5E7EB] py-2">
                    <span className="text-xs text-[#6B7280]">Total</span>
                    <div className="flex items-center gap-1">
                      <img 
                        src="/images/backend/icons/tag.svg" 
                        alt="Tag icon" 
                        className="w-3 h-3"
                      />
                      <span className="text-lg font-bold text-[#FF5B2C]">₦{item.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Price Section */}
          <div className=" pb-5 ml-7">
            <div className="flex items-center justify-between max-w-sm">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/backend/icons/tag.svg" 
                  alt="Tag icon" 
                  className="w-6 h-6"
                />
                <span className="text-[#6B7280] font-medium">Total DIY Bundle Price</span>
              </div>
              <span className="text-3xl font-bold text-[#1A1D29]">{bundleData.totalPrice}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
