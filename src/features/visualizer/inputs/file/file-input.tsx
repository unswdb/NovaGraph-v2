import { useEffect, useState } from "react";

import type { InputComponentProps } from "..";

import type { FileInput } from "./types";

import { Input } from "~/components/form/input";

export default function FileInputComponent({
  input,
  onChange,
}: InputComponentProps<FileInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFile = async (newValue: File) => {
    const required = !!input.required;

    if (!input.validate) {
      return { value: newValue, success: true };
    }

    const validator = await input.validator?.(newValue);
    const isValid = required
      ? validator && !!newValue
        ? validator.success
        : !!newValue
      : true;
    const message = required
      ? validator && !!newValue
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

  const handleFileOnChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    } else {
      const errorMessage =
        "There's something wrong with uploading the file. Please try again.";
      setShowError(true);
      setErrorMessage(errorMessage);

      onChange({
        value: undefined,
        success: false,
        message: errorMessage,
      });
    }
  };

  useEffect(() => {
    if (input.defaultValue) {
      handleFile(input.defaultValue);
    }
  }, [input.defaultValue]);

  return (
    <>
      <Input
        id={input.id}
        type="file"
        onChange={handleFileOnChange}
        required={input.required}
        accept={input.accept}
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
