'use client';

import DopeButton from "./dopebutton";
import { usePostcard } from "../providers/PostcardProvider";
import DopeSlideModal from "./dopeslidemodal";
import React, { useState } from "react";
import DopePostCard from "./dopepostcard";
import DopeDivider from "./dopedivider";

const DopeChat = () => {
    return (
        <div className="w-full h-full flex flex-col gap-8 items-center justify-start">
            <h1 className="text-black text-lg font-bold select-none">Improve With Ai</h1>
            <DopeDivider
                orientation="horizontal"
                color="rgba(27, 27, 27, 0.3)"
                className="w-full h-[1px]"
                length="100%"
            />
        </div>
    )
}

export default function DopeImproveConsole() {
    const { setWantsToGeneratePostcard, generatePostcard } = usePostcard();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenModal = () => {
        setIsOpen(true);
    }


    return (
        <React.Fragment>
            
            <div className="flex flex-row gap-[100px] items-center justify-center">

                <div className="flex flex-col gap-2 items-center justify-center">

                    <div className="flex flex-col gap-2 items-center justify-center">
                        <h1 className="font-bold text-white text-xl select-none">Want to make a new postcard?</h1>
                        <DopeButton onClick={() => generatePostcard('')} className="w-max cursor-pointer bg-[#EA1D2E]">
                            <p className="select-none font-bold select-none">Generate New Postcard</p>
                        </DopeButton>
                    </div>

                </div>

                <DopeDivider
                    orientation="vertical"
                    color="rgba(227, 227, 227, 0.3)"
                    className="h-[100px]"
                    length="1px"
                />

                <div className="flex flex-col gap-2 items-center justify-center">
                    <h1 className="font-bold text-white text-xl select-none">Need to make changes?</h1>
                    <DopeButton onClick={handleOpenModal} className="w-[200px] cursor-pointer bg-[#EA1D2E]">
                        <p className="select-none font-bold select-none">Improve With Ai</p>
                    </DopeButton>
                </div>

            </div>


            <DopeSlideModal
                contentForLeftSide={
                    <span className="lg:flex hidden">
                <DopePostCard/>
            </span>
                }
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </React.Fragment>
    )
}