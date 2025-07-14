import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm transition-all disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-6 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-border focus-visible:ring-border/50 focus-visible:ring-[3px] aria-invalid:ring-critical/20 aria-invalid:border-critical",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-fore hover:bg-primary-hover disabled:bg-primary-disabled disabled:text-primary-fore-disabled",
        gradient:
          "bg-gradient-to-br from-primary to-primary-2 text-primary-fore  hover:from-primary-hover hover:to-primary-2-hover disabled:bg-none disabled:bg-primary-disabled disabled:text-primary-fore-disabled",
        critical:
          "bg-critical text-white hover:bg-critical-hover focus-visible:ring-critical/20 disabled:bg-critical-disabled disabled:text-critical-fore-disabled",
        outline:
          "border border-border bg-page hover:bg-neutral-low hover:text-foreground disabled:bg-neutral-disabled disabled:text-neutral-fore-disabled",
        ghost:
          "hover:bg-neutral-low hover:text-foreground disabled:text-neutral-fore-disabled",
        link: "text-primary underline-offset-4 hover:underline disabled:opacity-50",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-3",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
