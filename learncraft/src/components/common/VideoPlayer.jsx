import { useState } from 'react';
import {
  Play,
  Maximize2,
  Minimize2,
  ExternalLink,
  Video as VideoIcon,
  AlertCircle
} from 'lucide-react';
import './VideoPlayer.css';

/**
 * Extracts video embed information from YouTube, Vimeo, or direct video URLs.
 */
export function parseVideoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // YouTube matchers:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  const ytRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const ytMatch = trimmed.match(ytRegex);

  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`,
      originalUrl: trimmed,
    };
  }

  // Vimeo matchers:
  // - https://vimeo.com/123456789
  // - https://player.vimeo.com/video/123456789
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i;
  const vimeoMatch = trimmed.match(vimeoRegex);

  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
      originalUrl: trimmed,
    };
  }

  // Direct MP4 / WebM / OGG files:
  if (/\.(mp4|webm|ogg)($|\?)/i.test(trimmed)) {
    return {
      provider: 'direct',
      videoSrc: trimmed,
      originalUrl: trimmed,
    };
  }

  // Generic fallback if URL has protocol
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      provider: 'external',
      originalUrl: trimmed,
    };
  }

  return null;
}

export default function VideoPlayer({ url, title }) {
  const [isTheatreMode, setIsTheatreMode] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const videoMeta = parseVideoUrl(url);

  if (!videoMeta) return null;

  return (
    <div className={`lc-video-wrapper ${isTheatreMode ? 'is-theatre' : ''}`}>
      <div className="lc-video-topbar">
        <div className="lc-video-badge">
          <VideoIcon size={14} />
          <span>Interactive Lecture</span>
        </div>
        <div className="lc-video-title-bar" title={title || 'Lesson Video'}>
          {title ? `Lecture: ${title}` : 'Video Lecture'}
        </div>
        <div className="lc-video-actions">
          <button
            type="button"
            className="lc-video-tool-btn"
            onClick={() => setIsTheatreMode((prev) => !prev)}
            title={isTheatreMode ? 'Exit Theatre Mode' : 'Theatre Mode'}
            aria-label={isTheatreMode ? 'Exit Theatre Mode' : 'Theatre Mode'}
          >
            {isTheatreMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isTheatreMode ? 'Standard' : 'Theatre'}</span>
          </button>
          <a
            href={videoMeta.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="lc-video-tool-btn"
            title="Open Video in New Tab"
            aria-label="Open Video in New Tab"
          >
            <ExternalLink size={15} />
            <span>Open</span>
          </a>
        </div>
      </div>

      <div className="lc-video-player-container">
        {videoMeta.provider === 'youtube' || videoMeta.provider === 'vimeo' ? (
          <iframe
            className="lc-video-iframe"
            src={videoMeta.embedUrl}
            title={title || 'Lecture video player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onError={() => setLoadError(true)}
          />
        ) : videoMeta.provider === 'direct' ? (
          <video
            className="lc-video-native"
            controls
            playsInline
            preload="metadata"
            onError={() => setLoadError(true)}
          >
            <source src={videoMeta.videoSrc} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="lc-video-fallback">
            <AlertCircle size={28} color="#f59e0b" />
            <p>External video stream attached.</p>
            <a
              href={videoMeta.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lc-video-external-btn"
            >
              <Play size={16} /> Open Lecture Link
            </a>
          </div>
        )}

        {loadError && (
          <div className="lc-video-fallback error">
            <AlertCircle size={28} color="#ef4444" />
            <p>Unable to embed this video stream.</p>
            <a
              href={videoMeta.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="lc-video-external-btn"
            >
              <ExternalLink size={16} /> Open externally
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
