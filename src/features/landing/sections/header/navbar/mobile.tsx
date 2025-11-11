import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { X, Menu, ArrowRight } from "lucide-react";

import { Button } from "~/components/ui/button";
import Logo from "~/components/ui/logo";
import useNavigateApp from "~/features/landing/use-navigate-app";

export default function MobileNavbar() {
  const { navigateToApp } = useNavigateApp();
  const [open, setOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Build GSAP timeline once
  useLayoutEffect(() => {
    if (!panelRef.current || !listRef.current) return;

    const items = Array.from(listRef.current.querySelectorAll("li"));

    // initial states
    gsap.set(panelRef.current, { yPercent: -100 });
    gsap.set(items, { opacity: 0, y: 16 });

    timelineRef.current = gsap
      .timeline({
        paused: true,
        defaults: { duration: 0.75, ease: "power4.out" },
      })
      // slide panel down
      .to(panelRef.current, { yPercent: 0 }, 0)
      // list items fade-up with stagger
      .to(
        items,
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.5,
          ease: "power3.out",
          clearProps: "transform,opacity",
        },
        "-=0.2" // overlap a bit with the panel slide
      );

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, []);

  // Play / reverse on state change
  useEffect(() => {
    if (!timelineRef.current) return;
    if (open) timelineRef.current.play(0);
    else timelineRef.current.reverse();
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock overflow when open
  useEffect(() => {
    const el = document.documentElement;
    open
      ? el.classList.add("overflow-hidden")
      : el.classList.remove("overflow-hidden");
    return () => el.classList.remove("overflow-hidden");
  }, [open]);

  return (
    <>
      {/* top bar */}
      <div className="relative flex items-center justify-between px-6 p-4">
        <Logo alt="NovaGraph" className="size-6 text-primary" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          onClick={() => setOpen(true)}
        >
          <Menu />
        </Button>
      </div>

      {/* full-screen sliding panel */}
      <div
        id="mobile-nav-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="
          fixed inset-0 z-50
          bg-black backdrop-blur
          shadow-xl flex flex-col justify-between px-6 py-4
        "
      >
        <div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>

          <nav className="mt-2">
            <ul ref={listRef} className="flex flex-col space-y-2">
              <li>
                <a
                  href="#home"
                  className="block px-2 py-3 text-white/80 duration-150 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#teams"
                  className="block px-2 py-3 text-white/80 duration-150 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  Teams
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="block px-2 py-3 text-white/80 duration-150 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="block px-2 py-3 text-white/80 duration-150 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  How It Works
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <Button
          className="mx-auto w-full mb-6"
          onClick={() => {
            setOpen(false);
            navigateToApp();
          }}
          size="lg"
        >
          Get Started <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
    </>
  );
}
