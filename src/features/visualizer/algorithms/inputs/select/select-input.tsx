import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/form/select";
import type { SelectInput } from "./types";
import type { AlgorithmInputComponentProps } from "../types";

export default function SelectInputComponent({
  input,
  nodes,
  edges,
  value,
  onChange,
}: AlgorithmInputComponentProps<SelectInput>) {
  const source = input.source;
  const placeholder =
    source === "static"
      ? "Select an option..."
      : source === "edges"
      ? "Select an edge..."
      : "Select a node...";
  const sources =
    source === "static"
      ? (input.options ?? []).map((opt) => ({ value: opt, label: opt }))
      : source === "edges"
      ? edges.map((e) => ({
          value: `${e.source}-${e.target}`,
          label: `${e.source} → ${e.target}`,
        }))
      : nodes.map((n) => ({
          value: n.id,
          label: n.name ?? `Node ${n.id}`,
        }));

  return (
    <Select value={value ? String(value) : undefined} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {sources.map((source) => (
            <SelectItem key={source.value} value={source.value}>
              {source.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
