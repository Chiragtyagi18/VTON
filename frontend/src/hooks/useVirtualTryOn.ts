"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useVirtualTryOn
 * ----------------
 * Coordinates communication with the FastAPI virtual try-on backend.
 *
 *  1. POST  /api/v1/tryon/generate         -> { task_id }
 *  2. Every 2.5s: GET /api/v1/tryon/status/{task_id}
 *       until status === "completed" | "failed".
 *
 * Multiple garments are sent as an array and applied sequentially by the
 * backend (e.g. a top then a bottom).
 *
 * Manages local React state for loading, progressive status messages,
 * error boundaries and the final output URL.
 */

const API_BASE = "http://localhost:8000/api/v1";
const POLL_INTERVAL_MS = 2500;

export type TryOnPhase =
  | "idle"
  | "starting"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

/** Human-readable status label surfaced in the UI. */
export const PHASE_LABELS: Record<TryOnPhase, string> = {
  idle: "Ready to generate",
  starting: "Starting inference...",
  queued: "Processing on AI queue...",
  processing: "Processing on AI queue...",
  completed: "Ready!",
  failed: "Generation failed",
};

export interface GarmentPayload {
  imageUrl: string;
  description?: string;
  isBottom?: boolean;
}

export interface GenerateParams {
  userImageUrl: string;
  garments: GarmentPayload[];
}

interface StatusResponse {
  task_id: string;
  status: "pending" | "completed" | "failed";
  result_url?: string | null;
  error?: string | null;
}

interface GenerateResponse {
  task_id: string;
}

export interface UseVirtualTryOnResult {
  generate: (params: GenerateParams) => Promise<void>;
  reset: () => void;
  phase: TryOnPhase;
  statusLabel: string;
  isLoading: boolean;
  resultUrl: string | null;
  error: string | null;
  taskId: string | null;
}

/**
 * Upload a raw image file to the backend and return the public URL that the
 * try-on pipeline can consume.
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed (HTTP ${res.status})`);
  }

  const data: { url: string } = await res.json();
  if (!data.url) {
    throw new Error("Upload did not return a URL.");
  }
  return data.url;
}

export function useVirtualTryOn(): UseVirtualTryOnResult {
  const [phase, setPhase] = useState<TryOnPhase>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Keep track of the polling timer and mounted state to avoid leaks / races.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const mountedRef = useRef(true);

  const clearPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    clearPolling();
    setPhase("idle");
    setResultUrl(null);
    setError(null);
    setTaskId(null);
  }, [clearPolling]);

  const pollStatus = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${API_BASE}/tryon/status/${id}`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error(`Status check failed (HTTP ${res.status})`);
        }

        const data: StatusResponse = await res.json();
        if (!mountedRef.current) return;

        if (data.status === "completed") {
          clearPolling();
          setResultUrl(data.result_url ?? null);
          setPhase("completed");
          return;
        }

       if (data.status === "failed") {
  clearPolling();
  
  // Make the Hugging Face error user-friendly
  let errorMessage = data.error || "The AI pipeline reported a failure.";
  if (errorMessage.includes("RuntimeError")) {
    errorMessage = "The AI couldn't detect a clear human pose. Please try a different, well-lit photo facing the camera.";
  }
  
  setError(errorMessage);
  setPhase("failed");
  return;
}

        // Still pending — surface a "queued/processing" state. After the first
        // couple of polls we transition the copy to indicate active processing.
        pollCountRef.current += 1;
        setPhase(pollCountRef.current > 1 ? "processing" : "queued");
      } catch (err) {
        if (!mountedRef.current) return;
        clearPolling();
        setError(err instanceof Error ? err.message : "Unknown polling error");
        setPhase("failed");
      }
    },
    [clearPolling],
  );

  const generate = useCallback(
    async (params: GenerateParams) => {
      // Fresh start.
      clearPolling();
      setResultUrl(null);
      setError(null);
      setTaskId(null);
      setPhase("starting");

      try {
        const res = await fetch(`${API_BASE}/tryon/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            user_image_url: params.userImageUrl,
            garments: params.garments.map((g) => ({
              image_url: g.imageUrl,
              garment_description: g.description ?? "A stylish garment",
              is_bottom: g.isBottom ?? false,
            })),
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to start generation (HTTP ${res.status})`);
        }

        const data: GenerateResponse = await res.json();
        if (!mountedRef.current) return;

        if (!data.task_id) {
          throw new Error("Backend did not return a task_id.");
        }

        setTaskId(data.task_id);
        setPhase("queued");

        // Kick off an immediate poll, then continue on an interval.
        void pollStatus(data.task_id);
        pollRef.current = setInterval(() => {
          void pollStatus(data.task_id);
        }, POLL_INTERVAL_MS);
      } catch (err) {
        if (!mountedRef.current) return;
        clearPolling();
        setError(
          err instanceof Error ? err.message : "Unknown error starting job",
        );
        setPhase("failed");
      }
    },
    [clearPolling, pollStatus],
  );

  // Cleanup on unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearPolling();
    };
  }, [clearPolling]);

  const isLoading =
    phase === "starting" || phase === "queued" || phase === "processing";

  return {
    generate,
    reset,
    phase,
    statusLabel: PHASE_LABELS[phase],
    isLoading,
    resultUrl,
    error,
    taskId,
  };
}
