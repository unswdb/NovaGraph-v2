import { Input } from "~/components/form/input";
import type { InputComponentProps } from "../types";
import type { FileInput } from "./types";
import { useState } from "react";

export default function FileInputComponent({
  input,
  onChange,
}: InputComponentProps<FileInput>) {
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileOnChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validator = await input.validator?.(files[0]);
      const isValid = validator ? validator.success : true;
      const message = validator ? validator.message ?? "" : "";

      setShowError(!isValid);
      setErrorMessage(message);

      onChange({
        value: files[0],
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
