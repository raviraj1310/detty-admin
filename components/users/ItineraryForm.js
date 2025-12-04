'use client';

import Image from 'next/image';
import { ChevronDown, MapPin } from 'lucide-react';

const itineraryData = [
  {
    day: '24th',
    month: 'Dec 2025',
    highlight: true,
    events: [
      {
        id: 1,
        title: 'Fela and the Kalakuta Queens',
        subtitle: 'Sat, Dec 24 · 3pm',
        location: 'Landmark Event Centre, Lagos',
        time: '5:00PM',
        icon: '/images/user_dashboard/Microphone.webp',
        iconBg: 'bg-[#FBE9C0]',
        image: '/images/accomodation/accomodation  (1).webp',
        tags: [
          {
            label: 'Theatre Show',
            className:
              'bg-emerald-50 text-emerald-600 border border-emerald-100',
          },
        ],
      },
      {
        id: 2,
        title: 'Her Excellency',
        subtitle: 'Sat, Dec 24 · 4pm',
        location: 'Landmark Event Centre, Lagos',
        time: '7:00PM',
        icon: '/images/user_dashboard/Video.webp',
        iconBg: 'bg-[#FDE6E6]',
        image: '/images/accomodation/accomodation  (2).webp',
        tags: [
          {
            label: 'Movie',
            className: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
          },
        ],
      },
      {
        id: 3,
        title: 'Eko Hotel & Suite',
        subtitle: 'Sat, Dec 24 – Sun, Dec 26',
        location: 'Landmark Event Centre, Lagos',
        time: '7:00PM',
        icon: '/images/user_dashboard/Accomodation.webp',
        iconBg: 'bg-[#F9EDD6]',
        image: '/images/accomodation/accomodation  (3).webp',
        tags: [
          {
            label: 'Theatre Show',
            className:
              'bg-emerald-50 text-emerald-600 border border-emerald-100',
          },
        ],
      },
    ],
  },
  {
    day: '25th',
    month: 'Dec 2025',
    highlight: false,
    events: [
      {
        id: 4,
        title: 'Fela and the Kalakuta Queens',
        subtitle: 'Sat, Dec 24 · 3pm',
        location: 'Landmark Event Centre, Lagos',
        time: '5:00PM',
        icon: '/images/user_dashboard/Microphone.webp',
        iconBg: 'bg-[#FBE9C0]',
        image: '/images/accomodation/accomodation  (1).webp',
        tags: [
          {
            label: 'Theatre Show',
            className:
              'bg-emerald-50 text-emerald-600 border border-emerald-100',
          },
        ],
      },
      {
        id: 5,
        title: 'Her Excellency',
        subtitle: 'Sat, Dec 24 · 4pm',
        location: 'Landmark Event Centre, Lagos',
        time: '7:00PM',
        icon: '/images/user_dashboard/Video.webp',
        iconBg: 'bg-[#FDE6E6]',
        image: '/images/accomodation/accomodation  (2).webp',
        tags: [
          {
            label: 'Movie',
            className: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
          },
        ],
      },
    ],
  },
  {
    day: '26th',
    month: 'Dec 2025',
    highlight: false,
    events: [
      {
        id: 6,
        title: 'Eko Hotel & Suite',
        subtitle: 'Sat, Dec 24 – Sun, Dec 26',
        location: 'Landmark Event Centre, Lagos',
        time: '7:00PM',
        icon: '/images/user_dashboard/Accomodation.webp',
        iconBg: 'bg-[#F9EDD6]',
        image: '/images/accomodation/accomodation  (3).webp',
        tags: [
          {
            label: 'Theatre Show',
            className:
              'bg-emerald-50 text-emerald-600 border border-emerald-100',
          },
        ],
      },
      {
        id: 7,
        title: 'Her Excellency',
        subtitle: 'Sat, Dec 24 · 4pm',
        location: 'Landmark Event Centre, Lagos',
        time: '7:00PM',
        icon: '/images/user_dashboard/Video.webp',
        iconBg: 'bg-[#FDE6E6]',
        image: '/images/accomodation/accomodation  (2).webp',
        tags: [
          {
            label: 'Movie',
            className: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
          },
        ],
      },
    ],
  },
  {
    day: '27th',
    month: 'Dec 2025',
    highlight: false,
    events: [
      {
        id: 8,
        title: 'Fela and the Kalakuta Queens',
        subtitle: 'Sat, Dec 24 · 3pm',
        location: 'Landmark Event Centre, Lagos',
        time: '5:00PM',
        icon: '/images/user_dashboard/Microphone.webp',
        iconBg: 'bg-[#FBE9C0]',
        image: '/images/accomodation/accomodation  (1).webp',
        tags: [
          {
            label: 'Theatre Show',
            className:
              'bg-emerald-50 text-emerald-600 border border-emerald-100',
          },
        ],
      },
    ],
  },
];

