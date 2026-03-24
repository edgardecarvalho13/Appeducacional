import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, AlertCircle, MessageSquarePlus, Sparkles, BookOpen, Stethoscope, Brain, Pill, Copy, Check, GraduationCap } from 'lucide-react';
import { generateTutorResponse, startGuidedSession, GeminiMessage, TutorMode } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TutorChatProps {
  disciplina?: string;
  mode?: TutorMode;
}

/* ─── Sugestões de perguntas por disciplina (modo chat) ─── */
interface SuggestionItem {
  icon: React.ReactNode;
  text: string;
}

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  { icon: <Stethoscope className="w-4 h-4" />, text: 'Quais são os sinais de insuficiência cardíaca?' },
  { icon: <Brain className="w-4 h-4" />, text: 'Explique a fisiopatologia do AVC isquêmico' },
  { icon: <Pill className="w-4 h-4" />, text: 'Qual a diferença entre AINEs e corticoides?' },
  { icon: <BookOpen className="w-4 h-4" />, text: 'Resuma o ciclo de Krebs de forma didática' },
];

const DISCIPLINA_SUGGESTIONS: Record<string, SuggestionItem[]> = {
  'Anatomia Humana': [
    { icon: <BookOpen className="w-4 h-4" />, text: 'Descreva a irrigação arterial do encéfalo' },
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Quais são os músculos do manguito rotador?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a anatomia do plexo braquial' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Quais são as relações anatômicas do estômago?' },
  ],
  'Fisiologia': [
    { icon: <Brain className="w-4 h-4" />, text: 'Como funciona o potencial de ação cardíaco?' },
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Explique o sistema renina-angiotensina-aldosterona' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Qual o papel do surfactante pulmonar?' },
    { icon: <Pill className="w-4 h-4" />, text: 'Como ocorre a filtração glomerular?' },
  ],
  'Farmacologia': [
    { icon: <Pill className="w-4 h-4" />, text: 'Qual o mecanismo de ação dos beta-bloqueadores?' },
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Compare os inibidores da ECA com os BRAs' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a farmacocinética dos antibióticos betalactâmicos' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Quais são os efeitos adversos dos opioides?' },
  ],
  'Clínica Médica': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Quais são os critérios diagnósticos de diabetes tipo 2?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Como manejar uma crise hipertensiva?' },
    { icon: <Pill className="w-4 h-4" />, text: 'Qual o tratamento de primeira linha para pneumonia comunitária?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Explique a classificação NYHA da insuficiência cardíaca' },
  ],
  'Cardiologia': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Quais são os critérios de Framingham para IC?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a fisiopatologia da fibrilação atrial' },
    { icon: <Pill className="w-4 h-4" />, text: 'Qual o manejo do IAM com supra de ST?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Como interpretar um ECG de bloqueio de ramo?' },
  ],
  'Pediatria': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Quais são os marcos do desenvolvimento infantil?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Como manejar bronquiolite em lactentes?' },
    { icon: <Pill className="w-4 h-4" />, text: 'Qual o calendário vacinal atualizado?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Explique a classificação de desidratação em crianças' },
  ],
  'Neurologia': [
    { icon: <Brain className="w-4 h-4" />, text: 'Quais são os tipos de cefaleia e seus diagnósticos diferenciais?' },
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Explique a escala de Glasgow e sua aplicação' },
    { icon: <Pill className="w-4 h-4" />, text: 'Qual o tratamento da epilepsia refratária?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Como diferenciar AVC isquêmico de hemorrágico?' },
  ],
  'Bioquímica': [
    { icon: <BookOpen className="w-4 h-4" />, text: 'Explique as etapas do ciclo de Krebs e sua importância' },
    { icon: <Brain className="w-4 h-4" />, text: 'Qual a diferença entre glicólise aeróbica e anaeróbica?' },
    { icon: <Pill className="w-4 h-4" />, text: 'Como funciona a cadeia transportadora de elétrons?' },
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Explique o metabolismo dos aminoácidos e o ciclo da ureia' },
  ],
  'Patologia': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Quais são os mecanismos de lesão celular reversível e irreversível?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a diferença entre necrose e apoptose' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Como ocorre o processo de inflamação aguda?' },
    { icon: <Pill className="w-4 h-4" />, text: 'Quais são as características das neoplasias benignas e malignas?' },
  ],
  'Semiologia Médica': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Como realizar a ausculta cardíaca e identificar sopros?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Quais são os sinais semiológicos de derrame pleural?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Explique a técnica de palpação abdominal e seus achados' },
    { icon: <Pill className="w-4 h-4" />, text: 'Como avaliar o estado neurológico de um paciente?' },
  ],
  'Cirurgia': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Quais são as indicações de apendicectomia de urgência?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a classificação de Hinchey para diverticulite' },
    { icon: <Pill className="w-4 h-4" />, text: 'Qual o manejo inicial do abdome agudo?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Como avaliar e tratar um paciente politraumatizado (ATLS)?' },
  ],
  'Ginecologia e Obstetrícia': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Quais são os critérios para diagnóstico de pré-eclâmpsia?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique as fases do trabalho de parto e suas durações' },
    { icon: <Pill className="w-4 h-4" />, text: 'Qual o rastreamento recomendado para câncer de colo uterino?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Como manejar diabetes gestacional?' },
  ],
  'Saúde Coletiva': [
    { icon: <BookOpen className="w-4 h-4" />, text: 'Quais são os princípios e diretrizes do SUS?' },
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Explique a diferença entre incidência e prevalência' },
    { icon: <Brain className="w-4 h-4" />, text: 'Como funciona a Estratégia Saúde da Família (ESF)?' },
    { icon: <Pill className="w-4 h-4" />, text: 'Quais são os tipos de estudos epidemiológicos?' },
  ],
  'Psiquiatria': [
    { icon: <Brain className="w-4 h-4" />, text: 'Quais são os critérios diagnósticos do transtorno depressivo maior?' },
    { icon: <Pill className="w-4 h-4" />, text: 'Compare os mecanismos de ação dos ISRS e dos tricíclicos' },
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Como avaliar risco de suicídio em um paciente?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Explique a diferença entre esquizofrenia e transtorno bipolar' },
  ],
  'Pneumologia': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Como classificar a gravidade da asma?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a fisiopatologia da DPOC' },
    { icon: <Pill className="w-4 h-4" />, text: 'Qual o tratamento do tromboembolismo pulmonar?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Como interpretar uma gasometria arterial?' },
  ],
  'Infectologia': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Qual o esquema de tratamento para tuberculose pulmonar?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a fisiopatologia da sepse e o protocolo de manejo' },
    { icon: <Pill className="w-4 h-4" />, text: 'Como escolher o antibiótico empírico para infecção urinária?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Quais são as indicações de profilaxia pós-exposição ao HIV?' },
  ],
  'Imunologia': [
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a diferença entre imunidade inata e adaptativa' },
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Como funcionam as reações de hipersensibilidade tipo I a IV?' },
    { icon: <Pill className="w-4 h-4" />, text: 'Qual o papel dos linfócitos T CD4+ e CD8+?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Explique o mecanismo de ação das vacinas de mRNA' },
  ],
  'Histologia e Embriologia': [
    { icon: <BookOpen className="w-4 h-4" />, text: 'Quais são os tipos de tecido epitelial e suas funções?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a embriogênese do coração e seus defeitos congênitos' },
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Qual a diferença entre os tipos de tecido conjuntivo?' },
    { icon: <Pill className="w-4 h-4" />, text: 'Como ocorre a gastrulação e a formação dos folhetos embrionários?' },
  ],
  'Microbiologia': [
    { icon: <Stethoscope className="w-4 h-4" />, text: 'Quais são os mecanismos de resistência bacteriana aos antibióticos?' },
    { icon: <Brain className="w-4 h-4" />, text: 'Explique a diferença entre bactérias Gram-positivas e Gram-negativas' },
    { icon: <Pill className="w-4 h-4" />, text: 'Como funcionam os mecanismos de patogenicidade viral?' },
    { icon: <BookOpen className="w-4 h-4" />, text: 'Quais são os principais fungos causadores de micoses sistêmicas?' },
  ],
};

