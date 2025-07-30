import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import ALL_IMPORTS, { type ImportOption } from "./implementations";
import { useMemo, useState } from "react";
import InputComponent, {
  createEmptyInputResults,
  type InputChangeResult,
} from "../inputs";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

export default function ImportDialog() {
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
              <ImportContent key={option.value} option={option} />
            ))}
          </div>
        </div>
      </Tabs>
    </DialogContent>
  );
}

function ImportContent({ option }: { option: ImportOption }) {
  const [inputResults, setInputResults] = useState<
    Record<string, InputChangeResult>
  >(createEmptyInputResults(option.inputs));
  const [error, setError] = useState("");

  // Memoised values
  const isReadyToSubmit = useMemo(
    () => Object.values(inputResults).every((v) => v.success),
    [inputResults]
  );

  const handleOnSubmit = async () => {
    toast("Creating graph...");

    const { success, message } = await option.handler({ values: inputResults });
    if (!success) {
      return setError(
        message ??
          "There's something wrong with creating the graph. Please try again."
      );
    }

    toast(message);
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
          <div className="space-y-4">
            {/* Inputs */}
            {option.inputs.map((input, index) => (
              <InputComponent
                key={index}
                input={input}
                value={inputResults[input.label]?.value}
                onChange={(value) =>
                  setInputResults((prev) => ({
                    ...prev,
                    [input.label]: value,
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
            disabled={!isReadyToSubmit}
          >
            Create Graph
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
