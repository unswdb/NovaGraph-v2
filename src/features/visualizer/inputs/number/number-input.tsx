import { Input } from "~/components/form/input";
import type { NumberInput } from "./types";
import { useEffect, useState } from "react";
import type { InputComponentProps } from "..";

export default function NumberInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<NumberInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleNumberOnChange = async (newValue: number) => {
    const required = !!input.required;

    if (!input.validate) {
      return { value: newValue, success: true };
    }

    if (isNaN(newValue)) {
      setShowError(true);
      setErrorMessage("Please enter a valid number.");
      onChange({
        value: undefined,
        success: !required,
        message: "Invalid number",
      });
      return;
    }

    if (input.min !== undefined && newValue < input.min) {
      setShowError(true);
      setErrorMessage(`Value must be at least ${input.min}.`);
      onChange({
        value: undefined,
        success: !required,
        message: `Value must be at least ${input.min}.`,
      });
      return;
    }

    if (input.max !== undefined && newValue > input.max) {
      setShowError(true);
      setErrorMessage(`Value must not exceed ${input.max}.`);
      onChange({
        value: undefined,
        success: !required,
        message: `Value must not exceed ${input.max}.`,
      });
      return;
    }

    const validator = await input.validator?.(newValue);
    const isValid = required
      ? validator && newValue >= 0
        ? validator.success
        : newValue >= 0
      : true;
    const message = required
      ? validator && newValue >= 0
        ? validator.message ?? ""
        : "This field is required."
      : "";

    setShowError(!isValid);
    setErrorMessage(message);

    onChange({
      value: newValue,
      success: isValid,
      message: message,
    });
  };

  useEffect(() => {
    if (input.defaultValue) {
      handleNumberOnChange(Number(input.defaultValue));
    }
  }, [input.defaultValue]);

  return (
    <>
      <Input
        id={input.id}
        type="number"
        min={input.min ?? 0}
        max={input.max}
        step={input.step ?? 1}
        value={String(value ?? "")}
        placeholder={input.placeholder}
        onChange={(e) => handleNumberOnChange(Number(e.target.value))}
      />
      {showError && errorMessage && (
        <p className="text-typography-critical xsmall-body mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
}
