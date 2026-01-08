"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, Mail, PlusCircle, AlertCircle } from "lucide-react";
import { TbCaretUpDownFilled } from "react-icons/tb";
import {
  getContacts,
  downloadContactsCSV,
} from "@/services/contact-us/contact.service";

const metricCards = [
  {
    id: "total",
    title: "Total Messages",
    iconSrc: "/images/backend/icons/icons (3).svg",
    bg: "bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF]",
    iconBg: "bg-white",
    textColor: "text-indigo-600",
  },
  {
    id: "new",
    title: "New Today",
    iconSrc: "/images/backend/icons/icons (5).svg",
    bg: "bg-gradient-to-r from-[#E8F8F0] to-[#B8EDD0]",
    iconBg: "bg-white",
    textColor: "text-emerald-600",
  },
  {
    id: "resolved",
    title: "Resolved",
    iconSrc: "/images/backend/icons/icons (4).svg",
    bg: "bg-gradient-to-r from-[#FFE8E8] to-[#FFC5C5]",
    iconBg: "bg-white",
    textColor: "text-red-600",
  },
];

const TableHeaderCell = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-1 text-xs font-medium capitalize tracking-wider text-gray-500 hover:text-gray-700"
  >
    {children}
    <TbCaretUpDownFilled className="h-3.5 w-3.5 text-[#CBCFE2]" />
  </button>
);

export default function ContactUsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, new: 0, resolved: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [limit, setLimit] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getContacts();
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        const mapped = list.map((d) => {
          const created = d?.createdAt || "";
          const createdTs = created ? new Date(created).getTime() : 0;
          const firstName = String(d?.firstName || "").trim();
          const lastName = String(d?.lastName || "").trim();
          return {
            id: d?._id || d?.id,
            firstName,
            lastName,
            email: d?.email || "",
            subject: d?.subject || "",
            message: d?.message || "",
            createdOn: created,
            createdTs,
          };
        });
        setContacts(mapped);
        const total = mapped.length;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const newToday = mapped.filter(
          (m) => m.createdTs >= startOfToday.getTime()
        ).length;
        const resolved = mapped.filter(
          (m) => String(m.status).toLowerCase() === "resolved"
        ).length;
        setMetrics({ total, new: newToday, resolved });
      } catch (e) {
        const msg =
          e?.response?.data?.message || e?.message || "Failed to load contacts";
        setError(msg);
        setContacts([]);
        setMetrics({ total: 0, new: 0, resolved: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = String(searchTerm || "")
      .trim()
      .toLowerCase();
    if (!term) return contacts;
    const termDigits = term.replace(/[^0-9]/g, "");
    return contacts.filter((s) => {
      const firstName = String(s.firstName || "").toLowerCase();
      const lastName = String(s.lastName || "").toLowerCase();
      const email = String(s.email || "").toLowerCase();
      const subject = String(s.subject || "").toLowerCase();
      const message = String(s.message || "").toLowerCase();
      const createdStr = new Date(s.createdOn)
        .toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        .toLowerCase();
      const createdDigits = createdStr.replace(/[^0-9]/g, "");
      const matchesText =
        firstName.includes(term) ||
        lastName.includes(term) ||
        email.includes(term) ||
        subject.includes(term) ||
        message.includes(term) ||
        createdStr.includes(term);
      const matchesDigits = termDigits && createdDigits.includes(termDigits);
      return matchesText || matchesDigits;
    });
  }, [contacts, searchTerm]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "date":
          return (a.createdTs - b.createdTs) * dir;
        case "firstName":
          return (
            String(a.firstName || "").localeCompare(String(b.firstName || "")) *
            dir
          );
        case "lastName":
          return (
            String(a.lastName || "").localeCompare(String(b.lastName || "")) *
            dir
          );
        case "email":
          return (
            String(a.email || "").localeCompare(String(b.email || "")) * dir
          );
        case "subject":
          return (
            String(a.subject || "").localeCompare(String(b.subject || "")) * dir
          );
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return sorted.slice(startIndex, endIndex);
  }, [sorted, page, limit]);

  useEffect(() => {
    const totalPages = Math.ceil(sorted.length / limit) || 1;
    setPageCount(totalPages);

    if (page > totalPages) {
      setPage(1);
    }
  }, [sorted.length, limit]);

  const downloadCsv = async () => {
    try {
      const blob = await downloadContactsCSV();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contact-us.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to download CSV";
      setError(msg);
    }
  };

  return (
    <div className="space-y-4 py-4 px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Contact Us</h1>
          <p className="text-xs text-[#99A1BC]">Dashboard / Contact Us</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {metricCards.map((card) => {
          const value =
            card.id === "total"
              ? metrics.total
              : card.id === "new"
              ? metrics.new
              : metrics.resolved;
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
                    {String(value)}
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
            Contact Us Enquiries
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
            <button
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]"
              onClick={downloadCsv}
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
          <div className="w-full overflow-hidden">
            <div className="grid grid-cols-[14%_11%_11%_18%_14%_1fr] gap-3 bg-[#F7F9FD] px-4 py-3">
              <div>
                <TableHeaderCell onClick={() => toggleSort("date")}>
                  Submitted On
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell onClick={() => toggleSort("firstName")}>
                  First Name
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell onClick={() => toggleSort("lastName")}>
                  Last Name
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell onClick={() => toggleSort("email")}>
                  Email
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell onClick={() => toggleSort("subject")}>
                  Subject
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell>Message</TableHeaderCell>
              </div>
            </div>

            <div className="divide-y divide-[#EEF1FA] bg-white">
              {loading && (
                <div className="px-4 py-3 text-xs text-[#5E6582]">
                  Loading...
                </div>
              )}
              {error && !loading && (
                <div className="px-4 py-3 text-xs text-red-600">{error}</div>
              )}
              {!loading &&
                !error &&
                paginatedBookings?.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="grid grid-cols-[14%_11%_11%_18%_14%_1fr] gap-3 px-4 py-3 hover:bg-[#F9FAFD]"
                  >
                    <div className="self-center text-xs text-[#5E6582] line-clamp-2">
                      {(() => {
                        const d = s.createdOn;
                        if (!d || d === "-") return "-";
                        const date = new Date(d);
                        return date.toLocaleString(undefined, {
                          weekday: "short",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      })()}
                    </div>
                    <div className="self-center text-xs font-semibold text-slate-900 line-clamp-2">
                      {s.firstName || "-"}
                    </div>
                    <div className="self-center text-xs font-semibold text-slate-900 line-clamp-2">
                      {s.lastName || "-"}
                    </div>
                    <div className="self-center text-xs text-[#5E6582] line-clamp-2">
                      {s.email || "-"}
                    </div>
                    <div className="self-center text-xs text-[#5E6582] line-clamp-2">
                      {s.subject || "-"}
                    </div>
                    <div
                      className="self-center text-xs text-[#5E6582] line-clamp-2 cursor-pointer"
                      title={String(s.message || "")}
                    >
                      {s.message || "-"}
                    </div>
                  </div>
                ))}
              {!loading && !error && filtered.length === 0 && (
                <div className="px-4 py-3 text-xs text-[#5E6582]">
                  No contacts found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
