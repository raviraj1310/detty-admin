"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Download,
  MoreVertical,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { IoFilterSharp } from "react-icons/io5";
import { TbCaretUpDownFilled } from "react-icons/tb";
import {
  copyEventById,
  getAllEvents,
} from "@/services/discover-events/event.service";
import Toast from "@/components/ui/Toast";
import Link from "next/link";

const metricCards = [
  {
    id: "total",
    title: "Total Events",
    value: "1540",
    iconSrc: "/images/backend/icons/icons (3).svg",
    accent: "from-[#2563EB] to-[#1D4ED8]",
    textColor: "text-white",
    bg: "bg-[#4F46E5]",
    iconBg: "bg-white/20",
  },
  {
    id: "done",
    title: "Done Events",
    value: "1240",
    iconSrc: "/images/backend/icons/icons (5).svg",
    bg: "bg-[#059669]",
    accent: "from-[#15803D] to-[#166534]",
    textColor: "text-white",
    iconBg: "bg-white/15",
  },
  {
    id: "ongoing",
    title: "Ongoing Events",
    value: "1",
    iconSrc: "/images/backend/icons/icons (2).svg",
    bg: "bg-[#EA580C]",
    iconBg: "bg-white/15",
  },
  {
    id: "upcoming",
    title: "Upcoming Events",
    value: "100",
    iconSrc: "/images/backend/icons/icons (4).svg",
    bg: "bg-[#DC2626]",
    accent: "from-[#DC2626] to-[#B91C1C]",
    textColor: "text-white",
    iconBg: "bg-white/15",
  },
];

