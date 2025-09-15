"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type DrawerDirection = "left" | "right" | "top" | "bottom";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  direction?: DrawerDirection;
  className?: string;
  children: React.ReactNode;
}

export const Drawer = ({ isOpen, onClose, direction = "left", className, children }: DrawerProps) => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const getPanelPositionClasses = (dir: DrawerDirection) => {
    switch (dir) {
      case "left":
        return "top-0 left-0 h-full w-[85vw] max-w-sm";
      case "right":
        return "top-0 right-0 h-full w-[85vw] max-w-sm";
      case "top":
        return "top-0 left-0 w-full h-[80vh] max-h-[90vh]";
      case "bottom":
        return "bottom-0 left-0 w-full h-[80vh] max-h-[90vh]";
      default:
        return "top-0 left-0 h-full w-[85vw] max-w-sm";
    }
  };

  const variants = {
    hidden: {
      x: direction === "left" ? "-100%" : direction === "right" ? "100%" : 0,
      y: direction === "top" ? "-100%" : direction === "bottom" ? "100%" : 0,
    },
    visible: { x: 0, y: 0 },
    exit: {
      x: direction === "left" ? "-100%" : direction === "right" ? "100%" : 0,
      y: direction === "top" ? "-100%" : direction === "bottom" ? "100%" : 0,
    },
  } as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`fixed z-50 bg-white shadow-xl ${getPanelPositionClasses(direction)} ${className || ""}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={variants}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};


