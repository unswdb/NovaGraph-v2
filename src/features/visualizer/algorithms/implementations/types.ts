import type { ReactNode } from "react";

import type { InputType } from "../../inputs";

import type { IgraphController } from "~/igraph/IgraphController";
import type { BaseGraphAlgorithmResult as IgraphBaseGraphAlgorithmResult } from "~/igraph/types";

export type BaseGraphAlgorithmResult = {
  type: "algorithm";
} & IgraphBaseGraphAlgorithmResult;

export interface GraphAlgorithmResult<TData = unknown>
  extends BaseGraphAlgorithmResult {
  data: TData;
}

type BivariantHandler<T> = {
  bivarianceHack(props: T): ReactNode;
}["bivarianceHack"];

// Type-erased base algorithm for generic lists
export interface BaseGraphAlgorithm<TResult = BaseGraphAlgorithmResult> {
  title: string;
  description: string;
  inputs: InputType[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wasmFunction: (controller: IgraphController, args: any[]) => Promise<TResult>;
  output: BivariantHandler<TResult>;
}

/** TData describes the format/structure of the output in addition from
 * colorMap, sizeMap, etc. Please refer to wasm/algorithms/ to inspect
 * the correct structure for your algorithm
 */
export interface GraphAlgorithm<TData = unknown>
  extends BaseGraphAlgorithm<GraphAlgorithmResult<TData>> {}

// Helper function for better type inference
export function createGraphAlgorithm<TData>(config: {
  title: string;
  description: string;
  inputs: InputType[];
  wasmFunction: (
    controller: IgraphController,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any[]
  ) => Promise<Omit<GraphAlgorithmResult<TData>, "type">>;
  output: (props: GraphAlgorithmResult<TData>) => ReactNode;
}): GraphAlgorithm<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const algorithmWasmFn = async (controller: IgraphController, args: any[]) => {
    const rawResult = await config.wasmFunction(controller, args);
    return { ...rawResult, type: "algorithm" } as const;
  };
  return { ...config, wasmFunction: algorithmWasmFn };
}
