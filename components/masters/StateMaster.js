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
  getAllStates,
  getStateById,
  createState,
  updateState,
  deleteState,
} from "@/services/state/state.service";
import { getAllCountries } from "@/services/country/country.service";
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

export default function StateMaster() {
  const router = useRouter();
  const formSectionRef = useRef(null);
  const nameInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    countryId: "",
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
  const [states, setStates] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [error, setError] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [rowActionLoading, setRowActionLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sortKey, setSortKey] = useState("addedOn");
  const [sortOrder, setSortOrder] = useState("desc");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const countryDropdownRef = useRef(null);

  const normalizeState = (d) => {
    // Handle countryId as object or string
    const countryIdObj = d?.countryId;
    const countryIdValue =
      typeof countryIdObj === "object" && countryIdObj !== null
        ? countryIdObj._id || countryIdObj.id || ""
        : d?.countryId || d?.country?._id || d?.country?.id || "";

    const countryNameValue =
      typeof countryIdObj === "object" && countryIdObj !== null
        ? countryIdObj.name || ""
        : d?.country?.name || "";

    return {
      _id: d?._id || d?.id || "",
      name: d?.name || "",
      countryId: countryIdValue,
      countryName: countryNameValue,
      createdAt: d?.createdAt || d?.updatedAt || "",
    };
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name || formData.name.trim().length < 2)
      errs.name = "Enter a valid state name";
    if (!formData.countryId || formData.countryId.trim() === "")
      errs.countryId = "Select a country";
    return errs;
  };

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const res = await getAllCountries();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setCountries(list);
    } catch (e) {
      console.error("Failed to load countries", e);
    } finally {
      setLoadingCountries(false);
    }
  };

  const fetchStates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllStates();
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const normalized = list.map(normalizeState);
      setStates(normalized);
    } catch (e) {
      setError("Failed to load states");
      setStates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
    fetchStates();
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

      if (
        countryDropdownOpen &&
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setCountryDropdownOpen(false);
        setCountrySearchTerm("");
      }
    };

    if (menuOpenId !== null || countryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenId, countryDropdownOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        countryId: formData.countryId,
      };
      if (editingId) {
        await updateState(editingId, payload);
      } else {
        await createState(payload);
      }
      await fetchStates();
      setFormData({ name: "", countryId: "" });
      setErrors({});
      setEditingId(null);
      setCountryDropdownOpen(false);
      setCountrySearchTerm("");
      setToast({
        open: true,
        title: editingId ? "State updated" : "State created",
        description: editingId
          ? "Changes have been saved"
          : "Your state has been added",
        variant: "success",
      });
    } catch (e) {
      setError(editingId ? "Failed to update state" : "Failed to create state");
      setToast({
        open: true,
        title: "Error",
        description:
          e?.response?.data?.message ||
          e?.message ||
          (editingId ? "Failed to update state" : "Failed to create state"),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = async (id) => {
    setRowActionLoading(id);
    try {
      const res = await getStateById(id);
      const state = res?.data || res || {};

      console.log("State data received:", state); // Debug log

      // Handle countryId as object or string
      const countryIdObj = state.countryId;
      let countryIdValue = "";

      if (typeof countryIdObj === "object" && countryIdObj !== null) {
        countryIdValue = String(countryIdObj._id || countryIdObj.id || "");
      } else if (state.countryId) {
        countryIdValue = String(state.countryId);
      } else if (state.country) {
        countryIdValue = String(state.country._id || state.country.id || "");
      }

      console.log("Extracted countryId:", countryIdValue); // Debug log
      console.log("Extracted name:", state.name); // Debug log

      setFormData({
        name: String(state.name || ""),
        countryId: countryIdValue,
      });

      console.log("Form data set:", {
        name: String(state.name || ""),
        countryId: countryIdValue,
      }); // Debug log

      setEditingId(id);
      setMenuOpenId(null);
      setCountryDropdownOpen(false);
      setCountrySearchTerm("");
      setErrors({});
      setTimeout(() => {
        formSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        nameInputRef.current?.focus();
      }, 50);
    } catch (e) {
      setError("Failed to load state");
      console.error("Error loading state:", e);
    } finally {
      setRowActionLoading(null);
    }
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deleteState(confirmId);
      await fetchStates();
      setToast({
        open: true,
        title: "State deleted",
        description: "The state has been removed",
        variant: "success",
      });
    } catch (e) {
      setError("Failed to delete state");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const filteredStates = useMemo(() => {
    const base = Array.isArray(states) ? states : [];
    const term = String(searchTerm || "")
      .trim()
      .toLowerCase();
    return base.filter(
      (state) =>
        String(state.name || "")
          .toLowerCase()
          .includes(term) ||
        String(state.countryName || "")
          .toLowerCase()
          .includes(term)
    );
  }, [states, searchTerm]);

  const getSortValue = (state, key) => {
    if (key === "addedOn") {
      const d = state.createdAt;
      return d
        ? new Date(typeof d === "object" && d.$date ? d.$date : d).getTime()
        : 0;
    }
    if (key === "name") {
      return String(state.name || "").toLowerCase();
    }
    if (key === "country") {
      return String(state.countryName || "").toLowerCase();
    }
    return 0;
  };

  const sortedStates = useMemo(() => {
    const arr = Array.isArray(filteredStates) ? [...filteredStates] : [];
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
  }, [filteredStates, sortKey, sortOrder]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const filteredCountries = useMemo(() => {
    const term = String(countrySearchTerm || "")
      .trim()
      .toLowerCase();
    if (!term) return countries;
    return countries.filter((country) =>
      String(country.name || "")
        .toLowerCase()
        .includes(term)
    );
  }, [countries, countrySearchTerm]);

  const selectedCountry = countries.find(
    (c) => String(c._id || c.id) === String(formData.countryId || "")
  );

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
            State Master
          </h1>
          <p className="text-sm text-[#99A1BC]">Dashboard / Masters</p>
        </div>
      </div>

      {/* State Details Form */}
      <div className="bg-gray-200 p-4 rounded-xl">
        <div className="rounded-xl border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              State Details
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Country
                </label>
                <div className="relative" ref={countryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setCountryDropdownOpen(!countryDropdownOpen);
                      setCountrySearchTerm("");
                    }}
                    disabled={loadingCountries}
                    className={`w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 pr-10 text-left text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4] ${
                      loadingCountries ? "opacity-60 cursor-not-allowed" : ""
                    } ${errors.countryId ? "border-red-500" : ""}`}
                  >
                    <span className={selectedCountry ? "" : "text-[#B0B7D0]"}>
                      {selectedCountry
                        ? selectedCountry.name
                        : "Select a country"}
                    </span>
                  </button>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className={`w-4 h-4 text-[#99A1BC] transition-transform ${
                        countryDropdownOpen ? "rotate-180" : ""
                      }`}
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

                  {countryDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-[#E5E6EF] rounded-xl shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] max-h-60 overflow-hidden">
                      <div className="p-2 border-b border-[#E5E6EF]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A6AEC7]" />
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={countrySearchTerm}
                            onChange={(e) =>
                              setCountrySearchTerm(e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#E5E6EF] bg-[#F8F9FC] text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCountries.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-[#5E6582] text-center">
                            No countries found
                          </div>
                        ) : (
                          filteredCountries.map((country) => (
                            <button
                              key={country._id || country.id}
                              type="button"
                              onClick={() => {
                                handleInputChange(
                                  "countryId",
                                  country._id || country.id
                                );
                                setCountryDropdownOpen(false);
                                setCountrySearchTerm("");
                                setErrors((prev) => ({
                                  ...prev,
                                  countryId: "",
                                }));
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F6F7FD] transition-colors ${
                                String(formData.countryId || "") ===
                                String(country._id || country.id || "")
                                  ? "bg-[#F6F7FD] text-[#2D3658] font-medium"
                                  : "text-slate-700"
                              }`}
                            >
                              {country.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {errors.countryId && (
                  <p className="text-xs text-red-600">{errors.countryId}</p>
                )}
              </div>

              {/* State Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  State Name
                </label>
                <input
                  type="text"
                  ref={nameInputRef}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  placeholder="Enter state name"
                />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name}</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* State List */}
      <div className="bg-gray-200 p-4 rounded-xl">
        <div className="rounded-xl border border-[#E1E6F7] bg-white p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">State List</h2>
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
              <div className="col-span-3">
                <TableHeaderCell
                  onClick={() => toggleSort("addedOn")}
                  active={sortKey === "addedOn"}
                  order={sortOrder}
                >
                  Added On
                </TableHeaderCell>
              </div>
              <div className="col-span-4">
                <TableHeaderCell
                  onClick={() => toggleSort("country")}
                  active={sortKey === "country"}
                  order={sortOrder}
                >
                  Country
                </TableHeaderCell>
              </div>
              <div className="col-span-3">
                <TableHeaderCell
                  onClick={() => toggleSort("name")}
                  active={sortKey === "name"}
                  order={sortOrder}
                >
                  State Name
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
              {!loading && !error && sortedStates.length === 0 && (
                <div className="px-6 py-5 text-sm text-[#5E6582]">
                  No states found
                </div>
              )}
              {!loading &&
                !error &&
                sortedStates.map((state, idx) => (
                  <div
                    key={state._id || idx}
                    className="grid grid-cols-12 gap-6 px-6 py-5 hover:bg-[#F9FAFD]"
                  >
                    <div className="col-span-3 self-center text-sm text-[#5E6582]">
                      {state.createdAt
                        ? new Date(state.createdAt).toLocaleString(undefined, {
                            weekday: "short",
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </div>
                    <div className="col-span-4 self-center text-sm text-[#5E6582]">
                      {state.countryName || "-"}
                    </div>
                    <div className="col-span-3 self-center text-sm font-semibold text-slate-900">
                      {state.name || "-"}
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      <div className="relative">
                        <button
                          data-menu-button
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === (state._id || idx)
                                ? null
                                : state._id || idx
                            )
                          }
                          className="rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuOpenId === (state._id || idx) && (
                          <div
                            data-menu-content
                            className="absolute right-0 mt-2 w-40 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-20"
                          >
                            <button
                              onClick={() => startEdit(state._id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]"
                              disabled={rowActionLoading === state._id}
                            >
                              {rowActionLoading === state._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmId(state._id);
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
                    Delete this state?
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
