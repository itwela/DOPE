# Current Ticket: Define Creative Ontology

## Overview
This ticket defines the structure and components needed for a comprehensive creative ontology system that scrapes live data, classifies content, and generates marketing campaigns.

## 1. ScraperTool (Live Data Collection) ✅

### Visual Elements
- **Images** `[]` ✅

- **Fonts** `[]` ✅
  - **Implemented Improvements:**
    - ✅ Filter out CSS variables and functions (`var(--something)`)
    - ✅ Remove icon font families (FontAwesome, mfn-icons, revicons, etc.)
    - ✅ Exclude system fallbacks (-apple-system, blinkmacsystemfont, etc.)
    - ✅ Filter out generic fonts (arial, verdana, helvetica, times, etc.)
    - ✅ Prioritize known brand fonts (poppins, proxima-nova, baskerville, etc.)
    - ✅ Smart categorization: Brand fonts → Web fonts → Other fonts
    - ✅ Multi-word/hyphenated fonts prioritized as likely custom fonts

- **Colors** `[]` ✅

### Content Elements
- **Headlines** `[]` ✅
  - **Implemented Improvements:**
    - ✅ Filter out paragraphs (>15 words)
    - ✅ Remove navigation/section labels  
    - ✅ Exclude standalone numbers
    - ✅ Focus on marketing-ready headlines (3-15 words)
    - ✅ Prioritize brand statements, service headlines with benefits
    - ✅ Target postcard-ready: punchy and action-oriented
    - ✅ Exclude questions, include credibility claims
- **Sub Headers** `[]` ✅
  - **Implemented Improvements:**
    - ✅ Filter out navigation/footer links
    - ✅ Remove incomplete sentence fragments
    - ✅ Exclude full paragraphs (>12 words)
    - ✅ Focus on postcard-ready sub headers (3-12 words)
    - ✅ Transform generic services into value propositions
    - ✅ Prioritize credibility, service highlights, availability promises
    - ✅ Remove generic benefit intros and repetitive content

- **Tag Lines** `[]` ✅
  - **Implemented Improvements:**
    - ✅ Filter out CTAs and button text
    - ✅ Exclude paragraphs and service descriptions
    - ✅ Focus on short brand positioning (3-7 words)
    - ✅ Remove vague or incomplete phrases
    - ✅ Look for actual company slogans, not marketing copy
    - ✅ Prioritize memorable brand positioning statements

- **CTAs (Call-to-Actions)** `[]` ✅
  - **Implemented Improvements:**
    - ✅ Filter out form field labels and media controls
    - ✅ Remove generic navigation and context-less buttons
    - ✅ Exclude service names without action verbs
    - ✅ Focus on actionable CTAs with clear value propositions
    - ✅ Prioritize appointment/quote/contact actions
    - ✅ Target postcard CTAs with action verbs + urgency 

### Business Information
- **Core Services** `[]` ✅
- **All Services** `[]` ✅
- **Company Facts** `[]` ⏳
  - Year Founded ✅
  - Etc...

- **Awards / Recognition** `[]` ✅
- **Benefits** `[]` ✅
- **Testimonials** `[]` ✅
- **Reviews** `[]` ✅

- **Service Areas** `[]` ✅
  - **Implemented Improvements:**
    - ✅ Extract specific cities, counties, zip codes
    - ✅ Remove vague terms like "surrounding areas"
    - ✅ Include radius mentions ("within 25 miles")
    - ✅ Capture neighboring towns explicitly mentioned
    - ✅ Remove duplicate/overlapping entries
    - ✅ Focus on specific, actionable geographic data for targeting

### Website Structure
- **Website** ✅
- **Landing Pages** ✅

- **Action** (e.g., schedule_appointment) ✅

### Content Analysis
- **Tone** ✅
  - **Implemented Strategy:**
    - ✅ Extract tone only from homepage (not every page)
    - ✅ Generate exactly 3 marketing campaign tones based on homepage
    - ✅ Avoid repetitive extraction across multiple pages
    - ✅ Use homepage as definitive source for brand tone assessment
    - ✅ Focus on tones matching brand personality and target audience

- **Offers** `[]` ✅

- **Highlight List** (with or without subtext) ✅
  - **Implemented Improvements:**
    - ✅ Remove repetitive experience claims and duplicates
    - ✅ Filter out generic environmental benefits
    - ✅ Exclude full paragraphs and incomplete fragments
    - ✅ Focus on company-specific competitive advantages
    - ✅ Prioritize quantifiable/specific highlights
    - ✅ Extract unique capabilities that differentiate the company
    - ✅ Remove generic claims, focus on what makes them different
- **Marketing Questions** `[]` ✅
  - **Implemented Strategy:**
    - ✅ Generate exactly 3 strategic marketing questions per page
    - ✅ Focus on pain points the company solves
    - ✅ Create urgency and benefit-driven questions
    - ✅ Target postcard-ready questions that create desire
    - ✅ Based on services and pain points visible on each page
    - ✅ Problem-focused, urgency-based, and benefit-driven approaches










## 2. CreativeFullfillment (Content Generation) ⏳

### Postcard Concepts & Reasons
- **Initial**
- **Follow up** 
- **Meet The Team**
- **We are in your neighborhood**
- **Avoid Pain**
- **Safety / Peace of Mind**
- **Simple Offer**
- **Sale / Deal**
- **Discount**
- **Offer**
- **Comedy**

### Creative Variations
Generate multiple variations of creative elements with **variant_tags**:
- Assertive
- Safety-focused
- etc...

## 3. ImageClassifierTool (Content Tagging) ✅

### Primary Classifications
- **Logo**
- **Mascot** 
- **Job Site**
- **Before_and_after**
- **Employee**
- **Product** (actual images of product)
- **Type**
- **Stamp**
- **Awards, Certs, Recognition**, etc.
- Needs to determine for each image if it makes sense to use in the brand color extraction tool by using this boolean:
  - **will_use_in_brand_color_extraction_tool**

### Contextual Tags
- **Grass**
- **House**
- **Type Of House**
- **will_use_in_brand_color_extraction_tool**
- **Random Tags** (as applicable)

## 4. BrandColorExtractionTool ✅

- Pulls brand colors out of images, will only use the images that the image classifier will tag to say, will_use_in_brand_color_extraction_tool

## 5. CampaignStrategyTool ✅

### Data Requirements
- **Tones**
- **Emotions** 
- **Pitches**

### Strategy Components
- **High level creative brief**
- **Campaign Strategy**
- **Targeting Strategy**

## Implementation Notes

### Key Requirements
- **Emphasize Ontology and sub categories**
- Populate alternates and best guesses for missing information
- Ensure comprehensive data collection from live sources
- Maintain consistent tagging and classification systems

### Data Structure
All arrays `[]` indicate collections that can contain multiple items of the specified type, allowing for comprehensive data capture and analysis. 