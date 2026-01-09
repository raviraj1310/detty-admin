"use client";

import { useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { TbCaretUpDownFilled } from "react-icons/tb";
import Toast from "@/components/ui/Toast";
import {
  registerVendor,
  getVendors,
  changeVendorStatus,
} from "@/services/vendor/vendor.service";

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

export default function VendorMaster() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    businessName: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    title: "",
    description: "",
    variant: "success",
  });
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [sortKey, setSortKey] = useState("addedOn");
  const [sortOrder, setSortOrder] = useState("desc");
  const [rowActionLoading, setRowActionLoading] = useState(null);

  const normalizeVendor = (d) => {
    const statusBool = !!d?.status;

    return {
      _id: d?._id || d?.id || "",
      name: (d?.userId && d.userId.name) || d?.name || "",
      email: (d?.userId && d.userId.email) || d?.email || "",
      phoneNumber: (d?.userId && d.userId.phoneNumber) || d?.phoneNumber || "",
      businessName: d?.businessName || "",
      createdAt:
        d?.createdAt ||
        d?.updatedAt ||
        (d?.userId && (d.userId.createdAt || d.userId.updatedAt)) ||
        "",

      // ✅ STATUS
      status: statusBool,
      statusClass: statusBool
        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
        : "bg-red-50 text-red-600 border border-red-200",
    };
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const emailRegex =
    /^(?:[a-zA-Z0-9_'^&\/+{}~-]+(?:\.[a-zA-Z0-9_'^&\/+{}~-]+)*|"(?:[^"]|\\")+")@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|\[(?:[0-9]{1,3}\.){3}[0-9]{1,3}\])$/;
  const phoneRegex = /^[0-9]{7,15}$/;

  const validate = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2)
      errs.name = "Enter a valid name";
    if (!formData.email || !emailRegex.test(formData.email.trim()))
      errs.email = "Enter a valid email";
    if (!formData.password || formData.password.length < 6)
      errs.password = "Enter a 6+ char password";
    if (!formData.phoneNumber || !phoneRegex.test(formData.phoneNumber))
      errs.phoneNumber = "Enter a valid phone";
    if (!formData.businessName || formData.businessName.trim().length < 2)
      errs.businessName = "Enter a business name";
    return errs;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phoneNumber: "",
      businessName: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phoneNumber: formData.phoneNumber.trim(),
        businessName: formData.businessName.trim(),
      };
      if (editingId) {
        setVendors((prev) =>
          prev.map((v) => (v._id === editingId ? { ...v, ...payload } : v))
        );
        setToast({
          open: true,
          title: "Vendor updated",
          description: "Changes have been saved",
          variant: "success",
        });
      } else {
        const res = await registerVendor(payload);
        const msg = String(res?.message || "").trim();
        const dup = /already exists/i.test(msg);
        const hasData = !!(res?.data && (res.data._id || res.data.id));
        if (dup || (!hasData && res?.success)) {
          setErrors((prev) => ({
            ...prev,
            email: msg || "Email already exists",
          }));
          setToast({
            open: true,
            title: "Email already exists",
            description: "Please use a different email",
            variant: "error",
          });
          return;
        }
        if (res?.success && hasData) {
          const created = normalizeVendor(res.data);
          setVendors((prev) => [created, ...prev]);
          setToast({
            open: true,
            title: "Vendor created",
            description: "Your vendor has been added",
            variant: "success",
          });
          const listRes = await getVendors({});
          const list = Array.isArray(listRes?.data)
            ? listRes.data
            : Array.isArray(listRes)
            ? listRes
            : [];

          setVendors(list.map(normalizeVendor));
        } else {
          setToast({
            open: true,
            title: "Failed",
            description: msg || "Could not register vendor",
            variant: "error",
          });
          return;
        }
      }
      resetForm();
      setErrors({});
      setEditingId(null);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (id) => {
    const v = vendors.find((x) => x._id === id);
    if (!v) return;
    setFormData({
      name: v.name || "",
      email: v.email || "",
      password: v.password || "",
      phoneNumber: v.phoneNumber || "",
      businessName: v.businessName || "",
    });
    setEditingId(id);
    setMenuOpenId(null);
  };

  const confirmDelete = (id) => {
    setVendors((prev) => prev.filter((v) => v._id !== id));
    setMenuOpenId(null);
    setToast({
      open: true,
      title: "Vendor deleted",
      description: "The vendor has been removed",
      variant: "success",
    });
  };

  const filtered = vendors.filter((v) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      String(v.name || "")
        .toLowerCase()
        .includes(term) ||
      String(v.email || "")
        .toLowerCase()
        .includes(term) ||
      String(v.businessName || "")
        .toLowerCase()
        .includes(term) ||
      String(v.phoneNumber || "")
        .toLowerCase()
        .includes(term)
    );
  });

  const getSortValue = (v, key) => {
    if (key === "addedOn") {
      const d = v.createdAt;
      if (!d) return 0;
      const ts = typeof d === "object" && d.$date ? d.$date : d;
      try {
        return new Date(ts).getTime();
      } catch {
        return 0;
      }
    }
    if (key === "name") return String(v.name || "").toLowerCase();
    if (key === "email") return String(v.email || "").toLowerCase();
    if (key === "phone") return String(v.phoneNumber || "");
    if (key === "business") return String(v.businessName || "").toLowerCase();
    return "";
  };

  const sorted = (() => {
    const arr = Array.isArray(filtered) ? [...filtered] : [];
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (typeof va === "string" && typeof vb === "string") {
        return sortOrder === "asc"
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      }
      return sortOrder === "asc" ? va - vb : vb - va;
    });
    return arr;
  })();

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const res = await getVendors({});
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        console.log(list, "list");
        const normalized = list.map(normalizeVendor).sort((a, b) => {
          const va = getSortValue(a, "addedOn");
          const vb = getSortValue(b, "addedOn");
          return vb - va;
        });
        console.log(normalized, "normalise");
        setVendors(normalized);
      } catch {
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenId !== null) {
        const target = event.target;
        const isMenuButton = target.closest("button[data-menu-button]");
        const isMenuContent = target.closest("[data-menu-content]");
        if (!isMenuButton && !isMenuContent) {
          setMenuOpenId(null);
        }
      }
    };
    if (menuOpenId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenId]);

  const handleVendorStatusChange = async (id, currentStatus) => {
    try {
      setRowActionLoading(id);

      const newStatus = !currentStatus;

      await changeVendorStatus(id, newStatus);

      setVendors((prev) =>
        prev.map((vendor) =>
          vendor._id === id ? { ...vendor, status: newStatus } : vendor
        )
      );

      setToast({
        open: true,
        title: "Status updated",
        description: `Vendor marked as ${newStatus ? "active" : "inactive"}`,
        variant: "success",
      });
    } catch (error) {
      setToast({
        open: true,
        title: "Error",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update vendor status",
        variant: "destructive",
      });
    } finally {
      setRowActionLoading(null);
    }
  };

  return (
    <div className="space-y-5 py-6 px-6">
      <Toast
        open={toast.open}
        onOpenChange={(o) => setToast((prev) => ({ ...prev, open: o }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position="top-right"
      />

      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">
            Vendor Master
          </h1>
          <p className="text-xs text-[#99A1BC]">Dashboard / Vendor Master</p>
        </div>
        <button
          form="vendorForm"
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-[#FF5B2C] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {editingId ? "Saving..." : "Adding..."}
            </span>
          ) : editingId ? (
            "Save"
          ) : (
            "Add"
          )}
        </button>
      </div>

      <form id="vendorForm" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-[#E1E6F7] bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">
            Vendor Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Name*
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Email*
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Password*
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className="w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Phone Number*
              </label>
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                className="w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-600">{errors.phoneNumber}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Business Name*
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) =>
                  handleInputChange("businessName", e.target.value)
                }
                className="w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              />
              {errors.businessName && (
                <p className="text-xs text-red-600">{errors.businessName}</p>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="rounded-2xl border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Vendors List</h2>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="flex items-center gap-1 text-xs text-[#5E6582]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
              </span>
            )}
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
          </div>
        </div>
        <div className="overflow-visible rounded-xl border border-[#E5E8F5]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3 border-b border-[#E5E8F6]">
            <div className="col-span-3">
              <TableHeaderCell
                onClick={() => toggleSort("name")}
                active={sortKey === "name"}
                order={sortOrder}
              >
                Name
              </TableHeaderCell>
            </div>

            <div className="col-span-3">
              <TableHeaderCell
                onClick={() => toggleSort("email")}
                active={sortKey === "email"}
                order={sortOrder}
              >
                Email
              </TableHeaderCell>
            </div>

            <div className="col-span-2">
              <TableHeaderCell
                onClick={() => toggleSort("phone")}
                active={sortKey === "phone"}
                order={sortOrder}
              >
                Phone
              </TableHeaderCell>
            </div>

            <div className="col-span-2">
              <TableHeaderCell
                onClick={() => toggleSort("business")}
                active={sortKey === "business"}
                order={sortOrder}
              >
                Business
              </TableHeaderCell>
            </div>

            <div className="col-span-1 text-right">
              <TableHeaderCell
                align="right"
                onClick={() => toggleSort("status")}
                active={sortKey === "status"}
                order={sortOrder}
              >
                Status
              </TableHeaderCell>
            </div>

            <div className="col-span-1 flex justify-end">
              <TableHeaderCell align="right">Action</TableHeaderCell>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#EEF1FA] bg-white">
            {sorted.map((v) => (
              <div
                key={v._id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-[#F9FAFD]"
              >
                {/* Name */}
                <div className="col-span-3 text-xs font-medium text-slate-900">
                  {v.name}
                </div>

                {/* Email */}
                <div className="col-span-3 text-xs text-[#5E6582]">
                  {v.email}
                </div>

                {/* Phone */}
                <div className="col-span-2 text-xs text-[#5E6582]">
                  {v.phoneNumber}
                </div>

                {/* Business */}
                <div className="col-span-2 text-xs text-[#5E6582]">
                  {v.businessName}
                </div>

                {/* Status */}
                <div className="col-span-1 text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      v.status
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    {v.status ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="col-span-1 flex items-center justify-end gap-2">
                  <div className="relative">
                    <button
                      data-menu-button
                      onClick={() =>
                        setMenuOpenId(menuOpenId === v._id ? null : v._id)
                      }
                      className="rounded-full border border-transparent p-1.5 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {menuOpenId === v._id && (
                      <div
                        data-menu-content
                        className="absolute right-0 mt-1 w-36 rounded-md border border-gray-200 bg-white shadow-lg z-50"
                      >
                        <div className="py-1">
                          {/* Edit */}
                          <button
                            onClick={() => startEdit(v._id)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                            disabled={rowActionLoading === v._id}
                          >
                            {rowActionLoading === v._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Pencil className="h-3.5 w-3.5" />
                            )}
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => confirmDelete(v._id)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>

                          {/* Active / Inactive Toggle */}
                          <button
                            onClick={() => {
                              handleVendorStatusChange(v._id, v.status);
                              setMenuOpenId(null);
                            }}
                            disabled={rowActionLoading === v._id}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-sm ${
                              v.status
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {rowActionLoading === v._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : v.status ? (
                              <>
                                <XCircle className="h-4 w-4" />
                                Inactive
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Active
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="px-4 py-6 text-center text-xs text-[#5E6582]">
                No vendors found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
