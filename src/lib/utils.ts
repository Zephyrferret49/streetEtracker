import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Contact } from "../types";

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

export function filterContactsByColumn(contacts: Contact[], columnId: string) {
  const colId = columnId.toLowerCase();
  
  return contacts.filter(c => {
    const status = c.status?.toLowerCase().trim();
    return status === colId;
  });
}
