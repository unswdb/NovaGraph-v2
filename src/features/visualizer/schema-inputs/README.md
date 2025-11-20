# Extending Schema Inputs for NovaGraph Visualizer

The schema-inputs folder contains implementations of inputs directly mapped to types supported by Kuzu, as defined in [Kuzu Data Types](https://kuzudb.github.io/docs/cypher/data-types/). During early development, we focused on types that we could clearly validate with edge cases we could anticipate, rather than supporting all types at once. If you decide to extend support to more types in the future, this guide will help you add new schema inputs to NovaGraph's visualizer.

## Steps to Extend Schema Inputs

### 1. Create a New File

To support a new schema input, create a new file under implementations/ with a name describing the type you want to support (e.g., `int64.ts`, `decimal.ts`, etc.).

### 2. Define the Schema Input

Inside the file, define the schema input class based on the `SchemaInput` interface located in `schema-inputs/types.ts`. Below is the definition of the `SchemaInput` interface:

```ts
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
```

The build function maps directly back to inputs supported in the `inputs/` folder, ensuring consistency between schema inputs and the input components used throughout the visualizer.

### 3. Example Implementation

Here’s an example of how to define a schema input for the INT8 type:

```ts
export const Int8SchemaInput = defineSchemaInput({
  type: "INT8" as const,
  displayName: "INT8",
  contexts: ["primary", "non-primary"],
  build: (args: PropsForInput<NumberInput>) => {
    return createNumberInput({
      ...args,
      min: -128,
      max: 127,
      step: 1,
      validator: (n) => {
        if (!Number.isInteger(n)) {
          return { success: false, message: "Must be an integer" };
        }
        if (!!args.validator) {
          return args.validator(n);
        }
        return { success: true };
      },
    });
  },
});
```

### 4. Register the Schema Input

After defining the schema input, register it in `implementations/index.ts` to make it available across the `visualizer/` folder.

## What to Consider Before Supporting a New Type

### 1. System Compability

Ensure the type can be readily supported in the system. For example:

- `INT64`: Requires an input that supports `BigInt` because it exceeds the range of JavaScript's `Number` type.
- `INT128`: Not supported. The algorithm can’t handle value with this type because igraph only supports 32-bit values.
- `DECIMAL`: May require specialized handling for precision and scale.

### 2. Edge Cases

Consider edge cases for the type:

- **Validation:** Define clear validation rules for the type (e.g., range limits, format checks).
- **Default Values:** Specify sensible default values for the type.

### 3. Kuzu Codebase Support

Check the level of support for the type in the Kuzu side of the codebase (`kuzu/`). Ensure the type is fully integrated and functional in Kuzu before adding it to the visualizer.

### 4. Additional Considerations

- **User Experience:** Ensure the input is intuitive and easy to use.
- **Performance:** Avoid complex validation logic that could slow down the application.
- **Documentation:** Clearly document the new type and its behavior.

## Conclusion

With this guide, you can extend schema inputs in NovaGraph's visualizer to support additional Kuzu types. Ensure proper validation, compatibility, and registration for each new type to maintain consistency and reliability across the codebase.
