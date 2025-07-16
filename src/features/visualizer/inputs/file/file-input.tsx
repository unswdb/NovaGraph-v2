import { Input } from "~/components/form/input";
import type { InputComponentProps } from "../types";
import type { FileInput } from "./types";

export default function FileInputComponent({
  input,
  onChange,
}: InputComponentProps<FileInput>) {
  return (
    <Input
      id={input.id}
      type="file"
      onChange={(e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          onChange({ value: files[0], success: true });
        } else {
          onChange({
            value: undefined,
            success: false,
            message: "No file uploaded. Please try again.",
          });
        }
      }}
      required={input.required}
      accept={input.accept}
    />
  );
}
