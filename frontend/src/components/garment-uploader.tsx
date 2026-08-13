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
      className="group rounded-xl border border-zinc-200 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
          <Shirt className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">Garment</h3>
          <p className="truncate text-[11px] text-zinc-400">
            {garment.isBottom ? "Bottom (pants / jeans)" : "Top / shirt / jacket"}
          </p>
        </div>
      </div>

      {/* Drop zone */}
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
          "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl transition-all duration-200",
          !garment.previewUrl && !garment.uploading && !dragging
            ? "cursor-pointer border-2 border-dashed border-zinc-300 bg-zinc-50 hover:border-primary-400 hover:bg-primary-50/30 dark:border-zinc-600 dark:bg-zinc-800/40 dark:hover:border-primary-500 dark:hover:bg-primary-500/5"
            : "",
          dragging
            ? "border-2 border-dashed border-primary-400 bg-primary-50/30 dark:border-primary-500 dark:bg-primary-500/10"
            : "",
          garment.previewUrl || garment.uploading
            ? "border-2 border-zinc-200 dark:border-zinc-700"
            : "",
        ].join(" ")}
      >
        {garment.previewUrl ? (
          <img
            src={garment.previewUrl}
            alt="Garment preview"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-3 text-center text-zinc-400">
            <UploadCloud className="h-7 w-7" />
            <span className="text-xs font-medium">Click or drop</span>
          </div>
        )}

        {/* Upload overlay */}
        {garment.uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/60 backdrop-blur-sm dark:bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Uploading…
            </span>
          </div>
        )}

        {!garment.uploading && garment.remoteUrl && (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            <CheckCircle2 className="h-2.5 w-2.5" />
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
        <p className="mt-1.5 text-[11px] text-red-500">{garment.uploadError}</p>
      )}

      {/* Description & toggle */}
      <div className="mt-3 flex flex-col gap-2">
        <input
          type="text"
          value={garment.description}
          onChange={(e) => onDescription(garment.id, e.target.value)}
          placeholder="e.g. red cotton t-shirt"
          className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs outline-none transition-colors focus:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={garment.isBottom}
            onChange={(e) => onToggleBottom(garment.id, e.target.checked)}
            className="h-3.5 w-3.5 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
          />
          This is a bottom (pants / jeans)
        </label>
      </div>
    </motion.div>
  );
}
