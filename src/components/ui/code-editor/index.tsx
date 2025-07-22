import { Separator } from "../separator";
import { useLineNumbers } from "./use-line-number";

export default function CodeEditor({
  code,
  setCode,
}: {
  code: string;
  setCode: (s: string) => void;
}) {
  const { textAreaRef, lineNumbersRef, handleOnScroll, renderLineNumbers } =
    useLineNumbers();

  return (
    <div className="relative flex h-full border border-border rounded-md">
      {/* Line Numbers */}
      <div
        className="absolute top-0 left-0 w-14 flex flex-col h-full px-2 py-1 overflow-hidden font-mono text-typography-tertiary whitespace-pre pointer-events-none select-none"
        ref={lineNumbersRef}
      >
        {renderLineNumbers()}
      </div>
      <Separator
        orientation="vertical"
        className="absolute left-14 top-0 h-full opacity-50"
      />
      {/* Code Editor */}
      <textarea
        ref={textAreaRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onScroll={handleOnScroll}
        placeholder="Enter your code here..."
        spellCheck={false}
        className="resize-none w-full h-full py-1 ml-16 mr-1 outline-none font-mono whitespace-nowrap [&::-webkit-scrollbar]:hidden"
      />
    </div>
  );
}
