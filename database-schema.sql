-- ============================================================
-- FAMP Academy — Database Schema (MVP - Fase 1)
-- Target: Supabase (PostgreSQL)
-- Version: 1.0.0
-- ============================================================
-- Este schema deve ser executado no SQL Editor do Supabase
-- após configurar o projeto. Ele cria todas as tabelas
-- necessárias para o MVP e prevê expansões futuras.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PERFIS DE USUÁRIO (extends Supabase auth.users)
-- ============================================================
CREATE TYPE user_role AS ENUM ('aluno', 'professor', 'coordenacao', 'admin');

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'aluno',
    periodo INTEGER CHECK (periodo >= 1 AND periodo <= 12),
    matricula TEXT UNIQUE,
    telefone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para busca por role
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_periodo ON profiles(periodo);

-- ============================================================
-- 2. DISCIPLINAS E TURMAS
-- ============================================================
CREATE TABLE disciplinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    periodo INTEGER NOT NULL CHECK (periodo >= 1 AND periodo <= 12),
    carga_horaria INTEGER,
    ementa TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE turmas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    ano INTEGER NOT NULL,
    semestre INTEGER NOT NULL CHECK (semestre IN (1, 2)),
    periodo INTEGER NOT NULL CHECK (periodo >= 1 AND periodo <= 12),
    disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
    professor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Associação aluno-turma (N:N)
CREATE TABLE turma_alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(turma_id, aluno_id)
);

CREATE INDEX idx_turma_alunos_turma ON turma_alunos(turma_id);
CREATE INDEX idx_turma_alunos_aluno ON turma_alunos(aluno_id);

-- ============================================================
-- 3. BANCO DE QUESTÕES (FAMP Quest)
-- ============================================================
CREATE TYPE difficulty_level AS ENUM ('facil', 'medio', 'dificil');
CREATE TYPE question_type AS ENUM ('multipla_escolha', 'verdadeiro_falso', 'dissertativa');

CREATE TABLE temas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_temas_disciplina ON temas(disciplina_id);

CREATE TABLE questoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enunciado TEXT NOT NULL,
    tipo question_type NOT NULL DEFAULT 'multipla_escolha',
    dificuldade difficulty_level NOT NULL DEFAULT 'medio',
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    tema_id UUID REFERENCES temas(id) ON DELETE SET NULL,
    explicacao TEXT, -- Explicação da resposta correta
    fonte TEXT, -- Referência bibliográfica
    ano_prova INTEGER, -- Ano da prova de origem (se aplicável)
    banca TEXT, -- Banca examinadora (se aplicável)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questoes_disciplina ON questoes(disciplina_id);
CREATE INDEX idx_questoes_tema ON questoes(tema_id);
CREATE INDEX idx_questoes_dificuldade ON questoes(dificuldade);

CREATE TABLE alternativas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    questao_id UUID NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    is_correta BOOLEAN NOT NULL DEFAULT FALSE,
    ordem INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alternativas_questao ON alternativas(questao_id);

-- ============================================================
-- 4. RESPOSTAS DOS ALUNOS (Progresso Individual)
-- ============================================================
CREATE TABLE respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    questao_id UUID NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
    alternativa_id UUID REFERENCES alternativas(id) ON DELETE SET NULL,
    resposta_texto TEXT, -- Para questões dissertativas
    is_correta BOOLEAN,
    tempo_resposta INTEGER, -- Tempo em segundos
    tentativa INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_respostas_aluno ON respostas(aluno_id);
CREATE INDEX idx_respostas_questao ON respostas(questao_id);
CREATE INDEX idx_respostas_aluno_questao ON respostas(aluno_id, questao_id);

-- ============================================================
-- 5. CADERNO DE ERROS
-- ============================================================
CREATE TABLE caderno_erros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    questao_id UUID NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
    resposta_id UUID REFERENCES respostas(id) ON DELETE SET NULL,
    notas TEXT, -- Anotações do aluno sobre o erro
    revisado BOOLEAN NOT NULL DEFAULT FALSE,
    revisado_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(aluno_id, questao_id)
);

CREATE INDEX idx_caderno_erros_aluno ON caderno_erros(aluno_id);

-- ============================================================
-- 6. SESSÕES DE ESTUDO (FAMP Planner)
-- ============================================================
CREATE TYPE session_status AS ENUM ('planejada', 'em_andamento', 'concluida', 'cancelada');

CREATE TABLE sessoes_estudo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tema_id UUID REFERENCES temas(id) ON DELETE SET NULL,
    disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status session_status NOT NULL DEFAULT 'planejada',
    data_planejada DATE NOT NULL,
    hora_inicio TIME,
    duracao_minutos INTEGER NOT NULL DEFAULT 90,
    duracao_real INTEGER, -- Minutos reais de estudo
    notas TEXT, -- Anotações da sessão (SQ3R)
    google_event_id TEXT, -- ID do evento no Google Calendar
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessoes_aluno ON sessoes_estudo(aluno_id);
CREATE INDEX idx_sessoes_data ON sessoes_estudo(data_planejada);
CREATE INDEX idx_sessoes_status ON sessoes_estudo(status);

-- ============================================================
-- 7. BIBLIOTECA (FAMP Library)
-- ============================================================
CREATE TYPE content_type AS ENUM ('video', 'pdf', 'artigo', 'link_externo');

