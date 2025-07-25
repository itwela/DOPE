'use server'

import StagehandConfig, { logLineToString } from "@/stagehand.config";
import { Page, Stagehand, LogLine } from "@browserbasehq/stagehand";
import { z } from "zod";
import fs from 'fs';
import { handleReplicateStream } from "./replicateService";

export interface AggregatedData {
    images: string[];
    fonts: string[];
    headlines: string[];
    subHeaders: string[];
    taglines: string[];
    coreServices: string[];
    allServices: string[];
    tones: string[];
    offers: string[];
    actions: string[];
    ctas: string[];
    companyFacts: string[];
    awards: string[];
    benefits: string[];
    highlightList: string[];
    testimonials: string[];
    reviews: string[];
    serviceAreas: string[];
    marketingQuestions: string[];
    scrapedUrls: string[];
    yearFounded: string | null;
    scrapedPagesLength: number;
    lowPriorityLinks?: unknown[];
}

// Add this above aggregateScrapedData
interface AggregatedDataMutable {
    images: Set<string>;
    fonts: Set<string>;
    headlines: Set<string>;
    subHeaders: Set<string>;
    taglines: Set<string>;
    coreServices: Set<string>;
    allServices: Set<string>;
    tones: Set<string>;
    offers: Set<string>;
    actions: Set<string>;
    ctas: Set<string>;
    companyFacts: Set<string>;
    awards: Set<string>;
    benefits: Set<string>;
    highlightList: Set<string>;
    testimonials: Set<string>;
    reviews: Set<string>;
    serviceAreas: Set<string>;
    marketingQuestions: Set<string>;
    scrapedUrls: Set<string>;
    yearFounded: string | null;
    scrapedPagesLength: number;
    lowPriorityLinks?: unknown[];
}

export interface ScraperToolResponse {
    status: string;
    discoveredLinks: number;
    scrapedPagesLength: number;
    aggregatedData: AggregatedData;
    screenshotPath: string;
    linkBreakdown: {
        high: number;
        medium: number;
        low: number;
    };
    rawScrapedData: unknown[];
    discoveredLinksDetails: {
        high_priority: unknown[];
        medium_priority: unknown[];
        low_priority: unknown[];
    };
    brandColors: string[];
    website: string;
}

// Helper function to get all images from a page
export async function getAllImagesFromPage(page: Page) {
    const images = await page.evaluate(() => {
        const allImages = Array.from(document.querySelectorAll('img[src], [style*="background-image"]'));
        const imageUrls = new Set<string>();

        // Get img src attributes
        allImages.forEach(img => {
            if (img.tagName === 'IMG') {
                const src = (img as HTMLImageElement).src;
                if (src && !src.startsWith('data:') && src.length > 10) {
                    imageUrls.add(src);
                }
            }

            // Get background images from style attributes
            const style = (img as HTMLElement).style.backgroundImage;
            if (style && style.includes('url(')) {
                const match = style.match(/url\((?:&quot;|['"])?([^'\"\)]+)(?:&quot;|['"])?\)/i);
                if (match && match[1] && !match[1].startsWith('data:')) {
                    imageUrls.add(match[1]);
                }
            }
        });

        return Array.from(imageUrls);
    });

    return images;
}

