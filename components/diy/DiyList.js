'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Download,
  MoreVertical,
  Eye,
} from 'lucide-react';
import { IoFilterSharp } from "react-icons/io5";
import { TbCaretUpDownFilled } from "react-icons/tb";

const diyData = [
  {
    id: 'diy-1',
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    user: {
      name: 'Oluwatoba Hassan',
      avatar: '/images/diy/user.png'
    },
    bundleName: 'Solo Hangout Bundle',
    bundleImage: '/images/diy/img-4.png',
    bundleInfo: [
      '3 Rooms x Cozy Lekki 2BR with Balcony (₦2,000)',
      '6 Tickets x Walk the canopy bridge at Lekki (₦2,000)...'
    ],
    bundleAmount: '₦16,000',
    status: 'Done',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    paymentStatus: 'Completed',
    paymentStatusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  },
  {
    id: 'diy-2',
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    user: {
      name: 'Aisha Mohammed',
      avatar: '/images/diy/user.png'
    },
    bundleName: 'Family Getaway Bundle',
    bundleImage: '/images/diy/img-3.jpg',
    bundleInfo: [
      '3 Rooms x Cozy Lekki 2BR with Balcony (₦2,000)',
      '5 Tickets x Walk the canopy bridge at Lekki (₦2,000)...'
    ],
    bundleAmount: '₦16,000',
    status: 'Upcoming',
    statusClass: 'bg-blue-50 text-blue-600 border border-blue-200',
    paymentStatus: 'Completed',
    paymentStatusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  },
  {
    id: 'diy-3',
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    user: {
      name: 'Bolanie Akindele',
      avatar: '/images/diy/user.png'
    },
    bundleName: 'Solo Hangout Bundle',
    bundleImage: '/images/diy/img-2.png',
    bundleInfo: [
      '3 Rooms x Cozy Lekki 2BR with Balcony (₦2,000)',
      '6 Tickets x Walk the canopy bridge at Lekki (₦2,000)...'
    ],
    bundleAmount: '₦16,000',
    status: 'Done',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    paymentStatus: 'Completed',
    paymentStatusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  },
  {
    id: 'diy-4',
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    user: {
      name: 'Chikeoma Adebayo',
      avatar: '/images/diy/user.png'
    },
    bundleName: 'Family Getaway Bundle',
    bundleImage: '/images/diy/img.png',
    bundleInfo: [
      '3 Rooms x Cozy Lekki 2BR with Balcony (₦2,000)',
      '5 Tickets x Walk the canopy bridge at Lekki (₦2,000)...'
    ],
    bundleAmount: '₦16,000',
    status: 'Upcoming',
    statusClass: 'bg-blue-50 text-blue-600 border border-blue-200',
    paymentStatus: 'Completed',
    paymentStatusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
  },
];

const TableHeaderCell = ({ children, align = 'left' }) => (
  <div
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC] ${align === 'right' ? 'justify-end' : 'justify-start'}`}
  >
    {children}
    <TbCaretUpDownFilled className="h-3.5 w-3.5 text-[#CBCFE2]" />
  </div>
);

export default function DiyList() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const filteredDIY = diyData.filter(item =>
    item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.bundleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = (itemId) => {
    setOpenDropdown(openDropdown === itemId ? null : itemId);
  };

  const handleViewDetails = (item) => {
    setOpenDropdown(null);
    router.push(`/diy/detail/${item.id}`);
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">DIY</h1>
          <p className="text-sm text-[#99A1BC]">
            Dashboard / DIY
          </p>
        </div>
      </div>

      {/* DIY List */}
      <div className='bg-gray-200 p-3 rounded-xl p-4'>
        <div className="rounded-xl border border-[#E1E6F7] bg-white">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
            <h2 className="text-lg font-semibold text-slate-900">DIY List</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                />
                <Search className="absolute left-3 h-4 w-4 text-[#A6AEC7]" />
              </div>
              <button className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]">
                <IoFilterSharp className="h-4 w-4 text-[#8B93AF]" />
                Filters
              </button>
              <button className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]">
                <Download className="h-4 w-4 text-[#8B93AF]" />
              </button>
            </div>
          </div>

          <div className="overflow-hidden border border-[#E5E8F5]">
            <div className="grid grid-cols-12 gap-6 bg-[#F7F9FD] px-6 py-4">
              <div className="col-span-2">
                <TableHeaderCell>Added On</TableHeaderCell>
              </div>
              <div className="col-span-2">
                <TableHeaderCell>User</TableHeaderCell>
              </div>
              <div className="col-span-2">
                <TableHeaderCell>Bundle Name</TableHeaderCell>
              </div>
              <div className="col-span-2">
                <TableHeaderCell>Bundle Info</TableHeaderCell>
              </div>
              <div className="col-span-1">
                <TableHeaderCell>Bundle Amount</TableHeaderCell>
              </div>
              <div className="col-span-1">
                <TableHeaderCell>Status</TableHeaderCell>
              </div>
              <div className="col-span-1">
                <TableHeaderCell>Payment Status</TableHeaderCell>
              </div>
              <div className="col-span-1">
              </div>
            </div>

            <div className="divide-y divide-[#EEF1FA] bg-white">
              {filteredDIY.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-6 px-6 py-5 hover:bg-[#F9FAFD]"
                >
                  <div className="col-span-2 self-center text-sm text-[#5E6582]">
                    {item.addedOn}
                  </div>
                  <div className="col-span-2 flex items-center gap-3 self-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#E5E6EF] bg-white flex-shrink-0 flex items-center justify-center relative">
                      <img
                        src={item.user.avatar}
                        alt={item.user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold rounded-full" style={{ display: 'none' }}>
                        {item.user.name.charAt(0)}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-[#2D3658]">
                      {item.user.name}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-3 self-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E5E6EF] bg-white flex-shrink-0">
                      <img
                        src={item.bundleImage}
                        alt={item.bundleName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-[#2D3658]">
                      {item.bundleName}
                    </span>
                  </div>
                  <div className="col-span-2 self-center">
                    <div className="space-y-1">
                      {item.bundleInfo.map((info, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-[#8A92AC] mt-2 flex-shrink-0"></div>
                          <span className="text-xs text-[#5E6582] leading-relaxed">
                            {info}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-1 self-center">
                    <span className="text-sm font-semibold text-[#2D3658]">
                      {item.bundleAmount}
                    </span>
                  </div>
                  <div className="col-span-1 self-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${item.statusClass}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="col-span-1 self-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${item.paymentStatusClass}`}
                    >
                      {item.paymentStatus}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <div className="relative" ref={openDropdown === item.id ? dropdownRef : null}>
                      <button 
                        onClick={() => handleDropdownToggle(item.id)}
                        className="rounded-full border border-transparent p-2 text-[#6B7280] hover:text-[#2D3658] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      
                      {openDropdown === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E5E6EF] rounded-xl shadow-lg z-10">
                          <div className="py-2">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD] transition-colors"
                            >
                              <Eye className="h-4 w-4 text-[#8B93AF]" />
                              View Details
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View Detail Button */}
      <div className="fixed bottom-6 right-6">
        <button 
          onClick={() => router.push('/diy/detail')}
          className="bg-white border border-[#E5E6EF] rounded-xl px-6 py-3 text-sm font-medium text-[#2D3658] shadow-lg hover:bg-[#F6F7FD] transition-colors"
        >
          View Detail
        </button>
      </div>
    </div>
  );
}
