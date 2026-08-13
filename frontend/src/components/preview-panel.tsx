"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Expand,
  RotateCcw,
  Share2,
  Sparkles,
} from "lucide-react";
import { LoadingOverlay } from "@/components/loading-overlay";
import type { TryOnPhase } from "@/hooks/useVirtualTryOn";

interface PreviewPanelProps {
  phase: TryOnPhase;
  statusLabel: string;
  resultUrl: string | null;
  error: string | null;
  isLoading: boolean;
  onReset: () => void;
  userPhotoUrl?: string | null;
}

export function PreviewPanel({
  phase,
  statusLabel,
  resultUrl,
  error,
  isLoading,
  onReset,
  userPhotoUrl,
}: PreviewPanelProps) {
  const [showCompare, setShowCompare] = useState(false);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "vto-result.png";
    a.click();
  };

  const handleFullscreen = async () => {
    if (!resultUrl) return;
    const img = window.open("", "_blank");
    if (img) {
      img.document.write(
        `<img src="${resultUrl}" style="max-width:100%;height:auto;display:block;margin:auto;background:#000" />`,
      );
    }
  };

  const handleShare = async () => {
    if (!resultUrl) return;
    try {
      await navigator.share({ title: "VTO Studio Result", url: resultUrl });
    } catch {
      // not supported or cancelled
    }
  };

  return (
    <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-inner dark:border-zinc-800 dark:bg-zinc-900">
      <AnimatePresence mode="wait">
        {/* Idle state */}
        {phase === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 px-6 text-center text-zinc-400"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/10 to-primary-700/10 dark:from-primary-500/5 dark:to-primary-700/5">
              <Sparkles className="h-7 w-7 text-primary-500/50" />
            </div>
            <p className="max-w-[200px] text-sm font-medium">
              Your AI-generated try-on will appear here
            </p>
          </motion.div>
        )}

        {/* Loading state */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <LoadingOverlay statusLabel={statusLabel} />
          </motion.div>
        )}

        {/* Completed state */}
        {phase === "completed" && resultUrl && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Before/After comparison */}
            {showCompare && userPhotoUrl ? (
              <div className="relative h-full w-full">
                <img
                  src={userPhotoUrl}
                  alt="Original"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 z-10 overflow-hidden" style={{ width: "50%" }}>
                  <img
                    src={resultUrl}
                    alt="After"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Divider */}
                <div className="absolute top-0 bottom-0 left-1/2 z-20 w-0.5 -translate-x-1/2 bg-white shadow-lg">
                  <div className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md" />
                </div>
              </div>
            ) : (
              <img
                src={resultUrl}
                alt="Virtual try-on result"
                className="h-full w-full object-cover"
              />
            )}

            {/* Top badge */}
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready!
            </div>

            {/* Floating action buttons */}
            <div className="absolute right-3 bottom-3 flex flex-col gap-2">
              <ActionButton icon={Download} label="Download" onClick={handleDownload} />
              <ActionButton icon={Expand} label="Fullscreen" onClick={handleFullscreen} />
              <ActionButton icon={Share2} label="Share" onClick={handleShare} />
              {userPhotoUrl && (
                <ActionButton
                  icon={CheckCircle2}
                  label={showCompare ? "Result" : "Compare"}
                  onClick={() => setShowCompare(!showCompare)}
                  active={showCompare}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* Failed state */}
        {phase === "failed" && (
          <motion.div
            key="failed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 px-6 text-center backdrop-blur-sm dark:bg-black/60"
          >
            <AlertTriangle className="h-9 w-9 text-red-500" />
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {statusLabel}
            </p>
            {error && (
              <p className="max-w-[260px] text-xs text-zinc-500 dark:text-zinc-400">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={onReset}
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={label}
      className={[
        "flex h-9 w-9 items-center justify-center rounded-xl text-xs shadow-lg backdrop-blur-sm transition-colors",
        active
          ? "bg-primary-600 text-white"
          : "bg-white/90 text-zinc-700 hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
    </motion.button>
  );
}
