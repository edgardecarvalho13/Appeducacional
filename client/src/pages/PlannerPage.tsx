/**
 * FAMP Planner — Motor de Estudo
 * Design: "Command Center" dark theme — Navy + Teal + Mint
 * Features: Sessões 90min, revisão espaçada R1-R10, TAs escaláveis,
 *           visão semanal, timeline, criação de temas, histórico.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  FileQuestion,
  GraduationCap,
  Layers,
  Target,
  ChevronRight,
  ChevronLeft,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  RotateCcw,
  Trash2,
  Edit3,
  Eye,
  ListChecks,
  TrendingUp,
  Zap,
  History,
  CalendarDays,
  Brain,
  X,
  Check,
  Pause,
  StickyNote,
  Save,
  ExternalLink,
  Link2,
  Lock,
} from 'lucide-react';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import type { PlannerItemStatus, EtapaEstudo } from '@/lib/types';
import { toast } from 'sonner';
import {
  PLANO_ENSINO,
  getEspecialidades,
  getSemanasDisponiveis,
  getTemasParaSemana,
  isSemanaEspecial,
  getAllSemanasDisponiveis,
  getAllTemasForSemana,
} from '@/data/plano-ensino';
import type { TemaAula, TemaCompleto } from '@/data/plano-ensino';

// ─── Constants ───
const ETAPA_LABELS: Record<EtapaEstudo, { label: string; icon: React.ElementType; color: string }> = {
  estudo_teorico: { label: 'Estudo Teórico', icon: BookOpen, color: 'text-blue-400' },
  questoes_pre: { label: 'Questões Pré-Aula', icon: FileQuestion, color: 'text-amber-400' },
  aula: { label: 'Aula', icon: GraduationCap, color: 'text-primary' },
  flashcards: { label: 'Flashcards', icon: Layers, color: 'text-purple-400' },
  questoes_pos: { label: 'Questões Pós-Aula', icon: Target, color: 'text-emerald-400' },
};

const STATUS_CONFIG: Record<PlannerItemStatus, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-muted-foreground', bg: 'bg-muted/50' },
  em_andamento: { label: 'Em andamento', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  concluido: { label: 'Concluído', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  atrasado: { label: 'Atrasado', color: 'text-red-400', bg: 'bg-red-500/10' },
  pulado: { label: 'Pulado', color: 'text-muted-foreground/50', bg: 'bg-muted/30' },
};

type ViewMode = 'overview' | 'tema_detail' | 'create_tema' | 'timeline' | 'history';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ─── Main Component ───
export default function PlannerPage() {
  const store = usePlannerStore();
  const [view, setView] = useState<ViewMode>('overview');
  const [selectedTemaId, setSelectedTemaId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // Deep-link: se URL tiver ?tema=ID, abrir direto na sessão
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const temaParam = params.get('tema');
    if (temaParam && store.temas.some(t => t.id === temaParam)) {
      setSelectedTemaId(temaParam);
      setView('tema_detail');
      // Limpar o query param da URL sem recarregar
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // eslint-disable-line

  const stats = store.getStats();
  const weeks = store.getWeeks();
  const { pendingRevisoes, pendingTestes } = store.getPendingActions();
  const totalPending = pendingRevisoes.length + pendingTestes.length;

  const openTemaDetail = useCallback((temaId: string) => {
    setSelectedTemaId(temaId);
    setView('tema_detail');
  }, []);

  const goBack = useCallback(() => {
    setView('overview');
    setSelectedTemaId(null);

  }, []);

  return (
    <DashboardLayout title="FAMP Planner" subtitle="Motor de Estudo">
      {view === 'overview' && (
        <OverviewView
          store={store}
          stats={stats}
          weeks={weeks}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          totalPending={totalPending}
          pendingRevisoes={pendingRevisoes}
          pendingTestes={pendingTestes}
          onOpenTema={openTemaDetail}
          onCreateTema={() => setView('create_tema')}
          onOpenTimeline={() => setView('timeline')}
          onOpenHistory={() => setView('history')}
        />
      )}
      {view === 'tema_detail' && selectedTemaId && (
        <TemaDetailView
          store={store}
          temaId={selectedTemaId}
          onBack={goBack}
        />
      )}
      {view === 'create_tema' && (
        <CreateTemaView store={store} onBack={goBack} onCreated={(id: string) => {
          setSelectedTemaId(id);
          setView('tema_detail');
        }} />
      )}

      {view === 'timeline' && (
        <TimelineView store={store} onBack={goBack} onOpenTema={openTemaDetail} />
      )}
      {view === 'history' && (
        <HistoryView store={store} onBack={goBack} onOpenTema={openTemaDetail} />
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW VIEW
// ═══════════════════════════════════════════════════════════════
function OverviewView({
  store, stats, weeks, selectedWeek, setSelectedWeek,
  totalPending, pendingRevisoes, pendingTestes,
  onOpenTema, onCreateTema, onOpenTimeline, onOpenHistory,
}: any) {
  const currentWeek = selectedWeek ?? (weeks.length > 0 ? weeks[0] : 1);
  const temasForWeek = store.getTemasForWeek(currentWeek);

  return (
    <div className="p-5 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft className="w-3 h-3" /> Voltar ao Dashboard
          </span>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={onOpenTimeline}>
            <CalendarDays className="w-3.5 h-3.5" /> Timeline
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={onOpenHistory}>
            <History className="w-3.5 h-3.5" /> Histórico
          </Button>
          <Button size="sm" className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={onCreateTema}>
            <Plus className="w-3.5 h-3.5" /> Novo Tema
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="card-famp">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BookOpen className="w-3.5 h-3.5" /> Temas
            </div>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{stats.totalTemas}</p>
          </CardContent>
        </Card>
        <Card className="card-famp">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ListChecks className="w-3.5 h-3.5" /> Etapas
            </div>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-emerald-400">{stats.etapasConcluidas}</span>
              <span className="text-muted-foreground text-sm">/{stats.totalEtapas}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="card-famp">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <RotateCcw className="w-3.5 h-3.5" /> Revisões
            </div>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              <span className="text-emerald-400">{stats.revisoesConcluidas}</span>
              <span className="text-muted-foreground text-sm">/{stats.totalRevisoes}</span>
            </p>
          </CardContent>
        </Card>
        <Card className="card-famp">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Pendentes
            </div>
            <p className="text-xl font-bold text-amber-400" style={{ fontFamily: 'var(--font-display)' }}>
              {totalPending}
            </p>
          </CardContent>
        </Card>
        <Card className="card-famp">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="w-3.5 h-3.5" /> Tempo Total
            </div>
            <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              {formatMinutes(stats.tempoTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Actions Alert */}
      {totalPending > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400" style={{ fontFamily: 'var(--font-display)' }}>
                Ações Pendentes
              </h3>
            </div>
            <div className="space-y-2">
              {pendingRevisoes.slice(0, 3).map((r: any) => {
                const tema = store.temas.find((t: any) => t.id === r.temaId);
                return (
                  <div key={r.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span className="text-foreground">{r.tipo}</span>
                      <span className="text-muted-foreground">— {tema?.tema}</span>
                    </div>
                    <span className={`font-mono ${r.status === 'atrasado' ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatDate(r.dataAgendada)}
                    </span>
                  </div>
                );
              })}
              {pendingTestes.slice(0, 2).map((t: any) => {
                const tema = store.temas.find((tm: any) => tm.id === t.temaId);
                return (
                  <div key={t.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-purple-400" />
                      <span className="text-foreground">TA{t.numero}</span>
                      <span className="text-muted-foreground">— {tema?.tema}</span>
                    </div>
                    <span className={`font-mono ${t.status === 'atrasado' ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatDate(t.dataAgendada)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week Selector */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Semanas</h3>
          <div className="flex gap-1.5 flex-wrap">
            {(weeks.length > 0 ? weeks : [1]).map((w: number) => (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all ${
                  currentWeek === w
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                Sem {w}
              </button>
            ))}
          </div>
        </div>

        {/* Temas Grid */}
        {temasForWeek.length === 0 ? (
          <Card className="card-famp">
            <CardContent className="p-8 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Nenhum tema nesta semana</p>
              <p className="text-xs text-muted-foreground/60 mb-4">Adicione temas para começar a planejar seus estudos.</p>
              <Button size="sm" className="text-xs gap-1.5" onClick={onCreateTema}>
                <Plus className="w-3.5 h-3.5" /> Adicionar Tema
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {temasForWeek.map((tema: any) => {
              const etapas = store.getEtapasForTema(tema.id);
              const concluidas = etapas.filter((e: any) => e.status === 'concluido').length;
              const progresso = etapas.length > 0 ? Math.round((concluidas / etapas.length) * 100) : 0;
              const revisoes = store.getRevisoesForTema(tema.id);
              const proximaRevisao = revisoes.find((r: any) => r.status === 'pendente' || r.status === 'atrasado');

              return (
                <Card
                  key={tema.id}
                  className="card-famp cursor-pointer group"
                  onClick={() => onOpenTema(tema.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {tema.area}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {tema.especialidade}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold group-hover:text-primary transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                          {tema.tema}
                        </h4>
                        {progresso === 100 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1">
                            <CheckCircle2 className="w-3 h-3" /> Sessão Concluída
                          </span>
                        )}
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          Data base: {formatDate(tema.dataBase)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <Progress value={progresso} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{progresso}%</span>
                    </div>

                    {/* Etapas mini-indicators */}
                    <div className="flex items-center gap-1.5">
                      {etapas.map((e: any) => {
                        const cfg = ETAPA_LABELS[e.tipo as EtapaEstudo];
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={e.id}
                            className={`w-6 h-6 rounded flex items-center justify-center ${
                              e.status === 'concluido'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : e.status === 'em_andamento'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-muted/30 text-muted-foreground/40'
                            }`}
                            title={`${cfg.label}: ${STATUS_CONFIG[e.status as PlannerItemStatus].label}`}
                          >
                            <Icon className="w-3 h-3" />
                          </div>
                        );
                      })}
                      <div className="flex-1" />
                      {proximaRevisao && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          proximaRevisao.status === 'atrasado'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {proximaRevisao.tipo} · {formatDate(proximaRevisao.dataAgendada)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEMA DETAIL VIEW
// ═══════════════════════════════════════════════════════════════
function TemaDetailView({ store, temaId, onBack }: any) {
  const tema = store.temas.find((t: any) => t.id === temaId);
  const etapas = store.getEtapasForTema(temaId);
  const revisoes = store.getRevisoesForTema(temaId);
  const testes = store.getTestesForTema(temaId);
  const [activeTab, setActiveTab] = useState<'etapas' | 'revisoes'>('etapas');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [anotacoes, setAnotacoes] = useState(tema?.anotacoes || '');
  const [editandoAnotacoes, setEditandoAnotacoes] = useState(false);

  if (!tema) return null;

  const concluidas = etapas.filter((e: any) => e.status === 'concluido').length;
  const progresso = etapas.length > 0 ? Math.round((concluidas / etapas.length) * 100) : 0;
  const questoesPosCompleta = etapas.some((e: any) => e.tipo === 'questoes_pos' && e.status === 'concluido');

  const podeRemover = !questoesPosCompleta && tema?.status !== 'concluida';

  const handleDelete = () => {
    if (!podeRemover) {
      toast.error('N\u00e3o \u00e9 poss\u00edvel remover esta sess\u00e3o. As Quest\u00f5es P\u00f3s-Aula j\u00e1 foram conclu\u00eddas.');
      return;
    }
    const deletado = store.deleteTema(temaId);
    if (!deletado) {
      toast.error('N\u00e3o \u00e9 poss\u00edvel remover esta sess\u00e3o.');
      return;
    }
    toast.success('Tema removido');
    onBack();
  };

  const handleSaveAnotacoes = () => {
    store.updateAnotacoes(temaId, anotacoes);
    toast.success('Anotações salvas');
  };

  return (
    <div className="p-5 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </button>
        <div className="flex gap-2">
          {podeRemover ? (
            showDeleteConfirm ? (
              <div className="flex gap-1">
                <Button variant="destructive" size="sm" className="text-xs" onClick={handleDelete}>Confirmar</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="text-xs gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/5" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-3.5 h-3.5" /> Remover
              </Button>
            )
          ) : questoesPosCompleta && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded border border-border/50" title="Questões Pós-Aula concluídas — sessão protegida contra exclusão">
              <Lock className="w-3 h-3" /> Sessão protegida
            </span>
          )}
        </div>
      </div>

      {/* Tema Info Card */}
      <Card className="card-famp">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{tema.area}</span>
            <span className="text-[10px] font-mono text-muted-foreground">{tema.especialidade}</span>
            <span className="text-[10px] font-mono text-muted-foreground">· Semana {tema.semana}</span>
          </div>
          <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{tema.tema}</h2>
          <p className="text-xs text-muted-foreground font-mono mb-3">Data base: {formatDateFull(tema.dataBase)}</p>
          {tema.observacoes && (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2 border border-border/50">
              <StickyNote className="w-3 h-3 inline mr-1 text-primary" />
              {tema.observacoes}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <Progress value={progresso} className="h-2 flex-1" />
            <span className="text-xs font-mono text-muted-foreground">{progresso}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {[
          { key: 'etapas', label: 'Etapas', icon: ListChecks, count: `${concluidas}/${etapas.length}`, locked: false },
          { key: 'revisoes', label: 'Revisões & TAs', icon: RotateCcw, count: `${revisoes.filter((r: any) => r.status === 'concluido').length + testes.filter((t: any) => t.status === 'concluido').length}/${revisoes.length + testes.length}`, locked: !questoesPosCompleta },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.locked) {
                  toast.info('Complete todas as etapas (incluindo Questões Pós-Aula) para desbloquear as revisões.');
                  return;
                }
                setActiveTab(tab.key as any);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-[1px] ${
                tab.locked
                  ? 'border-transparent text-muted-foreground/40 cursor-not-allowed'
                  : activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.locked && <Lock className="w-3 h-3 text-muted-foreground/40" />}
              <Icon className={`w-3.5 h-3.5 ${tab.locked ? 'opacity-40' : ''}`} />
              {tab.label}
              <span className={`font-mono text-[10px] px-1 py-0.5 rounded ${tab.locked ? 'bg-muted/20 text-muted-foreground/40' : 'bg-muted/50'}`}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'etapas' && (
        <div className="space-y-2">
          {etapas.map((etapa: any) => {
            const cfg = ETAPA_LABELS[etapa.tipo as EtapaEstudo];
            const Icon = cfg.icon;
            const statusCfg = STATUS_CONFIG[etapa.status as PlannerItemStatus];

            // Determinar se a etapa tem link
            const hasLink = etapa.tipo === 'questoes_pre' || etapa.tipo === 'questoes_pos' || etapa.tipo === 'flashcards';
            const linkLabel = etapa.tipo === 'questoes_pre'
              ? '10 questões (3 fáceis, 5 médias, 2 difíceis)'
              : etapa.tipo === 'questoes_pos'
              ? '20 questões aleatórias sobre o tema'
              : etapa.tipo === 'flashcards'
              ? '20 flashcards inteligentes'
              : '';
            const linkTarget = etapa.tipo === 'flashcards' ? '/flashcards' : '/quest';

            return (
              <Card key={etapa.id} className="card-famp">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                      etapa.status === 'concluido' ? 'bg-emerald-500/15' : 'bg-muted/30'
                    }`}>
                      <Icon className={`w-4 h-4 ${etapa.status === 'concluido' ? 'text-emerald-400' : cfg.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cfg.label}</p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={statusCfg.color}>{statusCfg.label}</span>
                        {etapa.valor !== undefined && etapa.valor !== null && (
                          <span className="font-mono text-muted-foreground">· {etapa.valor} questões</span>
                        )}
                        {etapa.completadoEm && (
                          <span className="font-mono text-muted-foreground">· {formatDate(etapa.completadoEm)}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={etapa.status === 'concluido' ? 'ghost' : 'outline'}
                      size="sm"
                      className={`text-xs gap-1 h-7 ${
                        etapa.status === 'concluido'
                          ? 'text-emerald-400 hover:text-red-400 hover:bg-red-500/5'
                          : ''
                      }`}
                      onClick={() => {
                        store.toggleEtapa(etapa.id);
                        // Se for Questões Pós-Aula e foi concluído, marcar tema como concluído
                        if (etapa.tipo === 'questoes_pos' && etapa.status !== 'concluido') {
                          store.marcarComoConcluida(temaId);
                          toast.success('Sessão de estudo concluída! ✓');
                        } else {
                          toast.success(
                            etapa.status === 'concluido'
                              ? `${cfg.label} desmarcado`
                              : `${cfg.label} concluído!`
                          );
                        }
                      }}
                    >
                      {etapa.status === 'concluido' ? (
                        <><CheckCircle2 className="w-3 h-3" /> Concluído</>
                      ) : (
                        <><Check className="w-3 h-3" /> Concluir</>
                      )}
                    </Button>
                  </div>
                  {hasLink && (
                    <div className="ml-11 mt-2">
                      <a
                        href={linkTarget}
                        className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 transition-colors bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-md border border-primary/20"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {linkLabel}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'revisoes' && !questoesPosCompleta && (
        <Card className="card-famp">
          <CardContent className="p-8 text-center">
            <Lock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-muted-foreground mb-1">Revisões bloqueadas</h3>
            <p className="text-xs text-muted-foreground/60">Complete a etapa <span className="text-primary font-medium">Questões Pós-Aula</span> para desbloquear as revisões espaçadas e testes aleatórios.</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'revisoes' && questoesPosCompleta && (() => {
        // Intercalar R e TA em ordem: R1, TA1, R2, TA2, ...
        const intercalado: Array<{ type: 'revisao' | 'teste'; data: any }> = [];
        const maxLen = Math.max(revisoes.length, testes.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < revisoes.length) intercalado.push({ type: 'revisao', data: revisoes[i] });
          if (i < testes.length) intercalado.push({ type: 'teste', data: testes[i] });
        }

        return (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Revisões & Testes Aleatórios</h4>
            {intercalado.map((item) => {
              const isRevisao = item.type === 'revisao';
              const entry = item.data;
              const statusCfg = STATUS_CONFIG[entry.status as PlannerItemStatus];
              const label = isRevisao ? entry.tipo : `TA${entry.numero}`;
              const fullLabel = isRevisao ? entry.tipo : `Teste Aleatório ${entry.numero}`;

              return (
                <Card key={entry.id} className="card-famp">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                      entry.status === 'concluido' ? 'bg-emerald-500/15 text-emerald-400'
                      : entry.status === 'atrasado' ? 'bg-red-500/15 text-red-400'
                      : isRevisao ? 'bg-primary/10 text-primary' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {label}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{fullLabel}</p>
                        <span className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                        <span>{formatDate(entry.dataAgendada)}</span>
                        {isRevisao && entry.tecnicaUsada && <span>· {entry.tecnicaUsada}</span>}
                        {isRevisao && entry.valor && <span>· {entry.valor} questões</span>}
                        {!isRevisao && entry.questoesFeitas && <span>· {entry.questoesFeitas} questões</span>}
                      </div>
                    </div>
                    <Button
                      variant={entry.status === 'concluido' ? 'ghost' : 'outline'}
                      size="sm"
                      className={`text-xs gap-1 h-7 ${
                        entry.status === 'concluido'
                          ? 'text-emerald-400 hover:text-red-400 hover:bg-red-500/5'
                          : ''
                      }`}
                      onClick={() => {
                        if (isRevisao) {
                          store.toggleRevisao(entry.id);
                          toast.success(entry.status === 'concluido' ? `${label} desmarcada` : `${label} concluída!`);
                        } else {
                          store.toggleTeste(entry.id);
                          toast.success(entry.status === 'concluido' ? `${label} desmarcado` : `${label} concluído!`);
                        }
                      }}
                    >
                      {entry.status === 'concluido' ? (
                        <><CheckCircle2 className="w-3 h-3" /> Concluído</>
                      ) : (
                        <><Check className="w-3 h-3" /> Feito</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })()}

      {/* Card de Anotacoes Pessoais — sempre aberto */}
      <Card className="card-famp">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              Anotações Pessoais
            </h3>
          </div>
          <div className="space-y-2">
            <textarea
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              placeholder="Adicione anotações pessoais sobre este tema..."
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[80px]"
              rows={4}
            />
            <div className="flex justify-end">
              <Button size="sm" className="text-xs" onClick={handleSaveAnotacoes}>
                <Save className="w-3 h-3 mr-1" /> Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CREATE TEMA VIEW
// ═══════════════════════════════════════════════════════════════
function CreateTemaView({ store, onBack, onCreated }: any) {
  const [form, setForm] = useState({
    semana: 0,
    area: '',
    especialidade: '',
    tema: '',
    dataBase: new Date().toISOString().split('T')[0],
    observacoes: '',
  });

  // Dados do plano de ensino - Semana primeiro
  const todasSemanas = useMemo(() => getAllSemanasDisponiveis(), []);

  // Todos os temas da semana selecionada (todas as áreas/especialidades)
  const temasCompletos = useMemo(() => {
    if (!form.semana) return [];
    return getAllTemasForSemana(form.semana);
  }, [form.semana]);

  // Áreas disponíveis para a semana selecionada
  const areasDisponiveis = useMemo(() => {
    const set = new Set(temasCompletos.map((t: TemaCompleto) => t.area));
    return Array.from(set);
  }, [temasCompletos]);

  // Especialidades filtradas pela área selecionada
  const especialidadesDisponiveis = useMemo(() => {
    if (!form.area) return [];
    const set = new Set(
      temasCompletos.filter((t: TemaCompleto) => t.area === form.area).map((t: TemaCompleto) => t.especialidade)
    );
    return Array.from(set);
  }, [temasCompletos, form.area]);

  // Temas filtrados pela área + especialidade
  const temasDisponiveis = useMemo(() => {
    return temasCompletos
      .filter((t: TemaCompleto) => {
        if (form.area && t.area !== form.area) return false;
        if (form.especialidade && t.especialidade !== form.especialidade) return false;
        return true;
      });
  }, [temasCompletos, form.area, form.especialidade]);

  const semanaEspecial = useMemo(() => {
    if (!form.semana) return null;
    return isSemanaEspecial(form.semana);
  }, [form.semana]);

  // Temas já adicionados pelo aluno (para impedir duplicidade)
  const temasExistentes = useMemo(() => {
    return store.temas.map((t: any) => `${t.area}::${t.especialidade}::${t.tema}`);
  }, [store.temas]);

  // Reset cascading fields when parent changes
  const handleSemanaChange = (semana: number) => {
    setForm({ ...form, semana, area: '', especialidade: '', tema: '' });
  };

  const handleAreaChange = (area: string) => {
    setForm({ ...form, area, especialidade: '', tema: '' });
  };

  const handleEspecialidadeChange = (especialidade: string) => {
    setForm({ ...form, especialidade, tema: '' });
  };

  const handleSubmit = () => {
    if (!form.area || !form.tema || !form.dataBase) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    // Verificar duplicidade
    const key = `${form.area}::${form.especialidade}::${form.tema}`;
    if (temasExistentes.includes(key)) {
      toast.error('Este tema já foi adicionado ao seu planejamento!');
      return;
    }
    const tema = store.addTema(form);
    if (!tema) {
      toast.error('Este tema já foi adicionado ao seu planejamento!');
      return;
    }
    toast.success('Tema adicionado! Revisões e TAs calculados automaticamente.');
    onCreated(tema.id);
  };

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3 h-3" /> Voltar
      </button>

      <Card className="card-famp">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Novo Tema de Estudo</h2>
          <p className="text-xs text-muted-foreground">
            Selecione a semana para ver os temas disponíveis. O sistema calcula automaticamente as 10 revisões espaçadas (R1-R10) e os testes aleatórios.
          </p>

          {/* Semana — PRIMEIRO campo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Semana *</label>
              <select
                value={form.semana || ''}
                onChange={(e) => handleSemanaChange(parseInt(e.target.value) || 0)}
                className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecione a semana...</option>
                {todasSemanas.map((s) => {
                  const especial = isSemanaEspecial(s);
                  return (
                    <option key={s} value={s} disabled={!!especial}>
                      Semana {s}{especial ? ` — ${especial.label}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data Base *</label>
              <input
                type="date"
                value={form.dataBase}
                onChange={(e) => setForm({ ...form, dataBase: e.target.value })}
                className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Aviso de semana especial */}
          {semanaEspecial && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Semana {semanaEspecial.semana}: {semanaEspecial.label}
              </p>
            </div>
          )}

          {/* Grande Área — filtrado pela semana */}
          {form.semana > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Grande Área *</label>
              {areasDisponiveis.length > 0 ? (
                <select
                  value={form.area}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione a grande área...</option>
                  {areasDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              ) : (
                <div className="w-full h-9 rounded-md border border-border bg-input/50 px-3 text-sm flex items-center text-muted-foreground">
                  Nenhuma área com temas nesta semana
                </div>
              )}
            </div>
          )}

          {/* Especialidade — filtrado pela área + semana */}
          {form.semana > 0 && form.area && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Especialidade *</label>
              {especialidadesDisponiveis.length > 0 ? (
                <select
                  value={form.especialidade}
                  onChange={(e) => handleEspecialidadeChange(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione a especialidade...</option>
                  {especialidadesDisponiveis.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              ) : (
                <div className="w-full h-9 rounded-md border border-border bg-input/50 px-3 text-sm flex items-center text-muted-foreground">
                  Nenhuma especialidade nesta semana
                </div>
              )}
            </div>
          )}

          {/* Tema da Aula — dropdown com temas filtrados */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tema da Aula *</label>
            {form.semana > 0 && temasDisponiveis.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={form.tema}
                  onChange={(e) => {
                    const selected = temasDisponiveis.find((t: TemaCompleto) => t.tema.nome === e.target.value);
                    if (selected) {
                      setForm({ ...form, tema: selected.tema.nome, area: selected.area, especialidade: selected.especialidade });
                    }
                  }}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione o tema da aula...</option>
                  {temasDisponiveis.map((t: TemaCompleto, i: number) => {
                    const jaExiste = temasExistentes.includes(`${t.area}::${t.especialidade}::${t.tema.nome}`);
                    return (
                      <option key={i} value={t.tema.nome} disabled={jaExiste}>
                        {t.tema.nome}{jaExiste ? ' (já adicionado)' : ''} — {t.especialidade}
                      </option>
                    );
                  })}
                </select>
                {/* Mostrar descrição do tema selecionado */}
                {form.tema && (() => {
                  const temaInfo = temasDisponiveis.find((t: TemaCompleto) => t.tema.nome === form.tema);
                  return temaInfo?.tema.descricao ? (
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5">
                      <p className="text-[11px] text-muted-foreground">
                        <BookOpen className="w-3 h-3 inline mr-1 text-primary" />
                        {temaInfo.tema.descricao}
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
            ) : form.semana > 0 ? (
              <input
                type="text"
                value={form.tema}
                onChange={(e) => setForm({ ...form, tema: e.target.value })}
                placeholder="Digite o tema manualmente..."
                className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <div className="w-full h-9 rounded-md border border-border bg-input/50 px-3 text-sm flex items-center text-muted-foreground">
                Selecione a semana primeiro
              </div>
            )}
          </div>

          {/* Preview: Todos os temas da semana */}
          {form.semana > 0 && temasCompletos.length > 0 && (
            <div className="rounded-md border border-border/50 bg-muted/20 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Conteúdo da Semana {form.semana}
              </p>
              <div className="space-y-1">
                {temasCompletos.map((t: TemaCompleto, i: number) => {
                  const jaExiste = temasExistentes.includes(`${t.area}::${t.especialidade}::${t.tema.nome}`);
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        if (!jaExiste) {
                          setForm({ ...form, tema: t.tema.nome, area: t.area, especialidade: t.especialidade });
                        }
                      }}
                      className={`text-[11px] px-2 py-1.5 rounded transition-colors ${
                        jaExiste
                          ? 'opacity-40 cursor-not-allowed line-through'
                          : form.tema === t.tema.nome
                            ? 'bg-primary/20 text-primary border border-primary/30 cursor-pointer'
                            : 'text-foreground/80 hover:bg-muted/50 cursor-pointer'
                      }`}
                    >
                      <span className="text-muted-foreground mr-1">{t.especialidade} ·</span>
                      {t.tema.nome}
                      {jaExiste && <span className="ml-1 text-amber-400">(já adicionado)</span>}
                      {t.tema.descricao && !jaExiste && (
                        <span className="text-muted-foreground ml-1">— {t.tema.descricao}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Anotações sobre o tema, pontos de atenção..."
              rows={3}
              className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1 text-xs gap-1.5" onClick={handleSubmit}>
              <Plus className="w-3.5 h-3.5" /> Criar Tema
            </Button>
            <Button variant="outline" className="text-xs" onClick={onBack}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info box */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="text-xs font-semibold text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Brain className="w-3.5 h-3.5 inline mr-1" />
            Como funciona a revisão espaçada
          </h4>
          <div className="text-[11px] text-muted-foreground space-y-1">
            <p>R1 a R5: a cada 25 dias a partir da data base (dias 25, 50, 75, 100, 125)</p>
            <p>R6 a R10: a cada 50 dias (dias 175, 225, 275, 325, 375)</p>
            <p>Testes aleatórios (TA): inseridos entre revisões com mínimo de 3 dias de intervalo</p>
            <p>Técnica ativa recomendada: questões, flashcards ou mapas mentais</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SESSION VIEW (Timer de 90min)
// ═══════════════════════════════════════════════════════════════
function SessionView({ store, sessaoId, temaId, onEnd }: any) {
  const tema = store.temas.find((t: any) => t.id === temaId);
  const etapas = store.getEtapasForTema(temaId);
  const sessao = store.sessoes.find((s: any) => s.id === sessaoId);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [isPaused, setIsPaused] = useState(false);
  const [notas, setNotas] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!isPaused) {
        setElapsed((prev) => prev + 1);
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  const totalSeconds = 90 * 60;
  const progress = Math.min((elapsed / totalSeconds) * 100, 100);
  const remaining = Math.max(totalSeconds - elapsed, 0);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const handleEnd = () => {
    const duracaoReal = Math.round(elapsed / 60);
    store.completeSessao(sessaoId, duracaoReal, notas);
    toast.success(`Sessão concluída! ${duracaoReal} minutos de estudo.`);
    onEnd();
  };

  if (!tema || !sessao) return null;

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      <button onClick={onEnd} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3 h-3" /> Voltar (sessão será salva)
      </button>

      {/* Timer Card */}
      <Card className="card-famp glow-teal">
        <CardContent className="p-6 text-center">
          <p className="text-xs text-muted-foreground mb-1">{tema.tema}</p>
          <h2 className="text-4xl font-bold font-mono text-primary mb-2">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </h2>
          <Progress value={progress} className="h-2 mb-4 max-w-xs mx-auto" />
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? 'Retomar' : 'Pausar'}
            </Button>
            <Button
              size="sm"
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleEnd}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Finalizar Sessão
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 font-mono">
            {formatMinutes(Math.round(elapsed / 60))} decorridos · Meta: 90min
          </p>
        </CardContent>
      </Card>

      {/* Etapas Checklist */}
      <Card className="card-famp">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            <ListChecks className="w-4 h-4 inline mr-1.5 text-primary" />
            Checklist da Sessão
          </h3>
          <div className="space-y-2">
            {etapas.map((etapa: any) => {
              const cfg = ETAPA_LABELS[etapa.tipo as EtapaEstudo];
              const Icon = cfg.icon;
              return (
                <div
                  key={etapa.id}
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                    etapa.status === 'concluido' ? 'bg-emerald-500/5' : 'hover:bg-muted/20'
                  }`}
                >
                  <button
                    onClick={() => {
                      store.toggleEtapa(etapa.id);
                      toast.success(
                        etapa.status === 'concluido'
                          ? `${cfg.label} desmarcado`
                          : `${cfg.label} concluído!`
                      );
                    }}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      etapa.status === 'concluido'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-border hover:border-primary'
                    }`}
                  >
                    {etapa.status === 'concluido' && <Check className="w-3 h-3" />}
                  </button>
                  <Icon className={`w-4 h-4 ${etapa.status === 'concluido' ? 'text-emerald-400' : cfg.color}`} />
                  <span className={`text-sm flex-1 ${etapa.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card className="card-famp">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            <StickyNote className="w-4 h-4 inline mr-1.5 text-primary" />
            Anotações da Sessão
          </h3>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Registre dúvidas, insights, pontos de dificuldade..."
            rows={4}
            className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TIMELINE VIEW
// ═══════════════════════════════════════════════════════════════
function TimelineView({ store, onBack, onOpenTema }: any) {
  const timeline = store.getTimeline();
  const todayStr = new Date().toISOString().split('T')[0];

  // Group by month
  const grouped = useMemo(() => {
    const groups: Record<string, typeof timeline> = {};
    timeline.forEach((item: any) => {
      const d = new Date(item.date + 'T12:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [timeline]);

  const monthLabel = (key: string) => {
    const [y, m] = key.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3 h-3" /> Voltar
      </button>

      <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        <CalendarDays className="w-5 h-5 inline mr-2 text-primary" />
        Timeline de Revisões
      </h2>

      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 capitalize">
            {monthLabel(month)}
          </h3>
          <div className="space-y-1.5">
            {(items as any[]).map((item: any) => {
              const isToday = item.date === todayStr;
              const statusCfg = STATUS_CONFIG[item.status as PlannerItemStatus];

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors cursor-pointer hover:border-primary/40 ${
                    isToday ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-card/50'
                  }`}
                  onClick={() => onOpenTema(item.temaId)}
                >
                  <span className={`text-xs font-mono w-16 shrink-0 ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {formatDate(item.date)}
                  </span>
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold font-mono ${
                    item.type === 'revisao'
                      ? item.status === 'concluido' ? 'bg-emerald-500/15 text-emerald-400'
                        : item.status === 'atrasado' ? 'bg-red-500/15 text-red-400'
                        : 'bg-primary/10 text-primary'
                      : item.status === 'concluido' ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {item.label.split(' — ')[0]}
                  </div>
                  <span className="text-xs flex-1 truncate">{item.label.split(' — ')[1]}</span>
                  <span className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {timeline.length === 0 && (
        <Card className="card-famp">
          <CardContent className="p-8 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma revisão agendada</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Adicione temas para gerar a timeline de revisões.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HISTORY VIEW
// ═══════════════════════════════════════════════════════════════
function HistoryView({ store, onBack, onOpenTema }: any) {
  const sessoes = [...store.sessoes].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-3 h-3" /> Voltar
      </button>

      <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        <History className="w-5 h-5 inline mr-2 text-primary" />
        Histórico de Sessões
      </h2>

      {sessoes.length === 0 ? (
        <Card className="card-famp">
          <CardContent className="p-8 text-center">
            <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma sessão no histórico</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Suas sessões de estudo aparecerão aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessoes.map((s: any) => {
            const tema = store.temas.find((t: any) => t.id === s.temaId);
            return (
              <Card
                key={s.id}
                className="card-famp cursor-pointer"
                onClick={() => onOpenTema(s.temaId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{s.titulo}</p>
                      {tema && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{tema.area}</span>
                          <span className="text-[10px] text-muted-foreground">{tema.especialidade}</span>
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      s.status === 'concluida' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {s.status === 'concluida' ? 'Concluída' : 'Em andamento'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                    <span><Calendar className="w-3 h-3 inline mr-1" />{formatDate(s.dataInicio.split('T')[0])}</span>
                    <span><Clock className="w-3 h-3 inline mr-1" />{s.duracaoReal ? formatMinutes(s.duracaoReal) : formatMinutes(s.duracaoMinutos)}</span>
                    <span><ListChecks className="w-3 h-3 inline mr-1" />{s.etapasCompletadas.length} etapas</span>
                  </div>
                  {s.notas && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/20 rounded p-2 border border-border/30 line-clamp-2">
                      {s.notas}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
