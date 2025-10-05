import { StringSchemaInput } from "./string";
import { supportContext } from "./types";

export const SCHEMA_INPUTS = [StringSchemaInput];

export const PK_SCHEMA_INPUTS = SCHEMA_INPUTS.filter(
  supportContext("primary")
);
export const PK_SCHEMA_TYPES = PK_SCHEMA_INPUTS.map((i) => i.type);
export type PrimaryKeyType = typeof PK_SCHEMA_TYPES[number];

export const NON_PK_SCHEMA_INPUTS = SCHEMA_INPUTS.filter(
    supportContext("non-primary")
);
export const NON_PK_SCHEMA_TYPES = NON_PK_SCHEMA_INPUTS.map((i) => i.type);
export type NonPrimaryKeyType = typeof NON_PK_SCHEMA_TYPES[number];

export type SchemaKeyType = PrimaryKeyType | NonPrimaryKeyType;