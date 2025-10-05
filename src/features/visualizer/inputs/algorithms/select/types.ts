import type { GraphEdge, GraphNode } from "~/features/visualizer/types";
import type { BaseInputType } from "../../types";

type Nodes = { source: "nodes"; sources: GraphNode[]; blacklist?: GraphNode[] };
type Edges = { source: "edges"; sources: GraphEdge[]; blacklist?: GraphEdge[] };
type Static = { source: "static"; options: string[]; blacklist?: string[] };
type Tables = { source: "tables"; sources: string[]; blacklist?: string[] };

export type SingleValues = string | undefined;
export type MultipleValues = string[];

type AlgorithmSelectInputBase = { type: "algorithm-select" };

export type AlgorithmSingleSelectInput = AlgorithmSelectInputBase &
  BaseInputType<SingleValues> &
  (Nodes | Edges | Static | Tables) & {
    multiple?: false;
  };

export type AlgorithmMultipleSelectInput = AlgorithmSelectInputBase &
  BaseInputType<MultipleValues> &
  (Nodes | Edges | Static | Tables) & {
    multiple: true;
  };

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

export type PropsForSingleSelect = Omit<
  AlgorithmSingleSelectInput,
  "type" | "multiple" | keyof PropsForSelectDefault
> &
  Partial<PropsForSelectDefault> & { multiple?: false };

export type PropsForMultipleSelect = Omit<
  AlgorithmMultipleSelectInput,
  "type" | "multiple" | keyof PropsForSelectDefault
> &
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
