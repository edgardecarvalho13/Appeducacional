/**
 * FAMP Quest — Centralized Store
 * Manages questions, progress, and caderno de erros in localStorage.
 * Shared across QuestPage, CadernoErrosPage, and DesempenhoPage.
 *
 * TERMINOLOGIA:
 *   area      = Grande Área (ex: Clínica Médica, Cirurgia, Pediatria)
 *   subarea   = Especialidade (ex: Cardiologia, Nefrologia)
 *   conteudo  = Tema (ex: Insuficiência cardíaca, Acidose tubular renal)
 */

import { useState, useCallback, useMemo } from 'react';

/* ─── Types ─── */
export interface Question {
  id: number;
  ano: number;
  prova: string;
  area: string;       // Grande Área
  subarea: string;     // Especialidade
  conteudo: string;    // Tema
  nivel_bloom: string;
  objetivo: string;
  dificuldade: string;
  fonte: string;
  competencias: string;
  periodo: string;
  enunciado: string;
  alternativas: Record<string, string>;
  gabarito: string;
}

export interface QuestionProgress {
  questionId: number;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  answeredAt: string;
}

/* ─── Taxonomia de Erros C1-C4 ─── */
export type TaxonomiaErro = 'C1' | 'C2' | 'C3' | 'C4' | null;

export const TAXONOMIA_LABELS: Record<string, { nome: string; descricao: string }> = {
  C1: { nome: 'Conceitual/algoritmo', descricao: 'Não sabia regra/critério/conduta, confundiu indicações/contraindicações.' },
  C2: { nome: 'Discriminação clínica', descricao: 'Confundiu quadros parecidos (ex.: hipóxia pós-intubação vs outras causas).' },
  C3: { nome: 'Atenção/leitura', descricao: 'Leu errado o enunciado, não viu "EXCETO", trocou alternativa.' },
  C4: { nome: 'Estratégia de prova', descricao: 'Tempo, alternativas, chute sem eliminação, excesso de confiança.' },
};

export interface CadernoErroEntry {
  id: string;
  questionId: number;
  area: string;             // Grande Área
  subarea: string;          // Especialidade
  enunciado: string;
  respostaCerta: string;    // Letra (A, B, C, D)
  respostaCertaTexto: string;
  anotacao: string;
  dataResposta: string;
  revisado: boolean;
  taxonomia: TaxonomiaErro; // C1, C2, C3, C4 ou null
  manual?: boolean;         // true se adicionado manualmente
  fonte?: string;           // ex: "Sala de aula", "Simulado X", etc.
}

/* ─── Storage Keys ─── */
const QUESTIONS_KEY = 'famp-quest-questions';
const PROGRESS_KEY = 'famp-quest-progress';
const CADERNO_KEY = 'famp-caderno-erros';

/* ─── Default questions from JSON ─── */
import defaultQuestions from '@/data/questions.json';

