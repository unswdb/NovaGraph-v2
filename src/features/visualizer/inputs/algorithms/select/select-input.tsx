import {
  isMultipleSelectInput,
  isSingleSelectInput,
  type AlgorithmMultipleSelectInput,
  type AlgorithmSelectInput,
  type AlgorithmSingleSelectInput,
  type MultipleValues,
  type SingleValues,
} from "./types";
import { useStore } from "~/features/visualizer/hooks/use-store";
import { useEffect, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { cn } from "~/lib/utils";
import type { InputComponentProps } from "../..";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "~/components/form/multi-select";

function buildItems(
  input: AlgorithmSelectInput,
  store: ReturnType<typeof useStore>
) {
  if (input.source === "nodes") {
    const nodes = store.database?.graph.nodes ?? [];
    const blacklist = new Set(input.blacklist ?? []);
    return nodes
      .filter((n) => !blacklist.has(n))
      .map((n) => ({
        value: n.id,
        label: `${n._primaryKeyValue} (${n.tableName})`,
      }));
  }

  if (input.source === "edges") {
    const edges = store.database?.graph.edges ?? [];
    const blacklist = new Set(input.blacklist ?? []);
    return edges
      .filter((e) => !blacklist.has(e))
      .map((e) => ({
        value: `${e.source}-${e.target}`,
        label: `${e.source} → ${e.target}`,
      }));
  }

  if (input.source === "tables") {
    const tables =
      Array.from(
        new Set(store.database?.graph.nodes.map((n) => n.tableName))
      ) ?? [];
    const blacklist = new Set(input.blacklist ?? []);
    return tables
      .filter((t) => !blacklist.has(t))
      .map((t) => ({
        value: t,
        label: t,
      }));
  }

  const blacklist = new Set(input.blacklist ?? []);
  return (input.options ?? [])
    .filter((opt) => !blacklist.has(opt))
    .map((opt) => ({ value: opt, label: opt }));
}

function getInputPlaceholder(input: AlgorithmSelectInput) {
  if (input.source === "nodes")
    return !!input.multiple ? "Select nodes..." : "Select a node...";
  if (input.source === "edges")
    return !!input.multiple ? "Select edges..." : "Select an edge...";
  if (input.source === "tables")
    return !!input.multiple ? "Select tables..." : "Select a table...";
  return !!input.multiple ? "Select options..." : "Select an option...";
}

function getInputNoun(input: AlgorithmSelectInput) {
  if (input.source === "nodes") return "node";
  if (input.source === "edges") return "edge";
  if (input.source === "tables") return "table";
  return "option";
}

export default function AlgorithmSelectInputComponent({
  input,
  value: inputValue,
  onChange,
}: InputComponentProps<AlgorithmSelectInput>) {
  const store = useStore();

  const sources = useMemo(() => buildItems(input, store), [input, store]);

  if (isSingleSelectInput(input)) {
    return (
      <AlgorithmSingleSelectInputComponent
        input={input}
        value={inputValue as SingleValues}
        onChange={onChange}
        sources={sources}
      />
    );
  }

  if (isMultipleSelectInput(input)) {
    return (
      <AlgorithmMultipleSelectInputComponent
        input={input}
        value={inputValue as MultipleValues}
        onChange={onChange}
        sources={sources}
      />
    );
  }

  return null;
}

function AlgorithmSingleSelectInputComponent({
  input,
  value,
  onChange,
  sources,
}: InputComponentProps<AlgorithmSingleSelectInput> & {
  sources: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const placeholder = useMemo(() => getInputPlaceholder(input), [input]);
  const noun = useMemo(() => getInputNoun(input), [input]);

  useEffect(() => {
    if (input.defaultValue) {
      onChange({ value: input.defaultValue, success: true });
    }
  }, [input.defaultValue]);

  const onValueChange = async (value: string) => {
    const newValue = value;
    const required = !!input.required;

    const validator = await input.validator?.(newValue);
    const isValid = required
      ? validator && !!newValue.trim()
        ? validator.success
        : !!newValue.trim()
      : true;
    const message = required
      ? validator && !!newValue.trim()
        ? validator.message ?? ""
        : "This field is required."
      : "";

    setShowError(!isValid);
    setErrorMessage(message);

    onChange({
      value: newValue,
      success: isValid,
      message: message,
    });
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={input.disabled}
          >
            {value
              ? sources.find((source) => source.value === value)?.label
              : placeholder}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder={placeholder} className="h-9" />
            <CommandList className="overflow-y-auto">
              <CommandEmpty>No {noun} found.</CommandEmpty>
              <CommandGroup>
                {sources.map((source) => (
                  <CommandItem
                    key={source.value}
                    value={source.label}
                    onSelect={() => {
                      onValueChange(source.value);
                      setOpen(false);
                    }}
                  >
                    {source.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === source.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {showError && errorMessage && (
        <p className="text-typography-critical xsmall-body mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
}

function AlgorithmMultipleSelectInputComponent({
  input,
  value: inputValues,
  onChange,
  sources,
}: InputComponentProps<AlgorithmMultipleSelectInput> & {
  sources: { value: string; label: string }[];
}) {
  const [values, setValues] = useState<MultipleValues>(inputValues ?? []);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const placeholder = useMemo(() => getInputPlaceholder(input), [input]);
  const noun = useMemo(() => getInputNoun(input), [input]);

  useEffect(() => {
    if (input.defaultValue) {
      onChange({ value: input.defaultValue, success: true });
    }
  }, [input.defaultValue]);

  useEffect(() => {
    setValues(inputValues ?? []);
  }, [inputValues]);

  const onValuesChange = async (newValues: string[]) => {
    const required = !!input.required;

    const validator = await input.validator?.(newValues);
    const isValid = required
      ? validator && newValues.length > 0
        ? validator.success
        : newValues.length > 0
      : true;
    const message = required
      ? validator && newValues.length > 0
        ? validator.message ?? ""
        : "This field is required."
      : "";

    setShowError(!isValid);
    setErrorMessage(message);

    onChange({
      value: newValues,
      success: isValid,
      message: message,
    });
  };

  return (
    <>
      <MultiSelect values={values} onValuesChange={onValuesChange}>
        <MultiSelectTrigger className="w-full" disabled={input.disabled}>
          <MultiSelectValue placeholder={placeholder} />
        </MultiSelectTrigger>
        <MultiSelectContent
          className="w-full"
          search={{ placeholder, emptyMessage: `No ${noun} yet.` }}
        >
          <MultiSelectGroup>
            {sources.map((source, index) => (
              <MultiSelectItem key={index} value={source.value}>
                {source.label}
              </MultiSelectItem>
            ))}
          </MultiSelectGroup>
        </MultiSelectContent>
      </MultiSelect>
      {showError && errorMessage && (
        <p className="text-typography-critical xsmall-body mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
}
