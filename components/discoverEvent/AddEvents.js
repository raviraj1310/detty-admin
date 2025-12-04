'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Upload,
  Bold,
  Italic,
  Underline,
  List,
  AlignLeft,
  Link,
  Image as ImageIcon,
  Code,
  Type,
  ArrowLeft,
  Loader2
} from 'lucide-react';
  import { addEvent, getEventTypes, getVendors } from '@/services/discover-events/event.service';;
import Toast from '@/components/ui/Toast';
import ImageCropper from '@/components/ui/ImageCropper';
import { convertToWebp } from '@/src/utils/image';

export default function AddEvents() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    eventName: '',
    location: '',
    mapLocation: '',
    eventStartDate: '',
    eventStartTime: '',
    eventEndDate: '',
    eventEndTime: '',
    eventType: 'Concert',
    uploadImage: '',
    aboutEvent: '',
    twitter: '',
    website: ''
  });
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imageMeta, setImageMeta] = useState({ width: 0, height: 0, sizeBytes: 0, originalSizeBytes: 0, format: '' });
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef(null);
  const [eventTypes, setEventTypes] = useState([]);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState('');
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImageFile, setRawImageFile] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.eventName || formData.eventName.trim().length < 3) errs.eventName = 'Enter a valid event name';
    if (!formData.location) errs.location = 'Enter a location';
    const mapRegex = /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/;
    if (!formData.mapLocation || !mapRegex.test(formData.mapLocation)) errs.mapLocation = 'Enter coordinates as lat, long';
    if (!formData.eventStartDate) errs.eventStartDate = 'Select start date';
    if (!formData.eventEndDate) errs.eventEndDate = 'Select end date';
    if (formData.eventStartDate && formData.eventEndDate) {
      const s = new Date(formData.eventStartDate);
      const e = new Date(formData.eventEndDate);
      if (s > e) errs.eventEndDate = 'End date must be after start date';
    }
    if (!selectedEventTypeId) errs.eventType = 'Select event type';
    if (!formData.aboutEvent || formData.aboutEvent.trim().length < 10) errs.aboutEvent = 'Enter a meaningful description';
    const normalizeUrl = (u) => {
      if (!u) return '';
      const v = u.trim();
      if (/^https?:\/\//i.test(v)) return v;
      return `https://${v}`;
    };
    const tw = normalizeUrl(formData.twitter);
    const ws = normalizeUrl(formData.website);
    const urlRegex = /^(https?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/i;
    if (!tw || !urlRegex.test(tw)) errs.twitter = 'Enter a valid Twitter URL';
    if (!ws || !urlRegex.test(ws)) errs.website = 'Enter a valid website URL';
    if (!imageFile) errs.uploadImage = 'Upload an image';
    if (!selectedVendorId) errs.hostedBy = 'Select vendor';
    return { errs, tw, ws };
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errs, tw, ws } = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const fd = new FormData();
    fd.append('eventName', formData.eventName.trim());
    fd.append('twitterLink', tw);
    fd.append('about', formData.aboutEvent.trim());
    fd.append('eventTypeId', selectedEventTypeId);
    fd.append('eventEndDate', formData.eventEndDate);
    fd.append('mapLocation', formData.mapLocation);
    fd.append('websiteLink', ws);
    fd.append('location', formData.location);
    fd.append('eventStartDate', formData.eventStartDate);
    fd.append('image', imageFile);
    fd.append('imageWidth', String(imageMeta.width || 0));
    fd.append('imageHeight', String(imageMeta.height || 0));
    fd.append('imageSizeBytes', String(imageMeta.sizeBytes || 0));
    fd.append('imageOriginalSizeBytes', String(imageMeta.originalSizeBytes || 0));
    fd.append('imageFormat', imageMeta.format || 'webp');
    fd.append('hostedBy', selectedVendorId);
    try {
      setSubmitting(true);
      const res = await addEvent(fd);
      if (res && res.success) {
        const newId = (
          res?.data?._id ||
          res?.data?.id ||
          res?.id ||
          res?.eventId ||
          ''
        );
        setTimeout(() => {
          setToastOpen(true);
        }, 500);
        if (newId) {
          router.push(`/discover-events/edit-tickets/${encodeURIComponent(String(newId))}`);
        } else {
          router.push('/discover-events/edit-tickets');
        }
      }
    } catch (err) {
      setErrors({ submit: 'Failed to add event' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await getEventTypes();
        const list = Array.isArray(res?.data) ? res.data : [];
        setEventTypes(list);
        if (list.length > 0) {
          const first = list[0];
          setSelectedEventTypeId(first._id || first.id || '');
        }
      } catch (e) {
        setEventTypes([]);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchVendors = async () => {
      setVendorsLoading(true);
      setVendorsError('');
      try {
        const res = await getVendors();
        const list = Array.isArray(res?.data) ? res.data : [];
        setVendors(list);
        if (list.length > 0) {
          const first = list[0];
          setSelectedVendorId(String(first.userId));
        } else {
          setSelectedVendorId('');
        }
      } catch (e) {
        setVendors([]);
        setSelectedVendorId('');
        setVendorsError('Failed to load vendors');
      } finally {
        setVendorsLoading(false);
      }
    };
    fetchVendors();
  }, []);

  const handleBack = () => {
    router.push('/discover-events');
  };

  const openCropper = async (file) => {
    setRawImageFile(file);
    setCropOpen(true);
  };

  const openCropperFromPreview = () => {
    if (imageFile instanceof File) {
      setRawImageFile(imageFile);
      setCropOpen(true);
    }
  };

  useEffect(() => {
    return () => {
      if (imageUrl) {
        try { URL.revokeObjectURL(imageUrl); } catch {}
      }
    };
  }, [imageUrl]);

  

  return (
    <div className="space-y-7 py-12 px-12">
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        title="Event created"
        description="Your event has been added"
        variant="success"
        duration={3000}
        position="top-right"
      />
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-[#E5E6EF] bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">Add Events</h1>
            <p className="text-sm text-[#99A1BC]">
              Dashboard / Add Events
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          {/* <button 
            onClick={() => router.push('/discover-events/edit-tickets')}
            className="rounded-xl border border-[#E5E6EF] bg-white px-5 py-2.5 text-sm font-medium text-[#1A1F3F] shadow-sm transition hover:bg-[#F9FAFD]"
          >
            Edit Tickets
          </button> */}
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl bg-[#FF5B2C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(248,113,72,0.65)] transition hover:bg-[#F0481A] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </span>
            ) : (
              'Add'
            )}
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Single Unified Section */}
        <div className="rounded-[30px] border border-[#E1E6F7] bg-white p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.55)]">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Event Details</h2>
          
          <div className="space-y-6">
            {/* Basic Event Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Event Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Event Name*
                </label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => handleInputChange('eventName', e.target.value)}
                  className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  placeholder="Enter event name"
                />
                {errors.eventName && (<p className="text-xs text-red-600">{errors.eventName}</p>)}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Location*
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  placeholder="Enter location"
                />
                {errors.location && (<p className="text-xs text-red-600">{errors.location}</p>)}
              </div>

              {/* Map Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Map Location*
                </label>
                <input
                  type="text"
                  value={formData.mapLocation}
                  onChange={(e) => handleInputChange('mapLocation', e.target.value)}
                  className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  placeholder="Enter coordinates"
                />
                {errors.mapLocation && (<p className="text-xs text-red-600">{errors.mapLocation}</p>)}
              </div>

              {/* Event Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Event Start Date*
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.eventStartDate}
                    onChange={(e) => handleInputChange('eventStartDate', e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A6AEC7] pointer-events-none" />
                </div>
                {errors.eventStartDate && (<p className="text-xs text-red-600">{errors.eventStartDate}</p>)}
              </div>

              {/* Event End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Event End Date*
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.eventEndDate}
                    onChange={(e) => handleInputChange('eventEndDate', e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A6AEC7] pointer-events-none" />
                </div>
                {errors.eventEndDate && (<p className="text-xs text-red-600">{errors.eventEndDate}</p>)}
              </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Event Type*
              </label>
              <select
                value={selectedEventTypeId}
                onChange={(e) => setSelectedEventTypeId(e.target.value)}
                className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
              >
                {eventTypes.map((t) => (
                  <option key={t._id || t.id}
                    value={t._id || t.id}
                  >
                    {t.name || t.eventType || t.title || 'Type'}
                  </option>
                ))}
              </select>
              {errors.eventType && (<p className="text-xs text-red-600">{errors.eventType}</p>)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium text-slate-700">Hosted by vendor</label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                disabled={vendorsLoading}
              >
                {vendorsLoading && <option value="">Loading vendors...</option>}
                {!vendorsLoading && vendors.length === 0 && <option value="">No vendors</option>}
                {!vendorsLoading && vendors.map(v => (
                  <option key={String(v.userId || v.vendorId || v._id || v.id)} value={String(v.userId || v.vendorId || v._id || v.id)}>
                    {v.businessName || v.name || 'Vendor'}
                  </option>
                ))}
              </select>
              {vendorsError && <p className="text-xs text-red-600">{vendorsError}</p>}
              {!selectedVendorId && <p className="text-xs text-red-600">Select vendor</p>}
            </div>
          </div>

            {/* Upload Image */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Upload Image*
                </label>
                <div
                  className="flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer">
                    <span className="truncate" title={formData.uploadImage}>
                      {formData.uploadImage || "Image.jpg"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]"
                  >
                    Browse
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    if (file) {
                      openCropper(file);
                    } else {
                      setImageFile(null);
                      setImageMeta({ width: 0, height: 0, sizeBytes: 0, originalSizeBytes: 0, format: '' });
                    }
                  }}
                />
                  <span className='text-xs text-[#B0B7D0]'> Accepted: JPG, JPEG, PNG, HEIC, GIF (auto-converted to WebP)</span>
                  {imageFile && (
                    <div className="mt-2">
                      {imageUrl && (
                        <div className="flex items-center gap-3">
                          <img
                            src={imageUrl}
                            alt="Event image preview"
                            className="w-24 h-24 object-cover rounded border border-[#E5E6EF] cursor-pointer"
                            onClick={openCropperFromPreview}
                          />
                          <button type="button" onClick={openCropperFromPreview} className="h-8 px-3 rounded-md bg-[#FF5B2C] text-white text-xs font-semibold">Crop</button>
                        </div>
                      )}
                      <div className="text-xs text-[#5E6582] mt-2">
                        <span>
                          Dimensions: {imageMeta.width} × {imageMeta.height}
                        </span>
                        <span className="ml-3">Size: {(imageMeta.sizeBytes / 1024).toFixed(1)} KB</span>
                        <span className="ml-3">Original: {(imageMeta.originalSizeBytes / 1024).toFixed(1)} KB</span>
                        <span className="ml-3">Format: {imageMeta.format}</span>
                      </div>
                    </div>
                  )}
                {errors.uploadImage && (<p className="text-xs text-red-600">{errors.uploadImage}</p>)}
              </div>

            {/* About Event */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-700">
                About Event*
              </label>
              
              {/* Rich Text Editor Toolbar */}
              <div className="flex items-center gap-1 p-3 border border-[#E5E6EF] rounded-t-xl bg-[#F8F9FC]">
                <button type="button" className="p-2 hover:bg-white rounded transition-colors">
                  <Type className="w-4 h-4 text-[#6B7280]" />
                </button>
                <button type="button" className="p-2 hover:bg-white rounded transition-colors">
                  <Bold className="w-4 h-4 text-[#6B7280]" />
                </button>
                <button type="button" className="p-2 hover:bg-white rounded transition-colors">
                  <Italic className="w-4 h-4 text-[#6B7280]" />
                </button>
                <button type="button" className="p-2 hover:bg-white rounded transition-colors">
                  <Underline className="w-4 h-4 text-[#6B7280]" />
                </button>
                <div className="w-px h-6 bg-[#E5E6EF] mx-1"></div>
                <button type="button" className="p-2 hover:bg-white rounded transition-colors">
                  <List className="w-4 h-4 text-[#6B7280]" />
                </button>
                <button type="button" className="p-2 hover:bg-white rounded transition-colors">
                  <AlignLeft className="w-4 h-4 text-[#6B7280]" />
                </button>
                <div className="w-px h-6 bg-[#E5E6EF] mx-1"></div>
                <button type="button" className="p-2 hover:bg-white rounded transition-colors">
                  <Link className="w-4 h-4 text-[#6B7280]" />
                </button>
                <button type="button" className="p-2 hover:bg-white rounded transition-colors">
                  <ImageIcon className="w-4 h-4 text-[#6B7280]" />
                </button>
                <button type="button" className="p-2 hover:bg-white rounded transition-colors">
                  <Code className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>
              
              {/* Text Area */}
              <textarea
                value={formData.aboutEvent}
                onChange={(e) => handleInputChange('aboutEvent', e.target.value)}
                rows={8}
                className="w-full rounded-b-xl border border-t-0 border-[#E5E6EF] bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4] resize-none"
                placeholder="Enter event description..."
              />
              {errors.aboutEvent && (<p className="text-xs text-red-600">{errors.aboutEvent}</p>)}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="bg-black text-white px-4 py-2 rounded-lg inline-block">
                <h3 className="text-sm font-medium">Contact Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Twitter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Twitter / Instagram *
                  </label>
                  <input
                    type="text"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                    placeholder="www.twitter.com"
                  />
                  {errors.twitter && (<p className="text-xs text-red-600">{errors.twitter}</p>)}
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Website*
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full h-12 rounded-xl border border-[#E5E6EF] bg-[#F8F9FC] px-4 pr-12 text-sm text-slate-700 placeholder:text-[#B0B7D0] focus:border-[#C5CAE3] focus:outline-none focus:ring-2 focus:ring-[#C2C8E4]"
                      placeholder="www.website.com"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A6AEC7]" />
                  </div>
                  {errors.website && (<p className="text-xs text-red-600">{errors.website}</p>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      <ImageCropper
        open={cropOpen}
        file={rawImageFile}
        onClose={() => { setCropOpen(false); setRawImageFile(null); }}
        onCropped={({ file, meta }) => {
          setImageFile(file);
          setImageMeta(meta);
          setFormData(prev => ({ ...prev, uploadImage: file.name }));
          setErrors(prev => ({ ...prev, uploadImage: '' }));
          try {
            const u = URL.createObjectURL(file);
            setImageUrl(u);
          } catch {}
        }}
      />
      {errors.submit && (<p className="text-sm text-red-600">{errors.submit}</p>)}
    </div>
  );
}
