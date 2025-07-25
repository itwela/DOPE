import React from 'react';
import { usePostcard } from '../contexts/PostcardContext';
import { useLLM } from '../contexts/LLMContext';

interface CampaignStrategy {
  categoryId: number;
  categoryName: string;
  briefSummary: string;
  targetAudience: string;
  messagingApproach: string;
  visualElements: string[];
  recommendedHeadlines: string[];
  recommendedCTAs: string[];
  emotionalTriggers: string[];
  campaignTiming: string;
}

interface CampaignElements {
  campaignStrategies?: CampaignStrategy[];
  // ...other properties if needed
}

const GraphicBuilder: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, postcardDimensions } = usePostcard();
  const { campaignElements } = useLLM();

  // Cast campaignElements to the correct type
  const campaignElementsTyped = campaignElements as CampaignElements;

  // Initialize with first category if none selected
  React.useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory, setSelectedCategory]);

  const currentIndex = selectedCategory ? categories.findIndex(cat => cat.id === selectedCategory.id) : 0;

  const goToPrevious = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : categories.length - 1;
    setSelectedCategory(categories[prevIndex]);
  };

  const goToNext = () => {
    const nextIndex = currentIndex < categories.length - 1 ? currentIndex + 1 : 0;
    setSelectedCategory(categories[nextIndex]);
  };

  // Find the strategy for the current category
  const currentStrategy = campaignElementsTyped?.campaignStrategies?.find(
    (strategy: unknown) =>
      (strategy as CampaignStrategy).categoryId === Number(selectedCategory?.id) ||
      (strategy as CampaignStrategy).categoryName === selectedCategory?.name
  );

  // const debugLoremIpsum = `
  // Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  // \n
  // Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  // \n
  // Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  // \n
  // `

  if (!selectedCategory) return null;

  return (
    <div style={{
      padding: '24px',
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      borderRadius: '16px',
      color: '#d4d4d4',
      margin: '0 auto',
      maxWidth: '1400px',
      width: '100%',
      gap: '16px',
      display: 'flex',
      flexDirection: 'column',
    }}>

      <div className="flex justify-between">
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '5px', color: '#d4d4d4' }}>
            📬 Your Postcards
          </h2>

          {/* Category Toggle */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '5px',
            width: '400px'
          }}>
            <button
              onClick={goToPrevious}
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#d4d4d4',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ←
            </button>
            
            <div style={{
              fontSize: '16px',
              fontWeight: 500,
              color: '#d4d4d4'
            }}>
              {selectedCategory.name} - {currentIndex + 1}/{categories.length}
            </div>

            <button
              onClick={goToNext}
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#d4d4d4',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '8px 12px',
              }}
            >
              →
            </button>
          </div>
      </div>


      {/* Postcard Preview */}
      <div style={{
        paddingTop: '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        height: `${postcardDimensions.height}px`,
      }}
      >

        <div style={{
          background: 'linear-gradient(135deg, #ec1414 0%, #764ba2 100%)',
          border: '2px solid #333',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          width: '80%',
          height: '100%',
        }}>

          <div style={{
            color: 'white',
            textAlign: 'center',
            padding: '40px'
          }}>
            <h1 style={{
              fontSize: '36px',
              fontWeight: 'bold',
              marginBottom: '16px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              {selectedCategory.name}
            </h1>
            <p style={{
              fontSize: '18px',
              opacity: 0.9,
              maxWidth: '400px',
              lineHeight: 1.4
            }}>
              {selectedCategory.description}
            </p>
          </div>

          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            color: 'white',
            fontWeight: 500
          }}>
            {postcardDimensions.width} x {postcardDimensions.height}
          </div>
        </div> 

        {/* campaign strategies */}
        <div className='bg-neutral-800' style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderRadius: '12px',
          padding: '32px',
          width: '30%',
          height: '100%',
          overflow: 'auto',
        }}>

          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#d4d4d4' }}>
            📊 Campaign Strategy
          </h2>
          
          {currentStrategy ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* NOTE - Strategy Summary */}
              <div style={{ 
                backgroundColor: '#1a1a1a', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#60a5fa', marginBottom: '8px' }}>
                  {currentStrategy.categoryName} Strategy
                </h3>
                <p style={{ fontSize: '14px', color: '#d4d4d4', lineHeight: 1.4 }}>
                  {currentStrategy.briefSummary}
                </p>
              </div>

              {/* NOTE - Target Audience */}
              <div style={{ 
                backgroundColor: '#1a1a1a', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#4ade80', marginBottom: '8px' }}>
                  🎯 Target Audience
                </h4>
                <p style={{ fontSize: '14px', color: '#d4d4d4', lineHeight: 1.4 }}>
                  {currentStrategy.targetAudience}
                </p>
              </div>

              {/* NOTE - Messaging Approach */}
              <div style={{ 
                backgroundColor: '#1a1a1a', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fbbf24', marginBottom: '8px' }}>
                  💬 Messaging Approach
                </h4>
                <p style={{ fontSize: '14px', color: '#d4d4d4', lineHeight: 1.4 }}>
                  {currentStrategy.messagingApproach}
                </p>
              </div>

              {/* NOTE - Visual Elements */}
              {currentStrategy.visualElements && currentStrategy.visualElements.length > 0 && (
                <div style={{ 
                  backgroundColor: '#1a1a1a', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid #333'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#a78bfa', marginBottom: '8px' }}>
                    🎨 Visual Elements
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {currentStrategy.visualElements.map((element: unknown, index: number) => (
                      <span key={index} style={{
                        backgroundColor: '#2a2a2a',
                        color: '#d4d4d4',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {element as string}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTE - Recommended Headlines */}
              {currentStrategy.recommendedHeadlines && currentStrategy.recommendedHeadlines.length > 0 && (
                <div style={{ 
                  backgroundColor: '#1a1a1a', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid #333'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#f87171', marginBottom: '8px' }}>
                    📢 Recommended Headlines
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentStrategy.recommendedHeadlines.map((headline: unknown, index: number) => (
                      <div key={index} style={{
                        backgroundColor: '#2a2a2a',
                        color: '#d4d4d4',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        borderLeft: '3px solid #f87171'
                      }}>
                        {`${headline as string}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTE - Recommended CTAs */}
              {currentStrategy.recommendedCTAs && currentStrategy.recommendedCTAs.length > 0 && (
                <div style={{ 
                  backgroundColor: '#1a1a1a', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid #333'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#34d399', marginBottom: '8px' }}>
                    🎯 Recommended CTAs
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentStrategy.recommendedCTAs.map((cta: unknown, index: number) => (
                      <div key={index} style={{
                        backgroundColor: '#2a2a2a',
                        color: '#d4d4d4',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        borderLeft: '3px solid #34d399'
                      }}>
                        {`${cta as string}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTE - Emotional Triggers */}
              {currentStrategy.emotionalTriggers && currentStrategy.emotionalTriggers.length > 0 && (
                <div style={{ 
                  backgroundColor: '#1a1a1a', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: '1px solid #333'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#f59e0b', marginBottom: '8px' }}>
                    💝 Emotional Triggers
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {currentStrategy.emotionalTriggers.map((trigger: unknown, index: number) => (
                      <span key={index} style={{
                        backgroundColor: '#2a2a2a',
                        color: '#d4d4d4',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {trigger as string}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* NOTE - Campaign Timing */}
              <div style={{ 
                backgroundColor: '#1a1a1a', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#06b6d4', marginBottom: '8px' }}>
                  ⏰ Campaign Timing
                </h4>
                <p style={{ fontSize: '14px', color: '#d4d4d4', lineHeight: 1.4 }}>
                  {currentStrategy.campaignTiming}
                </p>
              </div>

            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#666',
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              {campaignElementsTyped?.campaignStrategies ? 
                'No strategy found for this category' : 
                'Generate campaign data to see strategies'
              }
            </div>
          )}
        </div> 


      </div>
    </div>
  );
};

export default GraphicBuilder;