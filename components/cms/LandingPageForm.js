'use client';

import { useEffect, useRef, useState } from 'react';
import { Wand2, Bold, Underline, Italic, Palette, List, ListOrdered, AlignJustify, Table, Link2, Image, Video, Maximize2, Code } from 'lucide-react';
import { getLandingData, storeOrUpdateLanding } from '@/services/cms/landing.service';
import Toast from '@/components/ui/Toast';
const toImageSrc = u => {
  const s = String(u || '')
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN 
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
  let origin = originEnv
  if (!origin) {
    try { origin = new URL(apiBase).origin } catch { origin = '' }
  }
  if (!origin) origin = originEnv 
  return `${origin.replace(/\/$/, '')}/${s.replace(/^\/+/, '')}`
}

export default function LandingPageForm() {
  const heroFileRef = useRef(null);
  const promoFileRef = useRef(null);
  const [formData, setFormData] = useState({
    sectionTitle: '',
    topTitle1: '',
    topTitle2: '',
    description: '',
    image: '',
  });

  const [errors, setErrors] = useState({
    image: '',
    // promoImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' });
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateImage = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    // const maxSize = 5 * 1024 * 1024; // 5MB in bytes

    if (!file) {
      return 'Please select an image file';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, JPEG, PNG, WEBP, and AVIF files are allowed';
    }

    // if (file.size > maxSize) {
    //   return 'Image size must be less than 2MB';
    // }

    return '';
  };

  const handleImageChange = (field, event) => {
    const file = event.target.files[0];
    
    if (file) {
      const error = validateImage(file);
      
      setErrors(prev => ({ ...prev, [field]: error }));
      
      if (!error) {
        handleChange(field, file.name);
        setImageFile(file);
        if (previewUrl && previewUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(previewUrl) } catch {}
        }
        try {
          setPreviewUrl(URL.createObjectURL(file));
        } catch {
          setPreviewUrl('');
        }
      } else {
        event.target.value = '';
        setImageFile(null);
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await getLandingData();
        const d = raw?.data?.data || raw?.data || raw || {};
        const mapped = {
          sectionTitle: d?.title1 ?? formData.sectionTitle,
          topTitle1: d?.title2 ?? formData.topTitle1,
          topTitle2: [d?.title3, d?.title4].filter(Boolean).join(' ') || formData.topTitle2,
          description: d?.description ?? formData.description,
          image: d?.image ?? formData.image,
        };
        setFormData(prev => ({ ...prev, ...mapped }));
        try {
          const base = toImageSrc(d?.image || '');
          setPreviewUrl(base ? `${base}${base.includes('?') ? '&' : '?'}t=${Date.now()}` : '');
        } catch {
          setPreviewUrl(toImageSrc(d?.image || ''));
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to fetch landing data';
        setToast({ open: true, title: 'Error', description: msg, variant: 'error' });
      }
    };
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(previewUrl) } catch {}
      }
    };
  }, [previewUrl]);

  const splitTopTitle2 = v => {
    const s = String(v || '').trim();
    if (!s) return ['', ''];
    const mid = Math.floor(s.length / 2);
    let idx = s.lastIndexOf(' ', mid);
    if (idx === -1) idx = s.indexOf(' ');
    if (idx === -1) return [s, ''];
    return [s.slice(0, idx).trim(), s.slice(idx + 1).trim()];
  };

  const toPayload = () => {
    const [t3, t4] = splitTopTitle2(formData.topTitle2);
    const fd = new FormData();
    fd.append('title1', String(formData.sectionTitle || '').trim());
    fd.append('title2', String(formData.topTitle1 || '').trim());
    fd.append('title3', t3);
    fd.append('title4', t4);
    fd.append('description', String(formData.description || '').trim());
    fd.append('slug', 'landing');
    if (imageFile instanceof File) {
      fd.append('image', imageFile);
    }
    return fd;
  };

  const withBuster = (u, token) => {
    if (!u) return '';
    const sep = u.includes('?') ? '&' : '?';
    return `${u}${sep}t=${token}`;
  };

  const handleSave = () => {
    (async () => {
      try {
        setSaving(true);
        const payload = toPayload();
        await storeOrUpdateLanding(payload);
        setToast({ open: true, title: 'Saved', description: 'Landing page updated', variant: 'success' });
        try {
          const base = toImageSrc(formData.image || '');
          setPreviewUrl(withBuster(base, Date.now()));
        } catch {}
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to save landing page';
        setToast({ open: true, title: 'Error', description: msg, variant: 'error' });
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <>
    <div className="p-4 sm:p-6 lg:p-8 bg-white">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Landing Page</h1>
        <p className="text-sm text-gray-600 mt-1">Dashboard / CMS</p>
      </div>
      <div className='bg-gray-200 p-4 rounded-xl'>
        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4">
            {/* Header with Save Button */}
            <div className="flex justify-between items-center mb-4 border-b p-2 border-gray-300">
              <h2 className="text-xl font-semibold text-gray-900">Landing Page Details</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Section Title and Top Titles in One Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Section Title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sectionTitle}
                  onChange={(e) => handleChange('sectionTitle', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Top Title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.topTitle1}
                  onChange={(e) => handleChange('topTitle1', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Top Title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.topTitle2}
                  onChange={(e) => handleChange('topTitle2', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Description<span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none resize-none text-gray-900"
              />
            </div>

            {/* Upload Image */}
            <div className="mb-4 max-w-md">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Upload Image<span className="text-red-500">*</span>
              </label>
              <div
                className="flex h-12 items-stretch rounded-xl border border-[#E5E6EF]"
                onClick={() => heroFileRef.current?.click()}
              >
                <div className="flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer overflow-hidden">
                  <span className="truncate" title={formData.image}>
                    {formData.image || "Image.jpg"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => heroFileRef.current?.click()}
                  className="px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD] whitespace-nowrap"
                >
                  Browse
                </button>
              </div>
              <input
                ref={heroFileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.avif"
                className="hidden"
                onChange={(e) => handleImageChange('image', e)}
              />
              {errors.image && (
                <p className="text-red-500 text-sm mt-1">{errors.image}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF</p>
              {(previewUrl || formData.image) && (
                <div className="mt-2">
                  <img src={previewUrl || toImageSrc(formData.image)} alt="Hero preview" className="w-48 h-28 object-cover rounded border border-gray-300" />
                </div>
              )}
            </div>

         
          </div>
        </div>
      </div>
    </div>
    <Toast
      open={toast.open}
      onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
      title={toast.title}
      description={toast.description}
      variant={toast.variant}
      duration={2500}
      position='top-right'
    />
    </>
  );
}
