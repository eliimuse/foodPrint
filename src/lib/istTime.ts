import { DayOfWeek } from '../types';

// IST is UTC + 5:30 (fixed offset, no DST)
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/**
 * Returns current timestamp in UTC ms, adjusted for any simulation offset
 */
export function getCurrentISTDate(offsetMinutes = 0): Date {
  const nowUtc = Date.now() + offsetMinutes * 60 * 1000;
  // Convert UTC time to IST time
  return new Date(nowUtc + IST_OFFSET_MS);
}

/**
 * Format a Date object to YYYY-MM-DD in IST
 */
export function formatDateToISTString(date: Date): string {
  // Extract UTC components since date was shifted by IST offset
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in IST as YYYY-MM-DD
 */
export function getTodayIST(offsetMinutes = 0): string {
  const istDate = getCurrentISTDate(offsetMinutes);
  return formatDateToISTString(istDate);
}

/**
 * Get tomorrow's date in IST as YYYY-MM-DD (Day D)
 */
export function getTomorrowIST(offsetMinutes = 0): string {
  const istDate = getCurrentISTDate(offsetMinutes);
  istDate.setUTCDate(istDate.getUTCDate() + 1);
  return formatDateToISTString(istDate);
}

/**
 * Given a target date string 'YYYY-MM-DD' (Day D),
 * calculate Day D-1 at 20:00:00 IST in epoch ms
 */
export function getCutoffTimestamp(targetDateStr: string): number {
  const [year, month, day] = targetDateStr.split('-').map(Number);
  
  // Day D-1
  const cutoffUtcDate = new Date(Date.UTC(year, month - 1, day));
  cutoffUtcDate.setUTCDate(cutoffUtcDate.getUTCDate() - 1);
  
  // Cutoff is at 20:00:00 IST (8:00 PM IST)
  // 20:00 IST corresponds to 14:30 UTC
  const cutoffYear = cutoffUtcDate.getUTCFullYear();
  const cutoffMonth = cutoffUtcDate.getUTCMonth();
  const cutoffDay = cutoffUtcDate.getUTCDate();
  
  // Construct epoch timestamp for 20:00:00 IST (14:30:00 UTC)
  return Date.UTC(cutoffYear, cutoffMonth, cutoffDay, 14, 30, 0, 0);
}

/**
 * Check if attendance submission for targetDate is locked.
 * Rule: Must be submitted before 8:00 PM IST on Day D-1.
 */
export function isCutoffPassed(targetDateStr: string, simulatedOffsetMinutes = 0): boolean {
  const currentActualTimeMs = Date.now() + simulatedOffsetMinutes * 60 * 1000;
  const cutoffMs = getCutoffTimestamp(targetDateStr);
  return currentActualTimeMs >= cutoffMs;
}

/**
 * Formats countdown or lock status for a given target date
 */
export function getCutoffStatus(targetDateStr: string, simulatedOffsetMinutes = 0) {
  const nowMs = Date.now() + simulatedOffsetMinutes * 60 * 1000;
  const cutoffMs = getCutoffTimestamp(targetDateStr);
  const diffMs = cutoffMs - nowMs;

  const isLocked = diffMs <= 0;

  if (isLocked) {
    const elapsedMinutes = Math.floor(Math.abs(diffMs) / (60 * 1000));
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    const remainingMins = elapsedMinutes % 60;
    
    return {
      isLocked: true,
      timeRemaining: '00:00:00',
      hours: 0,
      minutes: 0,
      seconds: 0,
      statusText: 'Locked at 8:00 PM IST',
      detailText: `Locked ${elapsedHours > 0 ? `${elapsedHours}h ` : ''}${remainingMins}m ago`,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedCountdown = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    isLocked: false,
    timeRemaining: formattedCountdown,
    hours,
    minutes,
    seconds,
    statusText: `Closes in ${hours}h ${minutes}m`,
    detailText: `Deadline: 8:00 PM IST today`,
  };
}

/**
 * Get DayOfWeek from YYYY-MM-DD
 */
export function getDayOfWeek(dateStr: string): DayOfWeek {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const days: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[d.getUTCDay()];
}

/**
 * Format date for friendly human reading (e.g., "Wed, Nov 4, 2026")
 */
export function formatFriendlyDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Get current time string in IST (HH:MM:SS AM/PM)
 */
export function getISTTimeString(simulatedOffsetMinutes = 0): string {
  const istDate = getCurrentISTDate(simulatedOffsetMinutes);
  let hours = istDate.getUTCHours();
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes}:${seconds} ${ampm} IST`;
}
