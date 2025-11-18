import type KuzuBaseService from "./KuzuBaseService";

type QueryResult = Awaited<ReturnType<KuzuBaseService["executeQuery"]>>;

const isPromise = <T>(value: any): value is Promise<T> =>
  Boolean(value) && typeof value.then === "function";

type QueryLike = Partial<QueryResult> | null | undefined;

const extractErrorMessage = (result: QueryLike) =>
  result?.failedQueries?.[0]?.message ??
  result?.message ??
  result?.error ??
  "Unknown error";

function assertSuccess<T extends QueryResult>(result: T): T {
  const hasSuccessFlag =
    typeof result === "object" && result !== null && "success" in result;

  if (hasSuccessFlag) {
    const typedResult = result as QueryLike;
    if (!typedResult?.success) {
      throw new Error(extractErrorMessage(typedResult));
    }
    return result;
  }

  throw new Error(extractErrorMessage(null));
}

export function throwOnFailedQuery<
  T extends ReturnType<KuzuBaseService["executeQuery"]>,
>(res: T): Promise<T> | T {
  if (isPromise<QueryResult>(res)) {
    return res.then((resolved) => assertSuccess(resolved));
  }
  return assertSuccess(res);
}
