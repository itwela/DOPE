'use server';

import { GoogleGenAI, Type, Content } from "@google/genai";

// Use a tertiary (ternary) operator to select the API key based on environment
const geminiAi = new GoogleGenAI({
    apiKey: process.env.NODE_ENV === 'production'
        ? process.env.GEMINI_API_KEY
        : process.env.NEXT_PUBLIC_GEMINI_API_KEY,
});

interface ClassifiedImage {
  url: string;
  primaryClassification?: string;
  contextualTags?: string[];
  will_use_in_brand_color_extraction_tool?: boolean;
}

interface PostcardCategory {
  id: number | string;
  name: string;
  description?: string;
}

interface CampaignData {
  headlines?: string[];
  coreServices?: string[];
  tones?: string[];
  benefits?: string[];
  ctas?: string[];
  serviceAreas?: string[];
  companyFacts?: string[];
  awards?: string[];
  offers?: string[];
}

export async function classifyImagesForOntologyGemini(imageUrls: string[]): Promise<ClassifiedImage[]> {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    // Instead of throwing, just return an empty array
    return [];
  }

  // Build contents: one inlineData per image then the text prompt
  const contents: Content[] = [];
  const validUrls: string[] = [];

  for (const url of imageUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn("Failed to fetch image (HTTP error):", url, res.status);
        continue;
      }
      
      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        console.warn("Empty image data:", url);
        continue;
      }
      
      // Detect mime type from headers or default to jpeg
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const mimeType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
      
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      contents.push({ parts: [{ inlineData: { mimeType, data: base64 } }] });
      validUrls.push(url); // Keep track of valid URLs in order
    } catch (err) {
      console.warn("Failed to fetch image", url, err);
    }
  }

  if (validUrls.length === 0) {
    console.warn("No valid images to classify");
    return [];
  }

  const promptText =
    `Classify EACH image into one of these categories: logo, mascot, job_site, before_and_after, employee, product, if it is a product, what type of product, stamp, awards_certs_recognition, other. 
    
    Please just use the logos, mascots, and product images for brand color extraction. These should be the only things considered for will_use_in_brand_color_extraction_tool.

The images correspond to these URLs in order:
${validUrls.map((url, i) => `Image ${i + 1}: ${url}`).join('\n')}

Respond ONLY with pure JSON matching this schema:
[{url:string, primaryClassification:string, contextualTags:string[], will_use_in_brand_color_extraction_tool:boolean}]

Make sure to use the actual URLs provided above, not placeholder names.`;

  contents.push({ parts: [{ text: promptText }] });

  try {
    const response = await geminiAi.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING },
              primaryClassification: { type: Type.STRING },
              contextualTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              will_use_in_brand_color_extraction_tool: { type: Type.BOOLEAN },
            },
            propertyOrdering: [
              "url",
              "primaryClassification",
              "contextualTags",
              "will_use_in_brand_color_extraction_tool",
            ],
          },
        },
      },
    });

    const raw = response.text ?? "[]";
    console.log("Gemini raw JSON →", raw);

    try {
      const parsed = JSON.parse(raw);
      
      // Ensure we have the correct URLs - map them back if needed
      const resultWithCorrectUrls = parsed.map((item: object, index: number) => {
        return {
          ...item,
          url: validUrls[index] || (item as ClassifiedImage).url // Use the actual URL from our validUrls array
        };
      });
      
      console.log("🔧 Fixed URLs in classification results:", resultWithCorrectUrls);
      return resultWithCorrectUrls;
    } catch (e) {
      console.warn("Failed to parse Gemini JSON", e);
      return createFallbackResults(validUrls);
    }
  } catch (error) {
    console.error("Gemini API error:", error);
         return createFallbackResults(validUrls);
   }
 }
 
 // Fallback function to create basic classification results
function createFallbackResults(urls: string[]) {
  return urls.map(url => ({
    url,
    primaryClassification: "other",
    contextualTags: ["unclassified"],
    will_use_in_brand_color_extraction_tool: false
  }));
}

