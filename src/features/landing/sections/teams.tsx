import FadeUpCopy from "../fade-up-copy";
import TextBlurCopy from "../text-blur-copy";

export default function Teams() {
  return (
    <section
      id="teams"
      className="text-center space-y-6 my-[10%] mx-auto w-4/5"
    >
      <TextBlurCopy>
        <p className="text-lg">Developed by individuals and teams at</p>
      </TextBlurCopy>
      <FadeUpCopy>
        <img alt="UNSW" src="unsw.svg" className="inline-block" />
      </FadeUpCopy>
    </section>
  );
}
