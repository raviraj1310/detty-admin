'use client'

import { useEffect, useMemo, useState } from 'react'
import { Save, Eye, Copy, Calendar, Type } from 'lucide-react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import Toast from '@/components/ui/Toast'
import {
  getEmailTemplates,
  storeEmailTemplates
} from '@/services/email-template/emailTemplate.service'

export default function EmailTemplates () {
  const [template, setTemplate] = useState({
    _id: '',
    type: '',
    content: '',
    createdAt: '',
    updatedAt: ''
  })
  const [content, setContent] = useState(template.content || '')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({
    open: false,
    title: '',
    description: '',
    variant: 'success'
  })
  const [previewVars, setPreviewVars] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com'
  })
  const [highlight, setHighlight] = useState(true)
  const [loading, setLoading] = useState(false)
  const decodeEntities = str => {
    if (!str) return ''
    return String(str)
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
  }

  const transformHtml = (html, mode, vars) => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_TEXT)
      const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g
      const frag = doc.createElement('span')
      while (walker.nextNode()) {
        const node = walker.currentNode
        const text = node.nodeValue || ''
        if (!re.test(text)) continue
        const replaced =
          mode === 'highlight'
            ? text.replace(
                re,
                (_m, key) =>
                  `<span style="background:#FEF08A;color:#92400E;font-weight:600;font-size:11px;padding:2px 4px;border-radius:4px;display:inline-block;">{{${key}}}</span>`
              )
            : text.replace(re, (_m, key) => String(vars?.[key] ?? ''))
        frag.innerHTML = replaced
        const parent = node.parentNode
        while (frag.firstChild) parent.insertBefore(frag.firstChild, node)
        parent.removeChild(node)
      }
      return doc.body ? doc.body.innerHTML : doc.documentElement.outerHTML
    } catch {
      return html
    }
  }

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true)
        const response = await getEmailTemplates()
        const d = response?.data || response
        const normalized = {
          _id: d?._id || '',
          type: d?.type || 'Template',
          content: d?.content || '',
          createdAt: d?.createdAt || '',
          updatedAt: d?.updatedAt || ''
        }
        setTemplate(normalized)
        setContent(normalized.content || '')
      } catch (e) {
        setToast({
          open: true,
          title: 'Error',
          description: 'Failed to load email template',
          variant: 'error'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchTemplate()
  }, [])

  const replacePlaceholders = (html, vars) => {
    if (!html) return ''
    let result = html
    Object.entries(vars || {}).forEach(([key, val]) => {
      const re = new RegExp(`{{\\s*${key}\\s*}}`, 'gi')
      result = result.replace(re, String(val ?? ''))
    })
    return result
  }

  const previewHtml = useMemo(() => {
    if (!content) return ''
    const decoded = decodeEntities(content)
    return highlight
      ? transformHtml(decoded, 'highlight')
      : transformHtml(decoded, 'replace', previewVars)
  }, [content, previewVars, highlight])

  const onSave = async () => {
    if (!content || content === '<p></p>') {
      setToast({
        open: true,
        title: 'Error',
        description: 'Please add template content',
        variant: 'error'
      })
      return
    }
    try {
      setSaving(true)
      const payload = {
        _id: template._id,
        type: template.type,
        content
      }
      const res = await storeEmailTemplates(payload)
      const d = res?.data || res
      setTemplate(prev => ({
        ...prev,
        content: content,
        updatedAt: d?.updatedAt || prev.updatedAt
      }))
      setToast({
        open: true,
        title: 'Saved',
        description: 'Template saved successfully',
        variant: 'success'
      })
    } catch (e) {
      setToast({
        open: true,
        title: 'Error',
        description: 'Failed to save template',
        variant: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setToast({
        open: true,
        title: 'Copied',
        description: 'Template HTML copied to clipboard',
        variant: 'success'
      })
    } catch {
      setToast({
        open: true,
        title: 'Error',
        description: 'Unable to copy HTML',
        variant: 'error'
      })
    }
  }

  return (
    <div className='p-4 lg:p-6 bg-white min-h-screen'>
      <div className='mb-3'>
        <h1 className='text-xl font-bold text-gray-900'>Email Templates</h1>
        <p className='text-xs text-gray-500'>
          Dashboard / Masters / Email Templates
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Type className='w-4 h-4 text-gray-600' />
              <span className='text-sm font-semibold text-gray-900'>
                {template.type} Template
              </span>
            </div>
            <div className='flex items-center gap-4 text-xs text-gray-500'>
              <div className='flex items-center gap-1'>
                <Calendar className='w-3.5 h-3.5' />
                {template.updatedAt
                  ? new Date(template.updatedAt).toLocaleDateString() +
                    ' ' +
                    new Date(template.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '-'}
              </div>
            </div>
          </div>
          <div className='p-4 space-y-3'>
            <div className='space-y-1'>
              <label className='text-xs font-medium text-gray-700'>
                Variables
              </label>
              <div className='grid grid-cols-2 gap-2'>
                <div className='space-y-1'>
                  <input
                    type='text'
                    value={previewVars.name}
                    onChange={e =>
                      setPreviewVars(prev => ({
                        ...prev,
                        name: e.target.value
                      }))
                    }
                    placeholder='{{name}}'
                    className='w-full h-9 rounded-lg border border-gray-300 bg-[#F8F9FC] px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200'
                  />
                  <p className='text-[10px] text-gray-500'>
                    {'Use {{name}} in the template'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <input
                    type='email'
                    value={previewVars.email}
                    onChange={e =>
                      setPreviewVars(prev => ({
                        ...prev,
                        email: e.target.value
                      }))
                    }
                    placeholder='{{email}}'
                    className='w-full h-9 rounded-lg border border-gray-300 bg-[#F8F9FC] px-3 text-xs text-slate-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200'
                  />
                  <p className='text-[10px] text-gray-500'>
                    {'Use {{email}} in the template'}
                  </p>
                </div>
              </div>
            </div>

            <div className='space-y-1'>
              <label className='text-xs font-medium text-gray-700'>
                Template Content
              </label>
              <TiptapEditor
                content={content}
                onChange={html => setContent(html)}
                placeholder='Write email HTML content...'
                minHeight='220px'
              />
              <p className='text-[10px] text-gray-500'>
                {'Supported placeholders: {{name}}, {{email}}'}
              </p>
            </div>

            <div className='flex items-center gap-2'>
              <button
                onClick={onSave}
                disabled={saving}
                className={`flex items-center gap-2 px-3 py-2 text-xs bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 ${
                  saving ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <Save className='w-4 h-4' />
                Save Changes
              </button>
              <button
                onClick={copyHtml}
                className='flex items-center gap-2 px-3 py-2 text-xs bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50'
              >
                <Copy className='w-4 h-4' />
                Copy HTML
              </button>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
          <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Eye className='w-4 h-4 text-gray-600' />
              <span className='text-sm font-semibold text-gray-900'>
                Live Preview
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <label className='text-xs text-gray-700'>
                Highlight placeholders
              </label>
              <input
                type='checkbox'
                checked={highlight}
                onChange={e => setHighlight(e.target.checked)}
              />
            </div>
          </div>
          <div className='p-4'>
            <iframe
              title='Email Preview'
              srcDoc={`<!doctype html><html><head><meta charset="utf-8" /></head><body>${previewHtml}</body></html>`}
              className='w-full rounded-lg border border-gray-200 bg-[#F9FAFB]'
              style={{ minHeight: 420 }}
            />
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
