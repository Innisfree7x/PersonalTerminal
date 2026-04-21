export interface KitTimeSlot {
  index: number;
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export const KIT_TIME_SLOTS: readonly KitTimeSlot[] = [
  { index: 0, label: '08:00 – 09:30', startHour: 8,  startMinute: 0,  endHour: 9,  endMinute: 30 },
  { index: 1, label: '09:45 – 11:15', startHour: 9,  startMinute: 45, endHour: 11, endMinute: 15 },
  { index: 2, label: '11:30 – 13:00', startHour: 11, startMinute: 30, endHour: 13, endMinute: 0  },
  { index: 3, label: '13:00 – 14:00', startHour: 13, startMinute: 0,  endHour: 14, endMinute: 0  },
  { index: 4, label: '14:00 – 15:30', startHour: 14, startMinute: 0,  endHour: 15, endMinute: 30 },
  { index: 5, label: '15:45 – 17:15', startHour: 15, startMinute: 45, endHour: 17, endMinute: 15 },
  { index: 6, label: '17:30 – 19:00', startHour: 17, startMinute: 30, endHour: 19, endMinute: 0  },
] as const;

export const WEEKDAY_LABELS_DE: readonly string[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;

export function slotIndexForDate(date: Date): number {
  const minutes = date.getHours() * 60 + date.getMinutes();
  for (const slot of KIT_TIME_SLOTS) {
    const slotStart = slot.startHour * 60 + slot.startMinute;
    const slotEnd = slot.endHour * 60 + slot.endMinute;
    if (minutes >= slotStart && minutes < slotEnd) return slot.index;
  }
  if (minutes < (KIT_TIME_SLOTS[0]?.startHour ?? 8) * 60) return 0;
  return KIT_TIME_SLOTS.length - 1;
}

export function slotStartDate(weekStart: Date, dayIndex: number, slotIndex: number): Date {
  const slot = KIT_TIME_SLOTS[slotIndex];
  if (!slot) throw new Error(`Invalid slotIndex: ${slotIndex}`);
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayIndex);
  date.setHours(slot.startHour, slot.startMinute, 0, 0);
  return date;
}

export function slotEndDate(weekStart: Date, dayIndex: number, slotIndex: number): Date {
  const slot = KIT_TIME_SLOTS[slotIndex];
  if (!slot) throw new Error(`Invalid slotIndex: ${slotIndex}`);
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayIndex);
  date.setHours(slot.endHour, slot.endMinute, 0, 0);
  return date;
}
