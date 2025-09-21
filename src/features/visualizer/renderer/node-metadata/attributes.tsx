import { useMemo, useState } from "react";
import InputComponent, {
  createEmptyInputResults,
  createTextInput,
  type InputChangeResult,
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
      placeholder: "Node ID",
      defaultValue: node.id,
      required: true,
    }),
    node.label
      ? createTextInput({
          id: "node-label",
          label: "Label",
          placeholder: "Node Label",
          defaultValue: node.label,
          required: false,
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
            placeholder: `Node ${capitalize(key)}`,
            defaultValue: String(value),
            required: false,
          })
        )
      : [],
  ].flat();

  const [values, setValues] = useState<Record<string, InputChangeResult>>(
    createEmptyInputResults(inputs)
  );

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
