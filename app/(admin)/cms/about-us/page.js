"use client";
import dynamic from 'next/dynamic';

const AboutUsForm = dynamic(() => import('@/components/cms/AboutUsForm'), { ssr: false });

export default function AboutUsPage() {
  return <AboutUsForm />;
}
