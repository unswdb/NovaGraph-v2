import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";

const inputVariants = cva(
  "file:text-typography-primary placeholder:text-typography-tertiary selection:bg-typography-primary/20 selection:text-typography-primary flex h-9 w-full min-w-0 rounded-md bg-transparent px-3 py-1 transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-neutral file:rounded-sm file:px-2 file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: [
          "border-border border",
          "focus-visible:border-border focus-visible:ring-border focus-visible:ring-[3px]",
          "aria-invalid:ring-critical/20 dark:aria-invalid:ring-critical/40 aria-invalid:border-critical",
        ],
        ghost: ["border-0", "focus-visible:ring-0"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Input({
  className,
  variant = "default",
  type,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
