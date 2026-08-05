import { createClient } from '@/lib/supabase/client'
import type { Attachment } from '@/types/database'

export const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['image/', 'application/pdf', 'text/plain'] as const
export const BUCKET = 'task-attachments'

function isAllowedMime(mime: string): boolean {
  return ALLOWED.some((prefix) =>
    prefix.endsWith('/') ? mime.startsWith(prefix) : mime === prefix
  )
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-()+ ]+/g, '_').slice(0, 180) || 'file'
}

export async function fetchAttachments(taskId: string): Promise<Attachment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Attachment[]
}

export async function uploadAttachment(
  taskId: string,
  file: File
): Promise<Attachment> {
  if (file.size > MAX_BYTES) {
    throw new Error('File exceeds 10MB limit')
  }
  if (!isAllowedMime(file.type || '')) {
    throw new Error('File type not allowed')
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const safeName = sanitizeFileName(file.name)
  const storagePath = `${user.id}/${taskId}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('attachments')
    .insert({
      task_id: taskId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
    })
    .select('*')
    .single()

  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw error
  }

  return data as Attachment
}

export async function deleteAttachment(attachment: Attachment): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('attachments')
    .delete()
    .eq('id', attachment.id)
  if (error) throw error

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([attachment.storage_path])
  if (storageError) throw storageError
}

export async function getAttachmentUrl(
  storagePath: string
): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 10)
  if (error) throw error
  return data.signedUrl
}
