'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Download,
  MoreVertical,
} from 'lucide-react';
import { IoFilterSharp } from "react-icons/io5";
import { TbCaretUpDownFilled } from "react-icons/tb";

const esimNetworksRows = [
  {
    id: 'network-1',
    addedOn: '12 June 2025, 10:00 AM',
    networkLogo: '/images/backend/esim/logo (1).webp',
    networkName: 'Airtel',
    status: 'Active',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  {
    id: 'network-2',
    addedOn: '12 June 2025, 10:00 AM',
    networkLogo: '/images/backend/esim/logo (2).webp',
    networkName: '9Mobile',
    status: 'Active',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  {
    id: 'network-3',
    addedOn: '12 June 2025, 10:00 AM',
    networkLogo: '/images/backend/esim/logo (3).webp',
    networkName: 'MTN',
    status: 'Inactive',
    statusClass: 'bg-red-50 text-red-600 border border-red-200',
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

export default function EsimNetworksMaster() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    networkName: 'Airtel',
    uploadImage: 'image.jpg',
    status: 'Active'
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Add eSIM Network:', formData);
    // Here you would typically save the data
  };

  const handleBrowse = () => {
    // Handle file browse functionality
    console.log('Browse for image file');
  };

  const filteredEsimNetworks = esimNetworksRows.filter(network =>
    network.networkName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">eSIM Networks</h1>
          <p className="text-sm text-[#99A1BC]">
            Dashboard / Masters
          </p>
        </div>
      </div>

      {/* Network Details Form */}
      <div className='bg-gray-200 p-3 rounded-xl'>

      <div className="rounded-xl border border-[#E1E6F7] bg-white p-8 ">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Network Details</h2>
          <button 
            onClick={handleSubmit}
            className="rounded-xl bg-[#FF5B2C] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A]"
          >
            Add
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Network Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Network Name*
              </label>
              <input
                type="text"
                value={formData.networkName}
                onChange={(e) => handleInputChange('networkName', e.target.value)}
                className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                placeholder="Enter network name"
              />
            </div>

            {/* Upload Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Upload Image*
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={formData.uploadImage}
                  onChange={(e) => handleInputChange('uploadImage', e.target.value)}
                  className="flex-1 h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  placeholder="image.jpg"
                  readOnly
                />
                <button
                  type="button"
                  onClick={handleBrowse}
                  className="h-12 px-6 rounded-xl border border-[#E5E6EF] bg-white text-sm font-medium text-[#2D3658] hover:bg-[#F6F7FD] transition-colors"
                >
                  Browse
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Status
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full h-12 appearance-none rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 pr-10 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-[#99A1BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      </div>
      <div className='bg-gray-200 p-3 rounded-xl p-4'>

      {/* Network List */}
      <div className="rounded-xl border border-[#E1E6F7] bg-white ">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Network List</h2>
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

        <div className="overflow-hidden  border border-[#E5E8F5]">
          <div className="grid grid-cols-12 gap-6 bg-[#F7F9FD] px-6 py-4">
            <div className="col-span-3">
              <TableHeaderCell>Added On</TableHeaderCell>
            </div>
            <div className="col-span-4">
              <TableHeaderCell>Network Name</TableHeaderCell>
            </div>
            <div className="col-span-3">
              <TableHeaderCell>Status</TableHeaderCell>
            </div>
            <div className="col-span-2">
            </div>
          </div>

          <div className="divide-y divide-[#EEF1FA] bg-white">
            {filteredEsimNetworks.map((network) => (
              <div
                key={network.id}
                className="grid grid-cols-12 gap-6 px-6 py-5 hover:bg-[#F9FAFD]"
              >
                <div className="col-span-3 self-center text-sm text-[#5E6582]">
                  {network.addedOn}
                </div>
                <div className="col-span-4 flex items-center gap-3 self-center">
                  <div className="w-13 h-13 rounded-lg   overflow-hidden border border-[#E5E6EF] bg-white flex-shrink-0 flex items-center justify-center">
                    <img
                      src={network.networkLogo}
                      alt={network.networkName}
                      className="w-full h-full object-cover "
                    />
                  </div>
                  <span className="text-sm font-medium text-[#2D3658]">
                    {network.networkName}
                  </span>
                </div>
                <div className="col-span-3 self-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${network.statusClass}`}
                  >
                    {network.status}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <button className="rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
            </div>

    </div>
  );
}
