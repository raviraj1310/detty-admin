"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Check } from "lucide-react";
import {
  getRequests,
  deleteApproval,
} from "@/services/account-deletion/account-delete.service";

const mapRow = (d) => {
  const u = d?.userId || {};
  return {
    id: d?._id || d?.id || Math.random().toString(36).slice(2),
    name: u?.name || "-",
    email: u?.email || "-",
    status: d?.status || "Pending",
    createdAt: d?.createdAt || "",
  };
};

export default function RequestDeactivation() {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState("");
  const [limit, setLimit] = useState(50);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);

  
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getRequests(page, limit)
        const d = res?.data || res || {}
        const list = Array.isArray(d?.requests)
          ? d.requests
          : Array.isArray(d?.data)
          ? d.data
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : []
        setItems(list.map(mapRow))
        setTotalPages(d?.totalPages || 0)
        setTotalItems(d?.totalRequests || d?.total || list.length)
      } catch (e) {
        setError('Failed to load requests')
        setItems([])
        setTotalPages(0)
        setTotalItems(0)
      } finally {
        setLoading(false);
      }
    }
    load()
  }, [page, limit])

  const filtered = useMemo(() => {
    const term = String(searchTerm || "")
      .trim()
      .toLowerCase();
    if (!term) return items;
    return items.filter((r) => {
      const txt = `${r.name} ${r.email} ${r.status}`.toLowerCase();
      return txt.includes(term);
    });
  }, [items, searchTerm]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, page, limit]);

  useEffect(() => {
    const totalPages = Math.ceil(filtered.length / limit) || 1;
    setPageCount(totalPages);

    if (page > totalPages) {
      setPage(1);
    }
  }, [filtered.length, limit]);

  const approve = async (id) => {
    try {
      setApprovingId(String(id));
      await deleteApproval(id);
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "Approved" } : r))
      );
    } catch (e) {
    } finally {
      setApprovingId("");
    }
  };

  return (
    <div className="rounded-[30px] border border-[#E1E6F7] bg-white p-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Request Deactivation
        </h2>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] pl-10 pr-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
          />
          <Search className="absolute left-3 h-4 w-4 text-[#A6AEC7]" />
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

      <div className="overflow-visible rounded-xl border border-[#E5E8F5]">
        <div className="grid grid-cols-[1.5fr_2fr_1.2fr_1fr] gap-2 bg-[#F7F9FD] px-4 py-2.5">
          <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
            Name
          </div>
          <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
            Email
          </div>
          <div className="text-xs font-medium capitalize tracking-wider text-gray-500">
            Status
          </div>
          <div className="text-right text-xs font-medium capitalize tracking-wider text-gray-500">
            Action
          </div>
        </div>
        <div className="divide-y divide-[#EEF1FA] bg-white">
          {loading && (
            <div className="px-4 py-3 text-sm text-[#5E6582]">Loading...</div>
          )}
          {error && !loading && (
            <div className="px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-[#5E6582]">
              No requests found
            </div>
          )}
          {!loading &&
            !error &&
            paginatedBookings?.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.5fr_2fr_1.2fr_1fr] items-center gap-2 px-4 py-3"
              >
                <div className="text-sm font-medium text-slate-900">
                  {row.name}
                </div>
                <div className="text-sm text-[#5E6582]">{row.email}</div>
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => approve(row.id)}
                    disabled={
                      row.status === "Approved" ||
                      approvingId === String(row.id)
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-3 py-1.5 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD] disabled:opacity-50"
                  >
                    <Check className="h-4 w-4 text-[#8B93AF]" />
                    {approvingId === String(row.id)
                      ? "Approving..."
                      : "Approve"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className='flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm'>
        <div className='flex flex-1 justify-between sm:hidden'>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className='relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className='relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'
          >
            Next
          </button>
        </div>
        <div className='hidden sm:flex sm:flex-1 sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm text-gray-700'>
              Showing{' '}
              <span className='font-medium'>{(page - 1) * limit + 1}</span> to{' '}
              <span className='font-medium'>
                {Math.min(page * limit, totalItems)}
              </span>{' '}
              of <span className='font-medium'>{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav
              className='isolate inline-flex -space-x-px rounded-md shadow-sm'
              aria-label='Pagination'
            >
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className='relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
              >
                <span className='sr-only'>Previous</span>
                <svg
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path
                    fillRule='evenodd'
                    d='M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  p =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1)
                )
                .map((p, i, arr) => {
                  if (i > 0 && arr[i - 1] !== p - 1) {
                    return (
                      <span
                        key={`ellipsis-${p}`}
                        className='relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0'
                      >
                        ...
                      </span>
                    )
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      aria-current={page === p ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        page === p
                          ? 'bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className='relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50'
              >
                <span className='sr-only'>Next</span>
                <svg
                  className='h-5 w-5'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path
                    fillRule='evenodd'
                    d='M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
