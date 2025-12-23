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
import { getPrivacyPolicy, createUpdateTermsPrivacy } from '@/services/cms/terms-privacy.service';
import Toast from '@/components/ui/Toast';

export default function PrivacyPolicyForm() {
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', description: '', variant: 'success' });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'min-h-[1.5em]',
          },
        },
        hardBreak: {
          keepMarks: true,
        },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
      TextStyle,
      Color
    ],
    content: formData.content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Get HTML and ensure empty paragraphs have <br> tags for proper spacing
      let html = editor.getHTML();
      // Replace empty paragraphs with paragraphs containing <br> to preserve line breaks
      html = html.replace(/<p><\/p>/g, '<p><br></p>');
      html = html.replace(/<p\s+([^>]*)><\/p>/g, '<p $1><br></p>');
      // Also handle paragraphs that only contain whitespace
      html = html.replace(/<p>\s*<\/p>/g, '<p><br></p>');
      html = html.replace(/<p\s+([^>]*)>\s*<\/p>/g, '<p $1><br></p>');
      setFormData(prev => ({ ...prev, content: html }));
    }
  });

  const setField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    const fetchPrivacy = async () => {
      setLoading(true);
      try {
        const res = await getPrivacyPolicy();
        const d = res?.data || res;
        const data = d?.data || d;
        const obj = typeof data === 'object' && data ? data : {};
        const content = obj.content || '';
        setFormData({
          title: obj.title || 'Privacy Policy',
          content
        });
        if (editor && content) {
          editor.commands.setContent(content);
        }
      } catch (e) {
        setToast({ open: true, title: 'Error', description: 'Failed to fetch Privacy Policy', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchPrivacy();
  }, [editor]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { title: formData.title, content: editor?.getHTML() || formData.content };
      await createUpdateTermsPrivacy(payload);
      setToast({ open: true, title: 'Saved', description: 'Privacy Policy updated', variant: 'success' });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to save Privacy Policy';
      setToast({ open: true, title: 'Error', description: msg, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const colors = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  if (!editor) return null;

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
        <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-xs text-gray-500 mt-0.5">Dashboard / CMS</p>
      </div>

      <div className="bg-gray-100 p-3 rounded-xl">
        {/* Privacy Policy Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          {/* Card Header with Save Button */}
          <div className="flex justify-between items-center mb-3 border-b pb-2 border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Privacy Policy Details</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title<span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setField('title', e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              placeholder="Enter title"
            />
            <label className="block text-xs font-medium text-gray-700 mb-1 mt-3">Privacy Policy<span className="text-red-500">*</span></label>
            <div className={`tiptap-editor-wrapper border border-gray-300 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
              {/* Toolbar */}
              <div className="flex items-center gap-0.5 p-2 border-b border-gray-300 bg-gray-50 flex-wrap">
                {/* Bold */}
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('bold') ? 'bg-gray-200' : 'bg-white'}`}
                  title="Bold"
                  type="button"
                >
                  <Bold className="w-4 h-4" />
                </button>

                {/* Italic */}
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('italic') ? 'bg-gray-200' : 'bg-white'}`}
                  title="Italic"
                  type="button"
                >
                  <Italic className="w-4 h-4" />
                </button>

                {/* Underline */}
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('underline') ? 'bg-gray-200' : 'bg-white'}`}
                  title="Underline"
                  type="button"
                >
                  <UnderlineIcon className="w-4 h-4" />
                </button>

                {/* Strikethrough */}
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('strike') ? 'bg-gray-200' : 'bg-white'}`}
                  title="Strikethrough"
                  type="button"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>

                {/* Text Color Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
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
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-10 flex gap-1">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            editor.chain().focus().setColor(color).run();
                            setShowColorPicker(false);
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

                {/* Bullet List */}
                <button
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('bulletList') ? 'bg-gray-200' : 'bg-white'}`}
                  title="Bullet List"
                  type="button"
                >
                  <List className="w-4 h-4" />
                </button>

                {/* Numbered List */}
                <button
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('orderedList') ? 'bg-gray-200' : 'bg-white'}`}
                  title="Numbered List"
                  type="button"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                {/* Align Left */}
                <button
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'bg-white'}`}
                  title="Align Left"
                  type="button"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>

                {/* Align Center */}
                <button
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'bg-white'}`}
                  title="Align Center"
                  type="button"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>

                {/* Align Right */}
                <button
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'bg-white'}`}
                  title="Align Right"
                  type="button"
                >
                  <AlignRight className="w-4 h-4" />
                </button>

                {/* Link */}
                <button
                  onClick={addLink}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('link') ? 'bg-gray-200' : 'bg-white'}`}
                  title="Insert Link"
                  type="button"
                >
                  <Link2 className="w-4 h-4" />
                </button>

                {/* Image */}
                <button
                  onClick={addImage}
                  className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 bg-white"
                  title="Insert Image"
                  type="button"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Code */}
                <button
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('code') ? 'bg-gray-200' : 'bg-white'}`}
                  title="Code"
                  type="button"
                >
                  <Code className="w-4 h-4" />
                </button>

                {/* Fullscreen */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 bg-white"
                  title="Fullscreen"
                  type="button"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 text-gray-900 bg-white [&_.ProseMirror]:outline-none [&_.ProseMirror]:border-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
