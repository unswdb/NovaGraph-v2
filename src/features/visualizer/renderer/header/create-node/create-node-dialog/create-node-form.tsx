import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useStore } from "~/features/visualizer/hooks/use-store";
import InputComponent, {
  createEmptyInputResults,
} from "~/features/visualizer/inputs";
import { createSchemaInput } from "~/features/visualizer/schema-inputs";
import type { NodeSchema } from "~/features/visualizer/types";
import { useAsyncFn } from "~/hooks/use-async-fn";
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

    // Todo: fix bug
    const nonPrimaryKeyInputs = Object.entries(properties).map(([key, type]) =>
      createSchemaInput(type, {
        id: `${selectedNodeSchema}-${key}-non-pk`,
        key: key,
        displayName: capitalize(key),
        placeholder: `Enter ${key}...`,
        required: false
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

  const store = useStore();
  const {
    run: createNode,
    isLoading,
    getErrorMessage,
  } = useAsyncFn(store.controller.db.createNode.bind(store.controller.db), {
    onSuccess: (result) => {
      toast.success("Node created successfully!");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleOnSubmit = async () => {
    // console.log(selectedNodeSchema)
    // console.log(values)
    // console.log(typeof values)

    let result = await createNode(
      selectedNodeSchema,
      values
    );

    console.log(result)
    if (
      result &&
      !!result.nodes &&
      !!result.edges &&
      !!result.nodeTables &&
      !!result.edgeTables
    ) {
      store.setGraphState({
        nodes: result.nodes,
        edges: result.edges,
        nodeTables: result.nodeTables,
        edgeTables: result.edgeTables,
      });
    }
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
          Create
        </Button>
      </div>
    </>
  );
}
