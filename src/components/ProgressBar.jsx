import React from "react";
import { motion } from "framer-motion";

const MotionDiv = motion.div;

function ProgressBar({ percent }) {
  return (
    <div className="mb-8">
      <div className="h-2 w-full rounded bg-neutral-200 overflow-hidden">
        <MotionDiv
          className="h-2 bg-black"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="mt-2 text-sm text-neutral-500">{Math.round(percent)}%</div>
    </div>
  );
}

export default ProgressBar;
