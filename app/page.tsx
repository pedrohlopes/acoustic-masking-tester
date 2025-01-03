'use client'
import { Link } from "@nextui-org/link";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { button as buttonStyles } from "@nextui-org/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import {createTable, dropTable} from "@/utils/DBHelpers";
import { useEffect } from "react";

const tableFields = {
  id: "INTEGER PRIMARY KEY AUTOINCREMENT",
  name: "TEXT",
  testType: "TEXT",
  calibrationGain: "REAL",
  grid: "TEXT",
  gridType: "TEXT",
  advancedSettings: "TEXT",
  responses: "TEXT",
  maskerInfo: "TEXT",
}

export default function Home() {
  useEffect(() => {
    // dropTable("test_results").then((result) => {
    //   console.log(result);
    // }
    // )
    // createTable("test_results", tableFields).then((result) => {
    //   console.log(result);
    // }
    // )


  }
  ,[])
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>
          Auditory masking perceptual tester
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Test the Auditory masking effect on your hearing
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
