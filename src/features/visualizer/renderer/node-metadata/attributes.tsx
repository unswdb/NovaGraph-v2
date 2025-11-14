import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { observer } from "mobx-react-lite";

import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResults,
} from "../../inputs";
import type { GraphNode, NodeSchema } from "../../types";
import { createSchemaInput } from "../../schema-inputs";
import { useStore } from "../../hooks/use-store";

import { Button } from "~/components/ui/button";
import { capitalize } from "~/lib/utils";
import { useAsyncFn } from "~/hooks/use-async-fn";

const AttributesForm = observer(
  ({ node, nodeSchema }: { node: GraphNode; nodeSchema: NodeSchema }) => {
    const { controller, setGraphState } = useStore();

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
      () =>
        Object.values(values).every((v) => v.success) &&
        !!node.attributes &&
        Object.entries(node.attributes).some(([k, v]) => values[k].value != v),
      [values, node]
    );

    const { run: updateNode, isLoading } = useAsyncFn(
      controller.db.updateNode.bind(controller.db),
      {
        onSuccess: (result) => {
          setGraphState({
            nodes: result.nodes,
            edges: result.edges,
            nodeTables: result.nodeTables,
            edgeTables: result.edgeTables,
          });
          toast.success("Node attributes updated successfully!");
        },
      }
    );

    const handleSubmit = async () => {
      await updateNode(node, values);
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
            disabled={!isReadyToSubmit || isLoading}
            className="flex-1"
          >
            {isLoading ? <Loader className="animate-spin" /> : "Update"}
          </Button>
        </div>
      </>
    );
  }
);

export default AttributesForm;
