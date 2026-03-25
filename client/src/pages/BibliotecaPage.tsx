/**
 * FAMP Academy — Biblioteca de Videoaulas
 * Design: "Command Center" — Dark theme com cards de vídeo, filtros por disciplina e tema,
 * playlists de professor por período, avaliação com estrelas e comentários.
 * Player YouTube embedado.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Search, Play, Clock, ChevronLeft, X, Star, Eye, BookOpen,
  Filter, MessageSquare, ChevronDown, ChevronUp, List, ThumbsUp
} from 'lucide-react';
import videosData from '@/data/videos.json';

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  professor: string;
  duration: number;
  grandeArea: string;
  especialidade: string;
  tema: string;
}

interface Trilha {
  id: string;
  titulo: string;
  descricao: string;
  duracao: number;
  videos: string[];
  ordem: number;
  icone: string;
}

interface WatchProgress {
  videoId: string;
  progress: number;
  lastWatched: string;
}

interface VideoRating {
  videoId: string;
  rating: number; // 1-5
  comment: string;
  date: string;
}

interface Playlist {
  id: string;
  nome: string;
  descricao: string;
  periodo: number;
  professor: string;
  videos: string[];
  createdAt: string;
}

// ─── STORAGE KEYS ───
const PROGRESS_KEY = 'famp-video-progress';
const RATINGS_KEY = 'famp-video-ratings';
const PLAYLISTS_KEY = 'famp-playlists';

// ─── PROGRESS HELPERS ───
function getProgress(): WatchProgress[] {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]'); }
  catch { return []; }
}
function saveProgress(data: WatchProgress[]) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}
function updateVideoProgress(videoId: string, progress: number) {
  const all = getProgress();
  const idx = all.findIndex(p => p.videoId === videoId);
  const entry: WatchProgress = { videoId, progress, lastWatched: new Date().toISOString() };
  if (idx >= 0) all[idx] = entry; else all.push(entry);
  saveProgress(all);
}

// ─── RATINGS HELPERS ───
function getRatings(): VideoRating[] {
  try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || '[]'); }
  catch { return []; }
}
function saveRating(rating: VideoRating) {
  const all = getRatings();
  const idx = all.findIndex(r => r.videoId === rating.videoId);
  if (idx >= 0) all[idx] = rating; else all.push(rating);
  localStorage.setItem(RATINGS_KEY, JSON.stringify(all));
}

// ─── PLAYLISTS HELPERS ───
function getPlaylists(): Playlist[] {
  try { return JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || '[]'); }
  catch { return []; }
}
function savePlaylists(data: Playlist[]) {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(data));
}

// ─── UTILS ───
function formatDuration(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${min} min`;
}

function getThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

// ─── CONSTANTS ───
const PERIODOS = [1, 2, 3, 4, 5, 6, 7, 8];

const allVideos: Video[] = (videosData as any).videos || [];
const allTrilhas: Trilha[] = (videosData as any).trilhas || [];

const AREAS = ['Todos', ...Array.from(new Set(allVideos.map(v => v.grandeArea))).sort()];
const ESPECIALIDADES = ['Todas', ...Array.from(new Set(allVideos.map(v => v.especialidade))).sort()];
const TEMAS = ['Todos', ...Array.from(new Set(allVideos.map(v => v.tema).filter(Boolean))).sort()];

// ─── STAR RATING COMPONENT ───
function StarRating({ value, onChange, size = 'md', readonly = false }: {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md';
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
        >
          <Star
            className={`${sz} ${
              i <= (hover || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-muted-foreground/30'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───
// ═══════════════════════════════════════════════════════
export default function BibliotecaPage() {
  const [videos] = useState<Video[]>(allVideos);
  const [trilhas] = useState<Trilha[]>(allTrilhas);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todos');
  const [selectedEspecialidade, setSelectedEspecialidade] = useState('Todas');
  const [selectedTema, setSelectedTema] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, WatchProgress>>({});
  const [ratingsMap, setRatingsMap] = useState<Record<string, VideoRating>>({});
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalogo' | 'trilhas' | 'playlists'>('catalogo');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  // Load data on mount
  useEffect(() => {
    const allP = getProgress();
    const map: Record<string, WatchProgress> = {};
    allP.forEach(p => { map[p.videoId] = p; });
    setProgressMap(map);

    const allR = getRatings();
    const rMap: Record<string, VideoRating> = {};
    allR.forEach(r => { rMap[r.videoId] = r; });
    setRatingsMap(rMap);

    setPlaylists(getPlaylists());
  }, []);

  const refreshProgress = useCallback(() => {
    const allP = getProgress();
    const map: Record<string, WatchProgress> = {};
    allP.forEach(p => { map[p.videoId] = p; });
    setProgressMap(map);
  }, []);

  const refreshRatings = useCallback(() => {
    const allR = getRatings();
    const rMap: Record<string, VideoRating> = {};
    allR.forEach(r => { rMap[r.videoId] = r; });
    setRatingsMap(rMap);
  }, []);

  // Dynamic especialidades based on selected area
  const filteredEspecialidades = useMemo(() => {
    if (selectedArea === 'Todos') return ESPECIALIDADES;
    const esps = Array.from(new Set(videos.filter(v => v.grandeArea === selectedArea).map(v => v.especialidade))).sort();
    return ['Todas', ...esps];
  }, [videos, selectedArea]);

  // Dynamic temas based on selected especialidade
  const filteredTemas = useMemo(() => {
    let base = videos;
    if (selectedArea !== 'Todos') base = base.filter(v => v.grandeArea === selectedArea);
    if (selectedEspecialidade !== 'Todas') base = base.filter(v => v.especialidade === selectedEspecialidade);
    const temas = Array.from(new Set(base.map(v => v.tema).filter(Boolean))).sort();
    return ['Todos', ...temas];
  }, [videos, selectedArea, selectedEspecialidade]);

  // Filtered videos
  const filtered = useMemo(() => {
    return videos.filter(v => {
      const matchArea = selectedArea === 'Todos' || v.grandeArea === selectedArea;
      const matchEsp = selectedEspecialidade === 'Todas' || v.especialidade === selectedEspecialidade;
      const matchTema = selectedTema === 'Todos' || v.tema === selectedTema;
      const matchSearch = !search ||
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.professor.toLowerCase().includes(search.toLowerCase()) ||
        v.especialidade.toLowerCase().includes(search.toLowerCase()) ||
        v.tema.toLowerCase().includes(search.toLowerCase());
      return matchArea && matchEsp && matchTema && matchSearch;
    });
  }, [videos, selectedArea, selectedEspecialidade, selectedTema, search]);

  // Continue watching
  const continueWatching = useMemo(() => {
    return videos
      .filter(v => progressMap[v.id] && progressMap[v.id].progress > 0 && progressMap[v.id].progress < 100)
      .sort((a, b) => new Date(progressMap[b.id].lastWatched).getTime() - new Date(progressMap[a.id].lastWatched).getTime());
  }, [videos, progressMap]);

  // Recommended
  const recommended = useMemo(() => {
    const notStarted = videos.filter(v => !progressMap[v.id] || progressMap[v.id].progress === 0);
    const shuffled = [...notStarted].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [videos, progressMap]);

  // Stats
  const stats = useMemo(() => {
    const watched = Object.values(progressMap).filter(p => p.progress === 100).length;
    const inProgress = Object.values(progressMap).filter(p => p.progress > 0 && p.progress < 100).length;
    const totalMinutes = videos.reduce((acc, v) => acc + v.duration, 0);
    return { total: videos.length, watched, inProgress, totalMinutes };
  }, [videos, progressMap]);

  const handlePlayVideo = (video: Video) => {
    setSelectedVideo(video);
    if (!progressMap[video.id]) {
      updateVideoProgress(video.id, 5);
      refreshProgress();
    }
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
    refreshProgress();
    refreshRatings();
  };

  const handleMarkComplete = (videoId: string) => {
    updateVideoProgress(videoId, 100);
    refreshProgress();
  };

  const handleSaveRating = (videoId: string, rating: number, comment: string) => {
    saveRating({ videoId, rating, comment, date: new Date().toISOString() });
    refreshRatings();
  };

  const handleCreatePlaylist = (playlist: Omit<Playlist, 'id' | 'createdAt'>) => {
    const newPlaylist: Playlist = {
      ...playlist,
      id: `pl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...playlists, newPlaylist];
    savePlaylists(updated);
    setPlaylists(updated);
    setShowPlaylistModal(false);
  };

  const handleDeletePlaylist = (id: string) => {
    const updated = playlists.filter(p => p.id !== id);
    savePlaylists(updated);
    setPlaylists(updated);
    setSelectedPlaylist(null);
  };

  const clearFilters = () => {
    setSelectedArea('Todos');
    setSelectedEspecialidade('Todas');
    setSelectedTema('Todos');
    setSearch('');
  };

  const hasActiveFilters = selectedArea !== 'Todos' || selectedEspecialidade !== 'Todas' || selectedTema !== 'Todos' || search !== '';

  // ═══════════════════════════════════════════════════════
  // ─── VIDEO PLAYER VIEW ───
  // ═══════════════════════════════════════════════════════
  if (selectedVideo) {
    return (
      <VideoPlayerView
        video={selectedVideo}
        videos={videos}
        progressMap={progressMap}
        ratingsMap={ratingsMap}
        onClose={handleClosePlayer}
        onMarkComplete={handleMarkComplete}
        onSaveRating={handleSaveRating}
        onPlayVideo={handlePlayVideo}
      />
    );
  }

  // ═══════════════════════════════════════════════════════
  // ─── PLAYLIST DETAIL VIEW ───
  // ═══════════════════════════════════════════════════════
  if (selectedPlaylist) {
    const plVideos = selectedPlaylist.videos.map(vid => videos.find(v => v.id === vid)).filter(Boolean) as Video[];
    const plProgress = plVideos.length > 0
      ? plVideos.reduce((sum, v) => sum + (progressMap[v.id]?.progress || 0), 0) / plVideos.length
      : 0;

    return (
      <DashboardLayout title="FAMP Library" subtitle={selectedPlaylist.nome}>
        <div className="p-6 max-w-[1200px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {selectedPlaylist.periodo}º Período
                </span>
                <h1 className="text-xl font-bold mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {selectedPlaylist.nome}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{selectedPlaylist.descricao}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Por {selectedPlaylist.professor} · {plVideos.length} vídeos · {formatDuration(plVideos.reduce((s, v) => s + v.duration, 0))}
                </p>
              </div>
              <button
                onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-md border border-red-500/20 hover:bg-red-500/10"
              >
                Excluir Playlist
              </button>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso da Playlist</span>
                <span>{Math.round(plProgress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${plProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Video List */}
          <div className="space-y-2">
            {plVideos.map((video, idx) => {
              const prog = progressMap[video.id];
              const isComplete = prog?.progress === 100;
              return (
                <button
                  key={video.id}
                  onClick={() => handlePlayVideo(video)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/30 hover:bg-muted/40 transition-all text-left group"
                >
                  <span className="text-sm font-mono text-muted-foreground w-6 text-center shrink-0">
                    {isComplete ? '✓' : idx + 1}
                  </span>
                  <div className="relative w-24 h-14 rounded overflow-hidden shrink-0 bg-muted">
                    <img src={getThumbnail(video.youtubeId)} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isComplete ? 'text-muted-foreground line-through' : ''}`}>
                      {video.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{video.professor} · {formatDuration(video.duration)}</p>
                  </div>
                  {ratingsMap[video.id] && (
                    <div className="shrink-0">
                      <StarRating value={ratingsMap[video.id].rating} readonly size="sm" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ─── LIBRARY CATALOG VIEW ───
  // ═══════════════════════════════════════════════════════
  return (
    <DashboardLayout title="FAMP Library" subtitle="Biblioteca de Videoaulas">
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Biblioteca de Videoaulas
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} videoaulas · {formatDuration(stats.totalMinutes)} de conteúdo
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar videoaulas, professores, temas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          {[
            { key: 'catalogo' as const, label: 'Catálogo', icon: BookOpen },
            { key: 'trilhas' as const, label: 'Trilhas', icon: List },
            { key: 'playlists' as const, label: 'Playlists do Professor', icon: ThumbsUp },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── TAB: CATÁLOGO ─── */}
        {activeTab === 'catalogo' && (
          <>
            {/* Filters Row */}
            <div className="space-y-3">
              {/* Area pills */}
              <div className="flex flex-wrap gap-2">
                {AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => {
                      setSelectedArea(area);
                      setSelectedEspecialidade('Todas');
                      setSelectedTema('Todos');
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedArea === area
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/50'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                Filtros avançados
                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {hasActiveFilters && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
                )}
              </button>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="flex flex-wrap gap-3 p-4 rounded-lg bg-muted/20 border border-border/50">
                  <div className="min-w-[180px]">
                    <label className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1 block">
                      Especialidade
                    </label>
                    <select
                      value={selectedEspecialidade}
                      onChange={e => { setSelectedEspecialidade(e.target.value); setSelectedTema('Todos'); }}
                      className="w-full h-8 px-2 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {filteredEspecialidades.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="min-w-[180px]">
                    <label className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1 block">
                      Tema da Aula
                    </label>
                    <select
                      value={selectedTema}
                      onChange={e => setSelectedTema(e.target.value)}
                      className="w-full h-8 px-2 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {filteredTemas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="self-end h-8 px-3 rounded-md text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/10 transition-colors"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">Total</span>
                </div>
                <p className="text-lg font-bold font-mono">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">Assistidos</span>
                </div>
                <p className="text-lg font-bold font-mono text-green-400">{stats.watched}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Play className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">Em Progresso</span>
                </div>
                <p className="text-lg font-bold font-mono text-amber-400">{stats.inProgress}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase tracking-wider font-medium">Duração Total</span>
                </div>
                <p className="text-lg font-bold font-mono">{formatDuration(stats.totalMinutes)}</p>
              </div>
            </div>

            {/* Continue Watching */}
            {continueWatching.length > 0 && !hasActiveFilters && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                  <Play className="w-5 h-5 text-primary" />
                  Continuar Assistindo
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {continueWatching.slice(0, 2).map(video => {
                    const prog = progressMap[video.id];
                    return (
                      <button
                        key={video.id}
                        onClick={() => handlePlayVideo(video)}
                        className="relative group rounded-xl overflow-hidden bg-muted/30 border border-border/50 hover:border-primary/30 transition-all text-left"
                      >
                        <div className="relative h-44">
                          <img src={getThumbnail(video.youtubeId)} alt={video.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                              <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute top-3 right-3 text-xs font-mono bg-black/70 text-white px-2 py-0.5 rounded">
                            {formatDuration(video.duration)}
                          </span>
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-bold text-base">{video.title}</h3>
                            <p className="text-white/70 text-xs mt-0.5">{video.professor}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${prog?.progress || 0}%` }} />
                              </div>
                              <span className="text-white/60 text-[10px] font-mono">{prog?.progress || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recommended */}
            {recommended.length > 0 && !hasActiveFilters && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                  <Star className="w-5 h-5 text-amber-400" />
                  Trilha Recomendada para Hoje
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {recommended.map(video => (
                    <button
                      key={video.id}
                      onClick={() => handlePlayVideo(video)}
                      className="group rounded-lg overflow-hidden bg-muted/30 border border-border/50 hover:border-primary/30 transition-all text-left"
                    >
                      <div className="relative h-28">
                        <img src={getThumbnail(video.youtubeId)} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono bg-black/70 text-white px-1.5 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </span>
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          Novo
                        </span>
                      </div>
                      <div className="p-2.5">
                        <h3 className="text-sm font-medium truncate">{video.title}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{video.professor}</p>
                        <p className="text-[10px] text-primary/70 mt-1">{video.especialidade}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Full Catalog */}
            <section>
              <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                {hasActiveFilters ? `Resultados (${filtered.length})` : 'Todas as Videoaulas'}
              </h2>
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma videoaula encontrada.</p>
                  <p className="text-xs mt-1">Tente ajustar os filtros ou a busca.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map(video => {
                    const prog = progressMap[video.id];
                    const isComplete = prog?.progress === 100;
                    const rating = ratingsMap[video.id];
                    return (
                      <button
                        key={video.id}
                        onClick={() => handlePlayVideo(video)}
                        className="group rounded-lg overflow-hidden bg-muted/20 border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
                      >
                        <div className="relative h-36">
                          <img src={getThumbnail(video.youtubeId)} alt={video.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono bg-black/70 text-white px-1.5 py-0.5 rounded">
                            {formatDuration(video.duration)}
                          </span>
                          {isComplete && (
                            <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-green-500/90 text-white px-1.5 py-0.5 rounded">
                              ✓ Concluído
                            </span>
                          )}
                          {prog && !isComplete && prog.progress > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                              <div className="h-full bg-primary" style={{ width: `${prog.progress}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium line-clamp-2 leading-tight">{video.title}</h3>
                          <p className="text-[11px] text-muted-foreground mt-1.5">{video.professor}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/15">
                              {video.especialidade}
                            </span>
                            {rating && <StarRating value={rating.rating} readonly size="sm" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* ─── TAB: TRILHAS ─── */}
        {activeTab === 'trilhas' && (
          <section className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Trilhas organizam os vídeos em sequências lógicas de aprendizagem por tema.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trilhas.map(trilha => {
                const trilhaVideos = trilha.videos.map(vid => videos.find(v => v.id === vid)).filter(Boolean) as Video[];
                const trilhaProgress = trilhaVideos.length > 0
                  ? trilhaVideos.reduce((sum, v) => sum + (progressMap[v.id]?.progress || 0), 0) / trilhaVideos.length
                  : 0;
                return (
                  <button
                    key={trilha.id}
                    onClick={() => {
                      if (trilhaVideos.length > 0) handlePlayVideo(trilhaVideos[0]);
                    }}
                    className="group rounded-xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all text-left p-5 space-y-3"
                  >
                    <div>
                      <h3 className="font-bold text-base leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                        {trilha.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{trilha.descricao}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {trilhaVideos.length} vídeos</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(trilha.duracao)}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(trilhaProgress, 100)}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground text-right">{Math.round(trilhaProgress)}% concluído</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── TAB: PLAYLISTS DO PROFESSOR ─── */}
        {activeTab === 'playlists' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Playlists criadas pelos professores para cada período.
              </p>
              <button
                onClick={() => setShowPlaylistModal(true)}
                className="h-8 px-3 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-sm flex items-center gap-1.5"
              >
                Criar Playlist
              </button>
            </div>

            {/* Filter by Period */}
            <div className="flex flex-wrap gap-2">
              {PERIODOS.map(p => {
                const count = playlists.filter(pl => pl.periodo === p).length;
                return (
                  <span
                    key={p}
                    className="px-3 py-1 rounded-full text-xs bg-muted/50 text-muted-foreground border border-border/50"
                  >
                    {p}º Período ({count})
                  </span>
                );
              })}
            </div>

            {playlists.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <List className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma playlist criada ainda.</p>
                <p className="text-xs mt-1">Professores podem criar playlists personalizadas para cada período.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {PERIODOS.filter(p => playlists.some(pl => pl.periodo === p)).map(periodo => (
                  <div key={periodo}>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                      {periodo}º Período
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {playlists.filter(pl => pl.periodo === periodo).map(pl => {
                        const plVideos = pl.videos.map(vid => videos.find(v => v.id === vid)).filter(Boolean) as Video[];
                        const plProgress = plVideos.length > 0
                          ? plVideos.reduce((sum, v) => sum + (progressMap[v.id]?.progress || 0), 0) / plVideos.length
                          : 0;
                        return (
                          <button
                            key={pl.id}
                            onClick={() => setSelectedPlaylist(pl)}
                            className="group rounded-lg bg-muted/20 border border-border/50 hover:border-primary/30 transition-all text-left p-4 space-y-2"
                          >
                            <h4 className="font-bold text-sm">{pl.nome}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{pl.descricao}</p>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span>{plVideos.length} vídeos</span>
                              <span>{formatDuration(plVideos.reduce((s, v) => s + v.duration, 0))}</span>
                              <span>Por {pl.professor}</span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${plProgress}%` }} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Create Playlist Modal */}
        {showPlaylistModal && (
          <CreatePlaylistModal
            videos={videos}
            onClose={() => setShowPlaylistModal(false)}
            onCreate={handleCreatePlaylist}
          />
        )}
      </div>
    </DashboardLayout>
  );
}


// ═══════════════════════════════════════════════════════
// ─── VIDEO PLAYER VIEW COMPONENT ───
// ═══════════════════════════════════════════════════════
function VideoPlayerView({ video, videos, progressMap, ratingsMap, onClose, onMarkComplete, onSaveRating, onPlayVideo }: {
  video: Video;
  videos: Video[];
  progressMap: Record<string, WatchProgress>;
  ratingsMap: Record<string, VideoRating>;
  onClose: () => void;
  onMarkComplete: (id: string) => void;
  onSaveRating: (id: string, rating: number, comment: string) => void;
  onPlayVideo: (v: Video) => void;
}) {
  const existing = ratingsMap[video.id];
  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [showRating, setShowRating] = useState(false);
  const [saved, setSaved] = useState(false);

  // Reset when video changes
  useEffect(() => {
    const ex = ratingsMap[video.id];
    setRating(ex?.rating || 0);
    setComment(ex?.comment || '');
    setSaved(false);
    setShowRating(false);
  }, [video.id, ratingsMap]);

  const handleSave = () => {
    if (rating > 0) {
      onSaveRating(video.id, rating, comment);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <DashboardLayout title="FAMP Library" subtitle={video.title}>
      <div className="h-full flex flex-col">
        {/* Player Header */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar à Biblioteca
          </button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground font-mono">
            {video.especialidade} · {formatDuration(video.duration)}
          </span>
        </div>

        {/* Player Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">
            {/* YouTube Embed */}
            <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* Video Info */}
            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    {video.title}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">{video.professor}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowRating(!showRating)}
                    className="px-3 py-2 rounded-md text-sm border border-border hover:bg-muted/50 transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Avaliar
                  </button>
                  <button
                    onClick={() => onMarkComplete(video.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      progressMap[video.id]?.progress === 100
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                    }`}
                  >
                    {progressMap[video.id]?.progress === 100 ? '✓ Concluído' : 'Marcar como Concluído'}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {video.grandeArea}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                  {video.especialidade}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {video.tema}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(video.duration)}
                </span>
              </div>

              {/* Existing Rating Display */}
              {ratingsMap[video.id] && !showRating && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <StarRating value={ratingsMap[video.id].rating} readonly size="sm" />
                    <span className="text-xs text-muted-foreground">Sua avaliação</span>
                  </div>
                  {ratingsMap[video.id].comment && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">"{ratingsMap[video.id].comment}"</p>
                  )}
                </div>
              )}

              {/* Rating Form */}
              {showRating && (
                <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-3">
                  <h3 className="text-sm font-bold">Avalie esta aula</h3>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Classificação</label>
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Comentário (opcional)</label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="O que achou da aula? Alguma sugestão?"
                      rows={3}
                      className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={rating === 0}
                      className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saved ? '✓ Salvo!' : 'Salvar Avaliação'}
                    </button>
                    <button
                      onClick={() => setShowRating(false)}
                      className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Related Videos */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Vídeos Relacionados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {videos
                  .filter(v => v.id !== video.id && (v.especialidade === video.especialidade || v.grandeArea === video.grandeArea))
                  .slice(0, 6)
                  .map(v => (
                    <button
                      key={v.id}
                      onClick={() => onPlayVideo(v)}
                      className="flex gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    >
                      <div className="relative w-28 h-16 rounded overflow-hidden shrink-0 bg-muted">
                        <img src={getThumbnail(v.youtubeId)} alt={v.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="absolute bottom-1 right-1 text-[10px] font-mono bg-black/80 text-white px-1 rounded">
                          {formatDuration(v.duration)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{v.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{v.professor}</p>
                        {ratingsMap[v.id] && (
                          <div className="mt-1">
                            <StarRating value={ratingsMap[v.id].rating} readonly size="sm" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


// ═══════════════════════════════════════════════════════
// ─── CREATE PLAYLIST MODAL ───
// ═══════════════════════════════════════════════════════
function CreatePlaylistModal({ videos, onClose, onCreate }: {
  videos: Video[];
  onClose: () => void;
  onCreate: (pl: Omit<Playlist, 'id' | 'createdAt'>) => void;
}) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [periodo, setPeriodo] = useState(1);
  const [professor, setProfessor] = useState('');
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [videoSearch, setVideoSearch] = useState('');

  const filteredVideos = useMemo(() => {
    if (!videoSearch) return videos;
    return videos.filter(v =>
      v.title.toLowerCase().includes(videoSearch.toLowerCase()) ||
      v.especialidade.toLowerCase().includes(videoSearch.toLowerCase()) ||
      v.tema.toLowerCase().includes(videoSearch.toLowerCase())
    );
  }, [videos, videoSearch]);

  const toggleVideo = (id: string) => {
    setSelectedVideos(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!nome || !professor || selectedVideos.length === 0) return;
    onCreate({ nome, descricao, periodo, professor, videos: selectedVideos });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Criar Playlist para Turma
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome da Playlist *</label>
              <input
                type="text"
                placeholder="Ex: Cardiologia Essencial - 5º Período"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
              <input
                type="text"
                placeholder="Breve descrição da playlist..."
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Período *</label>
              <select
                value={periodo}
                onChange={e => setPeriodo(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                {PERIODOS.map(p => (
                  <option key={p} value={p}>{p}º Período</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Professor *</label>
              <input
                type="text"
                placeholder="Nome do professor"
                value={professor}
                onChange={e => setProfessor(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Video Selection */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Selecionar Vídeos * ({selectedVideos.length} selecionados)
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar vídeos..."
                value={videoSearch}
                onChange={e => setVideoSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 rounded-md bg-muted/50 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-border/50 divide-y divide-border/30">
              {filteredVideos.map(v => {
                const isSelected = selectedVideos.includes(v.id);
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVideo(v.id)}
                    className={`w-full flex items-center gap-3 p-2.5 text-left transition-colors ${
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {isSelected && <span className="text-[10px] text-primary-foreground">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{v.title}</p>
                      <p className="text-[10px] text-muted-foreground">{v.especialidade} · {formatDuration(v.duration)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Order */}
          {selectedVideos.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Ordem dos vídeos
              </label>
              <div className="space-y-1">
                {selectedVideos.map((vid, idx) => {
                  const v = videos.find(x => x.id === vid);
                  if (!v) return null;
                  return (
                    <div key={vid} className="flex items-center gap-2 p-1.5 rounded bg-muted/20 text-xs">
                      <span className="font-mono text-muted-foreground w-5 text-center">{idx + 1}</span>
                      <span className="truncate flex-1">{v.title}</span>
                      <button
                        onClick={() => setSelectedVideos(prev => prev.filter(x => x !== vid))}
                        className="text-muted-foreground hover:text-red-400 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!nome || !professor || selectedVideos.length === 0}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar Playlist
          </button>
        </div>
      </div>
    </div>
  );
}
