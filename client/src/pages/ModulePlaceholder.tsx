/**
 * FAMP Academy — Module Placeholder Pages
 * Páginas temporárias para módulos ainda não implementados.
 * Cada uma exibe o layout do dashboard com mensagem de "em construção".
 */

import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  Calendar,
  FileQuestion,
  Bot,
  BookOpen,
  AlertTriangle,
  BarChart3,
  Users,
  Bell,
  Layers,
  ArrowLeft,
  Wrench,
  Stethoscope,
  Building2,
} from 'lucide-react';

interface ModuleConfig {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  description: string;
  features: string[];
}

const MODULES: Record<string, ModuleConfig> = {
  planner: {
    title: 'FAMP Planner',
    subtitle: 'Motor de Estudo',
    icon: Calendar,
    description: 'Organize sessões de 90 minutos por tema, com integração ao Google Calendar.',
    features: ['Sessões de 90min/tema', 'Sync com Google Calendar', 'Histórico de sessões', 'Notas e anotações SQ3R'],
  },
  quest: {
    title: 'FAMP Quest',
    subtitle: 'Banco de Questões',
    icon: FileQuestion,
    description: 'Resolva questões com filtros avançados e acompanhe seu progresso individual.',
    features: ['Filtros por disciplina e tema', 'Níveis de dificuldade', 'Progresso salvo automaticamente', 'Explicações detalhadas'],
  },
  tutor: {
    title: 'FAMP Tutor IA',
    subtitle: 'Assistente Socrático',
    icon: Bot,
    description: 'Converse com o Tutor IA para entender conceitos e discutir questões.',
    features: ['Método socrático', 'Referências científicas', 'Contexto por disciplina', 'Escopo acadêmico restrito'],
  },
  library: {
    title: 'FAMP Library',
    subtitle: 'Biblioteca Digital',
    icon: BookOpen,
    description: 'Acesse videoaulas e PDFs institucionais com rastreio de progresso.',
    features: ['Videoaulas organizadas', 'PDFs institucionais', 'Continue de onde parou', 'Busca por disciplina'],
  },
  'caderno-erros': {
    title: 'Caderno de Erros',
    subtitle: 'Revisão Inteligente',
    icon: AlertTriangle,
    description: 'Revise questões erradas agrupadas por tema com sugestões de revisão.',
    features: ['Agrupamento por tema', 'Sugestões de revisão', 'Marcar como revisado', 'Anotações pessoais'],
  },
  flashcards: {
    title: 'Flashcards',
    subtitle: 'Revisão Espaçada',
    icon: Layers,
    description: 'Sistema de repetição espaçada para memorização de conceitos-chave.',
    features: ['Spaced Repetition System', 'Flashcards modelo', 'Gatilho → Regra', 'Baseado nos seus erros'],
  },
  analytics: {
    title: 'FAMP Analytics',
    subtitle: 'Painel Gerencial',
    icon: BarChart3,
    description: 'Métricas de adesão, tempo de uso e taxa de acerto por disciplina.',
    features: ['DAU/WAU', 'Tempo de uso', 'Taxa de acerto', 'Temas críticos', 'Exportação CSV/XLSX/PDF'],
  },
  turmas: {
    title: 'Gestão de Turmas',
    subtitle: 'Administração',
    icon: Users,
    description: 'Gerencie turmas, disciplinas e associações de alunos.',
    features: ['Criar/editar turmas', 'Associar alunos', 'Importar via planilha', 'Vincular professores'],
  },
  avisos: {
    title: 'Central de Avisos',
    subtitle: 'Comunicados',
    icon: Bell,
    description: 'Envie comunicados para turmas específicas ou todos os alunos.',
    features: ['Avisos por turma', 'Prioridades', 'Controle de leitura', 'Expiração automática'],
  },
  enamed: {
    title: 'ENAMED',
    subtitle: 'Preparatório ENAMED',
    icon: Stethoscope,
    description: 'Módulo dedicado à preparação para o Exame Nacional de Desempenho dos Estudantes de Medicina.',
    features: ['Simulações completas', 'Questões por eixo', 'Ranking comparativo', 'Revisão dirigida'],
  },
  internato: {
    title: 'Internato',
    subtitle: 'Módulo de Internato',
    icon: Building2,
    description: 'Acompanhamento e gestão das atividades do internato médico.',
    features: ['Registro de procedimentos', 'Logbook digital', 'Avaliação por preceptor', 'Escala de plantões'],
  },
};

export function createModulePage(moduleKey: string) {
  const config = MODULES[moduleKey];
  if (!config) return () => null;

  return function ModulePage() {
    const Icon = config.icon;

    return (
      <DashboardLayout title={config.title} subtitle={config.subtitle}>
        <div className="p-5 max-w-2xl mx-auto">
          <Link href="/dashboard">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Voltar ao Dashboard
            </span>
          </Link>

          <Card className="card-famp">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <Icon className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {config.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {config.description}
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-mono mb-6">
                <Wrench className="w-3 h-3" />
                Em desenvolvimento
              </div>

              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto text-left mb-6">
                {config.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              <Button variant="outline" asChild>
                <Link href="/dashboard">Voltar ao Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  };
}

// Export individual module pages
export const PlannerPage = createModulePage('planner');
export const QuestPage = createModulePage('quest');
export const TutorPage = createModulePage('tutor');
export const LibraryPage = createModulePage('library');
export const CadernoErrosPage = createModulePage('caderno-erros');
export const FlashcardsPage = createModulePage('flashcards');
export const AnalyticsPage = createModulePage('analytics');
export const TurmasPage = createModulePage('turmas');
export const AvisosPage = createModulePage('avisos');
export const ENAMEDPage = createModulePage('enamed');
export const InternatoPage = createModulePage('internato');
