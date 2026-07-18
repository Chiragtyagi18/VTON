"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Shirt,
  UploadCloud,
  X,
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

function GarmentCard({
  garment,
  index,
  canRemove,
  onFile,
  onDescription,
  onToggleBottom,
  onRemove,
}: {
  garment: GarmentItem;
  index: number;
  canRemove: boolean;
  onFile: (id: string, file: File) => void;
  onDescription: (id: string, value: string) => void;
  onToggleBottom: (id: string, value: boolean) => void;
  onRemove: (id: string) => void;
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
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={[
        "group relative rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900",
        "transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl",
        garment.remoteUrl
          ? "border-primary-400 ring-2 ring-primary-500/70"
          : "border-zinc-200 dark:border-zinc-800",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
          {index + 1}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">
            Garment {index + 1}
          </h3>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {garment.isBottom ? "Bottom (pants / jeans)" : "Top / shirt / jacket"}
          </p>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(garment.id)}
            aria-label={`Remove garment ${index + 1}`}
            className="ml-auto rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
            alt={`Garment ${index + 1} preview`}
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

export function GarmentUploader({
  garments,
  onAdd,
  onFile,
  onDescription,
  onToggleBottom,
  onRemove,
}: {
  garments: GarmentItem[];
  onAdd: () => void;
  onFile: (id: string, file: File) => void;
  onDescription: (id: string, value: string) => void;
  onToggleBottom: (id: string, value: boolean) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Shirt className="h-4 w-4 text-primary-600" />
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Garments
        </h3>
        <span className="text-xs text-zinc-400">
          Add a top and a bottom to try on together
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {garments.map((garment, index) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              index={index}
              canRemove={garments.length > 1}
              onFile={onFile}
              onDescription={onDescription}
              onToggleBottom={onToggleBottom}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>

        {/* Add garment button (styled as a dashed card) */}
        <motion.button
          layout
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onAdd}
          className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-4 text-zinc-500 transition-colors hover:border-primary-400 hover:text-primary-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-primary-500"
        >
          <Plus className="h-7 w-7" />
          <span className="text-sm font-medium">Add garment</span>
        </motion.button>
      </div>
    </div>
  );
}
