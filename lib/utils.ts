import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function cleanConversationTitle(raw?: string | null): string {
  if (!raw) return ""
  const match = raw.match(/^\[choice_id:[^\]]+\]\s*(.+)$/)
  return match ? match[1] : raw
}
