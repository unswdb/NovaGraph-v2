import type { BaseInputType } from "../../types";
import type { DayNum, HourNum, MillisecondNum, MinuteNum, Month, SecondNum, YearNum } from "../types";

export type DatetimeLocalValues = string;

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
