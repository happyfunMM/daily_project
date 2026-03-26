import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  currentFrame: number;
  fps: number;
  isPlaying: boolean;
  playbackSpeed: number;
}

export function VideoPlayer({ currentFrame, fps, isPlaying, playbackSpeed }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      const timeInSeconds = currentFrame / fps;
      videoRef.current.currentTime = timeInSeconds;
      videoRef.current.playbackRate = playbackSpeed;
      
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentFrame, fps, isPlaying, playbackSpeed]);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="max-w-full max-h-full"
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        muted
      />
      {/* <div className="absolute bottom-3 left-3 bg-slate-900/80 px-3 py-1.5 rounded text-xs text-slate-300">
        第三方视角视频
      </div> */}
    </div>
  );
}
