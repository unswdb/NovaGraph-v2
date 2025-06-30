import { SidebarMenuButton } from "~/components/ui/sidebar";
import type { BaseGraphAlgorithm } from "../algorithms";
import { Separator } from "~/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/form/label";
import type React from "react";
import { cn } from "~/lib/utils";

export default function AlgorithmInput({
  algorithm,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  algorithm: BaseGraphAlgorithm;
}) {
  const menuButton = (
    <SidebarMenuButton
      className={cn("p-0 hover:[&>span]:bg-neutral-low", className)}
      {...props}
    >
      <Separator className="ml-4 mr-2" orientation="vertical" />
      <span className="flex items-center px-3 rounded-md h-full w-full text-ellipsis">
        {algorithm.title}
      </span>
    </SidebarMenuButton>
  );

  // Return just the button if doesn't require inputs from users
  if (algorithm.inputs.length <= 0) {
    return menuButton;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{menuButton}</DialogTrigger>
      <DialogContent>
        {/* Title + Description */}
        <DialogHeader>
          <DialogTitle>{algorithm.title}</DialogTitle>
          <DialogDescription>{algorithm.description}</DialogDescription>
        </DialogHeader>
        {/* Inputs */}
        <div className="space-y-4 mt-4">
          {algorithm.inputs.map((input, index) => {
            switch (input.type) {
              case "select":
                return (
                  <div key={index} className="space-y-1">
                    <Label htmlFor="">{input.label}</Label>
                  </div>
                );
              case "number":
                return <></>;
            }
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
