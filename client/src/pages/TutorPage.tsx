/**
 * FAMP Academy — FAMP Tutor IA Page
 * Página do assistente socrático com integração ao Gemini
 * Inclui seletor de contexto médico (disciplina) e botão Novo Chat
 */

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TutorChat from '@/components/TutorChat';
import { Card } from '@/components/ui/card';
import { Link } from 'wouter';
import { ArrowLeft, Stethoscope } from 'lucide-react';

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
  // Key para forçar re-mount do TutorChat quando a disciplina muda
  const [chatKey, setChatKey] = useState(0);

  const handleDisciplinaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDisciplina = e.target.value;
    setDisciplina(newDisciplina);
    // Reiniciar o chat ao trocar de disciplina
    setChatKey((prev) => prev + 1);
  };

  return (
    <DashboardLayout title="FAMP Tutor IA" subtitle="Assistente Socrático">
      <div className="p-5 max-w-4xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-3 h-3" /> Voltar ao Dashboard
            </span>
          </Link>

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

        <Card className="flex-1 overflow-hidden">
          <TutorChat key={chatKey} disciplina={disciplina || undefined} />
        </Card>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>O FAMP Tutor IA utiliza o Gemini para fornecer respostas personalizadas baseadas em contexto médico.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
