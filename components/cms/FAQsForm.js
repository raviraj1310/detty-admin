'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, Download, MoreVertical, AlertCircle, Loader2 } from 'lucide-react';
import { RiExpandUpDownFill } from "react-icons/ri";
import { getAllFAQs, deleteFAQ } from '@/services/cms/faqs.service';

export default function FAQsForm() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmId, setConfirmId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const loadFAQs = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getAllFAQs();
            const arr = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
            const mapped = arr.map((faq) => {
                const id = faq?._id ?? faq?.id;
                const category = (() => {
                    const cat = faq?.category;
                    const name = typeof cat === 'string' ? cat : (cat?.title ?? cat?.name);
                    const val = faq?.faqCategory ?? faq?.categoryName ?? name ?? cat?.title ?? '';
                    return typeof val === 'string' ? val.trim() : String(val);
                })();
                const question = faq?.faqQuestion ?? faq?.question ?? faq?.title ?? '';
                const createdAt = faq?.createdAt ?? faq?.addedOn ?? null;
                let addedOn = createdAt;
                try {
                    const v = createdAt && createdAt.$date ? createdAt.$date : createdAt;
                    if (v) {
                        const d = new Date(v);
                        if (!isNaN(d.getTime())) addedOn = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
                    }
                } catch {}
                const status = typeof faq?.status === 'boolean' ? faq.status : faq?.isActive ?? true;
                return { id, category, question, addedOn: addedOn || '', status };
            });
            setFaqs(mapped);
        } catch (e) {
            setError('Failed to load FAQs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadFAQs(); }, []);

    const handleAddNew = () => {
        router.push('/cms/faqs/add');
    };

    const filteredFaqs = faqs.filter((f) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            String(f.category || '').toLowerCase().includes(q) ||
            String(f.question || '').toLowerCase().includes(q)
        );
    });

    const openDeleteConfirm = (id) => {
        setConfirmId(id);
        setConfirmOpen(true);
    };

    useEffect(() => {
        const handleDocClick = (e) => {
            const t = e.target;
            const inMenu = !!(t && t.closest && t.closest('[data-faq-menu]'));
            const inTrigger = !!(t && t.closest && t.closest('[data-faq-menu-trigger]'));
            if (!inMenu && !inTrigger) setOpenMenuId(null);
        };
        document.addEventListener('mousedown', handleDocClick);
        return () => { document.removeEventListener('mousedown', handleDocClick); };
    }, [openMenuId]);

    const confirmDelete = async () => {
        if (!confirmId) return;
        setDeleting(true);
        try {
            await deleteFAQ(confirmId);
            setFaqs((prev) => prev.filter((f) => f.id !== confirmId));
            setConfirmOpen(false);
            setConfirmId(null);
        } catch (e) {
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 bg-white min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">FAQs</h1>
                    <p className="text-sm text-gray-500 mt-1">Dashboard / CMS</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
                >
                    Add New
                </button>
            </div>

                <div className='bg-gray-200 p-6 rounded-xl'>
                    {/* FAQ List Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        {/* Card Header */}
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">FAQ List</h2>
                        </div>
                        {/* Search and Filters Bar */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-4">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>

                                {/* Filters Button */}
                                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                    <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                                    <span className="text-gray-700 font-medium">Filters</span>
                                </button>

                                {/* Download Button */}
                                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                    <Download className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                Added On
                                                <RiExpandUpDownFill className="w-4 h-4" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                FAQs Category
                                                <RiExpandUpDownFill className="w-4 h-4" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                FAQ Question
                                                <RiExpandUpDownFill className="w-4 h-4" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center gap-2">
                                                Status
                                                <RiExpandUpDownFill className="w-4 h-4" />
                                            </div>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {/* Actions column */}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {error && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-sm text-red-600">{error}</td>
                                        </tr>
                                    )}
                                    {loading && !error && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-sm text-gray-600">
                                                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading FAQs...</span>
                                            </td>
                                        </tr>
                                    )}
                                    {!loading && !error && filteredFaqs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-sm text-gray-600">No FAQs found.</td>
                                        </tr>
                                    )}
                                    {filteredFaqs.map((faq) => (
                                        <tr key={faq.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {faq.addedOn}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {faq.category}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {faq.question}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${faq.status == true
                                                            ? 'bg-white text-gray-600 border border-gray-300'
                                                            : 'bg-white text-red-600 border border-red-300'
                                                        }`}
                                                >
                                                    {faq.status === true && (
                                                        <>
                                                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                                            <span>Active</span>
                                                        </>
                                                    )}
                                                    {faq.status === false && (
                                                        <>
                                                            <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                                            <span>Inactive</span>
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm relative overflow-visible">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === faq.id ? null : faq.id)}
                                                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                                    data-faq-menu-trigger
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                                {openMenuId === faq.id && (
                
                                                    <div className="absolute right-4 top-full mt-2 w-36 rounded-lg border border-gray-200 bg-white shadow-md z-50 flex flex-col py-1" data-faq-menu>
                                                        <button
                                                            onClick={() => {
                                                                setOpenMenuId(null)
                                                                const idStr = encodeURIComponent(String(faq.id || ''))
                                                                if (idStr) router.push(`/cms/faqs/edit?id=${idStr}`)
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setOpenMenuId(null);
                                                                openDeleteConfirm(faq.id);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
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

                {confirmOpen && (
                    <div className='fixed inset-0 z-40 flex items-center justify-center'>
                        <div
                            className='absolute inset-0 bg-black/40'
                            onClick={() => {
                                if (!deleting) {
                                    setConfirmOpen(false);
                                    setConfirmId(null);
                                }
                            }}
                        />
                        <div className='relative z-50 w-full max-w-md rounded-2xl border border-[#E5E8F6] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]'>
                            <div className='flex items-start gap-4'>
                                <div className='rounded-full bg-red-100 p-3'>
                                    <AlertCircle className='h-6 w-6 text-red-600' />
                                </div>
                                <div className='flex-1'>
                                    <div className='text-lg font-semibold text-slate-900'>
                                        Delete this FAQ?
                                    </div>
                                    <div className='mt-1 text-sm text-[#5E6582]'>
                                        This action cannot be undone.
                                    </div>
                                </div>
                            </div>
                            <div className='mt-6 flex justify-end gap-3'>
                                <button
                                    onClick={() => {
                                        if (!deleting) {
                                            setConfirmOpen(false);
                                            setConfirmId(null);
                                        }
                                    }}
                                    className='rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]'
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                    className='rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed'
                                >
                                    {deleting ? (
                                        <span className='flex items-center gap-2'>
                                            <Loader2 className='h-4 w-4 animate-spin' />
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
