import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import InputComponent, {
  createEmptyInputResults,
} from "~/features/visualizer/inputs";
import { createSchemaInput } from "~/features/visualizer/schema-inputs";
import type { EdgeSchema, GraphNode } from "~/features/visualizer/types";
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

  // TODO: Implement handleSubmit
  const handleSubmit = () => {
    console.log({
      source,
      target,
      edgeTable: edgeTablesMap.get(selectedEdgeSchema),
    });
    toast.success("Edge created (not really, yet!)");
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
