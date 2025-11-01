import { useEffect, useState } from "react";

import type { InputComponentProps } from "..";

import type { TextInput } from "./types";

import { Input } from "~/components/form/input";

export default function TextInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<TextInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleTextOnChange = async (newValue: string) => {
    const required = !!input.required;

    if (!input.validate) {
      return { value: newValue, success: true };
    }

    const validator = await input.validator?.(newValue);
    const isValid = required
      ? validator && !!newValue.trim()
        ? validator.success
        : !!newValue.trim()
      : true;
    const message = required
      ? validator && !!newValue.trim()
        ? (validator.message ?? "")
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
      handleTextOnChange(input.defaultValue);
    }
  }, [input.defaultValue]);

  return (
    <>
      <Input
        id={input.id}
        type="text"
        value={value ? String(value) : ""}
        onChange={(e) => handleTextOnChange(e.target.value)}
        required={input.required}
        placeholder={input.placeholder}
        disabled={input.disabled}
      />
      {showError && errorMessage && (
        <p className="text-typography-critical xsmall-body mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
}
