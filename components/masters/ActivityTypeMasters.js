'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Download,
  MoreVertical,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { IoFilterSharp } from "react-icons/io5";
import { TbCaretUpDownFilled } from "react-icons/tb";
import { getAllActivityTypes, createActivityType, updateActivityType, deleteActivityType } from '@/services/places-to-visit/activityType.service';
import Toast from '@/components/ui/Toast'


const TableHeaderCell = ({ children, align = 'left', onClick, active = false, order = 'desc' }) => (
  <button
    type='button'
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-medium uppercase tracking-[0.12em] ${align === 'right' ? 'justify-end' : 'justify-start'} ${active ? 'text-[#2D3658]' : 'text-[#8A92AC]'}`}
  >
    {children}
    <TbCaretUpDownFilled className={`h-3.5 w-3.5 ${active ? 'text-[#4F46E5]' : 'text-[#CBCFE2]'} ${order === 'asc' ? 'rotate-180' : ''}`} />
  </button>
);

export default function ActivityTypeMasters() {
  const router = useRouter();
  const formSectionRef = useRef(null);
  const nameInputRef = useRef(null);
  const [formData, setFormData] = useState({
    activityTypeName: '',
    activityFor: '',
    title: '',
    description: '',
    status: 'Active'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' });
  const [activityTypes, setActivityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [rowActionLoading, setRowActionLoading] = useState(null);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [sortKey, setSortKey] = useState('addedOn');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.activityTypeName || formData.activityTypeName.trim().length < 2) errs.activityTypeName = 'Enter a valid activity type';
    if (!formData.status) errs.status = 'Select status';
    return errs;
  };

  const fetchActivityTypes = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter === 'Active') params.status = true;
      if (statusFilter === 'Inactive') params.status = false;
      const res = await getAllActivityTypes(params);
      const list = Array.isArray(res?.data) ? res.data : [];
      setActivityTypes(list);
    } catch (e) {
      setError('Failed to load activity types');
      setActivityTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivityTypes(); }, []);
  useEffect(() => { fetchActivityTypes(); }, [statusFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenId !== null) {
        const target = event.target;
        const isMenuButton = target.closest('button[data-menu-button]');
        const isMenuContent = target.closest('[data-menu-content]');
        
        if (!isMenuButton && !isMenuContent) {
          setMenuOpenId(null);
        }
      }
    };

    if (menuOpenId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;
    setSubmitting(true);
    try {
      const payload = {
        activityTypeName: formData.activityTypeName.trim(),
        activityFor: String(formData.activityFor || '').trim(),
        title: String(formData.title || '').trim(),
        description: String(formData.description || '').trim()
      };
      if (editingTypeId) {
        const res = await updateActivityType(editingTypeId, payload);
        if (res?.success) {
          setToast({ open: true, title: 'Activity type updated', description: formData.activityTypeName, variant: 'success' });
          setEditingTypeId(null);
        }
      } else {
        const res = await createActivityType(payload);
        if (res?.success) {
          setToast({ open: true, title: 'Activity type added', description: formData.activityTypeName, variant: 'success' });
        }
      }
      setFormData({ activityTypeName: '', activityFor: '', title: '', description: '', status: 'Active' });
      await fetchActivityTypes();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Failed to save activity type');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item) => {
    setFormData({
      activityTypeName: item.activityTypeName || '',
      activityFor: item.activityFor || '',
      title: item.title || '',
      description: item.description || '',
      status: item.status ? 'Active' : 'Inactive'
    });
    setEditingTypeId(item._id);
    setMenuOpenId(null);
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nameInputRef.current?.focus();
    }, 50);
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const res = await deleteActivityType(confirmId);
      if (res?.success) {
        await fetchActivityTypes();
        setToast({ open: true, title: 'Activity type deleted', description: 'Removed successfully', variant: 'success' });
      }
    } catch (e) {
      setError('Failed to delete activity type');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmId(null);
    }
  };

  const filteredActivityTypes = useMemo(() => {
    const base = Array.isArray(activityTypes) ? activityTypes : [];
    const term = String(searchTerm || '').trim().toLowerCase();
    const termDigits = term.replace(/[^0-9]/g, '');
    const formatAdded = d => {
      if (!d) return '';
      const date = new Date(typeof d === 'object' && d.$date ? d.$date : d);
      return date.toLocaleString(undefined, {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    return base.filter(a => {
      const name = String(a.activityTypeName || '').toLowerCase();
      const addedStr = String(formatAdded(a.createdAt || a.updatedAt) || '').toLowerCase();
      const addedDigits = addedStr.replace(/[^0-9]/g, '');
      const matchesText = !term ? true : (name.includes(term) || addedStr.includes(term));
      const matchesDigits = termDigits && addedDigits.includes(termDigits);
      return matchesText || matchesDigits;
    });
  }, [activityTypes, searchTerm]);

  const getSortValue = (a, key) => {
    if (key === 'addedOn') {
      const d = a.createdAt || a.updatedAt;
      return d ? new Date(typeof d === 'object' && d.$date ? d.$date : d).getTime() : 0;
    }
    if (key === 'activityTypeName') {
      return String(a.activityTypeName || '').toLowerCase();
    }
    if (key === 'status') {
      return a.status ? 1 : 0;
    }
    return 0;
  };

  const sortedActivityTypes = useMemo(() => {
    const arr = Array.isArray(filteredActivityTypes) ? [...filteredActivityTypes] : [];
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortOrder === 'asc' ? (va - vb) : (vb - va);
    });
    return arr;
  }, [filteredActivityTypes, sortKey, sortOrder]);

  const toggleSort = key => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Activity Type Masters</h1>
          <p className="text-sm text-[#99A1BC]">
            Dashboard / Masters
          </p>
        </div>
      </div>

      <Toast
        open={toast.open}
        onOpenChange={(v) => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position='top-right'
      />

      <div className="rounded-[30px] border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Activity Type Details</h2>
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-[#FF5B2C] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {editingTypeId ? 'Updating...' : 'Adding...'}
              </span>
            ) : editingTypeId ? (
              'Update'
            ) : (
              'Add'
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} ref={formSectionRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Activity Type Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Activity Types Name
              </label>
              <input
                type="text"
                value={formData.activityTypeName}
                onChange={(e) => handleInputChange('activityTypeName', e.target.value)}
                ref={nameInputRef}
                className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                placeholder="Enter activity type name"
              />
              {errors.activityTypeName && (
                <p className="text-xs text-red-600">{errors.activityTypeName}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Status
              </label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full h-12 appearance-none rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 pr-10 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-[#99A1BC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {errors.status && (
                  <p className="text-xs text-red-600">{errors.status}</p>
                )}
              </div>
            </div>

            {/* Activity For */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Activity Label</label>
              <input
                type="text"
                value={formData.activityFor}
                onChange={(e) => handleInputChange('activityFor', e.target.value)}
                className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                placeholder="Enter activity audience"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                placeholder="Enter title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 py-3 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                placeholder="Enter description"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Activity Type List */}
      <div className="rounded-[30px] border border-[#E1E6F7] bg-white p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Activity Type List</h2>
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
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm text-slate-700"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            {/* <button className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]">
              <IoFilterSharp className="h-4 w-4 text-[#8B93AF]" />
              Filters
            </button>
            <button className="flex h-10 items-center gap-2 rounded-xl border border-[#E5E6EF] bg-white px-4 text-sm font-medium text-[#2D3658] transition hover:bg-[#F6F7FD]">
              <Download className="h-4 w-4 text-[#8B93AF]" />
            </button> */}
          </div>
        </div>

        <div className="overflow-visible rounded-2xl border border-[#E5E8F5]">
          <div className="grid grid-cols-12 gap-6 bg-[#F7F9FD] px-6 py-4">
            <div className="col-span-4">
              <TableHeaderCell onClick={() => toggleSort('addedOn')} active={sortKey === 'addedOn'} order={sortOrder}>Added On</TableHeaderCell>
            </div>
            <div className="col-span-4">
              <TableHeaderCell onClick={() => toggleSort('activityTypeName')} active={sortKey === 'activityTypeName'} order={sortOrder}>Activity Type</TableHeaderCell>
            </div>
            <div className="col-span-4">
              <TableHeaderCell align='right' onClick={() => toggleSort('status')} active={sortKey === 'status'} order={sortOrder}>Status</TableHeaderCell>
            </div>
          </div>

          <div className="divide-y divide-[#EEF1FA] bg-white">
            {loading && (
              <div className="px-6 py-5 text-sm text-[#5E6582]">Loading...</div>
            )}
            {error && !loading && (
              <div className="px-6 py-5 text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && sortedActivityTypes.map((activityType, idx) => (
              <div
                key={activityType._id || idx}
                className="grid grid-cols-12 gap-6 px-6 py-5 hover:bg-[#F9FAFD]"
              >
                <div className="col-span-4 self-center text-sm text-[#5E6582]">
                  {activityType.createdAt || activityType.updatedAt
                    ? new Date(activityType.createdAt || activityType.updatedAt).toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </div>
                <div className="col-span-4 self-center text-sm font-semibold text-slate-900">
                  {activityType.activityTypeName || '-'}
                </div>
                <div className="col-span-4 flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${activityType.status ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}
                  >
                    {activityType.status ? 'Active' : 'Inactive'}
                  </span>
                  <div className="relative">
                    <button
                      data-menu-button
                      onClick={() => setMenuOpenId(menuOpenId === (activityType._id || idx) ? null : (activityType._id || idx))}
                      className="rounded-full border border-transparent p-2 text-[#8C93AF] transition hover:border-[#E5E8F6] hover:bg-[#F5F7FD] hover:text-[#2D3658]"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpenId === (activityType._id || idx) && (
                      <div data-menu-content className="absolute right-0 mt-2 w-40 rounded-xl border border-[#E5E8F6] bg-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.25)] z-20">
                        <button
                          onClick={() => startEdit(activityType)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#2D3658] hover:bg-[#F6F7FD]"
                          disabled={rowActionLoading === activityType._id}
                        >
                          {rowActionLoading === activityType._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                          Edit
                        </button>
                        <button
                          onClick={() => { setConfirmId(activityType._id); setConfirmOpen(true); setMenuOpenId(null); }}
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
            {!loading && !error && filteredActivityTypes.length === 0 && (
              <div className="px-6 py-5 text-sm text-[#5E6582]">No activity types found</div>
            )}
          </div>
        </div>
      </div>
      {confirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { if (!deleting) { setConfirmOpen(false); setConfirmId(null); } }}
          />
          <div className="relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-slate-900">Delete this activity type?</div>
                <div className="mt-1 text-sm text-[#5E6582]">This action cannot be undone.</div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { if (!deleting) { setConfirmOpen(false); setConfirmId(null); } }}
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
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
