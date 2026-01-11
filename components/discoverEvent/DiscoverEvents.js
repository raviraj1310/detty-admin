"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { getUsers } from "@/services/users/user.service";
import { downloadExcel } from "@/utils/excelExport";

const metricCards = [
  {
    id: "total",
    title: "Total Events",
    value: "1540",
    iconSrc: "/images/backend/icons/icons (3).svg",
    accent: "from-[#2563EB] to-[#1D4ED8]",
    textColor: "text-indigo-600",
    bg: "bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF]",
    iconBg: "bg-white",
  },
  {
    id: "done",
    title: "Done Events",
    value: "1240",
    iconSrc: "/images/backend/icons/icons (5).svg",
    bg: "bg-gradient-to-r from-[#E8F8F0] to-[#B8EDD0]",
    accent: "from-[#15803D] to-[#166534]",
    textColor: "text-emerald-600",
    iconBg: "bg-white",
  },
  {
    id: "ongoing",
    title: "Ongoing Events",
    value: "1",
    iconSrc: "/images/backend/icons/icons (2).svg",
    bg: "bg-gradient-to-r from-[#FFF4E8] to-[#FFE4C5]",
    textColor: "text-orange-600",
    iconBg: "bg-white",
  },
  {
    id: "upcoming",
    title: "Upcoming Events",
    value: "100",
    iconSrc: "/images/backend/icons/icons (4).svg",
    bg: "bg-gradient-to-r from-[#FFE8E8] to-[#FFC5C5]",
    accent: "from-[#DC2626] to-[#B91C1C]",
    textColor: "text-red-600",
    iconBg: "bg-white",
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
    className={`flex items-center gap-1 text-xs font-medium capitalize tracking-wider ${
      active ? "text-gray-500" : "text-gray-500"
    } ${
      align === "right" ? "justify-end" : "justify-start"
    } hover:text-gray-700`}
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
  const [exporting, setExporting] = useState(false);
  const [limit, setLimit] = useState(50);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);

  const role =
    typeof window !== "undefined" ? localStorage.getItem("user_role") : null;

  const isPartner = role === "Partner";

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
    const statusLc = String(r.status || "").toLowerCase();

    const matchesText =
      name.includes(term) ||
      host.includes(term) ||
      typeLc.includes(term) ||
      locLc.includes(term) ||
      dateStr.includes(term) ||
      statusLc.includes(term); // ✅

    const matchesDigits = digits && dateDigits.includes(digits);
    return (matchesText || matchesDigits) && typeOk && locationOk && statusOk;
  });

  const paginatedBookings = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, page, limit]);

  useEffect(() => {
    const totalPages = Math.ceil(filteredRows.length / limit) || 1;
    setPageCount(totalPages);

    if (page > totalPages) {
      setPage(1);
    }
  }, [filteredRows.length, limit]);

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

  const handleDownloadExcel = () => {
    try {
      setExporting(true);

      if (!events.length) return;

      const dataToExport = events.map((e) => ({
        // 🔹 Event Info
        "Event Name": e.eventName,
        Slug: e.slug,
        Location: e.location,
        "Map Location": e.mapLocation,
        "Opening Hours": e.openingHours,
        About: e.about,

        // 🔹 Dates
        "Event Start Date": e.eventStartDate,
        "Event End Date": e.eventEndDate,
        "Created At": e.createdAt,
        "Updated At": e.updatedAt,

        // 🔹 Event Type (flattened)
        "Event Type": e.eventTypeId?.eventType,
        "Event Type Status": e.eventTypeId?.status,

        // 🔹 Media & Links
        Image: e.image,
        "Twitter Link": e.twitterLink,
        "Website Link": e.websiteLink,

        // 🔹 Business / Metrics
        "Business Name": e.businessName,
        Status: e.status ? "Active" : "Inactive",
        "Total Booked Tickets": e.totalBookedTickets,
      }));

      downloadExcel(dataToExport, "Events.xlsx");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-7 py-6 px-6">
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
          <h1 className="text-xl font-semibold text-slate-900">
            Discover Events
          </h1>
          <p className="text-xs text-[#99A1BC]">Dashboard / Discover Events</p>
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
          {!isPartner && (
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              className={`${card.bg} rounded-xl p-3 relative overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100`}
            >
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`${card.iconBg} p-2.5 rounded-lg flex-shrink-0 shadow-sm`}
                >
                  <img
                    src={card.iconSrc}
                    alt={card.title}
                    className="w-7 h-7"
                  />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p
                    className={`${card.textColor} opacity-80 text-xs font-medium mb-0.5 leading-tight`}
                  >
                    {card.title}
                  </p>
                  <p
                    className={`text-2xl font-bold ${card.textColor} tracking-tight`}
                  >
                    {String(cardValue)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Events List
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] pl-8 pr-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              />
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#A6AEC7]" />
            </div>
            {filtersOpen && (
              <>
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-8 rounded-lg border border-[#E5E6EF] bg-white px-2 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none"
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
                    className="h-8 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-2 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none"
                  />
                </div>
              </>
            )}
            <button
              onClick={() => setFiltersOpen((prev) => !prev)}
              aria-expanded={filtersOpen}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]"
            >
              <IoFilterSharp className="h-3.5 w-3.5 text-[#8B93AF]" />
              {filtersOpen ? "Hide Filters" : "Filters"}
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={exporting}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]"
            >
              <Download className="h-3.5 w-3.5 text-[#8B93AF]" />
            </button>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-[#2D3658]">
                Show
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) || 20)}
                  className="h-8 px-2 border border-[#E5E6EF] rounded-lg text-xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]"
                >
                  Prev
                </button>
                <span className="text-xs text-[#2D3658]">
                  Page {page} of {pageCount}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page >= pageCount}
                  className="h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E8F5] overflow-hidden">
          <div className="w-full">
            <div className="grid grid-cols-[13%_21%_11%_8%_17%_13%_9%_8%] bg-[#F7F9FD] px-2 py-3">
              <div>
                <TableHeaderCell
                  onClick={() => handleSort("eventDate")}
                  active={sortBy === "eventDate"}
                  direction={sortDir}
                >
                  Event Date
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell
                  onClick={() => handleSort("eventName")}
                  active={sortBy === "eventName"}
                  direction={sortDir}
                >
                  Event Name
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell
                  onClick={() => handleSort("hostedBy")}
                  active={sortBy === "hostedBy"}
                  direction={sortDir}
                >
                  Hosted By
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell
                  onClick={() => handleSort("type")}
                  active={sortBy === "type"}
                  direction={sortDir}
                >
                  Type
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell
                  onClick={() => handleSort("location")}
                  active={sortBy === "location"}
                  direction={sortDir}
                >
                  Location
                </TableHeaderCell>
              </div>
              <div className="flex justify-center">
                <TableHeaderCell
                  onClick={() => handleSort("ticketsBooked")}
                  active={sortBy === "ticketsBooked"}
                  direction={sortDir}
                >
                  Tickets Booked
                </TableHeaderCell>
              </div>
              <div className="flex justify-center">
                <TableHeaderCell
                  onClick={() => handleSort("status")}
                  active={sortBy === "status"}
                  direction={sortDir}
                >
                  Status
                </TableHeaderCell>
              </div>
              <div className="flex justify-end">
                <TableHeaderCell align="right">Action</TableHeaderCell>
              </div>
            </div>

            <div className="divide-y divide-[#EEF1FA] bg-white">
              {paginatedBookings?.map((event) => (
                <div
                  key={event.rowKey}
                  className="grid grid-cols-[13%_21%_11%_8%_17%_13%_9%_8%] px-2 py-3 hover:bg-[#F9FAFD]"
                >
                  <div className="self-center text-xs text-[#5E6582] line-clamp-2">
                    {event.eventDate}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-[#F0F2F8] flex items-center justify-center">
                      {event.image ? (
                        <Image
                          src={event.image}
                          alt={event.eventName}
                          fill
                          sizes="32px"
                          className="object-cover"
                          unoptimized={true}
                        />
                      ) : (
                        <span
                          className={`text-xs font-semibold text-white ${event.imageBg} h-full w-full flex items-center justify-center`}
                        >
                          {event.eventName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-semibold text-slate-900 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: event.eventName }}
                      />
                    </div>
                  </div>
                  <div className="self-center text-xs font-medium text-slate-900 line-clamp-2">
                    {event.hostedBy}
                  </div>
                  <div className="self-center text-xs text-[#5E6582] line-clamp-2">
                    {event.type}
                  </div>
                  <div className="self-center text-xs text-[#5E6582] line-clamp-2">
                    {event.location}
                  </div>
                  <div className="flex items-center justify-center self-center text-xs font-semibold">
                    <Link
                      href={
                        event.id
                          ? `/discover-events/tickets-booked/${event.id}`
                          : "#"
                      }
                      className="text-xs text-[#0069C5] hover:text-[#0F4EF1] transition-colors font-semibold underline"
                    >
                      {typeof event.ticketsBooked === "number"
                        ? event.ticketsBooked
                        : 0}{" "}
                      View List
                    </Link>
                  </div>
                  <div className="flex items-center justify-center self-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${event.statusClass}`}
                    >
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-end self-center">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === event.rowKey
                              ? null
                              : event.rowKey
                          )
                        }
                        className="rounded-full border border-transparent p-1 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {activeDropdown === event.rowKey && (
                        <div
                          ref={dropdownRef}
                          className="absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg bg-white z-[100] border border-gray-200"
                        >
                          <div className="py-1">
                            {/* ❌ Hide for Partner */}
                            {!isPartner && (
                              <>
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
                                      ? `/discover-events/edit-tickets/${event.id}`
                                      : "#"
                                  }
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  View/Edit Tickets
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
                                <button
                                  onClick={() => handleCopyEvent(event.id)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Copy Event
                                </button>
                              </>
                            )}

                            {/* ✅ Show ONLY for Partner */}
                            {isPartner && (
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
                            )}
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
    </div>
  );
}
