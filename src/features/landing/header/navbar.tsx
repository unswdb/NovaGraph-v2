import { ArrowRight, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import Logo from "~/components/ui/logo";
import { useIsMobile } from "~/hooks/use-mobile";

export default function Navbar() {
  const isMobile = useIsMobile();
  return isMobile ? <nav>Mobile</nav> : <DesktopNavbar />;
}

function MobileNavbar() {}

function DesktopNavbar() {
  const navigate = useNavigate();

  return (
    <div className="relative flex items-center justify-between px-14 py-4">
      <div className="flex items-center gap-2">
        <Logo alt="NovaGraph" className="size-6 text-primary" />
        <span className="text-lg font-medium">NovaGraph</span>
      </div>
      <div className="pointer-events-none">
        <nav
          className="
            pointer-events-auto fixed left-1/2 -translate-x-1/2
            top-4 md:top-6 z-40
            rounded-full border border-white/15
            bg-white/10 dark:bg-white/5
            backdrop-blur supports-[backdrop-filter]:backdrop-blur
            shadow-lg
          "
        >
          <ul className="flex items-center gap-6 px-6 py-2">
            <li>
              <a href="#home" className="hover:text-primary">
                Home
              </a>
            </li>
            <li>
              <a href="#about-us" className="hover:text-primary">
                About Us
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="hover:text-primary">
                How It Works
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-primary">
                Features
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <Button onClick={() => navigate("/app")}>
        Get Started <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
