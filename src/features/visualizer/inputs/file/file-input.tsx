import { Input } from "~/components/form/input";
import type { InputComponentProps } from "../types";
import type { FileInput } from "./types";

export default function FileInputComponent({
  input,
  value,
  onChange,
}: InputComponentProps<FileInput>) {
  return (
    <Input
      id={input.id}
      type="file"
      onChange={(e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          if (input.multiple) {
            onChange(files);
          } else {
            onChange(files[0]);
          }
        } else {
          onChange(undefined);
        }
      }}
      required={input.required}
      accept={input.accept}
      multiple={input.multiple}
    />
  );
}
