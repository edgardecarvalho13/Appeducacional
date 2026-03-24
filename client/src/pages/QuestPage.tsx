/**
 * FAMP Quest — Banco de Questões
 * Design: Command Center dark theme with teal accent.
 * Features: Filtros avançados (Grande Área, Especialidade, Tema, Dificuldade, Bloom, Período),
 *           resolução interativa SEM indicadores visíveis, progresso salvo em localStorage,
 *           importação CSV/XLSX, integração com Caderno de Erros.
 *
 * TERMINOLOGIA:
 *   area      = Grande Área
 *   subarea   = Especialidade
 *   conteudo  = Tema
 */

import { useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Filter,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  Target,
  Brain,
  Trophy,
  Shuffle,
  ListFilter,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  GraduationCap,
  Upload,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { useQuestStore, type Question } from '@/hooks/useQuestStore';
import ImportQuestionsModal from '@/components/ImportQuestionsModal';
import { toast } from 'sonner';

type ViewMode = 'filters' | 'list' | 'question';

function getUniqueValues(questions: Question[], key: keyof Question): string[] {
  const set = new Set<string>();
  questions.forEach((q) => {
    const val = q[key];
    if (typeof val === 'string' && val) set.add(val);
  });
  return Array.from(set).sort();
}

/* ─── Component ─── */
export default function QuestPage() {
  const { allQuestions: questions, progress, saveAnswer, importQuestions, stats } = useQuestStore();

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);

  // Filter state
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedSubarea, setSelectedSubarea] = useState<string>('');
  const [selectedTema, setSelectedTema] = useState<string>('');
  const [selectedDificuldade, setSelectedDificuldade] = useState<string>('');
  const [selectedBloom, setSelectedBloom] = useState<string>('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('');
  const [selectedCompetencia, setSelectedCompetencia] = useState<string>('');
  const [showOnlyUnanswered, setShowOnlyUnanswered] = useState(false);
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('filters');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Filter options
  const areas = useMemo(() => getUniqueValues(questions, 'area'), [questions]);
  const subareas = useMemo(() => {
    if (!selectedArea) return getUniqueValues(questions, 'subarea');
    const set = new Set<string>();
    questions.filter(q => q.area === selectedArea).forEach(q => set.add(q.subarea));
    return Array.from(set).sort();
  }, [selectedArea, questions]);
  const temas = useMemo(() => {
    let filtered = questions;
    if (selectedArea) filtered = filtered.filter(q => q.area === selectedArea);
    if (selectedSubarea) filtered = filtered.filter(q => q.subarea === selectedSubarea);
    const set = new Set<string>();
    filtered.forEach(q => { if (q.conteudo) set.add(q.conteudo); });
    return Array.from(set).sort();
  }, [selectedArea, selectedSubarea, questions]);
  const dificuldades = useMemo(() => getUniqueValues(questions, 'dificuldade'), [questions]);
  // Bloom: 6 níveis fixos conforme taxonomia de Bloom
  const blooms = useMemo(() => ['Lembrar', 'Compreender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar'], []);
  // Períodos: 1º ao 8º
  const periodos = useMemo(() => ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º'], []);
  // Competências fixas
  const competencias = useMemo(() => ['Atenção à Saúde', 'Tomada de Decisões', 'Comunicação', 'Liderança', 'Gerenciamento e Administração', 'Formação Continuada'], []);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedArea && q.area !== selectedArea) return false;
      if (selectedSubarea && q.subarea !== selectedSubarea) return false;
      if (selectedTema && q.conteudo !== selectedTema) return false;
      if (selectedDificuldade && q.dificuldade !== selectedDificuldade) return false;
      if (selectedBloom && q.nivel_bloom !== selectedBloom) return false;
      if (selectedPeriodo && q.periodo !== selectedPeriodo) return false;
      if (selectedCompetencia && q.competencias !== selectedCompetencia) return false;
      if (showOnlyUnanswered && progress[q.id]) return false;
      if (showOnlyWrong && (!progress[q.id] || progress[q.id].isCorrect !== false)) return false;
      return true;
    });
  }, [questions, selectedArea, selectedSubarea, selectedTema, selectedDificuldade, selectedBloom, selectedPeriodo, selectedCompetencia, showOnlyUnanswered, showOnlyWrong, progress]);

  const currentQuestion = filteredQuestions[currentQuestionIdx];

  // Handlers
  const clearFilters = useCallback(() => {
    setSelectedArea('');
    setSelectedSubarea('');
    setSelectedTema('');
    setSelectedDificuldade('');
    setSelectedBloom('');
    setSelectedPeriodo('');
    setSelectedCompetencia('');
    setShowOnlyUnanswered(false);
    setShowOnlyWrong(false);
  }, []);

  const startQuiz = useCallback(() => {
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setViewMode('question');
  }, []);

  const shuffleAndStart = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * filteredQuestions.length);
    setCurrentQuestionIdx(randomIdx);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setViewMode('question');
  }, [filteredQuestions.length]);

  const handleAnswer = useCallback((letter: string) => {
    if (showResult) return;
    setSelectedAnswer(letter);
  }, [showResult]);

  const confirmAnswer = useCallback(() => {
    if (!selectedAnswer || !currentQuestion) return;
    const isCorrect = selectedAnswer === currentQuestion.gabarito;
    saveAnswer(currentQuestion.id, selectedAnswer, isCorrect);
    setShowResult(true);
    if (!isCorrect) {
      toast.info('Questão adicionada ao Caderno de Erros', {
        action: {
          label: 'Ver caderno',
          onClick: () => window.location.href = '/caderno-erros',
        },
      });
    }
  }, [selectedAnswer, currentQuestion, saveAnswer]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIdx < filteredQuestions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    }
  }, [currentQuestionIdx, filteredQuestions.length]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    }
  }, [currentQuestionIdx]);

  const goToQuestion = useCallback((idx: number) => {
    setCurrentQuestionIdx(idx);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setViewMode('question');
  }, []);

  const activeFilterCount = [selectedArea, selectedSubarea, selectedTema, selectedDificuldade, selectedBloom, selectedPeriodo, selectedCompetencia].filter(Boolean).length
    + (showOnlyUnanswered ? 1 : 0) + (showOnlyWrong ? 1 : 0);

  // ─── RENDER: Filters Panel ───
  const renderFilters = () => (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft className="w-3 h-3" /> Voltar ao Dashboard
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/desempenho">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" /> Desempenho
            </Button>
          </Link>
          <Link href="/caderno-erros">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/5">
              <BookOpen className="w-3.5 h-3.5" />
              Caderno de Erros
              {stats.pendingErrors > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold">
                  {stats.pendingErrors}
                </span>
              )}
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportModal(true)}
            className="text-xs gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Importar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-famp mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Filtros</h3>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-mono">
                  {activeFilterCount} ativo{activeFilterCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <RotateCcw className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1 block">Grande Área</label>
              <select
                value={selectedArea}
                onChange={(e) => { setSelectedArea(e.target.value); setSelectedSubarea(''); setSelectedTema(''); }}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas as grandes áreas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1 block">Especialidade</label>
              <select
                value={selectedSubarea}
                onChange={(e) => { setSelectedSubarea(e.target.value); setSelectedTema(''); }}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas as especialidades</option>
                {subareas.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1 block">Tema</label>
              <select
                value={selectedTema}
                onChange={(e) => setSelectedTema(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todos os temas</option>
                {temas.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1 block">Dificuldade</label>
              <select
                value={selectedDificuldade}
                onChange={(e) => setSelectedDificuldade(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas</option>
                {dificuldades.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1 block">Nível Cognitivo</label>
              <select
                value={selectedBloom}
                onChange={(e) => setSelectedBloom(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todos</option>
                {blooms.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1 block">Período</label>
              <select
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todos</option>
                {periodos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1 block">Competência</label>
              <select
                value={selectedCompetencia}
                onChange={(e) => setSelectedCompetencia(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas</option>
                {competencias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Toggle filters */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
            <button
              onClick={() => { setShowOnlyUnanswered(!showOnlyUnanswered); setShowOnlyWrong(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors border ${
                showOnlyUnanswered
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              }`}
            >
              <Clock className="w-3 h-3" />
              Apenas não respondidas
            </button>
            <button
              onClick={() => { setShowOnlyWrong(!showOnlyWrong); setShowOnlyUnanswered(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors border ${
                showOnlyWrong
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
              }`}
            >
              <XCircle className="w-3 h-3" />
              Apenas erradas
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Results count + actions */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{filteredQuestions.length}</span> questões encontradas
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('list')}
            className="text-xs gap-1.5"
          >
            <ListFilter className="w-3.5 h-3.5" />
            Ver lista
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={shuffleAndStart}
            disabled={filteredQuestions.length === 0}
            className="text-xs gap-1.5"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Aleatório
          </Button>
          <Button
            size="sm"
            onClick={startQuiz}
            disabled={filteredQuestions.length === 0}
            className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FileQuestion className="w-3.5 h-3.5" />
            Iniciar
          </Button>
        </div>
      </div>

      {/* Quick area cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {areas.map((area) => {
          const count = questions.filter(q => q.area === area).length;
          const answered = questions.filter(q => q.area === area && progress[q.id]).length;
          const correct = questions.filter(q => q.area === area && progress[q.id]?.isCorrect).length;
          return (
            <button
              key={area}
              onClick={() => { setSelectedArea(area); setSelectedSubarea(''); setSelectedTema(''); }}
              className={`text-left p-3 rounded-lg border transition-all hover:border-primary/40 ${
                selectedArea === area ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
            >
              <p className="text-xs font-medium text-foreground truncate mb-1">{area}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{count} questões</p>
              {answered > 0 && (
                <div className="mt-2">
                  <div className="w-full h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(answered / count) * 100}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                    {answered}/{count} · {answered > 0 ? Math.round((correct / answered) * 100) : 0}% acerto
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── RENDER: List View ───
  const renderList = () => (
    <div className="p-5 max-w-5xl mx-auto">
      <button
        onClick={() => setViewMode('filters')}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Voltar aos filtros
      </button>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          {filteredQuestions.length} questões
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={shuffleAndStart} className="text-xs gap-1.5">
            <Shuffle className="w-3.5 h-3.5" /> Aleatório
          </Button>
          <Button size="sm" onClick={startQuiz} className="text-xs gap-1.5 bg-primary text-primary-foreground">
            <FileQuestion className="w-3.5 h-3.5" /> Iniciar do começo
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredQuestions.map((q, idx) => {
          const p = progress[q.id];
          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(idx)}
              className="w-full text-left p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-all flex items-start gap-3"
            >
              <div className="shrink-0 w-8 h-8 rounded-md bg-background border border-border flex items-center justify-center text-xs font-mono text-muted-foreground">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground line-clamp-2 mb-1">{q.enunciado.slice(0, 150)}...</p>
              </div>
              <div className="shrink-0">
                {p ? (
                  p.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )
                ) : (
                  <AlertCircle className="w-5 h-5 text-muted-foreground/30" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── RENDER: Question View ───
  // IMPORTANTE: Não mostrar indicadores (área, especialidade, dificuldade, bloom, período, número)
  // Apenas enunciado + alternativas. Indicadores ficam SOMENTE nos filtros.
  const renderQuestion = () => {
    if (!currentQuestion) {
      return (
        <div className="p-5 max-w-3xl mx-auto text-center py-20">
          <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Nenhuma questão encontrada com os filtros selecionados.</p>
          <Button variant="outline" size="sm" onClick={() => setViewMode('filters')} className="mt-4">
            Voltar aos filtros
          </Button>
        </div>
      );
    }

    const existingProgress = progress[currentQuestion.id];
    const isAlreadyAnswered = !!existingProgress;

    return (
      <div className="p-5 max-w-3xl mx-auto">
        {/* Navigation bar — apenas navegação, sem indicadores */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewMode('filters')}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Filtros
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {currentQuestionIdx + 1} / {filteredQuestions.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIdx === 0}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextQuestion}
              disabled={currentQuestionIdx >= filteredQuestions.length - 1}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-border mb-5 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentQuestionIdx + 1) / filteredQuestions.length) * 100}%` }}
          />
        </div>

        {/* SEM metadata tags — indicadores removidos conforme solicitado */}

        {/* Question card — apenas enunciado */}
        <Card className="card-famp mb-4">
          <CardContent className="p-5">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {currentQuestion.enunciado}
            </p>
          </CardContent>
        </Card>

        {/* Alternatives */}
        <div className="space-y-2 mb-4">
          {['A', 'B', 'C', 'D', 'E'].map((letter) => {
            const text = currentQuestion.alternativas[letter];
            if (!text) return null;

            const isSelected = selectedAnswer === letter;
            const isCorrectAnswer = letter === currentQuestion.gabarito;
            const showFeedback = showResult || isAlreadyAnswered;

            let borderClass = 'border-border hover:border-primary/40';
            let bgClass = 'bg-card';
            let iconEl = null;

            if (showFeedback) {
              if (isCorrectAnswer) {
                borderClass = 'border-green-500/50';
                bgClass = 'bg-green-500/5';
                iconEl = <Check className="w-4 h-4 text-green-400 shrink-0" />;
              } else if (isSelected && !isCorrectAnswer) {
                borderClass = 'border-red-500/50';
                bgClass = 'bg-red-500/5';
                iconEl = <X className="w-4 h-4 text-red-400 shrink-0" />;
              }
            } else if (isSelected) {
              borderClass = 'border-primary';
              bgClass = 'bg-primary/5';
            }

            return (
              <button
                key={letter}
                onClick={() => !showFeedback && handleAnswer(letter)}
                disabled={showFeedback}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${borderClass} ${bgClass} ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                  isSelected && !showFeedback ? 'bg-primary text-primary-foreground' :
                  showFeedback && isCorrectAnswer ? 'bg-green-500/20 text-green-400' :
                  showFeedback && isSelected ? 'bg-red-500/20 text-red-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {letter}
                </span>
                <span className="text-sm text-foreground flex-1">{text}</span>
                {iconEl}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div>
            {(showResult || isAlreadyAnswered) && (
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {showExplanation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showExplanation ? 'Ocultar detalhes' : 'Ver detalhes'}
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {!showResult && !isAlreadyAnswered && (
              <Button
                size="sm"
                onClick={confirmAnswer}
                disabled={!selectedAnswer}
                className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="w-3.5 h-3.5" />
                Confirmar
              </Button>
            )}
            {(showResult || isAlreadyAnswered) && currentQuestionIdx < filteredQuestions.length - 1 && (
              <Button
                size="sm"
                onClick={nextQuestion}
                className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Próxima
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Result feedback */}
        {showResult && (
          <div className={`mt-4 p-3 rounded-lg border ${
            selectedAnswer === currentQuestion.gabarito
              ? 'bg-green-500/5 border-green-500/30'
              : 'bg-red-500/5 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {selectedAnswer === currentQuestion.gabarito ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">Correto!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-red-400">
                    Incorreto — Gabarito: {currentQuestion.gabarito}
                  </span>
                </>
              )}
            </div>
            {selectedAnswer !== currentQuestion.gabarito && (
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Esta questão foi adicionada ao seu Caderno de Erros para revisão.
              </p>
            )}
          </div>
        )}

        {/* Explanation panel — aparece SOMENTE após responder */}
        {showExplanation && (
          <Card className="mt-4 border-primary/20">
            <CardContent className="p-4">
              <h4 className="text-xs font-semibold text-primary mb-3 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                <GraduationCap className="w-4 h-4" />
                Detalhes da Questão
              </h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>
                  <span className="text-foreground font-medium">Tema:</span> {currentQuestion.conteudo}
                </div>
                <div>
                  <span className="text-foreground font-medium">Objetivo:</span> {currentQuestion.objetivo}
                </div>
                <div>
                  <span className="text-foreground font-medium">Fonte:</span> {currentQuestion.fonte}
                </div>
                <div>
                  <span className="text-foreground font-medium">Competência:</span> {currentQuestion.competencias}
                </div>
                <div>
                  <span className="text-foreground font-medium">Prova:</span> {currentQuestion.prova} ({currentQuestion.ano})
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title="FAMP Quest" subtitle="Banco de Questões">
      {viewMode === 'filters' && renderFilters()}
      {viewMode === 'list' && renderList()}
      {viewMode === 'question' && renderQuestion()}

      {/* Import Modal */}
      <ImportQuestionsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={importQuestions}
      />
    </DashboardLayout>
  );
}
