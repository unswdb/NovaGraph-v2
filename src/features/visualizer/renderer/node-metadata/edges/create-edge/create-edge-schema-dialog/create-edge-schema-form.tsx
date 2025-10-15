import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Key, Loader, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAsyncFn } from "~/hooks/use-async-fn";
import {
  NON_PK_SCHEMA_TYPES,
  PK_SCHEMA_TYPES,
  type NonPrimaryKeyType,
  type PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import { useStore } from "~/features/visualizer/hooks/use-store";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResult,
  createTextInput,
  type TextInput,
} from "~/features/visualizer/inputs";

type EdgeSchemaField =
  | {
      name: string;
      type: NonPrimaryKeyType;
    }
  | {
      name: string;
      type: PrimaryKeyType;
    };

export default function CreateEdgeSchemaForm({
  onSubmit,
}: {
  onSubmit: () => void;
}) {
  const { controller, database } = useStore();
  const { edgeTables } = database.graph;

  const {
    run: createEdgeSchema,
    isLoading,
    getErrorMessage,
  } = useAsyncFn(controller.db.createEdgeSchema.bind(controller.db), {
    onSuccess: (result) => {
      // TODO: store.setGraphState({ nodes: result.nodes, edges: result.edges, ... });
      toast.success("Edge schema created successfully!");
      onSubmit();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const tableNameInput = createTextInput({
    id: "schema-edge-table-name",
    key: "table_name",
    displayName: "Schema/Table Name",
    placeholder: "Enter schema/table name (e.g., Directed, ActedIn)...",
    required: true,
    validator: (value) => {
      if (/^[0-9]/.test(value)) {
        return {
          success: false,
          message: "Table name cannot start with a number",
        };
      }

      if (!/^[A-Za-z0-9]+$/.test(value)) {
        return {
          success: false,
          message:
            "Table name can only contain alphanumeric characters (letters and numbers)",
        };
      }
      const doesTableNameExist = edgeTables.some((s) => s.tableName === value);
      if (doesTableNameExist) {
        return {
          success: false,
          message:
            "An edge schema with this name already exists. Please choose a different name.",
        };
      }
      return { success: true };
    },
  });

  const [tableName, setTableName] = useState(
    createEmptyInputResult(tableNameInput)
  );
  const [fields, setFields] = useState<EdgeSchemaField[]>([]);

  const allFieldNamesUnique = useMemo(
    () => new Set(fields.map((f) => f.name.trim())).size === fields.length,
    [fields]
  );

  const isReadyToSubmit = useMemo(
    () =>
      !!tableName.success &&
      fields.every((f) => !!f.name.trim()) &&
      allFieldNamesUnique,
    [tableName, fields, allFieldNamesUnique]
  );

  const addNewField = () => {
    const newField: EdgeSchemaField = {
      name: "",
      type: NON_PK_SCHEMA_TYPES[0],
    };
    setFields((prev) => [...prev, newField]);
  };

  const deleteField = (index: number) => {
    setFields((prev) => {
      return [...prev.slice(0, index), ...prev.slice(index + 1)];
    });
  };

  const updateField = (index: number, updates: Partial<EdgeSchemaField>) => {
    setFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const handleOnSubmit = async () => {
    if (isReadyToSubmit) {
      toast.success("Edge schema created (not really, yet!)");
    }
  };

  const SchemaFormError = () => {
    let errorMsg = "";

    if (!allFieldNamesUnique) {
      errorMsg = "Field names must be unique.";
    }

    return errorMsg ? (
      <p className="text-sm text-critical">{errorMsg}</p>
    ) : null;
  };

  return (
    <div className="space-y-4">
      <InputComponent<TextInput>
        input={tableNameInput}
        value={tableName.value}
        onChange={setTableName}
      />

      <div className="space-y-2">
        <p className="small-title">Fields</p>
        {/* Error */}
        <SchemaFormError />
        {fields.map((field, index) => (
          <SchemaFieldInputs
            key={index}
            field={field}
            onChangeName={(name) => updateField(index, { name })}
            onChangeType={(type) => updateField(index, { type })}
            onDelete={() => deleteField(index)}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addNewField}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      <Button
        type="button"
        onClick={handleOnSubmit}
        disabled={!isReadyToSubmit || isLoading}
        className="w-full"
      >
        {isLoading ? <Loader className="animate-spin" /> : "Create Schema"}
      </Button>
    </div>
  );
}

function SchemaFieldInputs({
  field,
  onChangeName,
  onChangeType,
  onDelete,
}: {
  field: EdgeSchemaField;
  onChangeName: (name: string | undefined) => void;
  onChangeType: (type: PrimaryKeyType | NonPrimaryKeyType) => void;
  onDelete: () => void;
}) {
  // Create stable input definitions that don't change
  const nameInput = useMemo(
    () =>
      createTextInput({
        id: `property-name-${Math.random()}`, // or use a stable ID if available
        key: "property_name",
        displayName: "Property Name",
        showLabel: false,
        required: true,
        placeholder: "Enter property name...",
      }),
    []
  );

  // Type input with dynamic options based on isPrimary
  const typeInput = useMemo(
    () =>
      createAlgorithmSelectInput({
        id: `property-type-${Math.random()}`, // or use a stable ID if available
        key: "property_type",
        displayName: "Property Type",
        source: "static",
        options: NON_PK_SCHEMA_TYPES,
        showLabel: false,
        required: true,
      }),
    []
  );

  const [nameValue, setNameValue] = useState(() =>
    createEmptyInputResult(nameInput)
  );

  const [typeValue, setTypeValue] = useState(() =>
    createEmptyInputResult(typeInput)
  );

  // Sync values from props (when toggling changes the type from parent)
  useMemo(() => {
    setNameValue((prev) => ({ ...prev, value: field.name }));
    setTypeValue((prev) => ({ ...prev, value: field.type }));
  }, [field.name, field.type]);

  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
      <InputComponent
        input={nameInput}
        value={nameValue.value}
        onChange={(result) => {
          setNameValue(result);
          onChangeName(result.value);
        }}
      />

      <InputComponent
        input={typeInput}
        value={typeValue.value}
        onChange={(result) => {
          setTypeValue(result);
          onChangeType(result.value as PrimaryKeyType | NonPrimaryKeyType);
        }}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        title="Delete Field"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
