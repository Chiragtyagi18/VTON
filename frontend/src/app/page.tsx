"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

import { useVirtualTryOn, uploadImage } from "@/hooks/useVirtualTryOn";
import { newGarment, type GarmentItem } from "@/components/garment-uploader";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { HowItWorksSection } from "@/components/how-it-works";
import { UploadWorkspace } from "@/components/upload-workspace";
import { FeaturesSection } from "@/components/features-section";
import { ExamplesGallery } from "@/components/examples-gallery";
import { Footer } from "@/components/footer";

export default function Home() {
  const [userPhoto, setUserPhoto] = useState<{
    previewUrl: string | null;
    remoteUrl: string;
    uploading: boolean;
    uploadError: string | null;
  }>({ previewUrl: null, remoteUrl: "", uploading: false, uploadError: null });

  const [garment, setGarment] = useState<GarmentItem>(() => newGarment());

  const { generate, reset, phase, statusLabel, isLoading, resultUrl, error } =
    useVirtualTryOn();

  const workspaceRef = useRef<HTMLDivElement>(null);

  const celebratedRef = useRef(false);
  useEffect(() => {
    if (phase === "completed" && resultUrl && !celebratedRef.current) {
      celebratedRef.current = true;
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#06b6d4", "#8b5cf6", "#ec4899", "#6366f1"],
      });
    }
    if (phase !== "completed") celebratedRef.current = false;
  }, [phase, resultUrl]);

  const handleGarmentFile = useCallback(
    async (id: string, file: File) => {
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
    setUserPhoto((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { previewUrl: null, remoteUrl: "", uploading: false, uploadError: null };
    });
  }, []);

  const handleUserPhotoFile = useCallback(async (file: File) => {
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

  const scrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Navbar />
      <HeroSection onStartTryOn={scrollToWorkspace} />

      <div ref={workspaceRef}>
        <UploadWorkspace
          userPhoto={userPhoto}
          onUserPhotoUrlChange={(url) => setUserPhoto((prev) => ({ ...prev, remoteUrl: url }))}
          onUserPhotoFile={handleUserPhotoFile}
          onClearUserPhoto={clearUser}
          garment={garment}
          onGarmentFile={handleGarmentFile}
          onGarmentDescription={(id, value) => setGarment((prev) => ({ ...prev, description: value }))}
          onGarmentToggleBottom={(id, value) => setGarment((prev) => ({ ...prev, isBottom: value }))}
          canGenerate={canGenerate}
          isLoading={isLoading}
          onGenerate={handleGenerate}
          phase={phase}
          statusLabel={statusLabel}
          resultUrl={resultUrl}
          error={error}
          onReset={reset}
        />
      </div>

      <HowItWorksSection />
      <FeaturesSection />
      <ExamplesGallery />
      <Footer />
    </>
  );
}
