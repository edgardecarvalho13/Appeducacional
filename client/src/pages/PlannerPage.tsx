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
  SkipForward,
  StickyNote,
  Save,
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
} from '@/data/plano-ensino';
import type { TemaAula } from '@/data/plano-ensino';

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

type ViewMode = 'overview' | 'tema_detail' | 'create_tema' | 'session' | 'timeline' | 'history';

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
  const [activeSessaoId, setActiveSessaoId] = useState<string | null>(null);

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
    setActiveSessaoId(null);
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
          onStartSession={(id: string) => {
            setActiveSessaoId(id);
            setView('session');
          }}
        />
      )}
      {view === 'create_tema' && (
        <CreateTemaView store={store} onBack={goBack} onCreated={(id: string) => {
          setSelectedTemaId(id);
          setView('tema_detail');
        }} />
      )}
      {view === 'session' && activeSessaoId && selectedTemaId && (
        <SessionView
          store={store}
          sessaoId={activeSessaoId}
          temaId={selectedTemaId}
          onEnd={goBack}
        />
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
function TemaDetailView({ store, temaId, onBack, onStartSession }: any) {
  const tema = store.temas.find((t: any) => t.id === temaId);
  const etapas = store.getEtapasForTema(temaId);
  const revisoes = store.getRevisoesForTema(temaId);
  const testes = store.getTestesForTema(temaId);
  const sessoes = store.getSessoesForTema(temaId);
  const [activeTab, setActiveTab] = useState<'etapas' | 'revisoes' | 'sessoes'>('etapas');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!tema) return null;

  const concluidas = etapas.filter((e: any) => e.status === 'concluido').length;
  const progresso = etapas.length > 0 ? Math.round((concluidas / etapas.length) * 100) : 0;

  const handleStartSession = () => {
    const sessao = store.startSessao(temaId);
    if (sessao) {
      onStartSession(sessao.id);
      toast.success('Sessão de estudo iniciada!');
    }
  };

  const handleDelete = () => {
    store.deleteTema(temaId);
    toast.success('Tema removido');
    onBack();
  };

  return (
    <div className="p-5 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleStartSession}>
            <Play className="w-3.5 h-3.5" /> Iniciar Sessão
          </Button>
          {showDeleteConfirm ? (
            <div className="flex gap-1">
              <Button variant="destructive" size="sm" className="text-xs" onClick={handleDelete}>Confirmar</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="text-xs gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/5" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-3.5 h-3.5" /> Remover
            </Button>
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
          { key: 'etapas', label: 'Etapas', icon: ListChecks, count: `${concluidas}/${etapas.length}` },
          { key: 'revisoes', label: 'Revisões & TAs', icon: RotateCcw, count: `${revisoes.filter((r: any) => r.status === 'concluido').length + testes.filter((t: any) => t.status === 'concluido').length}/${revisoes.length + testes.length}` },
          { key: 'sessoes', label: 'Sessões', icon: Timer, count: String(sessoes.length) },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-[1px] ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className="font-mono text-[10px] bg-muted/50 px-1 py-0.5 rounded">{tab.count}</span>
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

            return (
              <Card key={etapa.id} className="card-famp">
                <CardContent className="p-3 flex items-center gap-3">
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
                  {etapa.status !== 'concluido' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1 h-7"
                      onClick={() => {
                        store.completeEtapa(etapa.id);
                        toast.success(`${cfg.label} concluído!`);
                      }}
                    >
                      <Check className="w-3 h-3" /> Concluir
                    </Button>
                  )}
                  {etapa.status === 'concluido' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'revisoes' && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Revisões Espaçadas (R1-R10)</h4>
          {revisoes.map((rev: any) => {
            const statusCfg = STATUS_CONFIG[rev.status as PlannerItemStatus];
            return (
              <Card key={rev.id} className="card-famp">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                    rev.status === 'concluido' ? 'bg-emerald-500/15 text-emerald-400'
                    : rev.status === 'atrasado' ? 'bg-red-500/15 text-red-400'
                    : 'bg-primary/10 text-primary'
                  }`}>
                    {rev.tipo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{rev.tipo}</p>
                      <span className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>{formatDate(rev.dataAgendada)}</span>
                      {rev.tecnicaUsada && <span>· {rev.tecnicaUsada}</span>}
                      {rev.valor && <span>· {rev.valor} questões</span>}
                    </div>
                  </div>
                  {(rev.status === 'pendente' || rev.status === 'atrasado') && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 h-7"
                        onClick={() => {
                          store.completeRevisao(rev.id, 'questões');
                          toast.success(`${rev.tipo} concluída!`);
                        }}
                      >
                        <Check className="w-3 h-3" /> Feito
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-muted-foreground"
                        onClick={() => {
                          store.skipRevisao(rev.id);
                          toast.info(`${rev.tipo} pulada`);
                        }}
                      >
                        <SkipForward className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {rev.status === 'concluido' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {rev.status === 'pulado' && <SkipForward className="w-4 h-4 text-muted-foreground/40 shrink-0" />}
                </CardContent>
              </Card>
            );
          })}

          {testes.length > 0 && (
            <>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">Testes Aleatórios</h4>
              {testes.map((ta: any) => {
                const statusCfg = STATUS_CONFIG[ta.status as PlannerItemStatus];
                return (
                  <Card key={ta.id} className="card-famp">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold font-mono ${
                        ta.status === 'concluido' ? 'bg-emerald-500/15 text-emerald-400'
                        : ta.status === 'atrasado' ? 'bg-red-500/15 text-red-400'
                        : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        TA{ta.numero}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Teste Aleatório {ta.numero}</p>
                          <span className={`text-[10px] ${statusCfg.color}`}>{statusCfg.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <span>{formatDate(ta.dataAgendada)}</span>
                          {ta.questoesFeitas && <span>· {ta.questoesFeitas} questões</span>}
                        </div>
                      </div>
                      {(ta.status === 'pendente' || ta.status === 'atrasado') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1 h-7"
                          onClick={() => {
                            store.completeTeste(ta.id, 10);
                            toast.success(`TA${ta.numero} concluído!`);
                          }}
                        >
                          <Check className="w-3 h-3" /> Feito
                        </Button>
                      )}
                      {ta.status === 'concluido' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}

      {activeTab === 'sessoes' && (
        <div className="space-y-2">
          {sessoes.length === 0 ? (
            <Card className="card-famp">
              <CardContent className="p-6 text-center">
                <Timer className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma sessão registrada</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Inicie uma sessão de 90 minutos para começar.</p>
              </CardContent>
            </Card>
          ) : (
            sessoes.map((s: any) => (
              <Card key={s.id} className="card-famp">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{s.titulo}</p>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      s.status === 'concluida' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {s.status === 'concluida' ? 'Concluída' : 'Em andamento'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                    <span>{formatDate(s.dataInicio.split('T')[0])}</span>
                    <span>· {s.duracaoReal ? formatMinutes(s.duracaoReal) : formatMinutes(s.duracaoMinutos)}</span>
                    <span>· {s.etapasCompletadas.length} etapas</span>
                  </div>
                  {s.notas && (
                    <p className="text-xs text-muted-foreground mt-2 bg-muted/20 rounded p-2 border border-border/30">
                      {s.notas}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
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

  // Dados do plano de ensino
  const areas = PLANO_ENSINO.map(a => a.nome);
  const especialidadesDisponiveis = useMemo(() => {
    if (!form.area) return [];
    return getEspecialidades(form.area);
  }, [form.area]);

  const semanasDisponiveis = useMemo(() => {
    if (!form.area || !form.especialidade) return [];
    return getSemanasDisponiveis(form.area, form.especialidade);
  }, [form.area, form.especialidade]);

  const temasDisponiveis = useMemo(() => {
    if (!form.area || !form.especialidade || !form.semana) return [];
    return getTemasParaSemana(form.area, form.especialidade, form.semana);
  }, [form.area, form.especialidade, form.semana]);

  const semanaEspecial = useMemo(() => {
    if (!form.semana) return null;
    return isSemanaEspecial(form.semana);
  }, [form.semana]);

  // Reset cascading fields when parent changes
  const handleAreaChange = (area: string) => {
    setForm({ ...form, area, especialidade: '', tema: '', semana: 0 });
  };

  const handleEspecialidadeChange = (especialidade: string) => {
    setForm({ ...form, especialidade, tema: '', semana: 0 });
  };

  const handleSemanaChange = (semana: number) => {
    setForm({ ...form, semana, tema: '' });
  };

  const handleSubmit = () => {
    if (!form.area || !form.tema || !form.dataBase) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const tema = store.addTema(form);
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
            Selecione a grande área e especialidade para ver os temas do plano de ensino. O sistema calcula automaticamente as 10 revisões espaçadas (R1-R10) e os testes aleatórios.
          </p>

          {/* Grande Área */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Grande Área *</label>
            <select
              value={form.area}
              onChange={(e) => handleAreaChange(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Selecione a grande área...</option>
              {areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Especialidade — dropdown filtrado pela grande área */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Especialidade *</label>
            {form.area && especialidadesDisponiveis.length > 0 ? (
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
                {form.area ? 'Nenhuma especialidade cadastrada' : 'Selecione uma grande área primeiro'}
              </div>
            )}
          </div>

          {/* Semana — dropdown filtrado pela especialidade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Semana *</label>
              {form.especialidade && semanasDisponiveis.length > 0 ? (
                <select
                  value={form.semana || ''}
                  onChange={(e) => handleSemanaChange(parseInt(e.target.value) || 0)}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  {semanasDisponiveis.map((s) => {
                    const especial = isSemanaEspecial(s);
                    return (
                      <option key={s} value={s} disabled={!!especial}>
                        Semana {s}{especial ? ` — ${especial.label}` : ''}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="w-full h-9 rounded-md border border-border bg-input/50 px-3 text-sm flex items-center text-muted-foreground">
                  {form.especialidade ? 'Sem semanas' : 'Selecione a especialidade'}
                </div>
              )}
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

          {/* Tema da Aula — dropdown com temas do plano de ensino */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tema da Aula *</label>
            {form.semana > 0 && temasDisponiveis.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={form.tema}
                  onChange={(e) => setForm({ ...form, tema: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione o tema da aula...</option>
                  {temasDisponiveis.map((t: TemaAula, i: number) => (
                    <option key={i} value={t.nome}>{t.nome}</option>
                  ))}
                </select>
                {/* Mostrar descrição do tema selecionado */}
                {form.tema && (() => {
                  const temaInfo = temasDisponiveis.find((t: TemaAula) => t.nome === form.tema);
                  return temaInfo?.descricao ? (
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5">
                      <p className="text-[11px] text-muted-foreground">
                        <BookOpen className="w-3 h-3 inline mr-1 text-primary" />
                        {temaInfo.descricao}
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

          {/* Temas disponíveis nesta semana (preview) */}
          {form.semana > 0 && form.especialidade && temasDisponiveis.length > 0 && (
            <div className="rounded-md border border-border/50 bg-muted/20 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Conteúdo da Semana {form.semana} — {form.especialidade}
              </p>
              <div className="space-y-1">
                {temasDisponiveis.map((t: TemaAula, i: number) => (
                  <div
                    key={i}
                    onClick={() => setForm({ ...form, tema: t.nome })}
                    className={`text-[11px] px-2 py-1.5 rounded cursor-pointer transition-colors ${
                      form.tema === t.nome
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-foreground/80 hover:bg-muted/50'
                    }`}
                  >
                    <span className="mr-1.5">{'•'}</span>
                    {t.nome}
                    {t.descricao && (
                      <span className="text-muted-foreground ml-1">— {t.descricao}</span>
                    )}
                  </div>
                ))}
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
                      if (etapa.status !== 'concluido') {
                        store.completeEtapa(etapa.id);
                        toast.success(`${cfg.label} concluído!`);
                      }
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
