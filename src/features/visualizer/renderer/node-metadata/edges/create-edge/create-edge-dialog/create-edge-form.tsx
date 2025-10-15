import { Loader } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useStore } from "~/features/visualizer/hooks/use-store";
import InputComponent, {
  createEmptyInputResults,
} from "~/features/visualizer/inputs";
import { createSchemaInput } from "~/features/visualizer/schema-inputs";
import type { EdgeSchema, GraphNode } from "~/features/visualizer/types";
import { useAsyncFn } from "~/hooks/use-async-fn";
import { capitalize } from "~/lib/utils";

export default function CreateEdgeDialogForm({
  source,
  target,
  selectedEdgeSchema,
  edgeTablesMap,
}: {
  source: GraphNode;
  target: GraphNode;
  selectedEdgeSchema: string;
  edgeTablesMap: Map<string, EdgeSchema>;
}) {
  const inputs = useMemo(() => {
    const { properties } = edgeTablesMap.get(selectedEdgeSchema) as EdgeSchema;

    const propertyInputs = Object.entries(properties).map(([key, type]) =>
      createSchemaInput(type, {
        id: `${selectedEdgeSchema}-${key}`,
        key: key,
        displayName: capitalize(key),
        placeholder: `Enter ${key}...`,
        required: false,
      })
    );

    return propertyInputs;
  }, [selectedEdgeSchema]);

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
    run: createEdge,
    isLoading,
    getErrorMessage,
  } = useAsyncFn(store.controller.db.createEdge.bind(store.controller.db), {
    onSuccess: (result) => {
      toast.success("Edge schema created successfully!");
      // onSubmit();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleSubmit = async () => {
    if (edgeTablesMap === undefined) {
      throw Error("Missing edge table when adding edge");
    }
    const edgeSchema = edgeTablesMap.get(selectedEdgeSchema);
    if (edgeSchema === undefined) {
      throw Error(`Edge schema '${selectedEdgeSchema}' not found`);
    }
    let result = await createEdge(source, target, edgeSchema, values);
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
          {isLoading ? <Loader className="animate-spin" /> : "Create Edge"}
        </Button>
      </div>
    </>
  );
}
