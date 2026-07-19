"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  RotateCcw,
  Sparkles,
  UploadCloud,
  User,
  X,
} from "lucide-react";

import { useVirtualTryOn, uploadImage } from "@/hooks/useVirtualTryOn";
import {
  GarmentUploader,
  newGarment,
  type GarmentItem,
} from "@/components/garment-uploader";
import { ThemeToggle } from "@/components/theme-toggle";

/* -------------------------------------------------------------------------- */
/*  User Photo Card (URL + File Upload)                                      */
/* -------------------------------------------------------------------------- */
function UserPhotoCard({
  previewUrl,
  remoteUrl,
  uploading,
  uploadError,
  onUrlChange,
  onFile,
  onClear,
}: {
  previewUrl: string | null;
  remoteUrl: string;
  uploading: boolean;
  uploadError: string | null;
  onUrlChange: (url: string) => void;
  onFile: (file: File) => Promise<void>;
  onClear: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasImage = Boolean(previewUrl || remoteUrl);
  const displayUrl = previewUrl || remoteUrl;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await onFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await onFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={[
        "group relative rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900",
        "transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl",
        hasImage
          ? "border-primary-400 ring-2 ring-primary-500/70"
          : "border-zinc-200 dark:border-zinc-800",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
          <User className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">Your Photo</h3>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            Upload a file or paste a URL
          </p>
        </div>
        {hasImage && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear your photo"
            className="ml-auto rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Locked 3:4 preview area — clickable and droppable */}
      <div
        role={!displayUrl ? "button" : undefined}
        tabIndex={!displayUrl ? 0 : undefined}
        onClick={() => {
          if (!displayUrl && !uploading) fileInputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (!displayUrl && !uploading && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={[
          "relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed",
          "transition-colors duration-200",
          !displayUrl && !uploading
            ? "cursor-pointer border-zinc-200 bg-zinc-50 hover:border-primary-400 hover:bg-primary-50/30 dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-primary-500 dark:hover:bg-primary-500/5"
            : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60",
        ].join(" ")}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-primary-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs font-medium">Uploading photo...</span>
          </div>
        ) : uploadError ? (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-red-500">
            <AlertTriangle className="h-8 w-8" />
            <span className="text-xs font-medium">{uploadError}</span>
          </div>
        ) : displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt="Your photo preview"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-zinc-400">
            <UploadCloud className="h-8 w-8" />
            <span className="text-xs font-medium">Click or drop a photo</span>
            <span className="text-[11px] text-zinc-400">Locked 3:4</span>
          </div>
        )}
      </div>

      {/* Public URL input */}
      <div className="mt-3">
        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          Or paste a public image URL
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 focus-within:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900">
          <ImageIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <input
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={remoteUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Output Canvas                                                             */
/* -------------------------------------------------------------------------- */
function SkeletonLoader() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      <div className="h-full w-full animate-shimmer bg-[linear-gradient(110deg,#e4e4e7_8%,#f4f4f5_18%,#e4e4e7_33%)] bg-[length:200%_100%] dark:bg-[linear-gradient(110deg,#27272a_8%,#3f3f46_18%,#27272a_33%)]" />
    </div>
  );
}

function OutputCanvas({
  phase,
  statusLabel,
  resultUrl,
  error,
  isLoading,
  onReset,
}: {
  phase: string;
  statusLabel: string;
  resultUrl: string | null;
  error: string | null;
  isLoading: boolean;
  onReset: () => void;
}) {
  return (
    <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-inner dark:border-zinc-800 dark:bg-zinc-900">
      {/* Final result */}
      <AnimatePresence mode="wait">
        {phase === "completed" && resultUrl ? (
          <motion.img
            key="result"
            src={resultUrl}
            alt="Virtual try-on result"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="h-full w-full object-cover"
          />
        ) : null}
      </AnimatePresence>

      {/* Idle placeholder */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-3 px-6 text-center text-zinc-400">
          <Sparkles className="h-10 w-10" />
          <p className="max-w-xs text-sm font-medium">
            Your generated try-on will appear here.
          </p>
        </div>
      )}

      {/* Loading overlay — frosted glass + skeleton + status message */}
      {isLoading && (
        <>
          <SkeletonLoader />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/40 backdrop-blur-sm dark:bg-black/40">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <motion.p
              key={statusLabel}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-semibold text-zinc-700 dark:text-zinc-200"
            >
              {statusLabel}
            </motion.p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Applying garments sequentially · 15–30s per item.
            </p>
          </div>
        </>
      )}

      {/* Failure state */}
      {phase === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70 px-6 text-center backdrop-blur-sm dark:bg-black/60">
          <AlertTriangle className="h-9 w-9 text-red-500" />
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {statusLabel}
          </p>
          {error && (
            <p className="max-w-xs text-xs text-zinc-500 dark:text-zinc-400">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={onReset}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* Success badge */}
      {phase === "completed" && resultUrl && (
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ready!
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */
export default function Home() {
  // User photo — supports both URL paste AND file upload.
  const [userPhoto, setUserPhoto] = useState<{
    previewUrl: string | null;
    remoteUrl: string;
    uploading: boolean;
    uploadError: string | null;
  }>({ previewUrl: null, remoteUrl: "", uploading: false, uploadError: null });

  // Garment — single upload only.
  const [garment, setGarment] = useState<GarmentItem>(() => newGarment());

  const { generate, reset, phase, statusLabel, isLoading, resultUrl, error } =
    useVirtualTryOn();

  // Fire confetti once when a result lands.
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (phase === "completed" && resultUrl && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#818cf8", "#a5b4fc", "#10b981"],
      });
    }
    if (phase !== "completed") celebratedRef.current = false;
  }, [phase, resultUrl]);

  /* ----------------------------- garment helper ------------------------------ */
  const handleGarmentFile = useCallback(
    async (id: string, file: File) => {
      // Revoke any previous preview object URL.
      if (garment.previewUrl) URL.revokeObjectURL(garment.previewUrl);

      const previewUrl = URL.createObjectURL(file);
      setGarment((prev) => ({
        ...prev,
        previewUrl,
        fileName: file.name,
        remoteUrl: "",
        uploading: true,
        uploadError: null,
      }));

      try {
        const url = await uploadImage(file);
        setGarment((prev) => ({ ...prev, remoteUrl: url, uploading: false }));
      } catch (err) {
        setGarment((prev) => ({
          ...prev,
          uploading: false,
          uploadError:
            err instanceof Error ? err.message : "Upload failed. Try again.",
        }));
      }
    },
    [garment.previewUrl],
  );

  const clearUser = useCallback(() => {
    // Revoke any local preview object URL.
    setUserPhoto((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { previewUrl: null, remoteUrl: "", uploading: false, uploadError: null };
    });
  }, []);

  const handleUserPhotoFile = useCallback(async (file: File) => {
    // Show local preview immediately.
    const localPreview = URL.createObjectURL(file);
    setUserPhoto((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { previewUrl: localPreview, remoteUrl: "", uploading: true, uploadError: null };
    });

    try {
      const url = await uploadImage(file);
      setUserPhoto((prev) => ({ ...prev, remoteUrl: url, uploading: false }));
    } catch (err) {
      setUserPhoto((prev) => ({
        ...prev,
        uploading: false,
        uploadError:
          err instanceof Error ? err.message : "Upload failed. Try again.",
      }));
    }
  }, []);

  /* -------------------------------- generate -------------------------------- */
  const garmentReady = Boolean(garment.remoteUrl);

  const userPhotoReady = Boolean(userPhoto.remoteUrl);

  const canGenerate =
    userPhotoReady && garmentReady && !garment.uploading && !isLoading;

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    void generate({
      userImageUrl: userPhoto.remoteUrl,
      garment: {
        imageUrl: garment.remoteUrl,
        description: garment.description,
        isBottom: garment.isBottom,
      },
    });
  }, [canGenerate, generate, userPhoto.remoteUrl, garment]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI Virtual Try-On
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            VTO Studio
          </h1>
          <p className="max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
            Add your photo and upload a garment (top or bottom) to preview it on you, rendered by AI.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Mobile-first: stacked. md+: balanced 2-column split */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left column — inputs */}
        <section className="flex flex-col gap-5">
          <UserPhotoCard
            previewUrl={userPhoto.previewUrl}
            remoteUrl={userPhoto.remoteUrl}
            uploading={userPhoto.uploading}
            uploadError={userPhoto.uploadError}
            onUrlChange={(url) => setUserPhoto((prev) => ({ ...prev, remoteUrl: url }))}
            onFile={handleUserPhotoFile}
            onClear={clearUser}
          />

          <GarmentUploader
            garment={garment}
            onFile={handleGarmentFile}
            onDescription={(id, value) => setGarment((prev) => ({ ...prev, description: value }))}
            onToggleBottom={(id, value) => setGarment((prev) => ({ ...prev, isBottom: value }))}
          />

          {/* Action */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              disabled={!canGenerate}
              onClick={handleGenerate}
              className={[
                "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-colors",
                canGenerate
                  ? "bg-primary-600 hover:bg-primary-700"
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
              <p className="mt-2 text-center text-xs text-zinc-400">
                {garment.uploading
                  ? "Waiting for garment upload to finish…"
                  : userPhoto.uploading
                    ? "Uploading your photo…"
                    : "Add your photo (upload or URL) and upload a garment."}
              </p>
            )}
          </div>
        </section>

        {/* Right column — output preview canvas */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Output Preview
            </h2>
            {phase !== "idle" && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>

          <div className="md:sticky md:top-6">
            <OutputCanvas
              phase={phase}
              statusLabel={statusLabel}
              resultUrl={resultUrl}
              error={error}
              isLoading={isLoading}
              onReset={reset}
            />

            {phase === "completed" && resultUrl && (
              <a
                href={resultUrl}
                download
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
              >
                Download result
              </a>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
