import { ArrowRight, Menu } from "lucide-react";
import { useNavigate } from "react-router";

import GlowBorderCard from "../../glow-border-card";
import { LS_KEY } from "../..";

import { Button } from "~/components/ui/button";
import Logo from "~/components/ui/logo";
import { useIsMobile } from "~/hooks/use-mobile";

export default function Navbar() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileNavbar /> : <DesktopNavbar />;
}

function MobileNavbar() {
  const navigate = useNavigate();

  return (
    <div className="relative flex items-center justify-between px-14 py-4">
      <Logo alt="NovaGraph" className="size-6 text-primary" />

      <Button variant="ghost" size="icon">
        <Menu />
      </Button>
    </div>
  );
}

function DesktopNavbar() {
  const navigate = useNavigate();

  const handleOnClick = () => {
    localStorage.setItem(LS_KEY, "app");
    navigate("/app");
  };

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
            top-4 z-10 rounded-full border border-white/15
            backdrop-blur supports-[backdrop-filter]:backdrop-blur
            shadow-lg
          "
        >
          <GlowBorderCard hoveredRadius={160}>
            <ul className="flex items-center gap-6 px-6 py-2">
              <li>
                <a
                  href="#home"
                  className="text-white/50 duration-150 hover:text-white"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#teams"
                  className="text-white/50 duration-150 hover:text-white"
                >
                  Teams
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-white/50 duration-150 hover:text-white"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-white/50 duration-150 hover:text-white"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </GlowBorderCard>
        </nav>
      </div>
      <Button onClick={handleOnClick}>
        Get Started <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
