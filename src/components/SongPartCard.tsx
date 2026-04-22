import { getPartStyle } from "../utils/songHelpers";

interface SongPartCardProps {
  type: string;
  content: string;
  label: string;
}

export function SongPartCard({ type, content, label }: SongPartCardProps) {
  const style = getPartStyle(type);

  return (
    <div
      className={`relative p-6 ${style.bg} ${style.border}`}
    >
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${
          type === "chorus"
            ? "absolute -top-3 left-6 py-1 text-white bg-purple-500/50 px-2 rounded-full"
            : type === "extra"
              ? "absolute -top-0 left-1 py-1 text-orange-500/50"
              : type === "bridge"
                ? "absolute -top-3 left-6 py-1 text-white bg-teal-500/50 px-2 rounded-full"
                : type === "intro" || type === "outro"
                  ? "absolute -top-3 left-6 py-1 text-white bg-slate-400"
                  : "absolute -top-0 left-1 py-1 text-black/20"
        }`}
      >
        {label}
      </span>
      <p
        className={`pt-2 text-lg leading-relaxed text-slate-800 whitespace-pre-line ${
          style.italic ? "italic" : ""
        }`}
      >
        {content}
      </p>
    </div>
  );
}