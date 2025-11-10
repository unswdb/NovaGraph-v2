import type { BaseInputType } from "../../types";

import type { GraphEdge, GraphNode } from "~/features/visualizer/types";

type Nodes = { source: "nodes"; blacklist?: GraphNode[] };
type Edges = { source: "edges"; blacklist?: GraphEdge[] };
type Static = { source: "static"; options: string[]; blacklist?: string[] };
type Tables = { source: "tables"; blacklist?: string[] };

export type SingleValues = string | undefined;
export type MultipleValues = string[];

type AlgorithmSelectInputBase = { type: "algorithm-select" };

export type AlgorithmSingleSelectInput = AlgorithmSelectInputBase &
  (BaseInputType<SingleValues> &
    (Nodes | Edges | Static | Tables) & {
      multiple?: false;
    });

export type AlgorithmMultipleSelectInput = AlgorithmSelectInputBase &
  (BaseInputType<MultipleValues> &
    (Nodes | Edges | Static | Tables) & {
      multiple: true;
    });

export type AlgorithmSelectInput =
  | AlgorithmSingleSelectInput
  | AlgorithmMultipleSelectInput;

export type ValueForAlgorithmSelect<I> = I extends AlgorithmSelectInput
  ? I extends AlgorithmSingleSelectInput
    ? SingleValues
    : MultipleValues
  : never;

type PropsForSelectDefault = Pick<
  AlgorithmSelectInput,
  "required" | "showLabel" | "disabled"
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DistributiveOmit<T, K extends PropertyKey> = T extends any
  ? Omit<T, K>
  : never;

// Strip per-branch, but *distributively*
type SingleStripped = DistributiveOmit<
  AlgorithmSingleSelectInput,
  "type" | "multiple" | keyof PropsForSelectDefault
>;
type MultipleStripped = DistributiveOmit<
  AlgorithmMultipleSelectInput,
  "type" | "multiple" | keyof PropsForSelectDefault
>;

// 4) Re-add shared defaults (this intersection stays distributive)
export type PropsForSingleSelect = SingleStripped &
  Partial<PropsForSelectDefault> & { multiple?: false };
export type PropsForMultipleSelect = MultipleStripped &
  Partial<PropsForSelectDefault> & { multiple: true };

export type PropsForAlgorithmSelect<I> = I extends AlgorithmSelectInput
  ? I extends AlgorithmSingleSelectInput
    ? PropsForSingleSelect
    : PropsForMultipleSelect
  : never;

export function isSingleSelectInput(
  input: AlgorithmSelectInput
): input is AlgorithmSingleSelectInput {
  return !input.multiple;
}

export function isMultipleSelectInput(
  input: AlgorithmSelectInput
): input is AlgorithmMultipleSelectInput {
  return !!input.multiple;
}
