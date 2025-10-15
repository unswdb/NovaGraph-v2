import { useCallback, useState } from "react";

type AsyncFn<TArgs extends any[], TResult> = (
  ...args: TArgs
) => Promise<TResult>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

export function useAsyncFn<TArgs extends any[], TResult>(
  fn: AsyncFn<TArgs, TResult>,
  options: {
    onSuccess?: (result: TResult) => void;
    onError?: (error: unknown) => void;
    onFinally?: () => void;
  } = {}
) {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(
    async (...args: TArgs) => {
      setIsLoading(true);
      try {
        const result = await fn(...args);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        options.onError?.(err);
        throw err;
      } finally {
        setIsLoading(false);
        options.onFinally?.();
      }
    },
    [fn, options.onSuccess, options.onError, options.onFinally]
  );

  return { run, isLoading, getErrorMessage };
}