const TableHeaderCell = ({
  children,
  align = "left",
  onClick,
  active = false,
  direction = "asc",
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] ${
      active ? "text-[#2D3658]" : "text-[#8A92AC]"
    } ${
      align === "right" ? "justify-end" : "justify-start"
    } hover:text-[#2D3658]`}
  >
    {children}
    {active ? (
      direction === "asc" ? (
        <ChevronUp className="h-3.5 w-3.5 text-[#2D3658]" />
      ) : (
        <ChevronDown className="h-3.5 w-3.5 text-[#2D3658]" />
      )
    ) : (
      <TbCaretUpDownFilled className="h-3.5 w-3.5 text-[#CBCFE2]" />
    )}
  </button>
);

export default function DiscoverEvents() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [viewAllLoading, setViewAllLoading] = useState(false);
  const [addNewLoading, setAddNewLoading] = useState(false);
  const [sortBy, setSortBy] = useState("eventDate");
  const [sortDir, setSortDir] = useState("desc");

  const toIdString = (v) => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") {
      if (v.$oid) return String(v.$oid);
      if (v.$id) return String(v.$id);
      if (v.oid) return String(v.oid);
      if (v._id) return toIdString(v._id);
    }
    return String(v);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAllEvents({});
        const data = Array.isArray(res?.data) ? res.data : [];
        setEvents(data);
        setToastOpen(true);
      } catch (e) {
        setError("Failed to load events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchByStatus = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        const res = await getAllEvents(params);
        const data = Array.isArray(res?.data) ? res.data : [];
        setEvents(data);
      } catch (e) {
        setError("Failed to load events");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    if (typeof statusFilter !== "undefined") fetchByStatus();
  }, [statusFilter]);

  const eventRows = events.map((e, idx) => {
    const now = new Date();
    const normalizeDate = (d) => {
      if (!d) return null;
      if (typeof d === "string") return new Date(d);
      if (typeof d === "object" && d.$date) return new Date(d.$date);
      return new Date(d);
    };
    const start = normalizeDate(e.eventStartDate);
    const end = normalizeDate(e.eventEndDate);
    const startMs = start ? start.getTime() : 0;
    let statusText = "-";
    if (start && end) {
      if (now < start) statusText = "Upcoming";
      else if (now > end) statusText = "Done";
      else statusText = "Ongoing";
    } else if (start) {
      if (now < start) statusText = "Upcoming";
      else statusText = "Ongoing";
    }
    const statusClass =
      statusText.toLowerCase() === "done"
        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
        : statusText.toLowerCase() === "ongoing"
        ? "bg-orange-50 text-orange-600 border border-orange-200"
        : statusText.toLowerCase() === "upcoming"
        ? "bg-red-50 text-red-600 border border-red-200"
        : "bg-gray-100 text-gray-600 border border-gray-200";
    const eventDate = start
      ? start.toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
    const gradients = [
      "bg-gradient-to-br from-orange-400 to-red-500",
      "bg-gradient-to-br from-blue-400 to-purple-500",
      "bg-gradient-to-br from-green-400 to-teal-500",
      "bg-gradient-to-br from-yellow-400 to-orange-500",
    ];
    const IMAGE_BASE_ORIGIN = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN;
    const sanitizeImageUrl = (input) => {
      if (typeof input !== "string") return null;
      let s = input.trim().replace(/`/g, "");
      s = s.replace(/^['"]/g, "").replace(/['"]$/g, "");
      s = s.replace(/^\(+/, "").replace(/\)+$/, "");
      if (!s) return null;
      const looksAbsolute = /^https?:\/\//i.test(s);
      const looksRootRelative = s.startsWith("/");
      const origin = IMAGE_BASE_ORIGIN.replace(/\/+$/, "");
      if (looksAbsolute) return s;
      if (looksRootRelative) return origin + s;
      return origin + "/" + s.replace(/^\/+/, "");
    };
    const imageUrl = sanitizeImageUrl(e.image) || "/images/no-image.webp";
    const idStr = toIdString(e._id);
    return {
      id: idStr || null,
      rowKey: idStr || `event-${idx}`,
      eventDate,
      eventName:
        typeof e.eventName === "string"
          ? e.eventName
          : String(e.eventName || "-"),
      hostedBy:
        e.businessName ||
        (typeof e.hostedBy === "string"
          ? e.hostedBy
          : typeof e.hostedBy === "object"
          ? e.hostedBy.name ||
            e.hostedBy.fullName ||
            e.hostedBy.title ||
            e.hostedBy.company ||
            "-"
          : String(e.hostedBy || "-")),
      type:
        (e.eventTypeId &&
          typeof e.eventTypeId === "object" &&
          e.eventTypeId.eventType) ||
        "-",
      location:
        typeof e.location === "string"
          ? e.location
          : typeof e.location === "object"
          ? e.location.name || e.location.city || e.location.address || "-"
          : String(e.location || "-"),
      ticketsBooked:
        typeof e.totalBookedTickets === "number" ? e.totalBookedTickets : "-",
      ticketsBookedNum:
        typeof e.totalBookedTickets === "number" ? e.totalBookedTickets : 0,
      status: statusText,
      statusClass,
      imageBg: gradients[idx % gradients.length],
      image: imageUrl || "/images/no-image.webp",
      startMs,
    };
  });

  const statusOrder = { Upcoming: 0, Ongoing: 1, Done: 2 };
  const sortedRows = [...eventRows].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "eventDate":
        return (a.startMs - b.startMs) * dir;
      case "eventName":
        return a.eventName.localeCompare(b.eventName) * dir;
      case "hostedBy":
        return a.hostedBy.localeCompare(b.hostedBy) * dir;
      case "type":
        return String(a.type).localeCompare(String(b.type)) * dir;
      case "location":
        return a.location.localeCompare(b.location) * dir;
      case "ticketsBooked":
        return (a.ticketsBookedNum - b.ticketsBookedNum) * dir;
      case "status":
        return (
          ((statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)) * dir
        );
      default:
        return 0;
    }
  });

  const filteredRows = [...sortedRows].filter((r) => {
    const term = String(searchTerm || "")
      .trim()
      .toLowerCase();
    const typeOk = typeFilter
      ? String(r.type || "")
          .toLowerCase()
          .includes(String(typeFilter).toLowerCase())
      : true;
    const locationOk = locationFilter
      ? String(r.location || "")
          .toLowerCase()
          .includes(String(locationFilter).toLowerCase())
      : true;
    const statusOk = statusFilter
      ? String(r.status || "").toLowerCase() ===
        String(statusFilter).toLowerCase()
      : true;
    if (!term) return typeOk && locationOk && statusOk;
    const digits = term.replace(/[^0-9]/g, "");
    const name = String(r.eventName || "").toLowerCase();
    const host = String(r.hostedBy || "").toLowerCase();
    const typeLc = String(r.type || "").toLowerCase();
    const locLc = String(r.location || "").toLowerCase();
    const dateStr = String(r.eventDate || "").toLowerCase();
    const dateDigits = dateStr.replace(/[^0-9]/g, "");
    const matchesText =
      name.includes(term) ||
      host.includes(term) ||
      typeLc.includes(term) ||
      locLc.includes(term) ||
      dateStr.includes(term);
    const matchesDigits = digits && dateDigits.includes(digits);
    return (matchesText || matchesDigits) && typeOk && locationOk && statusOk;
  });

  const typeOptions = Array.from(
    new Set(eventRows.map((r) => String(r.type || "").trim()).filter(Boolean))
  );

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const counts = {
    total: filteredRows.length,
    done: filteredRows.filter((r) => String(r.status).toLowerCase() === "done")
      .length,
    ongoing: filteredRows.filter(
      (r) => String(r.status).toLowerCase() === "ongoing"
    ).length,
    upcoming: filteredRows.filter(
      (r) => String(r.status).toLowerCase() === "upcoming"
    ).length,
  };

  const handleAddNewEvent = () => {
    setAddNewLoading(true);
    router.push("/discover-events/add");
  };

  // FIXED DROPDOWN STATE
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCopyEvent = async (id) => {
    try {
      await copyEventById(id);

      setActiveDropdown(null);
      window.location.reload();
    } catch (error) {
      console.error("Error copying event:", error);
    }
  };

  return (
    <div className="space-y-7 py-12 px-12">
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title="Events loaded"
        description="The events list has been updated"
        variant="success"
        duration={2500}
        position="top-right"
      />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Discover Events
          </h1>
          <p className="text-sm text-[#99A1BC]">Dashboard / Discover Events</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <button
            onClick={() => {
              setViewAllLoading(true);
              router.push("/discover-events/tickets-booked");
            }}
            disabled={viewAllLoading}
            className="rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {viewAllLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </span>
            ) : (
              "View All Bookings"
            )}
          </button>
          <button
            onClick={handleAddNewEvent}
            disabled={addNewLoading}
            className="rounded-xl bg-[#FF5B2C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {addNewLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Navigating...
              </span>
            ) : (
              "Add New Events"
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {metricCards.map((card) => {
          const cardValue =
            card.id === "total"
              ? counts.total
              : card.id === "done"
              ? counts.done
              : card.id === "ongoing"
              ? counts.ongoing
              : card.id === "upcoming"
              ? counts.upcoming
              : card.value;
          return (
            <div
              key={card.id}
              className={`${card.bg} rounded-2xl p-5 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="bg-white/95 p-3.5 rounded-xl flex-shrink-0 shadow-sm">
                  <img
                    src={card.iconSrc}
                    alt={card.title}
                    className="w-9 h-9"
                  />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-white/95 text-xs font-medium mb-1.5 leading-tight">
                    {card.title}
                  </p>
                  <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                    {String(cardValue)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-[30px] border border-[#E1E6F7] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Events List</h2>
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
            {filtersOpen && (
              <>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-10 rounded-xl border border-[#E5E6EF] bg-white px-3 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none"
                  >
                    <option value="">All Types</option>
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none"
                  />
                </div>
              </>
            )}
            <button
              onClick={() => setFiltersOpen((prev) => !prev)}
              aria-expanded={filtersOpen}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]"
            >
              <IoFilterSharp className="h-4 w-4 text-[#8B93AF]" />
              {filtersOpen ? "Hide Filters" : "Filters"}
            </button>
            <button className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]">
              <Download className="h-4 w-4 text-[#8B93AF]" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E5E8F5]">
          <div className="min-w-[1200px]">
            <div className="grid grid-cols-12 gap-4 bg-[#F7F9FD] px-6 py-4">
              <div className="col-span-2">
                <TableHeaderCell
                  onClick={() => handleSort("eventDate")}
                  active={sortBy === "eventDate"}
                  direction={sortDir}
                >
                  Event Date
                </TableHeaderCell>
              </div>
              <div className="col-span-3">
                <TableHeaderCell
                  onClick={() => handleSort("eventName")}
                  active={sortBy === "eventName"}
                  direction={sortDir}
                >
                  Event Name
                </TableHeaderCell>
              </div>
              <div className="col-span-1">
                <TableHeaderCell
                  onClick={() => handleSort("hostedBy")}
                  active={sortBy === "hostedBy"}
                  direction={sortDir}
                >
                  Hosted By
                </TableHeaderCell>
              </div>
              <div className="col-span-1">
                <TableHeaderCell
                  onClick={() => handleSort("type")}
                  active={sortBy === "type"}
                  direction={sortDir}
                >
                  Type
                </TableHeaderCell>
              </div>
              <div className="col-span-2">
                <TableHeaderCell
                  onClick={() => handleSort("location")}
                  active={sortBy === "location"}
                  direction={sortDir}
                >
                  Location
                </TableHeaderCell>
              </div>
              <div className="col-span-1">
                <TableHeaderCell
                  onClick={() => handleSort("ticketsBooked")}
                  active={sortBy === "ticketsBooked"}
                  direction={sortDir}
                >
                  Tickets Booked
                </TableHeaderCell>
              </div>
              <div className="col-span-1 flex justify-end">
                <TableHeaderCell
                  align="right"
                  onClick={() => handleSort("status")}
                  active={sortBy === "status"}
                  direction={sortDir}
                >
                  Status
                </TableHeaderCell>
              </div>
              <div className="col-span-1 flex justify-end">
                <TableHeaderCell align="right">Action</TableHeaderCell>
              </div>
              <div></div>
            </div>

            <div className="divide-y divide-[#EEF1FA] bg-white">
              {filteredRows.map((event) => (
                <div
                  key={event.rowKey}
                  className="grid grid-cols-12 gap-4 px-6 py-5 hover:bg-[#F9FAFD]"
                >
                  <div className="col-span-2 self-center text-sm text-[#5E6582]">
                    {event.eventDate}
                  </div>
                  <div className="col-span-3 flex items-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-[#F0F2F8] flex items-center justify-center">
                      {event.image ? (
                        <Image
                          src={event.image}
                          alt={event.eventName}
                          fill
                          sizes="56px"
                          className="object-cover"
                          unoptimized={true}
                        />
                      ) : (
                        <span
                          className={`text-lg font-semibold text-white ${event.imageBg} h-full w-full flex items-center justify-center`}
                        >
                          {event.eventName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold text-slate-900"
                        dangerouslySetInnerHTML={{ __html: event.eventName }}
                      />
                    </div>
                  </div>
                  <div className="col-span-1 self-center text-sm font-medium text-slate-900">
                    {event.hostedBy}
                  </div>
                  <div className="col-span-1 self-center text-sm text-[#5E6582]">
                    {event.type}
                  </div>
                  <div className="col-span-2 self-center text-sm text-[#5E6582]">
                    {event.location}
                  </div>
                  <div className="col-span-1 flex items-center underline gap-2 self-center text-sm font-semibold whitespace-nowrap">
                    <Link
                      href={
                        event.id
                          ? `/discover-events/tickets-booked/${event.id}`
                          : "#"
                      }
                      className="text-xs text-[#0069C5] hover:text-[#0F4EF1] transition-colors font-semibold"
                    >
                      <span className="text-xs text-[#0069C5]  hover:text-[#0F4EF1] transition-colors">
                        {typeof event.ticketsBooked === "number"
                          ? event.ticketsBooked
                          : 0}{" "}
                      </span>
                      View List
                    </Link>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${event.statusClass}`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <div className="col-span-1 relative flex items-center justify-end gap-2">
                    <span>
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === event.rowKey
                              ? null
                              : event.rowKey
                          )
                        }
                        className="rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {activeDropdown === event.rowKey && (
                        <div
                          ref={dropdownRef}
                          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white z-50"
                        >
                          <div className="py-1">
                            <Link
                              href={
                                event.id
                                  ? `/discover-events/detail/${event.id}`
                                  : "#"
                              }
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View/Edit Detail
                            </Link>
                            <Link
                              href={
                                event.id
                                  ? `/discover-events/tickets-booked/${event.id}`
                                  : "#"
                              }
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Tickets Booked
                            </Link>
                            <Link
                              href={
                                event.id
                                  ? `/discover-events/edit-tickets/${event.id}`
                                  : "#"
                              }
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View/Edit Tickets
                            </Link>

                            <button
                              onClick={() => handleCopyEvent(event.id)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Copy Event
                            </button>
                          </div>
                        </div>
                      )}
                    </span>
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
