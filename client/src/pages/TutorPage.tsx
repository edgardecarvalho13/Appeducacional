/**
 * FAMP Academy — FAMP Tutor IA Page
 * Página do assistente com dois modos: Chat Livre e Estudo Guiado (socrático)
 * Inclui seletor de disciplina, toggle de modo e botão Novo Chat
 */

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TutorChat from '@/components/TutorChat';
import { Card } from '@/components/ui/card';
import { Link } from 'wouter';
import { ArrowLeft, Stethoscope, MessageCircle, GraduationCap } from 'lucide-react';
import type { TutorMode } from '@/lib/gemini';

const DISCIPLINAS = [
  { value: '', label: 'Todas as disciplinas' },
  { value: 'Anatomia Humana', label: 'Anatomia Humana' },
  { value: 'Fisiologia', label: 'Fisiologia' },
  { value: 'Bioquímica', label: 'Bioquímica' },
  { value: 'Farmacologia', label: 'Farmacologia' },
  { value: 'Patologia', label: 'Patologia' },
  { value: 'Semiologia Médica', label: 'Semiologia Médica' },
  { value: 'Clínica Médica', label: 'Clínica Médica' },
  { value: 'Cirurgia', label: 'Cirurgia' },
  { value: 'Pediatria', label: 'Pediatria' },
  { value: 'Ginecologia e Obstetrícia', label: 'Ginecologia e Obstetrícia' },
  { value: 'Saúde Coletiva', label: 'Saúde Coletiva' },
  { value: 'Psiquiatria', label: 'Psiquiatria' },
  { value: 'Neurologia', label: 'Neurologia' },
  { value: 'Cardiologia', label: 'Cardiologia' },
  { value: 'Pneumologia', label: 'Pneumologia' },
  { value: 'Infectologia', label: 'Infectologia' },
  { value: 'Imunologia', label: 'Imunologia' },
  { value: 'Histologia e Embriologia', label: 'Histologia e Embriologia' },
  { value: 'Microbiologia', label: 'Microbiologia' },
];

export default function TutorPage() {
  const [disciplina, setDisciplina] = useState('Clínica Médica');
  const [mode, setMode] = useState<TutorMode>('chat');
  // Key para forçar re-mount do TutorChat quando a disciplina ou modo muda
  const [chatKey, setChatKey] = useState(0);

  const handleDisciplinaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDisciplina = e.target.value;
    setDisciplina(newDisciplina);
    setChatKey((prev) => prev + 1);
  };

  const handleModeChange = (newMode: TutorMode) => {
    if (newMode !== mode) {
      setMode(newMode);
      setChatKey((prev) => prev + 1);
    }
  };

  return (
    <DashboardLayout title="FAMP Tutor IA" subtitle="Assistente Socrático">
      <div className="p-5 max-w-4xl mx-auto h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <Link href="/dashboard">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3 h-3" /> Voltar ao Dashboard
            </span>
          </Link>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle de Modo */}
            <div className="flex items-center bg-card border border-border rounded-lg p-0.5">
              <button
                onClick={() => handleModeChange('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
                  mode === 'chat'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat Livre
              </button>
              <button
                onClick={() => handleModeChange('guided')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
                  mode === 'guided'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Estudo Guiado
              </button>
            </div>

            {/* Seletor de Disciplina */}
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              <select
                value={disciplina}
                onChange={handleDisciplinaChange}
                className="text-sm bg-card border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary cursor-pointer"
              >
                {DISCIPLINAS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden">
          <TutorChat key={chatKey} disciplina={disciplina || undefined} mode={mode} />
        </Card>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>
            {mode === 'guided'
              ? 'No modo Estudo Guiado, o tutor conduz a sessão fazendo perguntas para testar e aprofundar seu conhecimento.'
              : 'O FAMP Tutor IA utiliza o Gemini para fornecer respostas personalizadas baseadas em contexto médico.'}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
