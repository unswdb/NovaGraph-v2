import { cn } from "~/lib/utils";
import { Separator } from "../separator";
import { useCallback, useEffect, useMemo, useRef } from "react";

export default function CodeEditor({
  code,
  setCode,
  className,
}: {
  code: string;
  setCode: (s: string) => void;
  className?: string;
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lineCount = useMemo(() => code.split(/\r?\n/).length, [code]);

  const handleOnScroll = useCallback(() => {
    if (textAreaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    handleOnScroll();
  }, [code]);

  return (
    <div
      className={cn(
        "relative flex h-full border border-border rounded-md",
        className
      )}
    >
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className={cn(
          "absolute top-0 left-0 w-14 h-full",
          "px-2 py-1 overflow-hidden pointer-events-none select-none",
          "font-mono text-typography-tertiary whitespace-pre"
        )}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="text-right">
            {i + 1}
          </div>
        ))}
      </div>

      <Separator
        orientation="vertical"
        className="absolute left-14 top-0 h-full opacity-50"
      />

      <textarea
        ref={textAreaRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onScroll={handleOnScroll}
        placeholder="Enter your code here..."
        spellCheck={false}
        className={cn(
          "resize-none w-full h-full py-1 ml-16 mr-1 outline-none font-mono",
          "whitespace-nowrap tab-[4] [&::-webkit-scrollbar]:hidden"
        )}
      />
    </div>
  );
}
