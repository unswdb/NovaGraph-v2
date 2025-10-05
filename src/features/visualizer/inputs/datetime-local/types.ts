import type { BaseInputType } from "../types";

export type DatetimeLocalValues = string;

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

type YearNum = NumFromString<YYYY>; // 0..9999
type DayNum = NumFromString<DDs>; // 1..31
type HourNum = NumFromString<HHs>; // 0..23
type MinuteNum = NumFromString<MIs>; // 0..59
type SecondNum = NumFromString<SSs>; // 0..59
type MillisecondNum = NumFromString<SSSs>; // 0..999

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

export type DatetimeLocalParts = {
  year: YearNum;
  month: Month;
  day: DayNum;
  hour?: HourNum;
  minute?: MinuteNum;
  second?: SecondNum;
  millisecond?: MillisecondNum;
};

export type DatetimeLocalInput = BaseInputType<DatetimeLocalValues> & {
  type: "datetime-local";
  placeholder?: string;
  defaultValue?: string;
  min?: DatetimeLocalParts;
  max?: DatetimeLocalParts;
  step?: number; // in seconds
};

export type ValueForDatetimeLocal<I> = I extends DatetimeLocalInput
  ? DatetimeLocalValues
  : never;

export type PropsForDatetimeLocal<I> = I extends DatetimeLocalInput
  ? Partial<DatetimeLocalInput> & BaseInputType<DatetimeLocalValues>
  : never;
