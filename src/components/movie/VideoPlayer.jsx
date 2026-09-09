import { useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";

import {
  updateWatchingProgress,
} from "../../store/continueWatchingSlice";

import "./VideoPlayer.css";

function VideoPlayer({
  src,
  poster,
  movie,
  startTime = 0,
}) {
  const videoRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleLoadedMetadata = () => {
      if (startTime > 0) {
        video.currentTime = startTime;
      }
    };

    video.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    return () => {
      video.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );
    };
  }, [startTime]);

  const saveProgress = useCallback(() => {
    const video = videoRef.current;

    if (!video || !movie) return;

    if (
      video.duration &&
      video.currentTime > 5
    ) {
      dispatch(
        updateWatchingProgress({
          movie,
          currentTime: video.currentTime,
          duration: video.duration,
        })
      );
    }
  }, [dispatch, movie]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleTimeUpdate = () => {
      if (
        Math.floor(video.currentTime) % 5 === 0 &&
        video.currentTime > 0
      ) {
        saveProgress();
      }
    };

    video.addEventListener(
      "timeupdate",
      handleTimeUpdate
    );

    return () => {
      video.removeEventListener(
        "timeupdate",
        handleTimeUpdate
      );
    };
  }, [saveProgress]);

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        className="video"
        controls
        poster={poster}
        onPause={saveProgress}
      >
        <source
          src={src}
          type="video/mp4"
        />

        Trình duyệt của bạn không hỗ trợ video.
      </video>
    </div>
  );
}

export default VideoPlayer;