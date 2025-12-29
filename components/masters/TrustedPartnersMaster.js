"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MoreVertical,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { TbCaretUpDownFilled } from "react-icons/tb";
import {
  addPartner,
  getPartner,
  updatePartner,
  deletePartner,
  updatePartnerStatus,
} from "../../services/partner/partner.service";
import Toast from "@/components/ui/Toast";

const PARTNER_IMAGE_BASE_URL = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN;

const buildPartnerImageUrl = (imagePath) => {
  if (!imagePath) return "/images/partners/master-1.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://"))
    return imagePath;
  const normalizedPath = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;
  return `${PARTNER_IMAGE_BASE_URL}${normalizedPath}`;
};

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

export default function TrustedPartnersMaster() {
  const formId = "trusted-partner-form";
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const isMountedRef = useRef(true);
  const [formData, setFormData] = useState({
    name: "",
    uploadImage: "",
    status: "Active",
    imageFile: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [rowActionLoading, setRowActionLoading] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [partners, setPartners] = useState([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [partnersError, setPartnersError] = useState("");
  const [sortKey, setSortKey] = useState("addedOn");
  const [sortOrder, setSortOrder] = useState("desc");
  const dropdownRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const formSectionRef = useRef(null);
  const nameInputRef = useRef(null);
  const [toast, setToast] = useState({
    open: false,
    title: "",
    description: "",
    variant: "success",
  });

  const fetchPartners = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoadingPartners(true);
    setPartnersError("");
    try {
      const response = await getPartner();
      if (!isMountedRef.current) return;
      const normalizedPartners = (response?.data ?? []).map((partner) => ({
        id: partner._id,
        createdAtRaw: partner.createdAt || "",
        addedOn: partner.createdAt
          ? new Date(partner.createdAt).toLocaleString(undefined, {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "NA",
        partnerLogo: buildPartnerImageUrl(partner.image),
        partnerName: partner.name || "NA",
        description: partner.name || "NA",
        status: !!partner.status,
        statusBool: !!partner.status,
        statusClass: partner.status
          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
          : "bg-red-50 text-red-600 border border-red-200",
      }));
      setPartners(normalizedPartners);
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Failed to load partners:", error);
      setPartnersError("Unable to load partners. Please try again.");
    } finally {
      if (isMountedRef.current) setIsLoadingPartners(false);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchPartners();
    return () => {
      isMountedRef.current = false;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [fetchPartners]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setMenuOpenId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateImagePreview = (file) => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (file) {
      const preview = URL.createObjectURL(file);
      previewUrlRef.current = preview;
      setImagePreview(preview);
    } else setImagePreview(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setFormData((prev) => ({
      ...prev,
      imageFile: file || null,
      uploadImage: file?.name || "",
    }));
    updateImagePreview(file || null);
    setFormErrors((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.imageFile && !editingId) errors.image = "Image is required";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setIsSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("status", formData.status === "Active");
      if (formData.imageFile) payload.append("image", formData.imageFile);
      if (editingId) await updatePartner(editingId, payload);
      else await addPartner(payload);
      setFormData({
        name: "",
        uploadImage: "",
        status: "Active",
        imageFile: null,
      });
      updateImagePreview(null);
      await fetchPartners();
    } catch (error) {
      console.error("Failed to create partner:", error);
      setPartnersError(
        error?.response?.data?.message ||
          "Unable to create partner. Please try again."
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsSubmitting(false);
      setEditingId(null);
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const filteredTrustedPartners = useMemo(() => {
    const term = String(searchTerm || "")
      .trim()
      .toLowerCase();
    const digits = term.replace(/[^0-9]/g, "");
    return (partners || []).filter((partner) => {
      const name = String(partner.partnerName || "").toLowerCase();
      const desc = String(partner.description || "").toLowerCase();
      const dateStr = String(partner.addedOn || "").toLowerCase();
      const dateDigits = dateStr.replace(/[^0-9]/g, "");
      const matchText = !term
        ? true
        : name.includes(term) || desc.includes(term) || dateStr.includes(term);
      const matchDigits = digits && dateDigits.includes(digits);
      return matchText || matchDigits;
    });
  }, [partners, searchTerm]);

  const getSortValue = (p, key) => {
    if (key === "addedOn") {
      const d = p.createdAtRaw;
      return d ? new Date(d).getTime() : 0;
    }
    if (key === "partnerName") return String(p.partnerName || "").toLowerCase();
    if (key === "status") return p.statusBool ? 1 : 0;
    return 0;
  };

  const sortedTrustedPartners = useMemo(() => {
    const arr = Array.isArray(filteredTrustedPartners)
      ? [...filteredTrustedPartners]
      : [];
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
  }, [filteredTrustedPartners, sortKey, sortOrder]);

  const toggleSort = (key) => {
    if (sortKey === key)
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const startEdit = async (id) => {
    setRowActionLoading(id);
    try {
      const p = partners.find((x) => String(x.id) === String(id));
      if (p) {
        const appendCacheBuster = (url, token) => {
          if (!url) return "";
          const sep = url.includes("?") ? "&" : "?";
          return url + sep + "t=" + token;
        };
        const ts = p.createdAtRaw
          ? new Date(p.createdAtRaw).getTime()
          : Date.now();
        setFormData({
          name: String(p.partnerName || ""),
          uploadImage: String(p.partnerLogo || ""),
          status: p.status === "Active" ? "Active" : "Inactive",
          imageFile: null,
        });
        setImagePreview(appendCacheBuster(String(p.partnerLogo || ""), ts));
        setEditingId(id);
        setMenuOpenId(null);
        setTimeout(() => {
          formSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          nameInputRef.current?.focus();
        }, 50);
      }
    } finally {
      setRowActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deletePartner(confirmId);
      await fetchPartners();
    } catch {
      setPartnersError("Failed to delete partner");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const handlePartnerStatusChange = async (id, currentStatus) => {
    setRowActionLoading(id);
    try {
      const newStatus = !currentStatus;

      await updatePartnerStatus(id, newStatus);

      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );

      setToast({
        open: true,
        title: "Status Updated",
        description: `Partner marked as ${newStatus ? "active" : "inactive"}`,
        variant: "success",
      });
    } catch (error) {
      setToast({
        open: true,
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to update partner status",
        variant: "destructive",
      });
    } finally {
      setRowActionLoading(null);
      setMenuOpenId(null);
    }
  };

  return (
    <div className="space-y-5 py-2 px-2">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-slate-900">
            Trusted Partners Master
          </h1>
          <p className="text-xs text-[#99A1BC]">Dashboard / Masters</p>
        </div>
      </div>

      <div className="bg-gray-100 rounded-xl p-2">
        <div className="rounded-xl border border-[#E1E6F7] bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Trusted Partners Details
            </h2>
            <button
              type="submit"
              form={formId}
              disabled={isSubmitting}
              className="rounded-xl bg-[#FF5B2C] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>

          <form id={formId} onSubmit={handleSubmit} ref={formSectionRef}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  ref={nameInputRef}
                  className="w-full h-9 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 text-xs text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  placeholder="Enter partner name"
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Upload Image*
                </label>
                <div
                  className="flex h-9 items-stretch overflow-hidden rounded-lg border border-[#E5E6EF]"
                  onClick={handleBrowse}
                >
                  <div className="flex-1 bg-[#F8F9FC] px-3 text-xs text-slate-700 flex items-center cursor-pointer">
                    <span className="truncate" title={formData.uploadImage}>
                      {formData.uploadImage || "Image.jpg"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBrowse}
                    className="px-3 text-xs font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]"
                  >
                    Browse
                  </button>
                </div>
                <input
                  id="partner-image-upload"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                {(imagePreview || formData.uploadImage) && (
                  <div className="rounded-lg border border-dashed border-[#E5E6EF] bg-[#F8F9FC] p-2">
                    <p className="text-[10px] font-medium text-[#5E6582] mb-1">
                      Preview
                    </p>
                    <div className="h-12 w-12 overflow-hidden rounded-lg border border-[#E5E6EF] bg-white">
                      <img
                        src={
                          imagePreview ||
                          buildPartnerImageUrl(formData.uploadImage)
                        }
                        alt="Selected partner"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {formErrors.image && (
                  <p className="text-xs text-red-500">{formErrors.image}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    className="w-full h-9 appearance-none rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] px-3 pr-8 text-xs text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg
                      className="w-3.5 h-3.5 text-[#99A1BC]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-gray-100 rounded-xl p-2">
        <div className="rounded-xl border border-[#E1E6F7] bg-white p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Trusted Partners
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
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E5E8F5]">
            <div className="grid grid-cols-12 gap-4 bg-[#F7F9FD] px-4 py-3">
              <div className="col-span-3">
                <TableHeaderCell
                  onClick={() => toggleSort("addedOn")}
                  active={sortKey === "addedOn"}
                  order={sortOrder}
                >
                  Added On
                </TableHeaderCell>
              </div>
              <div className="col-span-6">
                <TableHeaderCell
                  onClick={() => toggleSort("partnerName")}
                  active={sortKey === "partnerName"}
                  order={sortOrder}
                >
                  Trusted Partners
                </TableHeaderCell>
              </div>
              <div className="col-span-2">
                <TableHeaderCell
                  align="right"
                  onClick={() => toggleSort("status")}
                  active={sortKey === "status"}
                  order={sortOrder}
                >
                  Status
                </TableHeaderCell>
              </div>
              <div className="col-span-1">
                <TableHeaderCell align="right"></TableHeaderCell>
              </div>
            </div>

            <div className="divide-y divide-[#EEF1FA] bg-white">
              {isLoadingPartners && (
                <div className="px-4 py-4 text-center text-xs text-[#5E6582]">
                  Loading partners...
                </div>
              )}
              {!isLoadingPartners && partnersError && (
                <div className="px-4 py-4 text-center text-xs text-red-600">
                  {partnersError}
                </div>
              )}
              {!isLoadingPartners &&
                !partnersError &&
                filteredTrustedPartners.length === 0 && (
                  <div className="px-4 py-4 text-center text-xs text-[#5E6582]">
                    No partners found.
                  </div>
                )}

              {!isLoadingPartners &&
                !partnersError &&
                sortedTrustedPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#F9FAFD]"
                  >
                    <div className="col-span-3 self-center text-xs text-[#5E6582] whitespace-nowrap">
                      {partner.addedOn}
                    </div>
                    <div className="col-span-6 flex items-center gap-2 self-center">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E5E6EF] bg-white shrink-0 flex items-center justify-center">
                        <img
                          src={partner.partnerLogo}
                          alt={partner.partnerName}
                          className="w-full h-full object-contain p-0.5"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#2D3658] uppercase">
                          {partner.partnerName}
                        </span>
                        <span className="text-[10px] text-[#8A92AC]">
                          {partner.description}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 self-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${partner.statusClass}`}
                      >
                        {partner.status ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            if (menuOpenId === partner.id) setMenuOpenId(null);
                            else {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setMenuPos({
                                top: Math.round(rect.bottom + 6),
                                left: Math.round(rect.right - 128),
                              });
                              setMenuOpenId(partner.id);
                            }
                          }}
                          className="rounded-full border border-transparent p-1.5 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpenId === partner.id && (
                          <div
                            ref={dropdownRef}
                            className="fixed w-32 rounded-md border border-[#E5E8F6] bg-white shadow-lg z-50"
                            style={{ top: menuPos.top, left: menuPos.left }}
                          >
                            <button
                              onClick={() => startEdit(partner.id)}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#2D3658] hover:bg-[#F6F7FD]"
                              disabled={rowActionLoading === partner.id}
                            >
                              {rowActionLoading === partner.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Pencil className="h-3.5 w-3.5" />
                              )}
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmId(partner.id);
                                setConfirmOpen(true);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>

                            {/* Status Toggle */}
                            <button
                              onClick={() =>
                                handlePartnerStatusChange(
                                  partner.id,
                                  partner.status
                                )
                              }
                              disabled={rowActionLoading === partner.id}
                              className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs ${
                                partner.status
                                  ? "text-red-600 hover:bg-red-50"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                            >
                              {rowActionLoading === partner.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : partner.status ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5" />
                                  Inactive
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Active
                                </>
                              )}
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
                  Delete this partner?
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
