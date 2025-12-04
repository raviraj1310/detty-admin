'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CalendarPlus,
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
    title: 'Total Plans',
    value: '1540',
    icon: CalendarPlus,
    accent: 'from-[#2563EB] to-[#1D4ED8]',
    textColor: 'text-white',
    bg: 'bg-[#0F4EF1]',
    iconBg: 'bg-white/20',
  },
  {
    id: 'active',
    title: 'Active Plans',
    value: '1240',
    icon: CheckCircle2,
    accent: 'from-[#15803D] to-[#166534]',
    textColor: 'text-white',
    bg: 'bg-[#2B7D3C]',
    iconBg: 'bg-white/15',
  },
  {
    id: 'inactive',
    title: 'Inactive Plans',
    value: '100',
    icon: MinusCircle,
    accent: 'from-[#DC2626] to-[#B91C1C]',
    textColor: 'text-white',
    bg: 'bg-[#C9302C]',
    iconBg: 'bg-white/15',
  },
];

const planRows = [
  {
    id: 'plan-1',
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    planName: 'Daily Saver',
    network: 'Airtel',
    price: '₦2,000',
    validity: '30 Days',
    data: '2GB/Day',
    users: 45,
    status: 'Active',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    logo: {
      bg: 'bg-[#FFF4EA]',
      image: '/images/backend/esim/logo (1).webp',
    },
  },
  {
    id: 'plan-2',
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    planName: 'Weekly Flex',
    network: 'MTN',
    price: '₦2,000',
    validity: '30 Days',
    data: '2GB/Day',
    users: 45,
    status: 'Active',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    logo: {
      bg: 'bg-[#EFF6FF]',
      image: '/images/backend/esim/logo (2).webp',
    },
  },
  {
    id: 'plan-3',
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    planName: 'Monthly Starter',
    network: '9Mobile',
    price: '₦2,000',
    validity: '30 Days',
    data: '2GB/Day',
    users: 45,
    status: 'Inactive',
    statusClass: 'bg-red-50 text-red-600 border border-red-200',
    logo: {
      bg: 'bg-[#ECFDF3]',
      image: '/images/backend/esim/logo (3).webp',
    },
  },
  {
    id: 'plan-4',
    addedOn: 'Sat, 12 June 2025, 10:00 AM',
    planName: 'Infinity Connect',
    network: 'Glo',
    price: '₦2,000',
    validity: '30 Days',
    data: '2GB/Day',
    users: 45,
    status: 'Active',
    statusClass: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    logo: {
      bg: 'bg-[#F0FDF4]',
      image: '/images/backend/esim/logo (4).webp',
    },
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

export default function EsimDataPlanPage() {
  const router = useRouter();

  const handleAddNewPlan = () => {
    router.push('/esim-data-plan/add');
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">eSIM/Data Plan</h1>
          <p className="text-sm text-[#99A1BC]">
            Dashboard / eSim &amp; Data Plans
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <button className="rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]">
            View All Users
          </button>
          <button 
            onClick={handleAddNewPlan}
            className="rounded-xl bg-[#FF5B2C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A]"
          >
            Add New Plan
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`flex min-w-[220px] flex-1 items-center justify-between gap-4 rounded-2xl ${card.bg} px-5 py-4 text-white shadow-[0_18px_40px_-24px_rgba(18,28,45,0.45)]`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                  {card.title}
                </p>
                <p className="text-2xl font-semibold">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Plan List</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search"
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
          <div className="grid grid-cols-12 gap-6 bg-[#F7F9FD] px-6 py-4">
            <div className="col-span-2">
              <TableHeaderCell>Added On</TableHeaderCell>
            </div>
            <div className="col-span-3">
              <TableHeaderCell>Plan Name</TableHeaderCell>
            </div>
            <div className="col-span-1">
              <TableHeaderCell>Network</TableHeaderCell>
            </div>
            <div className="col-span-1">
              <TableHeaderCell>Price</TableHeaderCell>
            </div>
            <div className="col-span-1">
              <TableHeaderCell>Validity</TableHeaderCell>
            </div>
            <div className="col-span-1">
              <TableHeaderCell>Data</TableHeaderCell>
            </div>
            <div className="col-span-1">
              <TableHeaderCell>View Users</TableHeaderCell>
            </div>
            <div className="col-span-2">
              <TableHeaderCell>Status</TableHeaderCell>
            </div>
          </div>

          <div className="divide-y divide-[#EEF1FA] bg-white">
            {planRows.map((plan) => (
              <div
                key={plan.id}
                className="grid grid-cols-12 gap-6 px-6 py-5 hover:bg-[#F9FAFD]"
              >
                <div className="col-span-2 self-center text-sm text-[#5E6582]">
                  {plan.addedOn}
                </div>
                <div className="col-span-3 flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${plan.logo.bg}`}
                  >
                    {plan.logo.image ? (
                      <Image
                        src={plan.logo.image}
                        alt={plan.planName}
                        width={36}
                        height={36}
                        className="h-9 w-9 object-contain"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-[#1E2A4A]">
                        {plan.logo.text}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {plan.planName}
                    </p>
                    <p className="text-xs text-[#8C93AF]">{plan.network}</p>
                  </div>
                </div>
                <div className="col-span-1 self-center text-sm font-medium text-slate-900">
                  {plan.network}
                </div>
                <div className="col-span-1 self-center text-sm font-semibold text-slate-900">
                  {plan.price}
                </div>
                <div className="col-span-1 self-center text-sm text-[#5E6582]">
                  {plan.validity}
                </div>
                <div className="col-span-1 self-center text-sm text-[#5E6582]">
                  {plan.data}
                </div>
                <div className="col-span-1 flex items-center gap-1 self-center text-sm font-semibold text-[#0F4EF1]">
                  <span>{plan.users}</span>
                  <button 
                    onClick={() => router.push('/esim-data-plan/users')}
                    className="text-xs font-medium text-[#0F4EF1] hover:text-[#0D47D9] transition-colors cursor-pointer underline"
                  >
                    (View List)
                  </button>
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.statusClass}`}
                  >
                    {plan.status}
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

