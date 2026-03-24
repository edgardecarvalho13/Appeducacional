/**
 * Import Questions Modal — CSV/XLSX importer
 * Design: Command Center dark theme.
 * Parses uploaded file, maps columns, previews data, then imports.
 */

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Upload,
  FileSpreadsheet,
  X,
  Check,
  AlertTriangle,
  Download,
  ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Question } from '@/hooks/useQuestStore';
import { toast } from 'sonner';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: Question[]) => number;
}

type Step = 'upload' | 'preview' | 'done';

/* Expected CSV/XLSX columns (flexible matching) */
const COLUMN_MAP: Record<string, keyof Question> = {
  'questao': 'id',
  'questão': 'id',
  'numero': 'id',
  'número': 'id',
  'ano': 'ano',
  'prova': 'prova',
  'curso': 'prova',
  'area': 'area',
  'área': 'area',
  'grande area': 'area',
  'grande área': 'area',
  'subarea': 'subarea',
  'subárea': 'subarea',
  'sub-area': 'subarea',
  'sub-área': 'subarea',
  'especialidade': 'subarea',
  'conteudo': 'conteudo',
  'conteúdo': 'conteudo',
  'tema': 'conteudo',
  'nivel_bloom': 'nivel_bloom',
  'nível cognitivo bloom': 'nivel_bloom',
  'nivelcognitivobloom': 'nivel_bloom',
  'nivel cognitivo': 'nivel_bloom',
  'bloom': 'nivel_bloom',
  'objetivo': 'objetivo',
  'objetivo de aprendizagem': 'objetivo',
  'dificuldade': 'dificuldade',
  'fonte': 'fonte',
  'fonte/diretriz/protocolo': 'fonte',
  'fontediretrizprotocolo': 'fonte',
  'competencias': 'competencias',
  'competências': 'competencias',
  'habilidades e competências avaliadas': 'competencias',
  'habilidadesecompetnciasavaliadasppcfamp': 'competencias',
  'periodo': 'periodo',
  'período': 'periodo',
  'gabarito': 'gabarito',
  'gabarito da questao': 'gabarito',
  'gabaritodaquestao': 'gabarito',
  'gabarito da questão': 'gabarito',
  'enunciado': 'enunciado',
  'alternativa_a': 'alternativas',
  'alternativa_b': 'alternativas',
  'alternativa_c': 'alternativas',
  'alternativa_d': 'alternativas',
  'alternativa_e': 'alternativas',
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function mapColumn(header: string): string | null {
  const norm = normalizeHeader(header);
  // Direct match
  for (const [key, val] of Object.entries(COLUMN_MAP)) {
    if (normalizeHeader(key) === norm) return val;
  }
  // Partial match
  if (norm.includes('area') && !norm.includes('sub')) return 'area';
  if (norm.includes('subarea') || norm.includes('subárea')) return 'subarea';
  if (norm.includes('bloom') || norm.includes('cognitivo')) return 'nivel_bloom';
  if (norm.includes('dificuldade')) return 'dificuldade';
  if (norm.includes('gabarito')) return 'gabarito';
  if (norm.includes('periodo') || norm.includes('período')) return 'periodo';
  if (norm.includes('competencia') || norm.includes('habilidade')) return 'competencias';
  if (norm.includes('fonte') || norm.includes('diretriz')) return 'fonte';
  if (norm.includes('objetivo')) return 'objetivo';
  if (norm.includes('conteudo') || norm.includes('conteúdo')) return 'conteudo';
  if (norm.includes('prova') || norm.includes('curso')) return 'prova';
  if (norm.includes('ano')) return 'ano';
  if (norm.includes('enunciado')) return 'enunciado';
  return null;
}

export default function ImportQuestionsModal({ isOpen, onClose, onImport }: ImportQuestionsModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<Partial<Question>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setFileName('');
    setParsedQuestions([]);
    setErrors([]);
    setImportedCount(0);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const parseFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const errs: string[] = [];

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

      if (rows.length === 0) {
        errs.push('Arquivo vazio ou sem dados válidos.');
        setErrors(errs);
        return;
      }

      // Map headers
      const headers = Object.keys(rows[0]);
      const headerMap: Record<string, string> = {};
      headers.forEach(h => {
        const mapped = mapColumn(h);
        if (mapped) headerMap[h] = mapped;
      });

      // Check required fields
      const mappedFields = new Set(Object.values(headerMap));
      if (!mappedFields.has('area')) errs.push('Coluna "Grande Área" não encontrada');
      if (!mappedFields.has('gabarito')) errs.push('Coluna "Gabarito" não encontrada');

      // Parse questions
      const questions: Partial<Question>[] = [];
      rows.forEach((row, idx) => {
        const q: Partial<Question> = {
          id: idx + 1,
          ano: new Date().getFullYear(),
          prova: 'Importada',
          area: '',
          subarea: '',
          conteudo: '',
          nivel_bloom: '',
          objetivo: '',
          dificuldade: 'Média',
          fonte: '',
          competencias: '',
          periodo: '',
          enunciado: '',
          alternativas: {},
          gabarito: '',
        };

        for (const [origHeader, mappedField] of Object.entries(headerMap)) {
          const val = String(row[origHeader] || '').trim();
          if (mappedField === 'ano') {
            q.ano = parseInt(val) || new Date().getFullYear();
          } else if (mappedField === 'id') {
            // keep auto-generated id
          } else {
            (q as any)[mappedField] = val;
          }
        }

        // Try to find alternativas from separate columns
        headers.forEach(h => {
          const norm = h.toLowerCase().trim();
          if (norm.match(/^alternativa[\s_]?[a-e]$/i)) {
            const letter = norm.slice(-1).toUpperCase();
            if (row[h]) {
              if (!q.alternativas) q.alternativas = {};
              q.alternativas[letter] = String(row[h]).trim();
            }
          }
        });

        // If no enunciado column found, skip
        if (q.enunciado || q.area) {
          questions.push(q);
        }
      });

      if (questions.length === 0) {
        errs.push('Nenhuma questão válida encontrada no arquivo.');
      }

      setParsedQuestions(questions);
      setErrors(errs);
      setStep('preview');
    } catch (e) {
      errs.push(`Erro ao processar arquivo: ${(e as Error).message}`);
      setErrors(errs);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleImport = useCallback(() => {
    // Only import questions that have at least area and gabarito
    const valid = parsedQuestions.filter(q => q.area && q.gabarito) as Question[];
    if (valid.length === 0) {
      toast.error('Nenhuma questão válida para importar.');
      return;
    }
    const count = onImport(valid);
    setImportedCount(count);
    setStep('done');
    toast.success(`${count} questões importadas com sucesso!`);
  }, [parsedQuestions, onImport]);

  const downloadTemplate = useCallback(() => {
    const headers = ['Questão', 'Ano', 'Prova', 'Grande Área', 'Especialidade', 'Tema', 'Nível Cognitivo Bloom', 'Objetivo de Aprendizagem', 'Dificuldade', 'Fonte/Diretriz/Protocolo', 'Competências', 'Período', 'Enunciado', 'Alternativa_A', 'Alternativa_B', 'Alternativa_C', 'Alternativa_D', 'Gabarito'];
    const example = ['1', '2025', 'Prova Exemplo', 'Clínica Médica', 'Cardiologia', 'Insuficiência cardíaca', 'Aplicar', 'Identificar tratamento adequado', 'Média', 'Diretriz SBC 2021', 'Tomada de Decisões', '5º', 'Paciente de 60 anos...', 'Carvedilol', 'Anlodipino', 'Digoxina', 'Hidroclorotiazida', 'A'];
    const csv = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_questoes_famp.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] overflow-hidden border-border bg-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            Importar Questões
          </h3>
          <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <CardContent className="p-5 overflow-y-auto max-h-[calc(85vh-60px)]">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {['Upload', 'Preview', 'Concluído'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === ['upload', 'preview', 'done'].indexOf(step)
                    ? 'bg-primary text-primary-foreground'
                    : i < ['upload', 'preview', 'done'].indexOf(step)
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {i < ['upload', 'preview', 'done'].indexOf(step) ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
              </div>
            ))}
          </div>

          {/* STEP: Upload */}
          {step === 'upload' && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 transition-colors"
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-foreground mb-1">Arraste um arquivo ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground">Formatos aceitos: CSV, XLSX, XLS</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">
                  O arquivo deve conter colunas como: Questão, Grande Área, Especialidade, Tema, Dificuldade, Enunciado, Alternativa_A, Alternativa_B, Alternativa_C, Alternativa_D, Gabarito.
                </p>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-xs gap-1.5">
                  <Download className="w-3 h-3" />
                  Baixar template CSV
                </Button>
              </div>
            </div>
          )}

          {/* STEP: Preview */}
          {step === 'preview' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-foreground font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsedQuestions.length} questões encontradas
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={reset} className="text-xs">
                  Trocar arquivo
                </Button>
              </div>

              {errors.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-medium text-yellow-400">Avisos</span>
                  </div>
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-yellow-400/80 ml-6">{err}</p>
                  ))}
                </div>
              )}

              {/* Preview table */}
              <div className="border border-border rounded-lg overflow-hidden mb-4">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 text-muted-foreground font-mono">#</th>
