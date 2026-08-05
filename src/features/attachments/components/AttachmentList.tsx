'use client'

import { useRef, useState } from 'react'
import { Paperclip, Trash2 } from 'lucide-react'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'
import { getAttachmentUrl, MAX_BYTES } from '../api'
import {
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from '../hooks'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type AttachmentListProps = {
  taskId: string
}

export function AttachmentList({ taskId }: AttachmentListProps) {
  const { locale } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: attachments = [], isLoading } = useAttachments(taskId)
  const upload = useUploadAttachment(taskId)
  const remove = useDeleteAttachment(taskId)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError(null)
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        setError(t(locale, 'attachment.tooLarge'))
        continue
      }
      try {
        await upload.mutateAsync(file)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t(locale, 'attachment.uploadFailed')
        setError(message)
      }
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleOpen = async (storagePath: string) => {
    try {
      const url = await getAttachmentUrl(storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      console.error('Open attachment failed', err)
    }
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {t(locale, 'attachment.title')}
      </p>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">…</p>
      ) : (
        <ul className="space-y-1">
          {attachments.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1.5"
            >
              <button
                type="button"
                onClick={() => void handleOpen(item.storage_path)}
                className="min-w-0 flex-1 truncate text-left text-sm text-[var(--color-accent)] hover:underline"
              >
                {item.file_name}
              </button>
              <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                {formatBytes(item.size_bytes)}
              </span>
              <button
                type="button"
                aria-label={t(locale, 'attachment.delete')}
                disabled={remove.isPending}
                onClick={() => void remove.mutateAsync(item)}
                className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-danger)] disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,text/plain"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)] disabled:opacity-50"
      >
        <Paperclip className="size-4 shrink-0" />
        {upload.isPending
          ? t(locale, 'attachment.uploading')
          : t(locale, 'attachment.add')}
      </button>
      {error && (
        <p className="text-xs text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
