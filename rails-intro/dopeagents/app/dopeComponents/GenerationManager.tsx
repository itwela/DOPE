'use client'

import React, { useState } from "react";
import WrapButton  from "@/components/ui/wrap-button"
import { scrapeWebsiteForMarketingDataWithProgress, ScrapeUpdate } from "@/app/services/stagehandService"
import { useLLM } from "../contexts/LLMContext"
import { useToastMessage } from "../contexts/ToastMessageContext"
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
  const { setToastMessage } = useToastMessage();
  const [loading, setLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>("");

  const handleStart = async () => {
    setLoading(true);
    setStrategyLoading(false);
    setProgressMessage("Initializing...");
    setToastMessage("🚀 Starting website scraping...");
    
    try {
      const result = await scrapeWebsiteForMarketingDataWithProgress(
        selectedCompany?.website as string,
        (update: ScrapeUpdate) => {
          // Handle progress updates
          setProgressMessage(update.message);
          
          // Show progress in toast
          if (update.type === 'progress') {
            setToastMessage(`🔄 ${update.message}`);
          } else if (update.type === 'error') {
            console.error('Scraping error:', update.message);
            setToastMessage(`❌ ${update.message}`);
          } else if (update.type === 'complete') {
            console.log('Scraping completed successfully');
            setToastMessage(`✅ ${update.message}`);
          }
        }
      );
      
      if (result?.aggregatedData) {
        // IMMEDIATELY update UI with scraped data
        setCampaignElements({
          ...result.aggregatedData,
          images: result.aggregatedData.images || [],
          brandColors: [],
          campaignStrategies: []
        });
        
        setProgressMessage("Classifying images...");
        setToastMessage(" Classifying images with AI...");
        
        // Classify images with Gemini (limit to 10 to keep latency reasonable)
        const classifiedImages = await classifyImagesForOntologyGemini(result.aggregatedData.images);
        const finalClassifiedImages = Array.isArray(classifiedImages) ? classifiedImages : [];

        // UPDATE UI IMMEDIATELY with classified images
        setClassifiedImages(finalClassifiedImages);
        setCampaignElements((prev: any) => ({
          ...prev,
          images: finalClassifiedImages
        }));

        setProgressMessage("Extracting brand colors...");
        setToastMessage("🎨 Extracting brand colors from images...");
        
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

        // UPDATE UI IMMEDIATELY with brand colors
        setBrandColors(extractedBrandColors);
        setCampaignElements((prev: any) => ({
          ...prev,
          brandColors: extractedBrandColors
        }));

        // Now start campaign strategy loading
        setStrategyLoading(true);
        setProgressMessage("Generating campaign strategies...");
        setToastMessage("📊 Generating campaign strategies...");
        
        const campaignStrategies = await generateCampaignStrategies(
          result.aggregatedData,
          categories,
          finalClassifiedImages,
        );
        
        // FINAL UI UPDATE with campaign strategies
        setCampaignElements((prev: any) => ({
          ...prev,
          campaignStrategies: campaignStrategies
        }));
        
        setToastMessage("🎉 Campaign generation complete! Check the results below.");
      }
      
      // Set screenshot path in LLM context
      if (result?.screenshotPath) {
        setScreenshotPath(result.screenshotPath);
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      setToastMessage(`❌ Error during generation: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setStrategyLoading(false);
      setProgressMessage("");
    }
  }

  const getButtonText = () => {
    if (loading) {
      if (strategyLoading) {
        return "Generating campaign strategies...";
      }
      return progressMessage || "Loading...";
    }
    return "Start";
  };

  return (
    <div onClick={handleStart} className="p-1">
      <WrapButton>
        <span>{getButtonText()}</span>
      </WrapButton>
    </div>
  )
} 