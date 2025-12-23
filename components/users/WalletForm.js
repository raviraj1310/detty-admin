"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Download, MoreVertical } from "lucide-react";
import { IoFilterSharp } from "react-icons/io5";
import { TbCaretUpDownFilled } from "react-icons/tb";
import { getAllUsersWallet } from "@/services/users/user.service";

const metricCards = [
  {
    id: "balance",
    title: "Total Balance",
    value: "0",
    iconSrc: "/images/backend/icons/icons (3).svg",
    bg: "bg-[#4F46E5]",
  },
  {
    id: "completed",
    title: "Completed",
    value: "0",
    iconSrc: "/images/backend/icons/icons (5).svg",
    bg: "bg-[#059669]",
  },
  {
    id: "pending",
    title: "Pending",
    value: "0",
    iconSrc: "/images/backend/icons/icons (2).svg",
    bg: "bg-[#EA580C]",
  },
  {
    id: "failed",
    title: "Failed",
    value: "0",
    iconSrc: "/images/backend/icons/icons (4).svg",
    bg: "bg-[#DC2626]",
  },
];

const mapTransaction = (t) => {
  const created = t?.createdAt || "";
  const transactionDate = created
    ? new Date(created).toLocaleString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

  const amount = Number(t?.amount || 0);
  const type = String(t?.type || "").toUpperCase();
  const amountStr =
    type === "CREDIT"
      ? `+₦${amount.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : `-₦${amount.toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;

  const status = String(t?.status || "").toLowerCase();
  const paymentStatus =
    status === "success"
      ? "Completed"
      : status === "failed" || status === "error"
      ? "Failed"
      : "Pending";

  return {
    id: t?._id || Math.random().toString(36).slice(2),
    rawId: t?._id || "",
    transactionDate,
    transactionName: t?.user?.name || t?.source || "-",
    userEmail: t?.user?.email || "-",
    source: t?.source || "-",
    type: type,
    amount: amountStr,
    amountNum: amount,
    paymentStatus,
    status: status,
    reference: t?.reference || "-",
    createdAt: created,
    createdAtTs: created ? new Date(created).getTime() : 0,
  };
};

const TableHeaderCell = ({ children, align = "left", onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] text-[#8A92AC] ${
      align === "right" ? "justify-end" : "justify-start"
    } hover:text-[#2D3658]`}
  >
    {children}
    <TbCaretUpDownFilled className="h-3.5 w-3.5 text-[#CBCFE2]" />
  </button>
);

export default function WalletForm() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [grandTotalBalance, setGrandTotalBalance] = useState(0);
  const [sortKey, setSortKey] = useState("transactionDate");
  const [sortDir, setSortDir] = useState("desc");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAllUsersWallet();
        const data = res?.data || res || {};
        const transactionsList = Array.isArray(data?.transactions)
          ? data.transactions
          : [];
        setTransactions(transactionsList.map(mapTransaction));
        const total = Number(data?.grandTotalBalance ?? 0);
        setGrandTotalBalance(total);
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load wallet data";
        setError(msg);
        setTransactions([]);
        setGrandTotalBalance(0);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const term = String(searchTerm || "").trim().toLowerCase();
    if (!term && !typeFilter && !statusFilter) return transactions;

    return transactions.filter((t) => {
      const name = String(t.transactionName || "").toLowerCase();
      const email = String(t.userEmail || "").toLowerCase();
      const source = String(t.source || "").toLowerCase();
      const type = String(t.type || "").toLowerCase();
      const reference = String(t.reference || "").toLowerCase();
      const status = String(t.paymentStatus || "").toLowerCase();

      const matchesText = !term
        ? true
        : name.includes(term) ||
          email.includes(term) ||
          source.includes(term) ||
          type.includes(term) ||
          reference.includes(term) ||
          status.includes(term);

      const typeOk = typeFilter
        ? type.includes(String(typeFilter).toLowerCase())
        : true;
      const statusOk = statusFilter
        ? status.includes(String(statusFilter).toLowerCase())
        : true;

      return matchesText && typeOk && statusOk;
    });
  }, [transactions, searchTerm, typeFilter, statusFilter]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedTransactions = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filteredTransactions].sort((a, b) => {
      switch (sortKey) {
        case "transactionDate":
          return (a.createdAtTs - b.createdAtTs) * dir;
        case "transactionName":
          return String(a.transactionName || "").localeCompare(String(b.transactionName || "")) * dir;
        case "type":
          return String(a.type || "").localeCompare(String(b.type || "")) * dir;
        case "amount":
          return (a.amountNum - b.amountNum) * dir;
        case "status":
          return String(a.paymentStatus || "").localeCompare(String(b.paymentStatus || "")) * dir;
        default:
          return 0;
      }
    });
  }, [filteredTransactions, sortKey, sortDir]);

  const counts = useMemo(() => {
    const c = { completed: 0, pending: 0, failed: 0 };
    filteredTransactions.forEach((t) => {
      const s = String(t.paymentStatus || "").toLowerCase();
      if (s === "completed") c.completed += 1;
      else if (s === "pending") c.pending += 1;
      else if (s === "failed") c.failed += 1;
    });
    return c;
  }, [filteredTransactions]);

  const formatBalance = (amount) => {
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const statusClass = (s) => {
    const v = String(s || "").toLowerCase();
    if (v === "completed") return "bg-emerald-50 text-emerald-600 border border-emerald-200";
    if (v === "pending") return "bg-orange-50 text-orange-600 border border-orange-200";
    return "bg-red-50 text-red-600 border border-red-200";
  };

  const getAmountColor = (amount) => {
    if (amount.startsWith("-")) return "text-red-600 font-semibold";
    if (amount.startsWith("+")) return "text-green-600 font-semibold";
    return "text-gray-900 font-semibold";
  };

  const typeOptions = ["CREDIT", "DEBIT"];
  const statusOptions = ["Completed", "Pending", "Failed"];

  return (
    <div className="space-y-4 py-4 px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">Wallet</h1>
          <p className="text-xs text-[#99A1BC]">Dashboard / Wallet</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 mb-4">
        {metricCards.map((card) => {
          const value =
            card.id === "balance"
              ? formatBalance(grandTotalBalance)
              : card.id === "completed"
              ? counts.completed
              : card.id === "pending"
              ? counts.pending
              : counts.failed;
          return (
            <div
              key={card.id}
              className={`${card.bg} rounded-xl p-3 text-white relative overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="bg-white/95 p-2.5 rounded-lg flex-shrink-0 shadow-sm">
                  <img src={card.iconSrc} alt={card.title} className="w-7 h-7" />
                </div>
                <div className="text-right flex-1 min-w-0">
                  <p className="text-white/95 text-xs font-medium mb-0.5 leading-tight">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-white tracking-tight">
                    {loading && card.id === "balance" ? "..." : String(value)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Transaction List</h2>
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
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 rounded-lg border border-[#E5E6EF] bg-white px-2 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none"
                  >
                    <option value="">All Status</option>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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
            <button className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E6EF] bg-white px-3 text-xs font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]">
              <Download className="h-3.5 w-3.5 text-[#8B93AF]" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E8F5] overflow-hidden">
          <div className="w-full overflow-hidden">
            <div className="grid grid-cols-[18%_22%_12%_18%_15%_15%] gap-0 bg-[#F7F9FD] px-3 py-3">
              <div>
                <TableHeaderCell onClick={() => toggleSort("transactionDate")}>
                  Transaction Date
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell onClick={() => toggleSort("transactionName")}>
                  Transaction Name
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell onClick={() => toggleSort("type")}>
                  Type
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell onClick={() => toggleSort("amount")}>
                  Amount
                </TableHeaderCell>
              </div>
              <div>
                <TableHeaderCell onClick={() => toggleSort("status")}>
                  Status
                </TableHeaderCell>
              </div>
              <div></div>
            </div>

            <div className="divide-y divide-[#EEF1FA] bg-white">
              {loading && (
                <div className="px-3 py-3 text-xs text-[#5E6582]">Loading...</div>
              )}
              {error && !loading && (
                <div className="px-3 py-3 text-xs text-red-600">{error}</div>
              )}
              {!loading && !error && sortedTransactions.map((transaction, idx) => (
                <div
                  key={transaction.id || idx}
                  className="grid grid-cols-[18%_22%_12%_18%_15%_15%] gap-0 px-3 py-3 hover:bg-[#F9FAFD]"
                >
                  <div className="self-center text-xs text-[#5E6582] line-clamp-2">
                    {transaction.transactionDate}
                  </div>
                  <div className="self-center">
                    <p className="text-xs font-semibold text-slate-900 leading-tight line-clamp-1">
                      {transaction.transactionName}
                    </p>
                    {transaction.userEmail && transaction.userEmail !== "-" && (
                      <p className="text-xs text-[#5E6582] line-clamp-1">
                        {transaction.userEmail}
                      </p>
                    )}
                  </div>
                  <div className="self-center">
                    <span className="text-xs font-medium text-slate-900">
                      {transaction.type}
                    </span>
                    {transaction.source && transaction.source !== "-" && (
                      <p className="text-xs text-[#5E6582] line-clamp-1">
                        {transaction.source}
                      </p>
                    )}
                  </div>
                  <div className="self-center">
                    <span className={`text-xs ${getAmountColor(transaction.amount)}`}>
                      {transaction.amount}
                    </span>
                  </div>
                  <div className="flex items-center self-center">
                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(transaction.paymentStatus)}`}>
                      {transaction.paymentStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-end self-center relative">
                    <button
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === (transaction.id || idx)
                            ? null
                            : transaction.id || idx
                        )
                      }
                      className="rounded-full border border-transparent p-1 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {activeDropdown === (transaction.id || idx) && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg bg-white border border-[#E5E8F5] z-50"
                      >
                        <div className="py-1">
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            View Detail
                          </button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            Download Receipt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!loading && !error && filteredTransactions.length === 0 && (
                <div className="px-3 py-3 text-xs text-[#5E6582]">
                  No transactions found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