/* ─── Temas para estudo guiado por disciplina ─── */
const GUIDED_TOPICS: Record<string, string[]> = {
  'Anatomia Humana': ['Sistema cardiovascular', 'Neuroanatomia', 'Aparelho locomotor', 'Anatomia do abdome'],
  'Fisiologia': ['Fisiologia cardíaca', 'Fisiologia renal', 'Fisiologia respiratória', 'Neurofisiologia'],
  'Bioquímica': ['Metabolismo energético', 'Ciclo de Krebs', 'Bioquímica das proteínas', 'Metabolismo lipídico'],
  'Farmacologia': ['Anti-hipertensivos', 'Antibióticos', 'Anti-inflamatórios', 'Analgésicos e opioides'],
  'Patologia': ['Inflamação e reparo', 'Neoplasias', 'Distúrbios hemodinâmicos', 'Lesão e morte celular'],
  'Semiologia Médica': ['Exame cardiovascular', 'Exame do abdome', 'Exame neurológico', 'Exame pulmonar'],
  'Clínica Médica': ['Hipertensão arterial', 'Diabetes mellitus', 'Insuficiência cardíaca', 'Pneumonias'],
  'Cirurgia': ['Abdome agudo', 'Trauma (ATLS)', 'Hérnias da parede abdominal', 'Pré e pós-operatório'],
  'Pediatria': ['Desenvolvimento infantil', 'Doenças respiratórias', 'Imunização', 'Desidratação e reidratação'],
  'Ginecologia e Obstetrícia': ['Pré-natal', 'Trabalho de parto', 'Síndromes hipertensivas', 'Câncer ginecológico'],
  'Saúde Coletiva': ['Princípios do SUS', 'Epidemiologia básica', 'Atenção primária', 'Vigilância em saúde'],
  'Psiquiatria': ['Transtornos do humor', 'Esquizofrenia', 'Transtornos de ansiedade', 'Psicofarmacologia'],
  'Neurologia': ['AVC', 'Epilepsia', 'Cefaleias', 'Doenças neurodegenerativas'],
  'Cardiologia': ['Síndromes coronarianas', 'Arritmias', 'Valvopatias', 'Insuficiência cardíaca'],
  'Pneumologia': ['Asma', 'DPOC', 'Tromboembolismo pulmonar', 'Gasometria arterial'],
  'Infectologia': ['Tuberculose', 'HIV/AIDS', 'Sepse', 'Infecções urinárias'],
  'Imunologia': ['Imunidade inata vs adaptativa', 'Hipersensibilidades', 'Autoimunidade', 'Imunodeficiências'],
  'Histologia e Embriologia': ['Tecidos epiteliais', 'Embriogênese', 'Tecido conjuntivo', 'Tecido nervoso'],
  'Microbiologia': ['Bacteriologia', 'Virologia', 'Micologia', 'Resistência antimicrobiana'],
};

