import type KuzuBaseService from "./KuzuBaseService";

type QueryResult = Awaited<ReturnType<KuzuBaseService["executeQuery"]>>;

const isPromise = <T>(value: any): value is Promise<T> =>
  Boolean(value) && typeof value.then === "function";

type QueryLike =
  | {
      success?: boolean;
      failedQueries?: Array<{ message?: string } | undefined> | undefined;
      message?: string;
      error?: string;
    }
  | null
  | undefined;

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
>(res: T): T {
  if (isPromise<QueryResult>(res)) {
    return res.then((resolved) => assertSuccess(resolved)) as T;
  }
  return assertSuccess(res as QueryResult) as T;
}
