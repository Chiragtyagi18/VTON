"use client";

import { motion } from "framer-motion";
import {
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
  User,
} from "lucide-react";
import { UploadCard } from "@/components/upload-card";
import { GarmentUploader, type GarmentItem } from "@/components/garment-uploader";
import { PreviewPanel } from "@/components/preview-panel";
import type { TryOnPhase } from "@/hooks/useVirtualTryOn";

interface UploadWorkspaceProps {
  userPhoto: {
    previewUrl: string | null;
    remoteUrl: string;
    uploading: boolean;
    uploadError: string | null;
  };
  onUserPhotoUrlChange: (url: string) => void;
  onUserPhotoFile: (file: File) => Promise<void>;
  onClearUserPhoto: () => void;

  garment: GarmentItem;
  onGarmentFile: (id: string, file: File) => void;
  onGarmentDescription: (id: string, value: string) => void;
  onGarmentToggleBottom: (id: string, value: boolean) => void;

  canGenerate: boolean;
  isLoading: boolean;
  onGenerate: () => void;

  phase: TryOnPhase;
  statusLabel: string;
  resultUrl: string | null;
  error: string | null;
  onReset: () => void;
}

export function UploadWorkspace({
  userPhoto,
  onUserPhotoUrlChange,
  onUserPhotoFile,
  onClearUserPhoto,
  garment,
  onGarmentFile,
  onGarmentDescription,
  onGarmentToggleBottom,
  canGenerate,
  isLoading,
  onGenerate,
  phase,
  statusLabel,
  resultUrl,
  error,
  onReset,
}: UploadWorkspaceProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          <Sparkles className="h-3 w-3 text-primary-500" />
          Try It Now
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Upload &amp; Try On
        </h2>
      </motion.div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white/50 p-4 shadow-sm backdrop-blur-xl sm:p-6 dark:border-zinc-800/80 dark:bg-zinc-950/50">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* User Photo */}
          <div className="flex flex-col gap-3">
            <UploadCard
              icon={User}
              title="Your Photo"
              subtitle="Upload a file or paste a URL"
              previewUrl={userPhoto.previewUrl}
              uploading={userPhoto.uploading}
              uploadError={userPhoto.uploadError}
              onFile={onUserPhotoFile}
              onClear={onClearUserPhoto}
              remoteUrl={userPhoto.remoteUrl}
              onUrlChange={onUserPhotoUrlChange}
            />
          </div>

          {/* Garment */}
          <div className="flex flex-col gap-3">
            <GarmentUploader
              garment={garment}
              onFile={onGarmentFile}
              onDescription={onGarmentDescription}
              onToggleBottom={onGarmentToggleBottom}
            />
          </div>

          {/* Output Preview */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                Output Preview
              </h2>
              {phase !== "idle" && (
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
            </div>

            <PreviewPanel
              phase={phase}
              statusLabel={statusLabel}
              resultUrl={resultUrl}
              error={error}
              isLoading={isLoading}
              onReset={onReset}
              userPhotoUrl={userPhoto.remoteUrl}
            />

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              disabled={!canGenerate}
              onClick={onGenerate}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200",
                canGenerate
                  ? "bg-gradient-to-r from-primary-600 to-primary-800 shadow-md hover:shadow-lg hover:from-primary-500 hover:to-primary-700"
                  : "cursor-not-allowed bg-zinc-300 dark:bg-zinc-700",
              ].join(" ")}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Try-On
                </>
              )}
            </motion.button>

            {!canGenerate && !isLoading && (
              <p className="text-center text-xs text-zinc-400">
                {garment.uploading
                  ? "Waiting for garment upload…"
                  : userPhoto.uploading
                    ? "Uploading your photo…"
                    : "Upload your photo and a garment to begin."}
              </p>
            )}

            {phase === "completed" && resultUrl && (
              <a
                href={resultUrl}
                download
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
              >
                <Download className="h-4 w-4" />
                Download result
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
