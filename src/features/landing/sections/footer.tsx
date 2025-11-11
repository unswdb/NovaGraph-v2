import { Github } from "lucide-react";

import { Button } from "~/components/ui/button";
import Logo from "~/components/ui/logo";

export default function Footer() {
  return (
    <footer className="flex items-center justify-between px-6 lg:px-14 py-4 border-t border-t-white/15">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Logo alt="NovaGraph" className="size-4 text-primary" />
          <p className="font-medium">NovaGraph</p>
        </div>
        <p className="text-xs text-white/50">Copyright © NovaGraph 2025 </p>
      </div>
      <Button variant="ghost" size="icon" asChild>
        <a
          href="https://github.com/unswdb/novagraph"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="NovaGraph GitHub"
        >
          <Github />
        </a>
      </Button>
    </footer>
  );
}
