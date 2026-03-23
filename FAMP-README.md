# FAMP Academy — MVP Fase 1

Plataforma institucional de educação médica (LMS Especializado) para a Faculdade Morgana Potrich.

## Stack Tecnológica

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Frontend | React 19 + TypeScript + Vite | Implementado |
| Estilização | TailwindCSS 4 + shadcn/ui | Implementado |
| Roteamento | Wouter (client-side) | Implementado |
| Gráficos | Recharts | Implementado |
| Animações | Framer Motion | Implementado |
| Backend (futuro) | Supabase (PostgreSQL + Auth + Edge Functions) | Schema pronto |
| Deploy (futuro) | Vercel + GitHub CI/CD | Preparado |

## Estrutura do Projeto

```
famp-academy/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx    # Layout principal com sidebar + header + status bar
│   │   │   ├── ProtectedRoute.tsx     # Componente RBAC para rotas protegidas
│   │   │   └── Sidebar.tsx            # Sidebar compacta/expansível com navegação
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx         # Autenticação simulada com localStorage
│   │   │   └── ThemeContext.tsx        # Tema dark/light (dark padrão)
│   │   ├── lib/
│   │   │   ├── mock-data.ts           # Dados mockados (usuários, métricas, sessões)
│   │   │   ├── types.ts              # Tipos TypeScript espelhando o schema SQL
│   │   │   └── utils.ts              # Utilitários
│   │   ├── pages/
│   │   │   ├── Login.tsx              # Página de login com background gerado
│   │   │   ├── Dashboard.tsx          # Dashboard do aluno com métricas e widgets
│   │   │   ├── AccessDenied.tsx       # Página de acesso negado (RBAC)
│   │   │   ├── ModulePlaceholder.tsx  # Páginas placeholder para todos os módulos
│   │   │   ├── Home.tsx               # Redirect para login/dashboard
│   │   │   └── NotFound.tsx           # 404
│   │   ├── App.tsx                    # Rotas e providers
│   │   └── index.css                  # Design system FAMP (navy + teal)
│   └── index.html                     # Fontes: Inter Tight, Inter, JetBrains Mono
├── database-schema.sql                # Schema SQL completo para Supabase
├── ideas.md                           # Brainstorm de design (3 abordagens)
└── asset-urls.md                      # URLs dos assets visuais gerados
```

## Design System: "Command Center"

A filosofia de design é inspirada em centros de comando militar e painéis de controle de missão, adaptada para o contexto médico-acadêmico.

| Elemento | Valor |
|----------|-------|
| Fundo principal | Navy `#0D1B2A` (oklch 0.14 0.03 250) |
| Cor de acento | Teal `#20B2AA` (oklch 0.68 0.12 185) |
| Cards | Navy claro `#0F2942` (oklch 0.19 0.025 250) |
| Texto primário | Branco `#F7FAFC` (oklch 0.95 0.005 250) |
| Texto secundário | Cinza `#A0AEC0` (oklch 0.65 0.015 250) |
| Font Display | Inter Tight Bold |
| Font Body | Inter Regular |
| Font Data | JetBrains Mono |

## Autenticação e RBAC

O sistema implementa controle de acesso baseado em perfis (Role-Based Access Control). Nesta fase de desenvolvimento, a autenticação é simulada com dados mock e persistência em localStorage.

| Perfil | E-mail Demo | Acesso |
|--------|------------|--------|
| Aluno | joao.silva@famp.edu.br | Dashboard, Planner, Quest, Tutor, Library, Caderno |
| Professor | maria.santos@famp.edu.br | Dashboard + Turmas |
| Coordenação | coord@famp.edu.br | Dashboard + Analytics, Turmas, Avisos |
| Admin | admin@famp.edu.br | Acesso total |

A senha para todas as contas demo é qualquer valor (a validação de senha será implementada com Supabase Auth).

## Schema do Banco de Dados

O arquivo `database-schema.sql` contém o schema completo para execução no Supabase, incluindo:

- 16 tabelas cobrindo todos os módulos do MVP
- Enums tipados (user_role, difficulty_level, question_type, etc.)
- Índices otimizados para as queries mais frequentes
- Triggers de auto-update em `updated_at`
- Row Level Security (RLS) com políticas básicas de RBAC
- Previsão para Fase 2 (flashcards, gamificação)

## Próximos Passos

1. Configurar projeto Supabase e executar o schema SQL
2. Substituir mock-data pela SDK do Supabase (`@supabase/supabase-js`)
3. Implementar autenticação real com Supabase Auth
4. Desenvolver os módulos: Planner, Quest, Tutor IA, Library
5. Conectar ao GitHub e configurar deploy na Vercel
6. Integrar Google Calendar API e LLM API
