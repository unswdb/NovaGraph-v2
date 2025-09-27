import { Input } from "~/components/form/input";
import type { TextInput } from "./types";
import { useEffect, useState } from "react";
import type { InputComponentProps } from "..";

export default function TextInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<TextInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (input.defaultValue) {
      onChange({ value: input.defaultValue, success: true });
    }
  }, [input.defaultValue]);

  const handleTextOnChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const required = !!input.required;

    const validator = await input.validator?.(newValue);
    const isValid = required
      ? validator
        ? validator.success
        : !!newValue.trim()
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
        type="text"
        value={value ? String(value) : ""}
        onChange={handleTextOnChange}
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
