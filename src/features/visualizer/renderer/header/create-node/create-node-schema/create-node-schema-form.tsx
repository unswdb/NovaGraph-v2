import { useMemo, useState } from "react";
import InputComponent, {
  createEmptyInputResult,
  createTextInput,
  type TextInput,
} from "~/features/visualizer/inputs";
import type {
  NonPrimaryKeyType,
  PrimaryKeyType,
} from "~/features/visualizer/schema-inputs";
import type { GraphSchema } from "~/features/visualizer/types";

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
}: {
  nodeSchemas: GraphSchema[];
}) {
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
  const [fields, setFields] = useState<SchemaField[]>([]);

  // Table name is not empty and primary key is exactly one field
  const isReadyToSubmit = useMemo(
    () => !!tableName && fields.filter((f) => f.isPrimary).length === 1,
    [tableName, fields]
  );

  return (
    <InputComponent<TextInput>
      input={tableNameInput}
      value={tableName.value}
      onChange={setTableName}
    />
  );
}
