import { ChevronUp } from "lucide-react";

import { Button } from "~/components/ui/button";

export default function ScrollUp() {
  return (
    <a href="#home">
      <Button
        className="fixed bottom-8 right-8 h-12 w-12 bg-primary rounded-full"
        title="Scroll Up"
      >
        <ChevronUp />
      </Button>
    </a>
  );
}
