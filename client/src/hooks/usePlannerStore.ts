/**
 * FAMP Planner — Store (Zustand-like com useState + localStorage)
 * Lógica de negócio: revisão espaçada R1-R10 (25/50 dias),
 * testes aleatórios TA1-TA3 escaláveis, sessões de 90min.
 *
 * REGRAS OPERACIONAIS:
 * - Data base = dia do estudo/aula
 * - Revisões contadas a partir do dia SEGUINTE (sem incluir dia-base)
 * - R1-R5: intervalos de 25 dias
 * - R6-R10: intervalos de 50 dias
 * - TAs: entre revisões, mínimo 3 dias de intervalo
 * - Preferencialmente técnica ativa nas revisões
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  PlannerTema,
  PlannerEtapa,
  PlannerRevisao,
  PlannerTesteAleatorio,
  PlannerSessao,
  PlannerItemStatus,
  EtapaEstudo,
  RevisaoTipo,
} from '@/lib/types';

// ─── Helpers ───
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function isOverdue(dateStr: string): boolean {
  return dateStr < today();
}

// ─── Revisão Schedule Calculator ───
function calcularRevisoes(temaId: string, dataBase: string): PlannerRevisao[] {
  const revisoes: PlannerRevisao[] = [];
  const tipos: RevisaoTipo[] = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10'];

  let acumulado = 0;
  for (let i = 0; i < tipos.length; i++) {
    const intervalo = i < 5 ? 25 : 50;
    acumulado += intervalo;
    // Contagem a partir do dia seguinte à data-base
    const dataAgendada = addDays(dataBase, acumulado);

    revisoes.push({
      id: generateId(),
      temaId,
      tipo: tipos[i],
      dataAgendada,
      status: 'pendente',
    });
  }

  return revisoes;
}

// ─── Testes Aleatórios Calculator ───
function calcularTestesAleatorios(
  temaId: string,
  revisoes: PlannerRevisao[]
): PlannerTesteAleatorio[] {
  const testes: PlannerTesteAleatorio[] = [];
  let numero = 1;

  // Gerar TAs entre cada par de revisões consecutivas
  for (let i = 0; i < revisoes.length - 1; i++) {
    const dataInicio = revisoes[i].dataAgendada;
    const dataFim = revisoes[i + 1].dataAgendada;

    const diasEntre =
      (new Date(dataFim).getTime() - new Date(dataInicio).getTime()) /
      (1000 * 60 * 60 * 24);

    // Só gerar TA se houver espaço suficiente (mín 3 dias de cada lado)
    if (diasEntre >= 7) {
      // Colocar TA no ponto médio entre as duas revisões
      const meio = Math.floor(diasEntre / 2);
      const dataTa = addDays(dataInicio, meio);

      testes.push({
        id: generateId(),
        temaId,
        numero,
        dataAgendada: dataTa,
        status: 'pendente',
      });
      numero++;
    }
  }

  return testes;
}

// ─── Etapas padrão para um tema ───
function criarEtapasPadrao(temaId: string): PlannerEtapa[] {
  const tipos: EtapaEstudo[] = [
    'estudo_teorico',
    'questoes_pre',
    'aula',
    'flashcards',
    'questoes_pos',
  ];

  return tipos.map((tipo) => ({
    id: generateId(),
    temaId,
    tipo,
    status: 'pendente' as PlannerItemStatus,
  }));
}

// ─── Mock data para primeiro uso ───
function criarDadosExemplo(): {
  temas: PlannerTema[];
  etapas: PlannerEtapa[];
  revisoes: PlannerRevisao[];
  testes: PlannerTesteAleatorio[];
  sessoes: PlannerSessao[];
} {
  const now = new Date().toISOString();
  const hojeDateStr = today();
  const ontemDateStr = addDays(hojeDateStr, -1);
  const anteontemDateStr = addDays(hojeDateStr, -2);

  const temas: PlannerTema[] = [];
  const etapas: PlannerEtapa[] = [];
  const revisoes: PlannerRevisao[] = [];
  const testes: PlannerTesteAleatorio[] = [];
  const sessoes: PlannerSessao[] = [];

  return { temas, etapas, revisoes, testes, sessoes };
}

// ─── Storage Keys ───
const STORAGE_KEY = 'famp_planner_data';

interface PlannerData {
  temas: PlannerTema[];
  etapas: PlannerEtapa[];
  revisoes: PlannerRevisao[];
  testes: PlannerTesteAleatorio[];
  sessoes: PlannerSessao[];
}

function loadData(): PlannerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  // Primeiro uso: criar dados de exemplo
  const demo = criarDadosExemplo();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  return demo;
}

function saveData(data: PlannerData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Hook ───
export function usePlannerStore() {
  const [data, setData] = useState<PlannerData>(loadData);

  // Persist on every change
  useEffect(() => {
    saveData(data);
  }, [data]);

  // ─── Auto-update overdue statuses ───
  useEffect(() => {
    const todayStr = today();
    let changed = false;
    const updatedRevisoes = data.revisoes.map((r) => {
      if (r.status === 'pendente' && r.dataAgendada < todayStr) {
        changed = true;
        return { ...r, status: 'atrasado' as PlannerItemStatus };
      }
      return r;
    });
    const updatedTestes = data.testes.map((t) => {
      if (t.status === 'pendente' && t.dataAgendada < todayStr) {
        changed = true;
        return { ...t, status: 'atrasado' as PlannerItemStatus };
      }
      return t;
    });
    if (changed) {
      setData((prev) => ({ ...prev, revisoes: updatedRevisoes, testes: updatedTestes }));
    }
  }, []); // eslint-disable-line

  // ─── Duplicate check ───
  const isTemaExistente = useCallback(
    (area: string, especialidade: string, tema: string): boolean => {
      return data.temas.some(
        (t) => t.area === area && t.especialidade === especialidade && t.tema === tema
      );
    },
    [data.temas]
  );

  // ─── CRUD: Temas ───
  const addTema = useCallback(
    (input: Omit<PlannerTema, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Impedir duplicidade
      if (data.temas.some(t => t.area === input.area && t.especialidade === input.especialidade && t.tema === input.tema)) {
        return null; // Tema já existe
      }

      const now = new Date().toISOString();
      const tema: PlannerTema = { ...input, id: generateId(), createdAt: now, updatedAt: now };
      const etapas = criarEtapasPadrao(tema.id);
      const revisoes = calcularRevisoes(tema.id, tema.dataBase);
      const testes = calcularTestesAleatorios(tema.id, revisoes);

      setData((prev) => ({
        ...prev,
        temas: [...prev.temas, tema],
        etapas: [...prev.etapas, ...etapas],
        revisoes: [...prev.revisoes, ...revisoes],
        testes: [...prev.testes, ...testes],
      }));

      return tema;
    },
    [data.temas]
  );

  const updateTema = useCallback(
    (id: string, updates: Partial<PlannerTema>) => {
      setData((prev) => ({
        ...prev,
        temas: prev.temas.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ),
      }));
    },
    []
  );

  const deleteTema = useCallback((id: string) => {
    setData((prev) => ({
      temas: prev.temas.filter((t) => t.id !== id),
      etapas: prev.etapas.filter((e) => e.temaId !== id),
      revisoes: prev.revisoes.filter((r) => r.temaId !== id),
      testes: prev.testes.filter((t) => t.temaId !== id),
      sessoes: prev.sessoes.filter((s) => s.temaId !== id),
    }));
  }, []);

  // ─── CRUD: Etapas ───
  const updateEtapa = useCallback(
    (id: string, updates: Partial<PlannerEtapa>) => {
      setData((prev) => ({
        ...prev,
        etapas: prev.etapas.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }));
    },
    []
  );

  const completeEtapa = useCallback((id: string, valor?: number) => {
    setData((prev) => ({
      ...prev,
      etapas: prev.etapas.map((e) =>
        e.id === id
          ? { ...e, status: 'concluido' as PlannerItemStatus, valor, completadoEm: today() }
          : e
      ),
    }));
  }, []);

  const toggleEtapa = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      etapas: prev.etapas.map((e) =>
        e.id === id
          ? {
              ...e,
              status: e.status === 'concluido' ? 'pendente' as PlannerItemStatus : 'concluido' as PlannerItemStatus,
              completadoEm: e.status === 'concluido' ? undefined : today(),
            }
          : e
      ),
    }));
  }, []);

  // ─── CRUD: Revisões ───
  const completeRevisao = useCallback(
    (id: string, tecnica?: string, valor?: number) => {
      setData((prev) => ({
        ...prev,
        revisoes: prev.revisoes.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'concluido' as PlannerItemStatus,
                tecnicaUsada: tecnica,
                valor,
                completadoEm: today(),
              }
            : r
        ),
      }));
    },
    []
  );

  const toggleRevisao = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      revisoes: prev.revisoes.map((r) =>
        r.id === id
          ? {
              ...r,
              status: r.status === 'concluido' ? 'pendente' as PlannerItemStatus : 'concluido' as PlannerItemStatus,
              completadoEm: r.status === 'concluido' ? undefined : today(),
            }
          : r
      ),
    }));
  }, []);

  const toggleTeste = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      testes: prev.testes.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === 'concluido' ? 'pendente' as PlannerItemStatus : 'concluido' as PlannerItemStatus,
              completadoEm: t.status === 'concluido' ? undefined : today(),
            }
          : t
      ),
    }));
  }, []);

  // ─── CRUD: Testes Aleatórios ───
  const completeTeste = useCallback((id: string, questoesFeitas?: number) => {
    setData((prev) => ({
      ...prev,
      testes: prev.testes.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'concluido' as PlannerItemStatus,
              questoesFeitas,
              completadoEm: today(),
            }
          : t
      ),
    }));
  }, []);

  // ─── Sessões ───
  const startSessao = useCallback(
    (temaId: string) => {
      const tema = data.temas.find((t) => t.id === temaId);
      if (!tema) return null;

      const sessao: PlannerSessao = {
        id: generateId(),
        temaId,
        titulo: `${tema.tema} — Sessão ${data.sessoes.filter((s) => s.temaId === temaId).length + 1}`,
        dataInicio: new Date().toISOString(),
        duracaoMinutos: 90,
        status: 'em_andamento',
        etapasCompletadas: [],
        createdAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        sessoes: [...prev.sessoes, sessao],
      }));

      return sessao;
    },
    [data.temas, data.sessoes]
  );

  const completeSessao = useCallback(
    (id: string, duracaoReal: number, notas?: string) => {
      setData((prev) => ({
        ...prev,
        sessoes: prev.sessoes.map((s) =>
          s.id === id
            ? { ...s, status: 'concluida' as any, duracaoReal, notas }
            : s
        ),
      }));
    },
    []
  );

  // ─── Computed ───
  const getTemasForWeek = useCallback(
    (semana: number) => data.temas.filter((t) => t.semana === semana),
    [data.temas]
  );

  const getEtapasForTema = useCallback(
    (temaId: string) => data.etapas.filter((e) => e.temaId === temaId),
    [data.etapas]
  );

  const getRevisoesForTema = useCallback(
    (temaId: string) => data.revisoes.filter((r) => r.temaId === temaId),
    [data.revisoes]
  );

  const getTestesForTema = useCallback(
    (temaId: string) => data.testes.filter((t) => t.temaId === temaId),
    [data.testes]
  );

  const getSessoesForTema = useCallback(
    (temaId: string) => data.sessoes.filter((s) => s.temaId === temaId),
    [data.sessoes]
  );

  // Próximas ações pendentes (hoje ou atrasadas)
  const getPendingActions = useCallback(() => {
    const todayStr = today();
    const pendingRevisoes = data.revisoes.filter(
      (r) =>
        (r.status === 'pendente' && r.dataAgendada <= todayStr) ||
        r.status === 'atrasado'
    );
    const pendingTestes = data.testes.filter(
      (t) =>
        (t.status === 'pendente' && t.dataAgendada <= todayStr) ||
        t.status === 'atrasado'
    );
    return { pendingRevisoes, pendingTestes };
  }, [data.revisoes, data.testes]);

  // Stats
  const getStats = useCallback(() => {
    const totalTemas = data.temas.length;
    const totalEtapas = data.etapas.length;
    const etapasConcluidas = data.etapas.filter((e) => e.status === 'concluido').length;
    const totalRevisoes = data.revisoes.length;
    const revisoesConcluidas = data.revisoes.filter((r) => r.status === 'concluido').length;
    const revisoesAtrasadas = data.revisoes.filter((r) => r.status === 'atrasado').length;
    const totalTestes = data.testes.length;
    const testesConcluidos = data.testes.filter((t) => t.status === 'concluido').length;
    const totalSessoes = data.sessoes.length;
    const sessoesCompletas = data.sessoes.filter((s) => s.status === 'concluida').length;
    const tempoTotal = data.sessoes
      .filter((s) => s.status === 'concluida')
      .reduce((acc, s) => acc + (s.duracaoReal || s.duracaoMinutos), 0);

    return {
      totalTemas,
      totalEtapas,
      etapasConcluidas,
      progressoEtapas: totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0,
      totalRevisoes,
      revisoesConcluidas,
      revisoesAtrasadas,
      totalTestes,
      testesConcluidos,
      totalSessoes,
      sessoesCompletas,
      tempoTotal,
    };
  }, [data]);

  // Semanas disponíveis
  const getWeeks = useCallback(() => {
    const weeks = new Set(data.temas.map((t) => t.semana));
    return Array.from(weeks).sort((a, b) => a - b);
  }, [data.temas]);

  // Áreas únicas
  const getAreas = useCallback(() => {
    const areas = new Set(data.temas.map((t) => t.area));
    return Array.from(areas).sort();
  }, [data.temas]);

  // Timeline: todas as atividades ordenadas por data
  const getTimeline = useCallback(() => {
    const items: Array<{
      type: 'revisao' | 'teste';
      date: string;
      temaId: string;
      label: string;
      status: PlannerItemStatus;
      id: string;
    }> = [];

    data.revisoes.forEach((r) => {
      const tema = data.temas.find((t) => t.id === r.temaId);
      items.push({
        type: 'revisao',
        date: r.dataAgendada,
        temaId: r.temaId,
        label: `${r.tipo} — ${tema?.tema || 'Tema'}`,
        status: r.status,
        id: r.id,
      });
    });

    data.testes.forEach((t) => {
      const tema = data.temas.find((tm) => tm.id === t.temaId);
      items.push({
        type: 'teste',
        date: t.dataAgendada,
        temaId: t.temaId,
        label: `TA${t.numero} — ${tema?.tema || 'Tema'}`,
        status: t.status,
        id: t.id,
      });
    });

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return {
    // Data
    temas: data.temas,
    etapas: data.etapas,
    revisoes: data.revisoes,
    testes: data.testes,
    sessoes: data.sessoes,

    // Actions
    addTema,
    isTemaExistente,
    updateTema,
    deleteTema,
    updateEtapa,
    completeEtapa,
    completeRevisao,
    toggleEtapa,
    toggleRevisao,
    toggleTeste,
    completeTeste,
    startSessao,
    completeSessao,

    // Computed
    getTemasForWeek,
    getEtapasForTema,
    getRevisoesForTema,
    getTestesForTema,
    getSessoesForTema,
    getPendingActions,
    getStats,
    getWeeks,
    getAreas,
    getTimeline,
  };
}
