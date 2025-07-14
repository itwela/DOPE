import { action } from "./_generated/server";
import { v } from "convex/values";
import Replicate from "replicate";

import { 
  systemPromptForPostcardImageGeneration,
  systemPromptForPostcardContentGeneration,
  systemPromptForPostcardUseCaseGeneration,
  metaLlamaString,
  fluxImageString,
} from "./constants";


export const generateFullPostcard = action({
  args: {
    prompt: v.string(),
    contentType: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    tone: v.optional(v.string()),
    includeCallToAction: v.optional(v.boolean()),
    replicateApiKey: v.string(),
    colors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    try {
      console.log('Starting full postcard generation...');

      const replicateClient = new Replicate({
        auth: args.replicateApiKey,
      });

      // NOTE Step 1: Generate initial content (headline, body, CTA, colors)
      const contentInput = {
        top_k: 0,
        top_p: 0.95,
        temperature: 0.7,
        max_tokens: 800,
        prompt: `Generate postcard content based on the following:
        
        Main concept: "${args.prompt || 'You pick the concept, be creative'}"
        Content type: ${args.contentType || 'promotional'}
        Target audience: ${args.targetAudience || 'general public'}
        Tone: ${args.tone || 'friendly and professional'}
        Include call-to-action: ${args.includeCallToAction ? 'Yes' : 'No'}

        Please provide:
        1. HEADLINE: A catchy, attention-grabbing headline (max 8 words)
        2. BODY TEXT: Brief, compelling main message (max 50 words)
        3. CALL TO ACTION: Action-oriented phrase (if requested, max 6 words)
        
        Format your response exactly like this:
        HEADLINE: [headline text]
        BODY: [body text]
        CTA: [call to action text]
        
        IT IS IMPORTANT THAT YOU PROVIDE ACTUAL VALUES FOR EVERYTHING I AM ASKING FOR.
        NOTICE I DID NOT MENTION MARKDOWN OR FORMATTING. JUST PLAIN TEXT.
        NOTICE I DID NOT MENTION TO ADD INFORMATION ABOUT THE BACK OF THE POSTCARD.

        FOLLOW THESE INSTRUCTIONS EXACTLY.
        `,
        system_prompt: systemPromptForPostcardContentGeneration,
        stop_sequences: "<|end_of_text|>,<|eot_id|>",
        prompt_template: "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\\n\\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\\n\\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\\n\\n",
      };

      console.log('Generating content...');
      const contentResult = await replicateClient.run(metaLlamaString, { input: contentInput });
      console.log('Content generation complete');
      
      let headline = '';
      let bodyText = '';
      let callToAction = '';

      if (contentResult) {
        const rawContent = Array.isArray(contentResult) 
          ? contentResult.join('').trim() 
          : String(contentResult).trim();
        
        const lines = rawContent.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('HEADLINE:')) {
            headline = trimmed.replace('HEADLINE:', '').trim();
          } else if (trimmed.startsWith('BODY:')) {
            bodyText = trimmed.replace('BODY:', '').trim();
          } else if (trimmed.startsWith('CTA:')) {
            callToAction = trimmed.replace('CTA:', '').trim();
        }
      }

      const generateRandomColors = (count = 3) => {
        const colors = ['#FF5733', '#3498DB', '#2ECC71', '#F1C40F', '#9B59B6', '#E67E22', '#FFB6C1', '#D2691E', '#B0C4DE', '#2F4F4F', '#F5F5F5'];
        const randomColors = [];
        for (let i = 0; i < count; i++) {
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          randomColors.push(randomColor);
        }
        return randomColors;
      }

      const randomColors = generateRandomColors();

      // NOTE Step 2: Generate strategy based on the content we just created
      const strategyInput = {
        top_k: 0,
        top_p: 0.95,
        temperature: 0.7,
        max_tokens: 1200,
        prompt: `Create a SHORT BUT CLEAR marketing campaign strategy for this postcard. The strategy should be at least 150 words and provide actionable insights for implementing this postcard campaign effectively. Avoid using any markdown or formatting in your response. Just provide plain text.

        POSTCARD DETAILS:
        Main concept: ${args.prompt || 'creative postcard'}
        Content type: ${args.contentType || 'promotional'}
        Target audience: ${args.targetAudience || 'general public'}
        Tone: ${args.tone || 'friendly and professional'}
        Headline: ${headline}
        Body text: ${bodyText}
        Call to action: ${callToAction}
        Colors: ${randomColors.join(', ')}

        Include the following in the strategy:
        Target audience analysis
        Distribution channels and timing
        Campaign goals and KPIs
        Budget considerations
        Follow-up strategies
        Success metrics`,
        system_prompt: systemPromptForPostcardUseCaseGeneration,
        stop_sequences: "<|end_of_text|>,<|eot_id|>",
        prompt_template: "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\\n\\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\\n\\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\\n\\n",
      };

      console.log('Generating campaign strategy...');
      const strategyResult = await replicateClient.run(metaLlamaString, { input: strategyInput });
      console.log('Strategy generation complete');
      
      let strategy = '';
      if (strategyResult) {
        const rawStrategy = Array.isArray(strategyResult) 
          ? strategyResult.join('').trim() 
          : String(strategyResult).trim();
        
        strategy = rawStrategy;
      }

      // NOTE Step 3: Use content and colors to generate image
      const colorString = randomColors.join(', ');
      const enhancedPrompt = `${args.prompt}. Colors: ${colorString}. Style: ${headline}`;

      const imagePromptInput = {
        top_k: 0,
        top_p: 0.95,
        temperature: 0.7,
        max_tokens: 800,
        prompt: `Create a detailed image prompt for THE FRONT OF A postcard design.
        
        User request: "${enhancedPrompt}"
        Content type: ${args.contentType || 'promotional'}
        
        CRITICAL OUTPUT INSTRUCTIONS:
        1. Return ONLY the image prompt, no additional text
        2. NO explanations, NO commentary, NO quotes
        3. Focus on visual elements, composition, colors, and mood
        4. Include specific details about postcard layout and design elements
        5. Ensure the prompt will create a professional, print-ready postcard design.
        6. DO NOT MENTION THE BACK OF THE POSTCARD.`,
        system_prompt: systemPromptForPostcardImageGeneration,
        stop_sequences: "<|end_of_text|>,<|eot_id|>",
        prompt_template: "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\\n\\n{system_prompt}<|eot_id|><|start_header_id|>user<|end_header_id|>\\n\\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\\n\\n",
      };

      console.log('Generating image prompt...');
      const imagePromptResult = await replicateClient.run(metaLlamaString, { input: imagePromptInput });
      console.log('Image prompt generation complete');
      
      let imagePrompt = `Professional postcard design: ${enhancedPrompt}`;
      if (imagePromptResult) {
        const rawPrompt = Array.isArray(imagePromptResult) 
          ? imagePromptResult.join('').trim() 
          : String(imagePromptResult).trim();
        imagePrompt = rawPrompt || imagePrompt;
      }

      // NOTE Step 4: Generate postcard image
      console.log('Generating final image...');
      const imageResponse = await replicateClient.run(fluxImageString, {
        input: { 
          prompt: imagePrompt,
          aspect_ratio: '3:2',
          output_quality: 95,
          safety_tolerance: 2
        }
      });
      console.log('Image generation complete');

      let imageUrl = '';
      if (imageResponse) {
        console.log('Image response type:', typeof imageResponse);
        console.log('Image response:', imageResponse);
        
        let tempImageUrl = '';
        
                try {
          // Cast to any to avoid TypeScript issues with dynamic object properties
          const response = imageResponse as any;
          
          // Handle FileOutput object from new Replicate SDK
          if (response && typeof response === 'object') {
            // Try to call .url() method
            if (typeof response.url === 'function') {
              console.log('Found url method, calling it...');
              try {
                const urlResult = await Promise.resolve(response.url());
                // Handle URL object vs string
                if (urlResult && typeof urlResult === 'object' && urlResult.href) {
                  tempImageUrl = urlResult.href;
                } else if (typeof urlResult === 'string') {
                  tempImageUrl = urlResult;
                }
                console.log('Got URL from .url() method:', tempImageUrl);
              } catch (urlError) {
                console.error('Error calling .url() method:', urlError);
              }
            }

          }

          if (tempImageUrl && typeof tempImageUrl === 'string' && tempImageUrl.startsWith('http')) {
            console.log('Got image URL from Replicate:', tempImageUrl);
            imageUrl = tempImageUrl;
            console.log('Image URL ready for frontend use');
            // Small delay to ensure all internal operations complete
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            console.error('No valid image URL found. tempImageUrl:', tempImageUrl);
          }
        } catch (urlError) {
          console.error('Error extracting URL from response:', urlError);
          console.log('Response object keys:', Object.keys(imageResponse || {}));
        }
      }

      // NOTE Step 5: Return everything from all models into an object
      return {
        success: true,
        postcard: {
          imageUrl,
          imagePrompt,
          headline,
          bodyText,
          callToAction,
          colors: randomColors,
          strategy,
        }
      };
      }

    } catch (error: any) {
      console.error('Full postcard generation failed:', error);
      return {
        success: false,
        error: `Full generation failed: ${error.message || 'Unknown error'}`
      };
    }
  }
}); 