import React, { useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePostcard } from '../contexts/PostcardContext';
import { useLLM } from '../contexts/LLMContext';
import { cn } from "@/lib/utils";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";

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

const ChevronLeft = (width = 24 as number, height = 24 as number) => {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="18,6 6,12 18,18" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const ChevronRight = (width = 24 as number, height = 24 as number) => {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="6,6 18,12 6,18" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

const ChevronDown = (width = 24 as number, height = 24 as number) => {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="6,8 12,18 18,8" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function InteractiveGridPatternDemo({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "absolute inset-0 h-full w-full",
        )}
      />
      <div className="relative z-10 h-full w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

const GraphicBuilder: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, postcardDimensions } = usePostcard();
  const { campaignElements } = useLLM();

  // Framer Motion values for the postcard card "run away" effect
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.5 });

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const cardRect = cardRef.current?.getBoundingClientRect();
    if (!containerRect || !cardRect) return;

    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Compute vector from mouse to card center
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    const deltaX = cardCenterX - mouseX;
    const deltaY = cardCenterY - mouseY;
    const distance = Math.hypot(deltaX, deltaY);

    // Only repel when the mouse is within this radius
    const influenceRadius = Math.min(containerRect.width, containerRect.height) * 0.5;
    if (distance < influenceRadius) {
      const normalizedX = deltaX / (distance || 1);
      const normalizedY = deltaY / (distance || 1);
      const strength = 1 - distance / influenceRadius; // 0..1
      const maxOffset = 30; // px
      x.set(normalizedX * strength * maxOffset);
      y.set(normalizedY * strength * maxOffset);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuOptions = [
    'Edit Postcard',
    'Download Postcard',
  ]
  const [selectedMenuOption, setSelectedMenuOption] = useState(menuOptions[0]);
  const [menuItemIsSelected, setMenuItemIsSelected] = useState(false);

  const handleMenuItemClick = (option: string) => {
    setSelectedMenuOption(option);
    setMenuItemIsSelected(true);
  };

  const handleBackClick = () => {
    setSelectedMenuOption(menuOptions[0]);
    setMenuItemIsSelected(false);
  };


  if (!selectedCategory) return null;

  return (
    <>

    <div className='flex flex-col w-full max-w-[1400px] mx-auto'>

      {/* Menu */}
      <div className='bg-neutral-800' style={{
        backgroundColor: '#141414',
        color: '#d4d4d4',
        margin: '0 auto',
        maxWidth: '1400px',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>

        <div className='flex gap-1 items-center p-6 w-max'>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#d4d4d4' }}>
            {menuItemIsSelected ? 'Editing ' + selectedCategory.name + ' Postcard' : ''}
          </h2>
        </div>

        <div className='flex gap-1 items-center p-6 w-max'>
        
          <button 
          style={{
            background: '#EA1D2E',
            border: '1px solid #2a2a2a',
            borderRadius: '100px',
            color: '#d4d4d4',
            height: '35px',
            padding: '0 36px',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
          onClick={() => menuItemIsSelected ? handleBackClick() : handleMenuItemClick(selectedMenuOption)}
          >
          <p>{ menuItemIsSelected ? 'Back' : selectedMenuOption}</p>
          </button>

          <button
                style={{
                  background: '#EA1D2E',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  color: '#d4d4d4',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  height: '35px',
                }}
                aria-label="Previous"
              >
                {ChevronDown(16, 16)}
          </button>

        
        </div>

      </div>

      <div style={{
        background: '#141414',
        border: '1px solid #1a1a1a',
        borderRadius: '16px',
        color: '#d4d4d4',
        margin: '0 auto',
        maxWidth: '1400px',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
      }}>

       {/* Header and toggle container */}
        <div className="justify-between bg-[#3A3939] w-[30%]">
            
            <div 
            style={{
              borderBottom: '3px solid #212121'
            }}
            className="h-[80px] px-[10%] select-none items-center flex">
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#d4d4d4' }}>
                Campaign Strategies
              </h2>
            </div>

            {currentStrategy ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px',  }}>
                
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
                fontStyle: 'italic',
              }}>
                {campaignElementsTyped?.campaignStrategies ? 
                  'No strategy found for this category' : 
                  'Generate campaign data to see strategies'
                }
              </div>
            )}
        </div>


        {/* Postcard Preview */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: '16px',
          width: '70%',
          height: '100%',
          backgroundColor: '#1A1A1A',
        }}
        >

          {/* Category Toggle */}
          <div className='bg-neutral-800' style={{
            paddingLeft: '30px',
            paddingRight: '30px',
            width: '100%',
            height: '80px',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '3px solid #212121'
          }}>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '16px',
              width: '100%'
            }}>
              <button
                onClick={goToPrevious}
                style={{
                  background: '#EA1D2E',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  color: '#d4d4d4',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
                aria-label="Previous"
              >
                {ChevronLeft(20, 20)}
              </button>
              
              <div className='select-none' style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#d4d4d4'

              }}>
                {selectedCategory.name} - {currentIndex + 1}/{categories.length}
              </div>

              <button
                onClick={goToNext}
                style={{
                  background: '#EA1D2E',
                  border: '1px solid #2a2a2a',
                  borderRadius: '12px',
                  color: '#d4d4d4',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '8px 12px',
                  fontWeight: 'bold',
                }}
                aria-label="Next"
              >
                {ChevronRight(20, 20)}
              </button>
            </div>

          </div> 

          {/* Postcard Preview */}
          <div  ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: '80%',
            height: `${postcardDimensions.height}px`,
          }}>

            <InteractiveGridPatternDemo>
              <motion.div 
              ref={cardRef}
              style={{
                background: 'linear-gradient(135deg, #ec1414 0%, #764ba2 100%)',
                border: '2px solid #333',
                borderRadius: '12px',
                width: '70%',
                height: '70%',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                x: springX,
                y: springY,
              }}
              className="">


              </motion.div>
            </InteractiveGridPatternDemo>


          </div> 




        </div>

      </div>
    
    </div>

    </>
  );
};

export default GraphicBuilder;