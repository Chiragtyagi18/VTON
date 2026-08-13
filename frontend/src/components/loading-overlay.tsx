"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const STATUS_MESSAGES = [
  "Uploading Image...",
  "Analyzing Pose...",
  "Preparing AI Model...",
  "Generating Virtual Try-On...",
  "Almost Ready...",
];

interface LoadingOverlayProps {
  statusLabel: string;
}

export function LoadingOverlay({ statusLabel }: LoadingOverlayProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/70 backdrop-blur-md dark:bg-zinc-950/70">
      {/* Animated gradient ring */}
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-glow rounded-full bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary-400/50 bg-zinc-900/5 dark:bg-zinc-900/50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-7 w-7 text-primary-500" />
          </motion.div>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700"
        />
      </div>

      {/* Status message */}
      <motion.p
        key={msgIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
      >
        {STATUS_MESSAGES[msgIndex]}
      </motion.p>

      <p className="text-xs text-zinc-400">
        {statusLabel} &middot; 15&ndash;30s remaining
      </p>
    </div>
  );
}
