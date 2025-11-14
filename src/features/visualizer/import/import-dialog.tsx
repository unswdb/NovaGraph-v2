import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader } from "lucide-react";

import InputComponent, { createEmptyInputResults } from "../inputs";
import { useStore } from "../hooks/use-store";

import ALL_IMPORTS, { type ImportOption } from "./implementations";

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { useAsyncFn } from "~/hooks/use-async-fn";

export default function ImportDialog({ onClose }: { onClose: () => void }) {
  const store = useStore();
  return (
    <DialogContent className="flex flex-col gap-2 max-h-[80vh] !max-w-[min(100%,calc(80vw))]">
      <DialogHeader>
        <DialogTitle>Import File</DialogTitle>
        <DialogDescription>
          Choose your import format or generate a graph
        </DialogDescription>
      </DialogHeader>
      <Tabs
        defaultValue={ALL_IMPORTS[0].value}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="mt-4 flex flex-col gap-4 md:flex-row flex-1 min-h-0">
          {/* Left Sidebar - Import Options with flex wrap on small, column on large */}
          <TabsList className="flex justify-start max-w-full h-full overflow-x-visible">
            <div className="flex-shrink-0 flex gap-2 md:flex-col md:flex-nowrap">
              {ALL_IMPORTS.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="px-4 py-2 truncate data-[state=active]:bg-neutral"
                >
                  <option.icon />
                  <p>{option.label}</p>
                </TabsTrigger>
              ))}
            </div>
          </TabsList>

          {/* Right Content - Tabbed Interface with separate overflow */}
          <div className="flex-1 flex flex-col min-h-0">
            {ALL_IMPORTS.map((option) => (
              <ImportContent
                key={option.value}
                option={option}
                store={store}
                onClose={onClose}
              />
            ))}
          </div>
        </div>
      </Tabs>
    </DialogContent>
  );
}

function ImportContent({
  option,
  store,
  onClose,
}: {
  option: ImportOption;
  store: any;
  onClose: () => void;
}) {
  const [inputResults, setInputResults] = useState(
    createEmptyInputResults(option.inputs)
  );
  const [error, setError] = useState("");

  // Memoised values
  const isReadyToSubmit = useMemo(
    () => Object.values(inputResults).every((v) => v.success),
    [inputResults]
  );

  const {
    run: importFile,
    isLoading,
    getErrorMessage,
  } = useAsyncFn(option.handler.bind(option), {
    onSuccess: async (result: any) => {
      if (result?.message) {
        toast.success(result.message);
      }

      if (result?.databaseName && result?.data) {
        store.setActiveDatabaseFromSnapshot(result.databaseName, {
          nodes: result.data.nodes,
          edges: result.data.edges,
          nodeTables: result.data.nodeTables,
          edgeTables: result.data.edgeTables,
          directed: result.data.directed,
        });
        await store.refreshDatabases();
      } else if (result?.data) {
        store.setGraphState({
          nodes: result.data.nodes,
          edges: result.data.edges,
          nodeTables: result.data.nodeTables,
          edgeTables: result.data.edgeTables,
          directed: result.data.directed,
        });
      }

      onClose();
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  const handleOnSubmit = async () => {
    await importFile({ values: inputResults, controller: store.controller });
  };

  return (
    <TabsContent
      key={option.value}
      value={option.value}
      className="overflow-y-auto flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col"
    >
      <Tabs defaultValue="upload" className="space-y-2">
        {!!option.preview && (
          <>
            <TabsList>
              {/* Tabs */}
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <Separator />
          </>
        )}
        <TabsContent value="upload" className="space-y-6 p-1">
          <div className="space-y-2">
            {/* Title + Description */}
            <div className="flex items-center gap-2">
              <option.icon />
              <h1 className="medium-title">{option.title}</h1>
            </div>
            {option.description && (
              <p className="small-body text-typography-secondary">
                {option.description}
              </p>
            )}
          </div>
          <div className="space-y-3">
            {/* Inputs */}
            {option.inputs.map((input, index) => (
              <InputComponent
                key={index}
                input={input}
                value={inputResults[input.key]?.value}
                onChange={(value) =>
                  setInputResults((prev) => ({
                    ...prev,
                    [input.key]: value,
                  }))
                }
              />
            ))}
          </div>
          {/* Additional Note */}
          {option.note && (
            <>
              <Separator />
              <p className="text-typography-secondary small-body">
                Note: {option.note}
              </p>
            </>
          )}
          <Button
            type="submit"
            onClick={handleOnSubmit}
            disabled={!isReadyToSubmit || isLoading}
          >
            {isLoading ? <Loader className="animate-spin" /> : "Create Graph"}
          </Button>
          {!!error && <p className="text-critical">{error}</p>}
        </TabsContent>
        {!!option.preview && (
          <TabsContent value="preview">
            <div className="space-y-2">
              {/* Title + Description */}
              {option.previewTitle && (
                <h1 className="medium-title">{option.previewTitle}</h1>
              )}
              {option.previewDescription && (
                <p className="small-body text-typography-secondary">
                  {option.previewDescription}
                </p>
              )}
            </div>
            <option.preview />
          </TabsContent>
        )}
      </Tabs>
    </TabsContent>
  );
}
