'use client'

import { useRouter } from 'next/navigation'
import { AuthForm } from '@/features/auth/components/AuthForm'

export default function LoginPage() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <AuthForm onSuccess={() => router.push('/')} />
    </main>
  )
}
