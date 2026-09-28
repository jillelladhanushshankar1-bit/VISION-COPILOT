import React, { useRef, useEffect } from 'react';
import { CameraFacing } from '../types';

interface LiveVideoViewportProps {
  stream: MediaStream | null;
  cameraFacing: CameraFacing;
  fallbackImage: string;
  fallbackAlt: string;
  className?: string;
}

export const LiveVideoViewport: React.FC<LiveVideoViewportProps> = ({
  stream,
  cameraFacing,
  fallbackImage,
  fallbackAlt,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch((err) => {
        console.warn('Auto-play live video preview was prevented:', err);
      });
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  if (stream) {
    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label="Live camera feed"
        className={`w-full h-full object-cover transition-transform duration-300 ${
          cameraFacing === 'front' ? 'scale-x-[-1]' : ''
        } ${className}`}
      />
    );
  }

  return (
    <img
      src={fallbackImage}
      alt={fallbackAlt}
      referrerPolicy="no-referrer"
      className={`w-full h-full object-cover transition-transform duration-300 opacity-100 ${className}`}
      style={{ opacity: 1, mixBlendMode: 'normal' }}
    />
  );
};
