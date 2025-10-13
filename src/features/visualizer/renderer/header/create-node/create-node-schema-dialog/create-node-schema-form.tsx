import { Key, Loader, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { useStore } from "~/features/visualizer/hooks/use-store";
import InputComponent, {
  createAlgorithmSelectInput,
  createEmptyInputResult,
  createTextInput,
  type TextInput,
} from "~/features/visualizer/inputs";
import {
  NON_PK_SCHEMA_TYPES,
  PK_SCHEMA_TYPES,
  type NonPrimaryKeyType,
  type PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import type { GraphSchema } from "~/features/visualizer/types";
import { useAsyncFn } from "~/hooks/use-async-fn";

type SchemaField =
  | {
      name: string;
      type: NonPrimaryKeyType;
      isPrimary?: false;
    }
  | {
      name: string;
      type: PrimaryKeyType;
      isPrimary: true;
    };

export default function CreateNodeSchemaForm({
  nodeSchemas,
  onSubmit,
}: {
  nodeSchemas: GraphSchema[];
  onSubmit: () => void;
}) {
  const { controller } = useStore();

  const {
    run: createNodeSchema,
    isLoading,
    getErrorMessage,
  } = useAsyncFn(controller.db.createNodeSchema.bind(controller.db), {
    onSuccess: (result) => {
      toast.success("Node schema created successfully!");
      onSubmit();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const tableNameInput = createTextInput({
    id: "schema-node-table-name",
    key: "table_name",
    displayName: "Schema/Table Name",
    placeholder: "Enter schema/table name (e.g., Person, Product)...",
    required: true,
    validator: (value) => {
      const doesTableNameExist = nodeSchemas.some((s) => s.tableName === value);
      if (doesTableNameExist) {
        return {
          success: false,
          message:
            "A node schema with this name already exists. Please choose a different name.",
        };
      }
      return { success: true };
    },
  });

  const [tableName, setTableName] = useState(
    createEmptyInputResult(tableNameInput)
  );
  const [fields, setFields] = useState<SchemaField[]>([
    {
      name: "",
      type: PK_SCHEMA_TYPES[0],
      isPrimary: true,
    },
  ]);

  const primaryKeyCount = useMemo(
    () => fields.filter((f) => f.isPrimary).length,
    [fields]
  );

  const allFieldNamesUnique = useMemo(
    () => new Set(fields.map((f) => f.name.trim())).size === fields.length,
    [fields]
  );

  const isReadyToSubmit = useMemo(
    () =>
      !!tableName.success && // table name is valid
      fields.every((f) => !!f.name.trim()) && // every key isn't empty
      primaryKeyCount === 1 && // only one primary key is allowed
      allFieldNamesUnique, // all names unique
    [tableName, fields, primaryKeyCount]
  );

  const addNewField = () => {
    const newField: SchemaField = {
      name: "",
      type: NON_PK_SCHEMA_TYPES[0],
      isPrimary: false,
    };
    setFields((prev) => [...prev, newField]);
  };

  const deleteField = (index: number) => {
    setFields((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
  };

  const updateField = (index: number, updates: Partial<SchemaField>) => {
    setFields((prev) =>
      prev.map((field, i) => (i === index ? { ...field, ...updates } : field))
    );
  };

  const togglePrimaryKey = (index: number) => {
    setFields((prev) =>
      prev.map((field, i) => {
        if (i === index) {
          return {
            ...field,
            isPrimary: true,
            type: PK_SCHEMA_TYPES.includes(field.type)
              ? field.type
              : PK_SCHEMA_TYPES[0],
          };
        }
        return {
          ...field,
          isPrimary: false,
          type: NON_PK_SCHEMA_TYPES.includes(field.type)
            ? field.type
            : NON_PK_SCHEMA_TYPES[0],
        };
      })
    );
  };

  const store = useStore();
  const handleOnSubmit = async () => {
    if (isReadyToSubmit) {
      const primaryKeyField = fields.find((f) => f.isPrimary);
      const nonPrimaryFields = fields.filter((f) => !f.isPrimary);
      let result = await createNodeSchema(
        tableName.value!,
        primaryKeyField!.name,
        primaryKeyField!.type,
        nonPrimaryFields
      );

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
    }
  };
  const NodeSchemaFormError = () => {
    let errorMsg = "";

    if (primaryKeyCount === 0) {
      errorMsg = "You must specify exactly one primary key.";
    } else if (primaryKeyCount > 1) {
      errorMsg = "Only one primary key is allowed.";
    } else if (!allFieldNamesUnique) {
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
        <NodeSchemaFormError />
        {fields.map((field, index) => (
          <SchemaFieldInputs
            key={index}
            field={field}
            onChangeName={(name) => updateField(index, { name })}
            onChangeType={(type) => updateField(index, { type })}
            onTogglePrimary={() => togglePrimaryKey(index)}
            onDelete={() => deleteField(index)}
            canDelete={fields.length > 1}
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
  onTogglePrimary,
  onDelete,
  canDelete,
}: {
  field: SchemaField;
  onChangeName: (name: string | undefined) => void;
  onChangeType: (type: PrimaryKeyType | NonPrimaryKeyType) => void;
  onTogglePrimary: () => void;
  onDelete: () => void;
  canDelete: boolean;
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
        options: field.isPrimary ? PK_SCHEMA_TYPES : NON_PK_SCHEMA_TYPES,
        showLabel: false,
        required: true,
      }),
    [field.isPrimary]
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
    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-start">
      <Button
        type="button"
        variant={field.isPrimary ? "default" : "ghost"}
        size="icon"
        onClick={onTogglePrimary}
        title={field.isPrimary ? "Primary Key" : "Set as Primary Key"}
      >
        <Key className="h-4 w-4" />
      </Button>

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
        disabled={!canDelete}
        title="Delete Field"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
