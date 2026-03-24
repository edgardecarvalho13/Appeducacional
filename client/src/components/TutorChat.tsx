import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, AlertCircle, MessageSquarePlus, Sparkles, BookOpen, Stethoscope, Brain, Pill } from 'lucide-react';
import { generateTutorResponse, GeminiMessage } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TutorChatProps {
  disciplina?: string;
}

/* ─── Sugestões de perguntas por disciplina ─── */
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
};

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
export default function TutorChat({ disciplina }: TutorChatProps) {
  const [messages, setMessages] = useState<GeminiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (disciplina && DISCIPLINA_SUGGESTIONS[disciplina]) {
      return DISCIPLINA_SUGGESTIONS[disciplina];
    }
    return DEFAULT_SUGGESTIONS;
  }, [disciplina]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setError(null);
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
      const response = await generateTutorResponse(userMessage, messages, disciplina);
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

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            FAMP Tutor IA
          </h2>
          <p className="text-sm opacity-90">
            {disciplina ? `Ajuda com ${disciplina}` : 'Assistente de estudo'}
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
        {/* Tela de boas-vindas com sugestões */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">Bem-vindo ao FAMP Tutor IA</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Faça suas dúvidas sobre conceitos médicos e receba ajuda personalizada.
                {disciplina && <> Estou pronto para ajudar com <strong>{disciplina}</strong>.</>}
              </p>
            </div>

            {/* Sugestões de perguntas */}
            <div className="w-full max-w-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 text-center font-medium">
                Sugestões para começar
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((s, idx) => (
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
              className={`max-w-[85%] lg:max-w-[75%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted/60 backdrop-blur-sm text-foreground rounded-bl-sm border border-border/50'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none break-words
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
                  [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
                ">
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
            placeholder={loading ? 'Aguarde a resposta...' : 'Digite sua dúvida...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
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
