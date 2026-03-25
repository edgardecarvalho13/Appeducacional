/**
 * FAMP Academy — TypeScript Types
 * Espelha o schema do banco de dados Supabase para uso no frontend.
 * Design: "Command Center" — tipos precisos como dados clínicos.
 */

// ============================================================
// Enums
// ============================================================
export type UserRole = 'aluno' | 'professor' | 'coordenacao' | 'admin';
export type DifficultyLevel = 'facil' | 'medio' | 'dificil';
export type QuestionType = 'multipla_escolha' | 'verdadeiro_falso' | 'dissertativa';
export type SessionStatus = 'planejada' | 'em_andamento' | 'concluida' | 'cancelada';
export type ContentType = 'video' | 'pdf' | 'artigo' | 'link_externo';
export type AvisoPrioridade = 'baixa' | 'normal' | 'alta' | 'urgente';

// ============================================================
// Core Models
// ============================================================
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  periodo?: number;
  matricula?: string;
  telefone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Disciplina {
  id: string;
  nome: string;
  codigo: string;
  periodo: number;
  carga_horaria?: number;
  ementa?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Turma {
  id: string;
  nome: string;
  ano: number;
  semestre: number;
  periodo: number;
  disciplina_id?: string;
  professor_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tema {
  id: string;
  nome: string;
  disciplina_id: string;
  descricao?: string;
  created_at: string;
}

export interface Questao {
  id: string;
  enunciado: string;
  tipo: QuestionType;
  dificuldade: DifficultyLevel;
  disciplina_id: string;
  tema_id?: string;
  explicacao?: string;
  fonte?: string;
  ano_prova?: number;
  banca?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  alternativas?: Alternativa[];
}

export interface Alternativa {
  id: string;
  questao_id: string;
  texto: string;
  is_correta: boolean;
  ordem: number;
}

export interface Resposta {
  id: string;
  aluno_id: string;
  questao_id: string;
  alternativa_id?: string;
  resposta_texto?: string;
  is_correta?: boolean;
  tempo_resposta?: number;
  tentativa: number;
  created_at: string;
}

export interface CadernoErro {
  id: string;
  aluno_id: string;
  questao_id: string;
  resposta_id?: string;
  notas?: string;
  revisado: boolean;
  revisado_at?: string;
  created_at: string;
}

export interface SessaoEstudo {
  id: string;
  aluno_id: string;
  tema_id?: string;
  disciplina_id?: string;
  titulo: string;
  descricao?: string;
  status: SessionStatus;
  data_planejada: string;
  hora_inicio?: string;
  duracao_minutos: number;
  duracao_real?: number;
  notas?: string;
  google_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Conteudo {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: ContentType;
  url: string;
  thumbnail_url?: string;
  disciplina_id?: string;
  tema_id?: string;
  duracao_minutos?: number;
  total_paginas?: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  prioridade: AvisoPrioridade;
  autor_id: string;
  turma_id?: string;
  periodo_alvo?: number;
  expira_em?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TutorConversa {
  id: string;
  aluno_id: string;
  titulo?: string;
  disciplina_id?: string;
  questao_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TutorMensagem {
  id: string;
  conversa_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// Dashboard Metrics (agregados)
// ============================================================
export interface DashboardMetrics {
  questoesResolvidas: number;
  questoesCorretas: number;
  taxaAcerto: number;
  sessoesCompletas: number;
  tempoEstudoHoje: number; // minutos
  sequenciaDias: number; // streak
  errosPendentes: number;
  proximaSessao?: SessaoEstudo;
}

export interface ModuleShortcut {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  status: 'active' | 'coming_soon';
  badge?: string;
}

// ============================================================
// Video Watch Analytics (para coordenador)
// ============================================================
export interface VideoCompletionRecord {
  id: string;
  alunoId: string;
  alunoNome: string;
  alunoEmail: string;
  alunoPeriodo?: number;
  videoId: string;
  videoTitle: string;
  completedAt: string;
  watchPercentage: number; // >= 90 para ser considerado concluído
}

// ============================================================
// Notificações internas do app
// ============================================================
export interface AppNotification {
  id: string;
  type: 'nova_playlist' | 'aviso' | 'geral';
  title: string;
  message: string;
  targetPeriodo?: number;
  targetEmail?: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
