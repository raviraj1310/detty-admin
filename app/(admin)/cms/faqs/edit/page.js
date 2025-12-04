"use client";

import { useSearchParams } from 'next/navigation'
import EditFAQForm from '@/components/cms/EditFAQForm'

export default function EditFAQsPage() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || ''
  return <EditFAQForm id={id} />
}
