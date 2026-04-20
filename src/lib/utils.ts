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
  
  // Find the status with the highest index in STAGES
  let highestIndex = -1;
  let highestStatus = STAGES[0];

  statusList.forEach(s => {
    const index = STAGES.indexOf(s.toLowerCase().trim());
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