CREATE TABLE conteudos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo content_type NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
    tema_id UUID REFERENCES temas(id) ON DELETE SET NULL,
    duracao_minutos INTEGER, -- Para vídeos
    total_paginas INTEGER, -- Para PDFs
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conteudos_disciplina ON conteudos(disciplina_id);
CREATE INDEX idx_conteudos_tipo ON conteudos(tipo);

-- Progresso do aluno em conteúdos
CREATE TABLE progresso_conteudo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    conteudo_id UUID NOT NULL REFERENCES conteudos(id) ON DELETE CASCADE,
    progresso_percentual NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100),
    ultimo_ponto TEXT, -- Timestamp do vídeo ou página do PDF
    concluido BOOLEAN NOT NULL DEFAULT FALSE,
    concluido_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(aluno_id, conteudo_id)
);

CREATE INDEX idx_progresso_aluno ON progresso_conteudo(aluno_id);

-- ============================================================
-- 8. AVISOS (Central de Avisos)
-- ============================================================
CREATE TYPE aviso_prioridade AS ENUM ('baixa', 'normal', 'alta', 'urgente');

CREATE TABLE avisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    prioridade aviso_prioridade NOT NULL DEFAULT 'normal',
    autor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE, -- NULL = todos
    periodo_alvo INTEGER, -- NULL = todos os períodos
    expira_em TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avisos_turma ON avisos(turma_id);
CREATE INDEX idx_avisos_prioridade ON avisos(prioridade);

CREATE TABLE avisos_lidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aviso_id UUID NOT NULL REFERENCES avisos(id) ON DELETE CASCADE,
    aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    lido_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(aviso_id, aluno_id)
);

-- ============================================================
-- 9. TUTOR IA (Histórico de Conversas)
-- ============================================================
CREATE TABLE tutor_conversas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    titulo TEXT,
    disciplina_id UUID REFERENCES disciplinas(id) ON DELETE SET NULL,
    questao_id UUID REFERENCES questoes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tutor_conversas_aluno ON tutor_conversas(aluno_id);

CREATE TABLE tutor_mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversa_id UUID NOT NULL REFERENCES tutor_conversas(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB, -- Referências, fontes citadas, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tutor_mensagens_conversa ON tutor_mensagens(conversa_id);

-- ============================================================
-- 10. ANALYTICS (Métricas de Engajamento)
-- ============================================================
CREATE TABLE analytics_eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    evento TEXT NOT NULL, -- 'login', 'questao_respondida', 'sessao_iniciada', etc.
    metadata JSONB, -- Dados adicionais do evento
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_eventos(user_id);
CREATE INDEX idx_analytics_evento ON analytics_eventos(evento);
CREATE INDEX idx_analytics_created ON analytics_eventos(created_at);

-- ============================================================
-- 11. PREVISÃO FUTURA: Flashcards (Fase 2)
-- ============================================================
CREATE TABLE flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tema_id UUID REFERENCES temas(id) ON DELETE SET NULL,
    frente TEXT NOT NULL, -- Gatilho
    verso TEXT NOT NULL, -- Regra/Resposta
    intervalo_dias INTEGER NOT NULL DEFAULT 1,
    fator_facilidade NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    repeticoes INTEGER NOT NULL DEFAULT 0,
    proxima_revisao DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcards_aluno ON flashcards(aluno_id);
CREATE INDEX idx_flashcards_revisao ON flashcards(proxima_revisao);

-- ============================================================
-- 12. PREVISÃO FUTURA: Gamificação (Fase 2)
-- ============================================================
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    descricao TEXT,
    icone_url TEXT,
    criterio JSONB NOT NULL, -- Critérios para conquistar
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE aluno_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    conquistado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(aluno_id, badge_id)
);

-- ============================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_disciplinas_updated_at BEFORE UPDATE ON disciplinas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_turmas_updated_at BEFORE UPDATE ON turmas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_questoes_updated_at BEFORE UPDATE ON questoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sessoes_updated_at BEFORE UPDATE ON sessoes_estudo FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_conteudos_updated_at BEFORE UPDATE ON conteudos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_avisos_updated_at BEFORE UPDATE ON avisos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tutor_conversas_updated_at BEFORE UPDATE ON tutor_conversas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_flashcards_updated_at BEFORE UPDATE ON flashcards FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Políticas Básicas
-- ============================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turma_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alternativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE caderno_erros ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_estudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_conteudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos_lidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_eventos ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Política: Admin e Coordenação podem ver todos os perfis
CREATE POLICY "Admin can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coordenacao')
        )
    );

-- Política: Alunos podem ver suas próprias respostas
CREATE POLICY "Students can manage own answers" ON respostas
    FOR ALL USING (auth.uid() = aluno_id);

-- Política: Alunos podem gerenciar suas sessões de estudo
CREATE POLICY "Students can manage own sessions" ON sessoes_estudo
    FOR ALL USING (auth.uid() = aluno_id);

-- Política: Alunos podem gerenciar seu caderno de erros
CREATE POLICY "Students can manage own error notebook" ON caderno_erros
    FOR ALL USING (auth.uid() = aluno_id);

-- Política: Todos autenticados podem ver disciplinas e questões
CREATE POLICY "Authenticated can view disciplines" ON disciplinas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can view questions" ON questoes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can view alternatives" ON alternativas
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Todos autenticados podem ver avisos
CREATE POLICY "Authenticated can view announcements" ON avisos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política: Todos autenticados podem ver conteúdos
CREATE POLICY "Authenticated can view content" ON conteudos
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- FIM DO SCHEMA
-- ============================================================