/* ─── Helpers ─── */
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ─── Hook ─── */
export function useQuestStore() {
  // Questions — merge default + imported
  const [importedQuestions, setImportedQuestions] = useState<Question[]>(
    () => loadFromStorage<Question[]>(QUESTIONS_KEY, [])
  );

  const allQuestions = useMemo(() => {
    const base = defaultQuestions as Question[];
    const maxBaseId = Math.max(...base.map(q => q.id), 0);
    const imported = importedQuestions.map((q, i) => ({
      ...q,
      id: q.id > maxBaseId ? q.id : maxBaseId + i + 1,
    }));
    return [...base, ...imported];
  }, [importedQuestions]);

  // Progress
  const [progress, setProgress] = useState<Record<number, QuestionProgress>>(
    () => loadFromStorage<Record<number, QuestionProgress>>(PROGRESS_KEY, {})
  );

  // Caderno de Erros
  const [cadernoErros, setCadernoErros] = useState<CadernoErroEntry[]>(
    () => loadFromStorage<CadernoErroEntry[]>(CADERNO_KEY, [])
  );

  // ─── Actions ───

  const saveAnswer = useCallback((questionId: number, selectedAnswer: string, isCorrect: boolean) => {
    const newProgress = {
      ...progress,
      [questionId]: {
        questionId,
        selectedAnswer,
        isCorrect,
        answeredAt: new Date().toISOString(),
      },
    };
    setProgress(newProgress);
    saveToStorage(PROGRESS_KEY, newProgress);

    // If wrong, auto-add to caderno de erros
    if (!isCorrect) {
      const question = allQuestions.find(q => q.id === questionId);
      if (question) {
        const alreadyExists = cadernoErros.some(e => e.questionId === questionId);
        if (!alreadyExists) {
          const newEntry: CadernoErroEntry = {
            id: `err-${questionId}-${Date.now()}`,
            questionId,
            area: question.area,
            subarea: question.subarea,
            enunciado: question.enunciado,
            respostaCerta: question.gabarito,
            respostaCertaTexto: question.alternativas[question.gabarito] || '',
            anotacao: '',
            dataResposta: new Date().toISOString(),
            revisado: false,
            taxonomia: null,
          };
          const updated = [newEntry, ...cadernoErros];
          setCadernoErros(updated);
          saveToStorage(CADERNO_KEY, updated);
        }
      }
    }

    return isCorrect;
  }, [progress, cadernoErros, allQuestions]);

  const importQuestions = useCallback((newQuestions: Question[]) => {
    const maxId = Math.max(...allQuestions.map(q => q.id), 0);
    const indexed = newQuestions.map((q, i) => ({
      ...q,
      id: maxId + i + 1,
    }));
    const updated = [...importedQuestions, ...indexed];
    setImportedQuestions(updated);
    saveToStorage(QUESTIONS_KEY, updated);
    return indexed.length;
  }, [allQuestions, importedQuestions]);

  const updateCadernoAnotacao = useCallback((entryId: string, anotacao: string) => {
    const updated = cadernoErros.map(e =>
      e.id === entryId ? { ...e, anotacao } : e
    );
    setCadernoErros(updated);
    saveToStorage(CADERNO_KEY, updated);
  }, [cadernoErros]);

  const updateCadernoTaxonomia = useCallback((entryId: string, taxonomia: TaxonomiaErro) => {
    const updated = cadernoErros.map(e =>
      e.id === entryId ? { ...e, taxonomia } : e
    );
    setCadernoErros(updated);
    saveToStorage(CADERNO_KEY, updated);
  }, [cadernoErros]);

  const toggleCadernoRevisado = useCallback((entryId: string) => {
    const updated = cadernoErros.map(e =>
      e.id === entryId ? { ...e, revisado: !e.revisado } : e
    );
    setCadernoErros(updated);
    saveToStorage(CADERNO_KEY, updated);
  }, [cadernoErros]);

  const removeCadernoEntry = useCallback((entryId: string) => {
    const updated = cadernoErros.filter(e => e.id !== entryId);
    setCadernoErros(updated);
    saveToStorage(CADERNO_KEY, updated);
  }, [cadernoErros]);

  const addManualCadernoEntry = useCallback((entry: Omit<CadernoErroEntry, 'id' | 'questionId' | 'revisado'>) => {
    const newEntry: CadernoErroEntry = {
      ...entry,
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      questionId: -1,
      revisado: false,
      manual: true,
    };
    const updated = [newEntry, ...cadernoErros];
    setCadernoErros(updated);
    saveToStorage(CADERNO_KEY, updated);
    return newEntry;
  }, [cadernoErros]);

  // Stats
  const stats = useMemo(() => {
    const totalAnswered = Object.keys(progress).length;
    const totalCorrect = Object.values(progress).filter(p => p.isCorrect).length;
    const totalWrong = totalAnswered - totalCorrect;
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    // By Grande Área
    const byArea: Record<string, { total: number; answered: number; correct: number }> = {};
    allQuestions.forEach(q => {
      if (!byArea[q.area]) byArea[q.area] = { total: 0, answered: 0, correct: 0 };
      byArea[q.area].total++;
      if (progress[q.id]) {
        byArea[q.area].answered++;
        if (progress[q.id].isCorrect) byArea[q.area].correct++;
      }
    });

    // By Especialidade
    const bySubarea: Record<string, { total: number; answered: number; correct: number }> = {};
    allQuestions.forEach(q => {
      if (!bySubarea[q.subarea]) bySubarea[q.subarea] = { total: 0, answered: 0, correct: 0 };
      bySubarea[q.subarea].total++;
      if (progress[q.id]) {
        bySubarea[q.subarea].answered++;
        if (progress[q.id].isCorrect) bySubarea[q.subarea].correct++;
      }
    });

    // By difficulty
    const byDificuldade: Record<string, { total: number; answered: number; correct: number }> = {};
    allQuestions.forEach(q => {
      if (!byDificuldade[q.dificuldade]) byDificuldade[q.dificuldade] = { total: 0, answered: 0, correct: 0 };
      byDificuldade[q.dificuldade].total++;
      if (progress[q.id]) {
        byDificuldade[q.dificuldade].answered++;
        if (progress[q.id].isCorrect) byDificuldade[q.dificuldade].correct++;
      }
    });

    // By bloom
    const byBloom: Record<string, { total: number; answered: number; correct: number }> = {};
    allQuestions.forEach(q => {
      if (!byBloom[q.nivel_bloom]) byBloom[q.nivel_bloom] = { total: 0, answered: 0, correct: 0 };
      byBloom[q.nivel_bloom].total++;
      if (progress[q.id]) {
        byBloom[q.nivel_bloom].answered++;
        if (progress[q.id].isCorrect) byBloom[q.nivel_bloom].correct++;
      }
    });

    // Timeline (last 7 days)
    const timeline: { date: string; answered: number; correct: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayProgress = Object.values(progress).filter(p => p.answeredAt.startsWith(dateStr));
      timeline.push({
        date: dateStr,
        answered: dayProgress.length,
        correct: dayProgress.filter(p => p.isCorrect).length,
      });
    }

    return {
      totalQuestions: allQuestions.length,
      totalAnswered,
      totalCorrect,
      totalWrong,
      accuracy,
      byArea,
      bySubarea,
      byDificuldade,
      byBloom,
      timeline,
      pendingErrors: cadernoErros.filter(e => !e.revisado).length,
    };
  }, [allQuestions, progress, cadernoErros]);

  return {
    allQuestions,
    progress,
    cadernoErros,
    stats,
    saveAnswer,
    importQuestions,
    updateCadernoAnotacao,
    updateCadernoTaxonomia,
    toggleCadernoRevisado,
    removeCadernoEntry,
    addManualCadernoEntry,
  };
}
