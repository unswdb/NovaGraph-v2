import { Input } from "~/components/form/input";
import type { FileInput } from "./types";
import { useState } from "react";
import type { InputComponentProps } from "..";

export default function FileInputComponent({
  input,
  onChange,
}: InputComponentProps<FileInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileOnChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newValue = files[0];
      const required = !!input.required;

      const validator = await input.validator?.(newValue);
      const isValid = required
        ? validator && !!newValue
          ? validator.success
          : !!newValue
        : true;
      const message = required
        ? validator && !!newValue
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

  return (
    <>
      <Input
        id={input.id}
        type="file"
        onChange={handleFileOnChange}
        required={input.required}
        accept={input.accept}
      />
      {showError && errorMessage && (
        <p className="text-typography-critical xsmall-body mt-1">
          {errorMessage}
        </p>
      )}
    </>
  );
}
