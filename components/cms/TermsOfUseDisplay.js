'use client';

import { useEffect, useState } from 'react';
import { getTermsOfUse } from '@/services/cms/terms-privacy.service';
import '@/components/editor/tiptap-editor.css';

export default function TermsOfUseDisplay() {
  const [data, setData] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await getTermsOfUse();
        const d = res?.data || res;
        const responseData = d?.data || d;
        const obj = typeof responseData === 'object' && responseData ? responseData : {};
        setData({
          title: obj.title || 'Terms of Use',
          content: obj.content || ''
        });
      } catch (error) {
        console.error('Failed to fetch terms of use:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-8 lg:p-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
        {data.title}
      </h1>
      
      {/* IMPORTANT: Use tiptap-content class to render HTML with proper spacing */}
      <div 
        className="tiptap-content text-gray-700 text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    </div>
  );
}
