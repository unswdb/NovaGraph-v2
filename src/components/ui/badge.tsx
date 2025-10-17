import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-border focus-visible:ring-border/50 focus-visible:ring-[3px] aria-invalid:ring-critical/20 dark:aria-invalid:ring-critical/40 aria-invalid:border-critical transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-border bg-page text-typography-primary [a&]:hover:bg-page/90",
        secondary:
          "border-border bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        critical:
          "border-border bg-critical text-white [a&]:hover:bg-critical/90 focus-visible:ring-critical/20 dark:focus-visible:ring-critical/40 dark:bg-critical/60",
        outline:
          "text-typography-primary [a&]:hover:bg-border [a&]:hover:text-typography-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
