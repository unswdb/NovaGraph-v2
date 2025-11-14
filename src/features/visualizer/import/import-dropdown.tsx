import { ChevronDown, Loader, Plus, Trash } from "lucide-react";
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { toast } from "sonner";

import type { DatabaseOption, GraphDatabase } from "../types";

import ImportDialog from "./import-dialog";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

export default function ImportDropdown({
  database,
  databases,
  onSelectDatabase,
  onDeleteDatabase,
  className,
}: ComponentProps<"button"> & {
  database: GraphDatabase | null;
  databases: DatabaseOption[];
  onSelectDatabase: (
    name: string
  ) =>
    | Promise<{ success: boolean; message?: string; error?: string }>
    | { success: boolean; message?: string; error?: string };
  onDeleteDatabase: (
    name: string
  ) =>
    | Promise<{ success: boolean; message?: string; error?: string }>
    | { success: boolean; message?: string; error?: string };
}) {
  // Refs
  const buttonRef = useRef<HTMLButtonElement>(null);

  // States
  const [open, setOpen] = useState(false);

  const triggerWidth = useMemo(
    () => buttonRef.current?.offsetWidth,
    [buttonRef.current?.offsetWidth, open]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          className={cn(
            "flex justify-between items-center truncate",
            className
          )}
        >
          {database ? database.label : "Default"}
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: triggerWidth }}
      >
        <Suspense fallback={<ImportListFallback />}>
          <ImportListSelector
            setOpen={setOpen}
            database={database}
            databases={databases}
            onSelectDatabase={onSelectDatabase}
            onDeleteDatabase={onDeleteDatabase}
          />
        </Suspense>
      </PopoverContent>
    </Popover>
  );
}

function ImportListSelector({
  setOpen,
  database,
  databases,
  onSelectDatabase,
  onDeleteDatabase,
}: {
  setOpen: (b: boolean) => void;
  database: GraphDatabase | null;
  databases: DatabaseOption[];
  onSelectDatabase: (
    name: string
  ) =>
    | Promise<{ success: boolean; message?: string; error?: string }>
    | { success: boolean; message?: string; error?: string };
  onDeleteDatabase: (
    name: string
  ) =>
    | Promise<{ success: boolean; message?: string; error?: string }>
    | { success: boolean; message?: string; error?: string };
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelect = (name: string) => {
    void (async () => {
      if (database?.name === name) {
        setOpen(false);
        return;
      }

      try {
        const result = await onSelectDatabase(name);
        if (result.success) {
          if (result.message) {
            toast.success(result.message);
          }
          setOpen(false);
        } else if (result.error) {
          toast.error(result.error);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to switch database"
        );
      }
    })();
  };

  const handleDelete = (name: string) => {
    void (async () => {
      try {
        const result = await onDeleteDatabase(name);
        if (result.success) {
          toast.success(result.message ?? `Deleted database "${name}"`);
          setOpen(false);
        } else if (result.error) {
          toast.error(result.error);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete database"
        );
      }
    })();
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Command value={database?.name}>
        <CommandInput placeholder="Filter database..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Existing Databases">
            {databases.map((entry) => (
              <CommandItem
                key={entry.name}
                value={entry.name}
                onSelect={() => handleSelect(entry.name)}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate">
                    {entry.label}
                    {database?.name === entry.name && (
                      <span className="ml-2 text-xs text-typography-secondary">
                        Active
                      </span>
                    )}
                  </span>
                  {database?.name !== entry.name && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDelete(entry.name);
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Create Graph">
            {/* Create graph options */}
            <DialogTrigger asChild>
              <CommandItem onSelect={() => setDialogOpen(true)}>
                <Plus />
                Create Graph
              </CommandItem>
            </DialogTrigger>
          </CommandGroup>
        </CommandList>
      </Command>
      <ImportDialog
        onClose={() => {
          setDialogOpen(false);
          setOpen(false);
        }}
      />
    </Dialog>
  );
}

function ImportListFallback() {
  return (
    <div className="bg-page flex items-center justify-center rounded-md gap-1 py-4">
      <Loader className="w-4 h-4 animate-spin" />
      <span className="small-body">Loading databases...</span>
    </div>
  );
}
