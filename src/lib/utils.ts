import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Contact } from "../types";
import { STAGES } from "../constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalDateString(date: Date = new Date()) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
}

export function isSameDay(date1: Date | string, date2: Date | string) {
  return getLocalDateString(new Date(date1)) === getLocalDateString(new Date(date2));
}

export function getHighestStatus(statuses: string[] | string) {
  if (!statuses) return 'convo';
  const statusList = Array.isArray(statuses) ? statuses : [statuses];
  if (statusList.length === 0) return 'convo';
  
  // Find the status with the highest index in STAGES (convo is 0, high-priority is 5)
  let highestIndex = -1;
  let highestStatus = STAGES[0];

  statusList.forEach(s => {
    const cleanStatus = s.toLowerCase().trim();
    const index = STAGES.indexOf(cleanStatus);
    if (index > highestIndex) {
      highestIndex = index;
      highestStatus = s;
    }
  });

  return highestStatus;
}

export function filterContactsByColumn(contacts: Contact[], columnId: string) {
  const colId = columnId.toLowerCase();
  
  return contacts.filter(c => {
    if (colId === 'deprecated') {
      return Array.isArray(c.status) ? c.status.includes('deprecated') : c.status === 'deprecated';
    }
    
    const highestStatus = getHighestStatus(c.status);
    return highestStatus.toLowerCase().trim() === colId;
  });
}

export type SocialPlatform = 'instagram' | 'line' | 'whatsapp' | 'telegram' | 'other';

export function parseSocialMedia(raw: string): { platform: SocialPlatform; handle: string } {
  if (!raw || raw === '-') return { platform: 'other', handle: '' };
  
  const platforms: SocialPlatform[] = ['instagram', 'line', 'whatsapp', 'telegram'];
  for (const p of platforms) {
    if (raw.startsWith(`${p}:`)) {
      return { platform: p, handle: raw.replace(`${p}:`, '') };
    }
  }
  
  return { platform: 'other', handle: raw };
}

export function getSocialLink(platform: SocialPlatform, handle: string): string {
  if (!handle) return '';
  const cleanHandle = handle.trim().replace(/^@/, '');
  
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${cleanHandle}`;
    case 'line':
      return `https://line.me/ti/p/~${cleanHandle}`;
    case 'whatsapp':
      // Ensure phone number has country code, default to +65 (Singapore) if it looks like a local number
      let phone = cleanHandle.replace(/\D/g, '');
      if (phone.length === 8) phone = `65${phone}`;
      return `https://wa.me/${phone}`;
    case 'telegram':
      return `https://t.me/${cleanHandle}`;
    default:
      return '';
  }
}
