# FAMP Academy — Regras de Acesso por Perfil

Este documento define as permissões e funcionalidades disponíveis para cada perfil de usuário na plataforma FAMP Academy. Serve como referência para o desenvolvimento futuro de funcionalidades de professor e coordenador.

## Perfis de Acesso

| Perfil | Código | Descrição |
|---|---|---|
| Aluno | `aluno` | Estudante matriculado na FAMP |
| Professor | `professor` | Docente responsável por disciplinas |
| Coordenação | `coordenacao` | Coordenador de curso |
| Administrador | `admin` | Acesso total ao sistema |

## Funcionalidades por Perfil

### Aluno

O aluno é o usuário principal da plataforma. Suas funcionalidades incluem:

- Assistir videoaulas na FAMP Library
- Visualizar playlists criadas pelos professores (filtradas pelo período em que está matriculado)
- Avaliar aulas com estrelas e comentários
- Acompanhar progresso pessoal de assistência (barra de progresso com indicador de 90%)
- Receber notificações quando novas playlists forem criadas para seu período
- Receber e-mail automático sobre novas playlists (via e-mail cadastrado na plataforma)
- Resolver questões no FAMP Quest
- Usar o Caderno de Erros
- Acessar o FAMP Tutor IA
- Visualizar desempenho pessoal

O aluno **não pode** criar playlists, criar provas, nem acessar painéis de estatísticas de outros alunos.

### Professor

O professor tem acesso às funcionalidades de criação de conteúdo. Suas funcionalidades incluem:

- **Criar playlists personalizadas** para turmas (1º ao 8º período), selecionando e ordenando vídeos
- **Criar provas para treino em casa** após o conteúdo da aula ministrado em sala de aula (a implementar)
- Reordenar vídeos dentro das playlists via drag-and-drop
- Excluir playlists que criou
- Assistir videoaulas (mesmas funcionalidades do aluno na Library)

O professor **não tem** acesso ao painel de estatísticas de alunos. Essa função é exclusiva da coordenação.

### Coordenação

A coordenação tem acesso a todas as funcionalidades de gestão e monitoramento. Suas funcionalidades incluem:

- **Painel de Estatísticas** (a implementar como tela dedicada):
  - Ver quais alunos completaram cada playlist
  - Ver quais alunos assistiram mais de 90% de cada aula (métrica de engajamento)
  - Acompanhar o progresso geral dos alunos por período
  - Exportar relatórios de engajamento em Excel/PDF
- Todas as funcionalidades do professor (criar playlists, criar provas)
- Gerenciar avisos e comunicados
- Gerenciar turmas

### Administrador

O administrador tem acesso total ao sistema, incluindo todas as funcionalidades da coordenação mais configurações técnicas.

## Métricas de Engajamento (para Coordenação)

### Métrica de 90% Assistido

Quando um aluno assiste mais de 90% de uma videoaula, o sistema registra automaticamente um `VideoCompletionRecord` contendo:

| Campo | Descrição |
|---|---|
| `alunoId` | ID do aluno |
| `alunoNome` | Nome completo do aluno |
| `alunoEmail` | E-mail institucional |
| `alunoPeriodo` | Período em que está matriculado |
| `videoId` | ID do vídeo assistido |
| `videoTitle` | Título do vídeo |
| `completedAt` | Data/hora da conclusão |
| `watchPercentage` | Percentual assistido (>= 90) |

Esses registros ficam armazenados em localStorage atualmente (`famp-video-completions`). Quando o backend Supabase for integrado, devem ser migrados para uma tabela `video_completions` no banco de dados.

### Sistema de Notificações

Quando um professor cria uma nova playlist, o sistema:

1. Registra uma `AppNotification` no localStorage (`famp-notifications`)
2. Exibe um toast de confirmação para o professor
3. Em produção, deve disparar um e-mail via Supabase Edge Function para todos os alunos do período correspondente

As notificações ficam armazenadas em localStorage atualmente. Quando o backend for integrado, devem ser migrados para uma tabela `notifications` com envio real de e-mail via serviço como Resend, SendGrid ou Supabase Edge Functions.

## Próximos Passos de Desenvolvimento

1. **Painel do Coordenador**: Criar tela `/analytics` com dashboards de engajamento usando Recharts
2. **Provas do Professor**: Criar módulo de criação de provas para treino em casa
3. **Integração Supabase**: Migrar localStorage para tabelas no banco de dados
4. **E-mail Real**: Implementar envio de e-mail via Supabase Edge Functions
5. **Notificações Push**: Adicionar notificações push no navegador
