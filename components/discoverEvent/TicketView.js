"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { getTicketDetail } from "@/services/discover-events/event.service";
import { formatEventDate } from "@/utils/excelExport";

const toImageSrc = (u) => {
  const s = String(u || "");
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
  return `${origin.replace(/\/$/, "")}/${s.replace(/^\/+/, "")}`;
};

export default function TicketView() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = params?.id || "";
  const eventId = searchParams?.get("eventId") || "";
  const [booking, setBooking] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const r = await getTicketDetail(bookingId);
        const d = r?.data || r || null;
        setBooking(d);
        setEvent(d?.event || null);
      } catch (e) {
        setError("Failed to load ticket");
        setBooking(null);
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchData();
  }, [bookingId]);

  const formatNaira = (v) => {
    if (typeof v === "number") return `₦${v.toLocaleString()}`;
    const n = Number(v);
    return isNaN(n) ? String(v || "-") : `₦${n.toLocaleString()}`;
  };
  const arrivalDate = booking?.event?.arrivalDate || "";
  console.log("🚀 ~ file: TicketView.js:55 ~ arrivalDate:", arrivalDate);
  const buyer = booking?.buyer || {};
  const issuedOn =
    booking?.createdAt || booking?.bookedOn || booking?.updatedAt;
  const issuedDate = issuedOn
    ? new Date(
        typeof issuedOn === "object" && issuedOn.$date
          ? issuedOn.$date
          : issuedOn
      )
    : null;
  const tickets = Array.isArray(booking?.tickets) ? booking.tickets : [];
  const items = tickets.map((t) => ({
    quantity: t.quantity,
    name: t.ticketName || t.ticketType,
    price: t.totalPrice,
  }));
  const total = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const attendees = tickets.flatMap((t) =>
    Array.isArray(t.attendees)
      ? t.attendees.map((a) => ({
          ...a,
          ticketName: t.ticketName || t.ticketType,
        }))
      : []
  );

  return (
    <div className="min-h-screen bg-[#fffff] p-12">
      {loading && (
        <div className="mx-auto max-w-3xl mb-4 text-sm text-[#5E6582]">
          Loading...
        </div>
      )}
      {error && !loading && (
        <div className="mx-auto max-w-3xl mb-4 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="mx-auto max-w-3xl bg-white rounded-lg overflow-hidden shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
        <div className="bg-black text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo/fotter_logo.webp"
              alt="logo"
              className="h-8 w-auto"
            />
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">
              Order ID: {String(bookingId || "-")}
            </div>
            <div className="text-white/80">
              Issued on: {issuedDate ? issuedDate.toLocaleDateString() : "-"}
            </div>
            <div className="text-white/80">
              Visit Date: {arrivalDate ? formatEventDate(arrivalDate) : "-"}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden">
                {event?.image ? (
                  <img
                    src={toImageSrc(event.image)}
                    alt={event?.eventName || "Event"}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                <div className="text-base font-semibold text-slate-900">
                  {event?.eventName || booking?.ticketName || "Event"}
                </div>
                <div className="text-sm text-[#5E6582]">
                  {(() => {
                    const d = event?.eventStartDate;
                    const date = d
                      ? new Date(typeof d === "object" && d.$date ? d.$date : d)
                      : null;
                    const time = event?.eventStartTime;
                    return `${
                      date
                        ? date.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "Sat, Dec 14"
                    } • ${time || "3pm"}`;
                  })()}
                </div>
                <div className="text-sm text-[#5E6582]">
                  @ {event?.location || "Landmark Event Centre, Lagos"}
                </div>
              </div>
            </div>
            <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">
              <img
                src="/images/qrnew.png"
                alt="qr code"
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="divide-y divide-[#EEF1FA]">
            <div className="py-3 space-y-2">
              {items.length > 0
                ? items.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {it.quantity}* {it.name}
                      </span>
                      <span>{formatNaira(it.price)}</span>
                    </div>
                  ))
                : null}
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">
                Total
              </span>
              <span className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Tag className="h-4 w-4 text-orange-500" />
                {formatNaira(total)}
              </span>
            </div>
            {booking?.paymentStatus || booking?.bookingStatus ? (
              <div className="py-3 grid grid-cols-2 gap-4">
                <div className="text-sm text-[#5E6582]">Payment Status</div>
                <div className="text-right text-sm font-semibold text-slate-900">
                  {booking?.paymentStatus || "-"}
                </div>
                <div className="text-sm text-[#5E6582]">Booking Status</div>
                <div className="text-right text-sm font-semibold text-slate-900">
                  {booking?.bookingStatus || "-"}
                </div>
              </div>
            ) : null}
          </div>

          {attendees.map((a, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#E5E8F6] bg-white p-4"
            >
              <div className="text-sm font-semibold text-slate-900 mb-3">
                Ticket {idx + 1}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-[#5E6582]">Name</div>
                <div className="text-right font-semibold text-slate-900">
                  {a.fullName || buyer.fullName || "-"}
                </div>
                <div className="text-[#5E6582]">Email Address</div>
                <div className="text-right font-semibold text-slate-900">
                  {a.email || buyer.email || "-"}
                </div>
                <div className="text-[#5E6582]">Phone Number</div>
                <div className="text-right font-semibold text-slate-900">
                  {a.phone || buyer.phone || "-"}
                </div>
                <div className="text-[#5E6582]">Purchased on</div>
                <div className="text-right font-semibold text-slate-900">
                  {issuedDate ? issuedDate.toLocaleDateString() : "-"}
                </div>
                <div className="text-[#5E6582]">Ticket Name</div>
                <div className="text-right font-semibold text-slate-900">
                  {a.ticketName || booking?.ticketName || "General Admission"}
                </div>
              </div>
            </div>
          ))}

          {buyer?.fullName || buyer?.email || buyer?.phone ? (
            <div className="rounded-xl border border-[#E5E8F6] bg-white p-4">
              <div className="text-sm font-semibold text-slate-900 mb-3">
                Buyer Details
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-[#5E6582]">Full Name</div>
                <div className="text-right font-semibold text-slate-900">
                  {buyer.fullName || "-"}
                </div>
                <div className="text-[#5E6582]">Email Address</div>
                <div className="text-right font-semibold text-slate-900">
                  {buyer.email || "-"}
                </div>
                <div className="text-[#5E6582]">Phone</div>
                <div className="text-right font-semibold text-slate-900">
                  {buyer.phone || "-"}
                </div>
                <div className="text-[#5E6582]">Country</div>
                <div className="text-right font-semibold text-slate-900">
                  {buyer.country || "-"}
                </div>
                <div className="text-[#5E6582]">City</div>
                <div className="text-right font-semibold text-slate-900">
                  {buyer.city || "-"}
                </div>
              </div>
            </div>
          ) : null}

          {booking?.pricing?.serviceFee || booking?.pricing?.discountApplied ? (
            <div className="rounded-xl border border-[#E5E8F6] bg-white p-4">
              <div className="text-sm font-semibold text-slate-900 mb-3">
                Pricing
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-[#5E6582]">Service Fee</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatNaira(booking?.pricing?.serviceFee || 0)}
                </div>
                <div className="text-[#5E6582]">Discount Applied</div>
                <div className="text-right font-semibold text-slate-900">
                  {formatNaira(booking?.pricing?.discountApplied || 0)}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => router.back()}
          className="rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]"
        >
          Back
        </button>
      </div>
    </div>
  );
}
