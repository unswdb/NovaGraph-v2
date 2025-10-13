import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export type NonEmpty<T> = [T, ...T[]];

export function isNonEmpty<T>(arr: T[]): arr is NonEmpty<T> {
  return arr.length > 0;
}
