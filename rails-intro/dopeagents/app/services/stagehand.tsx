'use server'

import StagehandConfig, { logLineToString } from "@/stagehand.config";
import { BrowserContext, Page, Stagehand, ObserveResult, LogLine } from "@browserbasehq/stagehand";
import { z } from "zod";

export async function scrapeWebsiteForMarketingData(url: string) {

    console.log(url)

    const gpt_4_1_nano_stagehand = new Stagehand({
        // With npx create-browser-app, this config is found 
        // in a separate stagehand.config.ts file
        env: "LOCAL",
        modelName: "gpt-4.1-nano",
        modelClientOptions: {
            apiKey: process.env.NODE_ENV === "production" ? process.env.OPENAI_API_KEY : process.env.NEXT_PUBLIC_OPENAI_API_KEY,

        },
        localBrowserLaunchOptions: {
            headless: true,
        },
        logger: (message: LogLine) =>
            console.log(logLineToString(message)) /* Custom logging function */,
    });

    await gpt_4_1_nano_stagehand.init();

    if (StagehandConfig.env === "BROWSERBASE" && gpt_4_1_nano_stagehand.browserbaseSessionID) {
        console.log(
            `View this session live in your browser: https://browserbase.com/sessions/${gpt_4_1_nano_stagehand.browserbaseSessionID}`
        );
    }

    const page = gpt_4_1_nano_stagehand.page;

    await page.goto(url);
    await page.act("Type in 'Browserbase' into the search bar");

    console.log("Stagehand page variable", page)

    const { services } = await page.extract({
		instruction: "Find and return 2 of the companies main services.",
		schema: z.object({
			services: z.array(z.string()),
		}),
	});

    console.log("Services", services)

    await gpt_4_1_nano_stagehand.close();

    return {
        status: "success",
        services: services,
    }

}



