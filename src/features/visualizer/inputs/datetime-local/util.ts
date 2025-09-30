import { MONTHS, type DatetimeLocalParts, type Month } from "./types";

export function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

export function parseISOToDate(iso: string) {
  const date = new Date(iso);
  return date;
}

export function parseISOToDatetimeLocalParts(iso: string): DatetimeLocalParts {
  const date = parseISOToDate(iso);

  // Check for invalid ISO string
  if (!isValidDate(date)) {
    throw new Error(`Invalid ISO datetime string: "${iso}"`);
  }

  return {
    year: date.getFullYear(),
    month: MONTHS[date.getMonth()],
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisecond: date.getMilliseconds(),
  };
}

function isInteger(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n);
}

function pad(n: number, len = 2): string {
  return n.toString().padStart(len, "0");
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonthFor(year: number, month: number): number {
  switch (month) {
    case 1:
      return 31; // Jan
    case 2:
      return isLeapYear(year) ? 29 : 28; // Feb
    case 3:
      return 31; // Mar
    case 4:
      return 30; // Apr
    case 5:
      return 31; // May
    case 6:
      return 30; // Jun
    case 7:
      return 31; // Jul
    case 8:
      return 31; // Aug
    case 9:
      return 30; // Sep
    case 10:
      return 31; // Oct
    case 11:
      return 30; // Nov
    case 12:
      return 31; // Dec
    default:
      throw new Error(`Invalid month index: ${month}`);
  }
}

function monthToIndex(month: Month): number {
  const idx = MONTHS.indexOf(month);
  if (idx === -1) throw new Error(`Invalid month value: ${month}`);
  return idx + 1; // 1..12
}

export function parseDatetimeLocalPartsToISO(
  datetime: DatetimeLocalParts
): string {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = datetime;

  // year
  if (!isInteger(year) || year < 0 || year > 9999) {
    throw new Error(`Invalid year: ${year}. Expected integer in 0..9999.`);
  }

  // month
  const monthIndex = monthToIndex(month);

  // day (depends on month/year)
  if (!isInteger(day))
    throw new Error(`Invalid day: ${day}. Expected integer.`);
  const maxDay = daysInMonthFor(year, monthIndex);
  if (day < 1 || day > maxDay) {
    throw new Error(
      `Invalid day: ${day}. For ${month} ${year}, expected 1..${maxDay}.`
    );
  }

  // hour (0..23)
  if (!isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hour}. Expected integer in 0..23.`);
  }

  // minute (0..59)
  if (!isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute}. Expected integer in 0..59.`);
  }

  // second (0..59) — ignoring leap seconds
  if (!isInteger(second) || second < 0 || second > 59) {
    throw new Error(`Invalid second: ${second}. Expected integer in 0..59.`);
  }

  // millisecond (0..999)
  if (!isInteger(millisecond) || millisecond < 0 || millisecond > 999) {
    throw new Error(
      `Invalid millisecond: ${millisecond}. Expected integer in 0..999.`
    );
  }

  // Build the string
  const datePart = `${pad(year, 4)}-${pad(monthIndex)}-${pad(day)}`;
  const timePart = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  const frac = millisecond ? `.${pad(millisecond, 3)}` : "";

  return `${datePart}T${timePart}${frac}`;
}

export function parseDatetimeLocalPartsToDate(
  datetime: DatetimeLocalParts
): Date {
  return new Date(parseDatetimeLocalPartsToISO(datetime));
}
