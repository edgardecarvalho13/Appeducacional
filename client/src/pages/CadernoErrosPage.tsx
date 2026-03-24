/**
 * Caderno de Erros — Review wrong answers
 * Design: Command Center dark theme with red accent for errors.
 * Features: Data, área, subárea, pergunta, resposta certa, espaço para anotação.
 */

import { useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Trash2,
  XCircle,
  Calendar,
  Tag,
  FileText,
} from 'lucide-react';
import { useQuestStore, type CadernoErroEntry } from '@/hooks/useQuestStore';
import { toast } from 'sonner';

export default function CadernoErrosPage() {
  const { cadernoErros, updateCadernoAnotacao, toggleCadernoRevisado, removeCadernoEntry, stats } = useQuestStore();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterRevisado, setFilterRevisado] = useState<'all' | 'pending' | 'done'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Unique areas from caderno entries
  const areas = useMemo(() => {
    const set = new Set<string>();
    cadernoErros.forEach(e => set.add(e.area));
    return Array.from(set).sort();
  }, [cadernoErros]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return cadernoErros.filter(e => {
      if (filterArea && e.area !== filterArea) return false;
      if (filterRevisado === 'pending' && e.revisado) return false;
      if (filterRevisado === 'done' && !e.revisado) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          e.enunciado.toLowerCase().includes(term) ||
          e.area.toLowerCase().includes(term) ||
          e.subarea.toLowerCase().includes(term) ||
          e.anotacao.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [cadernoErros, filterArea, filterRevisado, searchTerm]);

  // Stats
  const totalErros = cadernoErros.length;
  const pendentes = cadernoErros.filter(e => !e.revisado).length;
  const revisados = cadernoErros.filter(e => e.revisado).length;

  // Handlers
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
    setEditingId(null);
  }, []);

  const handleStartEdit = useCallback((entry: CadernoErroEntry) => {
    setEditingId(entry.id);
    setEditText(entry.anotacao);
  }, []);

  const handleSaveEdit = useCallback((entryId: string) => {
    updateCadernoAnotacao(entryId, editText);
    setEditingId(null);
    toast.success('Anotação salva!');
  }, [editText, updateCadernoAnotacao]);

  const handleToggleRevisado = useCallback((entryId: string) => {
    toggleCadernoRevisado(entryId);
  }, [toggleCadernoRevisado]);

  const handleRemove = useCallback((entryId: string) => {
    removeCadernoEntry(entryId);
    toast.success('Questão removida do caderno.');
  }, [removeCadernoEntry]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout title="Caderno de Erros" subtitle="Revisão de questões erradas">
      <div className="p-5 max-w-5xl mx-auto">
        <Link href="/dashboard">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors cursor-pointer">
            <ArrowLeft className="w-3 h-3" /> Voltar ao Dashboard
          </span>
        </Link>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              Total de Erros
            </div>
            <p className="text-xl font-bold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>{totalErros}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
              Pendentes
            </div>
            <p className="text-xl font-bold text-yellow-400" style={{ fontFamily: 'var(--font-display)' }}>{pendentes}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              Revisados
            </div>
            <p className="text-xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>{revisados}</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-famp mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por enunciado, área ou anotação..."
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Area filter */}
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas as áreas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              {/* Status filter */}
              <div className="flex rounded-md border border-border overflow-hidden">
                {[
                  { key: 'all' as const, label: 'Todos' },
                  { key: 'pending' as const, label: 'Pendentes' },
                  { key: 'done' as const, label: 'Revisados' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilterRevisado(key)}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      filterRevisado === key
                        ? 'bg-primary/20 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty state */}
        {cadernoErros.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h4 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Caderno de Erros vazio
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Quando você errar uma questão no FAMP Quest, ela será automaticamente adicionada aqui para revisão.
            </p>
            <Link href="/quest">
              <Button size="sm" className="mt-4 text-xs bg-primary text-primary-foreground">
                Ir para o FAMP Quest
              </Button>
            </Link>
          </div>
        )}

        {/* No results */}
        {cadernoErros.length > 0 && filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma questão encontrada com os filtros aplicados.</p>
          </div>
        )}

        {/* Results count */}
        {filteredEntries.length > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Mostrando <span className="text-foreground font-semibold">{filteredEntries.length}</span> de {totalErros} erros
          </p>
        )}

        {/* Error entries */}
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const isEditing = editingId === entry.id;

            return (
              <Card key={entry.id} className={`border transition-all ${
                entry.revisado
                  ? 'border-green-500/20 bg-green-500/[0.02]'
                  : 'border-red-500/20 bg-red-500/[0.02]'
              }`}>
                <CardContent className="p-0">
                  {/* Header (always visible) */}
                  <button
                    onClick={() => handleToggleExpand(entry.id)}
                    className="w-full text-left p-4 flex items-start gap-3"
                  >
                    {/* Status icon */}
                    <div className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
                      entry.revisado
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {entry.revisado ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Meta tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(entry.dataResposta)} às {formatTime(entry.dataResposta)}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                          {entry.area}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {entry.subarea}
                        </span>
                      </div>

                      {/* Enunciado preview */}
                      <p className={`text-xs text-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {entry.enunciado}
                      </p>

                      {/* Annotation preview (when collapsed) */}
                      {!isExpanded && entry.anotacao && (
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">
                          Anotação: {entry.anotacao}
                        </p>
                      )}
                    </div>

                    {/* Expand icon */}
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3 ml-11">
                      {/* Correct answer */}
                      <div className="mb-4">
                        <h5 className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1.5 flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-400" />
                          Resposta Correta
                        </h5>
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold mr-2">
                            {entry.respostaCerta}
                          </span>
                          <span className="text-sm text-foreground">{entry.respostaCertaTexto}</span>
                        </div>
                      </div>

                      {/* Annotation */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <h5 className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1">
                            <Pencil className="w-3 h-3" />
                            Sua Anotação
                          </h5>
                          {!isEditing && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartEdit(entry); }}
                              className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              {entry.anotacao ? 'Editar' : 'Adicionar'}
                            </button>
                          )}
                        </div>

                        {isEditing ? (
                          <div>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              placeholder="Explique por que esta é a resposta correta..."
                              className="w-full h-24 p-3 rounded-lg border border-border bg-background text-xs text-foreground resize-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(null)}
                                className="text-xs h-7"
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(entry.id)}
                                className="text-xs h-7 gap-1 bg-primary text-primary-foreground"
                              >
                                <Save className="w-3 h-3" />
                                Salvar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-muted/30 border border-border min-h-[48px]">
                            {entry.anotacao ? (
                              <p className="text-xs text-foreground whitespace-pre-wrap">{entry.anotacao}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground/50 italic">
                                Nenhuma anotação. Clique em "Adicionar" para explicar por que esta é a resposta correta.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <button
                          onClick={() => handleRemove(entry.id)}
                          className="text-xs text-red-400/60 hover:text-red-400 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remover
                        </button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRevisado(entry.id)}
                          className={`text-xs h-7 gap-1 ${
                            entry.revisado
                              ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/5'
                              : 'border-green-500/30 text-green-400 hover:bg-green-500/5'
                          }`}
                        >
                          {entry.revisado ? (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              Marcar como pendente
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Marcar como revisado
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
