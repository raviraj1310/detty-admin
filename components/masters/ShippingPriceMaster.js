"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MoreVertical,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { TbCaretUpDownFilled } from "react-icons/tb";
import {
  getShippingPrices,
  getShippingPriceById,
  createShippingPrice,
  updateShippingPrice,
  deleteShippingPrice,
} from "@/services/shipping-price/shipping-price.service";
import Toast from "@/components/ui/Toast";

const TableHeaderCell = ({
  children,
  align = "left",
  onClick,
  active = false,
  order = "desc",
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide whitespace-nowrap ${
      align === "right" ? "justify-end" : "justify-start"
    } ${active ? "text-[#2D3658]" : "text-[#8A92AC]"}`}
  >
    {children}
    <TbCaretUpDownFilled
      className={`h-3 w-3 ${active ? "text-[#4F46E5]" : "text-[#CBCFE2]"} ${
        order === "asc" ? "rotate-180" : ""
      }`}
    />
  </button>
);

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

export default function ShippingPriceMaster() {
  const formSectionRef = useRef(null);
  const locationInputRef = useRef(null);
  const [formData, setFormData] = useState({ location: "", price: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    title: "",
    description: "",
    variant: "success",
  });

  const [shippingPrices, setShippingPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("location");
  const [sortOrder, setSortOrder] = useState("desc");

  const [menuOpenId, setMenuOpenId] = useState(null);
  const [rowActionLoading, setRowActionLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [limit, setLimit] = useState(50);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);

  const normalizePrice = (d) => ({
    _id: d?._id || d?.id || "",
    location: d?.location || d?.title || "",
    price:
      typeof d?.price !== "undefined"
        ? Number(d.price || 0)
        : typeof d?.amount !== "undefined"
        ? Number(d.amount || 0)
        : typeof d?.charge !== "undefined"
        ? Number(d.charge || 0)
        : 0,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    const location = String(formData.location || "").trim();
    const priceStr = String(formData.price || "").trim();
    const priceNum = parseFloat(priceStr);
    if (!location || location.length < 2)
      errs.location = "Enter a valid location";
    if (!priceStr) errs.price = "Enter price";
    else if (Number.isNaN(priceNum) || priceNum < 0)
      errs.price = "Enter a valid price";
    return errs;
  };

  const fetchShipping = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getShippingPrices();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res)
        ? res
        : [];
      setShippingPrices(list.map(normalizePrice));
    } catch (e) {
      setError("Failed to load shipping prices");
      setShippingPrices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipping();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenId !== null) {
        const target = event.target;
        const isMenuButton = target.closest("button[data-menu-button]");
        const isMenuContent = target.closest("[data-menu-content]");
        if (!isMenuButton && !isMenuContent) setMenuOpenId(null);
      }
    };
    if (menuOpenId !== null)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setSubmitting(true);
      const payload = {
        location: String(formData.location || "").trim(),
        price: parseFloat(String(formData.price || "0")),
      };
      if (editingId) await updateShippingPrice(editingId, payload);
      else await createShippingPrice(payload);
      await fetchShipping();
      setFormData({ location: "", price: "" });
      setEditingId(null);
      setToast({
        open: true,
        title: editingId ? "Shipping price updated" : "Shipping price created",
        description: editingId
          ? "Changes have been saved"
          : "New shipping price has been added",
        variant: "success",
      });
    } catch (e) {
      setError(
        editingId
          ? "Failed to update shipping price"
          : "Failed to create shipping price"
      );
      setToast({
        open: true,
        title: "Error",
        description:
          e?.response?.data?.message || e?.message || "Request failed",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = async (id) => {
    setRowActionLoading(id);
    try {
      const res = await getShippingPriceById(id);
      const d = res?.data || res || {};
      const norm = normalizePrice(d);
      setFormData({
        location: String(norm.location || ""),
        price: String(norm.price || ""),
      });
      setEditingId(id);
      setMenuOpenId(null);
      setErrors({});
      setTimeout(() => {
        formSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        locationInputRef.current?.focus();
      }, 50);
    } catch (e) {
      setError("Failed to load shipping price");
    } finally {
      setRowActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deleteShippingPrice(confirmId);
      await fetchShipping();
      setToast({
        open: true,
        title: "Shipping price deleted",
        description: "The record has been removed",
        variant: "success",
      });
    } catch (e) {
      setError("Failed to delete shipping price");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const filtered = useMemo(() => {
    const base = Array.isArray(shippingPrices) ? shippingPrices : [];
    const term = String(searchTerm || "")
      .trim()
      .toLowerCase();
    return base.filter((sp) => {
      const location = String(sp.location || "").toLowerCase();
      const priceStr = String(sp.price || "");
      return location.includes(term) || priceStr.includes(term);
    });
  }, [shippingPrices, searchTerm]);

  const getSortValue = (item, key) => {
    if (key === "location") return String(item.location || "").toLowerCase();
    if (key === "price") return Number(item.price || 0);
    return 0;
  };

  const sorted = useMemo(() => {
    const arr = Array.isArray(filtered) ? [...filtered] : [];
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (typeof va === "string" && typeof vb === "string")
        return sortOrder === "asc"
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      return sortOrder === "asc" ? va - vb : vb - va;
    });
    return arr;
  }, [filtered, sortKey, sortOrder]);

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

  const toggleSort = (key) => {
    if (sortKey === key)
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-5 py-2 px-3">
      <Toast
        open={toast.open}
        onOpenChange={(v) => setToast((prev) => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position="top-right"
      />

      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">
            Shipping Price Master
          </h1>
          <p className="text-xs text-[#99A1BC]">
            Dashboard / Masters / Shipping Price Master
          </p>
        </div>
      </div>

      <div className="bg-gray-100 rounded-xl p-2">
        <div className="rounded-xl border border-[#E1E6F7] bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Shipping Price Details
            </h2>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-[#FF5B2C] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {editingId ? "Updating..." : "Adding..."}
                </span>
              ) : editingId ? (
                "Update"
              ) : (
                "Add"
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} ref={formSectionRef}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  ref={locationInputRef}
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className="w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  placeholder="Enter location"
                />
                {errors.location && (
                  <p className="text-xs text-red-600">{errors.location}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  placeholder="Enter price"
                />
                {errors.price && (
                  <p className="text-xs text-red-600">{errors.price}</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-gray-100 rounded-xl p-2">
        <div className="rounded-xl border border-[#E1E6F7] bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Shipping Prices
            </h2>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] pl-8 pr-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              />
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#A6AEC7]" />
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
                    disabled={page <= 1 || loading}
                    className="h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-[#2D3658]">
                    Page {page} of {pageCount}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount || loading}
                    className="h-8 px-3 py-1.5 border border-[#E5E6EF] rounded-lg bg-white text-xs font-medium text-[#2D3658] disabled:opacity-50 hover:bg-[#F6F7FD]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E5E8F5]">
            <div className="grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3">
              <div className="col-span-8">
                <TableHeaderCell
                  onClick={() => toggleSort("location")}
                  active={sortKey === "location"}
                  order={sortOrder}
                >
                  Location
                </TableHeaderCell>
              </div>
              <div className="col-span-3">
                <TableHeaderCell
                  onClick={() => toggleSort("price")}
                  active={sortKey === "price"}
                  order={sortOrder}
                >
                  Price
                </TableHeaderCell>
              </div>
              <div className="col-span-1">
                <TableHeaderCell align="right">Action</TableHeaderCell>
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
              {!loading && !error && sorted.length === 0 && (
                <div className="px-4 py-3 text-center text-xs text-[#5E6582]">
                  No records found
                </div>
              )}
              {!loading &&
                !error &&
                paginatedBookings?.map((sp, idx) => (
                  <div
                    key={sp._id || idx}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#F9FAFD]"
                  >
                    <div className="col-span-8 self-center text-xs font-semibold text-slate-900">
                      {sp.location || "-"}
                    </div>
                    <div className="col-span-3 self-center text-xs font-semibold text-slate-900">
                      {toCurrency(sp.price)}
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <div className="relative">
                        <button
                          data-menu-button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === (sp._id || idx)
                                ? null
                                : sp._id || idx
                            )
                          }
                          className="rounded-full border border-transparent p-1.5 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpenId === (sp._id || idx) && (
                          <div
                            data-menu-content
                            className="absolute right-0 mt-1 w-32 rounded-md border border-[#E5E8F6] bg-white shadow-lg z-20"
                          >
                            <button
                              onClick={() => startEdit(sp._id)}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#2D3658] hover:bg-[#F6F7FD]"
                              disabled={rowActionLoading === sp._id}
                            >
                              {rowActionLoading === sp._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Pencil className="h-3.5 w-3.5" />
                              )}
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmId(sp._id);
                                setConfirmOpen(true);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
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

      {confirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              if (!deleting) {
                setConfirmOpen(false);
                setConfirmId(null);
              }
            }}
          />
          <div className="relative z-50 w-full max-w-sm rounded-xl border border-[#E5E8F6] bg-white p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-900">
                  Delete this record?
                </div>
                <div className="mt-1 text-xs text-[#5E6582]">
                  This action cannot be undone.
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  if (!deleting) {
                    setConfirmOpen(false);
                    setConfirmId(null);
                  }
                }}
                className="rounded-lg border border-[#E5E6EF] bg-white px-4 py-1.5 text-xs font-medium text-[#1A1F3F] transition hover:bg-[#F9FAFD]"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
