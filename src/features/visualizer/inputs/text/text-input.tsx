import { Input } from "~/components/form/input";
import type { InputComponentProps } from "../types";
import type { TextInput } from "./types";
import { useState } from "react";

export default function TextInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<TextInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleTextOnChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    const validator = await input.validator?.(newValue);
    const isValid = validator ? validator.success : true;
    const message = validator ? validator.message ?? "" : "";

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
      />
      {showError && errorMessage && (
        <p className="text-typography-critical xsmall-body mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
}
