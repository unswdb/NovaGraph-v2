# Creating a New Input Component for NovaGraph Visualizer

NovaGraph's visualizer uses input components extensively for various features, including **import options**, **export options**, **algorithm options**, and **schema input** classes. These input components are highly configurable and tailored for the visualizer's needs. This guide explains how to create a new input component, register it, and document its usage.

## Base Configuration Parameters

All input components share a set of configurable parameters defined in the `BaseInputType<T>` interface located in `inputs/types.ts`. As of updating the documentation, below is the code for `BaseInputType<T>`:

```ts
export interface BaseInputType<T> {
  id: string; // Unique identifier for the input
  key: string; // Key used to store the InputChangeResult object
  displayName: string; // Label or display name of the input
  required?: boolean; // Whether the input is required
  showLabel?: boolean; // Whether to show the label/display name
  disabled?: boolean; // Whether the input is disabled
  defaultValue?: T; // Default value of the input
  validate?: boolean; // Whether validation is enabled
  validator?: (
    // Custom validator function to run on top of basic validation
    value: T,
    ...props: any[]
  ) => InputResultType | Promise<InputResultType>;
}
```

## Value Type

All inputs deal with the value type being `InputChangeResult<T>`. This type includes:

- `value`: The current value of the input.
- `success`: A boolean indicating whether the input value passes validation.
- `message`: An optional error message if validation fails.

```ts
type InputResultType = { success: boolean; message?: string };
export type InputChangeResult<T> = { value: T } & InputResultType;
```

This ensures that all inputs provide consistent feedback on their state, including validation results and error messages.

## Steps to Create a New Input Component

### 1. Create a folder

Create a new folder under `inputs/` with a name describing the input type (e.g., `text`, `number`, `date`). This folder will contain all files related to the input component.

### 2. Create Required Files

Inside the folder, create the following files:

- `index.ts`: The entry point for the input component.
- `types.ts`: Defines the types specific to the input component.
- `[name]-input.tsx`: Contains the React component for the input.

### 3. Define Types (`types.ts`)

Each input component must define three types:

- `[name]Input`: Represents the input type and its configuration.
- `PropsFor[name]`: Defines the props required for the input.
- `ValueFor[name]`: Defines the type of the input's value.

Example for a `text` input:

```ts
import type { BaseInputType } from "../types";

export type TextValues = string;

export type TextInput = BaseInputType<TextValues> & {
  type: "text";
  placeholder?: string; // Exclusive configuration for text inputs
};

export type ValueForText<I> = I extends TextInput ? TextValues : never;

export type PropsForText<I> = I extends TextInput
  ? Partial<TextInput> & BaseInputType<TextValues>
  : never;
```

### 4. Create the Input Component (`[name]-input.tsx`)

Implement the React component for the input. Use the props and value types defined in `types.ts`.

### 5. Define the Entry Point (`index.tsx`)

The `index.ts` file serves as the entry point for the input component. It is **good practice** to import features from the entry point rather than specific files because it simplifies dependency management and ensures consistent usage across the codebase.

In this file:

- Define a function to create the input (e.g., `createTextInput`).
- Export the input component and its types.

Example for a `text` input:

```ts
import type { PropsForText, TextInput } from "./types";

export function createTextInput(input: PropsForText<TextInput>): TextInput {
  return {
    type: "text",
    placeholder: "",
    validate: true,
    required: true,
    showLabel: true,
    disabled: false,
    ...input,
  };
}

export type { TextInput, ValueForText, PropsForText } from "./types";
export { default as TextInputComponent } from "./text-input";
```

### 6. Register the Input Component

To make the input component available throughout the visualizer, you need to register it in two places:

#### a. Register Inputs to `index.tsx`

##### 1. Add Input to `INPUT_COMPONENTS`

Add the new input component to the INPUT_COMPONENTS array in `inputs/index.tsx`:

```ts
import { TextInput } from "./text";
import { NumberInput } from "./number";
import { DateInput } from "./date";

export const INPUT_COMPONENTS = {
  text: TextInput,
  number: NumberInput,
  date: DateInput,
};
```

##### 2. Expose The Input From `index.tsx`

At the end of the `index.tsx` file, export the create input function and its type:

```ts
export { createTextInput, type TextInput } from "./text";
```

#### b. Register Types in `inputs/types.ts`

Add the new input's types (`[name]Input`, `PropsFor[name]` and `ValueFor[name]`) to the `InputType`, `PropsForInput` and `ValueForInput` unions respectively in `inputs/types.ts`.

Example:

```ts
export type InputType =
  | TextInput
  | NumberInput
  | SwitchInput
  | FileInput
  | DateInput
  | DatetimeLocalInput
  | AlgorithmSelectInput
  | UUIDInput;

export type ValueForInput<I> =
  | ValueForText<I>
  | ValueForNumber<I>
  | ValueForSwitch<I>
  | ValueForFile<I>
  | ValueForDate<I>
  | ValueForDatetimeLocal<I>
  | ValueForAlgorithmSelect<I>
  | ValueForUUID<I>;

export type PropsForInput<I> =
  | PropsForText<I>
  | PropsForNumber<I>
  | PropsForSwitch<I>
  | PropsForFile<I>
  | PropsForDate<I>
  | PropsForDatetimeLocal<I>
  | PropsForAlgorithmSelect<I>
  | PropsForUUID<I>;
```

## Conclusion

By following this guide, you can create new input components that integrate seamlessly into NovaGraph's visualizer. Ensure proper registration and documentation for each input component to maintain consistency and clarity across the codebase.
