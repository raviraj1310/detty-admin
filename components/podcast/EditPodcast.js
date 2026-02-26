'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Trash2 } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'

export default function EditPodcast() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: 'Mind Over Hustle',
    about:
      'Fit Talk is a fitness and wellness podcast dedicated to helping people build healthier bodies and stronger minds. Each episode features certified trainers, nutritionists, and athletes sharing practical advice on workouts, recovery, and sustainable healthy living. The podcast focuses on realistic fitness routines, motivation, injury prevention, and nutrition strategies for beginners to advanced fitness enthusiasts.',
    episodeInfo:
      'Latest Episode: Fat Loss vs Muscle Gain – What Should You Focus On?\nRelease Date: January 2026\nDuration: 38 minutes\nSeason: Season 2\nEpisode: #64',
    category: 'Fitness',
    type: 'Video',
    duration: '2-4 hours (depending on selected challenge format)',
    episodeTime: 'Every Monday - 6:00 AM (GMT)',
    image: null
  })

  const [episodes, setEpisodes] = useState([
    {
      id: 1,
      number: '1',
      title: 'Fat Loss – What Should You Focus On?',
      subText:
        'Fit Talk is a fitness and wellness podcast dedicated to helping people build healthier',
      info: 'Latest Episode: Fat Loss vs Muscle Gain – What Should You Focus On?\nRelease Date: January 2026\nDuration: 38 minutes\nSeason: Season 2\nEpisode: #64',
      video: null,
      scheduledDate: '2026-06-05T06:00'
    },
    {
      id: 2,
      number: '2',
      title: 'Fat Loss – What Should You Focus On?',
      subText:
        'Fit Talk is a fitness and wellness podcast dedicated to helping people build healthier',
      info: 'Latest Episode: Fat Loss vs Muscle Gain – What Should You Focus On?\nRelease Date: January 2026\nDuration: 38 minutes\nSeason: Season 2\nEpisode: #64',
      video: null,
      scheduledDate: '2028-06-12T06:00'
    }
  ])

  const handleEpisodeChange = (id, field, value) => {
    setEpisodes(prev =>
      prev.map(ep => (ep.id === id ? { ...ep, [field]: value } : ep))
    )
  }

  const addEpisode = () => {
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
            <button className='rounded-lg border border-[#FF4400] px-4 py-2 text-sm font-medium text-[#FF4400] hover:bg-orange-50'>
              Edit Subscription Plans
            </button>
            <button className='rounded-lg bg-[#FF4400] px-6 py-2 text-sm font-medium text-white hover:bg-[#E63D00]'>
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
                  type='text'
                  readOnly
                  value='Image.jpg'
                  className='w-full rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 focus:outline-none'
                />
                <button className='rounded-r-lg border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200'>
                  Browse
                </button>
              </div>
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
                        value='Video.mp4'
                        className='w-full rounded-l-lg border border-r-0 border-gray-200 bg-white p-3 text-sm text-gray-900 focus:outline-none'
                      />
                      <button className='rounded-r-lg border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200'>
                        Browse
                      </button>
                    </div>
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
    </div>
  )
}
