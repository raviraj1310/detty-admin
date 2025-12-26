"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Download,
  MoreVertical,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { RiExpandUpDownFill } from "react-icons/ri";
import { getAllBlogs, deleteBlog } from "@/services/cms/blog.service";
import Toast from "@/components/ui/Toast";

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

export default function BlogMaster() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState("addedOn");
  const [sortDir, setSortDir] = useState("desc");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    title: "",
    description: "",
    variant: "success",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAllBlogs();
        const arr = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        const mapped = arr.map((b) => ({
          id: b?._id || b?.id || b?.slug || Math.random().toString(36).slice(2),
          addedOn: b?.createdAt
            ? new Date(b.createdAt).toLocaleString(undefined, {
                weekday: "short",
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
          createdAtTs: b?.createdAt ? new Date(b.createdAt).getTime() : 0,
          title: b?.title || "-",
          slug: b?.slug || "-",
          image: toImageSrc(b?.image || ""),
          status: Boolean(b?.status ?? true),
        }));
        setBlogs(mapped);
      } catch (e) {
        setError("Failed to load blogs");
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
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

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const base = blogs.filter((b) => {
      const title = String(b.title || "").toLowerCase();
      const slug = String(b.slug || "").toLowerCase();
      const addedOnText = String(b.addedOn || "").toLowerCase();

      // 🔹 Safe ISO format
      let addedOnISO = "";
      if (b.addedOn) {
        const parsed = Date.parse(b.addedOn);
        if (!isNaN(parsed)) {
          addedOnISO = new Date(parsed).toISOString().slice(0, 10); // YYYY-MM-DD
        }
      }

      const q = searchQuery.trim().toLowerCase();

      return (
        title.includes(q) ||
        slug.includes(q) ||
        addedOnText.includes(q) ||
        addedOnISO.includes(q)
      );
    });
    const sorted = [...base].sort((a, b) => {
      let av, bv;
      if (sortField === "addedOn") {
        av = a.createdAtTs || 0;
        bv = b.createdAtTs || 0;
      } else if (sortField === "title") {
        av = String(a.title || "").toLowerCase();
        bv = String(b.title || "").toLowerCase();
      } else if (sortField === "slug") {
        av = String(a.slug || "").toLowerCase();
        bv = String(b.slug || "").toLowerCase();
      } else if (sortField === "status") {
        av = a.status ? 1 : 0;
        bv = b.status ? 1 : 0;
      } else {
        av = 0;
        bv = 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [blogs, searchQuery, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleAddNew = () => {
    router.push("/cms/blog/add");
  };

  const handleEdit = (id) => {
    router.push(`/cms/blog/edit/${encodeURIComponent(id)}`);
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const res = await deleteBlog(confirmId);
      const ok = res?.success !== false;
      if (ok) {
        const res2 = await getAllBlogs();
        const arr2 = Array.isArray(res2?.data)
          ? res2.data
          : Array.isArray(res2)
          ? res2
          : [];
        const mapped2 = arr2.map((b) => ({
          id: b?._id || b?.id || b?.slug || Math.random().toString(36).slice(2),
          addedOn: b?.createdAt
            ? new Date(b.createdAt).toLocaleString(undefined, {
                weekday: "short",
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-",
          createdAtTs: b?.createdAt ? new Date(b.createdAt).getTime() : 0,
          title: b?.title || "-",
          slug: b?.slug || "-",
          image: toImageSrc(b?.image || ""),
          status: Boolean(b?.status ?? true),
        }));
        setBlogs(mapped2);
        setToast({
          open: true,
          title: "Blog deleted",
          description: "The blog has been removed",
          variant: "success",
        });
      }
    } catch (e) {
      setError("Failed to delete blog");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 pt-16 lg:pt-6 bg-white min-h-screen">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blog</h1>
          <p className="text-xs text-gray-500 mt-0.5">Dashboard / CMS</p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          Add New
        </button>
      </div>

      <div className="bg-gray-100 p-3 rounded-xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Blog List</h2>
          </div>

          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or slug"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <SlidersHorizontal className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">Filters</span>
              </button>
              <button className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Download className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 capitalize tracking-wider">
                    <button
                      onClick={() => toggleSort("addedOn")}
                      className="flex items-center gap-1.5"
                    >
                      Added On
                      <RiExpandUpDownFill
                        className={`w-3.5 h-3.5 ${
                          sortField === "addedOn" && sortDir === "asc"
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                      <span className="text-gray-400">
                        {sortField === "addedOn"
                          ? sortDir === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </span>
                    </button>
                  </th>

                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 capitalize tracking-wider">
                    Image
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 capitalize tracking-wider">
                    <button
                      onClick={() => toggleSort("title")}
                      className="flex items-center gap-1.5"
                    >
                      Title
                      <RiExpandUpDownFill
                        className={`w-3.5 h-3.5 ${
                          sortField === "title" && sortDir === "asc"
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                      <span className="text-gray-400">
                        {sortField === "title"
                          ? sortDir === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </span>
                    </button>
                  </th>

                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 capitalize tracking-wider">
                    <button
                      onClick={() => toggleSort("status")}
                      className="flex items-center gap-1.5"
                    >
                      Status
                      <RiExpandUpDownFill
                        className={`w-3.5 h-3.5 ${
                          sortField === "status" && sortDir === "asc"
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                      <span className="text-gray-400">
                        {sortField === "status"
                          ? sortDir === "asc"
                            ? "↑"
                            : "↓"
                          : ""}
                      </span>
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 capitalize tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td
                      className="px-4 py-3 text-sm text-[#5E6582]"
                      colSpan={6}
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {error && !loading && (
                  <tr>
                    <td className="px-4 py-3 text-sm text-red-600" colSpan={6}>
                      {error}
                    </td>
                  </tr>
                )}
                {!loading &&
                  !error &&
                  filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {b.addedOn}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {b.image && b.image.trim() ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E5E6EF] bg-white flex-shrink-0 flex items-center justify-center">
                            <img
                              src={b.image}
                              alt={b.title || "Blog image"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No image
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-normal break-words">
                        {b.title}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-white text-gray-600 border border-gray-300">
                          {b.status ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                          )}
                          {b.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm relative">
                        <button
                          data-menu-button
                          onClick={() =>
                            setMenuOpenId((prev) =>
                              prev === b.id ? null : b.id
                            )
                          }
                          className="text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpenId === b.id && (
                          <div
                            data-menu-content
                            className="absolute right-4 mt-1 z-10 w-32 rounded-lg border border-[#E5E8F6] bg-white p-1 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]"
                          >
                            <button
                              onClick={() => {
                                handleEdit(b.id);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-sm text-[#2D3658] hover:bg-[#F6F7FD] rounded"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmId(b.id);
                                setConfirmOpen(true);
                                setMenuOpenId(null);
                              }}
                              className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Toast
        open={toast.open}
        onOpenChange={(v) => setToast((prev) => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position="top-right"
      />
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
                  Delete this blog?
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
  );
}
