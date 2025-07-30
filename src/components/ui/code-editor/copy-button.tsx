import { useCallback, useState, type ReactNode } from "react";
import { Button } from "../button";
import { Copy } from "lucide-react";

export default function CopyButton({
  value,
  children,
  ...props
}: { value: string; children?: ReactNode } & React.ComponentProps<
  typeof Button
>) {
  const [copied, setCopied] = useState(false);

  const handleOnCopy = async () => {
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      } catch (error) {
        console.error("Failed to copy text: ", error);
      }
    }
  };

  return (
    <Button {...props} onClick={handleOnCopy} disabled={!value}>
      {copied ? "Copied!" : children || <Copy />}
    </Button>
  );
}
