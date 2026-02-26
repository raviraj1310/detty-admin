'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronLeft,
  Trash2,
  Loader2,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import ImageCropper from '@/components/ui/ImageCropper'
import { convertToWebp } from '@/src/utils/image'
import {
  getPodcastById,
  updatePodcast,
  updatePodcastEpisode,
  addEpisode as addEpisodeApi,
  deleteEpisode
} from '@/services/podcast/podcast.service'
import Toast from '@/components/ui/Toast'
import { AlertCircle } from 'lucide-react'

export default function EditPodcast () {
  const router = useRouter()
  const params = useParams()
  const id = params?.podId

  // Helper function for image/video URL
  const toImageSrc = u => {
    const s = String(u || '').trim()
    if (!s) return '/images/no-image.webp'
    if (/^https?:\/\//i.test(s)) return s
    const originEnv = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    let origin = originEnv
    if (!origin) {
      try {
        origin = new URL(apiBase).origin
      } catch {
        origin = ''
      }
    }
    if (!origin) origin = originEnv
    const base = String(origin || '').replace(/\/+$/, '')
    const path = s.replace(/^\/+/, '')
    return base ? `${base}/${path}` : s
  }

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  const [formData, setFormData] = useState({
    name: '',
    about: '',
    episodeInfo: '',
    category: '',
    type: 'Video',
    duration: '',
    episodeTime: '',
    image: null
  })

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [episodeToDelete, setEpisodeToDelete] = useState(null)
  const [deletingEpisode, setDeletingEpisode] = useState(false)

  const [episodes, setEpisodes] = useState([])

  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imageMeta, setImageMeta] = useState({
    width: 0,
    height: 0,
    sizeBytes: 0,
    originalSizeBytes: 0,
    format: ''
  })
  const fileInputRef = useRef(null)

  useEffect(() => {
    const fetchPodcast = async () => {
      if (!id) return
      try {
        setFetching(true)
        const response = await getPodcastById(id)
        if (response?.success || response?.data) {
          const data = response.data || response
          setFormData({
            name: data.title || data.name || '',
            about: data.about || '',
            episodeInfo: data.episodeInfo || '',
            category: data.podcastCategory || data.category || '',
            type: data.podcastType || data.type || 'Video',
            duration: data.duration || '',
            episodeTime: data.episodeTime || '',
            image: data.image || null
          })

          const episodesData = data.episodes || data.podcast_media || []
          if (Array.isArray(episodesData)) {
            setEpisodes(
              episodesData.map(ep => ({
                id: ep.id || ep._id,
                number: ep.episodeNo || ep.episodeNumber || ep.number || '',
                title: ep.title || '',
                subText: ep.subText || '',
                info: ep.episodeInfo || ep.info || '',
                video: ep.media || ep.video || null,
                scheduledDate: ep.scheduleDate || ep.scheduledDate || ''
              }))
            )
          }
        }
      } catch (error) {
        console.error('Error fetching podcast:', error)
        setToast({
          open: true,
          title: 'Error',
          description: 'Failed to fetch podcast details',
          variant: 'error'
        })
      } finally {
        setFetching(false)
      }
    }

    fetchPodcast()
  }, [id])

  const handleUpdate = async () => {
    if (!id) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', formData.name.trim())
      fd.append('about', formData.about.trim())
      fd.append('episodeInfo', formData.episodeInfo.trim())
      fd.append('podcastCategory', (formData.category || '').toLowerCase())
      fd.append('podcastType', (formData.type || '').toLowerCase())
      fd.append('duration', formData.duration)
      fd.append('episodeTime', formData.episodeTime)

      if (imageFile) {
        fd.append('image', imageFile)
        fd.append('imageWidth', String(imageMeta.width || 0))
        fd.append('imageHeight', String(imageMeta.height || 0))
        fd.append('imageSizeBytes', String(imageMeta.sizeBytes || 0))
        fd.append(
          'imageOriginalSizeBytes',
          String(imageMeta.originalSizeBytes || 0)
        )
        fd.append('imageFormat', imageMeta.format || 'webp')
      }

      // Update podcast details
      await updatePodcast(id, fd)

      // Update episodes
      if (episodes.length > 0) {
        // Only update existing episodes (ignore new/temp ones for now)
        const existingEpisodes = episodes.filter(
          ep => !String(ep.id).startsWith('temp_')
        )
        await Promise.all(
          existingEpisodes.map(ep =>
            updatePodcastEpisode(ep.id, {
              episodeNumber: ep.number,
              title: ep.title,
              subText: ep.subText,
              info: ep.info,
              video: ep.video,
              scheduledDate: ep.scheduledDate
            })
          )
        )
      }

      setToast({
        open: true,
        title: 'Success',
        description: 'Podcast updated successfully',
        variant: 'success'
      })
    } catch (error) {
      console.error('Error updating podcast:', error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to update podcast',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEpisodeChange = (id, field, value) => {
    setEpisodes(prev =>
      prev.map(ep => (ep.id === id ? { ...ep, [field]: value } : ep))
    )
  }

  const addEpisode = () => {
    const newId = `temp_${Date.now()}`
    setEpisodes([
      ...episodes,
      {
        id: newId,
        number: (episodes.length + 1).toString(),
        title: '',
        subText: '',
        info: '',
        video: null,
        scheduledDate: ''
      }
    ])
  }

  const removeEpisode = id => {
    // Check if it's a temporary episode (starts with temp_)
    if (String(id).startsWith('temp_')) {
      setEpisodes(prev => prev.filter(ep => ep.id !== id))
    } else {
      // It's a saved episode, ask for confirmation
      setEpisodeToDelete(id)
      setDeleteConfirmOpen(true)
    }
  }

  const confirmDeleteEpisode = async () => {
    if (!episodeToDelete) return

    setDeletingEpisode(true)
    try {
      await deleteEpisode(episodeToDelete)

      setEpisodes(prev => prev.filter(ep => ep.id !== episodeToDelete))

      setToast({
        open: true,
        title: 'Success',
        description: 'Episode deleted successfully',
        variant: 'success'
      })
    } catch (error) {
      console.error('Error deleting episode:', error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to delete episode',
        variant: 'error'
      })
    } finally {
      setDeletingEpisode(false)
      setDeleteConfirmOpen(false)
      setEpisodeToDelete(null)
    }
  }

  const openCropWithExisting = e => {
    e.preventDefault() // Prevent form submission if inside a form
    if (imageFile) {
      setCropFile(imageFile)
      setCropOpen(true)
    } else if (formData.image) {
      // Create a temporary file object from the URL for the cropper
      // This is a bit of a hack since the cropper expects a File object
      // But we can try to fetch it or just use the URL if the cropper supports it
      // Based on ImageCropper.js, it takes a 'file' prop which is usually a File object
      // Let's try to fetch the image and convert to blob/file
      fetch(toImageSrc(formData.image))
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'existing-image.webp', {
            type: blob.type
          })
          setCropFile(file)
          setCropOpen(true)
        })
        .catch(err => {
          console.error('Error fetching image for cropping:', err)
          setToast({
            open: true,
            title: 'Error',
            description: 'Could not load image for cropping',
            variant: 'error'
          })
        })
    } else {
      // If no image exists, trigger the file input
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = e => {
    const file = e.target.files && e.target.files[0]
    if (file) {
      setRawImageFile(file)
      setCropOpen(true)
    }
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleCropped = ({ file, meta }) => {
    setImageFile(file)
    setImageMeta(meta)
    // Create preview URL
    const url = URL.createObjectURL(file)
    setFormData(prev => ({ ...prev, image: url }))
  }

  const openCropperFromPreview = async () => {
    if (imageFile instanceof File) {
      setRawImageFile(imageFile)
      setCropOpen(true)
      return
    }

    const src = toImageSrc(formData.image)
    if (!src) return

    try {
      // Fetch the image
      const r = await fetch(src)
      const b = await r.blob()

      // Get filename from URL or default
      let filename = 'podcast-image'
      if (typeof formData.image === 'string') {
        filename = formData.image.split('/').pop() || 'podcast-image'
      }

      const f = new File([b], filename, { type: b.type || 'image/jpeg' })

      setRawImageFile(f)
      setCropOpen(true)
    } catch (error) {
      console.error('Error preparing image for cropper:', error)
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to load image for cropping',
        variant: 'error'
      })
    }
  }

  if (fetching) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-[#FF4400]' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      {/* Header */}
      <div className='mb-8'>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-1 text-xs font-medium text-[#8A92AC] hover:text-[#2D3658] transition-colors w-fit mb-2'
        >
          <ChevronLeft className='h-4 w-4' /> Back
        </button>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-gray-900'>Podcast Details</h1>
          <div className='flex gap-3'>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className='flex items-center gap-2 rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#E63D00] disabled:opacity-50'
            >
              {loading && <Loader2 className='h-4 w-4 animate-spin' />}
              Update
            </button>
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
        {/* Main Podcast Fields */}
        <div className='space-y-6'>
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Podcast Name*
            </label>
            <input
              type='text'
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
              placeholder='Enter podcast name'
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              About Podcast*
            </label>
            <div className='rounded-lg border border-gray-200 text-gray-900'>
              <TiptapEditor
                content={formData.about}
                onChange={content =>
                  setFormData({ ...formData, about: content })
                }
              />
            </div>
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700'>
              Episode Info*
            </label>
            <div className='rounded-lg border border-gray-200 text-gray-900'>
              <TiptapEditor
                content={formData.episodeInfo}
                onChange={content =>
                  setFormData({ ...formData, episodeInfo: content })
                }
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Podcast Category*
              </label>
              <select
                value={formData.category}
                onChange={e =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 focus:border-[#FF4400] focus:outline-none'
              >
                <option value='Fitness'>Fitness</option>
                <option value='Technology'>Technology</option>
                <option value='Business'>Business</option>
              </select>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Podcast Type*
              </label>
              <select
                value={formData.type}
                onChange={e =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 focus:border-[#FF4400] focus:outline-none'
              >
                <option value='Video'>Video</option>
                <option value='Audio'>Audio</option>
              </select>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Duration*
              </label>
              <input
                type='text'
                value={formData.duration}
                onChange={e =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='e.g. 2-4 hours'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Episode Time*
              </label>
              <input
                type='text'
                value={formData.episodeTime}
                onChange={e =>
                  setFormData({ ...formData, episodeTime: e.target.value })
                }
                className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='e.g. Every Monday - 6:00 AM (GMT)'
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Upload Image*
              </label>
              <div className='flex'>
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className='hidden'
                  accept='image/jpeg,image/png,image/webp,image/gif'
                />
                <input
                  type='text'
                  readOnly
                  value={
                    imageFile
                      ? imageFile.name
                      : typeof formData.image === 'string'
                      ? formData.image.split('/').pop()
                      : 'No image selected'
                  }
                  className='w-full rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none'
                />
                <button
                  type='button'
                  onClick={openCropWithExisting}
                  className='rounded-r-lg border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200'
                >
                  Crop / Browse
                </button>
              </div>
              <span className='mt-1 block text-xs text-[#B0B7D0]'>
                Accepted: JPG, JPEG, PNG, HEIC, GIF (auto-converted to WebP)
              </span>

              {formData.image && (
                <div className='mt-3 relative w-fit'>
                  <img
                    src={toImageSrc(formData.image)}
                    alt='Podcast Cover'
                    className='h-32 w-32 rounded-lg object-cover border border-gray-200'
                  />
                  {(imageFile || formData.image) && (
                    <button
                      type='button'
                      onClick={openCropperFromPreview}
                      className='absolute top-2 right-2 rounded bg-white/90 p-1 text-[#FF4400] shadow-sm hover:bg-white'
                      title='Crop Image'
                    >
                      <ImageIcon className='h-4 w-4' />
                    </button>
                  )}
                </div>
              )}
              {imageFile && (
                <div className='text-xs text-[#5E6582] mt-2'>
                  <span>
                    Dimensions: {imageMeta.width} × {imageMeta.height}
                  </span>
                  <span className='ml-3'>
                    Size: {(imageMeta.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                  <span className='ml-3'>Format: {imageMeta.format}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Episodes Section */}
        <div className='mt-8'>
          <div className='mb-6'>
            <span className='rounded-md bg-black px-4 py-2 text-sm font-medium text-white'>
              Episodes
            </span>
          </div>

          <div className='space-y-8'>
            {episodes.map((episode, index) => (
              <div
                key={episode.id}
                className='rounded-lg border border-gray-100 bg-gray-50/50 p-4'
              >
                <div className='grid grid-cols-1 gap-4 md:grid-cols-[100px_1fr_1fr]'>
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Episode*
                    </label>
                    <input
                      type='text'
                      value={episode.number}
                      onChange={e =>
                        handleEpisodeChange(
                          episode.id,
                          'number',
                          e.target.value
                        )
                      }
                      className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Title*
                    </label>
                    <input
                      type='text'
                      value={episode.title}
                      onChange={e =>
                        handleEpisodeChange(episode.id, 'title', e.target.value)
                      }
                      className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Sub Text*
                    </label>
                    <input
                      type='text'
                      value={episode.subText}
                      onChange={e =>
                        handleEpisodeChange(
                          episode.id,
                          'subText',
                          e.target.value
                        )
                      }
                      className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                    />
                  </div>
                </div>

                <div className='mt-4'>
                  <label className='mb-2 block text-sm font-medium text-gray-700'>
                    Episode Info*
                  </label>
                  <div className='rounded-lg border border-gray-200 bg-white text-gray-900'>
                    <TiptapEditor
                      content={episode.info}
                      onChange={content =>
                        handleEpisodeChange(episode.id, 'info', content)
                      }
                    />
                  </div>
                </div>

                <div className='mt-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Upload Video*
                    </label>
                    <div className='flex'>
                      <input
                        type='text'
                        readOnly
                        value={
                          typeof episode.video === 'string'
                            ? episode.video.split('/').pop()
                            : 'No video selected'
                        }
                        className='w-full rounded-l-lg border border-r-0 border-gray-200 bg-white p-3 text-sm text-gray-900 focus:outline-none'
                      />
                      <button
                        type='button'
                        onClick={openCropWithExisting}
                        className='rounded-r-lg border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200'
                      >
                        Browse / Crop
                      </button>
                    </div>
                    {episode.video && (
                      <div className='mt-3'>
                        <video
                          src={toImageSrc(episode.video)}
                          controls
                          className='max-h-48 w-full rounded-lg border border-gray-200 bg-black'
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Scheduled Date
                    </label>
                    <div className='flex gap-2'>
                      <input
                        type='datetime-local'
                        value={episode.scheduledDate}
                        onChange={e =>
                          handleEpisodeChange(
                            episode.id,
                            'scheduledDate',
                            e.target.value
                          )
                        }
                        className='w-full rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                      />

                      <button
                        onClick={() => removeEpisode(episode.id)}
                        className='flex h-[46px] w-[46px] items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:text-red-600'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addEpisode}
            className='mt-6 w-full rounded-lg border border-[#FF4400] py-3 text-sm font-medium text-[#FF4400] hover:bg-orange-50'
          >
            Add More
          </button>
        </div>
      </div>

      <Toast
        open={toast.open}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        onOpenChange={open => setToast(prev => ({ ...prev, open }))}
      />
      <ImageCropper
        open={cropOpen}
        file={rawImageFile}
        onClose={() => setCropOpen(false)}
        onCropped={handleCropped}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
            <div className='flex items-start gap-4'>
              <div className='rounded-full bg-red-100 p-2'>
                <AlertCircle className='h-6 w-6 text-red-600' />
              </div>
              <div>
                <h3 className='text-lg font-medium text-gray-900'>
                  Delete Episode?
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Are you sure you want to delete this episode? This action
                  cannot be undone.
                </p>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setEpisodeToDelete(null)
                }}
                disabled={deletingEpisode}
                className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEpisode}
                disabled={deletingEpisode}
                className='flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
              >
                {deletingEpisode && (
                  <Loader2 className='h-4 w-4 animate-spin' />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
