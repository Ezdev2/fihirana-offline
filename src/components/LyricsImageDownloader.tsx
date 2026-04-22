import { useRef } from "react";
import { Download } from "lucide-react";

interface Part {
  id: string;
  type: string;
  content: string;
}

interface LyricsImageDownloaderProps {
  songTitle: string;
  songNumber: number;
  parts: Part[];
  labels: string[];
}

// Color map for part types
const PART_COLORS: Record<
  string,
  { bg: string; accent: string; label: string }
> = {
  chorus: { bg: "#F5F0FF", accent: "#7C3AED", label: "#7C3AED" },
  extra: { bg: "#FFF7ED", accent: "#EA580C", label: "#EA580C" },
  bridge: { bg: "#F0FDFA", accent: "#0D9488", label: "#0D9488" },
  default: { bg: "#EEF2FF", accent: "#4F46E5", label: "#4F46E5" },
};

function getColor(type: string) {
  return PART_COLORS[type.toLowerCase()] ?? PART_COLORS.default;
}

export function LyricsImageDownloader({
  songTitle,
  songNumber,
  parts,
  labels,
}: LyricsImageDownloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 900;
    const PADDING = 48;
    const PART_MARGIN = 24;
    const LINE_HEIGHT = 32;
    const LABEL_HEIGHT = 28;
    const PART_PADDING = 24;

    // Measure total height needed
    let totalHeight = 120; // header
    for (const part of parts) {
      const lines = part.content
        .split("\n")
        .filter((l) => l.trim().length > 0);
      totalHeight +=
        PART_PADDING * 2 + LABEL_HEIGHT + lines.length * LINE_HEIGHT + PART_MARGIN;
    }
    totalHeight += PADDING;

    canvas.width = W;
    canvas.height = totalHeight;

    // Background
    ctx.fillStyle = "#F8F6FF";
    ctx.fillRect(0, 0, W, totalHeight);

    // Header gradient effect (flat color)
    ctx.fillStyle = "#7C3AED";
    ctx.fillRect(0, 0, W, 90);

    // Song number badge
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.roundRect(PADDING, 20, 50, 50, 14);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${songNumber}`, PADDING + 25, 52);

    // Song title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(songTitle, PADDING + 64, 54);

    // Subtitle
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText("Jesosy Mpanafaka · Fihirana", PADDING + 64, 76);

    // Parts
    let y = 110;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const label = labels[i];
      const lines = part.content
        .split("\n")
        .filter((l) => l.trim().length > 0);
      const colors = getColor(part.type);

      const partHeight =
        PART_PADDING * 2 + LABEL_HEIGHT + lines.length * LINE_HEIGHT;

      // Part card background
      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.roundRect(PADDING, y, W - PADDING * 2, partHeight, 20);
      ctx.fill();

      // Left accent bar
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.roundRect(PADDING, y, 5, partHeight, [0, 3, 3, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = colors.label;
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        label.toUpperCase(),
        PADDING + PART_PADDING,
        y + PART_PADDING + 14
      );

      // Lyrics
      const isItalic = part.type === "chorus" || part.type === "extra";
      ctx.fillStyle = "#1E293B";
      ctx.font = `${isItalic ? "italic " : ""}18px system-ui, sans-serif`;

      lines.forEach((line, li) => {
        ctx.fillText(
          line,
          PADDING + PART_PADDING,
          y + PART_PADDING + LABEL_HEIGHT + li * LINE_HEIGHT + 4
        );
      });

      y += partHeight + PART_MARGIN;
    }

    // Footer
    ctx.fillStyle = "#94A3B8";
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "Fihirana — Jesosy Mpanafaka",
      W / 2,
      totalHeight - 16
    );

    // Download
    const link = document.createElement("a");
    link.download = `fihirana-${songNumber}-${songTitle
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <button
        type="button"
        onClick={downloadImage}
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition active:scale-95"
      >
        <Download size={16} className="text-slate-500" />
        <span>Lyrics Image (PNG)</span>
      </button>
    </>
  );
}