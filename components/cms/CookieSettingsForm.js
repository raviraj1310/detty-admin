'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Link2,
  Image as ImageIcon,
  Code,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { getCookies, createUpdateCookie } from '@/services/cms/cookie.service';
import Toast from '@/components/ui/Toast';

export default function CookieSettingsForm() {
  const [formData, setFormData] = useState({
    slug: 'cookie-policy',
    cookiesetting: '',
    necessarycookie: '',
    functionalcookie: '',
    analyticscookie: '',
    advertisingcookie: ''
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' });
  const [showColorPicker, setShowColorPicker] = useState({});
  const [isFullscreen, setIsFullscreen] = useState({});

  const cookieSettingEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color
    ],
    content: formData.cookiesetting,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, cookiesetting: editor.getHTML() }));
    }
  });

  const necessaryCookieEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color
    ],
    content: formData.necessarycookie,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, necessarycookie: editor.getHTML() }));
    }
  });

  const functionalCookieEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color
    ],
    content: formData.functionalcookie,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, functionalcookie: editor.getHTML() }));
    }
  });

  const analyticsCookieEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color
    ],
    content: formData.analyticscookie,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, analyticscookie: editor.getHTML() }));
    }
  });

  const advertisingCookieEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color
    ],
    content: formData.advertisingcookie,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, advertisingcookie: editor.getHTML() }));
    }
  });

  useEffect(() => {
    const fetchCookies = async () => {
      try {
        const res = await getCookies();
        const d = res?.data || res;
        const data = d?.data || d;
        const obj = typeof data === 'object' && data ? data : {};
        
        const newFormData = {
          slug: obj.slug || 'cookie-policy',
          cookiesetting: obj.cookiesetting || '',
          necessarycookie: obj.necessarycookie || '',
          functionalcookie: obj.functionalcookie || '',
          analyticscookie: obj.analyticscookie || '',
          advertisingcookie: obj.advertisingcookie || ''
        };
        
        setFormData(newFormData);
        
        if (cookieSettingEditor && newFormData.cookiesetting) {
          cookieSettingEditor.commands.setContent(newFormData.cookiesetting);
        }
        if (necessaryCookieEditor && newFormData.necessarycookie) {
          necessaryCookieEditor.commands.setContent(newFormData.necessarycookie);
        }
        if (functionalCookieEditor && newFormData.functionalcookie) {
          functionalCookieEditor.commands.setContent(newFormData.functionalcookie);
        }
        if (analyticsCookieEditor && newFormData.analyticscookie) {
          analyticsCookieEditor.commands.setContent(newFormData.analyticscookie);
        }
        if (advertisingCookieEditor && newFormData.advertisingcookie) {
          advertisingCookieEditor.commands.setContent(newFormData.advertisingcookie);
        }
      } catch (e) {
        setToast({ open: true, title: 'Error', description: 'Failed to fetch cookie settings', variant: 'error' });
      }
    };
    fetchCookies();
  }, [cookieSettingEditor, necessaryCookieEditor, functionalCookieEditor, analyticsCookieEditor, advertisingCookieEditor]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        slug: formData.slug,
        cookiesetting: cookieSettingEditor?.getHTML() || formData.cookiesetting,
        necessarycookie: necessaryCookieEditor?.getHTML() || formData.necessarycookie,
        functionalcookie: functionalCookieEditor?.getHTML() || formData.functionalcookie,
        analyticscookie: analyticsCookieEditor?.getHTML() || formData.analyticscookie,
        advertisingcookie: advertisingCookieEditor?.getHTML() || formData.advertisingcookie
      };
      await createUpdateCookie(payload);
      setToast({ open: true, title: 'Saved', description: 'Cookie settings updated', variant: 'success' });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save cookie settings';
      setToast({ open: true, title: 'Error', description: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addLink = (editor) => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = (editor) => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const colors = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  const renderToolbar = (editor, editorKey) => {
    if (!editor) return null;

    return (
      <div className="flex items-center gap-0.5 p-2 border-b border-gray-300 bg-gray-50 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('bold') ? 'bg-gray-200' : 'bg-white'}`}
          title="Bold"
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('italic') ? 'bg-gray-200' : 'bg-white'}`}
          title="Italic"
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('underline') ? 'bg-gray-200' : 'bg-white'}`}
          title="Underline"
          type="button"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('strike') ? 'bg-gray-200' : 'bg-white'}`}
          title="Strikethrough"
          type="button"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowColorPicker(prev => ({ ...prev, [editorKey]: !prev[editorKey] }))}
            className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 bg-white"
            title="Text Color"
            type="button"
          >
            <div className="w-4 h-4 flex items-center justify-center relative">
              <span className="text-sm font-bold text-gray-900">A</span>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-400"></div>
            </div>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showColorPicker[editorKey] && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-10 flex gap-1">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    setShowColorPicker(prev => ({ ...prev, [editorKey]: false }));
                  }}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                  type="button"
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('bulletList') ? 'bg-gray-200' : 'bg-white'}`}
          title="Bullet List"
          type="button"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('orderedList') ? 'bg-gray-200' : 'bg-white'}`}
          title="Numbered List"
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'bg-white'}`}
          title="Align Left"
          type="button"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'bg-white'}`}
          title="Align Center"
          type="button"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'bg-white'}`}
          title="Align Right"
          type="button"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => addLink(editor)}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('link') ? 'bg-gray-200' : 'bg-white'}`}
          title="Insert Link"
          type="button"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => addImage(editor)}
          className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 bg-white"
          title="Insert Image"
          type="button"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('code') ? 'bg-gray-200' : 'bg-white'}`}
          title="Code"
          type="button"
        >
          <Code className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsFullscreen(prev => ({ ...prev, [editorKey]: !prev[editorKey] }))}
          className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 bg-white"
          title="Fullscreen"
          type="button"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (!cookieSettingEditor || !necessaryCookieEditor || !functionalCookieEditor || !analyticsCookieEditor || !advertisingCookieEditor) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 bg-gray-50 min-h-screen">
      <Toast
        open={toast.open}
        onOpenChange={v => setToast(prev => ({ ...prev, open: v }))}
        title={toast.title}
        description={toast.description}
        variant={toast.variant}
        duration={2500}
        position="top-right"
      />
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-bold text-gray-900">Cookie Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Dashboard / CMS</p>
      </div>

      <div className="bg-gray-100 p-3 rounded-xl">
        {/* Cookie Settings Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          {/* Card Header with Save Button */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 border-b pb-2 border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Cookie Settings Details</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Rich Text Editors */}
          <div className="space-y-4">
            {/* Cookie Settings */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Cookie Settings<span className="text-red-500">*</span>
              </label>
              <div className={`tiptap-editor-wrapper border border-gray-300 rounded-lg overflow-hidden ${isFullscreen.cookiesetting ? 'fixed inset-0 z-50 bg-white' : ''}`}>
                {renderToolbar(cookieSettingEditor, 'cookiesetting')}
                <EditorContent 
                  editor={cookieSettingEditor} 
                  className="prose prose-sm max-w-none w-full p-3 min-h-[150px] text-gray-900 bg-white overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none" 
                />
              </div>
            </div>

            {/* Necessary Cookie */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Necessary Cookie<span className="text-red-500">*</span>
              </label>
              <div className={`tiptap-editor-wrapper border border-gray-300 rounded-lg overflow-hidden ${isFullscreen.necessarycookie ? 'fixed inset-0 z-50 bg-white' : ''}`}>
                {renderToolbar(necessaryCookieEditor, 'necessarycookie')}
                <EditorContent 
                  editor={necessaryCookieEditor} 
                  className="prose prose-sm max-w-none w-full p-3 min-h-[150px] text-gray-900 bg-white overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none" 
                />
              </div>
            </div>

            {/* Functional Cookie */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Functional Cookie<span className="text-red-500">*</span>
              </label>
              <div className={`tiptap-editor-wrapper border border-gray-300 rounded-lg overflow-hidden ${isFullscreen.functionalcookie ? 'fixed inset-0 z-50 bg-white' : ''}`}>
                {renderToolbar(functionalCookieEditor, 'functionalcookie')}
                <EditorContent 
                  editor={functionalCookieEditor} 
                  className="prose prose-sm max-w-none w-full p-3 min-h-[150px] text-gray-900 bg-white overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none" 
                />
              </div>
            </div>

            {/* Performance & Analytics Cookies */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Performance & Analytics Cookies<span className="text-red-500">*</span>
              </label>
              <div className={`tiptap-editor-wrapper border border-gray-300 rounded-lg overflow-hidden ${isFullscreen.analyticscookie ? 'fixed inset-0 z-50 bg-white' : ''}`}>
                {renderToolbar(analyticsCookieEditor, 'analyticscookie')}
                <EditorContent 
                  editor={analyticsCookieEditor} 
                  className="prose prose-sm max-w-none w-full p-3 min-h-[150px] text-gray-900 bg-white overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none" 
                />
              </div>
            </div>

            {/* Advertising Cookies */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Advertising Cookies<span className="text-red-500">*</span>
              </label>
              <div className={`tiptap-editor-wrapper border border-gray-300 rounded-lg overflow-hidden ${isFullscreen.advertisingcookie ? 'fixed inset-0 z-50 bg-white' : ''}`}>
                {renderToolbar(advertisingCookieEditor, 'advertisingcookie')}
                <EditorContent 
                  editor={advertisingCookieEditor} 
                  className="prose prose-sm max-w-none w-full p-3 min-h-[150px] text-gray-900 bg-white overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
