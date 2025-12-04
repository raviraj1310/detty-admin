'use client'

import { useRef, useState, useEffect } from 'react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import {
  getPartnerWithUs,
  createUpdatePartnerWithUs
} from '@/services/cms/partner.service'
import Toast from '@/components/ui/Toast'
import { getAllEvents } from '@/services/discover-events/event.service'
import { getAllActivities } from '@/services/places-to-visit/placesToVisit.service'
import { getAllTickets } from '@/services/tickets/ticket.service'
import { getAllActivityTickets } from '@/services/tickets/placesToVisitTicket.service'

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_SIM_IMAGE_BASE_ORIGIN

export default function PartnerWithUsForm () {
  const fileRefs = useRef({})
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    // Banner Section
    bannerSectionTitle: '',
    bannerSectionTitle2: '',
    bannerSectionDetail: '',
    bannerCTAText: '',
    bannerCTALink: '',
    bannerSectionImage1: '',
    bannerSectionImage2: '',
    bannerSectionImage3: '',
    bannerSectionImage4: '',

    // Promo Section
    promoSectionTitle: '',
    promoSectionImage: '',
    promoSectionCTAText: '',
    promoSectionCTALink: '',
    promoSectionType: 'event',
    promoSectionEventId: '',
    promoSectionActivityId: '',

    // Steps Section
    stepTitle1: '',
    stepDescription1: '',
    stepImage1: '',
    stepTitle2: '',
    stepDescription2: '',
    stepImage2: '',
    stepTitle3: '',
    stepDescription3: '',
    stepImage3: '',
    stepTitle4: '',
    stepDescription4: '',
    stepImage4: '',

    // Why Partner With Us Section
    whyPartnerSectionTitle1: '',
    whyPartnerSectionTitle2: '',
    whyPartnerSectionDescription: '',
    whyPartnerSectionImage: '',
    whyPartnerSectionCartTitle1: '',
    whyPartnerSectionCardDescription1: '',
    whyPartnerSectionCartTitle2: '',
    whyPartnerSectionCardDescription2: '',
    whyPartnerSectionCartTitle3: '',
    whyPartnerSectionCardDescription3: '',

    // Vendor Section
    vendorSectionTitle1: '',
    vendorSectionTitle2: '',
    vendorSectionDescription: '',
    vendorSectionImages: [],

    // Become Vendor Section
    BecomeVendorTitle1: '',
    BecomeVendorTitle2: '',
    BecomeVendorDescription: '',
    BecomeVendorCTAText: '',
    BecomeVendorCTALink: '',
    BecomeVendorImage: ''
  })

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [imageFiles, setImageFiles] = useState({}) // Store actual file objects
  const [imagePreviews, setImagePreviews] = useState({}) // Store image preview URLs
  const [events, setEvents] = useState([])
  const [activities, setActivities] = useState([])
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })

  const sanitizeImageUrl = input => {
    if (typeof input !== 'string') return null
    let s = input.trim().replace(/`/g, '')
    s = s.replace(/^['"]/g, '').replace(/['"]$/g, '')
    s = s.replace(/^\(+/, '').replace(/\)+$/, '')
    if (!s) return null
    const looksAbsolute = /^https?:\/\//i.test(s)
    const looksRootRelative = s.startsWith('/')
    const origin = String(IMAGE_BASE_URL || '').replace(/\/+$/, '')
    if (looksAbsolute) return s
    if (looksRootRelative) return origin + s
    return origin + '/' + s.replace(/^\/+/, '')
  }

  const buildDettyFusionUrl = (type, id) => {
    const base = 'https://dettyfusion.accessbankplc.com'
    const cleanId = String(id || '').trim()
    if (!cleanId) return ''
    return type === 'activity' ? `${base}/tour/${cleanId}` : `${base}/event/${cleanId}`
  }

  const formatCurrency = n => {
    const num = typeof n === 'number' ? n : Number(String(n || '').replace(/[^0-9.]/g, ''))
    if (!num || isNaN(num)) return ''
    return `₦${num.toLocaleString()}`
  }

  const isEmptyEditorContent = s => {
    const html = String(s || '')
    if (!html.trim()) return true
    const stripped = html
      .replace(/<br\s*\/>/gi, '')
      .replace(/<br>/gi, '')
      .replace(/&nbsp;/gi, '')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '')
      .trim()
    return stripped.length === 0
  }

  const fetchMinEventPrice = async eventId => {
    try {
      const res = await getAllTickets({ eventId })
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      const prices = list
        .map(t => Number(String(t?.perTicketPrice ?? '').replace(/[^0-9.]/g, '')))
        .filter(v => !isNaN(v) && v > 0)
      return prices.length ? Math.min(...prices) : null
    } catch {
      return null
    }
  }

  const fetchMinActivityPrice = async activityId => {
    try {
      const res = await getAllActivityTickets({ activityId })
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      const prices = list
        .map(t => Number(String(t?.perTicketPrice ?? '').replace(/[^0-9.]/g, '')))
        .filter(v => !isNaN(v) && v > 0)
      return prices.length ? Math.min(...prices) : null
    } catch {
      return null
    }
  }

  const resolvePromoTitle = (tpl, name, priceStr) => {
    let s = String(tpl || '')
    if (!s) return s
    s = s.replace(/\{NAME\}/g, String(name || ''))
    s = s.replace(/\{PRICE\}/g, String(priceStr || ''))
    return s
  }

  const updateTitleWithNameAndPrice = (current, name, priceStr) => {
    let s = String(current || '')

    if (name) {
      if (/\{NAME\}/.test(s)) {
        s = s.replace(/\{NAME\}/g, String(name))
      } else if (/&quot;[\s\S]*?&quot;/.test(s)) {
        s = s.replace(/&quot;[\s\S]*?&quot;/, `&quot;${name}&quot;`)
      } else if (/"[\s\S]*?"/.test(s)) {
        s = s.replace(/"[\s\S]*?"/, `"${name}"`)
      } else if (/“[\s\S]*?”/.test(s)) {
        s = s.replace(/“[\s\S]*?”/, `“${name}”`)
      } else if (s.includes('&quot;&quot;')) {
        s = s.replace('&quot;&quot;', `&quot;${name}&quot;`)
      } else if (s.includes('""')) {
        s = s.replace('""', `"${name}"`)
      } else if (/for the\s*$/i.test(s)) {
        s = s.replace(/for the\s*$/i, match => `${match}"${name}"`)
      } else {
        s = `${s}${s.trim() ? ' ' : ''}"${name}"`
      }
    }

    if (priceStr && /\{PRICE\}/.test(s)) {
      s = s.replace(/\{PRICE\}/g, String(priceStr))
    }
    return s
  }

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getPartnerWithUs()
        const data = response?.data || {}

        if (data) {
          setFormData({
            bannerSectionTitle: data.bannerSectionTitle || '',
            bannerSectionTitle2: data.bannerSectionTitle2 || '',
            bannerSectionDetail: data.bannerSectionDetail || '',
            bannerCTAText: data.bannerCTAText || '',
            bannerCTALink: data.bannerCTALink || '',
            bannerSectionImage1: data.bannerSectionImage1 || '',
            bannerSectionImage2: data.bannerSectionImage2 || '',
            bannerSectionImage3: data.bannerSectionImage3 || '',
            bannerSectionImage4: data.bannerSectionImage4 || '',
            promoSectionTitle: data.promoSectionTitle || '',
            promoSectionImage: data.promoSectionImage || '',
            promoSectionCTAText: data.promoSectionCTAText || '',
            promoSectionCTALink: data.promoSectionCTALink || '',
            promoSectionType: data.promoSectionType || 'event',
            promoSectionEventId: data.promoSectionEventId || '',
            promoSectionActivityId: data.promoSectionActivityId || '',
            stepTitle1: data.stepTitle1 || '',
            stepDescription1: data.stepDescription1 || '',
            stepImage1: data.stepImage1 || '',
            stepTitle2: data.stepTitle2 || '',
            stepDescription2: data.stepDescription2 || '',
            stepImage2: data.stepImage2 || '',
            stepTitle3: data.stepTitle3 || '',
            stepDescription3: data.stepDescription3 || '',
            stepImage3: data.stepImage3 || '',
            stepTitle4: data.stepTitle4 || '',
            stepDescription4: data.stepDescription4 || '',
            stepImage4: data.stepImage4 || '',
            whyPartnerSectionTitle1: data.whyPartnerSectionTitle1 || '',
            whyPartnerSectionTitle2: data.whyPartnerSectionTitle2 || '',
            whyPartnerSectionDescription:
              data.whyPartnerSectionDescription || '',
            whyPartnerSectionImage: data.whyPartnerSectionImage || '',
            whyPartnerSectionCartTitle1: data.whyPartnerSectionCartTitle1 || '',
            whyPartnerSectionCardDescription1:
              data.whyPartnerSectionCardDescription1 || '',
            whyPartnerSectionCartTitle2: data.whyPartnerSectionCartTitle2 || '',
            whyPartnerSectionCardDescription2:
              data.whyPartnerSectionCardDescription2 || '',
            whyPartnerSectionCartTitle3: data.whyPartnerSectionCartTitle3 || '',
            whyPartnerSectionCardDescription3:
              data.whyPartnerSectionCardDescription3 || '',
            vendorSectionTitle1: data.vendorSectionTitle1 || '',
            vendorSectionTitle2: data.vendorSectionTitle2 || '',
            vendorSectionDescription: data.vendorSectionDescription || '',
            vendorSectionImages: data.vendorSectionImages || [],
            BecomeVendorTitle1: data.BecomeVendorTitle1 || '',
            BecomeVendorTitle2: data.BecomeVendorTitle2 || '',
            BecomeVendorDescription: data.BecomeVendorDescription || '',
            BecomeVendorCTAText: data.BecomeVendorCTAText || '',
            BecomeVendorCTALink: data.BecomeVendorCTALink || '',
            BecomeVendorImage: data.BecomeVendorImage || ''
          })

          // Set image previews for existing images
          const previews = {}
          if (data.bannerSectionImage1)
            previews.bannerSectionImage1 =
              IMAGE_BASE_URL + data.bannerSectionImage1
          if (data.bannerSectionImage2)
            previews.bannerSectionImage2 =
              IMAGE_BASE_URL + data.bannerSectionImage2
          if (data.bannerSectionImage3)
            previews.bannerSectionImage3 =
              IMAGE_BASE_URL + data.bannerSectionImage3
          if (data.bannerSectionImage4)
            previews.bannerSectionImage4 =
              IMAGE_BASE_URL + data.bannerSectionImage4
          if (data.promoSectionImage)
            previews.promoSectionImage = IMAGE_BASE_URL + data.promoSectionImage
          if (data.stepImage1)
            previews.stepImage1 = IMAGE_BASE_URL + data.stepImage1
          if (data.stepImage2)
            previews.stepImage2 = IMAGE_BASE_URL + data.stepImage2
          if (data.stepImage3)
            previews.stepImage3 = IMAGE_BASE_URL + data.stepImage3
          if (data.stepImage4)
            previews.stepImage4 = IMAGE_BASE_URL + data.stepImage4
          if (data.whyPartnerSectionImage)
            previews.whyPartnerSectionImage =
              IMAGE_BASE_URL + data.whyPartnerSectionImage
          if (data.BecomeVendorImage)
            previews.BecomeVendorImage = IMAGE_BASE_URL + data.BecomeVendorImage

          // Set vendor image previews
          if (
            data.vendorSectionImages &&
            Array.isArray(data.vendorSectionImages)
          ) {
            data.vendorSectionImages.forEach((vendor, index) => {
              if (vendor.image) {
                previews[`vendorImage${index}`] = IMAGE_BASE_URL + vendor.image
              }
            })
          }

          setImagePreviews(previews)
        }
      } catch (error) {
        console.error('Error fetching partner with us data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const loadLists = async () => {
      try {
        const evRes = await getAllEvents()
        const evList = Array.isArray(evRes?.data)
          ? evRes.data
          : Array.isArray(evRes)
          ? evRes
          : []
        setEvents(evList)
      } catch {}
      try {
        const actRes = await getAllActivities()
        const actList = Array.isArray(actRes?.data)
          ? actRes.data
          : Array.isArray(actRes)
          ? actRes
          : []
        setActivities(actList)
      } catch {}
    }
    loadLists()
  }, [])

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [imagePreviews])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateImage = file => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/avif'
    ]
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes

    if (!file) {
      return 'Please select an image file'
    }

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, JPEG, PNG, WEBP, and AVIF files are allowed'
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 2MB'
    }

    return ''
  }

  const handleImageChange = (field, event) => {
    const file = event.target.files[0]

    if (file) {
      const error = validateImage(file)

      setErrors(prev => ({ ...prev, [field]: error }))

      if (!error) {
        handleChange(field, file.name)
        setImageFiles(prev => ({ ...prev, [field]: file }))

        // Create preview URL for the selected file
        const previewUrl = URL.createObjectURL(file)
        setImagePreviews(prev => {
          // Revoke old preview URL if it exists and is a blob URL
          if (prev[field] && prev[field].startsWith('blob:')) {
            URL.revokeObjectURL(prev[field])
          }
          return { ...prev, [field]: previewUrl }
        })

        console.log('Valid image selected:', file.name)
      } else {
        event.target.value = ''
      }
    }
  }

  const validateForm = () => {
    const e = {}
    const requiredFields = [
      'bannerSectionTitle',
      'bannerSectionTitle2',
      'bannerSectionDetail',
      'bannerCTAText',
      'bannerCTALink',
      'promoSectionTitle',
      'promoSectionCTAText',
      'promoSectionCTALink',
      'stepTitle1',
      'stepDescription1',
      'stepTitle2',
      'stepDescription2',
      'stepTitle3',
      'stepDescription3',
      'stepTitle4',
      'stepDescription4',
      'whyPartnerSectionTitle1',
      'whyPartnerSectionTitle2',
      'whyPartnerSectionDescription',
      'whyPartnerSectionCartTitle1',
      'whyPartnerSectionCardDescription1',
      'whyPartnerSectionCartTitle2',
      'whyPartnerSectionCardDescription2',
      'whyPartnerSectionCartTitle3',
      'whyPartnerSectionCardDescription3',
      'vendorSectionTitle1',
      'vendorSectionTitle2',
      'vendorSectionDescription',
      'BecomeVendorTitle1',
      'BecomeVendorTitle2',
      'BecomeVendorDescription',
      'BecomeVendorCTAText',
      'BecomeVendorCTALink'
    ]

    requiredFields.forEach(field => {
      const value = formData[field]
      if (!value || (typeof value === 'string' && !value.trim())) {
        e[field] = 'Required'
      }
    })

    // Validate event/activity selection based on type
    if (formData.promoSectionType === 'event') {
      if (!formData.promoSectionEventId || !formData.promoSectionEventId.trim()) {
        e.promoSectionEventId = 'Please select an event'
      }
    } else if (formData.promoSectionType === 'activity') {
      if (!formData.promoSectionActivityId || !formData.promoSectionActivityId.trim()) {
        e.promoSectionActivityId = 'Please select an activity'
      }
    }

    // Validate URLs
    const urlFields = [
      'bannerCTALink',
      'promoSectionCTALink',
      'BecomeVendorCTALink'
    ]
    urlFields.forEach(field => {
      const value = String(formData[field] || '').trim()
      if (value && !/^https?:\/\//i.test(value) && !value.startsWith('/')) {
        e[field] = 'Enter a valid URL or path'
      }
    })

    return e
  }

  const toPayload = () => {
    const formDataPayload = new FormData()

    // Append slug
    formDataPayload.append('slug', 'become-a-partner')

    // Banner Section
    formDataPayload.append(
      'bannerSectionTitle',
      String(formData.bannerSectionTitle || '').trim()
    )
    formDataPayload.append(
      'bannerSectionTitle2',
      String(formData.bannerSectionTitle2 || '').trim()
    )
    formDataPayload.append(
      'bannerSectionDetail',
      String(formData.bannerSectionDetail || '').trim()
    )
    formDataPayload.append(
      'bannerCTAText',
      String(formData.bannerCTAText || '').trim()
    )
    formDataPayload.append(
      'bannerCTALink',
      String(formData.bannerCTALink || '').trim()
    )

    // Append banner images (files or empty strings)
    if (imageFiles.bannerSectionImage1) {
      formDataPayload.append(
        'bannerSectionImage1',
        imageFiles.bannerSectionImage1
      )
    } else {
      formDataPayload.append(
        'bannerSectionImage1',
        String(formData.bannerSectionImage1 || '').trim()
      )
    }
    if (imageFiles.bannerSectionImage2) {
      formDataPayload.append(
        'bannerSectionImage2',
        imageFiles.bannerSectionImage2
      )
    } else {
      formDataPayload.append(
        'bannerSectionImage2',
        String(formData.bannerSectionImage2 || '').trim()
      )
    }
    if (imageFiles.bannerSectionImage3) {
      formDataPayload.append(
        'bannerSectionImage3',
        imageFiles.bannerSectionImage3
      )
    } else {
      formDataPayload.append(
        'bannerSectionImage3',
        String(formData.bannerSectionImage3 || '').trim()
      )
    }
    if (imageFiles.bannerSectionImage4) {
      formDataPayload.append(
        'bannerSectionImage4',
        imageFiles.bannerSectionImage4
      )
    } else {
      formDataPayload.append(
        'bannerSectionImage4',
        String(formData.bannerSectionImage4 || '').trim()
      )
    }

    // Promo Section
    formDataPayload.append(
      'promoSectionTitle',
      String(formData.promoSectionTitle || '').trim()
    )
    if (imageFiles.promoSectionImage) {
      formDataPayload.append('promoSectionImage', imageFiles.promoSectionImage)
    } else {
      formDataPayload.append(
        'promoSectionImage',
        String(formData.promoSectionImage || '').trim()
      )
    }
    formDataPayload.append(
      'promoSectionCTAText',
      String(formData.promoSectionCTAText || '').trim()
    )
    formDataPayload.append(
      'promoSectionCTALink',
      String(formData.promoSectionCTALink || '').trim()
    )
    formDataPayload.append(
      'promoSectionType',
      String(formData.promoSectionType || 'event').trim()
    )
    formDataPayload.append(
      'promoSectionEventId',
      String(formData.promoSectionEventId || '').trim()
    )
    formDataPayload.append(
      'promoSectionActivityId',
      String(formData.promoSectionActivityId || '').trim()
    )

    // Steps Section
    formDataPayload.append(
      'stepTitle1',
      String(formData.stepTitle1 || '').trim()
    )
    formDataPayload.append(
      'stepDescription1',
      String(formData.stepDescription1 || '').trim()
    )
    if (imageFiles.stepImage1) {
      formDataPayload.append('stepImage1', imageFiles.stepImage1)
    } else {
      formDataPayload.append(
        'stepImage1',
        String(formData.stepImage1 || '').trim()
      )
    }
    formDataPayload.append(
      'stepTitle2',
      String(formData.stepTitle2 || '').trim()
    )
    formDataPayload.append(
      'stepDescription2',
      String(formData.stepDescription2 || '').trim()
    )
    if (imageFiles.stepImage2) {
      formDataPayload.append('stepImage2', imageFiles.stepImage2)
    } else {
      formDataPayload.append(
        'stepImage2',
        String(formData.stepImage2 || '').trim()
      )
    }
    formDataPayload.append(
      'stepTitle3',
      String(formData.stepTitle3 || '').trim()
    )
    formDataPayload.append(
      'stepDescription3',
      String(formData.stepDescription3 || '').trim()
    )
    if (imageFiles.stepImage3) {
      formDataPayload.append('stepImage3', imageFiles.stepImage3)
    } else {
      formDataPayload.append(
        'stepImage3',
        String(formData.stepImage3 || '').trim()
      )
    }
    formDataPayload.append(
      'stepTitle4',
      String(formData.stepTitle4 || '').trim()
    )
    formDataPayload.append(
      'stepDescription4',
      String(formData.stepDescription4 || '').trim()
    )
    if (imageFiles.stepImage4) {
      formDataPayload.append('stepImage4', imageFiles.stepImage4)
    } else {
      formDataPayload.append(
        'stepImage4',
        String(formData.stepImage4 || '').trim()
      )
    }

    // Why Partner Section
    formDataPayload.append(
      'whyPartnerSectionTitle1',
      String(formData.whyPartnerSectionTitle1 || '').trim()
    )
    formDataPayload.append(
      'whyPartnerSectionTitle2',
      String(formData.whyPartnerSectionTitle2 || '').trim()
    )
    formDataPayload.append(
      'whyPartnerSectionDescription',
      String(formData.whyPartnerSectionDescription || '').trim()
    )
    if (imageFiles.whyPartnerSectionImage) {
      formDataPayload.append(
        'whyPartnerSectionImage',
        imageFiles.whyPartnerSectionImage
      )
    } else {
      formDataPayload.append(
        'whyPartnerSectionImage',
        String(formData.whyPartnerSectionImage || '').trim()
      )
    }
    formDataPayload.append(
      'whyPartnerSectionCartTitle1',
      String(formData.whyPartnerSectionCartTitle1 || '').trim()
    )
    formDataPayload.append(
      'whyPartnerSectionCardDescription1',
      String(formData.whyPartnerSectionCardDescription1 || '').trim()
    )
    formDataPayload.append(
      'whyPartnerSectionCartTitle2',
      String(formData.whyPartnerSectionCartTitle2 || '').trim()
    )
    formDataPayload.append(
      'whyPartnerSectionCardDescription2',
      String(formData.whyPartnerSectionCardDescription2 || '').trim()
    )
    formDataPayload.append(
      'whyPartnerSectionCartTitle3',
      String(formData.whyPartnerSectionCartTitle3 || '').trim()
    )
    formDataPayload.append(
      'whyPartnerSectionCardDescription3',
      String(formData.whyPartnerSectionCardDescription3 || '').trim()
    )

    // Vendor Section
    formDataPayload.append(
      'vendorSectionTitle1',
      String(formData.vendorSectionTitle1 || '').trim()
    )
    formDataPayload.append(
      'vendorSectionTitle2',
      String(formData.vendorSectionTitle2 || '').trim()
    )
    formDataPayload.append(
      'vendorSectionDescription',
      String(formData.vendorSectionDescription || '').trim()
    )

    // Handle vendorSectionImages array
    if (
      Array.isArray(formData.vendorSectionImages) &&
      formData.vendorSectionImages.length > 0
    ) {
      // Append vendor image files
      formData.vendorSectionImages.forEach((vendor, index) => {
        if (imageFiles[`vendorImage${index}`]) {
          formDataPayload.append(
            `vendorImage${index}`,
            imageFiles[`vendorImage${index}`]
          )
        }
      })

      // Append vendor data as JSON
      formDataPayload.append(
        'vendorSectionImages',
        JSON.stringify(
          formData.vendorSectionImages.map((img, index) => ({
            image: imageFiles[`vendorImage${index}`]
              ? ''
              : String(img.image || '').trim(),
            text: String(img.text || '').trim()
          }))
        )
      )
    } else {
      formDataPayload.append('vendorSectionImages', JSON.stringify([]))
    }

    // Become Vendor Section
    formDataPayload.append(
      'BecomeVendorTitle1',
      String(formData.BecomeVendorTitle1 || '').trim()
    )
    formDataPayload.append(
      'BecomeVendorTitle2',
      String(formData.BecomeVendorTitle2 || '').trim()
    )
    formDataPayload.append(
      'BecomeVendorDescription',
      String(formData.BecomeVendorDescription || '').trim()
    )
    formDataPayload.append(
      'BecomeVendorCTAText',
      String(formData.BecomeVendorCTAText || '').trim()
    )
    formDataPayload.append(
      'BecomeVendorCTALink',
      String(formData.BecomeVendorCTALink || '').trim()
    )
    if (imageFiles.BecomeVendorImage) {
      formDataPayload.append('BecomeVendorImage', imageFiles.BecomeVendorImage)
    } else {
      formDataPayload.append(
        'BecomeVendorImage',
        String(formData.BecomeVendorImage || '').trim()
      )
    }

    return formDataPayload
  }

  const handleSave = async () => {
    const validationErrors = validateForm()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setToast({
        open: true,
        title: 'Validation Failed',
        description: 'Please fix the highlighted fields',
        variant: 'error'
      })
      return
    }

    try {
      setSaving(true)
      const payload = toPayload()
      const response = await createUpdatePartnerWithUs(payload)

      setToast({
        open: true,
        title: 'Success',
        description:
          response?.message || 'Partner With Us data saved successfully!',
        variant: 'success'
      })
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save data. Please try again.'
      setToast({
        open: true,
        title: 'Error',
        description: errorMessage,
        variant: 'error'
      })
      console.error('Error saving partner with us data:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className='p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 bg-white'>
        <div className='flex items-center justify-center h-64'>
          <p className='text-gray-500'>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 bg-white'>
      {/* Header */}
      <div className='mb-4'>
        <h1 className='text-3xl font-bold text-gray-900'>Partner With Us</h1>
        <p className='text-sm text-gray-500 mt-1'>Dashboard / CMS</p>
      </div>

      <div className='bg-gray-200 p-6 rounded-xl'>
        {/* Form Card */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-6'>
            {/* Header with Save Button */}
            <div className='flex justify-between items-center mb-4 border-b p-2 border-gray-300'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Partner With Us Detail
              </h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className='px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* Banner Section */}
            <div className='mb-8'>
              <div className='bg-gray-900 text-white px-4 py-2 rounded-t-lg inline-block mb-4'>
                <h3 className='font-medium'>Banner Section</h3>
              </div>

              {/* Section Title and Title in one row */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Section Title<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.bannerSectionTitle}
                    onChange={e =>
                      handleChange('bannerSectionTitle', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.bannerSectionTitle
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.bannerSectionTitle && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.bannerSectionTitle}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Title 2<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.bannerSectionTitle2}
                    onChange={e =>
                      handleChange('bannerSectionTitle2', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.bannerSectionTitle2
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.bannerSectionTitle2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.bannerSectionTitle2}
                    </p>
                  )}
                </div>
              </div>

              {/* Description with Rich Text Editor */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description<span className='text-red-500'>*</span>
                </label>
                <div
                  className={`${
                    errors.bannerSectionDetail
                      ? 'border-2 border-red-500 rounded-lg'
                      : ''
                  }`}
                >
                  <TiptapEditor
                    content={formData.bannerSectionDetail}
                    onChange={html => handleChange('bannerSectionDetail', html)}
                    placeholder='Enter banner description...'
                    minHeight='80px'
                  />
                </div>
                {errors.bannerSectionDetail && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.bannerSectionDetail}
                  </p>
                )}
              </div>

              {/* CTA Text, CTA Link, Upload Banner Image 1 in one row */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    CTA Text<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.bannerCTAText}
                    onChange={e =>
                      handleChange('bannerCTAText', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.bannerCTAText
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.bannerCTAText && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.bannerCTAText}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    CTA Link<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.bannerCTALink}
                    onChange={e =>
                      handleChange('bannerCTALink', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.bannerCTALink
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.bannerCTALink && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.bannerCTALink}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Banner Image 1<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() =>
                      fileRefs.current.bannerSectionImage1?.click()
                    }
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span
                        className='truncate'
                        title={formData.bannerSectionImage1}
                      >
                        {formData.bannerSectionImage1 || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() =>
                        fileRefs.current.bannerSectionImage1?.click()
                      }
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.bannerSectionImage1 = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('bannerSectionImage1', e)}
                  />
                  {errors.bannerSectionImage1 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.bannerSectionImage1}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.bannerSectionImage1 && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.bannerSectionImage1}
                        alt='Banner Image 1 Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Banner Images 2, 3, 4 in one row */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Banner Image 2<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() =>
                      fileRefs.current.bannerSectionImage2?.click()
                    }
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span
                        className='truncate'
                        title={formData.bannerSectionImage2}
                      >
                        {formData.bannerSectionImage2 || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() =>
                        fileRefs.current.bannerSectionImage2?.click()
                      }
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.bannerSectionImage2 = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('bannerSectionImage2', e)}
                  />
                  {errors.bannerSectionImage2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.bannerSectionImage2}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.bannerSectionImage2 && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.bannerSectionImage2}
                        alt='Banner Image 2 Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Banner Image 3<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() =>
                      fileRefs.current.bannerSectionImage3?.click()
                    }
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span
                        className='truncate'
                        title={formData.bannerSectionImage3}
                      >
                        {formData.bannerSectionImage3 || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() =>
                        fileRefs.current.bannerSectionImage3?.click()
                      }
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.bannerSectionImage3 = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('bannerSectionImage3', e)}
                  />
                  {errors.bannerSectionImage3 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.bannerSectionImage3}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.bannerSectionImage3 && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.bannerSectionImage3}
                        alt='Banner Image 3 Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Banner Image 4<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() =>
                      fileRefs.current.bannerSectionImage4?.click()
                    }
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span
                        className='truncate'
                        title={formData.bannerSectionImage4}
                      >
                        {formData.bannerSectionImage4 || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() =>
                        fileRefs.current.bannerSectionImage4?.click()
                      }
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.bannerSectionImage4 = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('bannerSectionImage4', e)}
                  />
                  {errors.bannerSectionImage4 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.bannerSectionImage4}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.bannerSectionImage4 && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.bannerSectionImage4}
                        alt='Banner Image 4 Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Promo Section */}
            <div className='pt-6 pb-6'>
              <div className='bg-gray-900 text-white px-4 py-2 rounded-t-lg inline-block mb-4'>
                <h3 className='font-medium'>Promo Section</h3>
              </div>

 <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Select Type
                </label>
                <div className='flex items-center gap-6'>
                  <label className='inline-flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='promoSectionType'
                      value='event'
                      checked={formData.promoSectionType === 'event'}
                      onChange={() => {
                        handleChange('promoSectionType', 'event')
                        handleChange('promoSectionActivityId', '')
                      }}
                    />
                    <span className='text-sm text-gray-800'>Event</span>
                  </label>
                  <label className='inline-flex items-center gap-2 cursor-pointer'>
                    <input
                      type='radio'
                      name='promoSectionType'
                      value='activity'
                      checked={formData.promoSectionType === 'activity'}
                      onChange={() => {
                        handleChange('promoSectionType', 'activity')
                        handleChange('promoSectionEventId', '')
                      }}
                    />
                    <span className='text-sm text-gray-800'>Activity</span>
                  </label>
                </div>
              </div>
              <div className='md:col-span-2'>
                {formData.promoSectionType === 'event' ? (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Event
                    </label>
                    <select
                      value={formData.promoSectionEventId}
                      onChange={async e => {
                        const id = e.target.value
                        handleChange('promoSectionEventId', id)
                        const found = (events || []).find(ev => String(ev._id || ev.id || '') === String(id)) || null
                        const name = found ? (found.eventName || found.name || '') : ''
                        const img = found ? sanitizeImageUrl(found.image) : ''
                        const minPrice = id ? await fetchMinEventPrice(id) : null
                        const priceStr = minPrice != null ? formatCurrency(minPrice) : ''
                        const raw = String(formData.promoSectionTitle || '')
                        const hasTokens = /\{NAME\}|\{PRICE\}/.test(raw)
                        if (isEmptyEditorContent(raw) && name) {
                          const next = `"${name}"`
                          handleChange('promoSectionTitle', next)
                        } else {
                          const next = hasTokens
                            ? resolvePromoTitle(raw, name, priceStr)
                            : updateTitleWithNameAndPrice(raw, name, priceStr)
                          if (next !== raw) handleChange('promoSectionTitle', next)
                        }
                        if (img) {
                          handleChange('promoSectionImage', found.image || '')
                          setImageFiles(prev => ({ ...prev, promoSectionImage: undefined }))
                          setImagePreviews(prev => ({ ...prev, promoSectionImage: img }))
                        }
                        const link = buildDettyFusionUrl('event', id)
                        if (link) handleChange('promoSectionCTALink', link)
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                        errors.promoSectionEventId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value=''>Select an event</option>
                      {events.map(ev => {
                        const id = ev._id || ev.id || ''
                        const name = ev.eventName || ev.name || 'Unnamed Event'
                        return (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        )
                      })}
                    </select>
                    {errors.promoSectionEventId && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.promoSectionEventId}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Activity
                    </label>
                    <select
                      value={formData.promoSectionActivityId}
                      onChange={async e => {
                        const id = e.target.value
                        handleChange('promoSectionActivityId', id)
                        const found = (activities || []).find(a => String(a._id || a.id || '') === String(id)) || null
                        const name = found ? (found.activityName || found.name || '') : ''
                        const img = found ? sanitizeImageUrl(found.image) : ''
                        const minPrice = id ? await fetchMinActivityPrice(id) : null
                        const priceStr = minPrice != null ? formatCurrency(minPrice) : ''
                        const raw = String(formData.promoSectionTitle || '')
                        const hasTokens = /\{NAME\}|\{PRICE\}/.test(raw)
                        if (isEmptyEditorContent(raw) && name) {
                          const next = `"${name}"`
                          handleChange('promoSectionTitle', next)
                        } else {
                          const next = hasTokens
                            ? resolvePromoTitle(raw, name, priceStr)
                            : updateTitleWithNameAndPrice(raw, name, priceStr)
                          if (next !== raw) handleChange('promoSectionTitle', next)
                        }
                        if (img) {
                          handleChange('promoSectionImage', found.image || '')
                          setImageFiles(prev => ({ ...prev, promoSectionImage: undefined }))
                          setImagePreviews(prev => ({ ...prev, promoSectionImage: img }))
                        }
                        const link = buildDettyFusionUrl('activity', id)
                        if (link) handleChange('promoSectionCTALink', link)
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                        errors.promoSectionActivityId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value=''>Select an activity</option>
                      {activities.map(act => {
                        const id = act._id || act.id || ''
                        const name = act.activityName || act.name || 'Unnamed Activity'
                        return (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        )
                      })}
                    </select>
                    {errors.promoSectionActivityId && (
                      <p className='text-red-500 text-sm mt-1'>
                        {errors.promoSectionActivityId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

              {/* Promo Title with Rich Text Editor */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Title<span className='text-red-500'>*</span>
                </label>
                <div
                  className={`${
                    errors.promoSectionTitle
                      ? 'border-2 border-red-500 rounded-lg'
                      : ''
                  }`}
                >
                  <TiptapEditor
                    content={formData.promoSectionTitle}
                    onChange={html => handleChange('promoSectionTitle', html)}
                    placeholder='Enter promo title...'
                    minHeight='60px'
                  />
                </div>
                {errors.promoSectionTitle && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.promoSectionTitle}
                  </p>
                )}
              </div>

              {/* Upload Image, CTA Text, CTA Link in one row */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Image<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() => fileRefs.current.promoSectionImage?.click()}
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span
                        className='truncate'
                        title={formData.promoSectionImage}
                      >
                        {formData.promoSectionImage || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() =>
                        fileRefs.current.promoSectionImage?.click()
                      }
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.promoSectionImage = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('promoSectionImage', e)}
                  />
                  {errors.promoSectionImage && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.promoSectionImage}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.promoSectionImage && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.promoSectionImage}
                        alt='Promo Section Image Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    CTA Text<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.promoSectionCTAText}
                    onChange={e =>
                      handleChange('promoSectionCTAText', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.promoSectionCTAText
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.promoSectionCTAText && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.promoSectionCTAText}
                    </p>
                  )}
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  CTA Link<span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.promoSectionCTALink}
                  onChange={e =>
                    handleChange('promoSectionCTALink', e.target.value)
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                    errors.promoSectionCTALink
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                />
                {errors.promoSectionCTALink && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.promoSectionCTALink}
                  </p>
                )}
              </div>
            </div>

           
            </div>

            {/* Steps Section */}
            <div className='pt-6 pb-6 border-t border-gray-300'>
              <div className='bg-gray-900 text-white px-4 py-2 rounded-t-lg inline-block mb-4'>
                <h3 className='font-medium'>Steps Section</h3>
              </div>

              {/* Step 1 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Step 1 Title<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.stepTitle1}
                    onChange={e => handleChange('stepTitle1', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.stepTitle1 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.stepTitle1 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepTitle1}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.stepDescription1}
                    onChange={e =>
                      handleChange('stepDescription1', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.stepDescription1
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.stepDescription1 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepDescription1}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Image<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() => fileRefs.current.stepImage1?.click()}
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span className='truncate' title={formData.stepImage1}>
                        {formData.stepImage1 || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => fileRefs.current.stepImage1?.click()}
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.stepImage1 = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('stepImage1', e)}
                  />
                  {errors.stepImage1 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepImage1}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.stepImage1 && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.stepImage1}
                        alt='Step 1 Image Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Step 2 Title<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.stepTitle2}
                    onChange={e => handleChange('stepTitle2', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.stepTitle2 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.stepTitle2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepTitle2}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.stepDescription2}
                    onChange={e =>
                      handleChange('stepDescription2', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.stepDescription2
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.stepDescription2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepDescription2}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Image<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() => fileRefs.current.stepImage2?.click()}
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span className='truncate' title={formData.stepImage2}>
                        {formData.stepImage2 || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => fileRefs.current.stepImage2?.click()}
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.stepImage2 = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('stepImage2', e)}
                  />
                  {errors.stepImage2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepImage2}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.stepImage2 && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.stepImage2}
                        alt='Step 2 Image Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Step 3 Title<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.stepTitle3}
                    onChange={e => handleChange('stepTitle3', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.stepTitle3 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.stepTitle3 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepTitle3}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.stepDescription3}
                    onChange={e =>
                      handleChange('stepDescription3', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.stepDescription3
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.stepDescription3 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepDescription3}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Image<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() => fileRefs.current.stepImage3?.click()}
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span className='truncate' title={formData.stepImage3}>
                        {formData.stepImage3 || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => fileRefs.current.stepImage3?.click()}
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.stepImage3 = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('stepImage3', e)}
                  />
                  {errors.stepImage3 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepImage3}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.stepImage3 && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.stepImage3}
                        alt='Step 3 Image Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4 */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Step 4 Title<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.stepTitle4}
                    onChange={e => handleChange('stepTitle4', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.stepTitle4 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.stepTitle4 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepTitle4}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.stepDescription4}
                    onChange={e =>
                      handleChange('stepDescription4', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.stepDescription4
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.stepDescription4 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepDescription4}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Image<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() => fileRefs.current.stepImage4?.click()}
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span className='truncate' title={formData.stepImage4}>
                        {formData.stepImage4 || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => fileRefs.current.stepImage4?.click()}
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.stepImage4 = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('stepImage4', e)}
                  />
                  {errors.stepImage4 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.stepImage4}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.stepImage4 && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.stepImage4}
                        alt='Step 4 Image Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Why Partner With Us Section */}
            <div className='pt-6 pb-6 border-t border-gray-300'>
              <div className='bg-gray-900 text-white px-4 py-2 rounded-t-lg inline-block mb-4'>
                <h3 className='font-medium'>Why Partner With Us Section</h3>
              </div>

              {/* Section Title 1 and Title 2 in one row */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Section Title 1<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.whyPartnerSectionTitle1}
                    onChange={e =>
                      handleChange('whyPartnerSectionTitle1', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.whyPartnerSectionTitle1
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.whyPartnerSectionTitle1 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.whyPartnerSectionTitle1}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Section Title 2<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.whyPartnerSectionTitle2}
                    onChange={e =>
                      handleChange('whyPartnerSectionTitle2', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.whyPartnerSectionTitle2
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.whyPartnerSectionTitle2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.whyPartnerSectionTitle2}
                    </p>
                  )}
                </div>
              </div>

              {/* Description with Rich Text Editor */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description<span className='text-red-500'>*</span>
                </label>
                <div
                  className={`${
                    errors.whyPartnerSectionDescription
                      ? 'border-2 border-red-500 rounded-lg'
                      : ''
                  }`}
                >
                  <TiptapEditor
                    content={formData.whyPartnerSectionDescription}
                    onChange={html =>
                      handleChange('whyPartnerSectionDescription', html)
                    }
                    placeholder='Enter description...'
                    minHeight='80px'
                  />
                </div>
                {errors.whyPartnerSectionDescription && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.whyPartnerSectionDescription}
                  </p>
                )}
              </div>

              {/* Upload Image */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Upload Image<span className='text-red-500'>*</span>
                </label>
                <div
                  className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                  onClick={() =>
                    fileRefs.current.whyPartnerSectionImage?.click()
                  }
                >
                  <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                    <span
                      className='truncate'
                      title={formData.whyPartnerSectionImage}
                    >
                      {formData.whyPartnerSectionImage || 'Image.jpg'}
                    </span>
                  </div>
                  <button
                    type='button'
                    onClick={() =>
                      fileRefs.current.whyPartnerSectionImage?.click()
                    }
                    className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                  >
                    Browse
                  </button>
                </div>
                <input
                  ref={el => {
                    fileRefs.current.whyPartnerSectionImage = el
                  }}
                  type='file'
                  accept='.jpg,.jpeg,.png,.webp,.avif'
                  className='hidden'
                  onChange={e => handleImageChange('whyPartnerSectionImage', e)}
                />
                {errors.whyPartnerSectionImage && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.whyPartnerSectionImage}
                  </p>
                )}
                <p className='text-gray-500 text-xs mt-1'>
                  Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                </p>
                {imagePreviews.whyPartnerSectionImage && (
                  <div className='mt-3'>
                    <img
                      src={imagePreviews.whyPartnerSectionImage}
                      alt='Why Partner Section Image Preview'
                      className='w-full h-40 object-cover rounded-lg border border-gray-300'
                    />
                  </div>
                )}
              </div>

              {/* Card 1 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Card Title 1<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.whyPartnerSectionCartTitle1}
                    onChange={e =>
                      handleChange(
                        'whyPartnerSectionCartTitle1',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.whyPartnerSectionCartTitle1
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.whyPartnerSectionCartTitle1 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.whyPartnerSectionCartTitle1}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Card Description 1<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.whyPartnerSectionCardDescription1}
                    onChange={e =>
                      handleChange(
                        'whyPartnerSectionCardDescription1',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.whyPartnerSectionCardDescription1
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.whyPartnerSectionCardDescription1 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.whyPartnerSectionCardDescription1}
                    </p>
                  )}
                </div>
              </div>

              {/* Card 2 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Card Title 2<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.whyPartnerSectionCartTitle2}
                    onChange={e =>
                      handleChange(
                        'whyPartnerSectionCartTitle2',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.whyPartnerSectionCartTitle2
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.whyPartnerSectionCartTitle2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.whyPartnerSectionCartTitle2}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Card Description 2<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.whyPartnerSectionCardDescription2}
                    onChange={e =>
                      handleChange(
                        'whyPartnerSectionCardDescription2',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.whyPartnerSectionCardDescription2
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.whyPartnerSectionCardDescription2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.whyPartnerSectionCardDescription2}
                    </p>
                  )}
                </div>
              </div>

              {/* Card 3 */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Card Title 3<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.whyPartnerSectionCartTitle3}
                    onChange={e =>
                      handleChange(
                        'whyPartnerSectionCartTitle3',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.whyPartnerSectionCartTitle3
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.whyPartnerSectionCartTitle3 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.whyPartnerSectionCartTitle3}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Card Description 3<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.whyPartnerSectionCardDescription3}
                    onChange={e =>
                      handleChange(
                        'whyPartnerSectionCardDescription3',
                        e.target.value
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.whyPartnerSectionCardDescription3
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.whyPartnerSectionCardDescription3 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.whyPartnerSectionCardDescription3}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Section */}
            <div className='pt-6 pb-6 border-t border-gray-300'>
              <div className='bg-gray-900 text-white px-4 py-2 rounded-t-lg inline-block mb-4'>
                <h3 className='font-medium'>Vendor Section</h3>
              </div>

              {/* Section Title 1 and Title 2 in one row */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Section Title 1<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.vendorSectionTitle1}
                    onChange={e =>
                      handleChange('vendorSectionTitle1', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.vendorSectionTitle1
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.vendorSectionTitle1 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.vendorSectionTitle1}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Section Title 2<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.vendorSectionTitle2}
                    onChange={e =>
                      handleChange('vendorSectionTitle2', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.vendorSectionTitle2
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.vendorSectionTitle2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.vendorSectionTitle2}
                    </p>
                  )}
                </div>
              </div>

              {/* Description with Rich Text Editor */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description<span className='text-red-500'>*</span>
                </label>
                <div
                  className={`${
                    errors.vendorSectionDescription
                      ? 'border-2 border-red-500 rounded-lg'
                      : ''
                  }`}
                >
                  <TiptapEditor
                    content={formData.vendorSectionDescription}
                    onChange={html =>
                      handleChange('vendorSectionDescription', html)
                    }
                    placeholder='Enter description...'
                    minHeight='80px'
                  />
                </div>
                {errors.vendorSectionDescription && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.vendorSectionDescription}
                  </p>
                )}
              </div>

              {/* Vendor Images */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-4'>
                  Vendor Categories
                </label>
                {formData.vendorSectionImages &&
                  formData.vendorSectionImages.length > 0 &&
                  formData.vendorSectionImages.map((vendor, index) => (
                    <div
                      key={vendor._id || index}
                      className='mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50'
                    >
                      <div className='flex justify-between items-center mb-3'>
                        <h4 className='text-sm font-semibold text-gray-800'>
                          Vendor {index + 1}
                        </h4>
                        <button
                          type='button'
                          onClick={() => {
                            const updated = formData.vendorSectionImages.filter(
                              (_, i) => i !== index
                            )
                            handleChange('vendorSectionImages', updated)
                          }}
                          className='text-red-600 hover:text-red-800 text-sm font-medium'
                        >
                          Remove
                        </button>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Vendor Title<span className='text-red-500'>*</span>
                          </label>
                          <input
                            type='text'
                            value={vendor.text || ''}
                            onChange={e => {
                              const updated = [...formData.vendorSectionImages]
                              updated[index] = {
                                ...updated[index],
                                text: e.target.value
                              }
                              handleChange('vendorSectionImages', updated)
                            }}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none text-gray-900'
                            placeholder='e.g., Food Vendors'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Upload Image<span className='text-red-500'>*</span>
                          </label>
                          <div className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'>
                            <div
                              className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'
                              onClick={() =>
                                fileRefs.current[`vendorImage${index}`]?.click()
                              }
                            >
                              <span
                                className='truncate'
                                title={vendor.image || ''}
                              >
                                {vendor.image || 'Image.jpg'}
                              </span>
                            </div>
                            <button
                              type='button'
                              onClick={() =>
                                fileRefs.current[`vendorImage${index}`]?.click()
                              }
                              className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                            >
                              Browse
                            </button>
                          </div>
                          <input
                            ref={el => {
                              fileRefs.current[`vendorImage${index}`] = el
                            }}
                            type='file'
                            accept='.jpg,.jpeg,.png,.webp,.avif'
                            className='hidden'
                            onChange={e => {
                              const file = e.target.files[0]
                              if (file) {
                                const error = validateImage(file)
                                if (!error) {
                                  const updated = [
                                    ...formData.vendorSectionImages
                                  ]
                                  updated[index] = {
                                    ...updated[index],
                                    image: file.name
                                  }
                                  handleChange('vendorSectionImages', updated)
                                  setImageFiles(prev => ({
                                    ...prev,
                                    [`vendorImage${index}`]: file
                                  }))
                                  const previewUrl = URL.createObjectURL(file)
                                  setImagePreviews(prev => ({
                                    ...prev,
                                    [`vendorImage${index}`]: previewUrl
                                  }))
                                } else {
                                  alert(error)
                                  e.target.value = ''
                                }
                              }
                            }}
                          />
                          <p className='text-gray-500 text-xs mt-1'>
                            Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                          </p>
                          {(imagePreviews[`vendorImage${index}`] ||
                            vendor.image) && (
                            <div className='mt-3'>
                              <img
                                src={
                                  imagePreviews[`vendorImage${index}`] ||
                                  (vendor.image
                                    ? IMAGE_BASE_URL + vendor.image
                                    : '')
                                }
                                alt={`Vendor ${index + 1} Preview`}
                                className='w-full h-40 object-cover rounded-lg border border-gray-300'
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                <button
                  type='button'
                  onClick={() => {
                    const updated = [
                      ...(formData.vendorSectionImages || []),
                      { image: '', text: '' }
                    ]
                    handleChange('vendorSectionImages', updated)
                  }}
                  className='w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 font-medium transition'
                >
                  + Add More Vendor
                </button>
              </div>
            </div>

            {/* Become a Vendor Section */}
            <div className='pt-6 pb-6 border-t border-gray-300'>
              <div className='bg-gray-900 text-white px-4 py-2 rounded-t-lg inline-block mb-4'>
                <h3 className='font-medium'>Become a Vendor Section</h3>
              </div>

              {/* Title 1 and Title 2 in one row */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Title 1<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.BecomeVendorTitle1}
                    onChange={e =>
                      handleChange('BecomeVendorTitle1', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.BecomeVendorTitle1
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.BecomeVendorTitle1 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.BecomeVendorTitle1}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Title 2<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.BecomeVendorTitle2}
                    onChange={e =>
                      handleChange('BecomeVendorTitle2', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.BecomeVendorTitle2
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.BecomeVendorTitle2 && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.BecomeVendorTitle2}
                    </p>
                  )}
                </div>
              </div>

              {/* Description with Rich Text Editor */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Description<span className='text-red-500'>*</span>
                </label>
                <div
                  className={`${
                    errors.BecomeVendorDescription
                      ? 'border-2 border-red-500 rounded-lg'
                      : ''
                  }`}
                >
                  <TiptapEditor
                    content={formData.BecomeVendorDescription}
                    onChange={html =>
                      handleChange('BecomeVendorDescription', html)
                    }
                    placeholder='Enter description...'
                    minHeight='80px'
                  />
                </div>
                {errors.BecomeVendorDescription && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.BecomeVendorDescription}
                  </p>
                )}
              </div>

              {/* Upload Image, CTA Text, CTA Link in one row */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Upload Image<span className='text-red-500'>*</span>
                  </label>
                  <div
                    className='flex h-12 items-stretch overflow-hidden rounded-xl border border-[#E5E6EF]'
                    onClick={() => fileRefs.current.BecomeVendorImage?.click()}
                  >
                    <div className='flex-1 bg-[#F8F9FC] px-4 text-sm text-slate-700 flex items-center justify-between cursor-pointer'>
                      <span
                        className='truncate'
                        title={formData.BecomeVendorImage}
                      >
                        {formData.BecomeVendorImage || 'Image.jpg'}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() =>
                        fileRefs.current.BecomeVendorImage?.click()
                      }
                      className='px-6 text-sm font-medium text-[#2D3658] bg-white transition hover:bg-[#F6F7FD]'
                    >
                      Browse
                    </button>
                  </div>
                  <input
                    ref={el => {
                      fileRefs.current.BecomeVendorImage = el
                    }}
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.avif'
                    className='hidden'
                    onChange={e => handleImageChange('BecomeVendorImage', e)}
                  />
                  {errors.BecomeVendorImage && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.BecomeVendorImage}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-1'>
                    Max size: 2MB. Allowed: JPG, JPEG, PNG, WEBP, AVIF
                  </p>
                  {imagePreviews.BecomeVendorImage && (
                    <div className='mt-3'>
                      <img
                        src={imagePreviews.BecomeVendorImage}
                        alt='Become Vendor Image Preview'
                        className='w-full h-40 object-cover rounded-lg border border-gray-300'
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    CTA Text<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.BecomeVendorCTAText}
                    onChange={e =>
                      handleChange('BecomeVendorCTAText', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.BecomeVendorCTAText
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.BecomeVendorCTAText && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.BecomeVendorCTAText}
                    </p>
                  )}
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    CTA Link<span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.BecomeVendorCTALink}
                    onChange={e =>
                      handleChange('BecomeVendorCTALink', e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none text-gray-900 ${
                      errors.BecomeVendorCTALink
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors.BecomeVendorCTALink && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.BecomeVendorCTALink}
                    </p>
                  )}
                </div>
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
    </div>
  )
}
