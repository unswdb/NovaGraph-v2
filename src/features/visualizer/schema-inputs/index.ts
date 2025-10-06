import * as SCHEMA_RAW_INPUTS from "./implementations";
import { supportContext } from "./types";

const SCHEMA_INPUTS = Object.values(SCHEMA_RAW_INPUTS);

export type SchemaKeyType = PrimaryKeyType | NonPrimaryKeyType;
export const SCHEMA_INPUT_MAP = Object.fromEntries(
  SCHEMA_INPUTS.map((input) => [input.type, input])
) as Record<SchemaKeyType, (typeof SCHEMA_INPUTS)[number]>;

export const PK_SCHEMA_INPUTS = SCHEMA_INPUTS.filter(supportContext("primary"));
export const PK_SCHEMA_TYPES = PK_SCHEMA_INPUTS.map((i) => i.type);
export type PrimaryKeyType = (typeof PK_SCHEMA_TYPES)[number];

export const NON_PK_SCHEMA_INPUTS = SCHEMA_INPUTS.filter(
  supportContext("non-primary")
);
export const NON_PK_SCHEMA_TYPES = NON_PK_SCHEMA_INPUTS.map((i) => i.type);
export type NonPrimaryKeyType = (typeof NON_PK_SCHEMA_TYPES)[number];
