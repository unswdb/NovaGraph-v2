import { useCallback, useRef } from "react";

export const useLineNumbers = () => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleOnScroll = useCallback(() => {
    if (textAreaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  }, []);

  const getLineNumbers = useCallback(() => {
    if (!textAreaRef.current) return 1;
    return textAreaRef.current.value.split("\n").length;
  }, []);

  const renderLineNumbers = useCallback(() => {
    const lineNumbers = getLineNumbers();
    return Array.from({ length: lineNumbers }, (_, i) => (
      <p key={i} className="text-right">
        {i + 1}
      </p>
    ));
  }, [getLineNumbers]);

  return {
    textAreaRef,
    lineNumbersRef,
    handleOnScroll,
    getLineNumbers,
    renderLineNumbers,
  };
};
