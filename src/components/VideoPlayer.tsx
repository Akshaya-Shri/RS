"use client";

import React, { useEffect, useRef } from "react";

type VideoPlayerProps = {
  src: string;
  poster?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export default function VideoPlayer({
  src,
  poster,
  controls = false,
  autoPlay = true,
  muted = false,
  loop = false,
  className,
  style,
}: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    v.muted = muted;

    const tryPlay = () => {
      v.play().catch(() => {});
    };

    if (autoPlay) tryPlay();

    // Prevent pause by attempting to replay when paused
    const onPause = () => {
      tryPlay();
    };

    v.addEventListener("pause", onPause);

    return () => {
      v.removeEventListener("pause", onPause);
    };
  }, [autoPlay, muted]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      preload="metadata"
      className={className}
      style={style}
    />
  );
}