<th className="text-left p-2 text-muted-foreground font-mono">Grande Área</th>
                         <th className="text-left p-2 text-muted-foreground font-mono">Especialidade</th>
                        <th className="text-left p-2 text-muted-foreground font-mono">Dificuldade</th>
                        <th className="text-left p-2 text-muted-foreground font-mono">Gabarito</th>
                        <th className="text-left p-2 text-muted-foreground font-mono">Enunciado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedQuestions.slice(0, 20).map((q, i) => (
                        <tr key={i} className="border-t border-border hover:bg-accent/5">
                          <td className="p-2 text-muted-foreground">{i + 1}</td>
                          <td className="p-2 text-foreground">{q.area || '—'}</td>
                          <td className="p-2 text-foreground">{q.subarea || '—'}</td>
                          <td className="p-2 text-foreground">{q.dificuldade || '—'}</td>
                          <td className="p-2 text-primary font-bold">{q.gabarito || '—'}</td>
                          <td className="p-2 text-foreground max-w-[200px] truncate">{q.enunciado?.slice(0, 80) || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedQuestions.length > 20 && (
                  <div className="p-2 text-center text-[10px] text-muted-foreground border-t border-border bg-muted/30">
                    Mostrando 20 de {parsedQuestions.length} questões
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={reset} className="text-xs">
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={parsedQuestions.filter(q => q.area && q.gabarito).length === 0}
                  className="text-xs gap-1.5 bg-primary text-primary-foreground"
                >
                  <Check className="w-3.5 h-3.5" />
                  Importar {parsedQuestions.filter(q => q.area && q.gabarito).length} questões
                </Button>
              </div>
            </div>
          )}

          {/* STEP: Done */}
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Importação concluída!
              </h4>
              <p className="text-sm text-muted-foreground mb-6">
                <span className="text-primary font-bold">{importedCount}</span> questões foram adicionadas ao banco.
              </p>
              <Button size="sm" onClick={handleClose} className="text-xs bg-primary text-primary-foreground">
                Fechar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
