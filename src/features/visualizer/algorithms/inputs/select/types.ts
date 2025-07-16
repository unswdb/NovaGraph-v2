export type SelectInput = {
  label: string;
  type: "select";
  source: "nodes" | "edges" | "static"; // Where select options come from
  multiple?: boolean; // For multi-select
  options?: string[]; // For static options
};