export default function ItineraryForm() {
  return (
    <div className="space-y-10 p-6 sm:p-8 lg:p-10">
      <div className="flex flex-col gap-6 rounded-3xl border border-[#DFE5F4] bg-gradient-to-br from-white via-white to-[#F4F7FF] p-6 sm:p-7 lg:p-8 ">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full bg-[#EFF2FF] ring-4 ring-white ">
              <Image
                src="/images/user_dashboard/user_photo.webp"
                alt="Oromuno Okiemute Grace"
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#7B82A0]">
                Profile
              </p>
              <h2 className="text-2xl font-semibold text-slate-900">
                Oromuno Okiemute Grace
              </h2>
              <p className="text-sm text-[#7F86A0]">loveokiemute@gmail.com</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[#D8DFF0] bg-white px-4 py-2 text-sm font-medium text-[#3C4460] shadow-sm transition hover:border-[#C3CAE0]"
            >
              Dec 1st - Dec 31st
              <ChevronDown className="h-4 w-4 text-[#9AA1BC]" />
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[#D8DFF0] bg-white px-4 py-2 text-sm font-medium text-[#3C4460] shadow-sm transition hover:border-[#C3CAE0]"
            >
              Dec 24th
              <ChevronDown className="h-4 w-4 text-[#9AA1BC]" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E4E7F5] bg-white px-6 py-5 ">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-base font-semibold text-slate-900">Itinerary</p>
            <span className="text-xs font-medium uppercase tracking-[0.28em] text-[#9AA0BC]">
              Dec 2025
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-6 bottom-0 -translate-x-1/2 border-l border-dashed border-[#D6DAEA]" />

            {itineraryData.map((day, index) => (
              <div
                key={day.day}
                className="relative pb-12 pl-16 last:pb-6"
              >
                <div
                  className={`absolute left-8 top-2 h-3.5 w-3.5 -translate-x-1/2 transform rounded-full ${
                    day.highlight
                      ? 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-[0_0_0_4px_rgba(253,186,116,0.35)]'
                      : 'bg-white ring-4 ring-[#E9ECF8] shadow-[0_6px_16px_-10px_rgba(15,23,42,0.45)]'
                  }`}
                />
                {index !== itineraryData.length - 1 && (
                  <div className="absolute left-8 top-6 bottom-[-24px] -translate-x-1/2 border-l border-dashed border-[#D6DAEA]" />
                )}

                <div className="mb-4 -ml-16 pl-16">
                  <div className="absolute left-0 -top-6 sm:-top-7">
                    <p className="text-3xl font-semibold text-[#B6BCD5]">
                      {day.day}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-[#A8AFC8]">
                      {day.month}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#E5E8F5] bg-white/95 ">
                  {day.events.map((event, eventIndex) => (
                    <div
                      key={event.id}
                      className={`flex flex-col gap-4 px-6 py-5 transition duration-200 sm:flex-row sm:items-center sm:justify-between ${
                        eventIndex !== day.events.length - 1
                          ? 'border-b border-dashed border-[#E3E7F6]'
                          : ''
                      } hover:bg-[#F8FAFF]`}
                    >
                      <div className="flex flex-1 items-center gap-4 md:gap-6">
                        <div
                          className={`grid h-14 w-14 flex-shrink-0 place-content-center rounded-full ${event.iconBg}`}
                        >
                          <Image
                            src={event.icon}
                            alt=""
                            width={30}
                            height={30}
                            className="h-7 w-7 object-contain"
                          />
                        </div>
                        <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-2xl ring-2 ring-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)]">
                          <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-[#29324D]">
                            {event.title}
                          </h4>
                          <p className="mt-0.5 text-xs text-[#7F86A4]">
                            {event.subtitle}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#9EA4BE]">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[#B6BCD6]" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-3 sm:gap-4">
                        {event.tags?.map((tag) => (
                          <span
                            key={tag.label}
                            className={`rounded-full px-4 py-1 text-xs font-semibold tracking-wide ${tag.className}`}
                          >
                            {tag.label}
                          </span>
                        ))}
                        <span className="text-base font-semibold text-[#29324D]">
                          {event.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
