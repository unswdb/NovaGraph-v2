import { ArrowRight } from "lucide-react";

import TextBlurCopy from "../text-blur-copy";
import FadeUpCopy from "../fade-up-copy";
import useNavigateApp from "../use-navigate-app";

import { Button } from "~/components/ui/button";
import Logo from "~/components/ui/logo";

export default function CTA() {
  const { navigateToApp } = useNavigateApp();

  return (
    <section
      id="cta"
      className="mx-auto w-4/5 py-24 relative before:absolute before:aspect-square before:w-1/5 before:bg-primary-low before:rounded-full before:top-1/2 before:left-1/2 before:-translate-y-1/2 before:-translate-x-1/2 before:blur-3xl before:animate-pulse"
    >
      <div className="flex flex-col gap-12 items-center justify-center py-[10%]">
        <div className="text-center space-y-6">
          <div className="inline-block rounded-md p-2 bg-gradient-to-br from-primary to-primary-2">
            <Logo alt="NovaGraph" className="size-8" />
          </div>
          <TextBlurCopy>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-medium">
                Try NovaGraph Now
              </h1>
              <p className="text-white/50">
                Get started now to visualize, analyze, and discover your own
                graph
              </p>
            </div>
          </TextBlurCopy>
        </div>
        <FadeUpCopy className="inline-block">
          <Button
            className="relative before:bg-primary before:w-full before:h-full before:blur-2xl before:absolute before:opacity-50"
            size="lg"
            onClick={navigateToApp}
          >
            Go to NovaGraph <ArrowRight />
          </Button>
        </FadeUpCopy>
      </div>
    </section>
  );
}
