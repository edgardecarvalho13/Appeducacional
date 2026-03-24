/**
 * Caderno de Erros — Formato Tabela com Taxonomia C1-C4
 * Design: Command Center dark theme with red accent.
 *
 * Colunas: Data | Grande Área | Especialidade | Taxonomia (C1-C4) |
 *          Porque Errei (auto) | Pergunta | Resposta Correta | Sua Anotação
 *
 * Taxonomia de Erros:
 *   C1 = Conceitual/algoritmo
 *   C2 = Discriminação clínica
 *   C3 = Atenção/leitura
 *   C4 = Estratégia de prova
 */

import { useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Filter,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Trash2,
  XCircle,
  X,
  Download,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useQuestStore, TAXONOMIA_LABELS, type CadernoErroEntry, type TaxonomiaErro } from '@/hooks/useQuestStore';
import { toast } from 'sonner';

export default function CadernoErrosPage() {
  const {
    cadernoErros,
    updateCadernoAnotacao,
    updateCadernoTaxonomia,
    toggleCadernoRevisado,
    removeCadernoEntry,
  } = useQuestStore();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterTaxonomia, setFilterTaxonomia] = useState('');
  const [filterRevisado, setFilterRevisado] = useState<'all' | 'pending' | 'done'>('all');

  // Editing state
  const [editingAnotacaoId, setEditingAnotacaoId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [expandedEnunciadoId, setExpandedEnunciadoId] = useState<string | null>(null);
  const [showTaxonomiaInfo, setShowTaxonomiaInfo] = useState(false);

  // Unique areas
  const areas = useMemo(() => {
    const set = new Set<string>();
    cadernoErros.forEach(e => set.add(e.area));
    return Array.from(set).sort();
  }, [cadernoErros]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return cadernoErros.filter(e => {
      if (filterArea && e.area !== filterArea) return false;
      if (filterTaxonomia && e.taxonomia !== filterTaxonomia) return false;
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
  }, [cadernoErros, filterArea, filterTaxonomia, filterRevisado, searchTerm]);

  // Stats
  const totalErros = cadernoErros.length;
  const pendentes = cadernoErros.filter(e => !e.revisado).length;
  const revisados = cadernoErros.filter(e => e.revisado).length;
  const semTaxonomia = cadernoErros.filter(e => !e.taxonomia).length;

  // Handlers
  const handleStartEditAnotacao = useCallback((entry: CadernoErroEntry) => {
    setEditingAnotacaoId(entry.id);
    setEditText(entry.anotacao);
  }, []);

  const handleSaveAnotacao = useCallback((entryId: string) => {
    updateCadernoAnotacao(entryId, editText);
    setEditingAnotacaoId(null);
    toast.success('Anotação salva!');
  }, [editText, updateCadernoAnotacao]);

  const handleTaxonomiaChange = useCallback((entryId: string, value: string) => {
    const tax = value === '' ? null : value as TaxonomiaErro;
    updateCadernoTaxonomia(entryId, tax);
    toast.success(`Taxonomia ${value ? value : 'removida'}`);
  }, [updateCadernoTaxonomia]);

  const handleRemove = useCallback((entryId: string) => {
    removeCadernoEntry(entryId);
    toast.success('Questão removida do caderno.');
  }, [removeCadernoEntry]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getPorqueErrei = (taxonomia: TaxonomiaErro): string => {
    if (!taxonomia) return '—';
    return TAXONOMIA_LABELS[taxonomia]?.descricao || '—';
  };

  const getTaxonomiaColor = (tax: TaxonomiaErro) => {
    switch (tax) {
      case 'C1': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'C2': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'C3': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'C4': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-muted-foreground bg-muted/30 border-border';
    }
  };

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = ['Data', 'Grande Área', 'Especialidade', 'Taxonomia', 'Porque Errei', 'Pergunta', 'Resposta Correta', 'Sua Anotação', 'Revisado'];
    const rows = filteredEntries.map(e => [
      formatDate(e.dataResposta),
      e.area,
      e.subarea,
      e.taxonomia || '',
      getPorqueErrei(e.taxonomia),
      `"${e.enunciado.replace(/"/g, '""')}"`,
      `${e.respostaCerta} - ${e.respostaCertaTexto}`,
      `"${e.anotacao.replace(/"/g, '""')}"`,
      e.revisado ? 'Sim' : 'Não',
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caderno-erros-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado!');
  }, [filteredEntries]);

  return (
    <DashboardLayout title="Caderno de Erros" subtitle="Revisão de questões erradas">
      <div className="p-5 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/quest">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-3 h-3" /> Voltar ao FAMP Quest
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTaxonomiaInfo(!showTaxonomiaInfo)}
              className="text-xs gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              Taxonomia C1-C4
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              disabled={filteredEntries.length === 0}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* Taxonomia Info Panel */}
        {showTaxonomiaInfo && (
          <Card className="mb-4 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  Taxonomia de Erros (C1-C4)
                </h4>
                <button onClick={() => setShowTaxonomiaInfo(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Use para classificar seus erros e identificar padrões.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(TAXONOMIA_LABELS).map(([key, { nome, descricao }]) => (
                  <div key={key} className={`p-3 rounded-lg border ${getTaxonomiaColor(key as TaxonomiaErro)}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold font-mono">{key}</span>
                      <span className="text-xs font-semibold">{nome}</span>
                    </div>
                    <p className="text-[11px] opacity-80">{descricao}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
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
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              Sem Taxonomia
            </div>
            <p className="text-xl font-bold text-blue-400" style={{ fontFamily: 'var(--font-display)' }}>{semTaxonomia}</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="card-famp mb-5">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
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
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas as áreas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <select
                value={filterTaxonomia}
                onChange={(e) => setFilterTaxonomia(e.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas taxonomias</option>
                <option value="C1">C1 — Conceitual</option>
                <option value="C2">C2 — Discriminação</option>
                <option value="C3">C3 — Atenção</option>
                <option value="C4">C4 — Estratégia</option>
              </select>
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
          <p className="text-xs text-muted-foreground mb-3">
            Mostrando <span className="text-foreground font-semibold">{filteredEntries.length}</span> de {totalErros} erros
          </p>
        )}

        {/* TABLE FORMAT */}
        {filteredEntries.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap">Data</th>
                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap">Grande Área</th>
                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap">Especialidade</th>
                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap">Taxonomia</th>
                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap min-w-[180px]">Porque Errei</th>
                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap min-w-[250px]">Pergunta</th>
                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap min-w-[200px]">Resposta Correta</th>
                  <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap min-w-[200px]">Sua Anotação</th>
                  <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const isEditingAnotacao = editingAnotacaoId === entry.id;
                  const isExpandedEnunciado = expandedEnunciadoId === entry.id;

                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-border/50 hover:bg-muted/10 transition-colors ${
                        entry.revisado ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Data */}
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {formatDate(entry.dataResposta)}
                      </td>

                      {/* Grande Área */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
                          {entry.area}
                        </span>
                      </td>

                      {/* Especialidade */}
                      <td className="px-3 py-2.5 whitespace-nowrap text-foreground">
                        {entry.subarea}
                      </td>

                      {/* Taxonomia C1-C4 */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <select
                          value={entry.taxonomia || ''}
                          onChange={(e) => handleTaxonomiaChange(entry.id, e.target.value)}
                          className={`h-7 rounded border px-2 text-[11px] font-mono font-bold focus:ring-1 focus:ring-primary cursor-pointer ${getTaxonomiaColor(entry.taxonomia)}`}
                        >
                          <option value="">—</option>
                          <option value="C1">C1</option>
                          <option value="C2">C2</option>
                          <option value="C3">C3</option>
                          <option value="C4">C4</option>
                        </select>
                      </td>

                      {/* Porque Errei (auto-preenchido pela taxonomia) */}
                      <td className="px-3 py-2.5 text-muted-foreground">
                        <span className="text-[11px] leading-tight">
                          {getPorqueErrei(entry.taxonomia)}
                        </span>
                      </td>

                      {/* Pergunta (enunciado) */}
                      <td className="px-3 py-2.5">
                        <div className="relative">
                          <p className={`text-foreground text-[11px] leading-tight ${isExpandedEnunciado ? '' : 'line-clamp-3'}`}>
                            {entry.enunciado}
                          </p>
                          {entry.enunciado.length > 150 && (
                            <button
                              onClick={() => setExpandedEnunciadoId(isExpandedEnunciado ? null : entry.id)}
                              className="text-primary text-[10px] hover:underline mt-0.5 flex items-center gap-0.5"
                            >
                              <ChevronDown className={`w-3 h-3 transition-transform ${isExpandedEnunciado ? 'rotate-180' : ''}`} />
                              {isExpandedEnunciado ? 'Recolher' : 'Expandir'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Resposta Correta */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-1.5">
                          <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold mt-0.5">
                            {entry.respostaCerta}
                          </span>
                          <span className="text-foreground text-[11px] leading-tight">
                            {entry.respostaCertaTexto}
                          </span>
                        </div>
                      </td>

                      {/* Sua Anotação */}
                      <td className="px-3 py-2.5">
                        {isEditingAnotacao ? (
                          <div className="flex flex-col gap-1.5">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              placeholder="Explique por que esta é a resposta correta..."
                              className="w-full h-16 p-2 rounded border border-border bg-background text-[11px] text-foreground resize-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSaveAnotacao(entry.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/20 text-primary text-[10px] hover:bg-primary/30 transition-colors"
                              >
                                <Save className="w-3 h-3" /> Salvar
                              </button>
                              <button
                                onClick={() => setEditingAnotacaoId(null)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted/30 text-muted-foreground text-[10px] hover:bg-muted/50 transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEditAnotacao(entry)}
                            className="cursor-pointer group"
                          >
                            {entry.anotacao ? (
                              <p className="text-foreground text-[11px] leading-tight group-hover:text-primary transition-colors">
                                {entry.anotacao}
                              </p>
                            ) : (
                              <span className="text-muted-foreground/40 text-[11px] italic group-hover:text-primary/60 transition-colors flex items-center gap-1">
                                <Pencil className="w-3 h-3" /> Clique para anotar
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => toggleCadernoRevisado(entry.id)}
                            title={entry.revisado ? 'Marcar como pendente' : 'Marcar como revisado'}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                              entry.revisado
                                ? 'text-green-400 hover:bg-green-500/10'
                                : 'text-muted-foreground hover:bg-muted/30 hover:text-green-400'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemove(entry.id)}
                            title="Remover do caderno"
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
