import { Agent, tool } from '@openai/agents';

// Types for tool input
interface MarketingPlanInput {
  company_name: string;
  industry?: string;
  target_audience?: string;
  budget?: string;
}

interface ImageClassifierInput {
  image: string;
}

// TODO
export const creativeFullfillmentTool = tool({
    name: 'generate_marketing_plan',
    description: 'Generate a comprehensive marketing plan for a company',
    parameters: {
        type: 'object',
        properties: {
            company_name: { type: 'string' },
        },
        required: ['company_name'],
        additionalProperties: false
    },
    strict: true,
    execute: async (input: unknown) => {
        const { company_name, industry, target_audience, budget } = input as MarketingPlanInput;
        return `Marketing Plan for ${company_name}:

**Industry:** ${industry || 'General'}
**Target Audience:** ${target_audience || 'General consumers'}
**Budget:** ${budget || 'Standard'}

## 1. Digital Marketing Strategy
- Social media campaigns across major platforms
- SEO optimization for better search visibility
- Email marketing campaigns
- Content marketing and blogging

## 2. Traditional Marketing
- Print advertising in relevant publications
- Local event sponsorships
- Community partnerships
- Direct mail campaigns

## 3. Performance Metrics
- Track engagement rates
- Monitor conversion rates
- Measure ROI on all campaigns
- Regular performance reviews

## 4. Timeline
- Month 1-2: Setup and initial campaigns
- Month 3-6: Optimization and scaling
- Month 7-12: Advanced strategies and expansion`;
    },
});

// TODO
export const imageClassifierTool = tool({
    name: 'image_classifier',
    description: 'Classify an image into a category',
    parameters: {
        type: 'object',
        properties: {
            image: { type: 'string' },
        },
        required: ['image'],
        additionalProperties: false
    },
    strict: true,
    execute: async (input: unknown) => {
        const { image } = input as ImageClassifierInput;
        return `Image Classifier: ${image}`;

    },
});

export const dopeMarketingAgent = new Agent({
    name: 'Dope Marketing Agent',
    // description: 'A marketing agent that can generate a marketing plan for a company',
    instructions: 'You are a helpful assistant',
    tools: [creativeFullfillmentTool, imageClassifierTool]
})