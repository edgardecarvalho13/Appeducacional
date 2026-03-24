import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!API_KEY) {
  console.warn('Gemini API key not configured. Tutor IA will not work.');
}

const client = new GoogleGenAI({
  apiKey: API_KEY,
});

export interface GeminiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateTutorResponse(
  userMessage: string,
  conversationHistory: GeminiMessage[] = [],
  disciplina?: string
): Promise<string> {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    // Construir o contexto médico/educacional
    const systemPrompt = `Você é um tutor IA especializado em educação médica para o FAMP Academy. 
${disciplina ? `Você está ajudando um aluno com a disciplina: ${disciplina}.` : ''}

Suas responsabilidades:
1. Responder dúvidas sobre conceitos médicos de forma clara e didática
2. Usar exemplos clínicos quando apropriado
3. Citar diretrizes e sociedades médicas quando relevante
4. Ser conciso mas completo
5. Encorajar o pensamento crítico
6. Sugerir recursos adicionais quando necessário

Mantenha um tom profissional, acessível e motivador.`;

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

    // Chamar a API do Gemini usando o método models
    const response = await client.models.generateContent({
      model: 'models/gemini-2.5-flash',
      contents: messages,
    } as any);

    const textContent = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Empty response from Gemini');
    }

    return textContent;
  } catch (error) {
    console.error('Error generating tutor response:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate response'
    );
  }
}
