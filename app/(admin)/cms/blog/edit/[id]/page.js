'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Toast from '@/components/ui/Toast';
import { getBlogById, updateBlog } from '@/services/cms/blog.service';
import ImageCropper from '@/components/ui/ImageCropper';
import { Wand2, Bold, Underline, Italic, Palette, List, ListOrdered, AlignJustify, Table, Link2, Image as ImageIcon, Video, Maximize2, Code, Loader2 } from 'lucide-react';

const toImageSrc = (u) => {
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

export default function EditBlogPage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const params = useParams();
  const id = params?.id;
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    imageFile: null,
    imageUrl: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    status: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0, sizeBytes: 0, originalSizeBytes: 0, format: '' });
  const [cropOpen, setCropOpen] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  const slugify = (str) => {
    return String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const setField = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const validateImage = (file) => {
    if (!file) return '';
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    const maxSize = 2 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) return 'Only JPG, JPEG, PNG, WEBP, and AVIF files are allowed';
    if (file.size > maxSize) return 'Image size must be less than 2MB';
    return '';
  };

  const validateForm = () => {
    const e = {};
    if (!String(formData.title || '').trim()) e.title = 'Required';
    if (!String(formData.content || '').trim()) e.content = 'Required';
    if (!String(formData.metaTitle || '').trim()) e.metaTitle = 'Required';
    if (!String(formData.metaDescription || '').trim()) e.metaDescription = 'Required';
    const imgErr = validateImage(formData.imageFile);
    if (imgErr) e.imageFile = imgErr;
    return e;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getBlogById(id);
        const d = res?.data || res || {};
        setFormData(prev => ({
          ...prev,
          title: String(d.title || ''),
          slug: String(d.slug || ''),
          imageFile: null,
          imageUrl: toImageSrc(d.image || ''),
          content: String(d.content || ''),
          metaTitle: String(d.metaTitle || ''),
          metaDescription: String(d.metaDescription || ''),
          status: Boolean(d.status ?? true)
        }));
      } catch (e) {
        setToast({ open: true, title: 'Error', description: 'Failed to load blog', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  useEffect(() => {
    if (formData.imageFile) {
      const url = URL.createObjectURL(formData.imageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setImagePreviewUrl('');
  }, [formData.imageFile]);

  const handleCropExisting = async () => {
    try {
      if (formData.imageFile) {
        setCropFile(formData.imageFile);
        setCropOpen(true);
        return;
      }
      const src = String(formData.imageUrl || '').trim();
      if (!src) {
        setToast({ open: true, title: 'No image', description: 'No existing image to crop', variant: 'error' });
        return;
      }
      const r = await fetch(src);
      const blob = await r.blob();
      const type = blob.type || 'image/jpeg';
      const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('avif') ? 'avif' : 'jpg';
      const base = (String(formData.slug || '') || 'image').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'image';
      const file = new File([blob], `${base}.${ext}`);
      setCropFile(file);
      setCropOpen(true);
    } catch (e) {
      setToast({ open: true, title: 'Error', description: 'Failed to open cropper', variant: 'error' });
    }
  };

  const handleSave = async () => {
    if (!slugTouched && !String(formData.slug || '').trim()) {
      setField('slug', slugify(formData.title));
    }
    const e = validateForm();
    setErrors(e);
    if (Object.keys(e).length) {
      setToast({ open: true, title: 'Validation failed', description: 'Please fix highlighted fields', variant: 'error' });
      return;
    }
    try {
      setSaving(true);
      if (formData.imageFile) {
        const fd = new FormData();
        fd.append('title', String(formData.title || '').trim());
        fd.append('slug', String(formData.slug || '').trim());
        fd.append('content', String(formData.content || '').trim());
        fd.append('metaTitle', String(formData.metaTitle || '').trim());
        fd.append('metaDescription', String(formData.metaDescription || '').trim());
        fd.append('status', String(Boolean(formData.status)));
        fd.append('image', formData.imageFile);
        await updateBlog(id, fd);
      } else {
        const payload = {
          title: String(formData.title || '').trim(),
          slug: String(formData.slug || '').trim(),
          content: String(formData.content || '').trim(),
          metaTitle: String(formData.metaTitle || '').trim(),
          metaDescription: String(formData.metaDescription || '').trim(),
          status: Boolean(formData.status)
        };
        await updateBlog(id, payload);
      }
      setToast({ open: true, title: 'Blog updated', description: 'Changes have been saved', variant: 'success' });
      router.push('/cms/blog');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update blog';
      setToast({ open: true, title: 'Error', description: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderToolbar = () => (
    <div className="flex items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
      {[Wand2, Bold, Underline, Italic, Palette, List, ListOrdered, AlignJustify, Table, Link2, ImageIcon, Video, Maximize2, Code].map((Icon, idx) => (
        <button key={idx} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <span className="inline-flex items-center gap-2 text-[#5E6582]"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 bg-gray-50 min-h-screen">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Blog</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Dashboard / CMS</p>
      </div>

      <div className="bg-gray-200 p-3 sm:p-4 lg:p-6 rounded-xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Blog Details</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Update'
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title<span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={e => {
                  const v = e.target.value;
                  setField('title', v);
                  if (!slugTouched) setField('slug', slugify(v));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Slug<span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => { setSlugTouched(true); setField('slug', slugify(e.target.value)); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Content<span className="text-red-500">*</span></label>
              <div className="border border-gray-300 rounded-lg">
                {renderToolbar()}
                <textarea
                  value={formData.content}
                  onChange={e => setField('content', e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 focus:outline-none resize-none text-gray-900"
                />
              </div>
              {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
              <div
                className="flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]"
                onClick={() => fileRef.current?.click()}
              >
                <div className="flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer">
                  <span className="truncate" title={formData.imageFile ? formData.imageFile.name : ''}>
                    {(formData.imageFile ? formData.imageFile.name : '') || 'Image.jpg'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]"
                >
                  Browse
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.avif"
                className="hidden"
                onChange={e => {
                  const file = e.target.files[0] || null;
                  if (!file) {
                    setErrors(prev => ({ ...prev, imageFile: '' }));
                    setField('imageFile', null);
                    setImageMeta({ width: 0, height: 0, sizeBytes: 0, originalSizeBytes: 0, format: '' });
                    return;
                  }
                  setCropFile(file);
                  setCropOpen(true);
                }}
              />
              <div className="mt-3">
                <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-[#E5E6EF] bg-white">
                  {imagePreviewUrl ? (
                    <img src={imagePreviewUrl} alt={formData.title || 'Blog image'} className="w-full h-full object-cover" />
                  ) : formData.imageUrl ? (
                    <img src={formData.imageUrl} alt={formData.title || 'Blog image'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[#5E6582]">No image</div>
                  )}
                  <button onClick={handleCropExisting} className="absolute bottom-1 right-1 h-7 px-2 rounded-md bg-white/80 text-xs border border-[#E5E6EF]">Crop</button>
                </div>
              </div>
              {errors.imageFile && <p className="text-red-500 text-sm mt-1">{errors.imageFile}</p>}
              {imageMeta.sizeBytes > 0 && (
                <p className="text-[#5E6582] text-xs mt-1">{imageMeta.width} × {imageMeta.height} • {(imageMeta.sizeBytes / 1024).toFixed(1)} KB • {imageMeta.format}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status<span className="text-red-500">*</span></label>
              <select
                value={formData.status ? 'active' : 'inactive'}
                onChange={e => setField('status', e.target.value === 'active')}
                className="w-full h-12 appearance-none rounded-xl border border-gray-300 bg-white px-4 text-sm text-slate-700 focus:border-gray-400 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title<span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={e => setField('metaTitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900"
              />
              {errors.metaTitle && <p className="text-red-500 text-sm mt-1">{errors.metaTitle}</p>}
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description<span className="text-red-500">*</span></label>
              <textarea
                value={formData.metaDescription}
                onChange={e => setField('metaDescription', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none resize-none text-gray-900"
              />
              {errors.metaDescription && <p className="text-red-500 text-sm mt-1">{errors.metaDescription}</p>}
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
      <ImageCropper
        open={cropOpen}
        file={cropFile}
        onClose={() => { setCropOpen(false); setCropFile(null); }}
        onCropped={({ file, meta }) => {
          const err = validateImage(file);
          setErrors(prev => ({ ...prev, imageFile: err }));
          if (!err) {
            setField('imageFile', file);
            setImageMeta({
              width: meta?.width || 0,
              height: meta?.height || 0,
              sizeBytes: meta?.sizeBytes || 0,
              originalSizeBytes: meta?.originalSizeBytes || 0,
              format: meta?.format || 'webp'
            });
          }
        }}
      />
    </div>
  );
}