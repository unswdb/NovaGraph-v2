import type KuzuBaseService from "./KuzuBaseService";

export function throwOnFailedQuery<
  T extends ReturnType<KuzuBaseService["executeQuery"]>,
>(res: T): T {
  if (!res.success) {
    const msg = res.failedQueries?.[0]?.message ?? "Unknown error";
    throw new Error(msg);
  }
  return res;
}
