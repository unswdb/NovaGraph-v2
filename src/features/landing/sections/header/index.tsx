import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

import TextBlurCopy from "../../text-blur-copy";
import FadeUpCopy from "../../fade-up-copy";

import Navbar from "./navbar";

import { Button } from "~/components/ui/button";

export default function Header() {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative">
      {/* Gradient */}
      <div className="bg-primary/25 w-1/3 h-2/5 absolute -top-1/3 left-1/2 -translate-x-1/2 translate-y-1/3 rounded-b-full blur-3xl animate-pulse" />
      {/* Navbar */}
      <Navbar />
      {/* Headline */}
      <div className="flex flex-col justify-center text-center gap-16 py-[10%]">
        <div className="space-y-8">
          <div className="mx-auto w-4/5 max-w-3xl text-center space-y-6">
            <TextBlurCopy>
              <h1 className="text-5xl font-medium">
                Visualize, Analyze, Discover
              </h1>
            </TextBlurCopy>
            <TextBlurCopy>
              <p>
                Powered by WebAssembly (WASM), NovaGraph enables fast,
                interactive graph visualization and querying directly in the
                browser.
              </p>
            </TextBlurCopy>
          </div>
          <FadeUpCopy delay={2}>
            <Button
              className="relative before:bg-primary before:w-full before:h-full before:blur-2xl before:absolute before:opacity-50"
              size="lg"
              onClick={() => navigate("/app")}
            >
              Go to NovaGraph <ArrowRight />
            </Button>
          </FadeUpCopy>
        </div>
        <FadeUpCopy>
          <div className="w-4/5 mx-auto flex justify-center items-center bg-black p-4 rounded-md border border-white/15 animate-glow">
            <img
              alt="NovaGraph Preview"
              src="page.png"
              className="aspect-auto"
            />
          </div>
        </FadeUpCopy>
      </div>
    </section>
  );
}
