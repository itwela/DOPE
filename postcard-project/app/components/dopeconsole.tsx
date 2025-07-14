'use client';

import { usePostcard } from "../providers/PostcardProvider";
import React from "react";
import DopeDivider from "./dopedivider";
import { motion } from "framer-motion";

const ColorPaletteDisplay = () => {
    const { postcard } = usePostcard();

    const colors = postcard?.colors;

    return (
        <div className="w-full h-[30%] rounded-lg flex flex-col gap-4 shadow-lg">
            <h1 className="text-white text-2xl font-bold select-none">Colors</h1>
            <div className="flex flex-row gap-4 h-[100px] border-2 border-gray-700 rounded-lg p-2 shadow-inner">
                {colors?.map((color: string, index: number) => (
                    <div 
                        key={index} 
                        className="w-10 h-full rounded-md shadow-md transform transition-transform hover:scale-105" 
                        style={{ backgroundColor: color, border: '1px solid rgba(255, 255, 255, 0.5)' }}
                    ></div>
                ))}
            </div>
        </div>
    )
}

const CampaignStrategyDisplay = () => {

    const { postcard } = usePostcard();

    const postcardStrategy = postcard?.strategy;

    return (
        <>
        <h1 className="text-white text-2xl font-bold select-none">Campaign Strategy</h1>
        <div className="w-full h-[70%] overflow-y-auto rounded-lg">
             {postcardStrategy && postcardStrategy.split('').map((char: string, index: number) => (
                <motion.span 
                    key={index} 
                    initial={{ opacity: 0, y: -50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: index * 0.005 }}
                    className="text-white text-sm"
                >
                    {char}
                </motion.span>

            ))} 
        </div>
        </>
    )
}

export default function DopeConsole() {

    const { wantsToGeneratePostcard, setWantsToGeneratePostcard } = usePostcard();


    return (
        <React.Fragment>
            <div className="flex flex-col gap-4 w-full max-w-[300px] h-[600px] overflow-hidden">
                <ColorPaletteDisplay />
                <DopeDivider 
                    orientation="horizontal"
                    color="rgba(229, 231, 235, 0.3)"
                    className="w-full h-[1px]"
                    length="100%"
                />
                <CampaignStrategyDisplay />
            </div>
        </React.Fragment>
    )
}