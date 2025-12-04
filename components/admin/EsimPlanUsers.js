'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle2,
  MinusCircle,
  Search,
  Download,
  MoreVertical,
} from 'lucide-react';
import { IoFilterSharp } from "react-icons/io5";
import { TbCaretUpDownFilled } from "react-icons/tb";

const metricCards = [
  {
    id: 'total',
    title: 'Total Users',
    value: '80',
    icon: Users,
    bg: 'bg-[#0F4EF1]',
    iconBg: 'bg-white',
  },
  {
    id: 'active',
    title: 'Active Users',
    value: '60 (₦6,00,000)',
    icon: CheckCircle2,
    bg: 'bg-[#2B7D3C]',
    iconBg: 'bg-white',
  },
  {
    id: 'inactive',
    title: 'Inactive Users',
    value: '20',
    icon: MinusCircle,
    bg: 'bg-[#C9302C]',
    iconBg: 'bg-white',
  },
];

const userRows = [
  {
    id: 'user-1',
    orderedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Ayo Famuyiwa',
    emailId: 'ayo.famuyiwa@gmail.com',
    phoneNumber: '+234 802 123 4567',
    plan: 'Monthly Starter',
    activatedNumber: '+234 802 123 4567',
    amount: '₦6,000',
    orderStatus: 'Completed',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  {
    id: 'user-2',
    orderedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Bolu Onabanjo',
    emailId: 'bolu.onabanjo@gmail.com',
    phoneNumber: '+234 802 234 5678',
    plan: 'Monthly Starter',
    activatedNumber: '+234 802 123 4567',
    amount: '₦6,000',
    orderStatus: 'Pending',
    statusClass: 'bg-orange-50 text-orange-600 border border-orange-200',
  },
  {
    id: 'user-3',
    orderedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Segun Adebayo',
    emailId: 'segun.adebayo@gmail.com',
    phoneNumber: '+234 802 345 6789',
    plan: 'Monthly Starter',
    activatedNumber: '+234 802 123 4567',
    amount: '₦6,000',
    orderStatus: 'Completed',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  {
    id: 'user-4',
    orderedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Tunde Bakare',
    emailId: 'tunde.bakare@gmail.com',
    phoneNumber: '+234 802 456 7890',
    plan: 'Monthly Starter',
    activatedNumber: '+234 802 123 4567',
    amount: '₦6,000',
    orderStatus: 'Completed',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  {
    id: 'user-5',
    orderedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Kunle Afolayan',
    emailId: 'kunle.afolayan@gmail.com',
    phoneNumber: '+234 802 567 8901',
    plan: 'Monthly Starter',
    activatedNumber: '+234 802 123 4567',
    amount: '₦6,000',
    orderStatus: 'Completed',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  {
    id: 'user-6',
    orderedOn: 'Sat, 12 June 2025, 10:00 AM',
    userName: 'Bisi Alimi',
    emailId: 'bisi.alimi@gmail.com',
    phoneNumber: '+234 802 678 9012',
    plan: 'Monthly Starter',
    activatedNumber: '+234 802 123 4567',
    amount: '₦6,000',
    orderStatus: 'Completed',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
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

export default function EsimPlanUsers() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = userRows.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">eSIM/Data Plan - Airtel (Monthly Saver Plan)</h1>
          <p className="text-sm text-[#99A1BC]">
            Dashboard / Users
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`${card.bg} rounded-2xl p-6 text-white shadow-[0_18px_40px_-24px_rgba(18,28,45,0.45)]`}
            >
              <div className="flex items-center justify-between">
                {/* Icon on the left */}
                <div className={`${card.iconBg} p-3 rounded-xl flex-shrink-0`}>
                  <Icon size={24} className="text-gray-700" />
                </div>
                
                {/* Content on the right */}
                <div className="text-right">
                  <p className="text-white/90 text-sm font-medium mb-1">{card.title}</p>
                  <div className="flex flex-col items-end">
                    <p className="text-3xl font-bold text-white">{card.value}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User List */}
      <div className="rounded-[30px] border border-[#E1E6F7] bg-white p-8 ">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">User List</h2>
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

        <div className="overflow-hidden rounded-2xl border border-[#E5E8F5]">
          <div className="grid grid-cols-12 gap-4 bg-[#F7F9FD] px-6 py-4">
            <div className="col-span-2">
              <TableHeaderCell>Ordered On</TableHeaderCell>
            </div>
            <div className="col-span-1">
              <TableHeaderCell>User Name</TableHeaderCell>
            </div>
            <div className="col-span-2">
              <TableHeaderCell>Email Id</TableHeaderCell>
            </div>
            <div className="col-span-1">
              <TableHeaderCell>Phone Number</TableHeaderCell>
            </div>
            <div className="col-span-1">
              <TableHeaderCell>Plan</TableHeaderCell>
            </div>
            <div className="col-span-2">
              <TableHeaderCell>Activated Number</TableHeaderCell>
            </div>
            <div className="col-span-1">
              <TableHeaderCell>Amount</TableHeaderCell>
            </div>
            <div className="col-span-2 flex justify-end">
              <TableHeaderCell align="right">Order Status</TableHeaderCell>
            </div>
          </div>

          <div className="divide-y divide-[#EEF1FA] bg-white">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-[#F9FAFD]"
              >
                <div className="col-span-2 self-center text-sm text-[#5E6582]">
                  {user.orderedOn}
                </div>
                <div className="col-span-1 self-center text-sm font-semibold text-slate-900">
                  {user.userName}
                </div>
                <div className="col-span-2 self-center text-sm text-[#5E6582]">
                  {user.emailId}
                </div>
                <div className="col-span-1 self-center text-sm text-[#5E6582]">
                  {user.phoneNumber}
                </div>
                <div className="col-span-1 self-center text-sm text-[#5E6582]">
                  {user.plan}
                </div>
                <div className="col-span-2 self-center text-sm text-[#5E6582]">
                  {user.activatedNumber}
                </div>
                <div className="col-span-1 self-center text-sm font-semibold text-slate-900">
                  {user.amount}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${user.statusClass}`}
                  >
                    {user.orderStatus}
                  </span>
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
  );
}
