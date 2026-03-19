import { clsx, type ClassValue } from 'clsx'
import { formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function timeAgo(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

export function formatDOB(day: number, month: number, year: number) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${day} ${months[month - 1]} ${year}`
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(text: string, length = 300) {
  if (text.length <= length) return { text, truncated: false }
  return { text: text.slice(0, length) + '...', truncated: true }
}

export function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export const DEPARTMENTS = [
  { group: 'Applied Science & Technology', items: ['CSE','SWE','EEE','CEP','IPE','Mechanical Engineering','CEE','PME','FET','Architecture'] },
  { group: 'Physical Sciences', items: ['Physics','Chemistry','Mathematics','Statistics','Oceanography'] },
  { group: 'Life Sciences', items: ['GEB','BMB','FES'] },
  { group: 'Business & Social Science', items: ['BBA','Economics','Sociology','Social Work','Anthropology','Public Administration','Political Studies'] },
  { group: 'Humanities', items: ['Bangla','English','Geography & Environment'] },
]

export const SESSIONS = ['2024-25','2023-24','2022-23','2021-22','2020-21','2019-20','2018-19']

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function isBirthdayToday(day: number, month: number) {
  const today = new Date()
  return today.getDate() === day && today.getMonth() + 1 === month
}

export function daysUntilExpiry(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
