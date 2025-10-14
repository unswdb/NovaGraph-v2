import { useMemo, useState } from "react";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResults,
} from "../../inputs";
import type { GraphNode, NodeSchema } from "../../types";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { capitalize } from "~/lib/utils";
import { createSchemaInput } from "../../schema-inputs";

export default function AttributesForm({
  node,
  nodeSchema,
}: {
  node: GraphNode;
  nodeSchema: NodeSchema;
}) {
  const inputs = [
    createAlgorithmSelectInput({
      id: "node-table-name",
      key: "tableName",
      displayName: "Table Name",
      source: "tables",
      disabled: true,
      required: true,
      defaultValue: node.tableName,
    }),
    createSchemaInput(nodeSchema.primaryKeyType, {
      id: `node-${nodeSchema.primaryKey}-pk`,
      key: nodeSchema.primaryKey,
      displayName: capitalize(nodeSchema.primaryKey),
      defaultValue: node._primaryKeyValue,
      disabled: true,
    }),
    ...Object.entries(nodeSchema.properties).map(([key, type]) =>
      createSchemaInput(type, {
        id: `node-${key}-non-pk`,
        key: key,
        displayName: capitalize(key),
        defaultValue: (node.attributes ?? {})[key],
        required: false,
      })
    ),
  ].flat();

  const [values, setValues] = useState(createEmptyInputResults(inputs));

  const isReadyToSubmit = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleSubmit
  const handleSubmit = () => {
    toast.success("Node attributes updated (not really, yet!)");
  };

  return (
    <>
      <div className="space-y-3 flex-1">
        {inputs.map((input, index) => (
          <InputComponent
            key={index}
            input={input}
            value={values[input.key].value}
            onChange={(value) =>
              setValues((prev) => ({
                ...prev,
                [input.key]: value,
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
