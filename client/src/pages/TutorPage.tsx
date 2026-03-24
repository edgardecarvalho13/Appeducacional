/**
 * FAMP Academy — FAMP Tutor IA Page
 * Página do assistente socrático com integração ao Gemini
 */

import DashboardLayout from '@/components/DashboardLayout';
import TutorChat from '@/components/TutorChat';
import { Card } from '@/components/ui/card';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function TutorPage() {
  return (
    <DashboardLayout title="FAMP Tutor IA" subtitle="Assistente Socrático">
      <div className="p-5 max-w-4xl mx-auto h-full flex flex-col">
        <Link href="/dashboard">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Voltar ao Dashboard
          </span>
        </Link>

        <Card className="flex-1 overflow-hidden">
          <TutorChat disciplina="Clínica Médica" />
        </Card>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>O FAMP Tutor IA utiliza o Gemini para fornecer respostas personalizadas baseadas em contexto médico.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
