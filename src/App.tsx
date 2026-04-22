import { useEffect, useMemo, useState } from "react";
import { songs as initialSongs } from "./data/songs";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import logo from "./assets/logo192.png";
import {
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Heart,
  Music,
  RefreshCw,
  Search,
  Sparkles,
  Wifi,
  WifiOff,
  GitBranch,
  Globe,
  Code,
} from "lucide-react";
import { SongDetailView } from "./components/SongDetailView";

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

type TabKey = "songs" | "search" | "favorites" | "updates";

const FAVORITES_STORAGE_KEY = "mihira-favorites";
const ONLINE_STORAGE_KEY = "mihira-online-mode";
const LAST_SYNC_STORAGE_KEY = "mihira-last-sync";
const REMOTE_URL_STORAGE_KEY = "mihira-remote-url";

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function formatSyncTime(value: string | null) {
  if (!value) return "Never synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never synced";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function App() {
  const getData = (): Song[] => {
    const saved = localStorage.getItem("fihirana_db_updated");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialSongs as Song[];
      }
    }
    return initialSongs as Song[];
  };

  const [songs] = useState<Song[]>(getData());
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("songs");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(
    "Version actuelle : 1.0.0",
  );
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [remoteUrl, setRemoteUrl] = useState<string>(
    "https://your-firebase-fetch-link-here",
  );

  useEffect(() => {
    const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const savedOnline = localStorage.getItem(ONLINE_STORAGE_KEY);
    const savedLastSync = localStorage.getItem(LAST_SYNC_STORAGE_KEY);
    const savedRemoteUrl = localStorage.getItem(REMOTE_URL_STORAGE_KEY);

    if (savedFavorites) {
      try {
        const parsed = JSON.parse(savedFavorites);
        if (Array.isArray(parsed)) setFavoriteIds(parsed);
      } catch {
        setFavoriteIds([]);
      }
    }
    if (savedOnline) setIsOnline(savedOnline === "true");
    if (savedLastSync) setLastSyncAt(savedLastSync);
    if (savedRemoteUrl) setRemoteUrl(savedRemoteUrl);
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem(ONLINE_STORAGE_KEY, String(isOnline));
  }, [isOnline]);

  useEffect(() => {
    localStorage.setItem(REMOTE_URL_STORAGE_KEY, remoteUrl);
  }, [remoteUrl]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    songs.forEach((song) =>
      song.categories.forEach((category) => cats.add(category)),
    );
    return ["All", ...Array.from(cats)];
  }, [songs]);

  const favoriteSongs = useMemo(
    () => songs.filter((song) => favoriteIds.includes(song.id)),
    [songs, favoriteIds],
  );

  const filteredSongs = useMemo(() => {
    const query = normalizeText(search);
    return songs.filter((song) => {
      const matchesCategory =
        selectedCategory === "All" ||
        song.categories.includes(selectedCategory);
      const matchesType =
        selectedType === "All" ||
        song.parts.some(
          (part) => normalizeText(part.type) === normalizeText(selectedType),
        );
      const matchesSearch =
        query.length === 0 ||
        normalizeText(song.title).includes(query) ||
        song.number.toString().includes(query) ||
        song.categories.some((category) =>
          normalizeText(category).includes(query),
        ) ||
        song.parts.some(
          (part) =>
            normalizeText(part.type).includes(query) ||
            normalizeText(part.content).includes(query),
        );
      return matchesCategory && matchesType && matchesSearch;
    });
  }, [songs, search, selectedCategory, selectedType]);

  const toggleFavorite = (songId: string) => {
    setFavoriteIds((current) =>
      current.includes(songId)
        ? current.filter((id) => id !== songId)
        : [...current, songId],
    );
  };

  const openSong = (song: Song) => setSelectedSong(song);
  const closeSong = () => setSelectedSong(null);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setSelectedSong(null);
  };

  // const handleFetchUpdate = () => {
  //   if (!isOnline) {
  //     setUpdateMessage('Turn on online mode first to fetch a new JSON from Firebase later.');
  //     return;
  //   }
  //   setIsUpdating(true);
  //   setUpdateMessage('Checking your remote song source...');
  //   window.setTimeout(() => {
  //     const syncTime = new Date().toISOString();
  //     setIsUpdating(false);
  //     setLastSyncAt(syncTime);
  //     localStorage.setItem(LAST_SYNC_STORAGE_KEY, syncTime);
  //     setUpdateMessage('Sync simulation complete. Replace the placeholder URL with your Firebase endpoint later.');
  //   }, 1600);
  // };

  const handleUpdate = async () => {
    setIsUpdating(true);
    setUpdateMessage("Connexion au serveur...");

    try {
      // 1. On récupère le JSON depuis un point d'accès (GitHub)
      const response = await fetch("https://ton-url.com/fihirana_export.json");

      if (!response.ok) throw new Error("Impossible de joindre le serveur");

      const freshSongs = await response.json();

      // 2. On sauvegarde dans le localStorage du téléphone
      localStorage.setItem("fihirana_db_updated", JSON.stringify(freshSongs));

      // 3. On met à jour l'UI
      setUpdateMessage("Mise à jour réussie ! Redémarrage...");

      setTimeout(() => {
        window.location.reload(); // Recharge l'app pour charger les nouveaux chants
      }, 1500);
    } catch (error) {
      console.error("Erreur:", error);
      setUpdateMessage("Erreur : Vérifiez votre connexion internet.");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderSongCard = (
    song: Song,
    variant: "default" | "compact" = "default",
  ) => {
    const isFavorite = favoriteIds.includes(song.id);
    return (
      <button
        key={song.id}
        type="button"
        onClick={() => openSong(song)}
        className={`w-full text-left bg-white/85 backdrop-blur-sm border border-white/70 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] ${
          variant === "compact" ? "rounded-2xl p-4" : "rounded-[24px] p-4"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 font-bold text-indigo-700 shadow-inner">
              {song.number}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {song.title}
              </h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {song.categories.slice(0, 2).map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              onClick={(event) => {
                event.stopPropagation();
                toggleFavorite(song.id);
              }}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                isFavorite
                  ? "border-rose-200 bg-rose-50 text-rose-500"
                  : "border-slate-200 bg-white text-slate-400"
              }`}
            >
              <Heart size={16} className={isFavorite ? "fill-current" : ""} />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </button>
    );
  };

  const renderSongsHome = () => (
    <>
      <div className="px-6 pb-4 pt-12">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-gradient-to-tr from-purple-600 to-fuchsia-400 text-white shadow-lg">
              <img
                src={logo}
                alt="Fihirana Logo"
                className="h-full w-full object-cover rounded-[16px]"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Jesosy Mpanafaka
              </p>
              <h1 className="text-xl font-bold text-slate-900">Fihirana</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOnline((current) => !current)}
            className={`flex items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold shadow-sm transition-all ${
              isOnline
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isOnline ? "En ligne" : "Hors ligne"}</span>
          </button>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="rounded-[30px] bg-gradient-to-br from-[#7C8DF7] via-[#B26CF6] to-[#E689D6] p-5 text-white shadow-lg shadow-purple-200/60">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-white/75">Hira rehetra</p>
              <h2 className="mt-1 text-2xl font-bold">{songs.length} isa</h2>
              <p className="mt-1 text-sm text-white/80">
                Miderà an'i Jehovah, fa tsara Izy; Eny, mandrakizay ny
                famindram-pony.
                <br />
                Salamo 118:29
              </p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <Music size={22} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-white/85 p-3 text-slate-900">
              <p className="text-xs text-slate-500">Sokajy</p>
              <p className="mt-1 text-lg font-bold">{categories.length - 1}</p>
            </div>
            <div className="rounded-[22px] bg-white/85 p-3 text-slate-900">
              <p className="text-xs text-slate-500">Hira tiako</p>
              <p className="mt-1 text-lg font-bold">{favoriteSongs.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-3">
        <button
          type="button"
          onClick={() => switchTab("search")}
          className="flex h-12 w-full items-center rounded-2xl border border-white/60 bg-white/85 pl-4 pr-3 text-left shadow-sm"
        >
          <Search size={18} className="mr-3 text-slate-400" />
          <span className="flex-1 text-sm text-slate-400">
            Hikaroka hira, lohateny, laharana, sokajy...
          </span>
          <Filter size={18} className="text-slate-400" />
        </button>
      </div>

      <div className="pb-3">
        <div className="mb-2 flex items-center justify-between px-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Sivana
          </h3>
          <span className="text-xs text-slate-400">Kitiho</span>
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-6 pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category);
                switchTab("search");
              }}
              className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-sm transition ${
                selectedCategory === category
                  ? "bg-purple-600 text-white"
                  : "border border-white/60 bg-white/80 text-slate-700"
              }`}
            >
              {category === "All" ? "Rehetra" : category}
            </button>
          ))}
        </div>
      </div>

      {isOnline && (
        <div className="px-6 pb-4">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 p-5 text-white shadow-lg shadow-purple-200">
            <div className="absolute -bottom-5 -right-3 opacity-20">
              <RefreshCw size={88} />
            </div>
            <div className="relative z-10">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                  Synchronisation disponible
                </span>
              </div>
              <h3 className="text-lg font-bold">
                Mettre à jour depuis le cloud
              </h3>
              <p className="mt-1 max-w-[85%] text-sm text-white/80">
                Votre application reste hors ligne dans un premier temps, mais
                vous pouvez récupérer un nouveau fichier JSON en cas de besoin.
              </p>
              <button
                type="button"
                onClick={() => switchTab("updates")}
                className="mt-4 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-purple-700 shadow-sm"
              >
                Faire un mise à jour
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Notsidihana farany
          </h3>
          <button
            type="button"
            onClick={() => switchTab("favorites")}
            className="text-xs font-semibold text-purple-600"
          >
            Hira tiako
          </button>
        </div>
        <div className="space-y-3">
          {songs.slice(0, 6).map((song) => renderSongCard(song))}
        </div>
      </div>
    </>
  );

  const renderSearchPage = () => (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-6 pb-4 pt-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Lisitry ny tononkira
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Hikaroka hira</h1>
          </div>
          <div className="rounded-2xl bg-white/80 p-3 shadow-sm">
            <Search size={20} className="text-purple-600" />
          </div>
        </div>
      </div>

      <div className="space-y-3 px-6 pb-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Hitady hira, lohateny, laharana, sokajy"
            className="h-12 w-full rounded-2xl border border-white/60 bg-white/85 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-purple-300 focus:bg-white"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Sokajy
          </p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === category
                    ? "bg-slate-900 text-white"
                    : "border border-white/60 bg-white/80 text-slate-700 shadow-sm"
                }`}
              >
                {category === "All" ? "Rehetra" : category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Valiny
          </h3>
          <span className="text-xs text-slate-400">
            {filteredSongs.length} hita
          </span>
        </div>
        {filteredSongs.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center shadow-sm">
            <Music size={42} className="mx-auto mb-3 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-700">
              No matching songs
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Try another search term, category, or part type.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSongs.map((song) => renderSongCard(song))}
          </div>
        )}
      </div>
    </div>
  );

  const renderFavoritesPage = () => (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-6 pb-4 pt-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Hors ligne
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Hira tiako</h1>
          </div>
          <div className="rounded-2xl bg-rose-50 p-3 shadow-sm">
            <Heart size={20} className="fill-current text-rose-500" />
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="rounded-[28px] bg-white/85 p-5 shadow-sm border border-white/70">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Hira tiako rehetra</p>
              <h2 className="mt-1 text-3xl font-bold text-slate-900">
                {favoriteSongs.length}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Miderà an'i Jehovah ry firenena rehetra; Miderà Azy, ry olona
                rehetra.
                <br />
                Salamo 117:1
              </p>
            </div>
            <div className="rounded-[22px] bg-gradient-to-br from-rose-400 to-pink-500 p-4 text-white shadow-md">
              <Heart size={22} className="fill-current" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        {favoriteSongs.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/70 px-6 py-12 text-center shadow-sm">
            <Heart size={42} className="mx-auto mb-3 text-slate-300" />
            <h3 className="text-sm font-semibold text-slate-700">
              Tsy misy hira
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Kitiho ny sary fo eo akaikin'ny lohatenin'ny hira tianao.
            </p>
            <button
              type="button"
              onClick={() => switchTab("songs")}
              className="mt-5 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
            >
              Hikaroka hira
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteSongs.map((song) => renderSongCard(song))}
          </div>
        )}
      </div>
    </div>
  );

  const renderUpdatesPage = () => (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-6 pb-4 pt-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Synchronisation
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Mise à jour</h1>
          </div>
          <div
            className={`rounded-2xl p-3 shadow-sm ${isOnline ? "bg-emerald-50" : "bg-slate-100"}`}
          >
            {isOnline ? (
              <Wifi size={20} className="text-emerald-600" />
            ) : (
              <WifiOff size={20} className="text-slate-500" />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 pb-28 overflow-y-auto">
        <div className="rounded-[30px] bg-gradient-to-br from-[#89A3FF] via-[#B98CFB] to-[#F1A3C7] p-5 text-white shadow-lg shadow-purple-200/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-white/75">Mode</p>
              <h2 className="mt-1 text-2xl font-bold">
                {isOnline ? "Synchronisation activée" : "Hors ligne activé"}
              </h2>
              <p className="mt-2 text-sm text-white/80">
                L'application fonctionne toujours hors ligne. Activez le mode en
                ligne uniquement lorsque vous souhaitez effectuer une mise à
                jour.
              </p>
            </div>
            <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
              <Download size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Mode en ligne
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Activez cette option lorsque vous souhaitez effectuer une mise à
                jour.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOnline((current) => !current)}
              className={`relative h-8 w-18 flex items-center rounded-full transition-colors duration-300 focus:outline-none ${
                isOnline ? "bg-emerald-500" : "bg-slate-300"
              }`}
              aria-label="Basculer en mode en ligne"
            >
              <span
                className={`h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  isOnline ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Firebase fetch URL placeholder</p>
          <p className="mt-1 text-sm text-slate-500">You can replace this later with your real database endpoint.</p>
          <input
            type="text"
            value={remoteUrl}
            onChange={(event) => setRemoteUrl(event.target.value)}
            className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition focus:border-purple-300 focus:bg-white"
          />
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Last sync: <span className="font-semibold text-slate-700">{formatSyncTime(lastSyncAt)}</span>
          </div>
        </div> */}

        <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Bibliothèque de mise à jour
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Ce bouton vous permet de mettre à jour l'application Fihirana.
          </p>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUpdating ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            <span>
              {isUpdating
                ? "Récupération de la nouvelle version..."
                : "Récupérer la nouvelle version"}
            </span>
          </button>
          <div className="mt-4 rounded-2xl border border-dashed border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
            {updateMessage}
          </div>
        </div>

        {/* <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            What happens now?
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-600">
                <Check size={14} />
              </span>
              <p>
                Your bundled song list stays available offline all the time.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-600">
                <Check size={14} />
              </span>
              <p>Favorites are saved in local storage on this device.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-600">
                <Check size={14} />
              </span>
              <p>The update page is ready for your future Firebase link.</p>
            </div>
          </div>
        </div> */}

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-purple-700">
              <Heart size={20} fill="currentColor" />
              <h2 className="text-lg font-bold">À propos du projet</h2>
            </div>
            <div className="space-y-5 text-sm leading-relaxed text-slate-700">
              <section>
                <p>
                  Cette application est dédiée à la communauté de l'église
                  <span className="font-semibold"> Jesosy Mpanafaka</span>. Elle
                  a pour but de faciliter l'accès aux chants (Fihirana) partout,
                  même sans connexion internet, pour glorifier Dieu en tout
                  lieu.
                </p>
              </section>
              <section className="rounded-2xl bg-slate-100/50 p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-1 text-slate-900 font-semibold">
                  <Code size={16} />
                  <span>Open Source</span>
                </div>
                <p className="text-xs">
                  Le projet est entièrement gratuit et open source. Vous pouvez
                  contribuer à l'amélioration des chants ou du code sur GitHub.
                </p>
                <a
                  href="https://github.com/ezdev2/fihirana-offline"
                  target="_blank"
                  className="mt-2 inline-flex items-center gap-2 font-medium text-purple-600 hover:underline"
                >
                  <GitBranch size={14} />
                  ezdev2/fihirana-offline
                </a>
              </section>
              <section className="pt-2 border-t border-slate-200/60">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">
                  Développeur & Maintenance
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    Ezra Fanomezantsoa
                  </span>
                  <a
                    href="https://ezrafanomezantsoa.site"
                    target="_blank"
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                  >
                    <Globe size={14} />
                    <span className="text-xs">ezrafanomezantsoa.site</span>
                  </a>
                </div>
                <p className="mt-3 text-xs italic">
                  Remerciements particuliers à tous ceux qui soutiennent l'œuvre
                  et contribuent à la numérisation des chants.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActivePage = () => {
    switch (activeTab) {
      case "search":
        return renderSearchPage();
      case "favorites":
        return renderFavoritesPage();
      case "updates":
        return renderUpdatesPage();
      case "songs":
      default:
        return renderSongsHome();
    }
  };

  const navItems: Array<{
    key: TabKey;
    label: string;
    icon: typeof BookOpen;
    badge?: boolean;
  }> = [
    { key: "songs", label: "Hira", icon: BookOpen },
    { key: "search", label: "Hikaroka", icon: Search },
    { key: "favorites", label: "Tiako", icon: Heart },
    { key: "updates", label: "Mise à jour", icon: Wifi, badge: isOnline },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#E2E8F0] via-[#F3E8FF] to-[#E0F2FE] p-0 font-sans antialiased md:p-6">
      <div className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-white/60 backdrop-blur-xl transition-all duration-300 md:h-[850px] md:rounded-[45px] md:border-[8px] md:border-white md:shadow-2xl">
        {selectedSong ? (
          <SongDetailView
            song={selectedSong}
            isFavorite={favoriteIds.includes(selectedSong.id)}
            isOnline={isOnline}
            onClose={closeSong}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          renderActivePage()
        )}

        {!selectedSong && (
          <div className="absolute bottom-5 left-5 right-5 z-20 rounded-[30px] border border-white/60 bg-white/88 px-3 py-2 shadow-lg backdrop-blur-md">
            <div className="grid grid-cols-4 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => switchTab(item.key)}
                    className={`relative flex flex-col items-center justify-center rounded-[22px] px-2 py-2.5 transition ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-400"
                    }`}
                  >
                    {item.badge && !isActive && (
                      <span className="absolute right-5 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    )}
                    <Icon
                      size={19}
                      className={
                        item.key === "favorites" && favoriteSongs.length > 0
                          ? "fill-current"
                          : ""
                      }
                    />
                    <span className="mt-1 text-[10px] font-semibold">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
