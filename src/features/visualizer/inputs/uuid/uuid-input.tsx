import { Input } from "~/components/form/input";
import type { UUIDInput } from "./types";
import { useEffect, useState } from "react";
import type { InputComponentProps } from "..";
import { Button } from "~/components/ui/button";
import type { UUID } from "crypto";

export default function UUIDInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<UUIDInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const generateUUID = () => {
    const newUUID = crypto.randomUUID();
    handleUUIDOnChange(newUUID);
  };

  const handleUUIDOnChange = async (newValue: UUID) => {
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
      handleUUIDOnChange(input.defaultValue);
    }
  }, [input.defaultValue]);

  return (
    <>
      <div className="flex gap-2 w-full">
        <Input
          id={input.id}
          type="text"
          value={value ? String(value) : ""}
          required={input.required}
          placeholder={input.placeholder}
          disabled={true}
          className="flex-1"
        />
        <Button disabled={input.disabled} onClick={generateUUID}>
          Generate
        </Button>
      </div>
      {showError && errorMessage && (
        <p className="text-typography-critical xsmall-body mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
}
