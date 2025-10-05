import type { InputType, PropsForInput } from "../inputs";

type FieldContextKind = "primary" | "non-primary";

type WithoutValidator<I extends InputType> = Omit<
  PropsForInput<I>,
  "validator"
>;

export interface SchemaInput<I extends InputType> {
  readonly type: string;
  readonly displayName: string;
  readonly contexts: readonly FieldContextKind[];
  readonly build: (args: WithoutValidator<I>) => I;
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
