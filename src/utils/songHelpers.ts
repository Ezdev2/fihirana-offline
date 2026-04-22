// ─── Part type display ────────────────────────────────────────────────────────

/** Returns the Malagasy display name for a raw part type string. */
export function getPartTypeLabel(type: string): string {
  const t = (type ?? "").toLowerCase().trim();
  if (t === "verse") return "Toniny";
  if (t === "chorus") return "Ref.";
  if (t === "extra") return "Fanampiny";
  if (t === "bridge") return "Tetezana";
  if (t === "intro") return "Fampidirana";
  if (t === "outro") return "Famaranana";
  if (t === "pre-chorus" || t === "prechorus") return "Mialoha ny Ref.";
  if (t === "interlude") return "Fitsakoana";
  // Capitalise unknown types rather than show raw
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Given a list of parts, computes the numbered display label for each part.
 * - For types that appear only once: "Toniny", "Ref.", etc.
 * - For chorus that appears more than once: "Ref.", "Ref. 1", "Ref. 2" …
 *   (first occurrence keeps base label, subsequent ones are numbered)
 *   Actually: if there are multiple of the same type, ALL get numbered: 1, 2, 3…
 */
export function computePartLabels(
  parts: Array<{ type: string }>
): string[] {
  // Count how many times each type appears
  const counts: Record<string, number> = {};
  for (const p of parts) {
    const key = p.type.toLowerCase().trim();
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const seen: Record<string, number> = {};
  return parts.map((p) => {
    const key = p.type.toLowerCase().trim();
    const base = getPartTypeLabel(p.type);
    seen[key] = (seen[key] ?? 0) + 1;

    if (counts[key] === 1) {
      // Only one of this type — no number
      return base;
    }
    // Multiple of this type — show index
    return `${base} ${seen[key]}`;
  });
}

// ─── Part visual style ────────────────────────────────────────────────────────

export type PartStyle = {
  bg: string;
  border: string;
  labelColor: string;
  italic: boolean;
};

export function getPartStyle(type: string): PartStyle {
  const t = (type ?? "").toLowerCase().trim();
  if (t === "chorus") {
    return {
      bg: "bg-purple-50",
      border: "border-l-2 border-purple-400",
      labelColor: "text-purple-600",
      italic: true,
    };
  }
  if (t === "extra") {
    return {
      bg: "bg-orange-50",
      border: "",
      labelColor: "text-orange-600",
      italic: true,
    };
  }
  if (t === "bridge") {
    return {
      bg: "bg-teal-50",
      border: "",
      labelColor: "text-teal-600",
      italic: false,
    };
  }
  if (t === "intro" || t === "outro") {
    return {
      bg: "bg-slate-50",
      border: "border-l-2 border-slate-300",
      labelColor: "text-slate-500",
      italic: false,
    };
  }
  // verse + default
  return {
    bg: "bg-black/2",
    border: "",
    labelColor: "text-indigo-600",
    italic: false,
  };
}

// ─── Projection helpers ───────────────────────────────────────────────────────

const PROJECTION_LINES_PER_SLIDE = 5;

/**
 * Splits a part's content into slides for projection mode.
 * Lines are grouped into chunks of PROJECTION_LINES_PER_SLIDE.
 */
export function splitContentIntoSlides(content: string): string[] {
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  if (lines.length <= PROJECTION_LINES_PER_SLIDE) return [content];

  const slides: string[] = [];
  for (let i = 0; i < lines.length; i += PROJECTION_LINES_PER_SLIDE) {
    slides.push(lines.slice(i, i + PROJECTION_LINES_PER_SLIDE).join("\n"));
  }
  return slides;
}

export interface ProjectionSlide {
  label: string;
  content: string;
  partType: string;
  slideIndex: number; // 0-based within the part
  totalSlides: number; // total slides in this part
}

export function buildProjectionSlides(
  parts: Array<{ type: string; content: string; id: string }>,
  labels: string[]
): ProjectionSlide[] {
  const slides: ProjectionSlide[] = [];
  parts.forEach((part, idx) => {
    const chunks = splitContentIntoSlides(part.content);
    chunks.forEach((chunk, ci) => {
      slides.push({
        label: labels[idx],
        content: chunk,
        partType: part.type,
        slideIndex: ci,
        totalSlides: chunks.length,
      });
    });
  });
  return slides;
}

// ─── Structure helpers ────────────────────────────────────────────────────────

export interface StructureItem {
  id: string; // unique id for this slot (can be "partId-repeatIndex")
  partId: string;
  label: string;
}

/**
 * Build the default structure from the song parts (one slot per part, in order).
 */
export function buildDefaultStructure(
  parts: Array<{ id: string; type: string }>,
  labels: string[]
): StructureItem[] {
  return parts.map((p, i) => ({
    id: `${p.id}-0`,
    partId: p.id,
    label: labels[i],
  }));
}

/**
 * Serialize a structure to a compact string for deduplication comparison.
 */
export function serializeStructure(items: StructureItem[]): string {
  return items.map((s) => s.partId).join(",");
}