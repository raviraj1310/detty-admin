"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import { TbCaretUpDownFilled } from "react-icons/tb";
import {
  eventReferralReport,
  activityReferralReport,
} from "@/services/booking/booking.service";
import { downloadExcel } from "@/utils/excelExport";

const toImageSrc = (u) => {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  let origin = originEnv;
  if (!origin) {
    try {
      origin = new URL(apiBase).origin;
    } catch {
      origin = "";
    }
  }
  if (!origin) origin = originEnv;
  const base = origin.replace(/\/+$/, "");
  const path = s.replace(/^\/+/, "");
  return base ? `${base}/${path}` : s;
};

const currency = (n) => {
  const num = typeof n === "number" ? n : Number(n || 0);
  if (Number.isNaN(num)) return "-";
  return `₦${num.toLocaleString()}`;
};

const fmtDateTime = (dateInput, timeInput) => {
  const raw =
    dateInput && typeof dateInput === "object" && dateInput.$date
      ? dateInput.$date
      : dateInput;
  const dt = raw ? new Date(raw) : null;
  if (!dt || isNaN(dt.getTime())) return "-";
  const day = dt.toLocaleDateString(undefined, { weekday: "short" });
  const month = dt.toLocaleDateString(undefined, { month: "long" });
  const dayNum = dt.toLocaleDateString(undefined, { day: "2-digit" });
  const year = dt.toLocaleDateString(undefined, { year: "numeric" });
  let timeStr = "";
  if (typeof timeInput === "string" && timeInput.trim()) {
    timeStr = timeInput.trim();
  } else {
    timeStr = dt.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return `${day}, ${month} ${dayNum}, ${year} at ${timeStr}`;
};

export default function ReferralReportsPage() {
  const [activeTab, setActiveTab] = useState("event");
  const [searchTerm, setSearchTerm] = useState("");
  const [eventRows, setEventRows] = useState([]);
  const [activityRows, setActivityRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [limit, setLimit] = useState(50);
  const [eventPage, setEventPage] = useState(1);
  const [eventPageCount, setEventPageCount] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageCount, setActivityPageCount] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [eventRes, activityRes] = await Promise.all([
          eventReferralReport(),
          activityReferralReport(),
        ]);
        const rawEvents = Array.isArray(eventRes?.data)
          ? eventRes.data
          : Array.isArray(eventRes)
          ? eventRes
          : [];
        const rawActivities = Array.isArray(activityRes?.data)
          ? activityRes.data
          : Array.isArray(activityRes)
          ? activityRes
          : [];

        const ticketsTextSimple = (arr) => {
          const list = Array.isArray(arr) ? arr : [];
          return list
            .map((t) => `${t.quantity || 0} x ${t.ticketName || "-"}`)
            .join(" | ");
        };
        const ticketsTotalSimple = (arr) => {
          const list = Array.isArray(arr) ? arr : [];
          return list.reduce(
            (sum, t) =>
              sum +
              (Number(
                t.totalPrice ||
                  Number(t.perTicketPrice || 0) * Number(t.quantity || 0)
              ) || 0),
            0
          );
        };

        const mappedEvents = rawEvents.map((b, idx) => {
          const e = b?.eventId || b?.event || {};
          const qty = typeof b?.quantity === "number" ? b.quantity : 0;
          const firstTicket = Array.isArray(b?.tickets) ? b.tickets[0] : null;
          const baseType =
            firstTicket?.ticketType || e?.eventType || b?.type || "-";
          const evName =
            e?.eventName || e?.title || b?.eventName || b?.title || "-";
          const evType =
            (e?.eventType && e?.eventType.name) || e?.eventType || baseType;
          const evImg = toImageSrc(
            e?.image || b?.eventImage || e?.uploadImage || ""
          );
          return {
            id: b?._id || b?.bookingId || `booking-${idx}`,
            eventDate: fmtDateTime(
              b?.arrivalDate || e?.eventStartDate,
              e?.eventStartTime
            ),
            eventName: evName,
            eventImage: evImg,
            referralCode: b?.referralCode || "-",
            type: evType,
            ticketsBooked: qty
              ? `${qty} x ${firstTicket?.ticketName || "-"}`
              : ticketsTextSimple(b?.tickets),
            amount: ticketsTotalSimple(b?.tickets),
            eventStatus: String(b?.status || "Pending"),
            paymentStatus: String(b?.paymentStatus || "Pending"),
          };
        });

        const mappedActivities = rawActivities.map((b, idx) => {
          const a = b?.activityId || b?.activity || {};
          const aName = a?.activityName || b?.activityName || "-";
          const aImg = toImageSrc(
            a?.image || b?.activityImage || a?.uploadImage || ""
          );
          const type =
            a?.activityType?.activityTypeName ||
            b?.activity?.activityType?.activityTypeName ||
            a?.type ||
            b?.type ||
            "-";
          return {
            id: b?._id || b?.id || b?.bookingId || `booking-${idx}`,
            eventDate: fmtDateTime(b?.arrivalDate),
            activityName: aName,
            activityImage: aImg,
            referralCode: b?.referralCode || b?.referral || "-",
            type,
            ticketsBooked: ticketsTextSimple(b?.tickets),
            amount: ticketsTotalSimple(b?.tickets),
            activityStatus: String(
              b?.status || b?.activityStatus || b?.bookingStatus || "Pending"
            ),
            paymentStatus: String(b?.paymentStatus || "-"),
          };
        });

        setEventRows(mappedEvents);
        setActivityRows(mappedActivities);
      } catch (e) {
        setError("Failed to load referral reports");
        setEventRows([]);
        setActivityRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEvent = useMemo(() => {
    const t = String(searchTerm || "")
      .trim()
      .toLowerCase();
    const base = Array.isArray(eventRows) ? eventRows : [];
    if (!t) return base;
    return base.filter((r) => {
      const s =
        `${r.eventDate} ${r.eventName} ${r.referralCode} ${r.type} ${r.ticketsBooked} ${r.eventStatus} ${r.paymentStatus}`.toLowerCase();
      return s.includes(t);
    });
  }, [searchTerm, eventRows]);

  const filteredActivity = useMemo(() => {
    const t = String(searchTerm || "")
      .trim()
      .toLowerCase();
    const base = Array.isArray(activityRows) ? activityRows : [];
    if (!t) return base;
    return base.filter((r) => {
      const s =
        `${r.eventDate} ${r.activityName} ${r.referralCode} ${r.type} ${r.ticketsBooked} ${r.activityStatus} ${r.paymentStatus}`.toLowerCase();
      return s.includes(t);
    });
  }, [searchTerm, activityRows]);

  const paginatedEvent = useMemo(() => {
    const startIndex = (eventPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredEvent.slice(startIndex, endIndex);
  }, [filteredEvent, eventPage, limit]);

  const paginatedActivity = useMemo(() => {
    const startIndex = (activityPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredActivity.slice(startIndex, endIndex);
  }, [filteredActivity, activityPage, limit]);

  useEffect(() => {
    const totalEventPages = Math.ceil(filteredEvent.length / limit) || 1;
    setEventPageCount(totalEventPages);
    if (eventPage > totalEventPages) setEventPage(1);
  }, [filteredEvent.length, limit]);

  useEffect(() => {
    const totalActivityPages = Math.ceil(filteredActivity.length / limit) || 1;
    setActivityPageCount(totalActivityPages);
    if (activityPage > totalActivityPages) setActivityPage(1);
  }, [filteredActivity.length, limit]);

  const toCsvCell = (v) => {
    const s = String(v ?? "");
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const handleDownload = () => {
    const rows = activeTab === "event" ? filteredEvent : filteredActivity;
    const headers =
      activeTab === "event"
        ? [
            "Event Date",
            "Event Name",
            "Referral Code",
            "Type",
            "Tickets Booked",
            "Amount",
            "Event Status",
            "Payment Status",
          ]
        : [
            "Added On",
            "Activity Name",
            "Referral Code",
            "Type",
            "Tickets Booked",
            "Amount",
            "Status",
            "Payment Status",
          ];
    const lines = [];
    lines.push(headers.map(toCsvCell).join(","));
    rows.forEach((r) => {
      if (activeTab === "event") {
        lines.push(
          [
            r.eventDate,
            r.eventName,
            r.referralCode,
            r.type,
            r.ticketsBooked,
            r.amount,
            r.eventStatus,
            r.paymentStatus,
          ]
            .map(toCsvCell)
            .join(",")
        );
      } else {
        lines.push(
          [
            r.eventDate,
            r.activityName,
            r.referralCode,
            r.type,
            r.ticketsBooked,
            r.amount,
            r.activityStatus,
            r.paymentStatus,
          ]
            .map(toCsvCell)
            .join(",")
        );
      }
    });
    const csv = `\ufeff${lines.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      activeTab === "event"
        ? "event-referral-report.csv"
        : "activity-referral-report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTickets = (tickets = []) => {
    if (!Array.isArray(tickets)) return "";
    return tickets
      .map(
        (t) =>
          `${t.quantity || 0} x ${t.ticketName || "-"} (${t.ticketType || "-"})`
      )
      .join(" | ");
  };

  const safeDate = (v) => (v ? new Date(v).toISOString() : "");

  const handleDownloadEventReferralExcel = async () => {
    try {
      setExporting(true);

      const res = await eventReferralReport();
      const data = Array.isArray(res?.data) ? res.data : [];
      if (!data.length) return;

      const excelData = data.map((b) => ({
        // 🔹 Booking
        "Booking ID": b?._id,
        "Order ID": b?.orderId,
        "Referral Code": b?.referralCode || "-",

        // 🔹 Buyer
        "Buyer Name": b?.buyer?.fullName || "-",
        "Buyer Email": b?.buyer?.email || "-",
        Country: b?.buyer?.country || "-",
        City: b?.buyer?.city || "-",

        // 🔹 Event
        "Event Name": b?.eventId?.eventName || "-",
        Slug: b?.eventId?.slug || "-",
        Location: b?.eventId?.location || "-",
        "Event Start Date": safeDate(b?.eventId?.eventStartDate),
        "Event End Date": safeDate(b?.eventId?.eventEndDate),

        // 🔹 Booking Details
        "Arrival Date": safeDate(b?.arrivalDate),
        Quantity: b?.quantity || 0,
        Tickets: formatTickets(b?.tickets),

        // 🔹 Pricing
        "Total Amount": b?.totalAmount || 0,
        "Final Payable Amount": b?.finalPayableAmount || 0,
        "Service Fee": b?.pricing?.serviceFee || 0,
        "Discount Applied": b?.pricing?.discountApplied || 0,

        // 🔹 Meta
        "Created At": safeDate(b?.createdAt),
        "Updated At": safeDate(b?.updatedAt),
      }));

      downloadExcel(excelData, "Event-Referral-Report.xlsx");
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadActivityReferralExcel = async () => {
    try {
      setExporting(true);

      const res = await activityReferralReport();
      const data = Array.isArray(res?.data) ? res.data : [];
      if (!data.length) return;

      const excelData = data.map((b) => ({
        // 🔹 Booking
        "Booking ID": b?._id,
        "Order ID": b?.orderId,
        "Referral Code": b?.referralCode || "-",

        // 🔹 Buyer
        "Buyer Name": b?.buyer?.fullName || "-",
        "Buyer Email": b?.buyer?.email || "-",
        Country: b?.buyer?.country || "-",
        City: b?.buyer?.city || "-",

        // 🔹 Activity
        "Activity Name": b?.activityId?.activityName || "-",
        Type:
          b?.activityId?.activityType?.activityTypeName ||
          b?.activityType ||
          "-",
        Location: b?.activityId?.location || "-",

        // 🔹 Booking Details
        "Arrival Date": safeDate(b?.arrivalDate),
        Quantity: b?.quantity || 0,
        Tickets: formatTickets(b?.tickets),

        // 🔹 Pricing
        "Total Amount": b?.totalAmount || 0,
        "Final Payable Amount": b?.finalPayableAmount || 0,
        "Service Fee": b?.pricing?.serviceFee || 0,
        "Discount Applied": b?.pricing?.discountApplied || 0,

        // 🔹 Meta
        "Created At": safeDate(b?.createdAt),
        "Updated At": safeDate(b?.updatedAt),
      }));

      downloadExcel(excelData, "Activity-Referral-Report.xlsx");
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };
  const currentPage = activeTab === "event" ? eventPage : activityPage;
  const currentPageCount =
    activeTab === "event" ? eventPageCount : activityPageCount;

  const setCurrentPage = activeTab === "event" ? setEventPage : setActivityPage;

  return (
    <div className="min-h-full bg-[#F4F6FB]">
      <div className="rounded-[30px] border border-white/80 bg-white">
        <div className="p-3 sm:p-5 lg:p-5">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-slate-900">
              Referral Reports
            </h1>
            <p className="text-xs text-[#99A1BC]">Dashboard / Reports</p>
          </div>

          <div className="rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("event")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    activeTab === "event"
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-[#E5E6EF]"
                  }`}
                >
                  Event
                </button>
                <button
                  onClick={() => setActiveTab("activity")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    activeTab === "activity"
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-[#E5E6EF]"
                  }`}
                >
                  Activity
                </button>
              </div>
              <div className="flex items-center gap-2">
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
                {activeTab === "event" ? (
                  <button
                    onClick={handleDownloadEventReferralExcel}
                    disabled={exporting}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]"
                  >
                    <Download className="h-3.5 w-3.5 text-[#8B93AF]" />
                  </button>
                ) : (
                  <button
                    onClick={handleDownloadActivityReferralExcel}
                    disabled={exporting}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]"
                  >
                    <Download className="h-3.5 w-3.5 text-[#8B93AF]" />
                  </button>
                )}

                <div className="flex items-center gap-2">
                  {/* LIMIT */}
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

                  {/* CONTROLS */}
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]"
                  >
                    Prev
                  </button>

                  <span className="text-xs text-[#2D3658]">
                    Page {currentPage} of {currentPageCount}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(currentPageCount, p + 1))
                    }
                    disabled={currentPage >= currentPageCount}
                    className="h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {activeTab === "event" ? (
              <div className="rounded-xl border border-[#E5E8F5]">
                <div className="grid grid-cols-[16%_16%_10%_8%_14%_9%_12%_12%] gap-2 bg-[#F7F9FD] px-3 py-2.5">
                  <div className="flex items-center text-xs font-medium capitalize tracking-wider text-gray-500">
                    <span>Event Date</span>
                    <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                  </div>
                  <div className="flex items-center text-xs font-medium capitalize tracking-wider text-gray-500">
                    <span>Event Name</span>
                    <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Referral Code
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Type
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Tickets Booked
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Amount
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Event Status
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Payment Status
                  </div>
                </div>
                <div className="divide-y divide-[#EEF1FA] bg-white">
                  {loading && filteredEvent.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-[#5E6582]">
                      Loading…
                    </div>
                  ) : filteredEvent.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-[#5E6582]">
                      {error ? error : "No records found"}
                    </div>
                  ) : (
                    paginatedEvent?.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[16%_16%_10%_8%_14%_9%_12%_12%] gap-2 px-3 py-2.5 hover:bg-[#F9FAFD]"
                      >
                        <div className="self-center text-xs text-[#5E6582] line-clamp-2">
                          {row.eventDate}
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={row.eventImage || "/images/no-image.webp"}
                            alt="Event"
                            className="h-8 w-8 rounded object-cover bg-gray-200 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "/images/no-image.webp";
                            }}
                          />
                          <span className="text-xs font-medium text-gray-900 line-clamp-2">
                            {row.eventName}
                          </span>
                        </div>
                        <div className="self-center text-xs text-[#5E6582]">
                          {row.referralCode}
                        </div>
                        <div className="self-center text-xs text-gray-900">
                          {row.type}
                        </div>
                        <div className="self-center text-xs text-gray-900 line-clamp-2">
                          {row.ticketsBooked}
                        </div>
                        <div className="self-center text-xs font-semibold text-gray-900">
                          {currency(row.amount)}
                        </div>
                        <div className="self-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F6FA] text-[#5E6582]">
                            {row.eventStatus}
                          </span>
                        </div>
                        <div className="self-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F6FA] text-[#5E6582]">
                            {row.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#E5E8F5]">
                <div className="grid grid-cols-[16%_16%_10%_8%_14%_9%_12%_12%] gap-2 bg-[#F7F9FD] px-3 py-2.5">
                  <div className="flex items-center text-xs font-medium capitalize tracking-wider text-gray-500">
                    <span>Added On</span>
                    <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                  </div>
                  <div className="flex items-center text-xs font-medium capitalize tracking-wider text-gray-500">
                    <span>Activity Name</span>
                    <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Referral Code
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Type
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Tickets Booked
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Amount
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Status
                  </div>
                  <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
                    Payment Status
                  </div>
                </div>
                <div className="divide-y divide-[#EEF1FA] bg-white">
                  {loading && filteredActivity.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-[#5E6582]">
                      Loading…
                    </div>
                  ) : filteredActivity.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-[#5E6582]">
                      {error ? error : "No records found"}
                    </div>
                  ) : (
                    paginatedActivity.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[16%_16%_10%_8%_14%_9%_12%_12%] gap-2 px-3 py-2.5 hover:bg-[#F9FAFD]"
                      >
                        <div className="self-center text-xs text-[#5E6582] line-clamp-2">
                          {row.eventDate}
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={row.activityImage || "/images/no-image.webp"}
                            alt="Activity"
                            className="h-8 w-8 rounded object-cover bg-gray-200 flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = "/images/no-image.webp";
                            }}
                          />
                          <span className="text-xs font-medium text-gray-900 line-clamp-2">
                            {row.activityName}
                          </span>
                        </div>
                        <div className="self-center text-xs text-[#5E6582]">
                          {row.referralCode}
                        </div>
                        <div className="self-center text-xs text-gray-900">
                          {row.type}
                        </div>
                        <div className="self-center text-xs text-gray-900 line-clamp-2">
                          {row.ticketsBooked}
                        </div>
                        <div className="self-center text-xs font-semibold text-gray-900">
                          {currency(row.amount)}
                        </div>
                        <div className="self-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F6FA] text-[#5E6582]">
                            {row.activityStatus}
                          </span>
                        </div>
                        <div className="self-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F6FA] text-[#5E6582]">
                            {row.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
