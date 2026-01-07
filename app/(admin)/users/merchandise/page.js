"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, User, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { downloadExcel } from "@/utils/excelExport";
import {
  TbCaretUpDownFilled,
  TbTicket,
  TbTrendingUp,
  TbTrendingDown,
} from "react-icons/tb";
import { FaChartColumn } from "react-icons/fa6";
import CustomerDetailsModal from "@/components/common/CustomerDetailsModal";
import {
  getAllOrders,
  downloadOrderReceipt,
} from "@/services/merchandise/order.service";

const toCurrency = (n) => {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(Number(n) || 0);
  } catch {
    const x = Number(n) || 0;
    return `₦${x.toLocaleString("en-NG")}`;
  }
};

const formatDate = (iso) => {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  try {
    const opts = {
      weekday: "short",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    const s = d.toLocaleString("en-NG", opts);
    return s;
  } catch {
    return d.toISOString();
  }
};

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

const toImageUrl = (p) => {
  const s = String(p || "").trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN;
  const base =
    originEnv && originEnv.trim()
      ? originEnv.trim()
      : "https://accessdettyfusion.com";
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${base}${path}`;
};

function ActionDropdown({ row, downloadingId, openCustomer, downloadReceipt }) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });

  const handleButtonClick = (e) => {
    if (!isOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const dropdownHeight = 150;

      let top = rect.bottom + 8;
      let right = window.innerWidth - rect.right;

      if (top + dropdownHeight > windowHeight) {
        top = rect.top - dropdownHeight - 8;
      }

      setButtonPosition({ top, right });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={handleButtonClick}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed w-52 bg-white rounded-lg shadow-2xl border border-gray-200 z-[99999] py-2"
            style={{
              top: `${buttonPosition.top}px`,
              right: `${buttonPosition.right}px`,
            }}
          >
            <div className="py-1">
              <a
                href={`/merchandise/order-view/${row.orderId || row.id}`}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </span>
                <span className="text-gray-800">View Detail</span>
              </a>
              <button
                onClick={() => {
                  if (typeof openCustomer === "function") openCustomer(row);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <span className="mr-3 text-gray-500">
                  <User className="h-4 w-4" />
                </span>
                <span className="text-gray-800">Customer Detail</span>
              </button>
              {(() => {
                const isDownloading =
                  String(downloadingId || "") === String(row.orderId || row.id);
                return (
                  <button
                    onClick={() => {
                      if (typeof downloadReceipt === "function")
                        downloadReceipt(row);
                      setIsOpen(false);
                    }}
                    disabled={isDownloading}
                    className={`flex items-center w-full px-4 py-2 text-sm ${
                      isDownloading
                        ? "text-[#8C93AF] cursor-not-allowed opacity-70"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="mr-3 text-gray-500">
                      {isDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </span>
                    <span className="text-gray-800">
                      {isDownloading ? "Processing…" : "Download Receipt"}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const filterTabs = [
  // { id: 'bundle-orders', label: 'Bundle Orders', active: false },
  { id: "event", label: "Event", active: false },
  { id: "activities", label: "Places to Visit", active: false },
  { id: "merchandise", label: "Merchandise", active: true },
  { id: "e-sim", label: "Internet Connectivity", active: false },
  { id: "accommodation", label: "Accommodation", active: false },
  { id: "med-plus", label: "Med Plus", active: false },
  { id: "royal-concierge", label: "Royal Concierge", active: false },
  { id: "rides", label: "Rides", active: false },
  { id: "leadway", label: "Leadway", active: false },
  // { id: 'diy', label: 'DIY', active: false },
];

export default function MerchandisePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [activeTab, setActiveTab] = useState("merchandise");
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ordersRaw, setOrdersRaw] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const router = useRouter();
  const [statsLoadedFromApi, setStatsLoadedFromApi] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [limit, setLimit] = useState(20);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState({
    yesterdayCount: 0,
    yesterdayDateStr: "",
    avgGrowthCount: 0,
    isCountIncreasing: false,
    avgGrowthPercent: "0%",
    isPctIncreasing: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllOrders({
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
        });
        let list = [];

        let hasApiStats = false;

        // 1. Check if stats exist at root level
        if (typeof res?.totalPurchasingYesterday !== "undefined") {
          const d = res;
          const yesterdayCount = Number(d.totalPurchasingYesterday || 0);
          let yesterdayDateStr = d.yesterdayDate || "";
          const yDate = new Date(yesterdayDateStr);
          if (!isNaN(yDate.getTime())) {
            yesterdayDateStr = yDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }
          const avgGrowthCount = Number(d.avgDailyGrowthCount || 0);
          const avgGrowthPercentStr = String(d.avgDailyGrowthPercent || "0%");
          const avgGrowthPercentVal = parseFloat(
            avgGrowthPercentStr.replace("%", "")
          );

          // Cap at 100%
          const finalGrowthPercentVal = Math.min(avgGrowthPercentVal, 100);
          const avgGrowthPercentStrCapped = `${finalGrowthPercentVal.toFixed(
            2
          )}%`;

          setStats({
            yesterdayCount,
            yesterdayDateStr,
            avgGrowthCount,
            isCountIncreasing: avgGrowthCount >= 0,
            avgGrowthPercent: avgGrowthPercentStrCapped,
            isPctIncreasing: finalGrowthPercentVal >= 0,
          });
          setStatsLoadedFromApi(true);
          hasApiStats = true;

          // Attempt to extract list from root
          if (Array.isArray(res.data)) list = res.data;
          else if (Array.isArray(res.orders)) list = res.orders;
          else if (Array.isArray(res.bookings)) list = res.bookings;
        }
        // 2. Check if stats exist in res.data (if it's an object)
        else if (
          res?.data &&
          !Array.isArray(res.data) &&
          typeof res.data.totalPurchasingYesterday !== "undefined"
        ) {
          const d = res.data;
          const yesterdayCount = Number(d.totalPurchasingYesterday || 0);
          let yesterdayDateStr = d.yesterdayDate || "";
          const yDate = new Date(yesterdayDateStr);
          if (!isNaN(yDate.getTime())) {
            yesterdayDateStr = yDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
          }
          const avgGrowthCount = Number(d.avgDailyGrowthCount || 0);
          const avgGrowthPercentStr = String(d.avgDailyGrowthPercent || "0%");
          const avgGrowthPercentVal = parseFloat(
            avgGrowthPercentStr.replace("%", "")
          );

          setStats({
            yesterdayCount,
            yesterdayDateStr,
            avgGrowthCount,
            isCountIncreasing: avgGrowthCount >= 0,
            avgGrowthPercent: avgGrowthPercentStr,
            isPctIncreasing: avgGrowthPercentVal >= 0,
          });
          setStatsLoadedFromApi(true);
          hasApiStats = true;

          // Attempt to extract list from res.data
          if (Array.isArray(d.data)) list = d.data;
          else if (Array.isArray(d.orders)) list = d.orders;
          else if (Array.isArray(d.bookings)) list = d.bookings;
        }

        if (!hasApiStats) {
          // Fallback logic for list extraction
          list = Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.message)
            ? res.message
            : Array.isArray(res)
            ? res
            : [];
          setStatsLoadedFromApi(false);
        }

        setOrdersRaw(list);
      } catch {
        setOrdersRaw([]);
      }
    })();
  }, [dateRange.start, dateRange.end]);

  // Calculate stats client-side if not loaded from API
  useEffect(() => {
    if (statsLoadedFromApi || !ordersRaw || ordersRaw.length === 0) return;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const yesterdayDateStr = yesterday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // 1. Total Purchasing Yesterday
    const yesterdayCount = ordersRaw.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= yesterday && d <= yesterdayEnd;
    }).length;

    // 2. Avg Daily Growth Logic
    const bookingsByDate = {};
    ordersRaw.forEach((o) => {
      const d = new Date(o.createdAt);
      if (isNaN(d.getTime())) return;
      const dateKey = d.toISOString().split("T")[0];
      bookingsByDate[dateKey] = (bookingsByDate[dateKey] || 0) + 1;
    });

    // Get last 30 days
    const days30 = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      days30.push({ date: dateKey, count: bookingsByDate[dateKey] || 0 });
    }
    days30.reverse(); // Oldest to newest

    // Avg Daily Count
    const totalCount30 = days30.reduce((acc, curr) => acc + curr.count, 0);
    const avgGrowthCount = Math.round(totalCount30 / 30);

    // Trend for Count (Last 7 vs Prev 7)
    const last7 = days30.slice(-7);
    const prev7 = days30.slice(-14, -7);
    const avgLast7 = last7.reduce((a, c) => a + c.count, 0) / 7;
    const avgPrev7 = prev7.reduce((a, c) => a + c.count, 0) / 7;
    const isCountIncreasing = avgLast7 >= avgPrev7;

    // Avg Daily Growth %
    let totalPctChange = 0;
    let validDays = 0;
    const pctChanges = [];

    for (let i = 1; i < days30.length; i++) {
      const prev = days30[i - 1].count;
      const curr = days30[i].count;
      let pct = 0;
      if (prev === 0) {
        pct = curr > 0 ? 100 : 0;
      } else {
        pct = ((curr - prev) / prev) * 100;
      }
      pctChanges.push(pct);
      totalPctChange += pct;
      validDays++;
    }

    const avgGrowthPercentVal = validDays > 0 ? totalPctChange / validDays : 0;
    const avgGrowthPercent = `${avgGrowthPercentVal.toFixed(2)}%`;

    // Trend for % (Last 7 vs Prev 7)
    const last7Pct = pctChanges.slice(-7);
    const prev7Pct = pctChanges.slice(-14, -7);
    const avgLast7Pct =
      last7Pct.length > 0
        ? last7Pct.reduce((a, c) => a + c, 0) / last7Pct.length
        : 0;
    const avgPrev7Pct =
      prev7Pct.length > 0
        ? prev7Pct.reduce((a, c) => a + c, 0) / prev7Pct.length
        : 0;
    const isPctIncreasing = avgLast7Pct >= avgPrev7Pct;

    setStats({
      yesterdayCount,
      yesterdayDateStr,
      avgGrowthCount,
      isCountIncreasing,
      avgGrowthPercent,
      isPctIncreasing,
    });
  }, [ordersRaw, statsLoadedFromApi]);

  const handleTabClick = (tabId) => {
    switch (tabId) {
      case "event":
        router.push("/users/transactions");
        break;
      case "activities":
        router.push("/users/activities");
        break;
      case "accommodation":
        router.push("/users/accommodation");
        break;
      case "diy":
        router.push("/users/diy");
        break;
      case "merchandise":
        router.push("/users/merchandise");
        break;
      case "e-sim":
        router.push("/users/e-sim");
        break;
      case "med-plus":
        router.push("/med-orders");
        break;
      case "royal-concierge":
        router.push("/royal-concierge");
        break;
      case "rides":
        router.push("/users/rides");
        break;
      case "leadway":
        router.push("/leadway");
        break;
      default:
        setActiveTab(tabId);
    }
  };

  const merchandiseData = useMemo(() => {
    const rows = [];
    const orders = Array.isArray(ordersRaw) ? ordersRaw : [];
    orders.forEach((o) => {
      const orderId = toIdString(o?._id || o?.orderId);
      const created = o?.createdAt;
      const items = Array.isArray(o?.items) ? o.items : [];
      const total = Number(o?.totalAmount || 0);
      const statusRaw = String(o?.status || "").trim();
      const statusUC = statusRaw.toUpperCase();
      const customerName = o?.userName || o?.userId?.name || "-";
      const payment =
        statusUC === "PAID"
          ? "PAID"
          : statusUC === "PENDING"
          ? "PENDING"
          : statusRaw
          ? statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase()
          : "Pending";
      const activity = statusUC === "PAID" ? "Done" : "Ongoing";
      items.forEach((it, idx) => {
        const qty = Number(it?.quantity || 0);
        const title = it?.productId?.title || "-";
        const unitPrice = it?.price ?? it?.productId?.price;
        const category =
          it?.productId?.category || it?.productId?.categoryId?.title || "-";
        const imageUrl = toImageUrl(
          it?.productId?.imageUrl || it?.productId?.image
        );
        rows.push({
          id: `${orderId || "order"}-${idx}`,
          orderId: orderId || "",
          eventDate: formatDate(created) || "-",
          merchandiseName: title,
          merchandiseImage: imageUrl,
          category,
          customerName,
          quantity: qty
            ? `${qty} x ${toCurrency(unitPrice)}`
            : `${toCurrency(unitPrice)}`,
          totalAmount: toCurrency(total),
          amountNum: total,
          activityStatus: activity,
          paymentStatus: payment,
          rawOrder: o,
          rawItem: it,
          unitPrice,
          rawQty: qty,
        });
      });
    });
    return rows;
  }, [ordersRaw]);
  console.log("merchandiseData", merchandiseData);

  const filteredMerchandise = merchandiseData.filter((merchandise) => {
    if (paymentStatusFilter) {
      const paymentStatus = String(
        merchandise.paymentStatus || merchandise.rawOrder?.paymentStatus || ""
      )
        .toLowerCase()
        .trim();

      if (paymentStatus !== paymentStatusFilter.toLowerCase()) {
        return false;
      }
    }

    const term = String(searchTerm || "")
      .trim()
      .toLowerCase();

    // Date Range Filtering
    const bookingTime = new Date(merchandise.rawOrder?.createdAt).getTime();
    const startTime = dateRange.start
      ? new Date(dateRange.start).setHours(0, 0, 0, 0)
      : null;
    const endTime = dateRange.end
      ? new Date(dateRange.end).setHours(23, 59, 59, 999)
      : null;

    const matchesDate =
      (!startTime || bookingTime >= startTime) &&
      (!endTime || bookingTime <= endTime);

    if (!term) return matchesDate;

    const termDigits = term.replace(/[^0-9]/g, "");
    const name = String(merchandise.merchandiseName || "").toLowerCase();
    const customerName = String(merchandise.customerName || "").toLowerCase();
    const category = String(merchandise.category || "").toLowerCase();
    const dateStr = String(merchandise.eventDate || "").toLowerCase();
    const dateDigits = String(merchandise.eventDate || "").replace(
      /[^0-9]/g,
      ""
    );
    const quantity = String(merchandise.quantity || "").toLowerCase();
    const totalAmount = String(merchandise.totalAmount || "").toLowerCase();

    const matchesText =
      name.includes(term) ||
      category.includes(term) ||
      customerName.includes(term) ||
      dateStr.includes(term) ||
      quantity.includes(term) ||
      totalAmount.includes(term);

    const matchesDigits = termDigits && dateDigits.includes(termDigits);
    return matchesDate && (matchesText || matchesDigits);
  });

  const paginatedBookings = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredMerchandise.slice(startIndex, endIndex);
  }, [filteredMerchandise, page, limit]);

  useEffect(() => {
    const totalPages = Math.ceil(filteredMerchandise.length / limit) || 1;
    setPageCount(totalPages);

    if (page > totalPages) {
      setPage(1);
    }
  }, [filteredMerchandise.length, limit]);

  const getActivityStatusColor = (status) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-800";
      case "Ongoing":
        return "bg-blue-100 text-blue-800";
      case "Upcoming":
        return "bg-red-100 text-red-800";
      case "TBL":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Refunded":
        return "bg-purple-100 text-purple-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewOrderDetails = (merchandiseId) => {
    const merchandise = merchandiseData.find(
      (item) => item.id === merchandiseId
    );
    setSelectedOrder(merchandise);
    setShowOrderDetails(true);
  };

  const handleDownloadExcel = () => {
    if (!filteredMerchandise || filteredMerchandise.length === 0) {
      return;
    }
    const dataToExport = filteredMerchandise.map((item) => {
      const o = item.rawOrder || {};
      return {
        "Order ID": item.orderId,
        "User Name": o.userName || o.userId?.name || "",
        Email: o.email || o.userId?.email || "",
        "Phone Number": o.phoneNumber || "",
        "Merchandise Name": item.merchandiseName,
        Category: item.category,
        Quantity: item.rawQty || 0,
        "Unit Price": item.unitPrice || 0,
        Discount: o.discount || 0,
        "Total Amount": o.totalAmount || 0,
        "Final Payable Amount": o.finalPayableAmount || 0,
        Status: o.status || "",
        "Shipping Address": o.shippingAddress || "",
        "Service Fee": o.serviceFee || 0,
        "Shipping Charge": o.shippingCharge || 0,
        "Billing Address": o.billingAddress || "",
        "Transaction ID": o.transactionId || "",
        "Transaction Ref": o.transactionRef || o.transacionId || "",
        "Payment Reference": o.paymentReference || "",
        "Created At": formatDate(o.createdAt),
        "Updated At": formatDate(o.updatedAt),
      };
    });
    downloadExcel(dataToExport, "Merchandise_Orders.xlsx");
  };

  const [selectedOrderRaw, setSelectedOrderRaw] = useState(null);

  const openCustomer = (o) => {
    const merchandise =
      merchandiseData.find((item) => String(item.id) === String(o?.id)) || o;
    const oid = toIdString(
      merchandise?.orderId || o?.orderId || merchandise?.id || o?.id
    );
    const raw =
      (Array.isArray(ordersRaw) ? ordersRaw : []).find((r) => {
        const rid = toIdString(r?._id || r?.orderId);
        return String(rid) === String(oid);
      }) || null;
    setSelectedOrder(merchandise);
    setSelectedOrderRaw(raw);
    setShowOrderDetails(true);
  };

  const downloadReceipt = async (o) => {
    const id = toIdString(o?.orderId || o?.id);
    if (!id) return;
    try {
      if (String(downloadingId || "") === String(id)) return;
      setDownloadingId(id);
      const blob = await downloadOrderReceipt(id);
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `order-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
    } finally {
      setDownloadingId(null);
    }
  };

  const handleToggleFilters = () => {
    setFiltersOpen((v) => !v);
  };

  return (
    <div className="p-4 min-h-screen bg-white">
      {/* Title and Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Gross Transaction Value
          </h1>
          <nav className="text-sm text-gray-500">
            <span>Dashboard</span> / <span>Gross Transaction Value</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-500 font-medium ml-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-gray-400 mt-4">-</span>
            <div className="flex flex-col">
              <label className="text-[10px] text-gray-500 font-medium ml-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="h-9 px-3 border border-gray-300 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: "", end: "" })}
              className="mt-4 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear Date Filter"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Purchasing Yesterday */}
        <div className="bg-gradient-to-r from-[#E8EEFF] to-[#C5D5FF] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="bg-white p-2 rounded-lg">
              <TbTicket className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-600 opacity-90">
                Total purchasing Yesterday{" "}
                <span className="text-[10px]  opacity-75">
                  ({stats.yesterdayDateStr})
                </span>
              </p>
              <p className="text-2xl text-indigo-600 font-bold">
                {stats.yesterdayCount}
              </p>
            </div>
          </div>
        </div>

        {/* Avg Daily Growth (Count) */}
        <div className="bg-gradient-to-r from-[#F3E8FF] to-[#DDD6FE] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="bg-white p-2 rounded-lg">
              <TbTrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <p className="text-xs text-purple-600 opacity-90">
                Avg Daily Growth (Count)
              </p>
              <div className="flex items-end justify-end gap-2">
                <p className="text-2xl text-purple-600 font-bold">
                  {stats.avgGrowthCount}
                </p>
                {stats.isCountIncreasing ? (
                  <span className="text-xs flex items-center mb-1 text-green-500">
                    <TbTrendingUp className="w-3 h-3 mr-0.5" />
                    Increasing
                  </span>
                ) : (
                  <>
                    <p className="text-2xl text-red-500 font-bold">
                      {stats.avgGrowthCount}
                    </p>
                    <span className="text-xs flex items-center mb-1 text-red-500">
                      <TbTrendingDown className="w-3 h-3 mr-0.5" />
                      Decreasing
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Avg Daily Growth (%) */}
        <div className="bg-gradient-to-r from-[#CCFBF1] to-[#99F6E4] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="bg-white p-2 rounded-lg">
              <FaChartColumn className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-right">
              <p className="text-xs text-teal-600 opacity-90">
                Avg Daily Growth (%)
              </p>
              <div className="flex items-end justify-end gap-2">
                <p className="text-2xl text-teal-600 font-bold">
                  {stats.avgGrowthPercent}
                </p>
                {stats.isPctIncreasing ? (
                  <span className="text-xs flex items-center mb-1 text-green-500">
                    <TbTrendingUp className="w-3 h-3 mr-0.5" />
                    Increasing
                  </span>
                ) : (
                  <>
                    <p className="text-2xl text-red-500 font-bold">
                      {stats.avgGrowthPercent}
                    </p>
                    <span className="text-xs flex items-center mb-1 text-red-500">
                      <TbTrendingDown className="w-3 h-3 mr-0.5" />
                      Decreasing
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Cards (Filtered) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Total Merchandise Bookings (Filtered) */}
        <div className="bg-blue-300 text-white p-4 rounded-lg">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-lg mr-3">
              <TbTicket className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-black opacity-90">
                Total Merchandise Bookings
              </p>
              <p className="text-2xl text-black font-bold">
                {filteredMerchandise.length}{" "}
                <span className="text-lg font-semibold opacity-90">
                  (₦
                  {filteredMerchandise
                    .reduce((acc, curr) => acc + (curr.amountNum || 0), 0)
                    .toLocaleString()}
                  )
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* New Bookings Today (Filtered) */}
        <div className="bg-orange-300 text-white p-4 rounded-lg">
          <div className="flex items-center">
            <div className="bg-white p-2 rounded-lg mr-3">
              <TbTicket className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-black opacity-90">
                New Bookings Today
              </p>
              <p className="text-2xl text-black font-bold">
                {
                  filteredMerchandise.filter((b) => {
                    if (!b.rawOrder?.createdAt) return false;
                    const d = new Date(b.rawOrder.createdAt);
                    const today = new Date();
                    return (
                      d.getDate() === today.getDate() &&
                      d.getMonth() === today.getMonth() &&
                      d.getFullYear() === today.getFullYear()
                    );
                  }).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-200 p-5 rounded-xl overflow-visible">
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
          {/* Header with Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Gross Transaction Value of Merchandise
              </h2>
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs text-gray-900 placeholder-gray-500"
                  />
                  <svg
                    className="w-4 h-4 text-gray-600 absolute left-3 top-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {filtersOpen && (
                  <div className="relative">
                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className="h-9 px-3 border border-gray-300 rounded-lg bg-white text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Payments</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={handleToggleFilters}
                  className="h-9 flex items-center px-4 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                >
                  <svg
                    className="w-4 h-4 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z"
                    />
                  </svg>
                  <span className="text-xs text-gray-700 font-medium">
                    {filtersOpen ? "Hide Filters" : "Filters"}
                  </span>
                </button>

                {/* Download */}
                <button
                  onClick={handleDownloadExcel}
                  className="h-9 flex items-center px-4 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                >
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  <span className="ml-2 text-xs text-gray-700 font-medium">
                    Export
                  </span>
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

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
                    tab.id === activeTab
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto overflow-y-visible relative z-0">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span>Purchasing Date</span>
                      <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span>Merchandise Name</span>
                      <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span>Customer Name</span>
                      <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span>Quantity</span>
                      <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                    </div>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span>Total Amount</span>
                      <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                    </div>
                  </th>

                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <span>Payment Status</span>
                      <TbCaretUpDownFilled className="w-3 h-3 text-gray-400 ml-1" />
                    </div>
                  </th>
                  <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBookings?.map((merchandise) => (
                  <tr
                    key={merchandise.id}
                    className="hover:bg-gray-50 border-b border-gray-100"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {merchandise.eventDate}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {merchandise.merchandiseImage ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={merchandise.merchandiseImage}
                              alt={merchandise.merchandiseName}
                              onError={(e) => {
                                e.target.style.display = "none";
                                const fallback = e.target.nextSibling;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}
                          {!merchandise.merchandiseImage && (
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 leading-tight">
                            {merchandise.merchandiseName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {merchandise.customerName}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div>{merchandise.quantity}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {merchandise.totalAmount}
                      </span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                          merchandise.paymentStatus
                        )}`}
                      >
                        {merchandise.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right relative">
                      <ActionDropdown
                        row={merchandise}
                        downloadingId={downloadingId}
                        openCustomer={openCustomer}
                        downloadReceipt={downloadReceipt}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CustomerDetailsModal
        open={Boolean(showOrderDetails && selectedOrder)}
        onOpenChange={(v) => {
          if (!v) setShowOrderDetails(false);
        }}
        order={selectedOrderRaw}
        selected={selectedOrder}
      />
    </div>
  );
}
