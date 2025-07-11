import { Agent, tool, run, setDefaultOpenAIKey, setDefaultOpenAIClient } from '@openai/agents';

export const marketingPlanTool = tool({
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
    execute: async (input: any) => {
        const { company_name, industry, target_audience, budget } = input;
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

export const dopeMarketingAgent = new Agent({
    name: 'Dope Marketing Agent',
    // description: 'A marketing agent that can generate a marketing plan for a company',
    instructions: 'You are a helpful assistant',
    tools: [marketingPlanTool]
})