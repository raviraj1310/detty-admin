"use client";

import ReusableTabs from "components/tabs/Tabs";
import OrdersTable from "components/table/OrderTable";
import { useEffect, useMemo, useState } from "react";
import SelectDropdown from "components/dropdown/SelectDropdown";
import { getOrders, getMyESimOrders } from "services/user/order/order.service";
import { downloadTicketPDF } from "services/events/userEvents.service";
import { cn, formatEventDate } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import {
  getUserActivityTicketList,
  getMyOrders,
  downloadOrderReceipt,
} from "services/tour/tour.service";
import { getMyStayBookings } from "services/accommodation/accommodation.service";
import { getMyMedOrders } from "services/med/med.service";
import { myRoyalBookings } from "services/royal-concierge/royal.service";
import { getMyRideBookings } from "services/ride-services/rideService.services";
import { getMyLeadPlans } from "services/leadway/leadway.service";

export default function MyOrders() {
  const [tab, setTab] = useState("Events");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityFilter, setActivityFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState(null);
  const [esimModalOpen, setEsimModalOpen] = useState(false);
  const [esimOrder, setEsimOrder] = useState(null);
  const [royalModalOpen, setRoyalModalOpen] = useState(false);
  const [royalOrder, setRoyalOrder] = useState(null);
  const [is1280, setIs1280] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      const is1280Screen = width >= 1280;
      setIs1280(is1280Screen);
      console.log("Screen width:", width, "is1280:", is1280Screen);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);
  const getOrderTs = (o) =>
    new Date(
      o?.raw?.createdAt ||
        o?.raw?.orderDate ||
        o?.raw?.arrivalDate ||
        o?.raw?.checkInDate ||
        o?.raw?.updatedAt ||
        0
    ).getTime();

  const buildMerchParams = (order) => {
    const b = order?.raw || {};
    const itemsArr = Array.isArray(b?.items) ? b.items : [];
    const items = itemsArr.map((it) => ({
      name: it?.productId?.title || it?.title || "Merch Item",
      price: Number(it?.price ?? it?.productId?.price ?? 0),
      quantity: Number(it?.quantity ?? 0),
    }));
    const subtotal = items.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );
    const total = Number(b?.totalAmount ?? subtotal);
    const params = new URLSearchParams({
      items: btoa(JSON.stringify(items)),
      subtotal: String(subtotal || 0),
      serviceFee: String(0),
      discount: String(0),
      total: String(total || 0),
      email: String(b?.email || ""),
      fullName: String(b?.userName || ""),
      phoneNumber: String(b?.phoneNumber || ""),
    }).toString();
    return params;
  };

  const goToMerchSuccess = (order) => {
    const qs = buildMerchParams(order);
    router.push(`/merchandise/checkout/success?${qs}`);
  };
  const goToAccommodationSuccess = (order) => {
    const qs = buildMerchParams(order);
    router.push(`/accommodation/checkout/success?${qs}`);
  };

  const goToMerchPayment = (order) => {
    const qs = buildMerchParams(order);
    router.push(`/merchandise/checkout/payment?${qs}`);
  };

  const goToTourPayment = (order) => {
    // const qs = buildTourParams(order);
    // router.push(`/places-checkout/payment?${qs}`);
  };

  const goToEventPayment = (order) => {
    // Navigate to event payment page
    // You can implement this based on your routing structure
    console.log("Navigate to event payment for order:", order);
  };

  const goToViewOrder = (order) => {
    try {
      const raw = order?.raw || {};
      const orderId = order?._id || raw?._id;
      router.push(`/view-order?orderId=${orderId}`);
    } catch (error) {
      console.error("Error navigating to view order:", error);
      router.push(`/view-order?orderId=${order?._id || ""}`);
    }
  };

  const goToViewOrderAccommodation = (order) => {
    try {
      const raw = order?.raw || {};
      const orderId = order?._id || raw?._id;
      router.push(`/view-order-accommodation?orderId=${orderId}`);
    } catch (error) {
      console.error("Error navigating to view order:", error);
      router.push(`/view-order-accommodation?orderId=${order?._id || ""}`);
    }
  };

  const goToViewMedPlusOrder = (order) => {
    try {
      const raw = order?.raw || {};
      const orderId = raw?._id || order?._id || raw?.orderKey || "";

      // Build params for drug store success page
      const items = Array.isArray(raw?.items) ? raw.items : [];
      const itemsForParams = items.map((it) => ({
        barcode: it.barcode || "",
        name: it.productName || "Drug Item",
        price: Number(it.price || 0),
        quantity: Number(it.qty || 0),
      }));

      const total = items.reduce((sum, it) => {
        const price = Number(it?.price || 0);
        const qty = Number(it?.qty || 0);
        return sum + price * qty;
      }, 0);

      const params = new URLSearchParams({
        items: btoa(JSON.stringify(itemsForParams)),
        subtotal: String(total || 0),
        serviceFee: String(0),
        discount: String(0),
        total: String(total || 0),
        email: String(raw?.customer?.email || ""),
        fullName: String(raw?.customer?.contact_person_name || ""),
        phoneNumber: String(raw?.customer?.phone || ""),
      }).toString();

      router.push(`/healthcare/drug-store/checkout/success?${params}`);
    } catch (error) {
      console.error("Error navigating to Med Plus order:", error);
    }
  };

  const cancelMerchOrder = (order) => {
    const id = order?.id;
    if (!id) return;
    const ok = window.confirm("Are you sure you want to cancel this order?");
    if (!ok) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, activtyStatus: "NIL", paymentStatus: "Cancelled" }
          : o
      )
    );
  };

  const handleDownload = async (bookingId) => {
    try {
      setDownloadingId(bookingId);
      const blob = await downloadTicketPDF(bookingId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${bookingId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (_) {
    } finally {
      setDownloadingId(null);
    }
  };

  const handleMerchDownload = async (orderId) => {
    try {
      setDownloadingId(orderId);
      const blob = await downloadOrderReceipt(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-receipt-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (_) {
    } finally {
      setDownloadingId(null);
    }
  };

  const activityOptions = ["Done", "Ongoing", "Upcoming", "Pending", "Nil"];
  const paymentOptions = [
    "Completed",
    "Pending",
    "Incomplete",
    "Cancelled",
    "Failed",
  ];

  const tabList = [
    // "Bundle Orders",
    "Events",
    "Places to Visit",
    // "DIY",
    "Merchandise",
    "Internet Connectivity",
    "Accommodation",
    "Med Plus",
    "Royal Concierge",
    "Rides",
    "Leadway",
  ];

  const fetchOrders = async (selectedTab) => {
    setLoading(true);

    try {
      let data;

      switch (selectedTab) {
        case "Events":
          data = await getOrders();
          break;
        case "Places to Visit":
          data = await getUserActivityTicketList();
          break;
        case "Merchandise":
          data = await getMyOrders();
          break;
        case "Internet Connectivity":
          data = await getMyESimOrders();
          break;
        case "Accommodation":
          data = await getMyStayBookings();
          break;
        case "Med Plus":
          data = await getMyMedOrders();
          break;
        case "Royal Concierge":
          data = await myRoyalBookings();
          break;
        case "Rides":
          data = await getMyRideBookings();
          break;
        case "Leadway":
          data = await getMyLeadPlans();
          break;

        default:
          setOrders([]);
          setLoading(false);
          return;
      }

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const mapped = list.map((b) => {
        if (selectedTab === "Events") {
          const event = b.eventId;
          const firstTicket = b?.tickets[0];
          const tickets = Array.isArray(b?.tickets) ? b.tickets : [];
          const totalAmount = tickets.reduce((sum, ticket) => {
            const price = Number(ticket?.perTicketPrice || 0);
            const qty = Number(ticket?.quantity || 1);
            return sum + price * qty;
          }, 0);

          return {
            orderId: b?.orderId || "-",
            eventName: event?.eventName || "-",
            dateTime: formatEventDate(event?.eventStartDate),
            eventType: firstTicket?.ticketType || "-",
            qty: b?.quantity ?? 1,
            amount: totalAmount,
            activtyStatus: b?.status || "Pending",
            paymentStatus: b?.paymentStatus || "FREE",
            type: "events",
            bookingDate: formatEventDate(b?.createdAt) || "",
            id: b?._id,
            raw: b,
          };
        }

        if (selectedTab === "Places to Visit") {
          const totalAmount = b?.tickets.reduce((sum, ticket) => {
            const price = Number(ticket?.perTicketPrice || 0);
            const qty = Number(ticket?.quantity || 1);
            return sum + price * qty;
          }, 0);

          return {
            orderId: b?.orderId,
            activityName: b?.activityId?.activityName || "-",
            dateTime: formatEventDate(b?.arrivalDate),
            category: b?.type || "Activity",
            qty: b?.quantity ?? 0,
            amount: totalAmount,
            activtyStatus: b?.status || "Pending",
            paymentStatus: b?.paymentStatus || "FREE",
            type: "tours",
            bookingDate: formatEventDate(b?.createdAt) || "",
            id: b?._id,
            raw: b,
          };
        }

        if (selectedTab === "Merchandise") {
          const items = Array.isArray(b?.items) ? b.items : [];
          const qty = items.reduce((sum, it) => {
            const q = Number(it?.quantity || 0);
            return sum + (isNaN(q) ? 0 : q);
          }, 0);
          const amount = Number(b?.totalAmount ?? 0);
          const firstTitle =
            items?.[0]?.productId?.title || items?.[0]?.title || null;
          const paymentStatus = b?.paymentStatus
            ? b.paymentStatus
            : String(b?.status || "-").toLowerCase() === "pending"
            ? "Incomplete"
            : String(b?.status || "-").toLowerCase() === "failed"
            ? "Failed"
            : String(b?.status || "-").toLowerCase() === "paid"
            ? "Completed"
            : "-";

          return {
            orderId: b?.orderId || b?._id || "-",
            name:
              firstTitle ||
              (items.length
                ? `${items.length} item${items.length > 1 ? "s" : ""}`
                : "Merchandise Order"),
            dateTime: formatEventDate(b?.createdAt || b?.orderDate),
            category: b?.items?.[0]?.productId?.categoryId?.title || "-",
            qty,
            amount,
            paymentStatus,
            type: "merchandise",
            bookingDate: formatEventDate(b?.createdAt) || "",
            id: b?._id || b?.orderId,
            raw: b,
          };
        }

        if (selectedTab === "Accommodation") {
          const checkIn = b?.checkInDate ? formatEventDate(b.checkInDate) : "-";

          const checkOut = b?.checkOutDate
            ? formatEventDate(b.checkOutDate)
            : "-";

          return {
            orderId: b?._id || "-", // unique ID
            hotelName: b?.hotelName || "-", // hotel name
            roomName: b?.roomName || "-", // room name
            dateTime: `${checkIn}`, // combined date
            amount: Number(b?.amount || 0), // total amount
            paymentStatus: b?.paymentStatus || "-", // Paid / Pending
            activtyStatus: b?.paymentStatus || "-", // same as payment
            type: "accommodation",
            id: b?._id, // main ID
            bookingDate: formatEventDate(b?.createdAt) || "",
            raw: b, // raw API data
          };
        }

        if (selectedTab === "Med Plus") {
          const items = Array.isArray(b?.items) ? b.items : [];
          const qty = items.reduce((sum, it) => {
            const q = Number(it?.qty || 0);
            return sum + (isNaN(q) ? 0 : q);
          }, 0);

          // Calculate total from items
          const amount = items.reduce((sum, it) => {
            const price = Number(it?.price || 0);
            const q = Number(it?.qty || 0);
            return sum + price * q;
          }, 0);

          const firstProductName = items?.[0]?.productName || null;
          const paymentStatus = b?.api_response?.data?.payment_status
            ? String(b.api_response.data.payment_status).toLowerCase() ===
              "paid"
              ? "Completed"
              : String(b.api_response.data.payment_status).toLowerCase()
            : String(b?.status || "-").toLowerCase() === "created"
            ? "Completed"
            : String(b?.status || "-").toLowerCase() === "pending"
            ? "Incomplete"
            : String(b?.status || "-").toLowerCase() === "failed"
            ? "Failed"
            : "-";

          return {
            orderId: b?.orderKey || b?._id || "-",
            name:
              firstProductName ||
              (items.length
                ? `${items.length} item${items.length > 1 ? "s" : ""}`
                : "Med Plus Order"),
            dateTime: formatEventDate(b?.createdAt),
            category: "Drug Store",
            qty,
            amount,
            paymentStatus,
            activtyStatus: b?.status || "-",
            type: "medplus",
            id: b?._id || b?.orderKey,
            bookingDate: formatEventDate(b?.createdAt) || "",
            raw: b,
          };
        }

        if (selectedTab === "Internet Connectivity") {
          const statusRaw = b?.paymentStatus || "-";
          const paymentStatus =
            String(statusRaw || "-").toLowerCase() === "paid"
              ? "Completed"
              : statusRaw || "-";
          const activity =
            String(paymentStatus || "-").toLowerCase() === "completed"
              ? "Done"
              : "-";

          return {
            orderId: b?._id || "-",
            name: "eSIM/Data Plan",
            dateTime: formatEventDate(b?.createdAt),
            qty: 1,
            amount: Number(b?.amount || 0),
            activtyStatus: activity,
            paymentStatus,
            type: "esim",
            id: b?._id,
            bookingDate: formatEventDate(b?.createdAt) || "",
            raw: b,
          };
        }

        if (selectedTab === "Royal Concierge") {
          const amount = Number(b?.financials?.rcs_line_item_value || 0);
          return {
            orderId: b?.transactionId || b?._id || "-",
            tier: b?.serviceDetails?.tier || "Bronze",
            dateTime: formatEventDate(b?.createdAt),
            flightNumber: b?.serviceDetails?.flight_number || "-",
            passengers: Number(b?.serviceDetails?.passenger_count || 1),
            amount,
            // activtyStatus: b?.rcStatus || '-',
            paymentStatus:
              String(b?.status || "-").toLowerCase() === "created"
                ? "Paid"
                : b?.status || "-",
            type: "royalconcierge",
            bookingDate: formatEventDate(b?.createdAt) || "",
            id: b?._id,
            raw: b,
          };
        }

        if (selectedTab === "Rides") {
          const amount = Number(b?.financials?.rcs_line_item_value || 0);
          return {
            orderId: b?._id || "-",
            dateTime: formatEventDate(b?.createdAt),
            amount: 100,
            activtyStatus: b?.status || "-",

            paymentStatus: b?.paymentStatus || "-",
            type: "Rides",
            id: b?._id,
            bookingDate: formatEventDate(b?.createdAt) || "",
            raw: b,
          };
        }

        if (selectedTab === "Leadway") {
          const amount = Number(b?.totalPayAmount || b?.purchaseAmount || 0);

          const rawStatus = String(b?.paymentStatus || "-").toLowerCase();

          const paymentStatus =
            rawStatus === "paid" || rawStatus === "success"
              ? "Completed"
              : rawStatus === "pending"
              ? "Pending"
              : rawStatus === "failed"
              ? "Failed"
              : b?.paymentStatus || "-";

          return {
            orderId: b?._id || "-",
            dateTime: formatEventDate(b?.createdAt),
            amount,
            activtyStatus: b?.status || "-",
            paymentStatus,
            type: "Leadway",
            id: b?._id,
            bookingDate: formatEventDate(b?.createdAt) || "",
            raw: b,
          };
        }
      });

      setOrders(mapped.sort((a, b) => getOrderTs(b) - getOrderTs(a)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  console.log("Orders:", orders);

  const goToTourFailedView = () => {
    const storedUrl = localStorage.getItem("places_success_screen_url");

    if (storedUrl) {
      window.location.href = storedUrl;
    } else {
      alert("No previous booking details found");
    }
  };

  const goToTourReturnView = () => {
    const storedUrl = localStorage.getItem("places_payment_return_url");

    if (storedUrl) {
      window.location.href = storedUrl;
    } else {
      alert("No previous booking details found");
    }
  };

  const goToEventFailedView = () => {
    const storedUrl = localStorage.getItem("event_success_screen_url");

    if (storedUrl) {
      window.location.href = storedUrl;
    } else {
      alert("No previous booking details found");
    }
  };

  const goToEventPaymentReturnView = () => {
    const storedUrl = localStorage.getItem("event_payment_return_url");

    if (storedUrl) {
      window.location.href = storedUrl;
    } else {
      alert("No previous booking details found");
    }
  };

  useEffect(() => {
    fetchOrders(tab);
  }, [tab]);

  const MobileCard = ({ order, index }) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Close dropdown on scroll
    useEffect(() => {
      if (!isPopoverOpen) return;

      const handleScroll = () => {
        setIsPopoverOpen(false);
      };

      window.addEventListener("scroll", handleScroll, true);
      return () => window.removeEventListener("scroll", handleScroll, true);
    }, [isPopoverOpen]);

    const getDisplayName = () => {
      if (order.eventName) return order.eventName;
      if (order.activityName) return order.activityName;
      if (order.name) return order.name;
      if (order.hotelName) return order.hotelName;
      if (order.tier) return `Royal Concierge - ${order.tier}`;
      return "Order";
    };

    const getTypeLabel = () => {
      if (order.eventType) return order.eventType;
      if (order.category) return order.category;
      if (order.roomName) return order.roomName;
      if (order.flightNumber) return `Flight: ${order.flightNumber}`;
      return "regular";
    };

    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-4 mb-3 border border-gray-100 relative">
        {/* Title and Order ID Row */}
        <div className="flex items-start justify-between gap-1.5 sm:gap-2 mb-1">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight flex-1 truncate">
            {getDisplayName()}
          </h3>
          <span className="text-[9px] sm:text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">
            {order.orderId || "-"}
          </span>
        </div>

        {/* Date/Time */}
        <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">
          {order.dateTime || "-"}
        </p>

        {/* Type, Qty, Amount Row */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200">
          <div className="min-w-0">
            <div className="text-[9px] sm:text-[10px] font-semibold text-gray-900 mb-0.5 sm:mb-1">
              Type:
            </div>
            <div className="text-[9px] sm:text-[10px] text-gray-700 truncate">
              {getTypeLabel()}
            </div>
          </div>
          {order.qty !== undefined && (
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-semibold text-gray-900 mb-0.5 sm:mb-1">
                Qty:
              </div>
              <div className="text-[9px] sm:text-[10px] text-gray-700">
                {order.qty}
              </div>
            </div>
          )}
          <div className="text-right min-w-0">
            <div className="text-[9px] sm:text-[10px] font-semibold text-gray-900 mb-0.5 sm:mb-1">
              Amount:
            </div>
            <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">
              ₦
              {typeof order.amount === "number"
                ? order.amount.toLocaleString()
                : "-"}
            </div>
          </div>
        </div>

        {/* Activity, Payment and Action Row - All in one row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left side: Activity and Payment */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            {order.activtyStatus && (
              <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-900 whitespace-nowrap">
                  Activity:
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium whitespace-nowrap",
                    String(order.activtyStatus || "-")
                      .toLowerCase()
                      .includes("upcoming")
                      ? "text-[#B91C1C] bg-[#FEF3C7]"
                      : String(order.activtyStatus || "-")
                          .toLowerCase()
                          .includes("done")
                      ? "text-green-700 bg-green-100"
                      : "text-gray-700 bg-gray-100"
                  )}
                >
                  {order.activtyStatus}
                </span>
              </div>
            )}
            {order.paymentStatus && (
              <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-semibold text-gray-900 whitespace-nowrap">
                  Payment:
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium whitespace-nowrap",
                    String(order.paymentStatus || "-")
                      .toLowerCase()
                      .includes("completed")
                      ? "text-green-700 bg-green-100"
                      : String(order.paymentStatus || "-")
                          .toLowerCase()
                          .includes("failed")
                      ? "text-red-700 bg-red-100"
                      : "text-[#B45309] bg-[#FEF3C7]"
                  )}
                >
                  {order.paymentStatus}
                </span>
              </div>
            )}
          </div>

          {/* Right side: Action Button */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[9px] sm:text-[10px] font-semibold text-gray-900 whitespace-nowrap">
              Action
            </span>
            <DropdownMenu.Root
              open={isPopoverOpen}
              onOpenChange={setIsPopoverOpen}
            >
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200 transition-colors flex-shrink-0 border-0 outline-none focus:outline-none"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <circle cx="10" cy="5" r="1.5" />
                    <circle cx="10" cy="10" r="1.5" />
                    <circle cx="10" cy="15" r="1.5" />
                  </svg>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={5}
                  align="end"
                  className="bg-white rounded-xl shadow-lg border border-gray-100 min-w-[160px] sm:min-w-[180px] z-[99999] py-2"
                >
                  {/* Events Actions */}
                  {order.type === "events" && (
                    <>
                      {["paid", "completed", "success"].includes(
                        String(order.paymentStatus || "").toLowerCase()
                      ) && (
                        <>
                          <DropdownMenu.Item
                            className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() =>
                              router.push(
                                `/tickets/view?booking=${order.id}&type=events`
                              )
                            }
                          >
                            View Tickets
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            disabled={downloadingId === order.id}
                            className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 disabled:opacity-50 cursor-pointer outline-none"
                            onSelect={() => handleDownload(order.id)}
                          >
                            {downloadingId === order.id
                              ? "Downloading..."
                              : "Download Receipt"}
                          </DropdownMenu.Item>
                        </>
                      )}
                      {["incomplete", "pending"].includes(
                        String(order.paymentStatus || "").toLowerCase()
                      ) && (
                        <DropdownMenu.Item
                          className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                          onSelect={() => goToEventPayment(order)}
                        >
                          Complete Booking
                        </DropdownMenu.Item>
                      )}
                      {String(order.paymentStatus || "").toLowerCase() ===
                        "failed" && (
                        <>
                          <DropdownMenu.Item
                            className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() => goToEventFailedView()}
                          >
                            View
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() => goToEventPaymentReturnView()}
                          >
                            Retry
                          </DropdownMenu.Item>
                        </>
                      )}
                      {/* Default fallback - show View Tickets */}
                      {![
                        "paid",
                        "completed",
                        "success",
                        "incomplete",
                        "pending",
                        "failed",
                      ].includes(
                        String(order.paymentStatus || "").toLowerCase()
                      ) && (
                        <DropdownMenu.Item
                          className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                          onSelect={() =>
                            router.push(
                              `/tickets/view?booking=${order.id}&type=events`
                            )
                          }
                        >
                          View Tickets
                        </DropdownMenu.Item>
                      )}
                    </>
                  )}

                  {/* Tours Actions */}
                  {order.type === "tours" && (
                    <>
                      {["paid", "completed", "success"].includes(
                        String(order.paymentStatus || "").toLowerCase()
                      ) && (
                        <>
                          <DropdownMenu.Item
                            className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() =>
                              router.push(
                                `/tickets/view?booking=${order.id}&type=tours`
                              )
                            }
                          >
                            View Tickets
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            disabled={downloadingId === order.id}
                            className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 disabled:opacity-50 cursor-pointer outline-none"
                            onSelect={() => handleDownload(order.id)}
                          >
                            {downloadingId === order.id
                              ? "Downloading..."
                              : "Download Receipt"}
                          </DropdownMenu.Item>
                        </>
                      )}
                      {["incomplete", "pending"].includes(
                        String(order.paymentStatus || "").toLowerCase()
                      ) && (
                        <DropdownMenu.Item
                          className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                          onSelect={() => goToTourPayment(order)}
                        >
                          Complete Booking
                        </DropdownMenu.Item>
                      )}
                      {String(order.paymentStatus || "").toLowerCase() ===
                        "failed" && (
                        <>
                          <DropdownMenu.Item
                            className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() => goToTourFailedView()}
                          >
                            View
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() => goToTourReturnView()}
                          >
                            Retry
                          </DropdownMenu.Item>
                        </>
                      )}
                      {/* Default fallback - show View Tickets */}
                      {![
                        "paid",
                        "completed",
                        "success",
                        "incomplete",
                        "pending",
                        "failed",
                      ].includes(
                        String(order.paymentStatus || "").toLowerCase()
                      ) && (
                        <DropdownMenu.Item
                          className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                          onSelect={() =>
                            router.push(
                              `/tickets/view?booking=${order.id}&type=tours`
                            )
                          }
                        >
                          View Tickets
                        </DropdownMenu.Item>
                      )}
                    </>
                  )}

                  {/* Default fallback for other types */}
                  {!["events", "tours"].includes(order.type) && (
                    <DropdownMenu.Item
                      className="block w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                      onSelect={() => {}}
                    >
                      View Details
                    </DropdownMenu.Item>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>
    );
  };

  const Table = ({ data }) => {
    if (!data.length) return null;

    const headersRaw = Object.keys(data[0]).filter(
      (key) =>
        key !== "eventId" && key !== "type" && key !== "id" && key !== "raw"
    );
    const headers =
      tab === "Internet Connectivity"
        ? headersRaw.filter((h) => h !== "name" && h !== "qty")
        : headersRaw;
    const finalHeaders =
      tab === "Internet Connectivity"
        ? headers.filter((h) => h !== "name" && h !== "qty")
        : headers;

    const labelMap = {
      paymentStatus: "Payment Status",
      eventName: "Event Name",
      BookinDate: "Booking Date",
      dateTime: "Date & Time",
      name: "Merchandise",
      qty: "Quantity",
      category: "Category",
    };

    return (
      <div className="w-full pb-60 overflow-visible">
        <table
          className={`w-full text-left border-collapse ${
            is1280 ? "text-xs" : "text-sm min-w-[1100px]"
          }`}
        >
          <thead
            className={`bg-gray-100 text-gray-700 uppercase font-semibold ${
              is1280 ? "text-[10px]" : "text-xs"
            }`}
          >
            <tr>
              {finalHeaders.map((h) => (
                <th
                  key={h}
                  className={`text-left wrap-break-word whitespace-normal ${
                    is1280
                      ? "px-2 py-2 max-w-[100px]"
                      : "px-4 py-3 max-w-[120px]"
                  }`}
                >
                  {(labelMap[h] || h.replace(/([A-Z])/g, " $1")).toUpperCase()}
                </th>
              ))}
              <th
                className={`wrap-break-word whitespace-normal ${
                  is1280 ? "px-2 py-2 max-w-[80px]" : "px-4 py-3 max-w-[120px]"
                }`}
              >
                ACTION
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((o, idx) => (
              <tr
                key={`${o.id}-${idx}`}
                className="border-t hover:bg-gray-50 transition relative z-0"
              >
                {finalHeaders.map((h) => {
                  const value = o[h];
                  const isTextCell =
                    h === "eventName" || h === "dateTime" || h === "name";
                  const isAmount = h === "amount";
                  const isActivity = h === "activtyStatus";
                  const isPayment = h === "paymentStatus";

                  const activityClasses = String(value || "-")
                    .toLowerCase()
                    .includes("upcoming")
                    ? "text-[#B91C1C] border-[#FCA5A5] bg-[#FEE2E2]"
                    : String(value || "-")
                        .toLowerCase()
                        .includes("done")
                    ? "text-green-600 border-green-200 bg-green-50"
                    : "text-gray-500 border-gray-200 bg-gray-50";

                  const paymentClasses = String(value || "-")
                    .toLowerCase()
                    .includes("completed")
                    ? "text-green-600 border-green-200 bg-green-50"
                    : String(value || "-")
                        .toLowerCase()
                        .includes("failed")
                    ? "text-red-600 border-red-200 bg-red-50"
                    : "text-[#B45309] border-[#FDE68A] bg-[#FEF3C7]";

                  return (
                    <td
                      key={h}
                      className={cn(
                        is1280 ? "px-2 py-2 text-xs" : "px-4 py-3 text-sm",
                        isTextCell
                          ? is1280
                            ? "max-w-[150px]"
                            : "max-w-[200px]"
                          : "whitespace-nowrap"
                      )}
                    >
                      {isAmount && typeof value === "number" ? (
                        `₦${value.toLocaleString()}`
                      ) : isActivity ? (
                        <span
                          className={cn(
                            `inline-flex items-center rounded-full font-medium border ${
                              is1280
                                ? "gap-1 px-2 py-1 text-[10px]"
                                : "gap-2 px-3 py-1.5 text-xs"
                            }`,
                            activityClasses
                          )}
                        >
                          <span
                            className={
                              is1280
                                ? "w-1.5 h-1.5 rounded-full bg-current"
                                : "w-2 h-2 rounded-full bg-current"
                            }
                          />
                          {value || "-"}
                        </span>
                      ) : isPayment ? (
                        <span
                          className={cn(
                            `inline-flex items-center rounded-full font-medium border ${
                              is1280
                                ? "gap-1 px-2 py-1 text-[10px]"
                                : "gap-2 px-3 py-1.5 text-xs"
                            }`,
                            paymentClasses
                          )}
                        >
                          {value || "-"}
                        </span>
                      ) : (
                        value || "-"
                      )}
                    </td>
                  );
                })}

                {/* ACTION MENU */}
                <td
                  className={
                    is1280
                      ? "px-2 py-2 whitespace-nowrap"
                      : "px-4 py-3 whitespace-nowrap"
                  }
                >
                  {/* Debug: Log order type */}
                  {idx === 0 &&
                    console.log(
                      "Order type:",
                      o.type,
                      "Payment:",
                      o.paymentStatus
                    )}

                  {o.type === "events" && (
                    <DropdownMenu.Root modal={false}>
                      <DropdownMenu.Trigger asChild>
                        <button
                          type="button"
                          className="p-2 rounded hover:bg-gray-100 cursor-pointer text-lg font-bold border-0 outline-none focus:outline-none"
                        >
                          ⋮
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          sideOffset={5}
                          align="end"
                          className="bg-white rounded-lg shadow-xl border border-gray-200 min-w-[180px] z-[99999] py-1"
                        >
                          {/* ✅ COMPLETED/PAID */}
                          {["paid", "completed", "success"].includes(
                            String(o.paymentStatus || "").toLowerCase()
                          ) && (
                            <>
                              <DropdownMenu.Item
                                className="block w-full text-left hover:bg-gray-100 cursor-pointer outline-none px-4 py-2 text-sm"
                                onSelect={() =>
                                  router.push(
                                    `/tickets/view?booking=${o.id}&type=events`
                                  )
                                }
                              >
                                View Tickets
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                disabled={downloadingId === o.id}
                                className="block w-full text-left hover:bg-gray-100 disabled:opacity-50 cursor-pointer outline-none px-4 py-2 text-sm"
                                onSelect={() => handleDownload(o.id)}
                              >
                                {downloadingId === o.id
                                  ? "Downloading..."
                                  : "Download Receipt"}
                              </DropdownMenu.Item>
                            </>
                          )}

                          {/* ⏳ INCOMPLETE/PENDING */}
                          {["incomplete", "pending"].includes(
                            String(o.paymentStatus || "").toLowerCase()
                          ) && (
                            <DropdownMenu.Item
                              className="block w-full text-left hover:bg-gray-100 cursor-pointer outline-none px-4 py-2 text-sm"
                              onSelect={() => goToEventPayment(o)}
                            >
                              Complete Booking
                            </DropdownMenu.Item>
                          )}

                          {/* ❌ FAILED */}
                          {String(o.paymentStatus || "").toLowerCase() ===
                            "failed" && (
                            <>
                              <DropdownMenu.Item
                                className="block w-full text-left hover:bg-gray-100 cursor-pointer outline-none px-4 py-2 text-sm"
                                onSelect={() => goToEventFailedView()}
                              >
                                View
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="block w-full text-left hover:bg-gray-100 cursor-pointer outline-none px-4 py-2 text-sm"
                                onSelect={() => goToEventPaymentReturnView()}
                              >
                                Retry
                              </DropdownMenu.Item>
                            </>
                          )}
                          {/* Default fallback - show View Tickets */}
                          {![
                            "paid",
                            "completed",
                            "success",
                            "incomplete",
                            "pending",
                            "failed",
                          ].includes(
                            String(o.paymentStatus || "").toLowerCase()
                          ) && (
                            <DropdownMenu.Item
                              className="block w-full text-left hover:bg-gray-100 cursor-pointer outline-none px-4 py-2 text-sm"
                              onSelect={() =>
                                router.push(
                                  `/tickets/view?booking=${o.id}&type=events`
                                )
                              }
                            >
                              View Tickets
                            </DropdownMenu.Item>
                          )}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  )}
                  {o.type === "royalconcierge" && (
                    <DropdownMenu.Root modal={false}>
                      <DropdownMenu.Trigger asChild>
                        <button
                          type="button"
                          className="p-2 rounded hover:bg-gray-100 cursor-pointer text-lg font-bold border-0 outline-none focus:outline-none"
                        >
                          ⋮
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          sideOffset={5}
                          align="end"
                          className="bg-white rounded-lg shadow-xl border border-gray-200 min-w-[180px] z-[99999] py-1"
                        >
                          <DropdownMenu.Item
                            className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() => {
                              setRoyalOrder(o.raw);
                              setRoyalModalOpen(true);
                            }}
                          >
                            View Booking
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  )}

                  {o.type === "tours" && (
                    <DropdownMenu.Root modal={false}>
                      <DropdownMenu.Trigger asChild>
                        <button
                          type="button"
                          className="p-2 rounded hover:bg-gray-100 cursor-pointer text-lg font-bold border-0 outline-none focus:outline-none"
                        >
                          ⋮
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          sideOffset={5}
                          align="end"
                          className="bg-white rounded-lg shadow-xl border border-gray-200 min-w-[180px] z-[99999] py-1"
                        >
                          {/* Always show View Tickets for paid/completed orders */}
                          {["paid", "completed", "success"].includes(
                            String(o.paymentStatus || "").toLowerCase()
                          ) && (
                            <>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() =>
                                  router.push(
                                    `/tickets/view?booking=${o.id}&type=tours`
                                  )
                                }
                              >
                                View Tickets
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                disabled={downloadingId === o.id}
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 disabled:opacity-50 cursor-pointer outline-none"
                                onSelect={() => handleDownload(o.id)}
                              >
                                {downloadingId === o.id
                                  ? "Downloading..."
                                  : "Download Receipt"}
                              </DropdownMenu.Item>
                            </>
                          )}
                          {["incomplete", "pending"].includes(
                            String(o.paymentStatus || "").toLowerCase()
                          ) && (
                            <DropdownMenu.Item
                              className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                              onSelect={() => goToTourPayment(o)}
                            >
                              Complete Booking
                            </DropdownMenu.Item>
                          )}
                          {String(o.paymentStatus || "").toLowerCase() ===
                            "failed" && (
                            <>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToTourFailedView()}
                              >
                                View
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToTourReturnView()}
                              >
                                Retry
                              </DropdownMenu.Item>
                            </>
                          )}
                          {/* Default: Always show View Tickets as fallback */}
                          {![
                            "paid",
                            "completed",
                            "success",
                            "incomplete",
                            "pending",
                            "failed",
                          ].includes(
                            String(o.paymentStatus || "").toLowerCase()
                          ) && (
                            <DropdownMenu.Item
                              className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                              onSelect={() =>
                                router.push(
                                  `/tickets/view?booking=${o.id}&type=tours`
                                )
                              }
                            >
                              View Tickets
                            </DropdownMenu.Item>
                          )}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  )}

                  {o.type === "merchandise" && (
                    <DropdownMenu.Root modal={false}>
                      <DropdownMenu.Trigger asChild>
                        <button
                          type="button"
                          className="p-2 rounded hover:bg-gray-100 cursor-pointer text-lg font-bold border-0 outline-none focus:outline-none"
                        >
                          ⋮
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          sideOffset={5}
                          align="end"
                          className="bg-white rounded-lg shadow-xl border border-gray-200 min-w-[180px] z-[99999] py-1"
                        >
                          {String(o.paymentStatus || "").toLowerCase() ===
                            "completed" && (
                            <>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToViewOrder(o)}
                              >
                                View Order
                              </DropdownMenu.Item>
                            </>
                          )}

                          {String(o.paymentStatus || "").toLowerCase() ===
                            "incomplete" && (
                            <>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToMerchPayment(o)}
                              >
                                Complete Booking
                              </DropdownMenu.Item>
                            </>
                          )}

                          {String(o.paymentStatus || "").toLowerCase() ===
                            "failed" && (
                            <>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToMerchSuccess(o)}
                              >
                                View
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToMerchPayment(o)}
                              >
                                Retry
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => cancelMerchOrder(o)}
                              >
                                Cancel Order
                              </DropdownMenu.Item>
                            </>
                          )}
                          {/* Fallback when no status matches */}
                          {!["completed", "incomplete", "failed"].includes(
                            String(o.paymentStatus || "").toLowerCase()
                          ) && (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No actions available
                            </div>
                          )}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  )}

                  {o.type === "accommodation" && (
                    <DropdownMenu.Root modal={false}>
                      <DropdownMenu.Trigger asChild>
                        <button
                          type="button"
                          className="p-2 rounded hover:bg-gray-100 cursor-pointer text-lg font-bold border-0 outline-none focus:outline-none"
                        >
                          ⋮
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          sideOffset={5}
                          align="end"
                          className="bg-white rounded-lg shadow-xl border border-gray-200 min-w-[180px] z-[99999] py-1"
                        >
                          {String(o.paymentStatus || "").toLowerCase() ===
                            "paid" && (
                            <>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToViewOrderAccommodation(o)}
                              >
                                View Booking
                              </DropdownMenu.Item>
                            </>
                          )}

                          {String(o.paymentStatus || "").toLowerCase() ===
                            "incomplete" && (
                            <>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToMerchPayment(o)}
                              >
                                Complete Booking
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => cancelMerchOrder(o)}
                              >
                                Cancel Order
                              </DropdownMenu.Item>
                            </>
                          )}

                          {String(o.paymentStatus || "").toLowerCase() ===
                          "failed" ? (
                            <>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToViewOrder(o)}
                              >
                                View Order
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToMerchPayment(o)}
                              >
                                Retry
                              </DropdownMenu.Item>
                            </>
                          ) : (
                            <>
                              <DropdownMenu.Item
                                className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer outline-none"
                                onSelect={() => goToViewOrder(o)}
                              >
                                View Order
                              </DropdownMenu.Item>
                            </>
                          )}
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  )}
                  {o.type === "esim" && (
                    <DropdownMenu.Root modal={false}>
                      <DropdownMenu.Trigger asChild>
                        <button
                          type="button"
                          className="p-2 rounded hover:bg-gray-100 cursor-pointer text-lg font-bold border-0 outline-none focus:outline-none"
                        >
                          ⋮
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          sideOffset={5}
                          align="end"
                          className="bg-white rounded-lg shadow-xl border border-gray-200 min-w-[180px] z-[99999] py-1"
                        >
                          <DropdownMenu.Item
                            className="block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 cursor-pointer outline-none"
                            onSelect={() => {
                              setEsimOrder(o.raw);
                              setEsimModalOpen(true);
                            }}
                          >
                            View Details
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const aok = activityFilter
        ? String(o.activtyStatus || "-").toLowerCase() ===
          activityFilter.toLowerCase()
        : true;
      const pok = paymentFilter
        ? String(o.paymentStatus || "-").toLowerCase() ===
          paymentFilter.toLowerCase()
        : true;
      return aok && pok;
    });
  }, [orders, activityFilter, paymentFilter]);

  return (
    <div className="w-full overflow-x-hidden">
      <div
        className={`max-w-full mx-auto px-2 sm:px-4 lg:px-6 ${
          is1280 ? "mb-6" : "mb-6"
        } relative`}
      >
        <div
          className={`flex ${
            is1280
              ? "flex-row items-center justify-between"
              : "flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          }`}
        >
          <h1
            className={`font-semibold text-gray-900 ${
              is1280 ? "text-2xl" : "text-xl lg:text-2xl"
            }`}
          >
            My Orders
          </h1>
          <div
            className={`flex gap-3 ${
              is1280
                ? "flex-row w-auto"
                : "flex-col sm:flex-row w-full lg:w-auto"
            }`}
          >
            <SelectDropdown
              placeholder="Filter By Activity State"
              options={activityOptions}
              value={activityFilter}
              onChange={setActivityFilter}
            />
            <SelectDropdown
              placeholder="Filter By Payment Status"
              options={paymentOptions}
              value={paymentFilter}
              onChange={setPaymentFilter}
            />
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 relative mb-20">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden min-h-[600px]">
          <div className={`border-b ${is1280 ? "p-6" : "p-4 sm:p-6"}`}>
            <ReusableTabs onSelect={setTab} tabList={tabList} is1280={is1280} />
          </div>
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10">No orders found.</div>
          ) : (
            <>
              {/* Mobile & Tablet Card View */}
              <div className="block lg:hidden p-3 sm:p-4 overflow-x-hidden">
                {filteredOrders.map((order, idx) => (
                  <MobileCard
                    key={`${order.id}-${idx}`}
                    order={order}
                    index={idx}
                  />
                ))}
              </div>
              {/* Desktop Table View (1024px and above) */}
              <div className="hidden lg:block w-full pb-60 overflow-x-auto">
                <Table data={filteredOrders} />
              </div>
            </>
          )}
        </div>
      </div>
      {esimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEsimModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Internet Connectivity Order
              </h2>
              <button
                className="text-gray-500 hover:text-gray-800 text-xl"
                onClick={() => setEsimModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Order ID
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {esimOrder?._id || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Payment Status
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {esimOrder?.paymentStatus || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Amount</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  ₦{Number(esimOrder?.amount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Customer Name
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {esimOrder?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Email</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {esimOrder?.email || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Created At
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {formatEventDate(esimOrder?.createdAt) || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Updated At
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {formatEventDate(esimOrder?.updatedAt) || "-"}
                </span>
              </div>
              <div className="mt-3 sm:mt-4 border-t pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
                <div className="text-xs sm:text-sm font-semibold text-gray-900">
                  User
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">
                    User ID
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {esimOrder?.userId?._id || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Name</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {esimOrder?.userId?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Email
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                    {esimOrder?.userId?.email || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {royalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setRoyalModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-[90%] max-w-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Booking Details
              </h2>
              <button
                className="text-gray-500 hover:text-gray-800 text-xl"
                onClick={() => setRoyalModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Transaction ID
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.transactionId ||
                    royalOrder?.transaction_id ||
                    "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  RC Booking Reference
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.rcBookingReference || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Status</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.rcStatus || royalOrder?.status || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Customer
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {[
                    royalOrder?.customer?.first_name,
                    royalOrder?.customer?.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Email</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.customer?.email || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Phone</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.customer?.phone || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Nationality
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.customer?.nationality || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Tier</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.serviceDetails?.tier ||
                    royalOrder?.service_details?.tier ||
                    "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Flight Number
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.serviceDetails?.flight_number ||
                    royalOrder?.service_details?.flight_number ||
                    "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Travel Date
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {formatEventDate(
                    royalOrder?.serviceDetails?.travel_date ||
                      royalOrder?.service_details?.travel_date
                  ) || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Passenger Count
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.serviceDetails?.passenger_count ||
                    royalOrder?.service_details?.passenger_count ||
                    "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Currency
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {royalOrder?.financials?.currency || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Line Item Value
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  ₦
                  {Number(
                    royalOrder?.financials?.rcs_line_item_value || 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Remittance Amount
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  ₦
                  {Number(
                    royalOrder?.financials?.remittance_amount || 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Marketplace Fee
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  ₦
                  {Number(
                    royalOrder?.financials?.marketplace_fee || 0
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Created On
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {formatEventDate(royalOrder?.createdAt) || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Updated On
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {formatEventDate(royalOrder?.updatedAt) || "-"}
                </span>
              </div>
              <div className="pt-2 sm:pt-3">
                <button
                  className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium"
                  onClick={() => setRoyalModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
