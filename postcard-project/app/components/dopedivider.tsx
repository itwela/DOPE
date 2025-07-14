import React from "react";

type DividerProps = {
  orientation?: "horizontal" | "vertical";
  color?: string;
  className?: string;
  length?: string;
};

const DopeDivider: React.FC<DividerProps> = ({ 
  orientation = "horizontal", 
  color = "#E5E7EB", 
  className = "",
  length = "100%"
}) => {
  const baseClasses = "flex-shrink-0";
  
  const orientationClasses = orientation === "horizontal" 
    ? `w-full h-[1px] ${length === "100%" ? "" : `max-w-[${length}]`}` 
    : `h-full w-[1px] ${length === "100%" ? "" : `max-h-[${length}]`}`;

  return (
    <div
      className={`${baseClasses} ${orientationClasses} ${className} select-none`}
      style={{ backgroundColor: color }}
    />
  );
};

export default DopeDivider; 