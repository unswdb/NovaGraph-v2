import type { InputType, PropsForInput } from "../inputs";

export type FieldContextKind = "primary" | "non-primary";

export interface SchemaInput<
  I extends InputType,
  T extends string = string,
  C extends readonly FieldContextKind[] = readonly FieldContextKind[],
> {
  /** Type/name of the Kuzu type */
  readonly type: T;

  /** Label/display name of the Kuzu type when shown as an option */
  readonly displayName: string;

  /** Contexts where the type is supported (e.g., primary, non-primary, or both) */
  readonly contexts: C;

  /** Function that builds the input */
  readonly build: (args: PropsForInput<I>) => I;
}

export function defineSchemaInput<
  I extends InputType,
  const T extends string,
  const C extends readonly FieldContextKind[],
>(schemaInput: SchemaInput<I, T, C>): SchemaInput<I, T, C> {
  return schemaInput;
}
