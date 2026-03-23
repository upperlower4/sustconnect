'use client'
import { usePushNotification } from '@/hooks/usePushNotification'

export default function PushInit() {
  usePushNotification()
  return null
}