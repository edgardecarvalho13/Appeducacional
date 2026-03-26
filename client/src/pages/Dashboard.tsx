/*
 * FAMP Academy — Student Dashboard
 * Design: "Command Center" — Densidade informacional elegante.
 * Foco em MOTIVAÇÃO + REALISMO, sem causar ansiedade.
 * Grid de widgets com métricas, sparklines, sessão do dia e atalhos.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlannerStore } from '@/hooks/usePlannerStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import VIDEOS from '@/data/videos.json';
import {
  MOCK_METRICS,
  MOCK_SESSOES,
  MOCK_AVISOS,
  MODULE_SHORTCUTS,
  MOCK_WEEKLY_PERFORMANCE,
  MOCK_DISCIPLINE_PERFORMANCE,
} from '@/lib/mock-data';
import {
  Target,
  Clock,
  Flame,
  TrendingUp,
  Play,
  ChevronRight,
  Calendar,
  FileQuestion,
  Bot,
  BookOpen,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Award,
  Zap,
  BookMarked,
  Lightbulb,
} from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { motion } from 'framer-motion';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310419663031165931/GTVSswVQbMzxsTPY394qoU/famp-hero-banner-9LKT2Zp2VHhNFi5wzX4RWR.webp';

const ICON_MAP: Record<string, React.ElementType> = {
  Calendar,
  FileQuestion,
  Bot,
  BookOpen,
  AlertTriangle,
  Layers,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getStatusColor(status: string) {
  switch (status) {
    case 'concluida': return 'text-green-400';
    case 'em_andamento': return 'text-yellow-400';
    case 'planejada': return 'text-primary';
    case 'cancelada': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'concluida': return 'Concluída';
    case 'em_andamento': return 'Em andamento';
    case 'planejada': return 'Planejada';
    case 'cancelada': return 'Cancelada';
    default: return status;
  }
}

function getPrioridadeStyle(p: string) {
  switch (p) {
    case 'urgente': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'alta': return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'normal': return 'bg-primary/15 text-primary border-primary/30';
    case 'baixa': return 'bg-muted text-muted-foreground border-border';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}



// Mock achievements/badges
const ACHIEVEMENTS = [
  { id: 1, title: 'Sequência de 12 dias', icon: Flame, color: 'text-orange-400' },
  { id: 2, title: 'Taxa de acerto > 70%', icon: Target, color: 'text-green-400' },
  { id: 3, title: 'Estudo consistente', icon: Zap, color: 'text-yellow-400' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { temas, etapas } = usePlannerStore();
  const metrics = MOCK_METRICS;
  const firstName = user?.full_name.split(' ')[0] || 'Estudante';

  // Filter avisos: apenas importantes (alta/urgente) e materiais novos
  const avisosImportantes = MOCK_AVISOS.filter(a => 
    a.prioridade === 'alta' || a.prioridade === 'urgente' || a.titulo.includes('material')
  );

  // Buscar próxima sessão do Planner onde NENHUMA etapa foi iniciada
  // Se qualquer etapa já foi concluída, pular para a próxima sessão
  const proximaSessaoPlanner = temas
    .filter(t => {
      if (t.status === 'concluida') return false;
      // Verificar se NENHUMA etapa deste tema foi concluída
      const etapasTema = etapas.filter(e => e.temaId === t.id);
      const algumaConcluida = etapasTema.some(e => e.status === 'concluido');
      return !algumaConcluida;
    })
    .sort((a, b) => a.dataBase.localeCompare(b.dataBase))[0];

  // Sugerir aula da Library baseado nos temas do Planner
  const aulaSugerida = proximaSessaoPlanner
    ? VIDEOS.videos.find((v: any) => 
        v.tema?.toLowerCase().includes(proximaSessaoPlanner.tema.toLowerCase()) ||
        v.especialidade?.toLowerCase().includes(proximaSessaoPlanner.especialidade.toLowerCase())
      )
    : VIDEOS.videos[0];

  return (
    <DashboardLayout title="Dashboard" subtitle={`${user?.periodo}º Período`}>
      <motion.div
        className="p-5 space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Banner */}
        <motion.div variants={itemVariants}>
          <div
            className="relative rounded-lg overflow-hidden h-[140px]"
            style={{
              backgroundImage: `url(${HERO_BG})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
            <div className="relative h-full flex flex-col justify-center px-6">
              <p className="text-xs text-primary font-mono mb-1">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {getGreeting()}, {firstName}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {metrics.sequenciaDias > 0
                  ? `Sequência de ${metrics.sequenciaDias} dias de estudo. Continue assim!`
                  : 'Comece sua sessão de estudo hoje!'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Metrics Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Taxa de Acerto"
            value={`${metrics.taxaAcerto}%`}
            icon={Target}
            trend="+3.2%"
            trendUp
          />
          <MetricCard
            label="Questões Resolvidas"
            value={metrics.questoesResolvidas.toString()}
            icon={FileQuestion}
            sublabel={`${metrics.questoesCorretas} corretas`}
          />
          <MetricCard
            label="Tempo Hoje"
            value={`${metrics.tempoEstudoHoje}min`}
            icon={Clock}
            sublabel="de 90min planejados"
            progress={(metrics.tempoEstudoHoje / 90) * 100}
          />
          <MetricCard
            label="Sequência"
            value={`${metrics.sequenciaDias} dias`}
            icon={Flame}
            highlight
          />
        </motion.div>

        {/* Main Grid: 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Seu Progresso Esta Semana */}
            <motion.div variants={itemVariants}>
              <Card className="card-famp">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    ✨ Seu Progresso Esta Semana
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">+3 aulas concluídas</p>
                      <p className="text-xs text-muted-foreground">Você está no caminho certo!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sequência mantida</p>
                      <p className="text-xs text-muted-foreground">{metrics.sequenciaDias} dias estudando regularmente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Session - Improved */}
            <motion.div variants={itemVariants}>
              <Card className="card-famp border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                      🎯 Próxima Sessão de Estudo
                    </CardTitle>
                    <Link href="/planner">
                      <span className="text-xs text-primary hover:underline flex items-center gap-1">
                        Ver Planner <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {proximaSessaoPlanner ? (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Play className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{proximaSessaoPlanner.especialidade}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{proximaSessaoPlanner.tema}</p>
                        <div className="flex items-center gap-3 mt-3 text-xs font-mono text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(proximaSessaoPlanner.dataBase).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="flex items-center gap-1 text-primary">
                            <span className="status-dot status-dot-active" />
                            Planejada
                          </span>
                        </div>
                      </div>
                      <Link href={`/planner?tema=${proximaSessaoPlanner.id}`}>
                        <Button size="sm" className="shrink-0 bg-primary hover:bg-primary/90">
                          Ir para Sessão
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma sessão planejada. Crie um tema no Planner para começar!</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* 3. Trilhas de Aprendizagem da FAMP Library */}
            <motion.div variants={itemVariants}>
              <Card className="card-famp">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                      🎬 Trilhas de Aprendizagem
                    </CardTitle>
                    <Link href="/library">
                      <span className="text-xs text-primary hover:underline flex items-center gap-1">
                        Ver todas <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {(VIDEOS.trilhas as any[]).slice(0, 4).map((trilha: any) => {
                      const videoCount = trilha.videos?.length || 0;
                      const h = Math.floor(trilha.duracao / 60);
                      const m = trilha.duracao % 60;
                      const duracaoStr = h > 0 ? `${h}h ${m}min` : `${m}min`;
                      return (
                        <Link key={trilha.id} href="/library">
                          <div className="group p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{trilha.titulo}</h4>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{trilha.descricao}</p>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Play className="w-2.5 h-2.5" /> {videoCount} vídeos
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {duracaoStr}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Vídeos Recentes */}
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Vídeos em Destaque</h4>
                    <div className="space-y-2">
                      {(VIDEOS.videos as any[]).slice(0, 3).map((video: any) => (
                        <Link key={video.id} href="/library">
                          <div className="group flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                            <div className="relative w-16 h-10 rounded overflow-hidden bg-muted/50 shrink-0">
                              <img
                                src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                <Play className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{video.title}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {video.especialidade} · {video.duration}min
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Weekly Performance Chart */}
            <motion.div variants={itemVariants}>
              <Card className="card-famp">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    Desempenho Semanal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_WEEKLY_PERFORMANCE} barGap={2}>
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                        />
                        <YAxis hide />
                        <RechartsTooltip
                          contentStyle={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                          }}
                          labelStyle={{ color: 'var(--card-foreground)' }}
                        />
                        <Bar dataKey="questoes" name="Total" radius={[3, 3, 0, 0]} maxBarSize={28}>
                          {MOCK_WEEKLY_PERFORMANCE.map((_, i) => (
                            <Cell key={i} fill="var(--border)" />
                          ))}
                        </Bar>
                        <Bar dataKey="acertos" name="Acertos" radius={[3, 3, 0, 0]} maxBarSize={28}>
                          {MOCK_WEEKLY_PERFORMANCE.map((_, i) => (
                            <Cell key={i} fill="var(--primary)" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Module Shortcuts Grid */}
            <motion.div variants={itemVariants}>
              <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Módulos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MODULE_SHORTCUTS.map(mod => {
                  const Icon = ICON_MAP[mod.icon] || FileQuestion;
                  return (
                    <Link key={mod.id} href={mod.href} onClick={(e) => {
                      if (mod.status === 'coming_soon') {
                        e.preventDefault();
                        toast.info('Em breve! Este módulo está em desenvolvimento.');
                      }
                    }}>
                      <Card className={`card-famp h-full group ${mod.status === 'coming_soon' ? 'opacity-50' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                              <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <h4 className="text-sm font-semibold mb-0.5">{mod.title}</h4>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{mod.description}</p>
                          {mod.badge && (
                            <span className="inline-block mt-2 text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {mod.badge}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-5">
            {/* 2. Próximos Passos */}
            <motion.div variants={itemVariants}>
              <Card className="card-famp border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    💡 Próximos Passos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-primary/5">
                    <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Quando estiver pronto</p>
                      <p className="text-[10px] text-muted-foreground">Considere estudar Exame Neurológico</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-primary/5">
                    <BookMarked className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Nova playlist</p>
                      <p className="text-[10px] text-muted-foreground">Seu professor criou uma playlist para o 1º período</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* 6. Achievements/Badges */}
            <motion.div variants={itemVariants}>
              <Card className="card-famp">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    🏆 Conquistas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ACHIEVEMENTS.map(achievement => {
                    const Icon = achievement.icon;
                    return (
                      <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <Icon className={`w-4 h-4 ${achievement.color}`} />
                        <p className="text-xs font-medium">{achievement.title}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Aula Sugerida da Library */}
            {aulaSugerida && (
              <motion.div variants={itemVariants}>
                <Card className="card-famp border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                      🎓 Aula Sugerida
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-primary font-mono mb-0.5">{(aulaSugerida as any).especialidade}</p>
                        <h4 className="text-xs font-semibold line-clamp-2">{(aulaSugerida as any).title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {(aulaSugerida as any).duration}min · {(aulaSugerida as any).tema}
                        </p>
                      </div>
                    </div>
                    <Link href="/library">
                      <Button size="sm" variant="outline" className="w-full mt-3">
                        Ver na Biblioteca
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Recent Sessions */}
            <motion.div variants={itemVariants}>
              <Card className="card-famp">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    Sessões Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {MOCK_SESSOES.map(sessao => (
                    <div key={sessao.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className="shrink-0">
                        {sessao.status === 'concluida' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{sessao.titulo}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {new Date(sessao.data_planejada).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          {sessao.duracao_real && ` · ${sessao.duracao_real}min`}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Discipline Performance */}
            <motion.div variants={itemVariants}>
              <Card className="card-famp">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                    Acerto por Disciplina
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_DISCIPLINE_PERFORMANCE.map(d => (
                    <div key={d.disciplina}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">{d.disciplina}</span>
                        <span className="text-xs font-mono text-primary">{d.acerto}%</span>
                      </div>
                      <Progress value={d.acerto} className="h-1.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* 5. Announcements - Simplified */}
            {avisosImportantes.length > 0 && (
              <motion.div variants={itemVariants}>
                <Card className="card-famp">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                        📢 Avisos Importantes
                      </CardTitle>
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {avisosImportantes.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {avisosImportantes.map(aviso => (
                      <div key={aviso.id} className="py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-start gap-2">
                          <AlertCircle className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            aviso.prioridade === 'alta' || aviso.prioridade === 'urgente'
                              ? 'text-orange-400'
                              : 'text-primary'
                          }`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium">{aviso.titulo}</p>
                              <span className={`text-[9px] px-1 py-0.5 rounded border ${getPrioridadeStyle(aviso.prioridade)}`}>
                                {aviso.prioridade}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{aviso.conteudo}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

// ============================================================
// Metric Card Sub-component
// ============================================================
interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  sublabel?: string;
  progress?: number;
  highlight?: boolean;
}

function MetricCard({ label, value, icon: Icon, trend, trendUp, sublabel, progress, highlight }: MetricCardProps) {
  return (
    <Card className="card-famp">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Icon className={`w-4 h-4 ${highlight ? 'text-orange-400' : 'text-primary'}`} />
          </div>
          {trend && (
            <span className={`text-[10px] font-mono flex items-center gap-0.5 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className={`w-3 h-3 ${!trendUp ? 'rotate-180' : ''}`} />
              {trend}
            </span>
          )}
        </div>
        <p className="text-xl font-bold font-mono tracking-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sublabel}</p>}
        {progress !== undefined && (
          <Progress value={Math.min(progress, 100)} className="h-1 mt-2" />
        )}
      </CardContent>
    </Card>
  );
}