export async function generateCampaignStrategies(
  campaignData: CampaignData,
  postcardCategories: PostcardCategory[],
  classifiedImages: ClassifiedImage[]
) {
  try {
    // Build contents with classified images for visual context
    const contents: Content[] = [];
    
    // Add brand-relevant images for visual context
    const brandImages = classifiedImages
      .filter((img) => img.primaryClassification && ['logo', 'product', 'employee', 'job_site', 'before_and_after'].includes(img.primaryClassification))
      .slice(0, 5); // Limit to 5 images for performance

    for (const img of brandImages) {
      try {
        const res = await fetch(img.url);
        if (!res.ok) continue;
        
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer.byteLength === 0) continue;
        
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const mimeType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
        
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        contents.push({ parts: [{ inlineData: { mimeType, data: base64 } }] });
      } catch (err) {
        console.warn("Failed to fetch image for strategy:", img.url, err);
      }
    }

    const promptText = `
      You are a marketing strategist. Analyze this company's data and create targeted campaign strategies for each postcard category.

      COMPANY DATA:
      - Headlines: ${JSON.stringify(campaignData.headlines)}
      - Services: ${JSON.stringify(campaignData.coreServices)}
      - Tone: ${JSON.stringify(campaignData.tones)}
      - Benefits: ${JSON.stringify(campaignData.benefits)}
      - CTAs: ${JSON.stringify(campaignData.ctas)}
      - Service Areas: ${JSON.stringify(campaignData.serviceAreas)}
      - Company Facts: ${JSON.stringify(campaignData.companyFacts)}
      - Awards: ${JSON.stringify(campaignData.awards)}
      - Offers: ${JSON.stringify(campaignData.offers)}

      POSTCARD CATEGORIES TO STRATEGIZE FOR:
      ${postcardCategories.map(cat => `- ${cat.name}: ${cat.description}`).join('\n')}

      CLASSIFIED IMAGES CONTEXT:
      ${classifiedImages.map(img => `- ${img.primaryClassification}: ${img.contextualTags?.join(', ')}`).join('\n')}

      For EACH postcard category, create a comprehensive strategy including:
      1. Target audience for this category
      2. Key messaging approach
      3. Visual elements to emphasize
      4. Specific headlines/CTAs to use
      5. Emotional triggers
      6. Campaign timing recommendations

      Return strategies that leverage the company's unique strengths and visual assets.
    `;

    contents.push({ parts: [{ text: promptText }] });

    const response = await geminiAi.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryId: { type: Type.STRING },
                  categoryName: { type: Type.STRING },
                  targetAudience: { type: Type.STRING },
                  messagingApproach: { type: Type.STRING },
                  visualElements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  recommendedHeadlines: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  recommendedCTAs: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  emotionalTriggers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  campaignTiming: { type: Type.STRING },
                  briefSummary: { type: Type.STRING }
                },
                required: [
                  "categoryId", "categoryName", "targetAudience", 
                  "messagingApproach", "visualElements", "recommendedHeadlines",
                  "recommendedCTAs", "emotionalTriggers", "campaignTiming", "briefSummary"
                ]
              }
            }
          },
          required: ["strategies"]
        },
      },
    });

    const raw = response.text ?? "{}";
    console.log("🎯 Campaign strategies raw →", raw);

    const parsed = JSON.parse(raw);
    console.log("📋 Generated campaign strategies:", parsed.strategies);
    
    return parsed.strategies || [];
    
  } catch (error) {
    console.error("Campaign strategy generation failed:", error);
    return [];
  }
}

export async function extractBrandColorsGemini(imageUrls: string[]): Promise<string[]> {
  try {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.warn("No image URLs provided for brand color extraction");
      return ["#1a1a1a", "#ffffff", "#000000"]; // Fallback colors
    }

    const contents: Content[] = [];
    
    // Add each image to contents
    for (const url of imageUrls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer.byteLength === 0) continue;
        
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const mimeType = contentType.startsWith('image/') ? contentType : 'image/jpeg';
        
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        contents.push({ parts: [{ inlineData: { mimeType, data: base64 } }] });
      } catch (err) {
        console.warn("Failed to fetch image for brand colors:", url, err);
      }
    }

    if (contents.length === 0) {
      console.warn("No valid images for brand color extraction");
      return ["#1a1a1a", "#ffffff", "#000000"]; // Fallback colors
    }
    
    const promptText = `
      Analyze these brand-relevant images and extract exactly 3 main BRAND colors.
      
      BRAND COLORS are:
      - Logo colors (not white/black parts)
      - Button colors 
      - Call-to-action colors
      - Brand accent colors
      
      Focus on: distinctive brand elements, buttons, logos, highlights
      
      Look across ALL images and find the most consistent brand colors.
    `;

    contents.push({ parts: [{ text: promptText }] });

    const response = await geminiAi.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brandColors: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of exactly 3 hex color codes"
            }
          },
          required: ["brandColors"]
        },
      },
    });

    const raw = response.text ?? "{}";
    console.log("Gemini brand colors raw →", raw);

    const parsed = JSON.parse(raw);
    const colors = parsed.brandColors || [];
    
    // Validate hex codes and return
    const validColors = colors.filter((color: string) => /^#[0-9A-Fa-f]{6}$/.test(color));
    console.log("🎨 Extracted brand colors:", validColors);
    
    return validColors;
  } catch (error) {
    console.error("Gemini brand color extraction failed:", error);
    return ["#1a1a1a", "#ffffff", "#000000"]; // Fallback colors
  }
}
  