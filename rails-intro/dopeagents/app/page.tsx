'use client'

import React, { useState, useEffect } from 'react';
import { WeatherProvider } from './contexts/WeatherContext';
import { LLMProvider, useLLM } from './contexts/LLMContext';
import { styles, stylesheet } from './styles/AppStyles';
import CompanySelector from './dopeComponents/CompanySelector';
import { ToastMessageProvider } from './contexts/ToastMessageContext';
import { PostcardProvider } from './contexts/PostcardContext';
import { setDefaultOpenAIKey, setOpenAIAPI } from '@openai/agents';
import { GenerationManager } from './dopeComponents/GenerationManager';
import GraphicBuilder from './dopeComponents/GraphicBuilder';
import { motion } from 'framer-motion';

interface Stats {
  discoveredLinks: number;
  scrapedPages: number;
  linkBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
}

interface CampaignElements {
  scrapingStats?: unknown;
  headlines?: unknown[];
  taglines?: unknown[];
  subHeaders?: unknown[];
  tones?: unknown[];
  coreServices?: unknown[];
  allServices?: unknown[];
  ctas?: unknown[];
  actions?: unknown[];
  images?: unknown[];
  fonts?: unknown[];
  companyFacts?: unknown[];
  yearFounded?: string;
  awards?: unknown[];
  testimonials?: unknown[];
  reviews?: unknown[];
  benefits?: unknown[];
  highlightList?: unknown[];
  offers?: unknown[];
  serviceAreas?: unknown[];
  marketingQuestions?: unknown[];
  // ...add more as needed
}

