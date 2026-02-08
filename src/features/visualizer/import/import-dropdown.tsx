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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

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
          className={cn("flex justify-between items-center", className)}
          title={`Database: ${database ? database.name : "Default"}`}
        >
          <span className="truncate">
            Database: <b>{database ? database.name : "Default"}</b>
          </span>
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
  const [selectingName, setSelectingName] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState<string | null>(null);

  const { run: selectDatabase, isLoading: isSelecting } = useAsyncFn(
    onSelectDatabase
  );

  const { run: deleteDatabase, isLoading: isDeleting } = useAsyncFn(
    onDeleteDatabase,
    {
      onSuccess: () => {
        toast.success("Database deleted successfully");
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

    setSelectingName(name);
    // Show notification when starting to connect to a new database
    toast.info(`Connecting to database "${name}"...`);
    try {
      await selectDatabase(name);
      toast.success(`Successfully connected to database "${name}"`);
    } catch (error) {
      toast.error(`Failed to connect to database "${name}". Please try again later`);
    } finally {
      setSelectingName(null);
    }
  };

  const handleDelete = async (name: string) => {
    await deleteDatabase(name);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen} modal={true}>
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
                className="block px-3"
              >
                <div className="flex items-center justify-between gap-2 h-8">
                  <div
                    title={entry}
                    className="flex-1 flex items-center gap-1 truncate"
                  >
                    {isSelecting && selectingName === entry && (
                      <Loader className="w-4 h-4 animate-spin" />
                    )}
                    <span className="truncate">{entry}</span>
                  </div>
                  {database.name === entry ? (
                    <span className="px-2 py-1 text-xs text-typography-secondary border border-neutral rounded-full">
                      Active
                    </span>
                  ) : (
                    <AlertDialog
                      key={entry}
                      open={alertDialogOpen === entry}
                      onOpenChange={(open) =>
                        setAlertDialogOpen(open ? entry : null)
                      }
                      aria-hidden="false"
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAlertDialogOpen(entry);
                          }}
                          onKeyDownCapture={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              setAlertDialogOpen(entry);
                            }
                          }}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onOverlayClick={(e) => {
                          e.stopPropagation();
                          setAlertDialogOpen(null);
                        }}
                      >
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete database "{entry}"?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the selected database
                            and all of its contents. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={(e) => {
                              e.stopPropagation();
                              setAlertDialogOpen(null);
                            }}
                            onKeyDownCapture={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                setAlertDialogOpen(null);
                              }
                            }}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry);
                              setAlertDialogOpen(null);
                            }}
                            onKeyDownCapture={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(entry);
                                setAlertDialogOpen(null);
                              }
                            }}
                          >
                            {isDeleting ? (
                              <Loader className="animate-spin" />
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
