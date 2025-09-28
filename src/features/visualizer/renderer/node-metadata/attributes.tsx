import { useMemo, useState } from "react";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResults,
  createTextInput,
} from "../../inputs";
import type { GraphNode } from "../../types";
import { capitalize } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

export default function AttributesForm({ node }: { node: GraphNode }) {
  const inputs = [
    createTextInput({
      id: "node-id",
      label: "ID",
      disabled: true,
      placeholder: "Enter ID...",
      defaultValue: node.id,
      required: true,
    }),
    createAlgorithmSelectInput({
      id: "node-table-name",
      label: "Table Name",
      source: "tables",
      disabled: true,
      required: true,
      defaultValue: node.tableName,
    }),
    node.label
      ? createTextInput({
          id: "node-label",
          label: "Label",
          placeholder: "Enter label...",
          defaultValue: node.label,
          required: true,
          validator: async (value) => {
            const isValid = value.trim().length > 0;
            return {
              success: isValid,
              message: isValid ? "" : "Label cannot be empty",
            };
          },
        })
      : [],
    node.attributes
      ? Object.entries(node.attributes).map(([key, value]) =>
          createTextInput({
            id: `node-${key}`,
            label: capitalize(key),
            placeholder: `Enter ${key.toLocaleLowerCase()}...`,
            defaultValue: String(value),
            required: true,
          })
        )
      : [],
  ].flat();

  const [values, setValues] = useState(createEmptyInputResults(inputs));

  const isReadyToSubmit = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleSubmit
  const handleSubmit = () => {
    toast.success("Attributes updated (not really, yet!)");
  };

  return (
    <>
      <div className="space-y-3 flex-1">
        {inputs.map((input, index) => (
          <InputComponent
            key={index}
            input={input}
            value={values[input.label].value}
            onChange={(value) =>
              setValues((prev) => ({
                ...prev,
                [input.label]: value,
              }))
            }
          />
        ))}
      </div>
      <div className="ml-auto">
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={!isReadyToSubmit}
          className="flex-1"
        >
          Update
        </Button>
      </div>
    </>
  );
}
