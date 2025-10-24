import { ChevronUp } from "lucide-react";

import { Button } from "~/components/ui/button";

export default function ScrollUp() {
  const scrollToTop = () => {
    const target = document.getElementById("home");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-[5%] right-[5%] h-12 w-12 bg-primary rounded-full"
      aria-label="Scroll to top of page"
      title="Scroll to top"
    >
      <ChevronUp />
    </Button>
  );
}
