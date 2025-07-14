'use client'

import { motion } from "framer-motion";
import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  animationProps?: object;
  className?: string;
};

const DopeButton: React.FC<ButtonProps> = ({ children, onClick, animationProps, className }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`px-4 py-2 text-white rounded ${className}`}
      {...animationProps}
    >
      {children}
    </motion.button>
  );
};

export default DopeButton;
