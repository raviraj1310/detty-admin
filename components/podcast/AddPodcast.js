'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Trash2 } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import { createPodcast, addEpisode } from '@/services/podcast/podcast.service'
import Toast from '@/components/ui/Toast'
import ImageCropper from '@/components/ui/ImageCropper'
import { convertToWebp } from '@/src/utils/image'

export default function AddPodcast () {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const imageInputRef = useRef(null)

  const [cropOpen, setCropOpen] = useState(false)
  const [rawImageFile, setRawImageFile] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')

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
    type: '',
    duration: '',
    episodeTime: '',
    image: null
  })

  const [episodes, setEpisodes] = useState([
    {
      id: 1,
      number: '',
      title: '',
      subText: '',
      info: '',
      video: null,
      scheduledDate: ''
    }
  ])

  const handleImageChange = async e => {
    const file = e.target.files[0]
    if (file) {
      try {
        const { file: webpFile } = await convertToWebp(file)
        setFormData(prev => ({ ...prev, image: webpFile }))
        setImagePreviewUrl(URL.createObjectURL(webpFile))
        setRawImageFile(file)
      } catch (error) {
        console.error('Error converting image:', error)
        setFormData(prev => ({ ...prev, image: file }))
        setImagePreviewUrl(URL.createObjectURL(file))
        setRawImageFile(file)
      }
    }
  }

  const handleCropped = ({ file }) => {
    setFormData(prev => ({ ...prev, image: file }))
    setImagePreviewUrl(URL.createObjectURL(file))
    setCropOpen(false)
  }

  const handleEpisodeChange = (id, field, value) => {
    setEpisodes(prev =>
      prev.map(ep => (ep.id === id ? { ...ep, [field]: value } : ep))
    )
  }

  const handleEpisodeFileChange = (id, e) => {
    const file = e.target.files[0]
    if (file) {
      setEpisodes(prev =>
        prev.map(ep => (ep.id === id ? { ...ep, video: file } : ep))
      )
    }
  }

  const addEpisodeRow = () => {
    const newId =
      episodes.length > 0 ? Math.max(...episodes.map(e => e.id)) + 1 : 1
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
    setEpisodes(prev => prev.filter(ep => ep.id !== id))
  }

  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.category ||
      !formData.type ||
      !formData.image
    ) {
      setToast({
        open: true,
        title: 'Error',
        description:
          'Please fill in all required podcast fields including image',
        variant: 'error'
      })
      return
    }

    setLoading(true)
    try {
      // 1. Create Podcast
      const podcastPayload = new FormData()
      podcastPayload.append('title', formData.name)
      podcastPayload.append('about', formData.about)
      podcastPayload.append('episodeInfo', formData.episodeInfo)
      podcastPayload.append('podcastCategory', formData.category.toLowerCase())
      podcastPayload.append('podcastType', formData.type.toLowerCase())
      podcastPayload.append('duration', formData.duration)
      podcastPayload.append('episodeTime', formData.episodeTime)
      if (formData.image) {
        podcastPayload.append('image', formData.image)
      }

      console.log('Podcast Payload:', podcastPayload)
      for (const pair of podcastPayload.entries()) {
        console.log(`${pair[0]}:`, pair[1])
      }

      const podcastResponse = await createPodcast(podcastPayload)
      console.log('Podcast Response:', podcastResponse)

      // Assuming response structure, adjust if needed.
      const podcastId = podcastResponse?.data?._id || podcastResponse?._id

      if (!podcastId) {
        throw new Error('Failed to get podcast ID')
      }

      // 2. Add Episodes
      if (episodes.length > 0) {
        const episodesPayload = new FormData()
        episodes.forEach((ep, index) => {
          episodesPayload.append(`episodes[${index}][episodeNo]`, ep.number)
          episodesPayload.append(`episodes[${index}][title]`, ep.title)
          episodesPayload.append(`episodes[${index}][subText]`, ep.subText)
          episodesPayload.append(`episodes[${index}][episodeInfo]`, ep.info)
          episodesPayload.append(
            `episodes[${index}][scheduleDate]`,
            ep.scheduledDate
          )
          episodesPayload.append(`episodes[${index}][podcastId]`, podcastId)

          if (ep.video) {
            episodesPayload.append(`episodes[${index}][media]`, ep.video)
          }
        })

        // Debug episodes payload
        console.log('Episodes Payload:', episodesPayload)

        for (const pair of episodesPayload.entries()) {
          console.log(`${pair[0]}:`, pair[1])
        }

        await addEpisode(episodesPayload)
      }

      setToast({
        open: true,
        title: 'Success',
        description: 'Podcast and episodes created successfully',
        variant: 'success'
      })
      setTimeout(() => {
        router.push('/podcast')
      }, 1000)
    } catch (error) {
      console.error(error)
      setToast({
        open: true,
        title: 'Error',
        description: error?.response?.data?.message || 'Something went wrong',
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
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
              onClick={handleSubmit}
              disabled={loading}
              className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#E63D00] disabled:opacity-50'
            >
              {loading ? 'Adding...' : 'Add'}
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
                <option value='' disabled>
                  Select Category
                </option>
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
                <option value='' disabled>
                  Select Type
                </option>
                <option value='Video'>Video</option>
                <option value='Audio'>Audio</option>
              </select>
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Duration (minutes)*
              </label>
              <input
                type='number'
                value={formData.duration}
                onChange={e =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='e.g. 45'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Episode Time (minutes)*
              </label>
              <input
                type='number'
                value={formData.episodeTime}
                onChange={e =>
                  setFormData({ ...formData, episodeTime: e.target.value })
                }
                className='w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-[#FF4400] focus:outline-none'
                placeholder='e.g. 210'
              />
            </div>

            <div>
              <label className='mb-2 block text-sm font-medium text-gray-700'>
                Upload Image*
              </label>
              <div
                className='flex cursor-pointer'
                onClick={() => imageInputRef.current.click()}
              >
                <div className='w-full rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap'>
                  {formData.image ? formData.image.name : 'Choose Image'}
                </div>
                <button className='rounded-r-lg border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200'>
                  Browse
                </button>
              </div>
              <input
                type='file'
                ref={imageInputRef}
                onChange={handleImageChange}
                className='hidden'
                accept='image/*'
              />
              {imagePreviewUrl && (
                <div className='mt-3 relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 group'>
                  <img
                    src={imagePreviewUrl}
                    alt='Preview'
                    className='w-full h-full object-cover'
                  />
                  <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setCropOpen(true)
                      }}
                      className='bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100'
                    >
                      Crop Image
                    </button>
                  </div>
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
                    <div className='relative'>
                      <div className='flex'>
                        <div className='w-full rounded-l-lg border border-r-0 border-gray-200 bg-white p-3 text-sm text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap'>
                          {episode.video
                            ? episode.video.name
                            : 'Choose Video/File'}
                        </div>
                        <button className='rounded-r-lg border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200 whitespace-nowrap'>
                          Browse
                        </button>
                      </div>
                      <input
                        type='file'
                        onChange={e => handleEpisodeFileChange(episode.id, e)}
                        className='absolute inset-0 opacity-0 cursor-pointer'
                        accept='video/*,application/pdf,audio/*'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                      Scheduled Date
                    </label>
                    <div className='flex gap-2'>
                      <input
                        type='date'
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
            onClick={addEpisodeRow}
            className='mt-6 w-full rounded-lg border border-[#FF4400] py-3 text-sm font-medium text-[#FF4400] hover:bg-orange-50'
          >
            Add More
          </button>
        </div>
      </div>
      <Toast
        open={toast.open}
        onOpenChange={open => setToast(prev => ({ ...prev, open }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
      />
      <ImageCropper
        open={cropOpen}
        file={rawImageFile}
        onClose={() => setCropOpen(false)}
        onCropped={handleCropped}
      />
    </div>
  )
}
