'use client'

import React, { useState } from "react";
import WrapButton  from "@/components/ui/wrap-button"
import { scrapeWebsiteForMarketingData } from "@/app/services/stagehandService"
import { useLLM } from "../contexts/LLMContext"
import { classifyImagesForOntologyGemini, extractBrandColorsGemini, generateCampaignStrategies } from "../services/geminiService"
import { usePostcard } from "../contexts/PostcardContext"

interface ClassifiedImage {
  url: string;
  will_use_in_brand_color_extraction_tool?: boolean;
  [key: string]: unknown;
}

export const GenerationManager = () => {
  const { selectedCompany, setScreenshotPath, setBrandColors, setClassifiedImages, setCampaignElements } = useLLM();
  const { categories } = usePostcard();
  const [loading, setLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    setStrategyLoading(false);
    try {
      const result = await scrapeWebsiteForMarketingData(selectedCompany?.website as string);
      if (result?.aggregatedData) {
        // Classify images with Gemini (limit to 10 to keep latency reasonable)
        const classifiedImages = await classifyImagesForOntologyGemini(result.aggregatedData.images);
        const finalClassifiedImages = Array.isArray(classifiedImages) ? classifiedImages : [];

        // Extract brand colors from images marked for brand color extraction
        const brandColorImages = (finalClassifiedImages as ClassifiedImage[])
          .filter((img) => img.will_use_in_brand_color_extraction_tool === true)
          .map((img) => img.url);

        let extractedBrandColors: string[] = [];
        if (brandColorImages.length > 0) {
          extractedBrandColors = await extractBrandColorsGemini(brandColorImages);
        } else {
          extractedBrandColors = ["#1a1a1a", "#4a90e2", "#f39c12"];
        }

        // Now start campaign strategy loading
        setStrategyLoading(true);
        const campaignStrategies = await generateCampaignStrategies(
          result.aggregatedData,
          categories,
          finalClassifiedImages,
        );
        setStrategyLoading(false);

        // Only now set everything in context
        setClassifiedImages(finalClassifiedImages);
        setBrandColors(extractedBrandColors);
        if (setCampaignElements) {
          setCampaignElements({
            ...result.aggregatedData,
            images: finalClassifiedImages,
            brandColors: extractedBrandColors,
            campaignStrategies: campaignStrategies
          });
        }
      }
      // Set screenshot path in LLM context
      if (result?.screenshotPath) {
        setScreenshotPath(result.screenshotPath);
      }
    } finally {
      setLoading(false);
      setStrategyLoading(false);
    }
  }

  return (
    <div onClick={handleStart} className="p-1">
      <WrapButton>
        <span>{loading ? (strategyLoading ? "Generating campaign strategies..." : "Loading...") : "Start"}</span>
      </WrapButton>
    </div>
  )
} 