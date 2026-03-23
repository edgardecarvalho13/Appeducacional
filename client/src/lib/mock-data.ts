/**
 * FAMP Academy — Mock Data
 * Dados simulados para desenvolvimento frontend antes da integração Supabase.
 */

import type {
  Profile,
  DashboardMetrics,
  SessaoEstudo,
  Aviso,
  ModuleShortcut,
  Disciplina,
} from './types';

// ============================================================
// Usuários Mock (para simular login e RBAC)
// ============================================================
export const MOCK_USERS: Profile[] = [
  {
    id: '780fc355-b937-48a5-8b51-be48beaa4dee',
    email: 'everton.e.carvalho@aluno.famp.edu.br',
    full_name: 'Everton E de Carvalho',
    avatar_url: undefined,
    role: 'aluno',
    periodo: 9,
    matricula: '2023001',
    telefone: undefined,
    is_active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: '5b35e7fd-3bb1-483e-9548-5daab0ec10ce',
    email: 'everton.edgar@gmail.com',
    full_name: 'Prof. Edgar',
    avatar_url: undefined,
    role: 'professor',
    periodo: undefined,
    matricula: undefined,
    telefone: undefined,
    is_active: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'bff54648-21a9-4b4f-9996-9323e5a0f0fa',
    email: 'edgardecarvalho@fampfaculdade.com.br',
    full_name: 'Edgar de Carvalho',
    avatar_url: undefined,
    role: 'coordenacao',
    periodo: undefined,
    matricula: undefined,
    telefone: undefined,
    is_active: true,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 'db235caf-ea86-4b6d-903c-b20ab267bad3',
    email: 'edgar_tupa1@icloud.com',
    full_name: 'Admin Sistema',
    avatar_url: undefined,
    role: 'admin',
    periodo: undefined,
    matricula: undefined,
    telefone: undefined,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

// ============================================================
// Disciplinas Mock
// ============================================================
export const MOCK_DISCIPLINAS: Disciplina[] = [
  { id: 'd1', nome: 'Anatomia Humana', codigo: 'MED101', periodo: 1, carga_horaria: 120, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'd2', nome: 'Fisiologia', codigo: 'MED201', periodo: 2, carga_horaria: 100, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'd3', nome: 'Farmacologia', codigo: 'MED301', periodo: 3, carga_horaria: 80, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'd4', nome: 'Patologia', codigo: 'MED401', periodo: 4, carga_horaria: 90, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'd5', nome: 'Semiologia Médica', codigo: 'MED501', periodo: 5, carga_horaria: 110, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'd6', nome: 'Clínica Médica', codigo: 'MED601', periodo: 6, carga_horaria: 130, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

// ============================================================
// Métricas do Dashboard (Aluno)
// ============================================================
export const MOCK_METRICS: DashboardMetrics = {
  questoesResolvidas: 347,
  questoesCorretas: 243,
  taxaAcerto: 70.0,
  sessoesCompletas: 28,
  tempoEstudoHoje: 65,
  sequenciaDias: 12,
  errosPendentes: 23,
  proximaSessao: {
    id: 's1',
    aluno_id: '780fc355-b937-48a5-8b51-be48beaa4dee',
    tema_id: 't1',
    disciplina_id: 'd5',
    titulo: 'Semiologia Cardiovascular',
    descricao: 'Revisão de ausculta cardíaca e sopros',
    status: 'planejada',
    data_planejada: new Date().toISOString().split('T')[0],
    hora_inicio: '14:00',
    duracao_minutos: 90,
    created_at: '2024-03-20T00:00:00Z',
    updated_at: '2024-03-20T00:00:00Z',
  },
};

// ============================================================
// Sessões de Estudo Recentes
// ============================================================
export const MOCK_SESSOES: SessaoEstudo[] = [
  {
    id: 's1',
    aluno_id: '780fc355-b937-48a5-8b51-be48beaa4dee',
    tema_id: 't1',
    disciplina_id: 'd5',
    titulo: 'Semiologia Cardiovascular',
    descricao: 'Revisão de ausculta cardíaca e sopros',
    status: 'planejada',
    data_planejada: new Date().toISOString().split('T')[0],
    hora_inicio: '14:00',
    duracao_minutos: 90,
    created_at: '2024-03-20T00:00:00Z',
    updated_at: '2024-03-20T00:00:00Z',
  },
  {
    id: 's2',
    aluno_id: '780fc355-b937-48a5-8b51-be48beaa4dee',
    tema_id: 't2',
    disciplina_id: 'd5',
    titulo: 'Exame Neurológico',
    status: 'concluida',
    data_planejada: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    hora_inicio: '10:00',
    duracao_minutos: 90,
    duracao_real: 85,
    created_at: '2024-03-19T00:00:00Z',
    updated_at: '2024-03-19T00:00:00Z',
  },
  {
    id: 's3',
    aluno_id: '780fc355-b937-48a5-8b51-be48beaa4dee',
    tema_id: 't3',
    disciplina_id: 'd4',
    titulo: 'Patologia Renal',
    status: 'concluida',
    data_planejada: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    hora_inicio: '16:00',
    duracao_minutos: 90,
    duracao_real: 92,
    created_at: '2024-03-18T00:00:00Z',
    updated_at: '2024-03-18T00:00:00Z',
  },
];

// ============================================================
// Avisos Mock
// ============================================================
export const MOCK_AVISOS: Aviso[] = [
  {
    id: 'a1',
    titulo: 'Prova de Semiologia — Semana que vem',
    conteudo: 'A prova parcial de Semiologia Médica será aplicada na próxima terça-feira, dia 28/03, às 8h no Auditório Principal. Conteúdo: Capítulos 5 a 12 do Porto.',
    prioridade: 'alta',
    autor_id: 'bff54648-21a9-4b4f-9996-9323e5a0f0fa',
    turma_id: undefined,
    periodo_alvo: 5,
    is_active: true,
    created_at: '2024-03-20T10:00:00Z',
    updated_at: '2024-03-20T10:00:00Z',
  },
  {
    id: 'a2',
    titulo: 'Novo material disponível na Biblioteca',
    conteudo: 'Foram adicionadas 15 novas videoaulas de Farmacologia ao módulo FAMP Library. Acesse pelo menu lateral.',
    prioridade: 'normal',
    autor_id: '5b35e7fd-3bb1-483e-9548-5daab0ec10ce',
    turma_id: undefined,
    is_active: true,
    created_at: '2024-03-19T14:00:00Z',
    updated_at: '2024-03-19T14:00:00Z',
  },
  {
    id: 'a3',
    titulo: 'Manutenção programada do sistema',
    conteudo: 'O FAMP Academy passará por manutenção no sábado, das 2h às 6h. O sistema ficará indisponível neste período.',
    prioridade: 'baixa',
    autor_id: 'db235caf-ea86-4b6d-903c-b20ab267bad3',
    turma_id: undefined,
    is_active: true,
    created_at: '2024-03-18T09:00:00Z',
    updated_at: '2024-03-18T09:00:00Z',
  },
];

// ============================================================
// Atalhos dos Módulos
// ============================================================
export const MODULE_SHORTCUTS: ModuleShortcut[] = [
  {
    id: 'planner',
    title: 'FAMP Planner',
    description: 'Organize sessões de 90min por tema',
    icon: 'Calendar',
    href: '/planner',
    status: 'active',
  },
  {
    id: 'quest',
    title: 'FAMP Quest',
    description: 'Banco de questões com filtros avançados',
    icon: 'FileQuestion',
    href: '/quest',
    status: 'active',
    badge: '347 resolvidas',
  },
  {
    id: 'tutor',
    title: 'FAMP Tutor IA',
    description: 'Assistente socrático para seus estudos',
    icon: 'Bot',
    href: '/tutor',
    status: 'active',
  },
  {
    id: 'library',
    title: 'FAMP Library',
    description: 'Videoaulas e PDFs institucionais',
    icon: 'BookOpen',
    href: '/library',
    status: 'active',
  },
  {
    id: 'caderno-erros',
    title: 'Caderno de Erros',
    description: 'Revise questões que você errou',
    icon: 'AlertTriangle',
    href: '/caderno-erros',
    status: 'active',
    badge: '23 pendentes',
  },
  {
    id: 'flashcards',
    title: 'Flashcards',
    description: 'Revisão espaçada inteligente',
    icon: 'Layers',
    href: '/flashcards',
    status: 'coming_soon',
  },
];

// ============================================================
// Dados de desempenho semanal (para gráfico sparkline)
// ============================================================
export const MOCK_WEEKLY_PERFORMANCE = [
  { day: 'Seg', questoes: 12, acertos: 9 },
  { day: 'Ter', questoes: 18, acertos: 14 },
  { day: 'Qua', questoes: 8, acertos: 6 },
  { day: 'Qui', questoes: 22, acertos: 17 },
  { day: 'Sex', questoes: 15, acertos: 11 },
  { day: 'Sáb', questoes: 25, acertos: 20 },
  { day: 'Dom', questoes: 10, acertos: 7 },
];

// ============================================================
// Desempenho por disciplina (para gráfico radar/bar)
// ============================================================
export const MOCK_DISCIPLINE_PERFORMANCE = [
  { disciplina: 'Anatomia', acerto: 78, questoes: 85 },
  { disciplina: 'Fisiologia', acerto: 65, questoes: 62 },
  { disciplina: 'Farmacologia', acerto: 72, questoes: 48 },
  { disciplina: 'Patologia', acerto: 58, questoes: 72 },
  { disciplina: 'Semiologia', acerto: 82, questoes: 80 },
];
