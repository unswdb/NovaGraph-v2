<<<<<<< HEAD
import Logo from "~/components/ui/logo";
import Header from "./header";
=======
import { gsap } from "gsap";
import SplitText from "gsap/SplitText";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";

import Header from "./sections/header";
import NetworkBackground from "./network-background";
import SeparatorOnScroll from "./separator-on-scroll";
import Teams from "./sections/teams";
import ScrollCarousel from "./sections/features";
import HowItWorks from "./sections/how-it-works";
import CTA from "./sections/cta";
import Footer from "./sections/footer";
import ScrollUp from "./scroll-up";

// TODO: Assets to preload
const ASSETS = ["unsw.svg", "page.jpg"];

export const LS_KEY = "novagraph.landingPreference";

export default function Home() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const start = performance.now();

    const preloadImage = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = img.onerror = () => resolve();
        img.src = src;
      });

    const loadAll = async () => {
      // Redirect to app if user has visited /app previously
      const preference = localStorage.getItem(LS_KEY);
      if (preference === "app") {
        navigate("/app", { replace: true });
        return;
      }

      // Wait for fonts and images
      await Promise.all([
        document.fonts.ready ?? Promise.resolve(),
        ...ASSETS.map(preloadImage),
      ]);

      gsap.registerPlugin(SplitText, ScrollTrigger);

      // Ensure min duration (for animation pacing)
      const elapsed = performance.now() - start;
      const minDuration = 1000;
      if (elapsed < minDuration)
        await new Promise((r) => setTimeout(r, minDuration - elapsed));

      // Fade out splash
      gsap.to(".loading-overlay", {
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        onComplete: () => setIsLoaded(true),
      });
    };

    loadAll();
  }, [navigate]);

  if (!isLoaded) {
    return (
      <div className="loading-overlay fixed inset-0 z-[9999] grid place-items-center bg-black text-white transition-opacity">
        <Loader className="animate-spin" />
      </div>
    );
  }
>>>>>>> chore: lint

const Home = () => {
  return (
    <main className="relative bg-black h-[120vh]">
      {/* Headline */}
      <Header />
    </main>
  );
};

export default Home;
