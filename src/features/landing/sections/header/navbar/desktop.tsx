import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import Logo from "~/components/ui/logo";
import GlowBorderCard from "~/features/landing/glow-border-card";

export default function DesktopNavbar() {
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
      <Button onClick={() => navigate("/app")}>
        Get Started <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
