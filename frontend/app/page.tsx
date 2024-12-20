import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>
          Acoustic masking perceptual tester
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Test the acoustic masking effect on your hearing
        </div>
      </div>

      <div className="flex gap-3">
        <a
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={"/tests"} 
        >
          Start testing
        </a>
      </div>

    </section>
  );
}
