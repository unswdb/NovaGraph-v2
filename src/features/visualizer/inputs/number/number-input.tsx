import { Input } from "~/components/form/input";
import type { NumberInput } from "./types";
import { useState } from "react";
import type { InputComponentProps } from "..";

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
    const required = !!input.required;

    if (isNaN(newValue)) {
      setShowError(true);
      setErrorMessage("Please enter a valid number.");
      onChange({ value: "", success: !required, message: "Invalid number" });
      return;
    }

    if (!!input.min && newValue < input.min) {
      setShowError(true);
      setErrorMessage(`Value must be at least ${input.min}.`);
      onChange({
        value: "",
        success: !required,
        message: `Value must be at least ${input.min}.`,
      });
      return;
    }

    if (!!input.max && newValue > input.max) {
      setShowError(true);
      setErrorMessage(`Value must not exceed ${input.max}.`);
      onChange({
        value: "",
        success: !required,
        message: `Value must not exceed ${input.max}.`,
      });
      return;
    }

    const validator = await input.validator?.(newValue);
    const isValid = required
      ? validator
        ? validator.success
        : !!newValue
      : true;
    const message = required
      ? validator
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

  return (
    <>
      <Input
        id={input.id}
        type="number"
        min={input.min ?? 0}
        max={input.max}
        step={input.step ?? 1}
        value={String(value) ?? ""}
        placeholder={input.placeholder}
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
