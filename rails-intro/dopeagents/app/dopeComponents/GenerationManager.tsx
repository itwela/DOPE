'use client'

import { Play, Edit } from "lucide-react"
import WrapButton  from "@/components/ui/wrap-button"
import { scrapeWebsiteForMarketingData } from "@/app/services/stagehand"
import { useLLM } from "../contexts/LLMContext"

export const GenerationManager = () => {

  const { selectedCompany } = useLLM();

  const handleStart = async () => {
    console.log("Start button clicked!")
    await scrapeWebsiteForMarketingData(selectedCompany?.website as string)
  }


    return (
        <div onClick={handleStart} className="p-1">
          <WrapButton>
            <span>Start</span>
          </WrapButton>
        </div>
    )
} 