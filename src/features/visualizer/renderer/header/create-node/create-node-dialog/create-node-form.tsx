import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useStore } from "~/features/visualizer/hooks/use-store";
import InputComponent, {
  createEmptyInputResults,
} from "~/features/visualizer/inputs";
import { SCHEMA_INPUT_MAP } from "~/features/visualizer/schema-inputs";
import type { NodeSchema } from "~/features/visualizer/types";
import { capitalize } from "~/lib/utils";

export default function CreateNodeDialogForm({
  selectedNodeSchema,
  nodeSchemasMap,
}: {
  selectedNodeSchema: string;
  nodeSchemasMap: Record<string, NodeSchema>;
}) {
  const { database } = useStore();

  const nodesWithinSameTable = useMemo(
    () =>
      database.graph.nodes.filter((t) => t.tableName === selectedNodeSchema),
    [database.graph.nodes, selectedNodeSchema]
  );

  const inputs = useMemo(() => {
    const { primaryKey, primaryKeyType, properties } =
      nodeSchemasMap[selectedNodeSchema];

    const primaryKeyInput = SCHEMA_INPUT_MAP[primaryKeyType].build({
      id: `${selectedNodeSchema}-${primaryKey}-pk`,
      key: primaryKey,
      displayName: capitalize(primaryKey),
      placeholder: `Enter ${primaryKey}...`,
      validator: (value) => {
        const primaryKeyValueExists = nodesWithinSameTable.some(
          (n) => n._primaryKeyValue === value
        );
        if (primaryKeyValueExists) {
          return {
            success: false,
            message: "Node with this primary key value already exist",
          };
        }
        return { success: true };
      },
    });

    const nonPrimaryKeyInputs = Object.entries(properties).map(([key, type]) =>
      SCHEMA_INPUT_MAP[type].build({
        id: `${selectedNodeSchema}-${key}-non-pk`,
        key: key,
        displayName: capitalize(key),
        placeholder: `Enter ${key}...`,
      })
    );

    return [primaryKeyInput, ...nonPrimaryKeyInputs];
  }, [selectedNodeSchema]);

  const [values, setValues] = useState(createEmptyInputResults(inputs));

  useEffect(() => {
    setValues(createEmptyInputResults(inputs));
  }, [inputs]);

  const isReadyToSubmit = useMemo(
    () => Object.values(values).every((v) => v.success),
    [values]
  );

  // TODO: Implement handleSubmit
  const handleSubmit = () => {
    toast.success("Node created (not really, yet!)");
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
          Create
        </Button>
      </div>
    </>
  );
}
