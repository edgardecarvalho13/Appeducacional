/**
 * FAMP Academy — Biblioteca de Videoaulas
 * Design: "Command Center" — Dark theme com cards de vídeo, filtros por área,
 * seções Continuar Assistindo, Trilha Recomendada e catálogo completo.
 * Player YouTube embedado.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Play, Clock, ChevronLeft, X, Filter, Plus, Upload, Star, Eye, BookOpen } from 'lucide-react';
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

interface WatchProgress {
  videoId: string;
  progress: number; // 0-100
  lastWatched: string; // ISO date
}

const STORAGE_KEY = 'famp-video-progress';

function getProgress(): WatchProgress[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveProgress(data: WatchProgress[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getVideoProgress(videoId: string): WatchProgress | undefined {
  return getProgress().find(p => p.videoId === videoId);
}

function updateVideoProgress(videoId: string, progress: number) {
  const all = getProgress();
  const idx = all.findIndex(p => p.videoId === videoId);
  const entry: WatchProgress = { videoId, progress, lastWatched: new Date().toISOString() };
  if (idx >= 0) all[idx] = entry;
  else all.push(entry);
  saveProgress(all);
}

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

const AREAS = ['Todos', ...Array.from(new Set((videosData as Video[]).map(v => v.grandeArea))).sort()];

export default function BibliotecaPage() {
  const [videos] = useState<Video[]>(videosData as Video[]);
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState('Todos');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, WatchProgress>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // Load progress on mount
  useEffect(() => {
    const all = getProgress();
    const map: Record<string, WatchProgress> = {};
    all.forEach(p => { map[p.videoId] = p; });
    setProgressMap(map);
  }, []);

  const refreshProgress = useCallback(() => {
    const all = getProgress();
    const map: Record<string, WatchProgress> = {};
    all.forEach(p => { map[p.videoId] = p; });
    setProgressMap(map);
  }, []);

  // Filtered videos
  const filtered = useMemo(() => {
    return videos.filter(v => {
      const matchArea = selectedArea === 'Todos' || v.grandeArea === selectedArea;
      const matchSearch = !search || 
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.professor.toLowerCase().includes(search.toLowerCase()) ||
        v.especialidade.toLowerCase().includes(search.toLowerCase()) ||
        v.tema.toLowerCase().includes(search.toLowerCase());
      return matchArea && matchSearch;
    });
  }, [videos, selectedArea, search]);

  // Continue watching (has progress, not 100%)
  const continueWatching = useMemo(() => {
    return videos
      .filter(v => progressMap[v.id] && progressMap[v.id].progress > 0 && progressMap[v.id].progress < 100)
      .sort((a, b) => new Date(progressMap[b.id].lastWatched).getTime() - new Date(progressMap[a.id].lastWatched).getTime());
  }, [videos, progressMap]);

  // Recommended (not started yet, random selection)
  const recommended = useMemo(() => {
    const notStarted = videos.filter(v => !progressMap[v.id] || progressMap[v.id].progress === 0);
    // Shuffle and take 4
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
    // Mark as started if not already
    if (!progressMap[video.id]) {
      updateVideoProgress(video.id, 5);
      refreshProgress();
    }
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
    refreshProgress();
  };

  const handleMarkComplete = (videoId: string) => {
    updateVideoProgress(videoId, 100);
    refreshProgress();
  };

  // ─── VIDEO PLAYER VIEW ───
  if (selectedVideo) {
    return (
      <DashboardLayout title="FAMP Library" subtitle={selectedVideo.title}>
        <div className="h-full flex flex-col">
          {/* Player Header */}
          <div className="px-6 py-3 border-b border-border flex items-center gap-3">
            <button
              onClick={handleClosePlayer}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar à Biblioteca
            </button>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground font-mono">
              {selectedVideo.especialidade} · {formatDuration(selectedVideo.duration)}
            </span>
          </div>

          {/* Player Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 py-6">
              {/* YouTube Embed */}
              <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Video Info */}
              <div className="mt-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      {selectedVideo.title}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedVideo.professor}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMarkComplete(selectedVideo.id)}
                    className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      progressMap[selectedVideo.id]?.progress === 100
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                    }`}
                  >
                    {progressMap[selectedVideo.id]?.progress === 100 ? '✓ Concluído' : 'Marcar como Concluído'}
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {selectedVideo.grandeArea}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                    {selectedVideo.especialidade}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    {selectedVideo.tema}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(selectedVideo.duration)}
                  </span>
                </div>
              </div>

              {/* Related Videos */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Vídeos Relacionados
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {videos
                    .filter(v => v.id !== selectedVideo.id && (v.especialidade === selectedVideo.especialidade || v.grandeArea === selectedVideo.grandeArea))
                    .slice(0, 6)
                    .map(v => (
                      <button
                        key={v.id}
                        onClick={() => handlePlayVideo(v)}
                        className="flex gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                      >
                        <div className="relative w-28 h-16 rounded overflow-hidden shrink-0 bg-muted">
                          <img
                            src={getThumbnail(v.youtubeId)}
                            alt={v.title}
                            className="w-full h-full object-cover"
                          />
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

  // ─── LIBRARY CATALOG VIEW ───
  return (
    <DashboardLayout title="FAMP Library" subtitle="Biblioteca de Videoaulas">
      <div className="p-6 space-y-8 max-w-[1400px] mx-auto">

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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar videoaulas, professores..."
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
            <button
              onClick={() => setShowAddModal(true)}
              className="h-9 px-3 rounded-md bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        </div>

        {/* Area Filters */}
        <div className="flex flex-wrap gap-2">
          {AREAS.map(area => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
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
        {continueWatching.length > 0 && selectedArea === 'Todos' && !search && (
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
                      <img
                        src={getThumbnail(video.youtubeId)}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
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
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${prog?.progress || 0}%` }}
                            />
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
        {recommended.length > 0 && selectedArea === 'Todos' && !search && (
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
                    <img
                      src={getThumbnail(video.youtubeId)}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
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
            {search || selectedArea !== 'Todos' ? `Resultados (${filtered.length})` : 'Todas as Videoaulas'}
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
                return (
                  <button
                    key={video.id}
                    onClick={() => handlePlayVideo(video)}
                    className="group rounded-lg overflow-hidden bg-muted/20 border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all text-left"
                  >
                    <div className="relative h-36">
                      <img
                        src={getThumbnail(video.youtubeId)}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
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
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/15">
                          {video.especialidade}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Add Video Modal */}
        {showAddModal && (
          <AddVideoModal
            onClose={() => setShowAddModal(false)}
            onAdd={(video) => {
              // In a real app, this would save to a database
              // For now, we just show a toast
              setShowAddModal(false);
              import('sonner').then(({ toast }) => {
                toast.success(`Vídeo "${video.title}" adicionado com sucesso!`);
              });
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── ADD VIDEO MODAL ───
interface AddVideoModalProps {
  onClose: () => void;
  onAdd: (video: Partial<Video>) => void;
}

function AddVideoModal({ onClose, onAdd }: AddVideoModalProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [professor, setProfessor] = useState('');
  const [duration, setDuration] = useState('');
  const [grandeArea, setGrandeArea] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [tema, setTema] = useState('');

  const extractYoutubeId = (url: string): string => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^?&]+)/);
    return match ? match[1] : '';
  };

  const handleSubmit = () => {
    const ytId = extractYoutubeId(youtubeUrl);
    if (!ytId || !title) return;
    onAdd({
      youtubeId: ytId,
      title,
      professor,
      duration: parseInt(duration) || 0,
      grandeArea,
      especialidade,
      tema,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Adicionar Videoaula
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Link do YouTube *</label>
            <input
              type="text"
              placeholder="https://youtu.be/... ou https://youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            {youtubeUrl && extractYoutubeId(youtubeUrl) && (
              <div className="mt-2 rounded overflow-hidden">
                <img
                  src={getThumbnail(extractYoutubeId(youtubeUrl))}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Título *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Professor</label>
              <input
                type="text"
                value={professor}
                onChange={e => setProfessor(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Duração (min)</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Grande Área</label>
              <select
                value={grandeArea}
                onChange={e => setGrandeArea(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <option value="">Selecione...</option>
                {AREAS.filter(a => a !== 'Todos').map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Especialidade</label>
              <input
                type="text"
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tema</label>
              <input
                type="text"
                value={tema}
                onChange={e => setTema(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-muted/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!youtubeUrl || !title || !extractYoutubeId(youtubeUrl)}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar Vídeo
          </button>
        </div>
      </div>
    </div>
  );
}
