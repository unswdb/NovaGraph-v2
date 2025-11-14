import { ChevronDown, Loader, Plus, Trash } from "lucide-react";
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { toast } from "sonner";

import type { GraphDatabase } from "../types";

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
import { useAsyncFn } from "~/hooks/use-async-fn";

export default function ImportDropdown({
  database,
  databases,
  onSelectDatabase,
  onDeleteDatabase,
  className,
}: ComponentProps<"button"> & {
  database: GraphDatabase;
  databases: string[];
  onSelectDatabase: (name: string) => Promise<void>;
  onDeleteDatabase: (name: string) => Promise<void>;
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
          {database ? database.name : "Default"}
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
  database: GraphDatabase;
  databases: string[];
  onSelectDatabase: (name: string) => Promise<void>;
  onDeleteDatabase: (name: string) => Promise<void>;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { run: selectDatabase, isLoading: isSelecting } = useAsyncFn(
    onSelectDatabase,
    {
      onSuccess: () => {
        toast.success("Successfully switched database");
      },
      onError: () => {
        toast.error("Failed to switch database. Please try again later");
      },
    }
  );

  const { run: deleteDatabase, isLoading: isDeleting } = useAsyncFn(
    onDeleteDatabase,
    {
      onSuccess: () => {
        toast.success("Successfully deleted database");
      },
      onError: () => {
        toast.error("Failed to delete database. Please try again later");
      },
    }
  );

  const handleSelect = async (name: string) => {
    // Close when select already current database
    if (database.name === name) {
      setOpen(false);
      return;
    }
    await selectDatabase(name);
  };

  const handleDelete = async (name: string) => {
    await deleteDatabase(name);
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
                key={entry}
                value={entry}
                onSelect={() => handleSelect(entry)}
              >
                <div className="flex w-full items-center justify-between gap-2 h-8">
                  <span className="truncate">
                    {isSelecting && <Loader className="w-4 h-4 animate-spin" />}
                    {entry}
                  </span>
                  {database.name === entry ? (
                    <span className="px-2 py-1 text-xs text-typography-secondary border border-neutral rounded-full">
                      Active
                    </span>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDelete(entry);
                      }}
                    >
                      {isDeleting ? (
                        <Loader className="animate-spin" />
                      ) : (
                        <Trash className="size-4" />
                      )}
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
