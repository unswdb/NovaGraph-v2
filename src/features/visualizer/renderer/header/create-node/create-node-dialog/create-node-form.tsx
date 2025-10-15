import { Loader } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useStore } from "~/features/visualizer/hooks/use-store";
import InputComponent, {
  createEmptyInputResults,
} from "~/features/visualizer/inputs";
import { createSchemaInput } from "~/features/visualizer/schema-inputs";
import type { GraphNode, NodeSchema } from "~/features/visualizer/types";
import { useAsyncFn } from "~/hooks/use-async-fn";
import { capitalize } from "~/lib/utils";

export default function CreateNodeDialogForm({
  nodesWithinSameTable,
  selectedNodeSchema,
  onClose,
}: {
  nodesWithinSameTable: GraphNode[];
  selectedNodeSchema: NodeSchema;
  onClose: () => void;
}) {
  const { controller, setGraphState } = useStore();

  const inputs = useMemo(() => {
    const { primaryKey, primaryKeyType, properties } = selectedNodeSchema;

    const primaryKeyInput = createSchemaInput(primaryKeyType, {
      id: `${selectedNodeSchema}-${primaryKey}-pk`,
      key: primaryKey,
      displayName: capitalize(primaryKey),
      placeholder: `Enter ${primaryKey}...`,
      validator: (value: unknown) => {
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
      createSchemaInput(type, {
        id: `${selectedNodeSchema}-${key}-non-pk`,
        key: key,
        displayName: capitalize(key),
        placeholder: `Enter ${key}...`,
        required: false,
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

  const { run: createNode, isLoading } = useAsyncFn(
    controller.db.createNode.bind(controller.db),
    {
      onSuccess: (result) => {
        setGraphState({
          nodes: result.nodes,
          edges: result.edges,
          nodeTables: result.nodeTables,
          edgeTables: result.edgeTables,
        });
        toast.success("Node created successfully!");
        onClose();
      },
    }
  );

  const handleOnSubmit = async () => {
    await createNode(selectedNodeSchema.tableName, values);
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
          onClick={handleOnSubmit}
          disabled={!isReadyToSubmit || isLoading}
          className="flex-1"
        >
          {isLoading ? <Loader className="animate-spin" /> : "Create"}
        </Button>
      </div>
    </>
  );
}
