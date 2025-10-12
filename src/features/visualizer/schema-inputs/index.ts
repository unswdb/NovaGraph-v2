import type { InputType } from "../inputs";
import type { BaseInputType, PropsForInput } from "../inputs/types";
import * as SCHEMA_RAW_INPUTS from "./implementations";
import type { FieldContextKind, SchemaInput } from "./types";

const SCHEMA_INPUTS = Object.values(SCHEMA_RAW_INPUTS);

type AllSchemaInputs =
  (typeof SCHEMA_RAW_INPUTS)[keyof typeof SCHEMA_RAW_INPUTS];

type SchemaInputTypesByContext<Context extends FieldContextKind> =
  AllSchemaInputs extends SchemaInput<any, infer T, infer C>
    ? Context extends C[number]
      ? T
      : never
    : never;

export type PrimaryKeyType = SchemaInputTypesByContext<"primary">;
export type NonPrimaryKeyType = SchemaInputTypesByContext<"non-primary">;

export type SchemaKeyType = PrimaryKeyType | NonPrimaryKeyType;
export const SCHEMA_INPUT_MAP: Record<SchemaKeyType, AllSchemaInputs> =
  Object.fromEntries(
    SCHEMA_INPUTS.map((input) => [input.type, input])
  ) as Record<SchemaKeyType, AllSchemaInputs>;

function hasContext<C extends FieldContextKind>(
  contexts: readonly FieldContextKind[],
  context: C
): boolean {
  return contexts.includes(context);
}

export const PK_SCHEMA_TYPES = Object.keys(SCHEMA_INPUT_MAP).filter((key) =>
  hasContext(SCHEMA_INPUT_MAP[key as SchemaKeyType].contexts, "primary")
) as PrimaryKeyType[];
export const NON_PK_SCHEMA_TYPES = Object.keys(SCHEMA_INPUT_MAP).filter((key) =>
  hasContext(SCHEMA_INPUT_MAP[key as SchemaKeyType].contexts, "non-primary")
) as NonPrimaryKeyType[];

type SchemaInputValueTypesByContext<Context extends FieldContextKind> = {
  [K in keyof typeof SCHEMA_RAW_INPUTS]: (typeof SCHEMA_RAW_INPUTS)[K] extends SchemaInput<
    infer I,
    any,
    infer C
  >
    ? Context extends C[number]
      ? I extends BaseInputType<infer V>
        ? V
        : never
      : never
    : never;
}[keyof typeof SCHEMA_RAW_INPUTS];

export type PrimaryKeyValueType = SchemaInputValueTypesByContext<"primary">;
export type NonPrimaryKeyValueType =
  SchemaInputValueTypesByContext<"non-primary">;

type InputTypeForSchemaKeyType<T extends SchemaKeyType> = Extract<
  AllSchemaInputs,
  SchemaInput<any, T, any>
> extends SchemaInput<infer I, T, any>
  ? I
  : never;

type PropsForSchemaKeyType<T extends SchemaKeyType> = PropsForInput<
  InputTypeForSchemaKeyType<T>
>;

export function createSchemaInput<T extends SchemaKeyType>(
  schemaType: T,
  props: PropsForSchemaKeyType<T>
): InputTypeForSchemaKeyType<T> {
  const schemaInput = SCHEMA_INPUT_MAP[schemaType];
  return schemaInput.build(props as any) as InputTypeForSchemaKeyType<T>;
}
