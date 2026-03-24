import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('Gemini API key not configured. Tutor IA will not work.');
}

const client = new GoogleGenAI({
  apiKey: API_KEY,
});

export interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

export type TutorMode = 'chat' | 'guided';

function buildSystemPrompt(disciplina?: string, mode: TutorMode = 'chat'): string {
  if (mode === 'guided') {
    return `Você é um tutor socrático especializado em educação médica para o FAMP Academy.
${disciplina ? `A disciplina atual é: ${disciplina}.` : ''}

Seu papel é CONDUZIR uma sessão de estudo guiado usando o método socrático. Você NÃO deve simplesmente dar respostas — em vez disso, deve:

1. **Fazer perguntas ao aluno** para testar e aprofundar o conhecimento dele
2. **Começar com perguntas mais simples** e ir aumentando a complexidade gradualmente
3. **Avaliar as respostas do aluno** de forma construtiva — elogie acertos, corrija erros com gentileza
4. **Dar dicas progressivas** quando o aluno errar ou não souber — nunca dê a resposta direta imediatamente
5. **Usar casos clínicos curtos** como contexto para as perguntas quando apropriado
6. **Após 3-4 perguntas sobre um subtema**, faça um breve resumo do que foi discutido e avance para o próximo subtema
7. **Manter um tom motivador e encorajador** — celebre o progresso do aluno

FORMATO DA SESSÃO:
- Comece se apresentando brevemente e perguntando qual tema o aluno quer estudar (se ele não especificou)
- Faça UMA pergunta por vez — espere a resposta antes de continuar
- Após a resposta do aluno, dê feedback (correto/parcial/incorreto) e explique brevemente
- Em seguida, faça a próxima pergunta, conectando com a anterior
- Use emojis com moderação para tornar a interação mais leve (✅ para acerto, 💡 para dica, 🤔 para reflexão)

IMPORTANTE: Você é quem faz as perguntas, não o aluno. Conduza ativamente a sessão.`;
  }

  // Modo chat livre (padrão)
  return `Você é um tutor IA especializado em educação médica para o FAMP Academy. 
${disciplina ? `Você está ajudando um aluno com a disciplina: ${disciplina}.` : ''}

Suas responsabilidades:
1. Responder dúvidas sobre conceitos médicos de forma clara e didática
2. Usar exemplos clínicos quando apropriado
3. Citar diretrizes e sociedades médicas quando relevante
4. Ser conciso mas completo
5. Encorajar o pensamento crítico
6. Sugerir recursos adicionais quando necessário

Mantenha um tom profissional, acessível e motivador.`;
}

export async function generateTutorResponse(
  userMessage: string,
  conversationHistory: GeminiMessage[] = [],
  disciplina?: string,
  mode: TutorMode = 'chat'
): Promise<string> {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const systemPrompt = buildSystemPrompt(disciplina, mode);

    // Preparar histórico da conversa para o modelo
    const messages = conversationHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    // Adicionar a nova mensagem do usuário
    messages.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    // Chamar a API do Gemini
    const response = await client.models.generateContent({
      model: 'models/gemini-2.5-flash',
      contents: messages,
      config: {
        systemInstruction: systemPrompt,
      },
    } as any);

    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Empty response from Gemini');
    }

    return textContent;
  } catch (error) {
    console.error('Error generating tutor response:', error);
    const errMsg = error instanceof Error ? error.message : String(error);

    // Mensagens amigáveis para erros comuns
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
      throw new Error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.');
    }
    if (errMsg.includes('API key')) {
      throw new Error('Chave da API não configurada. Entre em contato com o suporte.');
    }
    if (errMsg.includes('network') || errMsg.includes('fetch')) {
      throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
    }

    throw new Error('Ocorreu um erro ao gerar a resposta. Tente novamente.');
  }
}

/**
 * Inicia uma sessão de estudo guiado — envia a primeira mensagem do tutor
 * sem que o aluno precise digitar nada.
 */
export async function startGuidedSession(
  disciplina?: string,
  topic?: string
): Promise<string> {
  const prompt = topic
    ? `O aluno quer estudar o tema: "${topic}" ${disciplina ? `na disciplina ${disciplina}` : ''}. Comece a sessão de estudo guiado fazendo a primeira pergunta sobre esse tema.`
    : `Comece uma sessão de estudo guiado ${disciplina ? `sobre ${disciplina}` : 'sobre um tema médico relevante'}. Apresente-se brevemente e faça a primeira pergunta.`;

  return generateTutorResponse(prompt, [], disciplina, 'guided');
}
