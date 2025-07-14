'use client'

import { api } from "@/convex/_generated/api";
import { createContext, useContext, useState } from "react";
import { useAction, ConvexProvider } from "convex/react";
import { ConvexReactClient } from "convex/react";


type PostcardType = {
    imageUrl: string;
    imagePrompt: string;
    headline: string;
    bodyText: string;
    callToAction: string;
    colors: string[];
    strategy: string;
} | null;

export type PostcardContextType = {
    postcard: PostcardType;
    setPostcard: (postcard: PostcardType) => void;
    postcardIsGenerating: boolean;
    setPostcardIsGenerating: (postcardIsGenerating: boolean) => void;
    wantsToGeneratePostcard: boolean;
    setWantsToGeneratePostcard: (wantsToGeneratePostcard: boolean) => void;
    wantToImprovePostcard: boolean;
    setWantToImprovePostcard: (wantToImprovePostcard: boolean) => void;
    postcardImprovementPrompt: string;
    setPostcardImprovementPrompt: (postcardImprovementPrompt: string) => void;
    finishedPostcardObject: any;
    setFinishedPostcardObject: (finishedPostcardObject: any) => void;

    // Functions
    generatePostcard: (prompt: string) => void;
    improvePostcard: (prompt: string) => void;

}

const PostcardContext = createContext<PostcardContextType | undefined>(undefined);

export const PostcardProvider = ({ children }: { children: React.ReactNode }) => {
    const convex = new ConvexReactClient('https://doting-sandpiper-273.convex.cloud');

    return (
        <ConvexProvider client={convex}>
            <PostcardProviderInner>{children}</PostcardProviderInner>
        </ConvexProvider>
    );
}

const PostcardProviderInner = ({ children }: { children: React.ReactNode }) => {
    const genPostcardMutation = useAction(api.postcards.generateFullPostcard);

    const [postcard, setPostcard] = useState<PostcardType>(null);
    const [postcardIsGenerating, setPostcardIsGenerating] = useState(false);
    const [finishedPostcardObject, setFinishedPostcardObject] = useState(null);
    const [wantsToGeneratePostcard, setWantsToGeneratePostcard] = useState(false);
    const [wantToImprovePostcard, setWantToImprovePostcard] = useState(false);
    const [postcardImprovementPrompt, setPostcardImprovementPrompt] = useState('');
    const generatePostcard = async (prompt: string) => {
        setPostcardIsGenerating(true);
        setWantsToGeneratePostcard(true);

        try {
            const result = await genPostcardMutation({
                prompt: prompt,
                replicateApiKey: process.env.NEXT_PUBLIC_REPLICATE_API_KEY || '',
            });

            if (result && result.success && result.postcard) {
                setPostcard(result.postcard);

                console.log('Postcard generated:', result.postcard);
            }
        } catch (error) {
            console.error('Error generating postcard:', error);
        } finally {
            setPostcardIsGenerating(false);
        }
    }

    const improvePostcard = async (prompt: string) => {
        setWantToImprovePostcard(true);
        setPostcardImprovementPrompt(prompt);
    }





    return (
        <PostcardContext.Provider value={{ 
            postcard, setPostcard, 
            postcardIsGenerating, setPostcardIsGenerating,
            finishedPostcardObject, setFinishedPostcardObject,
            wantsToGeneratePostcard, setWantsToGeneratePostcard,
            wantToImprovePostcard, setWantToImprovePostcard,
            postcardImprovementPrompt, setPostcardImprovementPrompt,

            // Functions
            generatePostcard, improvePostcard,
        }}>
            {children}
        </PostcardContext.Provider>
    );
}

export const usePostcard = () => {
    const context = useContext(PostcardContext);
    if (context === undefined) {
        throw new Error("usePostcard must be used within a PostcardProvider");
    }
    return context;
}