import { useState, useEffect, useCallback } from "react";
import {
  StructureItem,
  buildDefaultStructure,
  serializeStructure,
} from "../utils/songHelpers";

const STRUCTURE_PREFIX = "fihirana-structure-";
const SUGGESTED_CACHE_KEY = "fihirana-suggested-structures";
const SUGGESTED_CACHE_TTL = 1000 * 60 * 60; // 1 hour

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuggestedStructure {
  songId: string;
  structure: string[]; // array of partIds
  author?: string;
  createdAt: string;
}

interface SuggestedCache {
  fetchedAt: number;
  data: SuggestedStructure[];
}

// ─── GitHub raw URL ───────────────────────────────────────────────────────────
// Point to the raw JSON file in your repo. Users can POST a PR via the API.
// For now we read from a static file; writing requires a GitHub token or PR flow.
const GITHUB_SUGGESTED_URL =
  "https://raw.githubusercontent.com/ezdev2/fihirana-offline/main/src/data/suggested-structures.json";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStructure(
  songId: string,
  parts: Array<{ id: string; type: string }>,
  labels: string[],
  isOnline: boolean
) {
  const storageKey = `${STRUCTURE_PREFIX}${songId}`;

  const [structureEnabled, setStructureEnabled] = useState(false);
  const [items, setItems] = useState<StructureItem[]>(() =>
    buildDefaultStructure(parts, labels)
  );
  const [suggestedStructures, setSuggestedStructures] = useState<
    SuggestedStructure[]
  >([]);
  const [isFetchingSuggested, setIsFetchingSuggested] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "uploading" | "done" | "exists" | "error"
  >("idle");

  // Load saved structure from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.enabled !== undefined) setStructureEnabled(parsed.enabled);
        if (Array.isArray(parsed.items) && parsed.items.length > 0) {
          setItems(parsed.items);
        } else {
          setItems(buildDefaultStructure(parts, labels));
        }
      } catch {
        setItems(buildDefaultStructure(parts, labels));
      }
    } else {
      setItems(buildDefaultStructure(parts, labels));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId]);

  // Auto-save structure to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ enabled: structureEnabled, items })
    );
  }, [storageKey, structureEnabled, items]);

  // Fetch suggested structures when online
  useEffect(() => {
    if (!isOnline) return;
    const cacheRaw = localStorage.getItem(SUGGESTED_CACHE_KEY);
    if (cacheRaw) {
      try {
        const cache: SuggestedCache = JSON.parse(cacheRaw);
        if (Date.now() - cache.fetchedAt < SUGGESTED_CACHE_TTL) {
          setSuggestedStructures(
            cache.data.filter((s) => s.songId === songId)
          );
          return;
        }
      } catch {
        // ignore
      }
    }

    setIsFetchingSuggested(true);
    fetch(GITHUB_SUGGESTED_URL)
      .then((r) => r.json())
      .then((data: SuggestedStructure[]) => {
        const cache: SuggestedCache = { fetchedAt: Date.now(), data };
        localStorage.setItem(SUGGESTED_CACHE_KEY, JSON.stringify(cache));
        setSuggestedStructures(data.filter((s) => s.songId === songId));
      })
      .catch(() => {
        // silently fail — offline graceful degradation
      })
      .finally(() => setIsFetchingSuggested(false));
  }, [isOnline, songId]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const toggleEnabled = useCallback(() => {
    setStructureEnabled((v) => !v);
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const duplicateItem = useCallback((index: number) => {
    setItems((prev) => {
      const next = [...prev];
      const original = next[index];
      const clone: StructureItem = {
        ...original,
        id: `${original.partId}-${Date.now()}`,
      };
      next.splice(index + 1, 0, clone);
      return next;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev; // keep at least one
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addItem = useCallback(
    (partId: string, label: string) => {
      setItems((prev) => [
        ...prev,
        { id: `${partId}-${Date.now()}`, partId, label },
      ]);
    },
    []
  );

  const resetToDefault = useCallback(() => {
    setItems(buildDefaultStructure(parts, labels));
  }, [parts, labels]);

  const applyFromSuggested = useCallback(
    (suggested: SuggestedStructure) => {
      const partMap = new Map(parts.map((p, i) => [p.id, labels[i]]));
      const newItems: StructureItem[] = suggested.structure
        .map((pid, idx) => ({
          id: `${pid}-${idx}`,
          partId: pid,
          label: partMap.get(pid) ?? pid,
        }))
        .filter((item) => partMap.has(item.partId));
      if (newItems.length > 0) setItems(newItems);
    },
    [parts, labels]
  );

  const shareStructure = useCallback(async () => {
    // Compare serialized current structure against all suggested ones for this song
    const currentSerial = serializeStructure(items);
    const defaultSerial = serializeStructure(
      buildDefaultStructure(parts, labels)
    );

    if (currentSerial === defaultSerial) {
      setShareStatus("exists");
      setTimeout(() => setShareStatus("idle"), 3000);
      return;
    }

    const alreadyExists = suggestedStructures.some(
      (s) => s.structure.join(",") === items.map((i) => i.partId).join(",")
    );
    if (alreadyExists) {
      setShareStatus("exists");
      setTimeout(() => setShareStatus("idle"), 3000);
      return;
    }

    // In a real implementation you'd open a GitHub PR or call a backend.
    // For now we show a message with instructions to submit a PR.
    setShareStatus("uploading");
    await new Promise((r) => setTimeout(r, 1200));
    setShareStatus("done");
    setTimeout(() => setShareStatus("idle"), 4000);
  }, [items, parts, labels, suggestedStructures]);

  // Effective parts to display (following structure order when enabled)
  const effectiveParts = structureEnabled
    ? items.map((item) => ({
        structureId: item.id,
        label: item.label,
        part: parts.find((p) => p.id === item.partId),
      }))
    : parts.map((p, i) => ({
        structureId: p.id,
        label: labels[i],
        part: p,
      }));

  return {
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
  };
}