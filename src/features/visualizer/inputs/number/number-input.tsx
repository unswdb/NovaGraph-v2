import { Input } from "~/components/form/input";
import type { NumberInput } from "./types";
import type { InputComponentProps } from "../types";
import { useState } from "react";

export default function NumberInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<NumberInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleNumberOnChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = Number(e.target.value);
    if (isNaN(newValue)) {
      setShowError(true);
      setErrorMessage("Please enter a valid number.");
      onChange({ value: undefined, success: false, message: "Invalid number" });
      return;
    }

    if (!!input.min && newValue < input.min) {
      setShowError(true);
      setErrorMessage(`Value must be at least ${input.min}.`);
      onChange({
        value: undefined,
        success: false,
        message: `Value must be at least ${input.min}.`,
      });
      return;
    }

    if (!!input.max && newValue > input.max) {
      setShowError(true);
      setErrorMessage(`Value must not exceed ${input.max}.`);
      onChange({
        value: undefined,
        success: false,
        message: `Value must not exceed ${input.max}.`,
      });
      return;
    }

    const validator = await input.validator?.(newValue);
    const isValid = validator?.success ?? false;
    const message = validator?.message ?? "";

    setShowError(!isValid);
    setErrorMessage(message);

    onChange({
      value: newValue,
      success: validator?.success || false,
      message: validator?.message || "",
    });
  };

  return (
    <>
      <Input
        id={input.id}
        type="number"
        min={input.min ?? 0}
        max={input.max}
        value={String(value) ?? ""}
        required={input.required}
        placeholder={input.placeholder}
        defaultValue={input.defaultValue?.toString() ?? ""}
        onChange={handleNumberOnChange}
      />
      {showError && errorMessage && (
        <p className="text-typography-critical xsmall-body mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
}
