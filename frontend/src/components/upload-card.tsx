"use client";

import { useRef, useState } from "react";
import { AlertTriangle, ImageIcon, Loader2, UploadCloud, X } from "lucide-react";

interface UploadCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  previewUrl: string | null;
  uploading: boolean;
  uploadError: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  remoteUrl?: string;
  onUrlChange?: (url: string) => void;
  children?: React.ReactNode;
}

export function UploadCard({
  icon: Icon,
  title,
  subtitle,
  previewUrl,
  uploading,
  uploadError,
  onFile,
  onClear,
  remoteUrl,
  onUrlChange,
  children,
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const hasImage = Boolean(previewUrl || remoteUrl);
  const displayUrl = previewUrl || remoteUrl;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    onFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  return (
    <div className="group rounded-xl border border-zinc-200 bg-white/60 p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="truncate text-[11px] text-zinc-400">{subtitle}</p>
          )}
        </div>
        {hasImage && (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${title}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Drop zone */}
      <button
        type="button"
        onClick={() => !displayUrl && !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl transition-all duration-200",
          !displayUrl && !uploading && !dragging
            ? "cursor-pointer border-2 border-dashed border-zinc-300 bg-zinc-50 hover:border-primary-400 hover:bg-primary-50/30 dark:border-zinc-600 dark:bg-zinc-800/40 dark:hover:border-primary-500 dark:hover:bg-primary-500/5"
            : "",
          dragging
            ? "border-2 border-dashed border-primary-400 bg-primary-50/30 dark:border-primary-500 dark:bg-primary-500/10"
            : "",
          displayUrl || uploading
            ? "border-2 border-zinc-200 dark:border-zinc-700"
            : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-1.5 text-primary-600">
            <Loader2 className="h-7 w-7 animate-spin" />
            <span className="text-[11px] font-medium">Uploading...</span>
          </div>
        ) : uploadError ? (
          <div className="flex flex-col items-center gap-1 px-3 text-center text-red-500">
            <AlertTriangle className="h-7 w-7" />
            <span className="text-[11px] font-medium">{uploadError}</span>
          </div>
        ) : displayUrl ? (
          <img
            src={displayUrl}
            alt={`${title} preview`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-3 text-center text-zinc-400">
            <UploadCloud className="h-7 w-7" />
            <span className="text-xs font-medium">Click or drop</span>
          </div>
        )}
      </button>

      {/* Extra inputs (URL, description, etc.) */}
      {onUrlChange && (
        <div className="mt-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 focus-within:border-primary-400 dark:border-zinc-700 dark:bg-zinc-900">
            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <input
              type="url"
              inputMode="url"
              placeholder="Image URL..."
              value={remoteUrl || ""}
              onChange={(e) => onUrlChange(e.target.value)}
              className="w-full bg-transparent text-xs outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