// Helper function to get all fonts from a page
export async function getAllFontsFromPage(page: Page) {
    const fonts = await page.evaluate(() => {
        const fontFamilies = new Set<string>();

        // Function to parse and clean font family strings
        const parseFontFamily = (fontFamily: string) => {
            if (!fontFamily || fontFamily === 'inherit' || fontFamily === 'initial' || fontFamily === 'unset') {
                return [];
            }

            // Split by comma and clean each font
            return fontFamily.split(',').map(font => {
                // Remove quotes and trim whitespace
                return font.replace(/['"]/g, '').trim();
            }).filter(font => {
                if (!font) return false;

                const lowerFont = font.toLowerCase();

                // Filter out CSS variables and functions
                if (font.includes('var(') || font.includes('--')) return false;

                // Filter out icon fonts
                const iconFonts = [
                    'fontawesome', 'font awesome', 'fa-', 'mfn-icons', 'revicons',
                    'star', 'icomoon', 'material icons', 'bootstrap-icons', 'feather'
                ];
                if (iconFonts.some(iconFont => lowerFont.includes(iconFont))) return false;

                // Filter out system fallbacks
                const systemFallbacks = [
                    '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'roboto',
                    'oxygen-sans', 'ubuntu', 'cantarell', 'helvetica neue', 'system-ui'
                ];
                if (systemFallbacks.includes(lowerFont)) return false;

                // Filter out generic fonts
                const genericFonts = [
                    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
                    'arial', 'verdana', 'helvetica', 'times', 'courier', 'georgia'
                ];
                if (genericFonts.includes(lowerFont)) return false;

                return true;
            });
        };

        // Function to prioritize brand fonts
        const prioritizeBrandFonts = (fonts: string[]) => {
            const brandFonts: string[] = [];
            const webFonts: string[] = [];
            const otherFonts: string[] = [];

            fonts.forEach(font => {
                const lowerFont = font.toLowerCase();

                // Known web/brand fonts get priority
                const knownBrandFonts = [
                    'poppins', 'proxima-nova', 'baskerville', 'raleway', 'open sans',
                    'montserrat', 'lato', 'source sans', 'roboto slab', 'playfair',
                    'inter', 'dm sans', 'nunito', 'work sans', 'merriweather'
                ];

                if (knownBrandFonts.some(brandFont => lowerFont.includes(brandFont))) {
                    brandFonts.push(font);
                } else if (font.includes('-') || font.includes(' ')) {
                    // Multi-word or hyphenated fonts are likely custom/brand fonts
                    webFonts.push(font);
                } else {
                    otherFonts.push(font);
                }
            });

            // Return prioritized list: brand fonts first, then web fonts, then others
            return [...brandFonts, ...webFonts, ...otherFonts];
        };

        // Get fonts from CSS rules (stylesheets)
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach(styleSheet => {
            try {
                const rules = Array.from(styleSheet.cssRules || styleSheet.rules || []);
                rules.forEach(rule => {
                    if (rule instanceof CSSStyleRule) {
                        const fontFamily = rule.style.fontFamily;
                        if (fontFamily) {
                            const fonts = parseFontFamily(fontFamily);
                            fonts.forEach(font => fontFamilies.add(font));
                        }
                    }
                });
            } catch (e) {
                // Skip stylesheets that can't be accessed (CORS issues)
                console.log('Could not access stylesheet:', e);
            }
        });

        // Get fonts from inline styles
        const elementsWithInlineStyles = Array.from(document.querySelectorAll('[style*="font-family"]'));
        elementsWithInlineStyles.forEach(element => {
            const style = (element as HTMLElement).style;
            const fontFamily = style.fontFamily;

            if (fontFamily) {
                const fonts = parseFontFamily(fontFamily);
                fonts.forEach(font => fontFamilies.add(font));
            }
        });

        // Get fonts from @font-face rules
        styleSheets.forEach(styleSheet => {
            try {
                const rules = Array.from(styleSheet.cssRules || styleSheet.rules || []);
                rules.forEach(rule => {
                    if (rule instanceof CSSFontFaceRule) {
                        const fontFamily = rule.style.fontFamily;
                        if (fontFamily) {
                            const fonts = parseFontFamily(fontFamily);
                            fonts.forEach(font => fontFamilies.add(font));
                        }
                    }
                });
            } catch (e) {
                console.log('Error accessing stylesheets:', e);
                // Skip stylesheets that can't be accessed
            }
        });

        const allFonts = Array.from(fontFamilies).filter(font => font.length > 0);

        return prioritizeBrandFonts(allFonts);
    });

    return fonts;
}

// Helper function to get all links from a page
export async function getAllLinksFromPage(page: Page, baseUrl: string) {
    
    const links = await page.evaluate((baseUrl) => {
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        return allLinks
            .map(link => {
                const href = link.getAttribute('href');
                if (!href) return null;

                // Convert relative URLs to absolute
                let fullUrl;
                try {
                    fullUrl = new URL(href, baseUrl).href;
                } catch {
                    return null;
                }

                return {
                    url: fullUrl,
                    text: link.textContent?.trim() || '',
                    title: link.getAttribute('title') || ''
                };
            })
            .filter((link): link is { url: string, text: string, title: string } => link !== null)
            .filter(link => link.url.startsWith(baseUrl)) // Only same-domain links
            .reduce((unique: Array<{ url: string, text: string, title: string }>, link) => {
                // Remove duplicates
                if (!unique.find(u => u.url === link.url)) {
                    unique.push(link);
                }
                return unique;
            }, []);
    }, baseUrl);

    return links;
}

// Helper function to categorize and prioritize links
export async function categorizeLinks(links: Array<{ url: string, text: string, title: string }>) {
    const categories: {
        high_priority: Array<{ url: string, text: string, title: string }>,
        medium_priority: Array<{ url: string, text: string, title: string }>,
        low_priority: Array<{ url: string, text: string, title: string }>
    } = {
        high_priority: [],
        medium_priority: [],
        low_priority: []
    };

    const highPriorityKeywords = [
        'about', 'services', 'team', 'staff', 'contact', 'testimonials',
        'reviews', 'portfolio', 'work', 'projects', 'awards', 'recognition',
        'info', 'information', 'details'
    ];

    const mediumPriorityKeywords = [
        'blog', 'news', 'gallery', 'locations', 'areas', 'service-area',
        'pricing', 'offers', 'deals', 'specials', 'learn', 'more', 'how',
        'what', 'why', 'get', 'started', 'quote', 'estimate', 'consultation'
    ];

    links.forEach(link => {
        const linkText = (link.text + ' ' + link.url + ' ' + link.title).toLowerCase();

        if (highPriorityKeywords.some(keyword => linkText.includes(keyword))) {
            categories.high_priority.push(link);
        } else if (mediumPriorityKeywords.some(keyword => linkText.includes(keyword))) {
            categories.medium_priority.push(link);
        } else {
            categories.low_priority.push(link);
        }
    });

    return categories;
}

// Helper function to scrape individual page data
export async function scrapePageData(page: Page, url: string, pageType: string) {


    const campaignPrompt = `
        You are ScraperTool, a world-class web scraper for marketing research. 
        Extract the most comprehensive, real, and live data from this "${pageType}" page at ${url}.
        Your output should be exhaustive and structured for use by a marketing agency to create flyers and campaigns.

        Focus on finding and returning the following (if present):


        - headlines: Extract marketing-ready headlines (3-15 words). EXCLUDE: paragraphs (>15 words), navigation/section labels, standalone numbers, questions. INCLUDE: Brand statements, service headlines with benefits, credibility claims. Focus on postcard-ready headlines that are punchy and action-oriented. (headlines: [])
        - subHeaders: Extract postcard-ready sub headers (3-12 words). EXCLUDE: navigation/footer links, incomplete fragments, full paragraphs, generic service names without benefits. INCLUDE: Credibility statements, service highlights with benefits, availability promises. Transform generic services into value propositions. (subHeaders: [])
        - taglines: Extract actual brand taglines and slogans (3-7 words). EXCLUDE: CTAs, paragraphs, service descriptions, vague phrases. FOCUS: Short, memorable brand positioning statements that communicate unique value. Look for actual company slogans, not marketing copy. (taglines: [])
        - coreServices: The main/core services offered if present on the page. (coreServices: [])
        - allServices: Every service mentioned, even if not core if present on the page. (allServices: [])
        ${pageType === "homepage" ? '- tone: Based on this homepage, suggest exactly 3 distinct marketing campaign tone options that would work for this company. Focus on tones that match their brand personality and target audience. (e.g. "professional and trustworthy", "friendly and approachable", "bold and confident", "local and community-focused") (tone: string)' : ''}
        - offers: Any special offers, deals, discounts, or promotions if present on the page. (offers: [])
        - url: The current page URL (url: string)
        - actions: All clear actions or CTAs (e.g. schedule_appointment, contact_us, buy_now, etc.) (actions: [])
        - ctas: Extract actionable call-to-action phrases that drive response. EXCLUDE: form field labels, media controls, generic navigation, context-less buttons, service names without action verbs. INCLUDE: Clear action + value propositions, appointment/quote CTAs, urgent actions. Focus on postcard CTAs with action verbs. (ctas: [])
        - companyFacts: Useful company facts, such as:
            - yearFounded
            - numberOfEmployees
            - locations
            - certifications
            - licenses
            - affiliations
            - leadership/founders
            - mission statement
            - values
            - awards
            - recognitions
            - unique selling points
            - industries served
            - partners
            - client list (if public)
            - any other relevant facts for marketing (companyFacts: [])
        - yearFounded: Year the company was founded (yearFounded: string)
        - awards: Awards, recognitions, or notable achievements (awards: [])
        - benefits: Complete customer/client benefits that could go on marketing materials if present on the page. (benefits: [])
        - highlightList: Extract company-specific competitive advantages and highlights. EXCLUDE: repetitive experience claims, generic environmental benefits, full paragraphs, incomplete fragments. INCLUDE: Specific credentials, unique capabilities, quantifiable advantages. Focus on what makes this company different. Remove duplicates. (highlightList: [])
        - testimonials: Complete customer testimonials if present on the page. (testimonials: [])
        - reviews: Customer reviews if present on the page. (reviews: [])
        - serviceAreas: Extract specific cities, counties, zip codes, and geographic regions served. EXCLUDE: vague terms like "surrounding areas". INCLUDE: Specific city names, county names, radius mentions (e.g. "within 25 miles"), neighboring towns explicitly mentioned. Remove duplicate/overlapping entries. (serviceAreas: [])
        - marketingQuestions: Generate exactly 3 strategic marketing questions that would resonate with potential customers based on the services and pain points you see on this page. Focus on problems the company solves, urgency, or benefits. Make them postcard-ready questions that create desire for the service. (marketingQuestions: [])

        IMPORTANT: For headlines, subHeaders, taglines, benefits, and highlightList - make sure these are COMPLETE phrases ready to be put directly on a marketing flyer. No fragments or incomplete thoughts.

        Return all data in a structured object, with empty arrays or nulls for missing fields.
        Be as thorough as possible. If you find additional company facts or marketing-relevant data not listed above, include them in "companyFacts".
    `;

    try {
        // Get images and fonts directly using Stagehand (no AI)
        const images = await getAllImagesFromPage(page);
        const fonts = await getAllFontsFromPage(page);
        console.log(`Found ${images.length} images and ${fonts.length} fonts on ${url}`);

        // Get all other data using AI extraction
        const { pageData } = await page.extract({
            instruction: campaignPrompt,
            schema: z.object({
                pageData: z.object({
                    pageType: z.string().default(pageType).nullable(),
                    url: z.string().default(url).nullable(),
                    headlines: z.array(z.string()).nullable(),
                    subHeaders: z.array(z.string()).nullable(),
                    taglines: z.array(z.string()).nullable(),
                    coreServices: z.array(z.string()).nullable(),
                    allServices: z.array(z.string()).nullable(),
                    tone: z.string().nullable(),
                    offers: z.array(z.string()).nullable(),
                    actions: z.array(z.string()).nullable(),
                    ctas: z.array(z.string()).nullable(),
                    companyFacts: z.array(z.string()).nullable(),
                    yearFounded: z.string().nullable(),
                    awards: z.array(z.string()).nullable(),
                    benefits: z.array(z.string()).nullable(),
                    highlightList: z.array(z.string()).nullable(),
                    testimonials: z.array(z.string()).nullable(),
                    reviews: z.array(z.string()).nullable(),
                    serviceAreas: z.array(z.string()).nullable(),
                    marketingQuestions: z.array(z.string()).nullable(),
                }),
            }),
        });

        // Combine AI-extracted data with directly-scraped images and fonts
        return {
            ...pageData,
            images: images,
            fonts: fonts
        };
    } catch (error) {
        console.log(`Error extracting data from ${url}:`, error);
        return {
            pageType,
            url,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }

}


// NOTE - Helper function to aggregate all scraped data
export async function aggregateScrapedData(allData: unknown[]): Promise<AggregatedData> {
    const aggregated: AggregatedDataMutable = {
        images: new Set<string>(),
        fonts: new Set<string>(),
        headlines: new Set<string>(),
        subHeaders: new Set<string>(),
        taglines: new Set<string>(),
        coreServices: new Set<string>(),
        allServices: new Set<string>(),
        tones: new Set<string>(),
        offers: new Set<string>(),
        actions: new Set<string>(),
        ctas: new Set<string>(),
        companyFacts: new Set<string>(),
        awards: new Set<string>(),
        benefits: new Set<string>(),
        highlightList: new Set<string>(),
        testimonials: new Set<string>(),
        reviews: new Set<string>(),
        serviceAreas: new Set<string>(),
        marketingQuestions: new Set<string>(),
        scrapedUrls: new Set<string>(),
        yearFounded: null,
        scrapedPagesLength: allData.length
    };

    allData.forEach((pageData) => {
        // Add URL to scraped URLs list (even if there's an error)
        if (typeof pageData === 'object' && pageData !== null && 'url' in pageData && typeof (pageData as { url?: string }).url === 'string') {
            aggregated.scrapedUrls.add((pageData as { url: string }).url);
        }

        if (typeof pageData === 'object' && pageData !== null && 'error' in pageData && (pageData as { error?: unknown }).error) return;

        // Aggregate arrays  
        [
            'images', 'fonts', 'headlines', 'subHeaders', 'taglines',
            'coreServices', 'allServices', 'offers', 'actions',
            'ctas', 'companyFacts', 'awards', 'benefits', 'highlightList',
            'testimonials', 'reviews', 'serviceAreas', 'marketingQuestions'
        ].forEach((field) => {
            if (
                typeof pageData === 'object' && pageData !== null &&
                field in pageData && Array.isArray((pageData as Record<string, unknown>)[field])
            ) {
                ((pageData as Record<string, unknown>)[field] as string[]).forEach((item) => {
                    const normalizedItem = typeof item === 'string' ? item.toLowerCase().trim() : '';
                    if (normalizedItem) {
                        (aggregated[field as keyof AggregatedDataMutable] as Set<string>).add(normalizedItem);
                    }
                });
            }
        });

        // Handle single values
        if (
            typeof pageData === 'object' && pageData !== null &&
            'tone' in pageData && typeof (pageData as { tone?: string }).tone === 'string'
        ) {
            const normalizedTone = (pageData as { tone: string }).tone.toLowerCase().trim();
            if (normalizedTone) {
                aggregated.tones.add(normalizedTone);
            }
        }
        if (
            typeof pageData === 'object' && pageData !== null &&
            'yearFounded' in pageData && typeof (pageData as { yearFounded?: string }).yearFounded === 'string' &&
            !aggregated.yearFounded
        ) {
            aggregated.yearFounded = (pageData as { yearFounded: string }).yearFounded;
        }
    });

    // Convert Sets back to arrays for easier consumption
    const result: AggregatedData = {
        images: Array.from(aggregated.images),
        fonts: Array.from(aggregated.fonts),
        headlines: Array.from(aggregated.headlines),
        subHeaders: Array.from(aggregated.subHeaders),
        taglines: Array.from(aggregated.taglines),
        coreServices: Array.from(aggregated.coreServices),
        allServices: Array.from(aggregated.allServices),
        tones: Array.from(aggregated.tones),
        offers: Array.from(aggregated.offers),
        actions: Array.from(aggregated.actions),
        ctas: Array.from(aggregated.ctas),
        companyFacts: Array.from(aggregated.companyFacts),
        awards: Array.from(aggregated.awards),
        benefits: Array.from(aggregated.benefits),
        highlightList: Array.from(aggregated.highlightList),
        testimonials: Array.from(aggregated.testimonials),
        reviews: Array.from(aggregated.reviews),
        serviceAreas: Array.from(aggregated.serviceAreas),
        marketingQuestions: Array.from(aggregated.marketingQuestions),
        scrapedUrls: Array.from(aggregated.scrapedUrls),
        yearFounded: aggregated.yearFounded,
        scrapedPagesLength: aggregated.scrapedPagesLength,
        lowPriorityLinks: (aggregated as AggregatedDataMutable).lowPriorityLinks
    };

    return result;
}


export async function analyzeImagesForBrandColors(screenshotPath: string) {

    // const llava13bString = `yorickvp/llava-13b:80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb`
    // const googleDeepmindString = 'google-deepmind/gemma-3-12b-it:5a0df3fa58c87fbd925469a673fdb16f3dd08e6f4e2f1a010970f07b7067a81c'
    const gpt4MiniString = 'openai/gpt-4.1-mini'

    const model = gpt4MiniString;

    const prompt = `
        Look at this website screenshot. Find the 3 main BRAND colors only.
        
        BRAND COLORS are:
        - Logo colors (not white/black parts)
        - Button colors 
        - Call-to-action colors
        - Brand accent colors
        
        Return only 3 hexcodes, one per line:
        #HEXCODE
        #HEXCODE  
        #HEXCODE
    `;

    // Convert local file to base64 data URI
    // const debugPath = 'public/temp/screenshot.png';
    const imageBuffer = fs.readFileSync(screenshotPath);
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64Image}`;

    const input = {
        top_p: 1,
        prompt: prompt,
        image_input: [dataUri],
        temperature: 0.2,
        system_prompt: "You are a helpful assistant.",
        presence_penalty: 0,
        frequency_penalty: 0,
        max_completion_tokens: 512
    };


    const brandColors = await handleReplicateStream(model, input);


    console.log('Brand Colors: ', brandColors);

    // Extract hex codes from the response and return as array
    const hexPattern = /#[0-9A-Fa-f]{6}/g;
    const extractedColors = brandColors.match(hexPattern) || [];

    console.log('Extracted Colors Array: ', extractedColors);

    return extractedColors;



}


// NOTE - THIS IS THE SCRAPER TOOL
export async function scrapeWebsiteForMarketingData(url: string) {


    console.log(`Starting comprehensive scrape of: ${url}`);
    const debugging = false;
    // const debugging = true;

    /* ----------------------------------------------------------------
      Stagehand Setup
    ---------------------------------------------------------------- */

    const gpt_4_1_nano_stagehand = new Stagehand({
        env: process.env.NODE_ENV === "production" ? "BROWSERBASE" : "LOCAL",
        modelName: "gpt-4.1-nano",
        modelClientOptions: {
            apiKey: process.env.NODE_ENV === "production" ? process.env.OPENAI_API_KEY : process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        },
        browserbaseSessionCreateParams: {
            projectId: process.env.BROWSERBASE_PROJECT_ID || "",
        },
        localBrowserLaunchOptions: {
            headless: true,
        },
        logger: (message: LogLine) =>
            console.log(logLineToString(message)),
    });

    await gpt_4_1_nano_stagehand.init();

    if (StagehandConfig.env === "BROWSERBASE" && gpt_4_1_nano_stagehand.browserbaseSessionID) {
        console.log(
            `View this session live in your browser: https://browserbase.com/sessions/${gpt_4_1_nano_stagehand.browserbaseSessionID}`
        );
    }

    const page = gpt_4_1_nano_stagehand.page;

    // Step 1: Get homepage and discover all links
    await page.goto(url);
    console.log("Getting all links from the website...");

    /* ----------------------------------------------------------------
    
    ---------------------------------------------------------------- */

    // NOTE - DEBUGGING MODE
    if (debugging) {

        const allLinks = await getAllLinksFromPage(page, url);

        // Collect all unique URLs from the links (including homepage)
        const linkUrls = Array.from(
            new Set([
                url,
                ...allLinks.map((link: { url: string }) => link.url).filter((u: string) => typeof u === "string" && u.length > 0)
            ])
        );

        // For each link, go to the page and get all images
        let allImages: string[] = [];
        const scrapedUrls: string[] = [];
        for (const linkUrl of linkUrls) {
            try {
                await page.goto(linkUrl);
                const images = await getAllImagesFromPage(page);
                allImages.push(...images);
                scrapedUrls.push(linkUrl);
            } catch (err) {
                console.log(`Failed to get images from ${linkUrl}:`, err);
            }
        }
        // Deduplicate images
        allImages = Array.from(new Set(allImages));

        return {
            status: "success",
            discoveredLinks: allLinks.length,
            scrapedPagesLength: scrapedUrls.length,
            aggregatedData: {
                images: allImages,
                fonts: [],
                headlines: [],
                subHeaders: [],
                taglines: [],
                coreServices: [],
                allServices: [],
                tones: [],
                offers: [],
                actions: [],
                ctas: [],
                companyFacts: [],
                awards: [],
                benefits: [],
                highlightList: [],
                testimonials: [],
                reviews: [],
                serviceAreas: [],
                marketingQuestions: [],
                scrapedUrls: scrapedUrls,
                yearFounded: null,
                scrapedPagesLength: scrapedUrls.length,
            } as AggregatedData,
            screenshotPath: "",
            linkBreakdown: {
                high: 0,
                medium: 0,
                low: 0,
            },
            rawScrapedData: [],
            discoveredLinksDetails: {
                high_priority: [],
                medium_priority: [],
                low_priority: [],
            },
            brandColors: [],
            website: url,
        } as ScraperToolResponse;

    // NOTE - REAL MODE
    } else {

        const allLinks = await getAllLinksFromPage(page, url);
        const categorizedLinks = await categorizeLinks(allLinks);

        console.log(`Found ${allLinks.length} total links:`);
        console.log(`High priority: ${categorizedLinks.high_priority.length} (will scrape)`);
        console.log(`Medium priority: ${categorizedLinks.medium_priority.length} (will scrape)`);
        console.log(`Low priority: ${categorizedLinks.low_priority.length} (will list only)`);

        // Step 2: Scrape homepage first
        const homepageData = await scrapePageData(page, url, "homepage");

        // Step 3: Scrape high and medium priority pages only
        const allScrapedData = [homepageData];
        const pagesToScrape = [
            ...categorizedLinks.high_priority.slice(0, 8), // Limit high priority to prevent timeout
            ...categorizedLinks.medium_priority.slice(0, 5) // Limit medium priority to prevent timeout
        ];

        console.log(`Scraping ${pagesToScrape.length} high and medium priority pages...`);

        for (const link of pagesToScrape) {
            try {
                console.log(`Scraping: ${link.url}`);
                await page.goto(link.url);
                const pageData = await scrapePageData(page, link.url, link.text);
                allScrapedData.push(pageData);
            } catch (error) {
                console.log(`Failed to scrape ${link.url}:`, error);
            }
        }

        // Step 4: Collect images from all pages (same method as debug mode)
        const allImages: string[] = [];
        const scrapedUrls: string[] = [];
        
        // Get images from homepage
        await page.goto(url);
        const homepageImages = await getAllImagesFromPage(page);
        allImages.push(...homepageImages);
        scrapedUrls.push(url);
        
        // Get images from all scraped pages
        for (const link of pagesToScrape) {
            try {
                await page.goto(link.url);
                const pageImages = await getAllImagesFromPage(page);
                allImages.push(...pageImages);
                scrapedUrls.push(link.url);
            } catch (error) {
                console.log(`Failed to get images from ${link.url}:`, error);
            }
        }
        
        // Deduplicate images
        const uniqueImages = Array.from(new Set(allImages));
        
        // Aggregate all other data from AI extraction
        const aggregatedData = await aggregateScrapedData(allScrapedData);
        
        // Replace images with our collected images
        aggregatedData.images = uniqueImages;

        // Add low priority links to aggregated data (not scraped, just listed)
        aggregatedData.lowPriorityLinks = categorizedLinks.low_priority;

        // Step 5: Take screenshot of homepage
        await page.goto(url); // Go back to homepage for screenshot
        // const screenshot = await page.screenshot();
        // const screenshotPath = 'public/temp/screenshot.png';

        // if (!fs.existsSync('public/temp')) {
        //     fs.mkdirSync('public/temp', { recursive: true });
        // }
        // fs.writeFileSync(screenshotPath, screenshot);

        console.log(`✅ Scraping complete! Scraped ${allScrapedData.length} pages (homepage + ${pagesToScrape.length} priority pages)`);
        console.log(`📋 Listed ${categorizedLinks.low_priority.length} low priority links without scraping`);
        console.log('Aggregated Data: ', aggregatedData);

        await gpt_4_1_nano_stagehand.close();

        // Brand colors will be extracted later in GenerationManager from classified images



        return {
            status: "success",
            discoveredLinks: allLinks.length,
            scrapedPagesLength: allScrapedData.length,
            aggregatedData: aggregatedData,
            screenshotPath: '',
            // Landing Pages
            linkBreakdown: {
                high: categorizedLinks.high_priority.length,
                medium: categorizedLinks.medium_priority.length,
                low: categorizedLinks.low_priority.length
            },
            // Also return raw data for debugging
            rawScrapedData: allScrapedData,
            discoveredLinksDetails: {
                high_priority: categorizedLinks.high_priority,
                medium_priority: categorizedLinks.medium_priority,
                low_priority: categorizedLinks.low_priority,
            },
            brandColors: [], // Will be set later in GenerationManager
            website: url,
        } as ScraperToolResponse;
    }
    
}



