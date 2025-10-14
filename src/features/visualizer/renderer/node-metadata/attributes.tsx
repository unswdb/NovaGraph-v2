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
import { useStore } from "../../hooks/use-store";
import { useAsyncFn } from "~/hooks/use-async-fn";

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

  const store = useStore();
  const {
    run: updateNode,
    isLoading,
    getErrorMessage,
  } = useAsyncFn(store.controller.db.updateNode.bind(store.controller.db), {
    onSuccess: (result) => {
      toast.success("Node attributes updated");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleSubmit = async () => {
    let result = await updateNode(node, values);
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
