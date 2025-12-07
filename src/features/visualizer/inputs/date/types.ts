import type { BaseInputType } from "../types";

type D = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

type YYYY = `${D}${D}${D}${D}`;
type DDs =
  | `0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `${1 | 2}${D}`
  | `3${0 | 1}`;
type HHs = `0${D}` | `1${D}` | `2${0 | 1 | 2 | 3}`;
type MIs = `${0 | 1 | 2 | 3 | 4 | 5}${D}`;
type SSs = `${0 | 1 | 2 | 3 | 4 | 5}${D}`;
type SSSs = `${D}${D}${D}`;

type NumFromString<S extends string> = S extends `${infer N extends number}`
  ? N
  : never;

export type YearNum = NumFromString<YYYY>; // 0..9999
export type DayNum = NumFromString<DDs>; // 1..31
export type HourNum = NumFromString<HHs>; // 0..23
export type MinuteNum = NumFromString<MIs>; // 0..59
export type SecondNum = NumFromString<SSs>; // 0..59
export type MillisecondNum = NumFromString<SSSs>; // 0..999

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "June",
  "July",
  "Aug",
  "Sept",
  "Oct",
  "Nov",
  "Dec",
] as const;
export type Month = (typeof MONTHS)[number];

export type DateValues = string;

export type DateParts = {
  year: YearNum;
  month: Month;
  day: DayNum;
};

export type DateInput = BaseInputType<DateValues> & {
  type: "date";
  min?: DateParts;
  max?: DateParts;
  step?: number; // in seconds
};

export type ValueForDate<I> = I extends DateInput ? DateValues : never;

export type PropsForDate<I> = I extends DateInput
  ? Partial<DateInput> & BaseInputType<DateValues>
  : never;
