import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'To Do',
  description: 'Microsoft To Do–style task manager',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans text-[var(--color-text)] bg-[var(--color-bg)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