const LLMApp: React.FC = () => {

  const white = '#fff';
  const gray = '#a1a1aa';


  const { brandColors, classifiedImages, campaignElements } = useLLM();

  // Cast campaignElements to the correct type
  const campaignElementsTyped = campaignElements as CampaignElements;

  // State for campaign elements
  const [done, setDone] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  // Handle both string URLs and classification objects
  const [imageDetails, setImageDetails] = useState<Record<string, boolean>>({});


  // Handler for campaign elements updates
  useEffect(() => {
    if (campaignElements && typeof campaignElements === 'object' && 'campaignStrategies' in campaignElements) {
      console.log('done', done);
      setDone(true);
    }
  }, [campaignElements]);

  // Helper for color swatch
  const ColorSwatch = ({ color }: { color: string }) => (
    <span style={{
      display: 'inline-block',
      width: 24,
      height: 24,
      borderRadius: 6,
      background: color,
      border: '1px solid #ccc',
      marginRight: 8
    }} />
  );


  const CampaignElementWithLabel = ({ 
    label, 
    value, 
    type 
  }: { 
    label: string, 
    value: unknown, 
    type?: 'array' | 'string' | 'images' | 'colors' | 'stats' 
  }) => {

    // State to hold images that actually load
    const [loadedImages, setLoadedImages] = useState<string[]>([]);
    
    // For images, use classified images from context if available, otherwise use original value
    const currentValue = type === 'images' && classifiedImages.length > 0 ? classifiedImages : value;
    
    // Debug logs
    if (type === 'images') {
      console.log('🔍 Image debugging:', {
        originalValue: value,
        classifiedImagesFromContext: classifiedImages,
        currentValueUsed: currentValue,
        loadedImagesLength: loadedImages.length
      });
    }

    // NOTE - Preload images and filter only those that load successfully
    useEffect(() => {
      if (type === 'images' && Array.isArray(currentValue)) {
        // Handle both string URLs and classification objects
        type ImageItem = string | { url: string; primaryClassification?: string; contextualTags?: string[]; will_use_in_brand_color_extraction_tool?: boolean };
        const getUrl = (item: ImageItem): string => typeof item === 'string' ? item : item.url;
        
        const loadPromises = (currentValue as ImageItem[]).map((item) => {
          const src = getUrl(item);
          console.log('🌄 Testing image load for:', src);
          return new Promise<string | null>((resolve) => {
            const img = new Image();
            img.onload = () => {
              console.log('✅ Image loaded successfully:', src);
              resolve(src);
            };
            img.onerror = (e) => {
              console.log('❌ Image failed to load:', src, e);
              resolve(src); // STILL INCLUDE FAILED IMAGES TO SHOW THEM
            };
            img.src = src;
          });
        });
        Promise.all(loadPromises).then((results) => {
          const valid = results.filter((src): src is string => src !== null);
          console.log('🎯 Final loaded images:', valid);
          setLoadedImages(valid);
        });
      }
    }, [type, currentValue]);

    const sectionKey = label.replace(/[^a-zA-Z0-9]/g, ''); // Clean key for state
    const isExpanded = expandedSections[sectionKey] || false;
    
    const toggleExpanded = () => {
      setExpandedSections(prev => ({
        ...prev,
        [sectionKey]: !prev[sectionKey]
      }));
    };

    const renderValue = () => {
      const resultFontSize = '1rem';

      if (!currentValue || (Array.isArray(currentValue) && currentValue.length === 0)) {
        return <span style={{ color: '#666', fontSize: resultFontSize, fontStyle: 'italic' }}>No data found</span>;
      }

      switch (type) {
        case 'array':
          if (!Array.isArray(currentValue)) {
            return <span style={{ color: white, fontSize: resultFontSize }}>{String(currentValue)}</span>;
          }
          
          const itemsToShow = isExpanded ? currentValue : currentValue.slice(0, 5);
          const hasMore = currentValue.length > 5;
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {itemsToShow.map((item: unknown, index: number) => (
                <span key={index} style={{ 
                  color: white, 
                  fontSize: resultFontSize,
                  padding: '4px 8px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: 4,
                  border: '1px solid #2a2a2a'
                }}>
                  • {String(item)}
                </span>
              ))}
              {hasMore && (
                <button
                  onClick={toggleExpanded}
                  style={{
                    color: '#60a5fa',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '4px 0',
                    textAlign: 'left',
                    textDecoration: 'underline'
                  }}
                >
                  {isExpanded ? `▲ Show Less (${currentValue.length} total)` : `▼ Show More (+${currentValue.length - 5} more)`}
                </button>
              )}
            </div>
          );
        case 'images':
          
          if (!Array.isArray(currentValue)) {
            return <span style={{ color: '#666', fontSize: resultFontSize, fontStyle: 'italic' }}>No images found</span>;
          }
          
          
          
          // Normalize to objects - just use all images from currentValue
          type ImageItem = string | { url: string; primaryClassification?: string; contextualTags?: string[]; will_use_in_brand_color_extraction_tool?: boolean };
          const getUrl = (item: ImageItem): string => typeof item === 'string' ? item : item.url;
          const getClassification = (item: ImageItem) => typeof item === 'string' ? null : item;
          
          const validImages = currentValue; // Use all images, don't filter by loadedImages
          
          if (validImages.length === 0) {
            return <span style={{ color: '#666', fontSize: resultFontSize, fontStyle: 'italic' }}>No valid images found</span>;
          }
          
          const imagesToShow = isExpanded ? validImages : validImages.slice(0, 5);
          const hasMoreImages = validImages.length > 5;
          
          const toggleDetails = (url: string) => {
            setImageDetails(prev => ({ ...prev, [url]: !prev[url] }));
          };
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {imagesToShow.map((item: ImageItem, index: number) => {
                const url = getUrl(item);
                const classification = getClassification(item);
                const showDetails = imageDetails[url];
                
                return (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <img 
                        src={url} 
                        alt={`Image ${index + 1}`}
                        style={{ 
                          width: 40, 
                          height: 40, 
                          objectFit: 'cover', 
                          borderRadius: 4,
                          border: '1px solid #333'
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#d4d4d4', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                          {url.length > 60 ? `${url.substring(0, 60)}...` : url}
                        </span>
                        {classification?.primaryClassification && (
                          <span style={{ 
                            color: '#60a5fa', 
                            fontSize: '0.7rem', 
                            backgroundColor: '#1a1a2e',
                            padding: '2px 6px',
                            borderRadius: 3,
                            display: 'inline-block',
                            width: 'fit-content'
                          }}>
                            {classification.primaryClassification.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      {classification && (
                        <button
                          onClick={() => toggleDetails(url)}
                          style={{
                            color: '#60a5fa',
                            background: 'none',
                            border: '1px solid #333',
                            borderRadius: 3,
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            padding: '2px 6px'
                          }}
                        >
                          {showDetails ? 'Less' : 'More'}
                        </button>
                      )}
                    </div>
                    
                    {showDetails && classification && (
                      <div style={{ 
                        marginLeft: 48, 
                        padding: '8px', 
                        backgroundColor: '#1a1a1a', 
                        borderRadius: 4,
                        border: '1px solid #2a2a2a'
                      }}>
                        {classification.contextualTags && classification.contextualTags.length > 0 && (
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ color: '#888', fontSize: '0.7rem' }}>Tags: </span>
                            {classification.contextualTags.map((tag, i) => (
                              <span key={i} style={{ 
                                color: '#d4d4d4', 
                                fontSize: '0.7rem',
                                backgroundColor: '#2a2a2a',
                                padding: '1px 4px',
                                borderRadius: 2,
                                marginRight: 4
                              }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {classification.will_use_in_brand_color_extraction_tool !== undefined && (
                          <div>
                            <span style={{ color: '#888', fontSize: '0.7rem' }}>Brand Color Tool: </span>
                            <span style={{ 
                              color: classification.will_use_in_brand_color_extraction_tool ? '#4ade80' : '#f87171',
                              fontSize: '0.7rem'
                            }}>
                              {classification.will_use_in_brand_color_extraction_tool ? 'Yes' : 'No'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {hasMoreImages && (
                <button
                  onClick={toggleExpanded}
                  style={{
                    color: '#60a5fa',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '4px 0',
                    textAlign: 'left',
                    textDecoration: 'underline'
                  }}
                >
                  {isExpanded ? `▲ Show Less (${validImages.length} total)` : `▼ Show More (+${validImages.length - 5} more images)`}
                </button>
              )}
            </div>
          );
        case 'colors':
          if (!Array.isArray(currentValue) || currentValue.length === 0) {
            return <span style={{ color: '#666', fontSize: resultFontSize, fontStyle: 'italic' }}>No colors found</span>;
          }
          
          // Filter valid hex colors and remove common ones
          const validColors = currentValue.filter(color => {
            if (!color || !color.match(/^#[0-9A-Fa-f]{6}$/)) return false;
            const upperColor = color.toUpperCase();
            return !['#000000', '#FFFFFF'].includes(upperColor);
          });
          
          // If no brand colors after filtering, show all colors
          const displayColors = validColors.length > 0 ? validColors : currentValue.filter(color => color && color.match(/^#[0-9A-Fa-f]{6}$/));
          
          const colorsToShow = isExpanded ? displayColors : displayColors.slice(0, 5);
          const hasMoreColors = displayColors.length > 5;
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {colorsToShow.map((color: string, index: number) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ColorSwatch color={color} />
                    <span style={{ color: white, fontSize: '0.9rem' }}>{color}</span>
                  </div>
                ))}
              </div>
              {hasMoreColors && (
                <button
                  onClick={toggleExpanded}
                  style={{
                    color: '#60a5fa',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '4px 0',
                    textAlign: 'left',
                    textDecoration: 'underline'
                  }}
                >
                  {isExpanded ? `▲ Show Less (${displayColors.length} total)` : `▼ Show More (+${displayColors.length - 5} more colors)`}
                </button>
              )}
            </div>
          );
        case 'stats':
          if (
            typeof currentValue === 'object' &&
            currentValue !== null &&
            'discoveredLinks' in currentValue &&
            'scrapedPages' in currentValue &&
            'linkBreakdown' in currentValue &&
            typeof (currentValue as Stats).linkBreakdown === 'object'
          ) {
            const stats = currentValue as Stats;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ color: white, fontSize: resultFontSize }}>
                  📊 Discovered: {stats.discoveredLinks} links
                </span>
                <span style={{ color: white, fontSize: resultFontSize }}>
                  🔍 Scraped: {stats.scrapedPages} pages
                </span>
                <span style={{ color: white, fontSize: resultFontSize }}>
                  📈 High Priority: {stats.linkBreakdown.high}
                </span>
                <span style={{ color: white, fontSize: resultFontSize }}>
                   Medium Priority: {stats.linkBreakdown.medium}
                </span>
                <span style={{ color: white, fontSize: resultFontSize }}>
                  📋 Low Priority: {stats.linkBreakdown.low}
                </span>
              </div>
            );
          } else {
            return <span style={{ color: '#666', fontSize: resultFontSize, fontStyle: 'italic' }}>No stats data found</span>;
          }
        default:
          return <span style={{ color: white, fontSize: resultFontSize }}>{String(currentValue)}</span>;
      }
    };

    return (
      <div style={{
        padding: '5px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            color: gray, 
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {label}
          </h4>
          {type === 'images' && classifiedImages.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ 
                color: '#4ade80', 
                fontSize: '0.7rem',
                backgroundColor: '#0f1f0f',
                padding: '2px 6px',
                borderRadius: 3
              }}>
                ✅ Classified
              </span>
            </div>
          )}
        </div>
        <div style={{ fontSize: '16px' }}>
          {renderValue()}
        </div>
      </div>
    );
  };

  

  return (
    <>
      <style>{stylesheet}</style>
      <div className='w-full h-max gap-5 flex flex-col items-center justify-center' style={{ backgroundColor: '#0f0f0f', minHeight: '100vh' }}>
        <div style={{...styles.app, backgroundColor: '#0f0f0f'}} className="w-full h-max flex flex-col">
          
          {/* NOTE - Header */}
          <header style={styles.appHeader} className="w-full">
            <h1 style={styles.appHeaderH1}>DOPE LLM</h1>
            <p style={styles.appHeaderP}>Testing the DOPE LLM - Tools, Performance, Etc.</p>
          </header>

          {/* NOTE - Main */}
          <main style={styles.appMain} className="w-full space-y-1">
            
            <CompanySelector/>
            <GenerationManager/>
        
            {/* Graphic Builder */}
            
          </main>
        </div>




        {typeof campaignElements === 'object' && campaignElements !== null && (
          <div className='gap-5 w-full'>

            <GraphicBuilder />
            
            {/* Campaign Elements */}
            <div style={{ display: 'flex', gap: 24, margin: '32px auto', maxWidth: 1200 }}>
                {/* Campaign Elements */}
                <div
                  style={{
                    flex: 1,
                    borderRadius: 16,
                    color: '#d4d4d4',
                    padding: 32,
                    position: 'relative',
                    fontFamily: 'inherit',
                  }}
                >


                {/* Scraping Stats */}
                {typeof campaignElementsTyped.scrapingStats !== 'undefined' && campaignElementsTyped.scrapingStats !== null && (
                  <CampaignElementWithLabel label="📊 Scraping Statistics" value={campaignElementsTyped.scrapingStats} type="stats" />
                )}

                {/* Main Content Grid */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                  
                  {/* Left Column */}
                  <div className='flex flex-col gap-6'>
                    
                    {/* Headlines & Content */}
                    <CampaignElementWithLabel label="🎯 Headlines" value={campaignElementsTyped.headlines} type="array" />
                    <CampaignElementWithLabel label="📝 Taglines" value={campaignElementsTyped.taglines} type="array" />
                    <CampaignElementWithLabel label="📋 Sub Headers" value={campaignElementsTyped.subHeaders} type="array" />
                    <CampaignElementWithLabel label="🎨 Marketing Tone Suggestions" value={campaignElementsTyped.tones} type="array" />
                    
                    {/* Services */}
                    <CampaignElementWithLabel label="⭐ Core Services" value={campaignElementsTyped.coreServices} type="array" />
                    <CampaignElementWithLabel label="🔧 All Services" value={campaignElementsTyped.allServices} type="array" />
                    
                    {/* CTAs & Actions */}
                    <CampaignElementWithLabel label="📢 Call-to-Actions" value={campaignElementsTyped.ctas} type="array" />
                    <CampaignElementWithLabel label="🎯 Actions" value={campaignElementsTyped.actions} type="array" />
                    
                  </div>

                  {/* Right Column */}
                  <div className='flex flex-col gap-6'>
                    
                    {/* Visual Elements */}
                    <CampaignElementWithLabel label="🖼️ Images" value={campaignElementsTyped.images} type="images" />
                    <CampaignElementWithLabel label="🎨 Colors" value={brandColors} type="colors" />
                    <CampaignElementWithLabel label="🔤 Fonts" value={campaignElementsTyped.fonts} type="array" />
                    
                    {/* Company Info */}
                    <CampaignElementWithLabel label="🏢 Company Facts" value={campaignElementsTyped.companyFacts} type="array" />
                    <CampaignElementWithLabel label="📅 Year Founded" value={campaignElementsTyped.yearFounded} type="string" />
                    <CampaignElementWithLabel label="🏆 Awards" value={campaignElementsTyped.awards} type="array" />
                    
                    {/* Social Proof */}
                    <CampaignElementWithLabel label="💬 Testimonials" value={campaignElementsTyped.testimonials} type="array" />
                    <CampaignElementWithLabel label="⭐ Reviews" value={campaignElementsTyped.reviews} type="array" />
                    
                  </div>

                </div>

                {/* Full Width Sections */}
                <div className='flex flex-col gap-6 mt-8'>
                  <CampaignElementWithLabel label="✨ Benefits" value={campaignElementsTyped.benefits} type="array" />
                  <CampaignElementWithLabel label="🎯 Highlights" value={campaignElementsTyped.highlightList} type="array" />
                  <CampaignElementWithLabel label="💰 Offers" value={campaignElementsTyped.offers} type="array" />
                  <CampaignElementWithLabel label="📍 Service Areas" value={campaignElementsTyped.serviceAreas} type="array" />
                  <CampaignElementWithLabel label="❓ Marketing Questions" value={campaignElementsTyped.marketingQuestions} type="array" />
                </div>


                </div>
              

            </div>

          </div>
        )}

      </div>

      {/* Debug JSON log */}
      {campaignElements && (
        <div style={{ maxWidth: 1200, width: "100%", margin: "24px auto", background: "#1e1e1e", borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: "1rem", color: "#d4d4d4" }}>📦 Full Campaign JSON</h3>
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(campaignElements, null, 2))}
              style={{
                backgroundColor: "#60a5fa",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "0.8rem"
              }}
            >
              Copy JSON
            </button>
          </div>
          <pre style={{ maxHeight: 400, overflow: "auto", fontSize: 12, color: "#9cdcfe", background: "#1e1e1e", margin: 0 }}>
            {JSON.stringify(campaignElements, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
};

const getAppPassword = () => {
  if (typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      return process.env.APP_PASSWORD;
    } else {
      return process.env.NEXT_PUBLIC_APP_PASSWORD;
    }
  }
  return undefined;
};

const PasswordScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [envPassword, setEnvPassword] = useState<string | undefined>(undefined);

  // Check localStorage for saved password on mount
  useEffect(() => {
    setEnvPassword(getAppPassword());
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dope_llm_pw');
      if (saved) {
        // If envPassword is not yet loaded, wait for it
        setTimeout(() => {
          const pw = getAppPassword();
          if (!pw || saved === pw) {
            onSuccess();
          }
        }, 0);
      }
    }
  }, [onSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Accept empty password if env is not set
    if (!envPassword || input === envPassword) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dope_llm_pw', input);
      }
      onSuccess();
    } else {
      setError('Incorrect password.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', flexDirection: 'column', gap: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        className='w-full h-max flex flex-col items-center justify-center'
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1.01, 0.32, 1] }}
      >
        <h1 style={{ color: '#ff3f17', margin: 0, fontWeight: 700, fontSize: '1.5rem', textAlign: 'center' }}>Welcome to the DOPE LLM</h1>
      </motion.div>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1.01, 0.32, 1] }}
        style={{ background: '#18181b', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px #0008', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320 }}
      >
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Password"
          style={{ padding: 12, borderRadius: 6, border: '1px solid #333', background: '#232323', color: '#fff', fontSize: '1rem' }}
        />
        <button type="submit" disabled={loading} style={{ background: '#ff3f17', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
          {loading ? 'Checking...' : 'Unlock'}
        </button>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1.01, 0.32, 1] }}
            style={{ color: '#f87171', fontSize: '0.95rem', textAlign: 'center' }}
          >
            {error}
          </motion.span>
        )}
      </motion.form>
    </div>
  );
};

/* ----------------------------------------------------------------

--------------------------------------------------------------- */

const App: React.FC = () => {

  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

  if (apiKey) {
    setDefaultOpenAIKey(apiKey);
  } else {
    console.log('No API key found');
  }

  // const customOpenAIClient = new OpenAI({
  //   baseURL: 'https://api.openai.com/v1',
  //   apiKey: apiKey,
  //   dangerouslyAllowBrowser: true
  // });

  setOpenAIAPI('responses');

  const [unlocked, setUnlocked] = useState(false);

  if (!unlocked) {
    return <PasswordScreen onSuccess={() => setUnlocked(true)} />;
  }

  return (
    <ToastMessageProvider>
      <PostcardProvider>
        <LLMProvider>
          <WeatherProvider>
            <LLMApp />
          </WeatherProvider>
        </LLMProvider>
      </PostcardProvider>
    </ToastMessageProvider>
  );
};

export default App; 


