'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
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
import './tiptap-editor.css';

export default function TiptapEditor({ content, onChange, placeholder = 'Enter content...', minHeight = '150px' }) {
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
      Color,
      Placeholder.configure({
        placeholder: placeholder,
      })
    ],
    content: content || '',
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
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px]',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

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
    <div className={`tiptap-editor-wrapper border border-gray-300 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-white flex flex-col' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 border-b border-gray-300 bg-gray-50 flex-wrap shrink-0">
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
          onClick={addLink}
          className={`p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 ${editor.isActive('link') ? 'bg-gray-200' : 'bg-white'}`}
          title="Insert Link"
          type="button"
        >
          <Link2 className="w-4 h-4" />
        </button>

        <button
          onClick={addImage}
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
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 hover:bg-gray-100 rounded transition-colors border border-gray-300 bg-white"
          title="Fullscreen"
          type="button"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div style={{ minHeight: isFullscreen ? 'auto' : minHeight }} className={isFullscreen ? 'flex-1 overflow-auto' : ''}>
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
    </div>
  );
}