const DEFAULT_GUIDED_TOPICS = ['Semiologia cardiovascular', 'Farmacologia clínica', 'Emergências médicas', 'Diagnóstico diferencial'];

/* ─── Indicador de digitando ─── */
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted/60 backdrop-blur-sm px-5 py-3 rounded-2xl rounded-bl-sm border border-border/50 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.2s' }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.2s' }} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">Tutor está digitando...</span>
      </div>
    </div>
  );
}

/* ─── Componente principal ─── */
export default function TutorChat({ disciplina, mode = 'chat' }: TutorChatProps) {
  const [messages, setMessages] = useState<GeminiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isGuided = mode === 'guided';

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const suggestions = useMemo(() => {
    if (disciplina && DISCIPLINA_SUGGESTIONS[disciplina]) {
      return DISCIPLINA_SUGGESTIONS[disciplina];
    }
    return DEFAULT_SUGGESTIONS;
  }, [disciplina]);

  const guidedTopics = useMemo(() => {
    if (disciplina && GUIDED_TOPICS[disciplina]) {
      return GUIDED_TOPICS[disciplina];
    }
    return DEFAULT_GUIDED_TOPICS;
  }, [disciplina]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setError(null);
  };

  /* ─── Iniciar sessão guiada com um tema ─── */
  const handleStartGuided = async (topic: string) => {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const response = await startGuidedSession(disciplina, topic);
      setMessages([{ role: 'model', content: response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão guiada');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setError(null);
    const userMessage = text.trim();
    setInput('');

    const newMessages: GeminiMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await generateTutorResponse(userMessage, messages, disciplina, mode);
      setMessages((prev) => [...prev, { role: 'model', content: response }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar resposta do tutor');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => sendMessage(input);

  const handleSuggestionClick = (text: string) => sendMessage(text);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /* ─── Markdown prose classes ─── */
  const proseClasses = `prose prose-sm prose-invert max-w-none break-words
    [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-4 [&_h1]:mb-2
    [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-3 [&_h2]:mb-1.5
    [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-2.5 [&_h3]:mb-1
    [&_p]:text-sm [&_p]:text-foreground/90 [&_p]:leading-relaxed [&_p]:my-1.5
    [&_ul]:text-sm [&_ul]:my-1.5 [&_ul]:pl-4 [&_ul]:text-foreground/90
    [&_ol]:text-sm [&_ol]:my-1.5 [&_ol]:pl-4 [&_ol]:text-foreground/90
    [&_li]:my-0.5 [&_li]:text-foreground/90
    [&_strong]:text-foreground [&_strong]:font-semibold
    [&_em]:text-foreground/80
    [&_code]:text-xs [&_code]:bg-background/50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary
    [&_pre]:bg-background/50 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto
    [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-foreground/70 [&_blockquote]:italic
    [&_table]:text-xs [&_table]:w-full [&_table]:my-2
    [&_th]:bg-background/50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th]:border [&_th]:border-border/50
    [&_td]:px-2 [&_td]:py-1 [&_td]:text-foreground/90 [&_td]:border [&_td]:border-border/50
    [&_hr]:border-border/30 [&_hr]:my-3
    [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2`;

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className={`p-4 flex items-center justify-between shrink-0 ${
        isGuided
          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white'
          : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
      }`}>
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            {isGuided ? <GraduationCap className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            {isGuided ? 'Estudo Guiado' : 'FAMP Tutor IA'}
          </h2>
          <p className="text-sm opacity-90">
            {isGuided
              ? disciplina ? `Sessão socrática — ${disciplina}` : 'Sessão socrática'
              : disciplina ? `Ajuda com ${disciplina}` : 'Assistente de estudo'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewChat}
          disabled={loading || messages.length === 0}
          className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Chat</span>
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tela de boas-vindas */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isGuided ? 'bg-amber-500/10' : 'bg-primary/10'
              }`}>
                {isGuided
                  ? <GraduationCap className="w-8 h-8 text-amber-500" />
                  : <Sparkles className="w-8 h-8 text-primary" />}
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">
                {isGuided ? 'Estudo Guiado' : 'Bem-vindo ao FAMP Tutor IA'}
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                {isGuided
                  ? <>Escolha um tema abaixo e o tutor conduzirá uma sessão de perguntas para testar e aprofundar seu conhecimento{disciplina && <> em <strong>{disciplina}</strong></>}.</>
                  : <>Faça suas dúvidas sobre conceitos médicos e receba ajuda personalizada.{disciplina && <> Estou pronto para ajudar com <strong>{disciplina}</strong>.</>}</>}
              </p>
            </div>

            {/* Sugestões / Temas */}
            <div className="w-full max-w-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 text-center font-medium">
                {isGuided ? 'Escolha um tema para começar' : 'Sugestões para começar'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {isGuided
                  ? guidedTopics.map((topic, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleStartGuided(topic)}
                        className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-card/50 hover:bg-amber-500/5 hover:border-amber-500/30 transition-all duration-200 text-left group cursor-pointer"
                      >
                        <span className="text-amber-500/70 group-hover:text-amber-500 mt-0.5 shrink-0 transition-colors">
                          <GraduationCap className="w-4 h-4" />
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground leading-relaxed transition-colors">
                          {topic}
                        </span>
                      </button>
                    ))
                  : suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(s.text)}
                        className="flex items-start gap-2.5 p-3 rounded-lg border border-border/60 bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-left group cursor-pointer"
                      >
                        <span className="text-primary/70 group-hover:text-primary mt-0.5 shrink-0 transition-colors">
                          {s.icon}
                        </span>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground leading-relaxed transition-colors">
                          {s.text}
                        </span>
                      </button>
                    ))}
              </div>
            </div>
          </div>
        )}

        {/* Mensagens */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`relative group max-w-[85%] lg:max-w-[75%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted/60 backdrop-blur-sm text-foreground rounded-bl-sm border border-border/50'
              }`}
            >
              {/* Botão Copiar */}
              {msg.role === 'model' && (
                <button
                  onClick={() => handleCopy(msg.content, idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-background/60 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                  title={copiedIdx === idx ? 'Copiado!' : 'Copiar resposta'}
                >
                  {copiedIdx === idx ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              ) : (
                <div className={proseClasses}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Indicador de digitando */}
        {loading && <TypingIndicator />}

        {/* Erro */}
        {error && (
          <Card className="bg-destructive/10 border-destructive/30 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">Erro</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-card shrink-0">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={
              loading
                ? 'Aguarde a resposta...'
                : isGuided && messages.length === 0
                  ? 'Ou digite um tema personalizado...'
                  : isGuided
                    ? 'Digite sua resposta...'
                    : 'Digite sua dúvida...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={() => {
              if (isGuided && messages.length === 0 && input.trim()) {
                handleStartGuided(input.trim());
                setInput('');
              } else {
                handleSendMessage();
              }
            }}
            disabled={loading || !input.trim()}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
