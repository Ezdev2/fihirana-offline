import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { buildProjectionSlides, getPartStyle } from "../utils/songHelpers";

interface Part {
  id: string;
  type: string;
  content: string;
}

interface ProjectionViewProps {
  songTitle: string;
  parts: Part[];
  labels: string[];
  onClose: () => void;
}

export function ProjectionView({
  songTitle,
  parts,
  labels,
  onClose,
}: ProjectionViewProps) {
  const slides = buildProjectionSlides(parts, labels);
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const prev = useCallback(() => {
    setCurrent((c) => Math.max(0, c - 1));
  }, []);

  const next = useCallback(() => {
    setCurrent((c) => Math.min(slides.length - 1, c + 1));
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const slide = slides[current];
  if (!slide) return null;

  // Determine text size based on content length
  const charCount = slide.content.length;
  const textSizeClass =
    charCount > 200
      ? "text-2xl"
      : charCount > 100
        ? "text-3xl"
        : "text-4xl";

  const isChorus = slide.partType === "chorus";
  const isExtra = slide.partType === "extra";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <X size={18} />
          </button>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest">
              Projection
            </p>
            <p className="text-sm font-semibold">{songTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">
            {current + 1} / {slides.length}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition"
            title="Plein écran (F)"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Main slide area */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 py-6 cursor-pointer"
        onClick={next}
      >
        {/* Part label badge */}
        <div className="mb-8 flex items-center gap-2">
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-widest ${
              isChorus
                ? "bg-purple-600/80 text-purple-100"
                : isExtra
                  ? "bg-orange-600/80 text-orange-100"
                  : "bg-indigo-600/80 text-indigo-100"
            }`}
          >
            {slide.label}
            {slide.totalSlides > 1 && (
              <span className="ml-2 text-xs opacity-60">
                ({slide.slideIndex + 1}/{slide.totalSlides})
              </span>
            )}
          </span>
        </div>

        {/* Lyrics */}
        <p
          className={`text-center font-medium leading-relaxed whitespace-pre-line max-w-3xl ${textSizeClass} ${
            isChorus ? "italic text-purple-100" : "text-white"
          }`}
        >
          {slide.content}
        </p>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-6 py-5 bg-slate-900/80 backdrop-blur-sm">
        <button
          type="button"
          onClick={prev}
          disabled={current === 0}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Slide dots (max 12 shown) */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-xs">
          {slides.slice(0, 12).map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrent(i);
              }}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-6 h-2 bg-white"
                  : "w-2 h-2 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
          {slides.length > 12 && (
            <span className="text-xs text-white/40 ml-1">
              +{slides.length - 12}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={next}
          disabled={current === slides.length - 1}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-20 right-6 text-[10px] text-white/20">
        ← → espace · F plein écran · Échap fermer
      </div>
    </div>
  );
}