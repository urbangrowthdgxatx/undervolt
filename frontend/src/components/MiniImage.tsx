"use client";

import { useState, useEffect } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import type { ImageData } from "@/lib/chat-schema";

interface MiniImageProps {
  imageData: ImageData;
  onImageGenerated?: (imageUrl: string) => void;
}

export function MiniImage({ imageData, onImageGenerated }: MiniImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(imageData.imageUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have an image URL, don't regenerate
    if (imageUrl) return;

    // If we have a prompt but no image, generate one
    if (imageData.prompt && !imageUrl && !isLoading) {
      generateImage();
    }
  }, [imageData.prompt]);

  const generateImage = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imageData.prompt,
          style: imageData.style || "editorial",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setImageUrl(data.imageUrl);
      onImageGenerated?.(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="w-full h-[120px] bg-white/5 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <ImageIcon size={20} className="text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/30">Image unavailable</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-[120px] bg-white/5 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={20} className="text-white/40 mx-auto mb-2 animate-spin" />
          <p className="text-xs text-white/30">Generating illustration...</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="w-full rounded-lg overflow-hidden relative group">
      <img
        src={imageUrl}
        alt={imageData.prompt}
        className="w-full h-auto object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-[10px] text-white/50 italic">Illustration</p>
      </div>
    </div>
  );
}
