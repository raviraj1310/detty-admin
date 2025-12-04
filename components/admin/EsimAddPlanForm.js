'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

const networkOptions = ['Airtel', 'MTN', '9Mobile', 'Glo'];
const validityOptions = ['7 Days', '14 Days', '30 Days', '60 Days'];
const dataOptions = ['1GB/Day', '2GB/Day', '3GB/Day', 'Unlimited'];

export default function EsimAddPlanForm() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    planName: 'Monthly Starter',
    network: 'Airtel',
    validity: '30 Days',
    data: '2GB/Day',
    price: '₦2950',
  });

  const handleChange = (key) => (event) => {
    setFormState((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = () => {
    console.log('Add Plan', formState);
    // Navigate to users page after adding plan
    router.push('/esim-data-plan/users');
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Add Plan</h1>
        <p className="text-sm text-[#99A1BC]">Dashboard / Add Plan</p>
      </div>

      <div className="rounded-[34px] border border-[#E0E6F5] bg-gradient-to-br from-white via-[#F8FAFF] to-[#EDF3FF] p-5 ">
        <div className="rounded-[26px] border border-white/80 bg-white ">
          <div className="flex items-center justify-between rounded-t-[26px] border-b border-[#EEF1FA] px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Plan Details
              </h2>
            </div>
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-[#FF5B2C] px-6 py-2.5 text-sm font-semibold text-white  transition hover:bg-[#F0481A]"
            >
              Add
            </button>
          </div>

          <div className="space-y-6 px-6 py-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <FormField
                label="Plan Name"
                required
                input={
                  <input
                    type="text"
                    value={formState.planName}
                    onChange={handleChange('planName')}
                    className="h-12 w-full rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm text-[#1F2547] shadow-inner focus:border-[#C7CCE3] focus:outline-none focus:ring-2 focus:ring-[#C5CCE6]"
                  />
                }
              />

              <FormField
                label="Network"
                required
                input={
                  <SelectField
                    value={formState.network}
                    options={networkOptions}
                    onChange={handleChange('network')}
                  />
                }
              />

              <FormField
                label="Validate"
                required
                input={
                  <SelectField
                    value={formState.validity}
                    options={validityOptions}
                    onChange={handleChange('validity')}
                  />
                }
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                label="Data"
                required
                input={
                  <SelectField
                    value={formState.data}
                    options={dataOptions}
                    onChange={handleChange('data')}
                  />
                }
              />

              <FormField
                label="Price"
                required
                input={
                  <input
                    type="text"
                    value={formState.price}
                    onChange={handleChange('price')}
                    className="h-12 w-full rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm text-[#1F2547] shadow-inner focus:border-[#C7CCE3] focus:outline-none focus:ring-2 focus:ring-[#C5CCE6]"
                  />
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required = false, input }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[#1F2547]">
      <span>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {input}
    </label>
  );
}

function SelectField({ value, options, onChange }) {
  return (
    <div className="relative h-12">
      <select
        value={value}
        onChange={onChange}
        className="h-full w-full appearance-none rounded-xl border border-[#E5E6EF] bg-white px-4 pr-11 text-sm text-[#1F2547] shadow-inner focus:border-[#C7CCE3] focus:outline-none focus:ring-2 focus:ring-[#C5CCE6]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 transform text-[#99A1BC]" />
    </div>
  );
}

