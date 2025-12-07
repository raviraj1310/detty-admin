"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  getAllCountries,
  getCountryById,
  createCountry,
  updateCountry,
  deleteCountry,
} from "@/services/country/country.service";
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
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] ${
      align === "right" ? "justify-end" : "justify-start"
    } ${active ? "text-[#2D3658]" : "text-[#8A92AC]"} `}
  >
    {children}
    <TbCaretUpDownFilled
      className={`h-3.5 w-3.5 ${active ? "text-[#4F46E5]" : "text-[#CBCFE2]"} ${
        order === "asc" ? "rotate-180" : ""
      }`}
    />
  </button>
);

export default function CountryMaster() {
  const router = useRouter();
  const formSectionRef = useRef(null);
  const nameInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    title: "",
    description: "",
    variant: "success",
  });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [rowActionLoading, setRowActionLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sortKey, setSortKey] = useState("addedOn");
  const [sortOrder, setSortOrder] = useState("desc");

  const normalizeCountry = (d) => ({
    _id: d?._id || d?.id || "",
    name: d?.name || "",
    createdAt: d?.createdAt || d?.updatedAt || "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2)
      errs.name = "Enter a valid country name";
    return errs;
  };

  const fetchCountries = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllCountries();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const normalized = list.map(normalizeCountry);
      setCountries(normalized);
    } catch (e) {
      setError("Failed to load countries");
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
      };
      if (editingId) {
        await updateCountry(editingId, payload);
      } else {
        await createCountry(payload);
      }
      await fetchCountries();
      setFormData({ name: "" });
      setErrors({});
      setEditingId(null);
      setToast({
        open: true,
        title: editingId ? "Country updated" : "Country created",
        description: editingId
          ? "Changes have been saved"
          : "Your country has been added",
        variant: "success",
      });
    } catch (e) {
      setError(
        editingId ? "Failed to update country" : "Failed to create country"
      );
      setToast({
        open: true,
        title: "Error",
        description:
          e?.response?.data?.message ||
          e?.message ||
          (editingId ? "Failed to update country" : "Failed to create country"),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = async (id) => {
    setRowActionLoading(id);
    try {
      const res = await getCountryById(id);
      const country = res?.data || res || {};

      setFormData({
        name: String(country.name || ""),
      });
      setEditingId(id);
      setMenuOpenId(null);
      setErrors({});
      setTimeout(() => {
        formSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        nameInputRef.current?.focus();
      }, 50);
    } catch (e) {
      setError("Failed to load country");
      console.error("Error loading country:", e);
    } finally {
      setRowActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deleteCountry(confirmId);
      await fetchCountries();
      setToast({
        open: true,
        title: "Country deleted",
        description: "The country has been removed",
        variant: "success",
      });
    } catch (e) {
      setError("Failed to delete country");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const filteredCountries = useMemo(() => {
    const base = Array.isArray(countries) ? countries : [];
    const term = String(searchTerm || "")
      .trim()
      .toLowerCase();
    return base.filter((country) =>
      String(country.name || "")
        .toLowerCase()
        .includes(term)
    );
  }, [countries, searchTerm]);

  const getSortValue = (country, key) => {
    if (key === "addedOn") {
      const d = country.createdAt;
      return d
        ? new Date(typeof d === "object" && d.$date ? d.$date : d).getTime()
        : 0;
    }
    if (key === "name") {
      return String(country.name || "").toLowerCase();
    }
    return 0;
  };

  const sortedCountries = useMemo(() => {
    const arr = Array.isArray(filteredCountries) ? [...filteredCountries] : [];
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
  }, [filteredCountries, sortKey, sortOrder]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-7">
      <Toast
        open={toast.open}
        onOpenChange={(v) => setToast((prev) => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position="top-right"
      />
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Country Master
          </h1>
          <p className="text-sm text-[#99A1BC]">Dashboard / Masters</p>
        </div>
      </div>

      {/* Country Details Form */}
      <div className="bg-gray-200 p-4 rounded-xl">
        <div className="rounded-xl border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Country Details
            </h2>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-[#FF5B2C] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
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
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              {/* Country Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Country Name
                </label>
                <input
                  type="text"
                  ref={nameInputRef}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  placeholder="Enter country name"
                />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name}</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Country List */}
      <div className="bg-gray-200 p-4 rounded-xl">
        <div className="rounded-xl border border-[#E1E6F7] bg-white p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Country List
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                />
                <Search className="absolute left-3 h-4 w-4 text-[#A6AEC7]" />
              </div>
            </div>
          </div>

          <div className="overflow-visible rounded-2xl border border-[#E5E8F5]">
            <div className="grid grid-cols-12 gap-6 bg-[#F7F9FD] px-6 py-4">
              <div className="col-span-4">
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
                  onClick={() => toggleSort("name")}
                  active={sortKey === "name"}
                  order={sortOrder}
                >
                  Country Name
                </TableHeaderCell>
              </div>
              <div className="col-span-2">
                <TableHeaderCell align="right">Action</TableHeaderCell>
              </div>
            </div>

            <div className="divide-y divide-[#EEF1FA] bg-white">
              {loading && (
                <div className="px-6 py-5 text-sm text-[#5E6582]">
                  Loading...
                </div>
              )}
              {error && !loading && (
                <div className="px-6 py-5 text-sm text-red-600">{error}</div>
              )}
              {!loading && !error && sortedCountries.length === 0 && (
                <div className="px-6 py-5 text-sm text-[#5E6582]">
                  No countries found
                </div>
              )}
              {!loading &&
                !error &&
                sortedCountries.map((country, idx) => (
                  <div
                    key={country._id || idx}
                    className="grid grid-cols-12 gap-6 px-6 py-5 hover:bg-[#F9FAFD]"
                  >
                    <div className="col-span-4 self-center text-sm text-[#5E6582]">
                      {country.createdAt
                        ? new Date(country.createdAt).toLocaleString(
                            undefined,
                            {
                              weekday: "short",
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "-"}
                    </div>
                    <div className="col-span-6 self-center text-sm font-semibold text-slate-900">
                      {country.name || "-"}
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      <div className="relative">
                        <button
                          data-menu-button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === (country._id || idx)
                                ? null
                                : country._id || idx
                            )
                          }
                          className="rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpenId === (country._id || idx) && (
                          <div
                            data-menu-content
                            className="absolute right-0 mt-2 w-40 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-20"
                          >
                            <button
                              onClick={() => startEdit(country._id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]"
                              disabled={rowActionLoading === country._id}
                            >
                              {rowActionLoading === country._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmId(country._id);
                                setConfirmOpen(true);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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
            <div className="relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-slate-900">
                    Delete this country?
                  </div>
                  <div className="mt-1 text-sm text-[#5E6582]">
                    This action cannot be undone.
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    if (!deleting) {
                      setConfirmOpen(false);
                      setConfirmId(null);
                    }
                  }}
                  className="rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
    </div>
  );
}
