import { cn } from "~/lib/utils";
import { useLoading } from "./use-loading";
import Logo from "../logo";

export function Loading({
  className,
  overlayClassName,
}: {
  className?: string;
  overlayClassName?: string;
}) {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center",
        overlayClassName
      )}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Loading content */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center space-y-2",
          className
        )}
      >
        {/* Logo */}
        <Logo alt="Loading..." className="text-primary size-12" />

        {/* Loading message */}
        {loadingMessage && (
          <p className="text-center text-white">{loadingMessage}</p>
        )}
      </div>
    </div>
  );
}

export * from "./use-loading";
