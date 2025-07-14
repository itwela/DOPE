"use client";

import Image from "next/image";
import DopeLogo from "../public/dopelogo.svg";
import DopeButton from "./components/dopebutton";
import React from "react";
import { usePostcard } from "./providers/PostcardProvider";
import DopeHeader from "./components/dopeheader";
import DopePostCard from "./components/dopepostcard";
import DopeConsole from "./components/dopeconsole";
import DopeImproveConsole from "./components/dopeimproveconsole";


export default function Home() {
  const { generatePostcard, postcardIsGenerating, wantsToGeneratePostcard, postcard } = usePostcard();

  return (
    <React.Fragment>

      <div className="w-full h-[100dvh]">


        <div className="w-full h-full overflow-hidden flex justify-center place-content-center bg-[#000001] place-items-center flex-col gap-4">

          {/* NOTE  WHEN THE USER IS NOT GENERATING ANYTHING */}
          {wantsToGeneratePostcard ? (
            <>
              <DopeHeader />

              {postcardIsGenerating ? (
                <div className="flex flex-col items-center justify-center gap-6">
                  {/* Loading Spinner */}
                  <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  
                  {/* Loading Text */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Creating Your Postcard</h2>
                    <p className="text-white/70">This may take up to 60 seconds...</p>
                  </div>

                  {/* Loading Steps */}
                  <div className="flex flex-col gap-2 text-sm items-center text-white/60">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                      <span>Generating content & strategy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-300"></div>
                      <span>Creating image prompt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-700"></div>
                      <span>Generating final image</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-8 h-max">
                  <div className="flex flex-row gap-8 relative items-center justify-center">
                    <DopePostCard />
                    <DopeConsole />
                  </div>

                  <DopeImproveConsole />
                </div>
              )}
            </>

          ) : (
            <>
              <div className="flex flex-row gap-4 relative items-center justify-center">
                <Image src={DopeLogo} alt="Dope Logo" className="w-[80px] h-[80px] select-none" />
                <h1 className="text-4xl font-bold select-none">Postcard Machine</h1>
              </div>

              <DopeButton onClick={() => generatePostcard('')} className="w-[200px] cursor-pointer bg-[#EA1D2E]">
                <p className="select-none font-bold">Generate Postcard</p>
              </DopeButton>

            </>
          )}

        </div>

      </div>

    </React.Fragment>
  );
}
