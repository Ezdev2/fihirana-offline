import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Heart,
  Monitor,
  LayoutList,
  ArrowUpRight,
  PlayCircle,
  Music,
} from "lucide-react";
import { SongPartCard } from "./SongPartCard";
import { ProjectionView } from "./ProjectionView";
import { StructureEditor } from "./StructureEditor";
import { LyricsImageDownloader } from "./LyricsImageDownloader";
import { computePartLabels } from "../utils/songHelpers";
import { useStructure } from "../hooks/useStructure";

interface Part {
  type: string;
  content: string;
  id: string;
}

interface Song {
  id: string;
  title: string;
  number: number;
  categories: string[];
  parts: Part[];
  playbackLink?: string;
  songLink?: string;
}

interface SongDetailViewProps {
  song: Song;
  isFavorite: boolean;
  isOnline: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
}

export function SongDetailView({
  song,
  isFavorite,
  isOnline,
  onClose,
  onToggleFavorite,
}: SongDetailViewProps) {
  const [showProjection, setShowProjection] = useState(false);
  const [showStructureEditor, setShowStructureEditor] = useState(false);
  const [isShrunk, setIsShrunk] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setIsShrunk(scrollContainerRef.current.scrollTop > 40);
      }
    };
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute Malagasy labels for each part (with numbering)
  const baseLabels = computePartLabels(song.parts);

  const {
    structureEnabled,
    toggleEnabled,
    items,
    moveItem,
    duplicateItem,
    removeItem,
    addItem,
    resetToDefault,
    effectiveParts,
    suggestedStructures,
    isFetchingSuggested,
    applyFromSuggested,
    shareStructure,
    shareStatus,
  } = useStructure(song.id, song.parts, baseLabels, isOnline);

  // Build the labels array for the effective (possibly reordered) parts
  const effectiveLabels = effectiveParts.map((ep) => ep.label);

  // Parts with full data for display
  const displayParts = effectiveParts
    .map((ep) => ep.part)
    .filter((p): p is Part => !!p);

  if (showProjection) {
    return (
      <ProjectionView
        songTitle={song.title}
        parts={displayParts}
        labels={effectiveLabels}
        onClose={() => setShowProjection(false)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50/80">
      {/* Header Dynamique */}
      <div
        className={`sticky top-0 z-20 bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md transition-all duration-300 ease-in-out ${
          isShrunk ? "px-4 py-3" : "px-6 pb-6 pt-12"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Titre réduit qui n'apparaît que si scrollé */}
            {isShrunk && (
              <h2 className="text-lg font-bold truncate max-w-[150px] animate-in fade-in slide-in-from-left-4">
                {song.title}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Boutons Vidéo/Audio en haut si ONLINE */}
            {isOnline && song.songLink && (
              <a
                href={song.songLink}
                target="_blank"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg animate-bounce-subtle"
              >
                <PlayCircle size={20} />
              </a>
            )}
            {isOnline && song.playbackLink && (
              <a
                href={song.playbackLink}
                target="_blank"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg"
              >
                <Music size={18} />
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowStructureEditor((v) => !v)}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition ${
                structureEnabled
                  ? "bg-white text-purple-600"
                  : "bg-white/20 text-white"
              }`}
            >
              <LayoutList size={18} />
            </button>

            <button
              type="button"
              onClick={() => setShowProjection(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md"
            >
              <Monitor size={18} />
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(song.id)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md"
            >
              <Heart size={18} className={isFavorite ? "fill-current" : ""} />
            </button>
          </div>
        </div>

        {/* Détails qui disparaissent au scroll */}
        <div
          className={`transition-all duration-300 overflow-hidden ${isShrunk ? "max-h-0 opacity-0 mt-0" : "max-h-40 opacity-100 mt-4"}`}
        >
          <span className="mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium tracking-wide">
            N° {song.number}
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{song.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {song.categories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-white/25 px-2.5 py-1 text-xs"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-2 py-6 pb-10 space-y-6"
      >
        {/* Structure editor panel */}
        {showStructureEditor && (
          <div className="space-y-3">
            {/* Enable/disable toggle */}
            <div className="flex items-center justify-between rounded-[24px] border border-white/70 bg-white/90 px-5 py-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Firafitry ny hira
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ampiharo ny fandaharana manokana
                </p>
              </div>
              <button
                type="button"
                onClick={toggleEnabled}
                className={`relative h-8 w-14 flex items-center rounded-full transition-colors duration-300 ${
                  structureEnabled ? "bg-purple-500" : "bg-slate-300"
                }`}
                aria-label="Ampiharo ny firafitra"
              >
                <span
                  className={`h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                    structureEnabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Editor */}
            <StructureEditor
              items={items}
              parts={song.parts}
              labels={baseLabels}
              suggestedStructures={suggestedStructures}
              isFetchingSuggested={isFetchingSuggested}
              shareStatus={shareStatus}
              isOnline={isOnline}
              onMove={moveItem}
              onDuplicate={duplicateItem}
              onRemove={removeItem}
              onAdd={addItem}
              onReset={resetToDefault}
              onShare={shareStructure}
              onApplySuggested={applyFromSuggested}
            />
          </div>
        )}

        {/* Song parts */}
        <div className="space-y-6">
          {displayParts.map((part, i) => (
            <SongPartCard
              key={structureEnabled ? effectiveParts[i]?.structureId : part.id}
              type={part.type}
              content={part.content}
              label={effectiveLabels[i]}
            />
          ))}
        </div>

        <hr className="text-gray-200" />

        {/* Links */}

        {!isOnline && (song.songLink || song.playbackLink) && (
          <div className="rounded-[28px] border border-white/70 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Rohy</h3>
            <div className="space-y-3">
              {song.songLink && (
                <div>
                  {/* <span className="text-sm font-medium text-slate-700">
                    Hira :
                  </span> */}
                  <a
                    href={song.songLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-1 items-center justify-between overflow-hidden rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span>{song.songLink}</span>
                    <ArrowUpRight className="text-gray-300" />
                  </a>
                </div>
              )}
              {song.playbackLink && (
                <div>
                  {/* <span className="text-sm font-medium text-slate-700">
                    Tononkira :
                  </span> */}
                  <a
                    href={song.playbackLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span>{song.playbackLink}</span>
                    <ArrowUpRight className="text-gray-300" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Download image */}
        <div className="rounded-[28px] border border-white/70 bg-white p-5">
          <p className="text-sm font-semibold text-slate-900 mb-1">
            Télécharger
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Zahao ny tononkira amin'ny sary PNG
          </p>
          <LyricsImageDownloader
            songTitle={song.title}
            songNumber={song.number}
            parts={displayParts}
            labels={effectiveLabels}
          />
        </div>
      </div>
    </div>
  );
}
