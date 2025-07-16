import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/form/select";
import type { AlgorithmSelectInput } from "./types";
import { useStore } from "~/features/visualizer/hooks/use-store";
import type { InputComponentProps } from "../../types";

export default function AlgorithmSelectInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<AlgorithmSelectInput>) {
  const store = useStore();

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
      ? store.database?.graph.edges.map((e) => ({
          value: `${e.source}-${e.target}`,
          label: `${e.source} → ${e.target}`,
        })) ?? []
      : store.database?.graph.nodes.map((n) => ({
          value: n.id,
          label: n.name ?? `Node ${n.id}`,
        })) ?? [];

  return (
    <Select
      value={value ? String(value) : undefined}
      onValueChange={(value) => onChange({ value, success: true })}
    >
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
