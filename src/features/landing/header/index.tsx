import Navbar from "./navbar";
import TextBlurCopy from "../text-blur-reveal";

export default function Header() {
  return (
    <section className="relative">
      {/* Gradient */}
      <div className="bg-primary w-1/3 h-2/5 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full blur-3xl animate-pulse" />
      {/* Navbar */}
      <Navbar />
      <div className="flex justify-center text-center">
        <div className="mx-auto w-4/5 max-w-4xl text-center space-y-4">
          <TextBlurCopy>
            <p className="text-6xl font-medium">Visualize, Analyze, Discover</p>
          </TextBlurCopy>
          <TextBlurCopy>
            <p>
              Built on WebAssembly (WASM) technology, NovaGraph transforms your
              graph into interactive visual networks you can explore, analyze,
              and query with near-native speed
            </p>
          </TextBlurCopy>
        </div>
      </div>
    </section>
  );
}
