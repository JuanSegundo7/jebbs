"use client";

import { useState, type ReactNode } from "react";
import Image, { type ImageProps } from "next/image";

interface FallbackImageProps extends Omit<ImageProps, "onError"> {
  fallback: ReactNode;
}

// Renders `fallback` instead of the browser's broken-image glyph + alt text
// when the photo fails to load. Resets when `src` changes.
export function FallbackImage({ fallback, src, ...props }: FallbackImageProps) {
  const [failedSrc, setFailedSrc] = useState<typeof src | null>(null);
  if (failedSrc === src) return <>{fallback}</>;
  return <Image src={src} onError={() => setFailedSrc(src)} {...props} />;
}
