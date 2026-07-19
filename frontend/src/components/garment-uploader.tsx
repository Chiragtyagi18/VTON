"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Shirt,
  UploadCloud,
} from "lucide-react";

export interface GarmentItem {
  id: string;
  previewUrl: string | null;
  remoteUrl: string;
  fileName: string | null;
  description: string;
  isBottom: boolean;
  uploading: boolean;
  uploadError: string | null;
}

export function newGarment(): GarmentItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    previewUrl: null,
    remoteUrl: "",
    fileName: null,
    description: "A stylish garment",
    isBottom: false,
    uploading: false,
    uploadError: null,
  };
}

export function GarmentUploader({
  garment,
  onFile,
  onDescription,
  onToggleBottom,
}: {
  garment: GarmentItem;
  onFile: (id: string, file: File) => void;
  onDescription: (id: string, value: string) => void;
  onToggleBottom: (id: string, value: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const hasImage = Boolean(garment.previewUrl);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) onFile(garment.id, file);
    },
    [garment.id, onFile],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={[
        "group relative rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900",
        "transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl",
        garment.remoteUrl
          ? "border-primary-400 ring-2 ring-primary-500/70"
          : "border-zinc-200 dark:border-zinc-800",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
          <Shirt className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">Garment</h3>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {garment.isBottom ? "Bottom (pants / jeans)" : "Top / shirt / jacket"}
          </p>
        </div>
      </div>

      {/* Locked 3:4 aspect ratio drop / preview area */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          "relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl",
          "bg-zinc-50 dark:bg-zinc-800/60",
          dragging
            ? "border-2 border-dashed border-primary-500"
            : "border-2 border-dashed border-zinc-200 dark:border-zinc-700",
        ].join(" ")}
      >
        {garment.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={garment.previewUrl}
            alt="Garment preview"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-zinc-400">
            <UploadCloud className="h-8 w-8" />
            <span className="text-xs font-medium">Tap or drop an image</span>
            <span className="text-[11px] text-zinc-400">JPG or PNG</span>
          </div>
        )}

        {/* Upload status overlay */}
        {garment.uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/60 backdrop-blur-sm dark:bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Uploading…
            </span>
          </div>
        )}
        {!garment.uploading && garment.remoteUrl && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
            <CheckCircle2 className="h-3 w-3" />
            Uploaded
          </span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(garment.id, file);
            e.target.value = "";
          }}
        />
      </button>

      {garment.uploadError && (
        <p className="mt-2 text-xs text-red-500">{garment.uploadError}</p>
      )}

      {/* Description */}
      <input
        type="text"
        value={garment.description}
        onChange={(e) => onDescription(garment.id, e.target.value)}
        placeholder="e.g. a red cotton t-shirt"
        className="mt-3 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900"
      />

      {/* Top / bottom toggle */}
      <label className="mt-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={garment.isBottom}
          onChange={(e) => onToggleBottom(garment.id, e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
        />
        This is a bottom (pants / jeans)
      </label>
    </motion.div>
  );
}