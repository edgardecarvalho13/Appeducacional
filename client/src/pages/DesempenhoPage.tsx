/**
 * Relatório de Desempenho — Performance analytics
 * Design: Command Center dark theme with teal accent.
 * Features: Charts by area, subarea, difficulty, bloom level, timeline.
 */

import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';
import {
  ArrowLeft,
  BarChart3,
  Brain,
  FileQuestion,
  Target,
  Trophy,
  TrendingUp,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { useQuestStore } from '@/hooks/useQuestStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const CHART_COLORS = [
  '#2dd4bf', '#22d3ee', '#818cf8', '#f472b6', '#fb923c',
  '#a3e635', '#facc15', '#e879f9', '#34d399', '#f87171',
  '#60a5fa', '#c084fc', '#fbbf24', '#4ade80', '#f97316',
];

const DIFFICULTY_COLORS: Record<string, string> = {
  'Fácil': '#4ade80',
  'Média': '#facc15',
  'Difícil': '#f87171',
};

type TabKey = 'geral' | 'area' | 'subarea' | 'dificuldade' | 'bloom' | 'timeline';

export default function DesempenhoPage() {
  const { stats, allQuestions } = useQuestStore();
  const [activeTab, setActiveTab] = useState<TabKey>('geral');

  // Area chart data
  const areaData = useMemo(() => {
    return Object.entries(stats.byArea)
      .filter(([, v]) => v.answered > 0)
      .map(([name, v]) => ({
        name: name.length > 20 ? name.slice(0, 18) + '...' : name,
        fullName: name,
        acertos: v.correct,
        erros: v.answered - v.correct,
        total: v.total,
        taxa: v.answered > 0 ? Math.round((v.correct / v.answered) * 100) : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa);
  }, [stats.byArea]);

  // Subarea chart data
  const subareaData = useMemo(() => {
    return Object.entries(stats.bySubarea)
      .filter(([, v]) => v.answered > 0)
      .map(([name, v]) => ({
        name: name.length > 18 ? name.slice(0, 16) + '...' : name,
        fullName: name,
        acertos: v.correct,
        erros: v.answered - v.correct,
        taxa: v.answered > 0 ? Math.round((v.correct / v.answered) * 100) : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa);
  }, [stats.bySubarea]);

  // Difficulty pie data
  const difficultyData = useMemo(() => {
    return Object.entries(stats.byDificuldade)
      .filter(([, v]) => v.answered > 0)
      .map(([name, v]) => ({
        name,
        acertos: v.correct,
        erros: v.answered - v.correct,
        taxa: v.answered > 0 ? Math.round((v.correct / v.answered) * 100) : 0,
        total: v.answered,
      }));
  }, [stats.byDificuldade]);

  // Bloom radar data
  const bloomData = useMemo(() => {
    return Object.entries(stats.byBloom)
      .filter(([, v]) => v.answered > 0)
      .map(([name, v]) => ({
        subject: name,
        taxa: v.answered > 0 ? Math.round((v.correct / v.answered) * 100) : 0,
        total: v.answered,
      }));
  }, [stats.byBloom]);

  // Timeline data
  const timelineData = useMemo(() => {
    return stats.timeline.map(d => ({
      date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      respondidas: d.answered,
      corretas: d.correct,
    }));
  }, [stats.timeline]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'geral', label: 'Visão Geral', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { key: 'area', label: 'Por Grande Área', icon: <Target className="w-3.5 h-3.5" /> },
    { key: 'subarea', label: 'Por Especialidade', icon: <FileQuestion className="w-3.5 h-3.5" /> },
    { key: 'dificuldade', label: 'Dificuldade', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'bloom', label: 'Nível Cognitivo', icon: <Brain className="w-3.5 h-3.5" /> },
    { key: 'timeline', label: 'Evolução', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
        <p className="font-medium text-foreground mb-1">{payload[0]?.payload?.fullName || label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
        {payload[0]?.payload?.taxa !== undefined && (
          <p className="text-muted-foreground mt-1">Taxa: {payload[0].payload.taxa}%</p>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout title="Desempenho" subtitle="Relatório de performance">
      <div className="p-5 max-w-6xl mx-auto">
        <Link href="/dashboard">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors cursor-pointer">
            <ArrowLeft className="w-3 h-3" /> Voltar ao Dashboard
          </span>
        </Link>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="w-3.5 h-3.5" />
              Resolvidas
            </div>
            <p className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{stats.totalAnswered}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Trophy className="w-3.5 h-3.5" />
              Acertos
            </div>
            <p className="text-xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>{stats.totalCorrect}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <XCircle className="w-3.5 h-3.5" />
              Erros
            </div>
            <p className="text-xl font-bold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>{stats.totalWrong}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Brain className="w-3.5 h-3.5" />
              Aproveitamento
            </div>
            <p className="text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-display)' }}>{stats.accuracy}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 p-1 bg-card border border-border rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs transition-all ${
                activeTab === tab.key
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {stats.totalAnswered === 0 && (
          <div className="text-center py-16">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h4 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Nenhuma questão respondida ainda
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Responda questões no FAMP Quest para ver seu relatório de desempenho aqui.
            </p>
            <Link href="/quest">
              <button className="mt-4 px-4 py-2 rounded-md text-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Ir para o FAMP Quest
              </button>
            </Link>
          </div>
        )}

        {stats.totalAnswered > 0 && (
          <>
            {/* TAB: Visão Geral */}
            {activeTab === 'geral' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Acertos vs Erros pie */}
                <Card className="card-famp">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <Trophy className="w-4 h-4 text-primary" />
                      Acertos vs Erros
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Acertos', value: stats.totalCorrect },
                            { name: 'Erros', value: stats.totalWrong },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          <Cell fill="#4ade80" />
                          <Cell fill="#f87171" />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          formatter={(value: string) => (
                            <span className="text-xs text-muted-foreground">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top areas */}
                <Card className="card-famp">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <Target className="w-4 h-4 text-primary" />
                      Taxa de Acerto por Grande Área
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={areaData.slice(0, 8)} layout="vertical" margin={{ left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 250)" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="taxa" name="Taxa (%)" fill="#2dd4bf" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Difficulty breakdown */}
                <Card className="card-famp">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Desempenho por Dificuldade
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={difficultyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 250)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="acertos" name="Acertos" stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="erros" name="Erros" stackId="a" fill="#f87171" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bloom radar */}
                <Card className="card-famp">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-semibold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                      <Brain className="w-4 h-4 text-primary" />
                      Nível Cognitivo (Bloom)
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={bloomData}>
                        <PolarGrid stroke="oklch(0.28 0.02 250)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748b' }} />
                        <Radar name="Taxa (%)" dataKey="taxa" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.2} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB: Por Área */}
            {activeTab === 'area' && (
              <Card className="card-famp">
                <CardContent className="p-5">
                  <h4 className="text-xs font-semibold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                    Desempenho por Grande Área
                  </h4>
                  {areaData.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Nenhuma grande área com questões respondidas.</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={Math.max(300, areaData.length * 40)}>
                        <BarChart data={areaData} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 250)" />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend formatter={(v: string) => <span className="text-xs text-muted-foreground">{v}</span>} />
                          <Bar dataKey="acertos" name="Acertos" stackId="a" fill="#4ade80" />
                          <Bar dataKey="erros" name="Erros" stackId="a" fill="#f87171" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Table */}
                      <div className="mt-6 border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 text-muted-foreground font-mono">Grande Área</th>
                              <th className="text-center p-3 text-muted-foreground font-mono">Total</th>
                              <th className="text-center p-3 text-muted-foreground font-mono">Acertos</th>
                              <th className="text-center p-3 text-muted-foreground font-mono">Erros</th>
                              <th className="text-center p-3 text-muted-foreground font-mono">Taxa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {areaData.map((d, i) => (
                              <tr key={i} className="border-t border-border">
                                <td className="p-3 text-foreground">{d.fullName}</td>
                                <td className="p-3 text-center text-muted-foreground">{d.total}</td>
                                <td className="p-3 text-center text-green-400">{d.acertos}</td>
                                <td className="p-3 text-center text-red-400">{d.erros}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    d.taxa >= 70 ? 'bg-green-500/20 text-green-400' :
                                    d.taxa >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {d.taxa}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB: Por Subárea */}
            {activeTab === 'subarea' && (
              <Card className="card-famp">
                <CardContent className="p-5">
                  <h4 className="text-xs font-semibold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                    Desempenho por Especialidade
                  </h4>
                  {subareaData.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Nenhuma especialidade com questões respondidas.</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={Math.max(300, subareaData.length * 35)}>
                        <BarChart data={subareaData} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 250)" />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend formatter={(v: string) => <span className="text-xs text-muted-foreground">{v}</span>} />
                          <Bar dataKey="acertos" name="Acertos" stackId="a" fill="#4ade80" />
                          <Bar dataKey="erros" name="Erros" stackId="a" fill="#f87171" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Table */}
                      <div className="mt-6 border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 text-muted-foreground font-mono">Especialidade</th>
                              <th className="text-center p-3 text-muted-foreground font-mono">Acertos</th>
                              <th className="text-center p-3 text-muted-foreground font-mono">Erros</th>
                              <th className="text-center p-3 text-muted-foreground font-mono">Taxa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subareaData.map((d, i) => (
                              <tr key={i} className="border-t border-border">
                                <td className="p-3 text-foreground">{d.fullName}</td>
                                <td className="p-3 text-center text-green-400">{d.acertos}</td>
                                <td className="p-3 text-center text-red-400">{d.erros}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    d.taxa >= 70 ? 'bg-green-500/20 text-green-400' :
                                    d.taxa >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    {d.taxa}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TAB: Dificuldade */}
            {activeTab === 'dificuldade' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="card-famp">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-semibold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                      Acertos por Dificuldade
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={difficultyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 250)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend formatter={(v: string) => <span className="text-xs text-muted-foreground">{v}</span>} />
                        <Bar dataKey="acertos" name="Acertos" fill="#4ade80" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="erros" name="Erros" fill="#f87171" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="card-famp">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-semibold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                      Taxa de Acerto por Dificuldade
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={difficultyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="taxa"
                          label={({ name, taxa }) => `${name}: ${taxa}%`}
                        >
                          {difficultyData.map((entry) => (
                            <Cell key={entry.name} fill={DIFFICULTY_COLORS[entry.name] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Difficulty cards */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {difficultyData.map(d => (
                        <div key={d.name} className="text-center p-2 rounded-lg border border-border">
                          <p className="text-[10px] text-muted-foreground mb-1">{d.name}</p>
                          <p className="text-lg font-bold" style={{ color: DIFFICULTY_COLORS[d.name], fontFamily: 'var(--font-display)' }}>
                            {d.taxa}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">{d.total} questões</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB: Bloom */}
            {activeTab === 'bloom' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="card-famp">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-semibold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                      Radar de Nível Cognitivo
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={bloomData}>
                        <PolarGrid stroke="oklch(0.28 0.02 250)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748b' }} />
                        <Radar name="Taxa (%)" dataKey="taxa" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.3} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="card-famp">
                  <CardContent className="p-5">
                    <h4 className="text-xs font-semibold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                      Detalhamento por Nível
                    </h4>
                    <div className="space-y-3">
                      {bloomData.map((d, i) => (
                        <div key={d.subject} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-foreground">{d.subject}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              d.taxa >= 70 ? 'bg-green-500/20 text-green-400' :
                              d.taxa >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {d.taxa}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${d.taxa}%`,
                                background: d.taxa >= 70 ? '#4ade80' : d.taxa >= 50 ? '#facc15' : '#f87171',
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{d.total} questões respondidas</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB: Timeline */}
            {activeTab === 'timeline' && (
              <Card className="card-famp">
                <CardContent className="p-5">
                  <h4 className="text-xs font-semibold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                    Evolução nos Últimos 7 Dias
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 250)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend formatter={(v: string) => <span className="text-xs text-muted-foreground">{v}</span>} />
                      <Line
                        type="monotone"
                        dataKey="respondidas"
                        name="Respondidas"
                        stroke="#2dd4bf"
                        strokeWidth={2}
                        dot={{ fill: '#2dd4bf', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="corretas"
                        name="Corretas"
                        stroke="#4ade80"
                        strokeWidth={2}
                        dot={{ fill: '#4ade80', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Daily summary */}
                  <div className="mt-6 border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-muted-foreground font-mono">Data</th>
                          <th className="text-center p-3 text-muted-foreground font-mono">Respondidas</th>
                          <th className="text-center p-3 text-muted-foreground font-mono">Corretas</th>
                          <th className="text-center p-3 text-muted-foreground font-mono">Taxa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timelineData.map((d, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="p-3 text-foreground">{d.date}</td>
                            <td className="p-3 text-center text-foreground">{d.respondidas}</td>
                            <td className="p-3 text-center text-green-400">{d.corretas}</td>
                            <td className="p-3 text-center">
                              {d.respondidas > 0 ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  (d.corretas / d.respondidas * 100) >= 70 ? 'bg-green-500/20 text-green-400' :
                                  (d.corretas / d.respondidas * 100) >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {Math.round(d.corretas / d.respondidas * 100)}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
