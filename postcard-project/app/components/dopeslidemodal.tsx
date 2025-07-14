'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePostcard } from "../providers/PostcardProvider";
import DopeButton from "./dopebutton";
import DopeDivider from "./dopedivider";

type DopeSlideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  width?: string;
  className?: string;
  overlayClassName?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  contentForLeftSide?: React.ReactNode;     
};

const PostcardUpdateForm = () => {
  const { improvePostcard } = usePostcard();
  const [updatePrompt, setUpdatePrompt] = useState("");
  const [buttonText, setButtonText] = useState("Update Postcard");

  const handleSubmitUpdate = () => {
    if (updatePrompt.trim()) {
      // improvePostcard(updatePrompt);
      setUpdatePrompt("");
      setButtonText("Coming soon :D");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-white text-2xl font-bold mb-2 select-none">Update Your Postcard</h2>
        <p className="text-white/70 text-sm select-none">
          Describe what you'd like to change about your postcard design or strategy.
        </p>
      </div>

      <DopeDivider 
        orientation="horizontal"
        color="rgba(229, 231, 235, 0.3)"
        className="w-full h-[1px]"
        length="100%"
      />

      <div className="flex flex-col gap-4">
        <label className="text-white font-semibold select-none">
          What would you like to improve?
        </label>
        <textarea
          value={updatePrompt}
          onChange={(e) => setUpdatePrompt(e.target.value)}
          placeholder="e.g., Make the colors more vibrant, change the headline to be more urgent, adjust the campaign strategy for younger audience..."
          className="w-full h-32 p-4 bg-black/20 border border-gray-600 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:border-[#EA1D2E] transition-colors"
        />
      </div>

      <DopeButton 
        onClick={handleSubmitUpdate}
        className={`w-full cursor-pointer transition-opacity ${
          updatePrompt.trim() 
            ? "bg-[#EA1D2E] hover:bg-[#EA1D2E]/90" 
            : "bg-gray-600 cursor-not-allowed opacity-50"
        }`}
      >
        <p className="select-none font-bold">{buttonText}</p>
      </DopeButton>

      <div className="text-white/50 text-xs select-none">
        💡 Tip: Be specific about what you want to change for better results
      </div>
    </div>
  );
};

const DopeSlideModal: React.FC<DopeSlideModalProps> = ({
  isOpen,
  onClose,
  width = "500px",
  className = "",
  overlayClassName = "",
  showCloseButton = true,
  closeOnOverlayClick = true,
  contentForLeftSide,
}) => {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed inset-0 place-content-center px-[8%] bg-black/70 backdrop-blur-sm z-40 ${overlayClassName}`}
            onClick={handleOverlayClick}
          >
            {contentForLeftSide}
          </motion.div>

          {/* Modal */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 200,
              duration: 0.4 
            }}
            className={`fixed top-0 right-0 h-full bg-[#000001] border-l border-gray-700 shadow-2xl z-50 flex flex-col ${className}`}
            style={{ width }}
          >
            {/* Close Button */}
            {showCloseButton && (
              <div className="flex justify-end p-4">
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white transition-colors duration-200 select-none"
                  aria-label="Close modal"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {<PostcardUpdateForm />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DopeSlideModal; 