import type { InputType, PropsForInput } from "../inputs";

type FieldContextKind = "primary" | "non-primary";

export interface SchemaInput<I extends InputType> {
  /** Type/name of the Kuzu type */
  readonly type: string;

  /** Label/display name of the Kuzu type when shown as an option */
  readonly displayName: string;

  /** Contexts where the type is supported (e.g., primary, non-primary, or both) */
  readonly contexts: readonly FieldContextKind[];

  /** Function that builds the input */
  readonly build: (args: PropsForInput<I>) => I;
}

export function defineSchemaInput<I extends InputType>(
  schemaInput: SchemaInput<I>
): SchemaInput<I> {
  return schemaInput;
}

export function supportContext<C extends FieldContextKind>(ctx: C) {
  return <T extends { contexts: readonly FieldContextKind[] }>(
    s: T
  ): s is T & { contexts: readonly (C | FieldContextKind)[] } =>
    s.contexts.includes(ctx);
}
